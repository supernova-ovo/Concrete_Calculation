import { RawMaterialsData } from '../types';

// ========== 查表数据 ==========

// 强度标准差表（表4.0.2）
export const STRENGTH_STANDARD_DEVIATION: Record<string, number> = {
  'C15': 4.0,
  'C20': 4.0,
  'C25': 5.0,
  'C30': 5.0,
  'C35': 5.0,
  'C40': 5.0,
  'C45': 5.0,
  'C50': 6.0,
  'C55': 6.0,
  'C60': 6.0,
};

// 粉煤灰影响系数（γf）计算函数
export function getFlyAshFactor(grade: string, dosage: number): number {
  const dosageDecimal = dosage / 100;

  if (grade === 'I级' || grade === 'II级') {
    if (dosage <= 10) {
      return 1.00 - 0.5 * dosageDecimal;
    } else {
      return 1.05 - dosageDecimal;
    }
  } else if (grade === 'III级') {
    if (dosage <= 10) {
      return 1.00 - 1.5 * dosageDecimal;
    } else {
      return 0.95 - dosageDecimal;
    }
  }
  return 1.0;
}

// 矿粉影响系数（γs）计算函数
export function getSlagPowderFactor(grade: string, dosage: number): number {
  const dosageDecimal = dosage / 100;

  if (grade === 'S75') {
    if (dosage <= 10) {
      return 1.00;
    } else if (dosage <= 30) {
      return 1.00 - 0.5 * (dosageDecimal - 0.1);
    } else if (dosage <= 50) {
      return 1.2 - dosageDecimal;
    }
  } else if (grade === 'S95') {
    if (dosage > 0 && dosage <= 30) {
      return 1.00;
    } else if (dosage <= 40) {
      return 1.3 - dosageDecimal;
    } else if (dosage <= 50) {
      return 0.9 - 0.5 * (dosageDecimal - 0.4);
    }
  } else if (grade === 'S105') {
    // S105在S95基础上+0.05
    if (dosage > 0 && dosage <= 30) {
      return 1.05;
    } else if (dosage <= 40) {
      return 1.35 - dosageDecimal;
    } else if (dosage <= 50) {
      return 0.95 - 0.5 * (dosageDecimal - 0.4);
    }
  }
  return 1.0;
}

// 用水量查表（表5.2.1-2）- 碎石
const WATER_DEMAND_CRUSHED: Record<number, Record<number, number>> = {
  10: { 10: 195, 30: 200, 50: 205, 70: 210, 90: 215 },
  16: { 10: 180, 30: 185, 50: 190, 70: 195, 90: 200 },
  20: { 10: 170, 30: 175, 50: 180, 70: 185, 90: 215 },
  25: { 10: 160, 30: 165, 50: 170, 70: 175, 90: 180 },
  31.5: { 10: 150, 30: 155, 50: 160, 70: 165, 90: 170 },
  40: { 10: 140, 30: 145, 50: 150, 70: 155, 90: 160 },
};

// 用水量查表（表5.2.1-2）- 卵石
const WATER_DEMAND_GRAVEL: Record<number, Record<number, number>> = {
  10: { 10: 185, 30: 190, 50: 195, 70: 200, 90: 205 },
  16: { 10: 170, 30: 175, 50: 180, 70: 185, 90: 190 },
  20: { 10: 160, 30: 165, 50: 170, 70: 175, 90: 180 },
  25: { 10: 150, 30: 155, 50: 160, 70: 165, 90: 170 },
  31.5: { 10: 140, 30: 145, 50: 150, 70: 155, 90: 160 },
  40: { 10: 130, 30: 135, 50: 140, 70: 145, 90: 150 },
};

// 线性插值函数
function interpolate(x: number, x1: number, y1: number, x2: number, y2: number): number {
  if (x1 === x2) return y1;
  return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
}

// 根据细骨料规格等级判断砂型
function getSandType(fineAggregateGrade: string): 'fine' | 'medium' | 'coarse' {
  if (fineAggregateGrade.includes('粗砂')) return 'coarse';
  if (fineAggregateGrade.includes('细砂') || fineAggregateGrade.includes('特细砂')) return 'fine';
  return 'medium'; // 默认中砂
}

