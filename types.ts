export enum MixGrade {
  C15 = 'C15',
  C20 = 'C20',
  C25 = 'C25',
  C30 = 'C30',
  C35 = 'C35',
  C40 = 'C40',
  C45 = 'C45',
  C50 = 'C50',
  C55 = 'C55',
  C60 = 'C60'
}

export enum SlumpType {
  LOW = '10-30mm',
  MEDIUM = '30-50mm',
  HIGH = '50-90mm',
  PUMP = '160-200mm'
}

export enum SeasonType {
  STANDARD = '常温 (春秋)',
  SUMMER = '夏季 (高温)',
  WINTER = '冬季 (低温)'
}

export interface MixDesignResult {
  cement: number;
  water: number;
  sand: number;
  stone: number;
  admixture: number; // kg per m3
  flyAsh?: number;
  slag?: number;
  wcr: number; // Water-Cement Ratio
  sandRatio: number; // Percentage
  strengthGrade: string;
  notes: string;
  referencedStandards: string[]; // List of standards used (e.g. JGJ 55-2011, DB11/T...)
}

export interface AdmixtureConfig {
  type: string;
  dosagePercent: number; // % of cementitious material
  solidContent: number; // %
  waterReducingRate: number; // %
}

export interface MixHistoryItem {
  id: string;
  timestamp: number;
  formData: {
    grade: MixGrade;
    slump: SlumpType;
    maxSize: number;
    flyAsh: boolean;
    region: string;
    season: SeasonType;
  };
  result: MixDesignResult;
  // 计算模式（可选）：'AI' | 'STD_SIMPLE' | 'STD_DETAIL'
  mode?: 'AI' | 'STD_SIMPLE' | 'STD_DETAIL';
}

// Navigation View State
export type ViewState = 'HOME' | 'MIX_CALC' | 'SAND_RATIO' | 'ADMIXTURE' | 'TRIAL_BATCH' | 'HELP';

// ========== 原材料类型定义 ==========

// 1. 水泥类
export enum CementType {
  PORTLAND = '硅酸盐水泥',
  ORDINARY = '普通硅酸盐水泥',
  SLAG = '矿渣硅酸盐水泥',
  FLY_ASH = '粉煤灰硅酸盐水泥',
  POZZOLANIC = '火山灰质硅酸盐水泥',
  COMPOSITE = '复合硅酸盐水泥'
}

export enum CementGrade {
  G32_5 = '32.5',
  G32_5R = '32.5R',
  G42_5 = '42.5',
  G42_5R = '42.5R',
  G52_5 = '52.5',
  G52_5R = '52.5R',
  G62_5 = '62.5',
  G62_5R = '62.5R'
}

export interface CementData {
  manufacturer: string;
  type: CementType | '';
  grade: CementGrade | '';
  strength28d: number | '';
  initialSettingTime: number | '';
  finalSettingTime: number | '';
  soundness: string;
  standardConsistency: number | '';
}

// 2. 细骨料类（砂）
export enum FineAggregateType {
  NATURAL_RIVER = '天然砂（河砂）',
  NATURAL_SEA = '天然砂（海砂）',
  NATURAL_MOUNTAIN = '天然砂（山砂）',
  MECHANICAL = '机制砂',
  MIXED = '混合砂'
}

export enum FineAggregateGrade {
  COARSE = '粗砂（3.7-3.1）',
  MEDIUM = '中砂（3.0-2.3）',
  FINE = '细砂（2.2-1.6）',
  VERY_FINE = '特细砂（1.5-0.7）'
}

export enum FineAggregateQuality {
  CLASS_I = 'I类',
  CLASS_II = 'II类',
  CLASS_III = 'III类'
}

export interface FineAggregateData {
  manufacturer: string;
  type: FineAggregateType | '';
  grade: FineAggregateGrade | '';
  quality: FineAggregateQuality | '';
  finenessModulus: number | '';
  clayContent: number | '';
  clayLumpContent: number | '';
  moistureContent: number | '';
  bulkDensity: number | '';
  apparentDensity: number | '';
  soundness: number | '';
}

// 3. 粗骨料类（石）
export enum CoarseAggregateType {
  CRUSHED = '碎石',
  GRAVEL = '卵石'
}

export enum GradationType {
  CONTINUOUS = '连续粒级',
  DISCONTINUOUS = '间断粒级'
}

export enum NominalSize {
  // 连续粒级
  C5_10 = '5-10',
  C5_16 = '5-16',
  C5_20 = '5-20',
  C5_25 = '5-25',
  C5_31_5 = '5-31.5',
  C5_40 = '5-40',
  // 间断粒级
  D10_20 = '10-20',
  D16_31_5 = '16-31.5',
  D20_40 = '20-40',
  D31_5_63 = '31.5-63',
  D40_80 = '40-80'
}

