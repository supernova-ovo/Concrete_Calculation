import React, { useState, useEffect } from 'react';
import { BrainCircuit, Save, History, Trash2, Clock, Upload, MapPin, Thermometer, BookOpen, Calculator, ArrowDownCircle, ChevronRight, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, Button, Select, Input } from '../components/UIComponents';
import { RawMaterialsInput } from '../components/RawMaterialsInput';
import { MixGrade, SlumpType, MixDesignResult, MixHistoryItem, SeasonType, RawMaterialsData, FlyAshGrade, SlagPowderGrade } from '../types';
import { getIntelligentMixRecommendation, getDetailedIntelligentMixRecommendation } from '../services/deepseekService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { calculateMixDesign, MixDesignInput, getWaterDemand, getFlyAshFactor, getSlagPowderFactor } from '../utils/mixDesignCalculator';

// List of major regions in China for dropdown
const REGIONS = [
  '通用地区', '北京', '上海', '天津', '重庆',
  '河北', '山西', '辽宁', '吉林', '黑龙江',
  '江苏', '浙江', '安徽', '福建', '江西',
  '山东', '河南', '湖北', '湖南', '广东',
  '海南', '四川', '贵州', '云南', '陕西',
  '甘肃', '青海', '内蒙古', '广西', '西藏',
  '宁夏', '新疆'
];