// 获取用水量（查表+插值+调整）
export function getWaterDemand(
  aggregateType: string,
  maxSize: number,
  slump: number,
  fineAggregateType: string,
  fineAggregateGrade?: string
): number {
  const table = aggregateType === '碎石' ? WATER_DEMAND_CRUSHED : WATER_DEMAND_GRAVEL;

  // 找到最接近的粒径
  const sizes = Object.keys(table).map(Number).sort((a, b) => a - b);
  let size1 = sizes[0], size2 = sizes[sizes.length - 1];

  for (let i = 0; i < sizes.length - 1; i++) {
    if (maxSize >= sizes[i] && maxSize <= sizes[i + 1]) {
      size1 = sizes[i];
      size2 = sizes[i + 1];
      break;
    }
  }

  // 如果坍落度不在表中（>90），使用公式计算：water = baseWater + 5 * (slump - 90) / 20
  if (slump > 90) {
    // 取对应粒径在90mm坍落度时的基准用水量
    const baseWater = table[maxSize]?.[90] || table[size1]?.[90] || table[size2]?.[90] || 200;
    let water = baseWater + 5 * (slump - 90) / 20;
    return Math.round(water * 100) / 100;
  }

  // 如果坍落度正好是表中的值，直接查表
  const slumps = [10, 30, 50, 70, 90];
  if (slumps.includes(slump)) {
    // 直接查表，如果粒径也在表中则直接取值，否则插值
    if (table[maxSize] && table[maxSize][slump] !== undefined) {
      let water = table[maxSize][slump];
      // 按细骨料类型调整（根据规格等级判断）
      // 只有当明确指定了细骨料等级且不是中砂时才调整（表格值基于中砂）
      if (fineAggregateGrade && fineAggregateGrade.trim() !== '') {
        const sandType = getSandType(fineAggregateGrade);
        if (sandType === 'fine') {
          water += 7;
        } else if (sandType === 'coarse') {
          water -= 7;
        }
        // 中砂不调整（表格值基于中砂）
      }
      return Math.round(water * 100) / 100;
    }
  }

  // 找到最接近的坍落度用于插值
  let slump1 = slumps[0], slump2 = slumps[slumps.length - 1];
  for (let i = 0; i < slumps.length - 1; i++) {
    if (slump >= slumps[i] && slump <= slumps[i + 1]) {
      slump1 = slumps[i];
      slump2 = slumps[i + 1];
      break;
    }
  }

  // 查表或插值
  let water = 200; // 默认值

  if (table[size1] && table[size1][slump1] && table[size1][slump2]) {
    // 先按坍落度插值
    const water1 = table[size1][slump1];
    const water2 = table[size1][slump2];
    const waterAtSize1 = interpolate(slump, slump1, water1, slump2, water2);

    if (size1 === size2) {
      water = waterAtSize1;
    } else {
      // 再按粒径插值
      const water3 = table[size2]?.[slump1] || water1;
      const water4 = table[size2]?.[slump2] || water2;
      const waterAtSize2 = interpolate(slump, slump1, water3, slump2, water4);
      water = interpolate(maxSize, size1, waterAtSize1, size2, waterAtSize2);
    }
  }

  // 按细骨料类型调整（根据规格等级判断）
  // 只有当明确指定了细骨料等级且不是中砂时才调整（表格值基于中砂）
  if (fineAggregateGrade && fineAggregateGrade.trim() !== '') {
    const sandType = getSandType(fineAggregateGrade);
    if (sandType === 'fine') {
      water += 7;
    } else if (sandType === 'coarse') {
      water -= 7;
    }
    // 中砂不调整（表格值基于中砂）
  }

  return Math.round(water * 100) / 100; // 保留2位小数
}

