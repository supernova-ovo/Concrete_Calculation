import {
  FlyAshGrade,
  SlagPowderGrade,
  WaterReducerType,
  FineAggregateGrade
} from '../types';
import {
  getFlyAshLimits,
  getSlagPowderLimits,
  getWaterReducerLimits,
  getFinenessModulusRange
} from './linkageRules';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  warning?: string;
}

// 粉煤灰验证
export function validateFlyAsh(
  grade: FlyAshGrade | '',
  strengthActivityIndex: number | '',
  waterDemandRatio: number | '',
  lossOnIgnition: number | ''
): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (!grade) return results;
  
  const limits = getFlyAshLimits(grade);
  if (!limits) return results;

  if (strengthActivityIndex !== '') {
    const value = Number(strengthActivityIndex);
    if (value < limits.strengthActivityIndex.min) {
      results.push({
        isValid: false,
        message: `强度活性指数 ${value}% 低于标准限值 ${limits.strengthActivityIndex.min}%`
      });
    }
  }

  if (waterDemandRatio !== '') {
    const value = Number(waterDemandRatio);
    if (value > limits.waterDemandRatio.max) {
      results.push({
        isValid: false,
        message: `需水量比 ${value}% 超过标准限值 ${limits.waterDemandRatio.max}%`
      });
    }
  }

  if (lossOnIgnition !== '') {
    const value = Number(lossOnIgnition);
    if (value > limits.lossOnIgnition.max) {
      results.push({
        isValid: false,
        message: `烧失量 ${value}% 超过标准限值 ${limits.lossOnIgnition.max}%`
      });
    }
  }

  return results;
}

// 矿粉验证
export function validateSlagPowder(
  grade: SlagPowderGrade | '',
  strengthActivityIndex: number | '',
  specificSurfaceArea: number | ''
): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (!grade) return results;
  
  const limits = getSlagPowderLimits(grade);
  if (!limits) return results;

  if (strengthActivityIndex !== '') {
    const value = Number(strengthActivityIndex);
    if (limits.strengthActivityIndex.min && value < limits.strengthActivityIndex.min) {
      results.push({
        isValid: false,
        message: `强度活性指数 ${value}% 低于标准限值 ${limits.strengthActivityIndex.min}%`
      });
    }
    if (limits.strengthActivityIndex.max && value > limits.strengthActivityIndex.max) {
      results.push({
        isValid: false,
        message: `强度活性指数 ${value}% 超过标准限值 ${limits.strengthActivityIndex.max}%`
      });
    }
  }

  if (specificSurfaceArea !== '') {
    const value = Number(specificSurfaceArea);
    if (value < limits.specificSurfaceArea.min) {
      results.push({
        isValid: false,
        message: `比表面积 ${value} m²/kg 低于标准限值 ${limits.specificSurfaceArea.min} m²/kg`
      });
    }
  }

  return results;
}

// 减水剂验证
export function validateWaterReducer(
  type: WaterReducerType | '',
  waterReductionRate: number | '',
  dosage: number | ''
): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (!type) return results;
  
  const limits = getWaterReducerLimits(type);
  if (!limits) return results;

  if (waterReductionRate !== '') {
    const value = Number(waterReductionRate);
    if (value < limits.waterReductionRate.min) {
      results.push({
        isValid: false,
        message: `减水率 ${value}% 低于标准限值 ${limits.waterReductionRate.min}%`
      });
    }
  }

  if (dosage !== '') {
    const value = Number(dosage);
    if (value < limits.dosageRange.min || value > limits.dosageRange.max) {
      results.push({
        isValid: false,
        warning: `掺量 ${value}% 超出推荐范围 ${limits.dosageRange.min}% - ${limits.dosageRange.max}%`
      });
    }
  }

  return results;
}

// 细骨料细度模数验证
export function validateFinenessModulus(
  grade: FineAggregateGrade | '',
  finenessModulus: number | ''
): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (!grade || finenessModulus === '') return results;
  
  const range = getFinenessModulusRange(grade);
  if (!range) return results;

  const value = Number(finenessModulus);
  if (value < range.min || value > range.max) {
    results.push({
      isValid: false,
      message: `细度模数 ${value} 超出 ${grade} 的范围 ${range.min} - ${range.max}`
    });
  }

  return results;
}

// 通用数值范围验证
export function validateRange(
  value: number | '',
  min?: number,
  max?: number,
  fieldName: string = '数值'
): ValidationResult | null {
  if (value === '') return null;
  
  const numValue = Number(value);
  
  if (min !== undefined && numValue < min) {
    return {
      isValid: false,
      message: `${fieldName} ${numValue} 低于最小值 ${min}`
    };
  }
  
  if (max !== undefined && numValue > max) {
    return {
      isValid: false,
      message: `${fieldName} ${numValue} 超过最大值 ${max}`
    };
  }
  
  return { isValid: true };
}