export const MixCalculator: React.FC = () => {
  const [mode, setMode] = useState<'AI' | 'STD_SIMPLE' | 'STD_DETAIL'>('STD_SIMPLE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MixDesignResult | null>(null);
  const [stdResultDetails, setStdResultDetails] = useState<any>(null);
  const [history, setHistory] = useState<MixHistoryItem[]>([]);
  const [needsRecalculation, setNeedsRecalculation] = useState(false);
  const [lastCalculationParams, setLastCalculationParams] = useState<any>(null);
  const [resultCalculationMode, setResultCalculationMode] = useState<'AI' | 'STD_SIMPLE' | 'STD_DETAIL' | null>(null);

  // AI Mode Form Data
  const [aiForm, setAiForm] = useState({
    grade: MixGrade.C30,
    slump: SlumpType.PUMP,
    maxSize: 20,
    flyAsh: true,
    region: '北京',
    season: SeasonType.STANDARD
  });

  // Standard Mode Form Data
  const [stdForm, setStdForm] = useState({
    gradeStr: 'C40',
    sigma: 5.0, // Standard Deviation
    density: 2400, // Concrete Density
    cementStrength: 49.3, // Measured 28d strength
    flyAshFactor: 0.95, // Gamma f
    slagFactor: 1.0, // Gamma s
    aggType: 'CRUSHED', // CRUSHED or GRAVEL
    alphaA: 0.53,
    alphaB: 0.20,
    waterBase: 235, // Water without admixture
    waterRedRate: 30, // %
    admDosage: 2.0, // %
    faDosage: 10, // %
    slagDosage: 20, // %
    flyAshGrade: '', // 粉煤灰等级（用于自动计算系数）
    slagPowderGrade: '', // 矿粉等级（用于自动计算系数）
    sandRatio: 41, // %
    designWCR: '', // Optional override
    slump: 180, // 坍落度 (mm)
    region: '北京', // 工程所在地（用于AI计算）
    season: SeasonType.STANDARD, // 施工季节（用于AI计算）
  });

  // 原材料数据
  const [rawMaterials, setRawMaterials] = useState<RawMaterialsData>({
    cement: {
      manufacturer: '',
      type: '',
      grade: '',
      strength28d: '',
      initialSettingTime: '',
      finalSettingTime: '',
      soundness: '',
      standardConsistency: ''
    },
    fineAggregate: {
      manufacturer: '',
      type: '',
      grade: '',
      quality: '',
      finenessModulus: '',
      clayContent: '',
      clayLumpContent: '',
      moistureContent: '',
      bulkDensity: '',
      apparentDensity: '',
      soundness: ''
    },
    coarseAggregate: {
      manufacturer: '',
      type: '',
      gradationType: '',
      nominalSize: '',
      maxNominalSize: '',
      clayContent: '',
      clayLumpContent: '',
      moistureContent: '',
      bulkDensity: '',
      apparentDensity: '',
      crushingIndex: '',
      flakyContent: ''
    },
    flyAsh: {
      manufacturer: '',
      type: '',
      grade: '',
      strengthActivityIndex: '',
      waterDemandRatio: '',
      lossOnIgnition: '',
      moistureContent: '',
      fineness: '',
      dosage: ''
    },
    slagPowder: {
      manufacturer: '',
      grade: '',
      activityGrade: '',
      strengthActivityIndex: '',
      specificSurfaceArea: '',
      waterDemandRatio: '',
      lossOnIgnition: '',
      fluidityRatio: '',
      dosage: ''
    },
    waterReducer: {
      manufacturer: '',
      type: '',
      category: '',
      waterReductionRate: '',
      dosage: '',
      solidContent: '',
      slumpRetention30min: '',
      slumpRetention60min: '',
      settingTimeDifference: ''
    },
    otherAdmixture: {
      manufacturer: '',
      type: '',
      model: '',
      dosage: '',
      mainFunctionIndex: '',
      applicableTempRange: ''
    },
    otherAdditive: {
      manufacturer: '',
      type: '',
      specification: '',
      dosage: '',
      mainPerformanceIndex: '',
      applicableRange: ''
    }
  });

  useEffect(() => {
    if (stdForm.aggType === 'CRUSHED') {
      setStdForm(prev => ({ ...prev, alphaA: 0.53, alphaB: 0.20 }));
    } else {
      setStdForm(prev => ({ ...prev, alphaA: 0.46, alphaB: 0.07 }));
    }
  }, [stdForm.aggType]);

  // 简化录入模式下：当粉煤灰比例或等级改变时，自动计算粉煤灰系数
  useEffect(() => {
    if (mode === 'STD_SIMPLE' && stdForm.flyAshGrade && stdForm.faDosage > 0) {
      const flyAshFactor = getFlyAshFactor(stdForm.flyAshGrade, stdForm.faDosage);
      setStdForm(prev => ({
        ...prev,
        flyAshFactor: Math.round(flyAshFactor * 1000) / 1000
      }));
    } else if (mode === 'STD_SIMPLE' && (!stdForm.flyAshGrade || stdForm.faDosage === 0)) {
      // 如果没有等级或掺量为0，重置为默认值
      setStdForm(prev => ({
        ...prev,
        flyAshFactor: 1.0
      }));
    }
  }, [stdForm.flyAshGrade, stdForm.faDosage, mode]);

  // 简化录入模式下：当矿粉比例或等级改变时，自动计算矿粉系数
  useEffect(() => {
    if (mode === 'STD_SIMPLE' && stdForm.slagPowderGrade && stdForm.slagDosage > 0) {
      const slagFactor = getSlagPowderFactor(stdForm.slagPowderGrade, stdForm.slagDosage);
      setStdForm(prev => ({
        ...prev,
        slagFactor: Math.round(slagFactor * 1000) / 1000
      }));
    } else if (mode === 'STD_SIMPLE' && (!stdForm.slagPowderGrade || stdForm.slagDosage === 0)) {
      // 如果没有等级或掺量为0，重置为默认值
      setStdForm(prev => ({
        ...prev,
        slagFactor: 1.0
      }));
    }
  }, [stdForm.slagPowderGrade, stdForm.slagDosage, mode]);

  // 检测参数变化，提示需要重新计算
  useEffect(() => {
    if (result && lastCalculationParams && !loading) {
      // 如果计算模式不一致，不进行参数比较（因为不同模式使用的参数不同）
      if (lastCalculationParams.mode !== mode) {
        setNeedsRecalculation(false);
        return;
      }

      let paramsChanged = false;

      if (mode === 'STD_DETAIL') {
        // 详细录入模式：检测关键原材料参数变化
        const keyFields = [
          rawMaterials.cement.strength28d,
          rawMaterials.fineAggregate.type,
          rawMaterials.fineAggregate.grade,
          rawMaterials.coarseAggregate.type,
          rawMaterials.coarseAggregate.maxNominalSize,
          rawMaterials.flyAsh.grade,
          rawMaterials.flyAsh.dosage,
          rawMaterials.slagPowder.grade,
          rawMaterials.slagPowder.dosage,
          rawMaterials.waterReducer.waterReductionRate,
          rawMaterials.waterReducer.dosage,
          stdForm.gradeStr,
          stdForm.slump,
        ];
        const currentKey = JSON.stringify(keyFields);
        const lastKey = lastCalculationParams.lastKeyFields;
        paramsChanged = currentKey !== lastKey;
      } else if (mode === 'STD_SIMPLE') {
        // 简化录入模式：检测表单参数变化
        const currentParams = JSON.stringify(stdForm);
        paramsChanged = currentParams !== lastCalculationParams.stdForm;
      } else {
        // AI模式：检测AI表单参数变化
        // 需要判断当前是简单AI模式还是详细AI模式
        // 简单AI模式：使用 aiForm 参数
        // 详细AI模式：使用 detailedParams（包含 rawMaterials 等）
        
        if (lastCalculationParams.aiForm) {
          // 上次是简单AI模式，当前也应该比较简单AI参数
          const currentParams = JSON.stringify(aiForm);
          paramsChanged = currentParams !== lastCalculationParams.aiForm;
        } else if (lastCalculationParams.detailedParams) {
          // 上次是详细AI模式
          // 如果当前在简单AI模式（mode === 'AI' 且没有切换到详细参数输入界面），
          // 不应该比较详细参数，因为这是不同的计算方式
          // 只有当当前也在详细参数输入界面时，才比较详细参数
          // 这里简化处理：如果上次是详细AI模式，但当前在简单AI模式，不触发重新计算提示
          // （因为用户可能只是想查看简单AI模式的结果，而不是修改详细参数）
          paramsChanged = false; // 不同计算方式，不触发重新计算提示
        } else {
          // 如果没有保存的参数，不触发重新计算提示
          paramsChanged = false;
        }
      }

      if (paramsChanged) {
        setNeedsRecalculation(true);
      } else {
        setNeedsRecalculation(false);
      }
    }
  }, [stdForm, rawMaterials, aiForm, mode, result, lastCalculationParams, loading]);

  // 当使用详细录入模式时，自动计算并同步中间值到简化表单
  useEffect(() => {
    if (mode === 'STD_DETAIL') {
      const cement = rawMaterials.cement;
      const fineAgg = rawMaterials.fineAggregate;
      const coarseAgg = rawMaterials.coarseAggregate;
      const flyAsh = rawMaterials.flyAsh;
      const slagPowder = rawMaterials.slagPowder;
      const waterReducer = rawMaterials.waterReducer;

      // 检查是否有足够的数据进行计算
      if (coarseAgg.type && coarseAgg.maxNominalSize && stdForm.slump) {
        // 计算基准用水量
        const aggregateType = coarseAgg.type === '碎石' ? '碎石' : '卵石';
        const maxSize = Number(coarseAgg.maxNominalSize) || 20;
        const fineAggregateType = fineAgg.type || '天然砂（河砂）';
        const waterBase = getWaterDemand(aggregateType, maxSize, stdForm.slump, fineAggregateType);

        // 计算粉煤灰系数
        let flyAshFactor = 1.0;
        if (flyAsh.grade && flyAsh.dosage) {
          flyAshFactor = getFlyAshFactor(flyAsh.grade, Number(flyAsh.dosage));
        }

        // 计算矿粉系数
        let slagFactor = 1.0;
        if (slagPowder.grade && slagPowder.dosage) {
          slagFactor = getSlagPowderFactor(slagPowder.grade, Number(slagPowder.dosage));
        }

        // 更新简化表单中的中间值（只更新这些计算得出的值）
        setStdForm(prev => ({
          ...prev,
          waterBase: Math.round(waterBase),
          flyAshFactor: Math.round(flyAshFactor * 1000) / 1000,
          slagFactor: Math.round(slagFactor * 1000) / 1000,
          // 同步其他可以从详细录入获取的值
          cementStrength: cement.strength28d ? Number(cement.strength28d) : prev.cementStrength,
          waterRedRate: waterReducer.waterReductionRate ? Number(waterReducer.waterReductionRate) : prev.waterRedRate,
          admDosage: waterReducer.dosage ? Number(waterReducer.dosage) : prev.admDosage,
          faDosage: flyAsh.dosage ? Number(flyAsh.dosage) : prev.faDosage,
          slagDosage: slagPowder.dosage ? Number(slagPowder.dosage) : prev.slagDosage,
          aggType: coarseAgg.type === '碎石' ? 'CRUSHED' : 'GRAVEL',
        }));
      }
    }
  }, [
    mode,
    rawMaterials.cement.strength28d,
    rawMaterials.fineAggregate.type,
    rawMaterials.coarseAggregate.type,
    rawMaterials.coarseAggregate.maxNominalSize,
    rawMaterials.flyAsh.grade,
    rawMaterials.flyAsh.dosage,
    rawMaterials.slagPowder.grade,
    rawMaterials.slagPowder.dosage,
    rawMaterials.waterReducer.waterReductionRate,
    rawMaterials.waterReducer.dosage,
    stdForm.slump,
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('concrete_mix_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveHistory = () => {
    if (!result) return;
    const historyFormData = {
      grade: (mode === 'AI' ? aiForm.grade : stdForm.gradeStr as MixGrade) || MixGrade.C30,
      slump: aiForm.slump,
      maxSize: aiForm.maxSize,
      flyAsh: (mode === 'STD_SIMPLE' || mode === 'STD_DETAIL') ? stdForm.faDosage > 0 : aiForm.flyAsh,
      region: aiForm.region,
      season: aiForm.season
    };
    const newItem: MixHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      formData: historyFormData,
      result: { ...result }
    };
    const newHistory = [newItem, ...history];
    setHistory(newHistory);
    localStorage.setItem('concrete_mix_history', JSON.stringify(newHistory));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('concrete_mix_history', JSON.stringify(newHistory));
  };

  const loadHistoryItem = (item: MixHistoryItem) => {
    setMode('AI');
    setAiForm({ ...aiForm, ...item.formData });
    setResult(item.result);
    setStdResultDetails(null);
  };

  const handleAiCalculate = async () => {
    setLoading(true);
    setStdResultDetails(null);
    try {
      const data = await getIntelligentMixRecommendation(
        aiForm.grade,
        aiForm.slump,
        aiForm.maxSize,
        aiForm.flyAsh,
        aiForm.region,
        aiForm.season
      );
      setResult(data);
      setNeedsRecalculation(false);
      setResultCalculationMode('AI');
      // 保存当前计算参数用于后续比较
      setLastCalculationParams({
        mode: 'AI',
        aiForm: JSON.stringify(aiForm),
        lastKeyFields: null,
      });
    } catch (e: any) {
      console.error("AI计算错误详情:", e);
      const errorMessage = e?.message || "未知错误";
      if (errorMessage.includes("API key") || errorMessage.includes("DEEPSEEK_API_KEY")) {
        alert("❌ API密钥未配置！\n\n请在项目根目录创建 .env.local 文件，并添加：\nDEEPSEEK_API_KEY=你的API密钥\n\n配置后请重启开发服务器。");
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        alert("❌ API密钥无效！\n\n请检查 .env.local 文件中的 DEEPSEEK_API_KEY 是否正确。");
      } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        alert("❌ API调用频率超限！\n\n请稍后再试，或检查你的 DeepSeek API 配额。");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        alert("❌ 网络连接失败！\n\n请检查网络连接，或稍后重试。\n\n错误详情：" + errorMessage);
      } else {
        alert("❌ 智能配比计算失败！\n\n错误信息：" + errorMessage + "\n\n请检查浏览器控制台（F12）查看详细错误。");
      }
    } finally {
      setLoading(false);
    }
  };

  // 详细参数AI计算
  const handleDetailedAiCalculate = async () => {
    // 检查必填参数
    if (!stdForm.gradeStr || !stdForm.slump) {
      alert("请先填写强度等级和坍落度！");
      return;
    }

    setLoading(true);
    setStdResultDetails(null);
    try {
      const data = await getDetailedIntelligentMixRecommendation(
        rawMaterials,
        stdForm.gradeStr,
        stdForm.slump,
        stdForm.region || '北京',
        stdForm.season || SeasonType.STANDARD,
        stdForm.density || 2400
      );
      setResult(data);
      setNeedsRecalculation(false);
      setResultCalculationMode('AI');
      // 保存当前计算参数用于后续比较
      setLastCalculationParams({
        mode: 'AI',
        detailedParams: JSON.stringify({
          rawMaterials,
          gradeStr: stdForm.gradeStr,
          slump: stdForm.slump,
          region: stdForm.region,
          season: stdForm.season,
          density: stdForm.density
        }),
        lastKeyFields: null,
      });
    } catch (e: any) {
      console.error("详细参数AI计算错误详情:", e);
      const errorMessage = e?.message || "未知错误";
      if (errorMessage.includes("API key") || errorMessage.includes("DEEPSEEK_API_KEY")) {
        alert("❌ API密钥未配置！\n\n请在项目根目录创建 .env.local 文件，并添加：\nDEEPSEEK_API_KEY=你的API密钥\n\n配置后请重启开发服务器。");
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        alert("❌ API密钥无效！\n\n请检查 .env.local 文件中的 DEEPSEEK_API_KEY 是否正确。");
      } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        alert("❌ API调用频率超限！\n\n请稍后再试，或检查你的 DeepSeek API 配额。");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        alert("❌ 网络连接失败！\n\n请检查网络连接，或稍后重试。\n\n错误详情：" + errorMessage);
      } else {
        alert("❌ 智能配比计算失败！\n\n错误信息：" + errorMessage + "\n\n请检查浏览器控制台（F12）查看详细错误。");
      }
    } finally {
      setLoading(false);
    }
  };



  // 正式上线时已注释掉测试数据加载功能
  /*
  const loadExcelDebugCase = () => {
    // 强制加载 Excel 调试数据 (硬编码)
    const EXCEL_DEBUG_CASE = {
      // ===========================
      // 1. 基础设计要求 (Basic Requirements)
      // ===========================
      strengthGrade: 'C40',      // 强度等级
      slump: 180,                // 坍落度 (mm)

      // 【关键修正】强制锁定值 (用于对齐 Excel 算法)
      sigma: 5.0,                // 强度标准差 (强制设为 5.0，覆盖默认的 6.0)
      concreteDensity: 2400,     // 假定容重 (kg/m³，强制固定)

      // ===========================
      // 2. 水泥参数 (Cement)
      // ===========================
      cementType: '普通硅酸盐水泥', // 品种
      cementGrade: '42.5',         // 规格等级
      cementStrength: 49.5,        // 28天实测强度 (MPa)

      // ===========================
      // 3. 骨料参数 (Aggregates)
      // ===========================
      // 粗骨料 (Stone)
      stoneType: '碎石',           // 决定回归系数 αa=0.53, αb=0.20
      stoneGrading: '连续粒级',     // 颗粒级配
      stoneNominalSize: '5-20',   // 公称粒级 (mm)
      stoneMaxSize: 20,           // 最大公称粒径 (mm)

      // 细骨料 (Sand)
      sandType: '天然砂（河砂）',  // 对应 FineAggregateType.NATURAL_RIVER
      sandCategory: '中砂（3.0-2.3）', // 对应 FineAggregateGrade.MEDIUM (必须完全匹配字符串)
      sandModulus: 2.5,           // 细度模数

      // 配合比参数
      sandRatio: 0.40,            // 设计砂率 (40%)

      // ===========================
      // 4. 掺合料 (Mineral Admixtures)
      // ===========================
      // 粉煤灰 (Fly Ash)
      flyAshType: 'F类',
      flyAshGrade: 'I级',
      flyAshRatio: 0.20,          // 掺量 20%
      flyAshCoeff: 0.85,          // 影响系数

      // 矿粉 (Slag)
      slagType: 'S95',
      slagRatio: 0.20,            // 掺量 20%
      slagCoeff: 1.0,             // 影响系数

      // ===========================
      // 5. 外加剂 (Chemical Admixtures)
      // ===========================
      admixtureType: '高性能减水剂', // 品种
      waterReducerRate: 0.30,      // 减水率 30%
      admixtureDosage: 0.02,       // 掺量 2%

      // ===========================
      // 6. 隐式计算参数 (Implicit Params)
      // ===========================
      // 如果你的 state 中有单独存储回归系数，请同时设置它们：
      alphaA: 0.53,                // 碎石系数 A
      alphaB: 0.20                 // 碎石系数 B
    };

    // 1. 更新详细原材料参数 (Detailed Params)
    setRawMaterials(prev => ({
      ...prev,
      cement: {
        ...prev.cement,
        type: EXCEL_DEBUG_CASE.cementType,
        grade: EXCEL_DEBUG_CASE.cementGrade,
        strength28d: EXCEL_DEBUG_CASE.cementStrength.toString(),
      },
      coarseAggregate: {
        ...prev.coarseAggregate,
        type: EXCEL_DEBUG_CASE.stoneType,
        gradationType: EXCEL_DEBUG_CASE.stoneGrading,
        nominalSize: EXCEL_DEBUG_CASE.stoneNominalSize,
        maxNominalSize: EXCEL_DEBUG_CASE.stoneMaxSize.toString(),
      },
      fineAggregate: {
        ...prev.fineAggregate,
        type: EXCEL_DEBUG_CASE.sandType,
        grade: EXCEL_DEBUG_CASE.sandCategory,
        finenessModulus: EXCEL_DEBUG_CASE.sandModulus.toString(),
      },
      flyAsh: {
        ...prev.flyAsh,
        type: EXCEL_DEBUG_CASE.flyAshType,
        grade: EXCEL_DEBUG_CASE.flyAshGrade,
        dosage: (EXCEL_DEBUG_CASE.flyAshRatio * 100).toString(),
      },
      slagPowder: {
        ...prev.slagPowder,
        grade: EXCEL_DEBUG_CASE.slagType,
        dosage: (EXCEL_DEBUG_CASE.slagRatio * 100).toString(),
      },
      waterReducer: {
        ...prev.waterReducer,
        type: EXCEL_DEBUG_CASE.admixtureType,
        waterReductionRate: (EXCEL_DEBUG_CASE.waterReducerRate * 100).toString(),
        dosage: (EXCEL_DEBUG_CASE.admixtureDosage * 100).toString(),
      }
    }));

    // 2. 更新共享表单状态 (Shared State & Logic Locks)
    setStdForm(prev => ({
      ...prev,
      gradeStr: EXCEL_DEBUG_CASE.strengthGrade,
      slump: EXCEL_DEBUG_CASE.slump,

      // 锁定核心计算参数
      sigma: EXCEL_DEBUG_CASE.sigma,
      density: EXCEL_DEBUG_CASE.concreteDensity,

      // 同步回归系数
      alphaA: EXCEL_DEBUG_CASE.alphaA,
      alphaB: EXCEL_DEBUG_CASE.alphaB,
      aggType: 'CRUSHED', // 对应碎石

      // 同步其他参数到简化表单（即使用detailed模式，这些值也会被引用为初始值或备份）
      cementStrength: EXCEL_DEBUG_CASE.cementStrength,
      sandRatio: EXCEL_DEBUG_CASE.sandRatio * 100,

      // 清空或同步
      flyAshGrade: EXCEL_DEBUG_CASE.flyAshGrade,
      slagPowderGrade: EXCEL_DEBUG_CASE.slagType,
    }));

    // 提示用户
    // alert("已加载 Excel 调试数据 (详细模式)！\n请点击 '标准计算' 查看结果。");
  };
  */

  const handleStdCalculate = () => {
    // 根据当前模式决定使用哪个数据源
    if (mode === 'STD_DETAIL') {
      // 详细录入模式：从rawMaterials提取参数
      const cement = rawMaterials.cement;
      const fineAgg = rawMaterials.fineAggregate;
      const coarseAgg = rawMaterials.coarseAggregate;
      const flyAsh = rawMaterials.flyAsh;
      const slagPowder = rawMaterials.slagPowder;
      const waterReducer = rawMaterials.waterReducer;

      // 检查核心必填参数
      const requiredFields = [
        { value: stdForm.gradeStr, name: '设计强度等级' },
        { value: stdForm.slump, name: '坍落度设计值' },
        { value: cement.strength28d, name: '水泥28天强度' },
        { value: fineAgg.type, name: '细骨料品种' },
        { value: fineAgg.grade, name: '细骨料规格等级' },
        { value: coarseAgg.type, name: '粗骨料品种' },
        { value: coarseAgg.maxNominalSize, name: '最大公称粒径' },
        { value: flyAsh.grade, name: '粉煤灰规格（等级）' },
        { value: flyAsh.dosage, name: '粉煤灰掺量' },
        { value: slagPowder.grade, name: '矿粉规格等级' },
        { value: slagPowder.dosage, name: '矿粉掺量' },
        { value: waterReducer.waterReductionRate, name: '减水剂减水率' },
        { value: waterReducer.dosage, name: '减水剂掺量' },
      ];

      const missingFields = requiredFields.filter(f => !f.value);
      if (missingFields.length > 0) {
        alert(`请填写完整的核心必填参数：\n${missingFields.map(f => `- ${f.name}`).join('\n')}`);
        return;
      }

      // 提取坍落度
      const slumpValue = Number(stdForm.slump) || 180;

      const input: MixDesignInput = {
        // 核心必填参数
        strengthGrade: stdForm.gradeStr || 'C40',
        slump: slumpValue,
        aggregateType: coarseAgg.type || '碎石',
        maxSize: Number(coarseAgg.maxNominalSize) || 20,
        fineAggregateType: fineAgg.type || '',
        fineAggregateGrade: fineAgg.grade || '',
        finenessModulus: 0, // 未使用，保留字段以符合接口
        nominalSize: '', // 未使用，保留字段以符合接口
        cementType: '', // 未使用，保留字段以符合接口
        cementGrade: '', // 未使用，保留字段以符合接口
        cementStrength28d: Number(cement.strength28d) || 0,
        flyAshType: flyAsh.type || '',
        flyAshGrade: flyAsh.grade || '',
        flyAshDosage: Number(flyAsh.dosage) || 0,
        slagPowderGrade: slagPowder.grade || '',
        slagPowderDosage: Number(slagPowder.dosage) || 0,
        waterReducerType: '', // 未使用，保留字段以符合接口
        waterReducerRate: Number(waterReducer.waterReductionRate) || 0,
        admixtureDosage: Number(waterReducer.dosage) || 0,
        // 可选参数（默认值已在接口定义）
        concreteDensity: stdForm.density || 2400,
      };

      const calcResult = calculateMixDesign(input);

      const res: MixDesignResult = {
        cement: calcResult.cement,
        water: calcResult.water,
        sand: calcResult.sand,
        stone: calcResult.stone,
        admixture: calcResult.admixture,
        flyAsh: calcResult.flyAsh,
        slag: calcResult.slagPowder,
        wcr: calcResult.wcr,
        sandRatio: calcResult.sandRatio,
        strengthGrade: input.strengthGrade,
        notes: `基于 JGJ 55-2011 标准计算（详细录入模式）。配制强度: ${calcResult.configStrength}MPa，胶凝材料强度: ${calcResult.binderStrength}MPa。`,
        referencedStandards: ["JGJ 55-2011 普通混凝土配合比设计规程"]
      };

      setResult(res);
      setStdResultDetails({
        f_cu_o: calcResult.configStrength.toFixed(1),
        f_b: calcResult.binderStrength.toFixed(1),
        wcrCalculated: calcResult.wcr.toFixed(6),
        wcrAdopted: calcResult.wcr.toFixed(3),
        totalBinder: calcResult.binderTotal.toFixed(2),
        totalAgg: calcResult.details.aggregateTotal.toFixed(2),
        waterBase: calcResult.waterBase.toFixed(0),
        flyAshFactor: calcResult.details.flyAshFactor.toFixed(3),
        slagPowderFactor: calcResult.details.slagPowderFactor.toFixed(3),
        sigma: calcResult.details.sigma.toFixed(1),
      });
      setNeedsRecalculation(false);
      setResultCalculationMode('STD_DETAIL');
      // 保存当前计算参数用于后续比较
      const keyFields = [
        rawMaterials.cement.strength28d,
        rawMaterials.fineAggregate.type,
        rawMaterials.fineAggregate.grade,
        rawMaterials.coarseAggregate.type,
        rawMaterials.coarseAggregate.maxNominalSize,
        rawMaterials.flyAsh.grade,
        rawMaterials.flyAsh.dosage,
        rawMaterials.slagPowder.grade,
        rawMaterials.slagPowder.dosage,
        rawMaterials.waterReducer.waterReductionRate,
        rawMaterials.waterReducer.dosage,
        stdForm.gradeStr,
        stdForm.slump,
      ];
      setLastCalculationParams({
        mode: 'STD_DETAIL',
        input: JSON.stringify(input),
        stdForm: null,
        lastKeyFields: JSON.stringify(keyFields),
      });
    } else {
      // 使用简化表单计算（统一使用标准计算函数，但允许自定义参数）
      // 构建计算输入，使用默认值填充缺失的详细参数
      const input: MixDesignInput = {
        strengthGrade: stdForm.gradeStr || 'C40',
        slump: stdForm.slump || 180,
        aggregateType: stdForm.aggType === 'CRUSHED' ? '碎石' : '卵石',
        maxSize: 20, // 简化模式默认值，用户可以通过详细录入模式设置
        fineAggregateType: '天然砂（河砂）', // 简化模式默认值
        fineAggregateGrade: '', // 简化模式不需要
        finenessModulus: 0, // 简化模式不需要
        nominalSize: '', // 简化模式不需要
        cementType: '', // 简化模式不需要
        cementGrade: '', // 简化模式不需要
        cementStrength28d: stdForm.cementStrength || 0,
        flyAshType: '', // 简化模式不需要
        flyAshGrade: stdForm.flyAshGrade || '', // 如果提供了等级，使用等级计算系数
        flyAshDosage: stdForm.faDosage || 0,
        slagPowderGrade: stdForm.slagPowderGrade || '', // 如果提供了等级，使用等级计算系数
        slagPowderDosage: stdForm.slagDosage || 0,
        waterReducerType: '', // 简化模式不需要
        waterReducerRate: stdForm.waterRedRate || 0,
        admixtureDosage: stdForm.admDosage || 0,
        concreteDensity: stdForm.density || 2400,
        // 自定义参数（覆盖自动计算）
        // 如果提供了等级，则使用等级自动计算系数；否则使用用户手动输入的系数
        customSigma: stdForm.sigma,
        customWaterBase: stdForm.waterBase,
        customFlyAshFactor: stdForm.flyAshGrade ? undefined : stdForm.flyAshFactor, // 有等级时让系统自动计算
        customSlagPowderFactor: stdForm.slagPowderGrade ? undefined : stdForm.slagFactor, // 有等级时让系统自动计算
        customSandRatio: stdForm.sandRatio,
        customAlphaA: stdForm.alphaA,
        customAlphaB: stdForm.alphaB,
        customWCR: stdForm.designWCR ? parseFloat(stdForm.designWCR) : undefined,
      };

      const calcResult = calculateMixDesign(input);

      const res: MixDesignResult = {
        cement: calcResult.cement,
        water: calcResult.water,
        sand: calcResult.sand,
        stone: calcResult.stone,
        admixture: calcResult.admixture,
        flyAsh: calcResult.flyAsh,
        slag: calcResult.slagPowder,
        wcr: calcResult.wcr,
        sandRatio: calcResult.sandRatio,
        strengthGrade: stdForm.gradeStr,
        notes: `基于 JGJ 55-2011 标准计算（简化录入模式）。配制强度: ${calcResult.configStrength}MPa，胶凝材料强度: ${calcResult.binderStrength}MPa。`,
        referencedStandards: ["JGJ 55-2011 普通混凝土配合比设计规程"]
      };

      setResult(res);
      setStdResultDetails({
        f_cu_o: calcResult.configStrength.toFixed(1),
        f_b: calcResult.binderStrength.toFixed(1),
        wcrCalculated: calcResult.wcr.toFixed(6),
        wcrAdopted: calcResult.wcr.toFixed(3),
        totalBinder: calcResult.binderTotal.toFixed(2),
        totalAgg: calcResult.details.aggregateTotal.toFixed(2),
        waterBase: calcResult.waterBase.toFixed(0),
        flyAshFactor: calcResult.details.flyAshFactor.toFixed(3),
        slagPowderFactor: calcResult.details.slagPowderFactor.toFixed(3),
        sigma: calcResult.details.sigma.toFixed(1),
      });
      setNeedsRecalculation(false);
      setResultCalculationMode('STD_SIMPLE');
      // 保存当前计算参数用于后续比较
      setLastCalculationParams({
        mode: 'STD_SIMPLE',
        input: null,
        stdForm: JSON.stringify(stdForm),
        lastKeyFields: null,
      });
    }
  };

  const chartData = result ? [
    { name: '水泥', value: result.cement },
    { name: '水', value: result.water },
    { name: '砂', value: result.sand },
    { name: '石', value: result.stone },
    { name: '粉煤灰', value: result.flyAsh || 0 },
    { name: '矿粉', value: result.slag || 0 },
  ].filter(i => i.value > 0) : [];

  const COLORS = ['#3b82f6', '#0ea5e9', '#f59e0b', '#64748b', '#94a3b8', '#cbd5e1'];

  return (
    <div className="flex flex-col h-full gap-4 min-h-0 relative">
      {/* 全局加载遮罩层 */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[300px]">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-concrete-900 mb-2">AI智能计算中...</h3>
              <p className="text-sm text-concrete-600">正在分析参数并生成配合比，请稍候</p>
            </div>
          </div>
        </div>
      )}
      {/* Header & Mode Switcher Row */}
      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-concrete-200 shadow-sm flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('AI')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-2 ${mode === 'AI' ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-concrete-600 hover:bg-concrete-50'}`}
          >
            <BrainCircuit className="w-4 h-4" />
            AI智能计算
          </button>
          <button
            onClick={() => setMode('STD_SIMPLE')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-2 ${mode === 'STD_SIMPLE' ? 'bg-safety-50 text-safety-700 border border-safety-200' : 'text-concrete-600 hover:bg-concrete-50'}`}
          >
            <Calculator className="w-4 h-4" />
            简要标准计算
          </button>
          <button
            onClick={() => setMode('STD_DETAIL')}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-2 ${mode === 'STD_DETAIL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-concrete-600 hover:bg-concrete-50'}`}
          >
            <Package className="w-4 h-4" />
            详细标准计算
          </button>
        </div>
        <div className="text-xs text-concrete-400 hidden md:block">
          {mode === 'AI' ? '基于大模型经验推荐' : mode === 'STD_SIMPLE' ? '基于 JGJ 55-2011 规范公式计算（简化模式）' : '基于 JGJ 55-2011 规范公式计算（详细模式）'}
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-4 overflow-hidden min-h-0">
        {/* Left: Input Panel */}
        <div className="xl:w-[420px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
          {mode === 'AI' ? (
            <Card title="AI 参数设置" icon={<BrainCircuit className="w-4 h-4" />} className="flex-shrink-0">
              <div className="space-y-4">
                <Select label="强度等级" value={aiForm.grade} onChange={(e) => setAiForm({ ...aiForm, grade: e.target.value as MixGrade })} options={Object.values(MixGrade).map(v => ({ value: v, label: v }))} />
                <Select label="坍落度" value={aiForm.slump} onChange={(e) => setAiForm({ ...aiForm, slump: e.target.value as SlumpType })} options={Object.values(SlumpType).map(v => ({ value: v, label: v }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="最大粒径(mm)" type="number" value={aiForm.maxSize} onChange={(e) => setAiForm({ ...aiForm, maxSize: Number(e.target.value) })} />
                  <Select label="所在地" value={aiForm.region} onChange={(e) => setAiForm({ ...aiForm, region: e.target.value })} options={REGIONS.map(r => ({ value: r, label: r }))} />
                </div>
                <Select label="施工季节" value={aiForm.season} onChange={(e) => setAiForm({ ...aiForm, season: e.target.value as SeasonType })} options={Object.values(SeasonType).map(v => ({ value: v, label: v }))} />
                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="flyAsh" checked={aiForm.flyAsh} onChange={(e) => setAiForm({ ...aiForm, flyAsh: e.target.checked })} className="w-4 h-4 text-primary-600" />
                  <label htmlFor="flyAsh" className="text-sm text-concrete-700">使用粉煤灰</label>
                </div>
                <Button onClick={handleAiCalculate} isLoading={loading} className="w-full mt-2" disabled={loading}>
                  {loading ? 'AI计算中...' : '开始计算'}
                </Button>
              </div>
            </Card>
          ) : mode === 'STD_DETAIL' ? (
            /* 详细原材料录入界面 */
            <>
              <RawMaterialsInput
                materials={rawMaterials}
                onMaterialsChange={setRawMaterials}
              />
              <div className="bg-white rounded-xl shadow-sm border border-concrete-200 p-4">
                <div className="space-y-3">
                  <div className="text-xs text-concrete-600 mb-2">
                    <strong>强度等级和坍落度：</strong>请在下方输入
                  </div>
                  {/* 正式上线时已注释掉测试数据加载功能 */}
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={loadExcelDebugCase}
                    className="w-full text-xs text-amber-600 border-amber-200 hover:bg-amber-50 mb-2"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    加载 Excel 案例数据 (调试用)
                  </Button> */}
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="强度等级"
                      value={stdForm.gradeStr}
                      onChange={e => setStdForm({ ...stdForm, gradeStr: e.target.value })}
                      options={Object.values(MixGrade).map(v => ({ value: v, label: v }))}
                    />
                    <Input
                      label="坍落度 (mm)"
                      type="number"
                      value={stdForm.slump}
                      onChange={e => setStdForm({ ...stdForm, slump: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="工程所在地"
                      value={stdForm.region || '北京'}
                      onChange={e => setStdForm({ ...stdForm, region: e.target.value })}
                      options={REGIONS.map(r => ({ value: r, label: r }))}
                    />
                    <Select
                      label="施工季节"
                      value={stdForm.season || SeasonType.STANDARD}
                      onChange={e => setStdForm({ ...stdForm, season: e.target.value as SeasonType })}
                      options={Object.values(SeasonType).map(v => ({ value: v, label: v }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStdCalculate}
                      className="flex-1 bg-primary-600 hover:bg-primary-500"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      标准计算
                    </Button>
                    <Button
                      onClick={handleDetailedAiCalculate}
                      className="flex-1 bg-purple-600 hover:bg-purple-500"
                      isLoading={loading}
                      disabled={loading}
                    >
                      <BrainCircuit className="w-4 h-4 mr-2" />
                      {loading ? 'AI计算中...' : 'AI智能推荐'}
                    </Button>
                  </div>
                  <div className="text-xs text-concrete-500 text-center">
                    标准计算：基于JGJ 55-2011规范公式 | AI推荐：基于详细参数智能分析
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* 简化录入模式 */
            <div className="bg-white rounded-xl shadow-sm border border-concrete-200 p-4">
              <div className="space-y-3">
                <div className="text-xs text-concrete-600 mb-2">
                  <strong>简化参数录入：</strong>输入核心计算参数
                </div>

                <Select
                  label="强度等级"
                  value={stdForm.gradeStr}
                  onChange={e => setStdForm({ ...stdForm, gradeStr: e.target.value })}
                  options={Object.values(MixGrade).map(v => ({ value: v, label: v }))}
                />
                <Input
                  label="坍落度 (mm)"
                  type="number"
                  value={stdForm.slump}
                  onChange={e => setStdForm({ ...stdForm, slump: Number(e.target.value) })}
                />
                <Input label="水泥28天强度 (MPa)" type="number" step="0.1" value={stdForm.cementStrength} onChange={e => setStdForm({ ...stdForm, cementStrength: Number(e.target.value) })} />

                <div className="bg-concrete-50 p-2 rounded border border-concrete-100 space-y-2">
                  <label className="text-xs font-medium text-concrete-500 block">骨料系数 (αa, αb)</label>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-white border border-concrete-300 rounded text-xs py-1" value={stdForm.aggType} onChange={e => setStdForm({ ...stdForm, aggType: e.target.value })}>
                      <option value="CRUSHED">碎石</option>
                      <option value="GRAVEL">卵石</option>
                    </select>
                    <input className="w-16 border rounded px-1 text-xs" type="number" step="0.01" value={stdForm.alphaA} onChange={e => setStdForm({ ...stdForm, alphaA: parseFloat(e.target.value) })} />
                    <input className="w-16 border rounded px-1 text-xs" type="number" step="0.01" value={stdForm.alphaB} onChange={e => setStdForm({ ...stdForm, alphaB: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input className="col-span-1" label="基准水" type="number" value={stdForm.waterBase} onChange={e => setStdForm({ ...stdForm, waterBase: Number(e.target.value) })} />
                  <Input className="col-span-1" label="减水率%" type="number" value={stdForm.waterRedRate} onChange={e => setStdForm({ ...stdForm, waterRedRate: Number(e.target.value) })} />
                  <Input className="col-span-1" label="外加剂%" type="number" step="0.1" value={stdForm.admDosage} onChange={e => setStdForm({ ...stdForm, admDosage: Number(e.target.value) })} />
                  <Input className="col-span-1" label="设计砂率%" type="number" step="0.1" value={stdForm.sandRatio} onChange={e => setStdForm({ ...stdForm, sandRatio: Number(e.target.value) })} />
                </div>

                {/* 粉煤灰和矿粉输入区域 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Input label="粉煤灰掺量 (%)" type="number" value={stdForm.faDosage} onChange={e => setStdForm({ ...stdForm, faDosage: Number(e.target.value) })} />
                    <Select
                      label="粉煤灰等级"
                      value={stdForm.flyAshGrade || ''}
                      onChange={(e) => setStdForm({ ...stdForm, flyAshGrade: e.target.value })}
                      options={[
                        { value: '', label: '请选择（不自动计算系数）' },
                        ...Object.values(FlyAshGrade).map(v => ({ value: v, label: v }))
                      ]}
                    />
                    {stdForm.flyAshGrade && stdForm.faDosage > 0 && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                        自动计算系数γf: {stdForm.flyAshFactor.toFixed(3)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input label="矿粉掺量 (%)" type="number" value={stdForm.slagDosage} onChange={e => setStdForm({ ...stdForm, slagDosage: Number(e.target.value) })} />
                    <Select
                      label="矿粉等级"
                      value={stdForm.slagPowderGrade || ''}
                      onChange={(e) => setStdForm({ ...stdForm, slagPowderGrade: e.target.value })}
                      options={[
                        { value: '', label: '请选择（不自动计算系数）' },
                        ...Object.values(SlagPowderGrade).map(v => ({ value: v, label: v }))
                      ]}
                    />
                    {stdForm.slagPowderGrade && stdForm.slagDosage > 0 && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                        自动计算系数γs: {stdForm.slagFactor.toFixed(3)}
                      </div>
                    )}
                  </div>
                </div>

                <Input label="假定水胶比 (可选)" placeholder="自动计算" type="number" step="0.01" value={stdForm.designWCR} onChange={e => setStdForm({ ...stdForm, designWCR: e.target.value })} />

                <div className="border-t border-concrete-200 pt-3 mt-2">
                  <Button onClick={handleStdCalculate} className="w-full bg-safety-600 hover:bg-safety-500">
                    <Calculator className="w-4 h-4 mr-2" />
                    开始计算（简化录入模式）
                  </Button>
                  <div className="text-xs text-concrete-500 text-center mt-2">
                    使用上方表单中的参数进行计算
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent History - Compact List */}
          <div className="bg-white rounded-xl shadow-sm border border-concrete-200 flex-1 overflow-hidden flex flex-col min-h-[200px]">
            <div className="bg-concrete-50 px-4 py-2 border-b border-concrete-200 flex items-center justify-between">
              <span className="text-xs font-bold text-concrete-600 flex items-center gap-1"><History className="w-3 h-3" /> 近期记录</span>
              <span className="text-[10px] text-concrete-400">保留最近5条</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {history.slice(0, 5).map(item => (
                <div key={item.id} onClick={() => loadHistoryItem(item)} className="flex items-center justify-between p-2 rounded bg-concrete-50 border border-concrete-100 hover:bg-primary-50 hover:border-primary-100 cursor-pointer text-xs">
                  <div>
                    <div className="font-bold text-concrete-700">{item.formData.grade} <span className="font-normal text-concrete-400">| {new Date(item.timestamp).toLocaleDateString()}</span></div>
                  </div>
                  <Trash2 className="w-3 h-3 text-concrete-300 hover:text-red-400" onClick={(e) => deleteHistoryItem(item.id, e)} />
                </div>
              ))}
              {history.length === 0 && <div className="text-center text-concrete-300 text-xs py-4">无记录</div>}
            </div>
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-concrete-200 overflow-hidden min-h-0">
          {result ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Toolbar */}
              <div className="bg-concrete-50 px-4 py-3 border-b border-concrete-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${mode === 'AI' ? 'bg-primary-500' : 'bg-safety-500'}`}></span>
                  <h3 className="font-bold text-concrete-800 text-sm md:text-base">
                    {result.strengthGrade} 配比结果
                  </h3>
                  {resultCalculationMode && (
                    <span className={`text-xs px-2 py-0.5 rounded ${resultCalculationMode === 'AI'
                      ? 'bg-primary-100 text-primary-700'
                      : resultCalculationMode === 'STD_DETAIL'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-safety-100 text-safety-700'
                      }`}>
                      {resultCalculationMode === 'AI'
                        ? 'AI智能推荐'
                        : resultCalculationMode === 'STD_DETAIL'
                          ? '详细录入模式计算'
                          : '简化录入模式计算'}
                    </span>
                  )}
                  {resultCalculationMode && (mode === 'STD_SIMPLE' || mode === 'STD_DETAIL') && (
                    (resultCalculationMode === 'STD_DETAIL' && mode !== 'STD_DETAIL') ||
                      (resultCalculationMode === 'STD_SIMPLE' && mode !== 'STD_SIMPLE') ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 ml-2">
                        ⚠️ 当前模式与计算结果不匹配
                      </span>
                    ) : null
                  )}
                </div>
                <Button variant="outline" onClick={saveHistory} className="!py-1 !px-3 !text-xs !h-7">
                  <Save className="w-3 h-3" /> 保存
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {/* 计算反馈提示 */}
                {needsRecalculation && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">检测到参数已更改，请重新计算以更新结果</span>
                    </div>
                    <Button
                      onClick={() => {
                        if (mode === 'STD_SIMPLE' || mode === 'STD_DETAIL') {
                          handleStdCalculate();
                        } else {
                          handleAiCalculate();
                        }
                      }}
                      className="!py-1 !px-3 !text-xs !h-7 !bg-yellow-600 hover:!bg-yellow-700"
                    >
                      重新计算
                    </Button>
                  </div>
                )}

                {/* Standard Intermediate Calculation Bar */}
                {(mode === 'STD_SIMPLE' || mode === 'STD_DETAIL') && stdResultDetails && (
                  <div className="mb-4 space-y-2">
                    <div className="flex flex-wrap gap-4 p-3 bg-green-50 rounded border border-green-100 text-xs">
                      <div className="flex flex-col">
                        <span className="text-green-600 scale-90 origin-left">配制强度</span>
                        <span className="font-bold text-green-900 text-sm">{stdResultDetails.f_cu_o} MPa</span>
                      </div>
                      <div className="w-px bg-green-200 h-8"></div>
                      <div className="flex flex-col">
                        <span className="text-green-600 scale-90 origin-left">胶凝材料强度</span>
                        <span className="font-bold text-green-900 text-sm">{stdResultDetails.f_b} MPa</span>
                      </div>
                      <div className="w-px bg-green-200 h-8"></div>
                      <div className="flex flex-col">
                        <span className="text-green-600 scale-90 origin-left">计算水胶比</span>
                        <span className="font-bold text-green-900 text-sm">{stdResultDetails.wcrCalculated}</span>
                      </div>
                      <div className="w-px bg-green-200 h-8"></div>
                      <div className="flex flex-col">
                        <span className="text-green-600 scale-90 origin-left">采用水胶比</span>
                        <span className="font-bold text-green-800 bg-yellow-200 px-1 rounded text-sm">{stdResultDetails.wcrAdopted}</span>
                      </div>
                      <div className="flex-1"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-green-600 scale-90 origin-right">胶材总量</span>
                        <span className="font-bold text-green-900 text-sm">{stdResultDetails.totalBinder} kg</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 p-3 bg-blue-50 rounded border border-blue-100 text-xs">
                      <div className="flex flex-col">
                        <span className="text-blue-600 scale-90 origin-left">未加外加剂用水量</span>
                        <span className="font-bold text-blue-900 text-sm">{stdResultDetails.waterBase || '—'} kg/m³</span>
                      </div>
                      {stdResultDetails.sigma && (
                        <>
                          <div className="w-px bg-blue-200 h-8"></div>
                          <div className="flex flex-col">
                            <span className="text-blue-600 scale-90 origin-left">强度标准差σ</span>
                            <span className="font-bold text-blue-900 text-sm">{stdResultDetails.sigma} MPa</span>
                          </div>
                        </>
                      )}
                      {stdResultDetails.flyAshFactor && (
                        <>
                          <div className="w-px bg-blue-200 h-8"></div>
                          <div className="flex flex-col">
                            <span className="text-blue-600 scale-90 origin-left">粉煤灰系数γf</span>
                            <span className="font-bold text-blue-900 text-sm">{stdResultDetails.flyAshFactor}</span>
                          </div>
                        </>
                      )}
                      {stdResultDetails.slagPowderFactor && (
                        <>
                          <div className="w-px bg-blue-200 h-8"></div>
                          <div className="flex flex-col">
                            <span className="text-blue-600 scale-90 origin-left">矿粉系数γs</span>
                            <span className="font-bold text-blue-900 text-sm">{stdResultDetails.slagPowderFactor}</span>
                          </div>
                        </>
                      )}

                      {stdResultDetails.totalAgg && (
                        <>
                          <div className="w-px bg-blue-200 h-8"></div>
                          <div className="flex flex-col">
                            <span className="text-blue-600 scale-90 origin-left">骨料总量</span>
                            <span className="font-bold text-blue-900 text-sm">{stdResultDetails.totalAgg} kg</span>
                          </div>
                        </>
                      )}
                      {result?.sandRatio && (
                        <>
                          <div className="w-px bg-blue-200 h-8"></div>
                          <div className="flex flex-col">
                            <span className="text-blue-600 scale-90 origin-left">砂率</span>
                            <span className="font-bold text-blue-900 text-sm">{result.sandRatio}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Main Results Grid - Compact Single Row/Wrap */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
                  <CompactResultItem label="水泥" value={result.cement} />
                  <CompactResultItem label="粉煤灰" value={result.flyAsh} />
                  <CompactResultItem label="矿粉" value={result.slag} />
                  <CompactResultItem label="水" value={result.water} />
                  <CompactResultItem label="外加剂" value={result.admixture} highlight />
                  <CompactResultItem label="砂" value={result.sand} />
                  <CompactResultItem label="石" value={result.stone} />
                </div>

                <div className="flex flex-col lg:flex-row gap-4 min-h-[180px]">
                  {/* Chart Area */}
                  <div className="flex-1 min-h-[150px] relative border border-concrete-100 rounded-lg p-2">
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value} kg`} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-2 left-2 text-xs font-bold text-concrete-400">质量占比图</div>
                  </div>

                  {/* Notes & Specs Area */}
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="p-3 bg-concrete-800 text-white rounded-lg flex items-center justify-between shadow-md">
                      <span className="text-xs text-concrete-300">混凝土容重 (计算值)</span>
                      <span className="text-lg font-bold">
                        {result.cement + result.water + result.sand + result.stone + (result.flyAsh || 0) + (result.slag || 0)}
                        <span className="text-xs font-normal text-concrete-400 ml-1">kg/m³</span>
                      </span>
                    </div>

                    {result.notes && (
                      <div className="flex-1 bg-primary-50 p-3 rounded-lg border border-primary-100 text-xs text-primary-900 overflow-y-auto max-h-[150px]">
                        <strong>说明：</strong> {result.notes}
                      </div>
                    )}

                    {result.referencedStandards && (
                      <div className="p-3 bg-concrete-50 rounded-lg border border-concrete-100">
                        <h4 className="text-xs font-semibold text-concrete-600 mb-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> 依据标准</h4>
                        <ul className="text-[10px] text-concrete-500 list-disc list-inside">
                          {result.referencedStandards.map((std, i) => <li key={i}>{std}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-concrete-300">
              <ArrowDownCircle className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">请在左侧输入参数并点击计算</p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

const CompactResultItem = ({ label, value, highlight = false }: { label: string, value?: number, highlight?: boolean }) => (
  <div className={`p-2 rounded text-center border ${highlight ? 'bg-primary-50 border-primary-200' : 'bg-concrete-50 border-concrete-100'}`}>
    <div className="text-[10px] text-concrete-500 mb-0.5">{label}</div>
    <div className={`text-base font-bold ${highlight ? 'text-primary-700' : 'text-concrete-800'}`}>
      {value || 0}
    </div>
  </div>
);