// 砂率查表（表5.4.2）
const SAND_RATIO_TABLE: Record<number, Record<number, { min: number; max: number }>> = {
  10: {
    0.4: { min: 26, max: 32 },
    0.5: { min: 30, max: 35 },
    0.6: { min: 33, max: 38 },
    0.7: { min: 36, max: 41 },
  },
  16: {
    0.4: { min: 25, max: 31 },
    0.5: { min: 29, max: 34 },
    0.6: { min: 32, max: 37 },
    0.7: { min: 35, max: 40 },
  },
  20: {
    0.4: { min: 24, max: 30 },
    0.5: { min: 28, max: 33 },
    0.6: { min: 31, max: 36 },
    0.7: { min: 34, max: 39 },
  },
  25: {
    0.4: { min: 24, max: 30 },
    0.5: { min: 27, max: 32 },
    0.6: { min: 30, max: 35 },
    0.7: { min: 33, max: 38 },
  },
  31.5: {
    0.4: { min: 23, max: 29 },
    0.5: { min: 26, max: 31 },
    0.6: { min: 29, max: 34 },
    0.7: { min: 32, max: 37 },
  },
  40: {
    0.4: { min: 22, max: 28 },
    0.5: { min: 25, max: 30 },
    0.6: { min: 28, max: 33 },
    0.7: { min: 31, max: 36 },
  },
};

// 获取砂率（查表+插值+调整）
export function getSandRatio(
  wcr: number,
  aggregateType: string,
  maxSize: number,
  slump: number,
  fineAggregateType: string,
  fineAggregateGrade?: string
): number {
  const table = SAND_RATIO_TABLE;

  // 找到最接近的粒径
  const sizes = Object.keys(table).map(Number).sort((a, b) => a - b);
  let size1 = sizes[0], size2 = sizes[sizes.length - 1];

  for (let i = 0; i < sizes.length - 1; i++) {
    if (maxSize >= sizes[i] && maxSize <= sizes[i + 1]) {
      size1 = sizes[i];
      size2 = sizes[i + 1];
      break;
    }
  }

  // 找到最接近的水胶比
  const wcrs = [0.4, 0.5, 0.6, 0.7];
  let wcr1 = wcrs[0], wcr2 = wcrs[wcrs.length - 1];

  for (let i = 0; i < wcrs.length - 1; i++) {
    if (wcr >= wcrs[i] && wcr <= wcrs[i + 1]) {
      wcr1 = wcrs[i];
      wcr2 = wcrs[i + 1];
      break;
    }
  }

  // 查表或插值（取中值）
  let sandRatio = 35; // 默认值

  if (table[size1] && table[size1][wcr1] && table[size1][wcr2]) {
    const ratio1 = (table[size1][wcr1].min + table[size1][wcr1].max) / 2;
    const ratio2 = (table[size1][wcr2].min + table[size1][wcr2].max) / 2;
    const ratioAtSize1 = interpolate(wcr, wcr1, ratio1, wcr2, ratio2);

    if (size1 === size2) {
      sandRatio = ratioAtSize1;
    } else {
      const ratio3 = table[size2]?.[wcr1] ? (table[size2][wcr1].min + table[size2][wcr1].max) / 2 : ratio1;
      const ratio4 = table[size2]?.[wcr2] ? (table[size2][wcr2].min + table[size2][wcr2].max) / 2 : ratio2;
      const ratioAtSize2 = interpolate(wcr, wcr1, ratio3, wcr2, ratio4);
      sandRatio = interpolate(maxSize, size1, ratioAtSize1, size2, ratioAtSize2);
    }
  }

  // 按坍落度调整（>60mm时，每增大20mm，砂率增大1%）
  if (slump > 60) {
    sandRatio += Math.floor((slump - 60) / 20) * 1;
  }

  // 按细骨料类型调整（根据规格等级判断）
  const sandType = fineAggregateGrade ? getSandType(fineAggregateGrade) : 'medium';
  if (sandType === 'fine') {
    sandRatio -= 2.5; // 细砂：砂率-2~3%，取中值2.5%
  } else if (sandType === 'coarse') {
    sandRatio += 2.5; // 粗砂：砂率+2~3%，取中值2.5%
  }

  // 机制砂/人工砂调整
  if (fineAggregateType.includes('机制砂') || fineAggregateType.includes('人工砂')) {
    sandRatio += 4; // 机制砂：砂率+3~5%，取中值4%
  }

  return Math.round(sandRatio * 100) / 100; // 保留2位小数
}

// ========== 计算接口 ==========

