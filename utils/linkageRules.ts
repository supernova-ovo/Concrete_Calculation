import { 
  CementType, CementGrade,
  FineAggregateType, FineAggregateGrade, FineAggregateQuality,
  CoarseAggregateType, GradationType, NominalSize,
  FlyAshType, FlyAshGrade,
  SlagPowderGrade,
  WaterReducerType, WaterReducerCategory,
  OtherAdmixtureType,
  OtherAdditiveType
} from '../types';

// ========== 水泥联动规则 ==========
export const CEMENT_GRADE_MAP: Record<CementType, CementGrade[]> = {
  [CementType.PORTLAND]: [CementGrade.G42_5, CementGrade.G42_5R, CementGrade.G52_5, CementGrade.G52_5R, CementGrade.G62_5, CementGrade.G62_5R],
  [CementType.ORDINARY]: [CementGrade.G42_5, CementGrade.G42_5R, CementGrade.G52_5, CementGrade.G52_5R, CementGrade.G62_5, CementGrade.G62_5R],
  [CementType.SLAG]: [CementGrade.G32_5, CementGrade.G32_5R, CementGrade.G42_5, CementGrade.G42_5R, CementGrade.G52_5, CementGrade.G52_5R],
  [CementType.FLY_ASH]: [CementGrade.G32_5, CementGrade.G32_5R, CementGrade.G42_5, CementGrade.G42_5R, CementGrade.G52_5, CementGrade.G52_5R],
  [CementType.POZZOLANIC]: [CementGrade.G32_5, CementGrade.G32_5R, CementGrade.G42_5, CementGrade.G42_5R, CementGrade.G52_5, CementGrade.G52_5R],
  [CementType.COMPOSITE]: [CementGrade.G42_5, CementGrade.G42_5R, CementGrade.G52_5, CementGrade.G52_5R]
};

export function getCementGrades(cementType: CementType | ''): CementGrade[] {
  if (!cementType) return [];
  return CEMENT_GRADE_MAP[cementType] || [];
}

// ========== 细骨料联动规则 ==========
export const FINE_AGGREGATE_GRADE_MAP: Record<FineAggregateType, FineAggregateGrade[]> = {
  [FineAggregateType.NATURAL_RIVER]: [FineAggregateGrade.COARSE, FineAggregateGrade.MEDIUM, FineAggregateGrade.FINE, FineAggregateGrade.VERY_FINE],
  [FineAggregateType.NATURAL_SEA]: [FineAggregateGrade.COARSE, FineAggregateGrade.MEDIUM, FineAggregateGrade.FINE, FineAggregateGrade.VERY_FINE],
  [FineAggregateType.NATURAL_MOUNTAIN]: [FineAggregateGrade.COARSE, FineAggregateGrade.MEDIUM, FineAggregateGrade.FINE, FineAggregateGrade.VERY_FINE],
  [FineAggregateType.MECHANICAL]: [FineAggregateGrade.COARSE, FineAggregateGrade.MEDIUM, FineAggregateGrade.FINE],
  [FineAggregateType.MIXED]: [FineAggregateGrade.COARSE, FineAggregateGrade.MEDIUM, FineAggregateGrade.FINE, FineAggregateGrade.VERY_FINE]
};

export const FINENESS_MODULUS_RANGE: Record<FineAggregateGrade, { min: number; max: number }> = {
  [FineAggregateGrade.COARSE]: { min: 3.1, max: 3.7 },
  [FineAggregateGrade.MEDIUM]: { min: 2.3, max: 3.0 },
  [FineAggregateGrade.FINE]: { min: 1.6, max: 2.2 },
  [FineAggregateGrade.VERY_FINE]: { min: 0.7, max: 1.5 }
};

export function getFineAggregateGrades(aggregateType: FineAggregateType | ''): FineAggregateGrade[] {
  if (!aggregateType) return [];
  return FINE_AGGREGATE_GRADE_MAP[aggregateType] || [];
}

