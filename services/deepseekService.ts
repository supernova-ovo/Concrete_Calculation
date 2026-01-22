import { MixDesignResult, MixGrade, SlumpType, SeasonType, RawMaterialsData } from "../types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// Vite 的 define 会在编译时替换这些值
// 注意：这里直接使用 process.env，Vite 会在构建时替换为实际值
declare const process: {
  env: {
    DEEPSEEK_API_KEY?: string;
    API_KEY?: string;
  };
};

// 直接访问，Vite define 会在编译时替换
const API_KEY = (process.env.DEEPSEEK_API_KEY || process.env.API_KEY || '').trim();

// 统一的system message
const SYSTEM_MESSAGE = `你是一位专业的混凝土配合比设计专家，擅长根据中国国家标准和地方标准进行精确的配合比计算。请始终以JSON格式返回结果。

返回的JSON必须包含以下字段：
- cement: 水泥用量(kg/m3, 数字)
- water: 水用量(kg/m3, 数字)
- sand: 砂用量(kg/m3, 数字)
- stone: 石用量(kg/m3, 数字)
- admixture: 外加剂用量(kg/m3, 数字)
- flyAsh: 粉煤灰用量(kg/m3, 数字，如无则为0)
- slag: 矿渣用量(kg/m3, 数字，如无则为0)
- wcr: 水胶比(小数)
- sandRatio: 砂率(百分比数字)
- strengthGrade: 强度等级(字符串)
- notes: 设计说明(中文字符串)
- referencedStandards: 参考标准列表(字符串数组)`;