export interface MixDesignInput {
  // 核心必填参数
  strengthGrade: string; // 设计强度等级，如 'C40'
  slump: number; // 坍落度设计值 (mm)
  aggregateType: string; // 粗骨料品种（碎石/卵石）
  maxSize: number; // 粗骨料最大公称粒径 (mm)
  fineAggregateType: string; // 细骨料品种
  fineAggregateGrade: string; // 细骨料规格等级
  finenessModulus: number; // 细度模数
  nominalSize: string; // 公称粒级 (mm)，如 '5-20'
  cementType: string; // 水泥品种
  cementGrade: string; // 水泥规格（等级）
  cementStrength28d: number; // 水泥28天强度 (MPa)
  flyAshType: string; // 粉煤灰品种
  flyAshGrade: string; // 粉煤灰规格（等级）
  flyAshDosage: number; // 粉煤灰掺量 (%)
  slagPowderGrade: string; // 矿粉规格等级
  slagPowderDosage: number; // 矿粉掺量 (%)
  waterReducerType: string; // 减水剂品种
  waterReducerRate: number; // 减水剂减水率 (%)
  admixtureDosage: number; // 减水剂掺量 (%)
  // 可选参数
  concreteDensity?: number; // 混凝土容重 (kg/m³)，默认2400
  // 自定义覆盖参数（用于简化录入模式）
  customSigma?: number; // 自定义强度标准差，如果提供则覆盖查表值
  customWaterBase?: number; // 自定义基准用水量，如果提供则覆盖查表值
  customFlyAshFactor?: number; // 自定义粉煤灰系数，如果提供则覆盖计算值
  customSlagPowderFactor?: number; // 自定义矿粉系数，如果提供则覆盖计算值
  customSandRatio?: number; // 自定义砂率，如果提供则覆盖查表值
  customAlphaA?: number; // 自定义αa系数，如果提供则覆盖默认值
  customAlphaB?: number; // 自定义αb系数，如果提供则覆盖默认值
  customWCR?: number; // 自定义水胶比，如果提供则覆盖计算值
}

export interface MixDesignResult {
  // 中间计算值
  configStrength: number; // 配制强度
  binderStrength: number; // 胶凝材料强度
  wcr: number; // 水胶比
  waterBase: number; // 未加外加剂用水量
  waterActual: number; // 实际用水量
  binderTotal: number; // 胶凝材料总用量
  sandRatio: number; // 砂率

  // 最终材料用量（kg/m³）
  water: number;
  cement: number;
  flyAsh: number;
  slagPowder: number;
  admixture: number;
  sand: number;
  stone: number;

  // 计算详情
  details: {
    sigma: number; // 强度标准差
    flyAshFactor: number; // 粉煤灰影响系数
    slagPowderFactor: number; // 矿粉影响系数
    aggregateTotal: number; // 骨料总用量
  };
}

// ========== 主计算函数 ==========