export function getFinenessModulusRange(grade: FineAggregateGrade | ''): { min: number; max: number } | null {
  if (!grade) return null;
  return FINENESS_MODULUS_RANGE[grade] || null;
}

// ========== 粗骨料联动规则 ==========
export const GRADATION_TYPE_MAP: Record<CoarseAggregateType, GradationType[]> = {
  [CoarseAggregateType.CRUSHED]: [GradationType.CONTINUOUS, GradationType.DISCONTINUOUS],
  [CoarseAggregateType.GRAVEL]: [GradationType.CONTINUOUS, GradationType.DISCONTINUOUS]
};

export const NOMINAL_SIZE_MAP: Record<GradationType, NominalSize[]> = {
  [GradationType.CONTINUOUS]: [
    NominalSize.C5_10, NominalSize.C5_16, NominalSize.C5_20,
    NominalSize.C5_25, NominalSize.C5_31_5, NominalSize.C5_40
  ],
  [GradationType.DISCONTINUOUS]: [
    NominalSize.D10_20, NominalSize.D16_31_5, NominalSize.D20_40,
    NominalSize.D31_5_63, NominalSize.D40_80
  ]
};

export const MAX_NOMINAL_SIZE_MAP: Record<NominalSize, number> = {
  [NominalSize.C5_10]: 10,
  [NominalSize.C5_16]: 16,
  [NominalSize.C5_20]: 20,
  [NominalSize.C5_25]: 25,
  [NominalSize.C5_31_5]: 31.5,
  [NominalSize.C5_40]: 40,
  [NominalSize.D10_20]: 20,
  [NominalSize.D16_31_5]: 31.5,
  [NominalSize.D20_40]: 40,
  [NominalSize.D31_5_63]: 63,
  [NominalSize.D40_80]: 80
};

export function getGradationTypes(aggregateType: CoarseAggregateType | ''): GradationType[] {
  if (!aggregateType) return [];
  return GRADATION_TYPE_MAP[aggregateType] || [];
}

export function getNominalSizes(gradationType: GradationType | ''): NominalSize[] {
  if (!gradationType) return [];
  return NOMINAL_SIZE_MAP[gradationType] || [];
}

export function getMaxNominalSize(nominalSize: NominalSize | ''): number | null {
  if (!nominalSize) return null;
  return MAX_NOMINAL_SIZE_MAP[nominalSize] || null;
}

// ========== 粉煤灰联动规则 ==========
export const FLY_ASH_LIMITS: Record<FlyAshGrade, {
  strengthActivityIndex: { min: number };
  waterDemandRatio: { max: number };
  lossOnIgnition: { max: number };
}> = {
  [FlyAshGrade.GRADE_I]: {
    strengthActivityIndex: { min: 70 },
    waterDemandRatio: { max: 105 },
    lossOnIgnition: { max: 5 }
  },
  [FlyAshGrade.GRADE_II]: {
    strengthActivityIndex: { min: 60 },
    waterDemandRatio: { max: 115 },
    lossOnIgnition: { max: 8 }
  },
  [FlyAshGrade.GRADE_III]: {
    strengthActivityIndex: { min: 50 },
    waterDemandRatio: { max: 125 },
    lossOnIgnition: { max: 15 }
  }
};

export function getFlyAshLimits(grade: FlyAshGrade | '') {
  if (!grade) return null;
  return FLY_ASH_LIMITS[grade] || null;
}

// ========== 矿粉联动规则 ==========
export const SLAG_POWDER_ACTIVITY_MAP: Record<SlagPowderGrade, string> = {
  [SlagPowderGrade.S75]: '75级（28d活性指数75%-90%）',
  [SlagPowderGrade.S95]: '95级（28d活性指数95%-105%）',
  [SlagPowderGrade.S105]: '105级（28d活性指数105%-115%）',
  [SlagPowderGrade.S115]: '115级（28d活性指数≥115%）'
};

