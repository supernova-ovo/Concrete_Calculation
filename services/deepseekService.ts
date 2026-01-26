import { MixDesignResult, MixGrade, SlumpType, SeasonType, RawMaterialsData } from "../types";

// 后端工作流API配置
const WORKFLOW_API_URL = '/jetopcms/ks/DifyWorkflowHandler.ashx';
const WORKFLOW_ID = 'cba3740e-cf84-261d-ed20-6768da4948dc';

// 生产环境检测
const isProduction = import.meta.env?.PROD || false;

// 通用的工作流API调用函数
const callWorkflowAPI = async (query: string, inputs: any = {}): Promise<MixDesignResult> => {
  if (!isProduction) console.log("🔄 开始调用后端工作流API...");

  const response = await fetch(WORKFLOW_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflow_id: WORKFLOW_ID,
      inputs: inputs,
      query: query,
      stream: false, // 关闭流式输出，等待完整响应
      conversation_id: '', // 可以为空
      files: [],
      http_method: "POST"
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    let errorMessage = `Workflow API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorData);
      errorMessage += ` - ${errorJson.error?.message || errorData}`;
    } catch {
      errorMessage += ` - ${errorData}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // 根据工作流API的响应格式提取结果
  // 假设工作流返回的结果在 data.output 或类似字段中
  let resultText = data.output || data.result || data.response || JSON.stringify(data);

  // 如果返回的是对象，尝试找到包含JSON的字段
  if (typeof data === 'object' && !resultText.includes('{')) {
    // 尝试常见的字段名
    resultText = data.content || data.message || data.answer || JSON.stringify(data);
  }

  let result: MixDesignResult;
  try {
    result = JSON.parse(resultText) as MixDesignResult;
  } catch (parseError) {
    if (!isProduction) console.error("JSON解析失败:", resultText);
    throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : "未知错误"}`);
  }

  // 验证必需字段
  if (!result.cement || !result.water || !result.sand || !result.stone) {
    throw new Error("Incomplete response from Workflow API - 缺少必需字段");
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
    // 构建inputs参数
    const inputs = {
      designType: 'simple',
      grade: grade,
      slump: slump,
      maxAggregateSize: maxAggregateSize,
      useFlyAsh: useFlyAsh,
      region: region || "通用地区",
      season: season
    };

    const query = "请根据提供的简单参数计算混凝土配合比";

    return await callWorkflowAPI(query, inputs);
  } catch (error) {
    if (!isProduction) console.error("Workflow Mix Design Error:", error);
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
    if (!isProduction) console.log("🔄 开始调用后端工作流API（详细参数模式）...");

    // 构建完整的inputs参数，包含所有原材料详细参数
    const inputs = {
      designType: 'detailed',
      // 设计参数
      designParameters: {
        strengthGrade: strengthGrade,
        slump: slump,
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

    const query = "请根据提供的详细原材料参数计算混凝土配合比";

    return await callWorkflowAPI(query, inputs);
  } catch (error) {
    if (!isProduction) console.error("Workflow Detailed Mix Design Error:", error);
    throw error;
  }
};