// 通用的API调用函数
const callDeepSeekAPI = async (userPrompt: string): Promise<MixDesignResult> => {
  if (!API_KEY) {
    console.error("❌ API密钥未配置！请检查 .env.local 文件");
    throw new Error("DeepSeek API key is not configured. Please set DEEPSEEK_API_KEY in your .env.local file.");
  }

  console.log("🔑 开始调用 DeepSeek API...");

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: SYSTEM_MESSAGE
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    let errorMessage = `DeepSeek API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorData);
      errorMessage += ` - ${errorJson.error?.message || errorData}`;
    } catch {
      errorMessage += ` - ${errorData}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No response content from DeepSeek API");
  }

  let result: MixDesignResult;
  try {
    result = JSON.parse(text) as MixDesignResult;
  } catch (parseError) {
    console.error("JSON解析失败:", text);
    throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : "未知错误"}`);
  }

  // 验证必需字段
  if (!result.cement || !result.water || !result.sand || !result.stone) {
    throw new Error("Incomplete response from DeepSeek API - 缺少必需字段");
  }

  return result;
};

export const getIntelligentMixRecommendation = async (
  grade: MixGrade,
  slump: SlumpType,
  maxAggregateSize: number,
  useFlyAsh: boolean,
  region: string,
  season: SeasonType
): Promise<MixDesignResult> => {
  try {
    const prompt = `
      作为一名资深混凝土配合比设计专家，请为我设计一份混凝土配合比。
      设计参数如下:
      - 强度等级: ${grade}
      - 坍落度: ${slump}
      - 最大粒径: ${maxAggregateSize}mm
      - 是否使用粉煤灰: ${useFlyAsh ? "是" : "否"}
      - 工程所在地: ${region || "通用地区"} (请务必优先查找并参考该地区的"DB"地方标准，如果无特定地标则参考国家标准)
      - 施工季节: ${season} (请重点考虑该季节温度对混凝土坍落度损失、凝结时间及早期强度的影响)

      任务要求：
      1. 依据中国现行标准（JGJ 55及相关地方标准）计算每立方米材料用量（kg）。
      2. 必须明确列出你参考的具体标准号和名称（referencedStandards字段），例如："JGJ 55-2011 普通混凝土配合比设计规程", "DB11/T xxx 北京市地方标准"等。
      3. 在 notes 中简述设计思路。
      4. 请严格按照JSON格式返回，确保所有必需字段都存在。
    `;

    return await callDeepSeekAPI(prompt);
  } catch (error) {
    console.error("DeepSeek Mix Design Error:", error);
    throw error;
  }
};

// 根据详细录入参数进行AI智能推荐
export const getDetailedIntelligentMixRecommendation = async (
  rawMaterials: RawMaterialsData,
  strengthGrade: string,
  slump: number,
  region: string,
  season: SeasonType,
  concreteDensity?: number
): Promise<MixDesignResult> => {
  try {
    console.log("🔑 开始调用 DeepSeek API（详细参数模式）...");

    // 构建详细的参数JSON对象
    const detailedParams = {
      // 设计参数
      designParameters: {
        strengthGrade: strengthGrade,
        slump: `${slump}mm`,
        concreteDensity: concreteDensity || 2400,
        region: region || "通用地区",
        season: season
      },
      // 水泥参数
      cement: {
        manufacturer: rawMaterials.cement.manufacturer || "未指定",
        type: rawMaterials.cement.type || "未指定",
        grade: rawMaterials.cement.grade || "未指定",
        strength28d: rawMaterials.cement.strength28d || "未指定",
        initialSettingTime: rawMaterials.cement.initialSettingTime || "未指定",
        finalSettingTime: rawMaterials.cement.finalSettingTime || "未指定",
        soundness: rawMaterials.cement.soundness || "未指定",
        standardConsistency: rawMaterials.cement.standardConsistency || "未指定"
      },
      // 细骨料参数
      fineAggregate: {
        manufacturer: rawMaterials.fineAggregate.manufacturer || "未指定",
        type: rawMaterials.fineAggregate.type || "未指定",
        grade: rawMaterials.fineAggregate.grade || "未指定",
        quality: rawMaterials.fineAggregate.quality || "未指定",
        finenessModulus: rawMaterials.fineAggregate.finenessModulus || "未指定",
        clayContent: rawMaterials.fineAggregate.clayContent || "未指定",
        clayLumpContent: rawMaterials.fineAggregate.clayLumpContent || "未指定",
        moistureContent: rawMaterials.fineAggregate.moistureContent || "未指定",
        bulkDensity: rawMaterials.fineAggregate.bulkDensity || "未指定",
        apparentDensity: rawMaterials.fineAggregate.apparentDensity || "未指定",
        soundness: rawMaterials.fineAggregate.soundness || "未指定"
      },
      // 粗骨料参数
      coarseAggregate: {
        manufacturer: rawMaterials.coarseAggregate.manufacturer || "未指定",
        type: rawMaterials.coarseAggregate.type || "未指定",
        gradationType: rawMaterials.coarseAggregate.gradationType || "未指定",
        nominalSize: rawMaterials.coarseAggregate.nominalSize || "未指定",
        maxNominalSize: rawMaterials.coarseAggregate.maxNominalSize || "未指定",
        clayContent: rawMaterials.coarseAggregate.clayContent || "未指定",
        clayLumpContent: rawMaterials.coarseAggregate.clayLumpContent || "未指定",
        moistureContent: rawMaterials.coarseAggregate.moistureContent || "未指定",
        bulkDensity: rawMaterials.coarseAggregate.bulkDensity || "未指定",
        apparentDensity: rawMaterials.coarseAggregate.apparentDensity || "未指定",
        crushingIndex: rawMaterials.coarseAggregate.crushingIndex || "未指定",
        flakyContent: rawMaterials.coarseAggregate.flakyContent || "未指定"
      },
      // 粉煤灰参数
      flyAsh: {
        manufacturer: rawMaterials.flyAsh.manufacturer || "未指定",
        type: rawMaterials.flyAsh.type || "未指定",
        grade: rawMaterials.flyAsh.grade || "未指定",
        strengthActivityIndex: rawMaterials.flyAsh.strengthActivityIndex || "未指定",
        waterDemandRatio: rawMaterials.flyAsh.waterDemandRatio || "未指定",
        lossOnIgnition: rawMaterials.flyAsh.lossOnIgnition || "未指定",
        moistureContent: rawMaterials.flyAsh.moistureContent || "未指定",
        fineness: rawMaterials.flyAsh.fineness || "未指定",
        dosage: rawMaterials.flyAsh.dosage || "未指定"
      },
      // 矿粉参数
      slagPowder: {
        manufacturer: rawMaterials.slagPowder.manufacturer || "未指定",
        grade: rawMaterials.slagPowder.grade || "未指定",
        activityGrade: rawMaterials.slagPowder.activityGrade || "未指定",
        strengthActivityIndex: rawMaterials.slagPowder.strengthActivityIndex || "未指定",
        specificSurfaceArea: rawMaterials.slagPowder.specificSurfaceArea || "未指定",
        waterDemandRatio: rawMaterials.slagPowder.waterDemandRatio || "未指定",
        lossOnIgnition: rawMaterials.slagPowder.lossOnIgnition || "未指定",
        fluidityRatio: rawMaterials.slagPowder.fluidityRatio || "未指定",
        dosage: rawMaterials.slagPowder.dosage || "未指定"
      },
      // 减水剂参数
      waterReducer: {
        manufacturer: rawMaterials.waterReducer.manufacturer || "未指定",
        type: rawMaterials.waterReducer.type || "未指定",
        category: rawMaterials.waterReducer.category || "未指定",
        waterReductionRate: rawMaterials.waterReducer.waterReductionRate || "未指定",
        dosage: rawMaterials.waterReducer.dosage || "未指定",
        solidContent: rawMaterials.waterReducer.solidContent || "未指定",
        slumpRetention30min: rawMaterials.waterReducer.slumpRetention30min || "未指定",
        slumpRetention60min: rawMaterials.waterReducer.slumpRetention60min || "未指定",
        settingTimeDifference: rawMaterials.waterReducer.settingTimeDifference || "未指定"
      },
      // 其他外加剂参数
      otherAdmixture: {
        manufacturer: rawMaterials.otherAdmixture.manufacturer || "未指定",
        type: rawMaterials.otherAdmixture.type || "未指定",
        model: rawMaterials.otherAdmixture.model || "未指定",
        dosage: rawMaterials.otherAdmixture.dosage || "未指定",
        mainFunctionIndex: rawMaterials.otherAdmixture.mainFunctionIndex || "未指定",
        applicableTempRange: rawMaterials.otherAdmixture.applicableTempRange || "未指定"
      },
      // 其他掺合料参数
      otherAdditive: {
        manufacturer: rawMaterials.otherAdditive.manufacturer || "未指定",
        type: rawMaterials.otherAdditive.type || "未指定",
        specification: rawMaterials.otherAdditive.specification || "未指定",
        dosage: rawMaterials.otherAdditive.dosage || "未指定",
        mainPerformanceIndex: rawMaterials.otherAdditive.mainPerformanceIndex || "未指定",
        applicableRange: rawMaterials.otherAdditive.applicableRange || "未指定"
      }
    };

    const paramsJson = JSON.stringify(detailedParams, null, 2);

    const prompt = `