export const SLAG_POWDER_LIMITS: Record<SlagPowderGrade, {
  strengthActivityIndex: { min?: number; max?: number };
  specificSurfaceArea: { min: number };
}> = {
  [SlagPowderGrade.S75]: {
    strengthActivityIndex: { min: 75, max: 90 },
    specificSurfaceArea: { min: 350 }
  },
  [SlagPowderGrade.S95]: {
    strengthActivityIndex: { min: 95, max: 105 },
    specificSurfaceArea: { min: 400 }
  },
  [SlagPowderGrade.S105]: {
    strengthActivityIndex: { min: 105, max: 115 },
    specificSurfaceArea: { min: 450 }
  },
  [SlagPowderGrade.S115]: {
    strengthActivityIndex: { min: 115 },
    specificSurfaceArea: { min: 450 }
  }
};

export function getSlagPowderActivityGrade(grade: SlagPowderGrade | ''): string {
  if (!grade) return '';
  return SLAG_POWDER_ACTIVITY_MAP[grade] || '';
}

export function getSlagPowderLimits(grade: SlagPowderGrade | '') {
  if (!grade) return null;
  return SLAG_POWDER_LIMITS[grade] || null;
}

// ========== 减水剂联动规则 ==========
export const WATER_REDUCER_CATEGORY_MAP: Record<WaterReducerType, WaterReducerCategory[]> = {
  [WaterReducerType.HIGH_PERFORMANCE]: [
    WaterReducerCategory.HP_POLYCARBOXYLATE,
    WaterReducerCategory.HP_NAPHTHALENE,
    WaterReducerCategory.HP_AMINOSULFONATE
  ],
  [WaterReducerType.HIGH_EFFICIENCY]: [
    WaterReducerCategory.HE_NAPHTHALENE,
    WaterReducerCategory.HE_MELAMINE,
    WaterReducerCategory.HE_AMINOSULFONATE
  ],
  [WaterReducerType.NORMAL]: [
    WaterReducerCategory.N_LIGNOSULFONATE
  ],
  [WaterReducerType.RETARDING]: [
    WaterReducerCategory.R_LIGNOSULFONATE,
    WaterReducerCategory.R_SUGAR_CALCIUM
  ],
  [WaterReducerType.AIR_ENTRAINING]: [
    WaterReducerCategory.A_ROSIN,
    WaterReducerCategory.A_ALKYLBENZENE
  ]
};

export const WATER_REDUCER_LIMITS: Record<WaterReducerType, {
  waterReductionRate: { min: number };
  dosageRange: { min: number; max: number };
}> = {
  [WaterReducerType.HIGH_PERFORMANCE]: {
    waterReductionRate: { min: 25 },
    dosageRange: { min: 0.5, max: 2.0 }
  },
  [WaterReducerType.HIGH_EFFICIENCY]: {
    waterReductionRate: { min: 20 },
    dosageRange: { min: 0.5, max: 1.5 }
  },
  [WaterReducerType.NORMAL]: {
    waterReductionRate: { min: 8 },
    dosageRange: { min: 0.2, max: 0.5 }
  },
  [WaterReducerType.RETARDING]: {
    waterReductionRate: { min: 8 },
    dosageRange: { min: 0.2, max: 0.5 }
  },
  [WaterReducerType.AIR_ENTRAINING]: {
    waterReductionRate: { min: 8 },
    dosageRange: { min: 0.2, max: 0.5 }
  }
};

export function getWaterReducerCategories(waterReducerType: WaterReducerType | ''): WaterReducerCategory[] {
  if (!waterReducerType) return [];
  return WATER_REDUCER_CATEGORY_MAP[waterReducerType] || [];
}

export function getWaterReducerLimits(waterReducerType: WaterReducerType | '') {
  if (!waterReducerType) return null;
  return WATER_REDUCER_LIMITS[waterReducerType] || null;
}