export interface CoarseAggregateData {
  manufacturer: string;
  type: CoarseAggregateType | '';
  gradationType: GradationType | '';
  nominalSize: NominalSize | '';
  maxNominalSize: number | '';
  clayContent: number | '';
  clayLumpContent: number | '';
  moistureContent: number | '';
  bulkDensity: number | '';
  apparentDensity: number | '';
  crushingIndex: number | '';
  flakyContent: number | '';
}

// 4. 粉煤灰类
export enum FlyAshType {
  CLASS_F = 'F类（火力发电厂烟煤燃烧）',
  CLASS_C = 'C类（火力发电厂褐煤燃烧）'
}

export enum FlyAshGrade {
  GRADE_I = 'I级',
  GRADE_II = 'II级',
  GRADE_III = 'III级'
}

export interface FlyAshData {
  manufacturer: string;
  type: FlyAshType | '';
  grade: FlyAshGrade | '';
  strengthActivityIndex: number | '';
  waterDemandRatio: number | '';
  lossOnIgnition: number | '';
  moistureContent: number | '';
  fineness: number | '';
  dosage: number | '';
}

// 5. 矿粉类
export enum SlagPowderGrade {
  S75 = 'S75',
  S95 = 'S95',
  S105 = 'S105',
  S115 = 'S115'
}

export interface SlagPowderData {
  manufacturer: string;
  grade: SlagPowderGrade | '';
  activityGrade: string;
  strengthActivityIndex: number | '';
  specificSurfaceArea: number | '';
  waterDemandRatio: number | '';
  lossOnIgnition: number | '';
  fluidityRatio: number | '';
  dosage: number | '';
}

// 6. 减水剂类
export enum WaterReducerType {
  HIGH_PERFORMANCE = '高性能减水剂',
  HIGH_EFFICIENCY = '高效减水剂',
  NORMAL = '普通减水剂',
  RETARDING = '缓凝减水剂',
  AIR_ENTRAINING = '引气减水剂'
}

export enum WaterReducerCategory {
  // 高性能减水剂
  HP_POLYCARBOXYLATE = '聚羧酸系',
  HP_NAPHTHALENE = '萘系',
  HP_AMINOSULFONATE = '氨基磺酸盐系',
  // 高效减水剂
  HE_NAPHTHALENE = '萘系',
  HE_MELAMINE = '密胺系',
  HE_AMINOSULFONATE = '氨基磺酸盐系',
  // 普通减水剂
  N_LIGNOSULFONATE = '木质素磺酸盐类',
  // 缓凝减水剂
  R_LIGNOSULFONATE = '木质素磺酸盐类',
  R_SUGAR_CALCIUM = '糖钙类',
  // 引气减水剂
  A_ROSIN = '松香类',
  A_ALKYLBENZENE = '烷基苯磺酸盐类'
}

export interface WaterReducerData {
  manufacturer: string;
  type: WaterReducerType | '';
  category: WaterReducerCategory | '';
  waterReductionRate: number | '';
  dosage: number | '';
  solidContent: number | '';
  slumpRetention30min: number | '';
  slumpRetention60min: number | '';
  settingTimeDifference: number | '';
}

// 7. 其他外加剂类
export enum OtherAdmixtureType {
  RETARDER = '缓凝剂',
  ACCELERATOR = '早强剂',
  AIR_ENTRAINER = '引气剂',
  EXPANSIVE = '膨胀剂',
  WATERPROOF = '防水剂',
  ANTIFREEZE = '防冻剂'
}

export interface OtherAdmixtureData {
  manufacturer: string;
  type: OtherAdmixtureType | '';
  model: string;
  dosage: number | '';
  mainFunctionIndex: string;
  applicableTempRange: string;
}

// 8. 其他掺合料类
export enum OtherAdditiveType {
  SILICA_FUME = '硅灰',
  GROUND_SLAG = '磨细矿渣粉',
  LIMESTONE_POWDER = '石灰石粉',
  METAKAOLIN = '偏高岭土'
}

export interface OtherAdditiveData {
  manufacturer: string;
  type: OtherAdditiveType | '';
  specification: string;
  dosage: number | '';
  mainPerformanceIndex: string;
  applicableRange: string;
}

// 完整的原材料数据集合
export interface RawMaterialsData {
  cement: CementData;
  fineAggregate: FineAggregateData;
  coarseAggregate: CoarseAggregateData;
  flyAsh: FlyAshData;
  slagPowder: SlagPowderData;
  waterReducer: WaterReducerData;
  otherAdmixture: OtherAdmixtureData;
  otherAdditive: OtherAdditiveData;
}