export function calculateMixDesign(input: MixDesignInput): MixDesignResult {
  const {
    strengthGrade,
    slump,
    aggregateType,
    maxSize,
    fineAggregateType,
    fineAggregateGrade,
    finenessModulus,
    nominalSize,
    cementType,
    cementGrade,
    cementStrength28d,
    flyAshType,
    flyAshGrade,
    flyAshDosage,
    slagPowderGrade,
    slagPowderDosage,
    waterReducerType,
    waterReducerRate,
    admixtureDosage,
    concreteDensity = 2400,
    // 自定义覆盖参数
    customSigma,
    customWaterBase,
    customFlyAshFactor,
    customSlagPowderFactor,
    customSandRatio,
    customAlphaA,
    customAlphaB,
    customWCR,
  } = input;

  // 确定αa和αb系数（根据骨料类型或自定义值）
  let alphaA: number;
  let alphaB: number;
  if (customAlphaA !== undefined && customAlphaB !== undefined) {
    alphaA = customAlphaA;
    alphaB = customAlphaB;
  } else {
    // 根据骨料类型确定默认值
    if (aggregateType === '碎石' || aggregateType === 'CRUSHED') {
      alphaA = 0.53;
      alphaB = 0.20;
    } else {
      alphaA = 0.46;
      alphaB = 0.07;
    }
  }

  // 步骤1：计算配制强度
  const sigma = customSigma !== undefined ? customSigma : (STRENGTH_STANDARD_DEVIATION[strengthGrade] || 5.0);
  const strengthValue = parseInt(strengthGrade.replace('C', '')) || 30;
  const configStrength = strengthValue + 1.645 * sigma;

  // 步骤2：计算胶凝材料强度
  // 粉煤灰系数：根据掺量和等级自动查表，如果掺量为0或没有等级则系数为1.0
  const flyAshFactor = customFlyAshFactor !== undefined
    ? customFlyAshFactor
    : (flyAshDosage > 0 && flyAshGrade ? getFlyAshFactor(flyAshGrade, flyAshDosage) : 1.0);

  // 矿粉系数：根据掺量和等级自动查表，如果掺量为0或没有等级则系数为1.0
  const slagPowderFactor = customSlagPowderFactor !== undefined
    ? customSlagPowderFactor
    : (slagPowderDosage > 0 && slagPowderGrade ? getSlagPowderFactor(slagPowderGrade, slagPowderDosage) : 1.0);

  // 胶凝材料组成比例（基于掺量）
  const flyAshRatio = flyAshDosage / 100;
  const slagPowderRatio = slagPowderDosage / 100;
  const cementRatio = 1 - flyAshRatio - slagPowderRatio;

  // 计算胶凝材料强度（乘法公式：水泥强度 × 粉煤灰系数 × 矿粉系数）
  // 系数根据掺量和等级自动查表得出
  let binderStrength = cementStrength28d * flyAshFactor * slagPowderFactor;

  // 步骤3：计算水胶比（严格按公式）
  const wcr = customWCR !== undefined
    ? customWCR
    : (alphaA * binderStrength) / (configStrength + alphaA * alphaB * binderStrength);
  const wcrRounded = Math.round(wcr * 1000000) / 1000000; // 保留6位小数

  // 步骤4：确定未加外加剂用水量（查表+调整或使用自定义值）
  const waterBase = customWaterBase !== undefined
    ? customWaterBase
    : getWaterDemand(aggregateType, maxSize, slump, fineAggregateType, fineAggregateGrade);

  // 步骤5：计算实际用水量（严格按公式）
  const waterActual = Math.round(waterBase * (1 - waterReducerRate / 100));

  // 步骤6：计算胶凝材料总用量（严格按公式）
  let binderTotal = waterActual / wcrRounded;
  binderTotal = Math.round(binderTotal * 1000000) / 1000000; // 保留6位小数

  // 步骤7：计算各胶凝材料单用量（严格按公式）
  const flyAsh = Math.round(binderTotal * flyAshRatio);
  const slagPowder = Math.round(binderTotal * slagPowderRatio);
  const cement = Math.round(binderTotal - flyAsh - slagPowder);

  // 步骤8：计算外加剂用量（严格按公式）
  const admixture = Math.round(binderTotal * (admixtureDosage / 100) * 10) / 10; // 保留1位小数

  // 步骤9：确定砂率（查表+调整或使用自定义值）
  const sandRatio = customSandRatio !== undefined
    ? customSandRatio
    : getSandRatio(wcrRounded, aggregateType, maxSize, slump, fineAggregateType, fineAggregateGrade);
  const sandRatioRounded = Math.round(sandRatio * 100) / 100;

  // 步骤10：计算骨料总用量及砂、石单用量（严格按公式）
  // 按甲方Excel逻辑修正：采用“外掺法”，外加剂不占用2400容重份额
  const aggregateTotal = concreteDensity - waterActual - binderTotal;
  const sand = Math.round(aggregateTotal * sandRatioRounded / 100);
  const stone = Math.round(aggregateTotal - sand);

  return {
    configStrength: Math.round(configStrength * 10) / 10,
    binderStrength: Math.round(binderStrength * 10) / 10,
    wcr: wcrRounded,
    waterBase: Math.round(waterBase),
    waterActual,
    binderTotal: Math.round(binderTotal * 100) / 100,
    sandRatio: sandRatioRounded,
    water: waterActual,
    cement,
    flyAsh,
    slagPowder,
    admixture,
    sand,
    stone,
    details: {
      sigma,
      flyAshFactor: Math.round(flyAshFactor * 1000) / 1000,
      slagPowderFactor: Math.round(slagPowderFactor * 1000) / 1000,
      aggregateTotal: Math.round(aggregateTotal * 100) / 100,
    },
  };
}