作为一名资深混凝土配合比设计专家，请根据以下详细的原材料参数和设计参数，为我设计一份精确的混凝土配合比。

以下是完整的参数信息（JSON格式）：
${paramsJson}

任务要求：
1. 请仔细分析所有提供的原材料参数，包括水泥、细骨料、粗骨料、粉煤灰、矿粉、减水剂等的详细性能指标。
2. 依据中国现行标准（JGJ 55及相关地方标准）进行精确计算，每立方米材料用量（kg）。
3. 必须明确列出你参考的具体标准号和名称（referencedStandards字段），例如："JGJ 55-2011 普通混凝土配合比设计规程", "DB11/T xxx 北京市地方标准"等。
4. 在计算过程中，请充分考虑：
   - 水泥的28天强度和品种等级
   - 细骨料的细度模数、含泥量等指标
   - 粗骨料的最大公称粒径、级配类型等
   - 粉煤灰和矿粉的等级、掺量及活性指数
   - 减水剂的减水率、掺量及保坍性能
   - 施工季节对混凝土性能的影响
   - 工程所在地的地方标准要求
5. 在 notes 中详细说明设计思路，包括：
   - 如何根据原材料参数确定水胶比
   - 如何确定用水量和胶凝材料用量
   - 如何确定砂率和骨料用量
   - 如何考虑外加剂的影响
   - 如何根据季节和地区特点进行调整
6. 请严格按照JSON格式返回，确保所有必需字段都存在。
7. 对于未指定的参数（显示为"未指定"），请根据标准规范采用合理的默认值或经验值。
    `;

    return await callDeepSeekAPI(prompt);
  } catch (error) {
    console.error("DeepSeek Detailed Mix Design Error:", error);
    throw error;
  }
};

