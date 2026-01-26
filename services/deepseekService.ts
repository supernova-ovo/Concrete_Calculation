import { MixDesignResult, MixGrade, SlumpType, SeasonType, RawMaterialsData } from "../types";

// 生产环境检测
const isProduction = import.meta.env?.PROD || false;

// 后端工作流API配置
// 生产环境配置
const PROD_WORKFLOW_API_URL = '/jetopcms/KS/DifyWorkflowHandler.ashx';
const PROD_WORKFLOW_ID = 'cba3740e-cf84-261d-ed20-6768da4948dc';

// 测试环境配置
const TEST_WORKFLOW_API_URL = 'https://test1.tepc.cn/jetopcms/KS/DifyWorkflowHandler.ashx';
const TEST_WORKFLOW_ID = 'ff278cd7-2e65-1d38-60f7-a657e1f31099';

// 根据环境自动选择配置
const WORKFLOW_API_URL = isProduction ? PROD_WORKFLOW_API_URL : TEST_WORKFLOW_API_URL;
const WORKFLOW_ID = isProduction ? PROD_WORKFLOW_ID : TEST_WORKFLOW_ID;

// 通用的工作流API调用函数
const callWorkflowAPI = async (query: string, inputs: any = {}): Promise<MixDesignResult> => {
  if (!isProduction) {
    console.log("🔄 开始调用后端工作流API...");
    console.log(`📍 当前环境: ${isProduction ? '生产环境' : '测试环境'}`);
    console.log(`📍 API URL: ${WORKFLOW_API_URL}`);
    console.log(`📍 Workflow ID: ${WORKFLOW_ID}`);
  }

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

  if (!isProduction) {
    console.log("📥 API原始响应数据:", JSON.stringify(data, null, 2));
  }

  // 根据工作流API的响应格式提取结果
  let result: MixDesignResult;
  
  // 辅助函数：从字符串中提取JSON（处理markdown代码块格式和think标签）
  const extractJSONFromString = (text: string): string | null => {
    if (!text || typeof text !== 'string') return null;
    
    // 尝试直接解析
    try {
      JSON.parse(text);
      return text;
    } catch {
      // 继续尝试提取
    }
    
    // 移除think标签及其内容
    let cleanedText = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // 尝试提取markdown代码块中的JSON
    const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      const jsonStr = jsonBlockMatch[1].trim();
      try {
        JSON.parse(jsonStr);
        return jsonStr;
      } catch {
        // 继续尝试其他方法
      }
    }
    
    // 尝试提取第一个完整的JSON对象（使用非贪婪匹配，但确保匹配完整的对象）
    // 先尝试找到所有可能的JSON对象
    const jsonMatches = cleanedText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      // 尝试解析每个匹配的JSON对象，返回第一个有效的
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match.trim());
          // 验证是否包含必需的字段
          if (parsed && typeof parsed === 'object' && ('cement' in parsed || 'water' in parsed)) {
            return match.trim();
          }
        } catch {
          continue;
        }
      }
    }
    
    // 最后尝试：使用更宽松的匹配，找到最大的JSON对象
    const lastJsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (lastJsonMatch && lastJsonMatch[0]) {
      try {
        const parsed = JSON.parse(lastJsonMatch[0].trim());
        if (parsed && typeof parsed === 'object') {
          return lastJsonMatch[0].trim();
        }
      } catch {
        // 如果解析失败，返回null
      }
    }
    
    return null;
  };
  
  // 情况1: 如果 data 本身就已经是结果对象（包含 cement, water, sand, stone 等字段）
  if (data && typeof data === 'object' && 'cement' in data && 'water' in data && 'sand' in data && 'stone' in data) {
    result = data as MixDesignResult;
    if (!isProduction) {
      console.log("✅ 检测到直接返回的结果对象，直接使用");
    }
  }
  // 情况2: 结果在 data.data.outputs.result 中（Dify工作流格式）
  else if (data.data && data.data.outputs && data.data.outputs.result) {
    const resultText = data.data.outputs.result;
    if (typeof resultText === 'object') {
      result = resultText as MixDesignResult;
    } else if (typeof resultText === 'string') {
      // 从字符串中提取JSON
      const jsonString = extractJSONFromString(resultText);
      if (jsonString) {
        try {
          result = JSON.parse(jsonString) as MixDesignResult;
          if (!isProduction) {
            console.log("✅ 从 data.data.outputs.result 中提取并解析JSON成功");
          }
        } catch (parseError) {
          if (!isProduction) {
            console.error("❌ JSON解析失败");
            console.error("原始响应数据:", data);
            console.error("提取的JSON字符串:", jsonString);
          }
          throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : "未知错误"}`);
        }
      } else {
        throw new Error("无法从响应中提取有效的JSON数据");
      }
    } else {
      throw new Error("无法解析API响应：data.data.outputs.result 字段格式不正确");
    }
  }
  // 情况3: 结果在嵌套字段中（data.output, data.result, data.response 等）
  else if (data.output || data.result || data.response) {
    const resultText = data.output || data.result || data.response;
    if (typeof resultText === 'object') {
      result = resultText as MixDesignResult;
    } else if (typeof resultText === 'string') {
      const jsonString = extractJSONFromString(resultText);
      if (jsonString) {
        try {
          result = JSON.parse(jsonString) as MixDesignResult;
        } catch (parseError) {
          if (!isProduction) {
            console.error("❌ JSON解析失败");
            console.error("原始响应数据:", data);
            console.error("尝试解析的文本:", resultText);
          }
          throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : "未知错误"}`);
        }
      } else {
        throw new Error("无法从响应中提取有效的JSON数据");
      }
    } else {
      throw new Error("无法解析API响应：结果字段格式不正确");
    }
  }
  // 情况4: 结果在其他字段中（data.content, data.message, data.answer 等）
  else if (data.content || data.message || data.answer) {
    const resultText = data.content || data.message || data.answer;
    if (typeof resultText === 'object') {
      result = resultText as MixDesignResult;
    } else if (typeof resultText === 'string') {
      const jsonString = extractJSONFromString(resultText);
      if (jsonString) {
        try {
          result = JSON.parse(jsonString) as MixDesignResult;
        } catch (parseError) {
          if (!isProduction) {
            console.error("❌ JSON解析失败");
            console.error("原始响应数据:", data);
            console.error("尝试解析的文本:", resultText);
          }
          throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : "未知错误"}`);
        }
      } else {
        throw new Error("无法从响应中提取有效的JSON数据");
      }
    } else {
      throw new Error("无法解析API响应：结果字段格式不正确");
    }
  }
  // 情况5: 无法识别响应格式
  else {
    if (!isProduction) {
      console.error("❌ 无法识别API响应格式");
      console.error("原始响应数据:", data);
      console.error("响应数据的键:", Object.keys(data));
      if (data.data) {
        console.error("data.data 的键:", Object.keys(data.data));
        if (data.data.outputs) {
          console.error("data.data.outputs 的键:", Object.keys(data.data.outputs));
        }
      }
    }
    throw new Error(`无法解析API响应：未找到有效的结果字段。响应数据键: ${Object.keys(data).join(', ')}`);
  }

  if (!isProduction) {
    console.log("📥 解析后的结果对象:", JSON.stringify(result, null, 2));
  }

  // 验证必需字段，提供详细的错误信息
  const missingFields: string[] = [];
  if (!result.cement && result.cement !== 0) missingFields.push('cement');
  if (!result.water && result.water !== 0) missingFields.push('water');
  if (!result.sand && result.sand !== 0) missingFields.push('sand');
  if (!result.stone && result.stone !== 0) missingFields.push('stone');

  if (missingFields.length > 0) {
    const errorDetails = {
      missingFields: missingFields,
      receivedFields: Object.keys(result),
      receivedValues: {
        cement: result.cement,
        water: result.water,
        sand: result.sand,
        stone: result.stone
      },
      rawResponse: data
    };
    
    if (!isProduction) {
      console.error("❌ 缺少必需字段错误详情:", errorDetails);
    }
    
    throw new Error(`Incomplete response from Workflow API - 缺少必需字段: ${missingFields.join(', ')}。接收到的字段: ${Object.keys(result).join(', ')}`);
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
    // 构建inputs参数，使用input_json作为属性名，值为JSON字符串
    const inputData = {
      designType: 'simple',
      grade: grade,
      slump: slump,
      maxAggregateSize: maxAggregateSize,
      useFlyAsh: useFlyAsh,
      region: region || "通用地区",
      season: season
    };

    // 确保input_json属性值为字符串类型的JSON
    const inputs: { input_json: string } = {
      input_json: JSON.stringify(inputData)
    };

    if (!isProduction) {
      console.log("📤 发送的inputs参数结构:", JSON.stringify(inputs, null, 2));
      console.log("📤 input_json的值:", inputs.input_json);
    }

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
    const inputData = {
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

    // 使用input_json作为属性名，值为JSON字符串
    const inputs: { input_json: string } = {
      input_json: JSON.stringify(inputData)
    };

    if (!isProduction) {
      console.log("📤 发送的inputs参数结构（详细模式）:", JSON.stringify(inputs, null, 2));
      console.log("📤 input_json的值:", inputs.input_json);
    }

    const query = "请根据提供的详细原材料参数计算混凝土配合比";

    return await callWorkflowAPI(query, inputs);
  } catch (error) {
    if (!isProduction) console.error("Workflow Detailed Mix Design Error:", error);
    throw error;
  }
};