// ========== 其他外加剂联动规则 ==========
export const OTHER_ADMIXTURE_MODELS: Record<OtherAdmixtureType, string[]> = {
  [OtherAdmixtureType.RETARDER]: ['HZ-1', 'HZ-2', 'HZ-3', '其他'],
  [OtherAdmixtureType.ACCELERATOR]: ['ZS-1', 'ZS-2', 'ZS-3', '其他'],
  [OtherAdmixtureType.AIR_ENTRAINER]: ['YQ-1', 'YQ-2', 'YQ-3', '其他'],
  [OtherAdmixtureType.EXPANSIVE]: ['PN-1', 'PN-2', 'PN-3', '其他'],
  [OtherAdmixtureType.WATERPROOF]: ['FS-1', 'FS-2', 'FS-3', '其他'],
  [OtherAdmixtureType.ANTIFREEZE]: ['FD-1', 'FD-2', 'FD-3', '其他']
};

export const OTHER_ADMIXTURE_DOSAGE_RANGES: Record<OtherAdmixtureType, { min: number; max: number }> = {
  [OtherAdmixtureType.RETARDER]: { min: 0.1, max: 0.5 },
  [OtherAdmixtureType.ACCELERATOR]: { min: 0.5, max: 3.0 },
  [OtherAdmixtureType.AIR_ENTRAINER]: { min: 0.005, max: 0.05 },
  [OtherAdmixtureType.EXPANSIVE]: { min: 6, max: 12 },
  [OtherAdmixtureType.WATERPROOF]: { min: 2, max: 5 },
  [OtherAdmixtureType.ANTIFREEZE]: { min: 2, max: 5 }
};

export function getOtherAdmixtureModels(admixtureType: OtherAdmixtureType | ''): string[] {
  if (!admixtureType) return [];
  return OTHER_ADMIXTURE_MODELS[admixtureType] || [];
}

export function getOtherAdmixtureDosageRange(admixtureType: OtherAdmixtureType | ''): { min: number; max: number } | null {
  if (!admixtureType) return null;
  return OTHER_ADMIXTURE_DOSAGE_RANGES[admixtureType] || null;
}

// ========== 其他掺合料联动规则 ==========
export const OTHER_ADDITIVE_SPECIFICATIONS: Record<OtherAdditiveType, string[]> = {
  [OtherAdditiveType.SILICA_FUME]: ['SF-85', 'SF-90', 'SF-95', '其他'],
  [OtherAdditiveType.GROUND_SLAG]: ['GS-75', 'GS-95', 'GS-105', '其他'],
  [OtherAdditiveType.LIMESTONE_POWDER]: ['LS-200', 'LS-300', 'LS-400', '其他'],
  [OtherAdditiveType.METAKAOLIN]: ['MK-600', 'MK-800', 'MK-1000', '其他']
};

export const OTHER_ADDITIVE_DOSAGE_RANGES: Record<OtherAdditiveType, { min: number; max: number }> = {
  [OtherAdditiveType.SILICA_FUME]: { min: 5, max: 10 },
  [OtherAdditiveType.GROUND_SLAG]: { min: 20, max: 50 },
  [OtherAdditiveType.LIMESTONE_POWDER]: { min: 5, max: 20 },
  [OtherAdditiveType.METAKAOLIN]: { min: 5, max: 15 }
};

export function getOtherAdditiveSpecifications(additiveType: OtherAdditiveType | ''): string[] {
  if (!additiveType) return [];
  return OTHER_ADDITIVE_SPECIFICATIONS[additiveType] || [];
}

export function getOtherAdditiveDosageRange(additiveType: OtherAdditiveType | ''): { min: number; max: number } | null {
  if (!additiveType) return null;
  return OTHER_ADDITIVE_DOSAGE_RANGES[additiveType] || null;
}

