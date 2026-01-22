import React, { useState, useEffect } from 'react';
import {
  CementData, FineAggregateData, CoarseAggregateData, FlyAshData,
  SlagPowderData, WaterReducerData, OtherAdmixtureData, OtherAdditiveData,
  CementType, CementGrade, FineAggregateType, FineAggregateGrade,
  CoarseAggregateType, GradationType, NominalSize, FlyAshType, FlyAshGrade,
  SlagPowderGrade, WaterReducerType, WaterReducerCategory, OtherAdmixtureType, OtherAdditiveType,
  RawMaterialsData
} from '../types';
import { Input, Select } from './UIComponents';
import {
  getCementGrades,
  getFineAggregateGrades,
  getFinenessModulusRange,
  getGradationTypes, getNominalSizes, getMaxNominalSize,
  getFlyAshLimits,
  getSlagPowderActivityGrade, getSlagPowderLimits,
  getWaterReducerCategories, getWaterReducerLimits,
  getOtherAdmixtureModels, getOtherAdmixtureDosageRange,
  getOtherAdditiveSpecifications, getOtherAdditiveDosageRange
} from '../utils/linkageRules';
import {
  validateFlyAsh,
  validateSlagPowder,
  validateWaterReducer,
  validateFinenessModulus
} from '../utils/validation';
import { AlertCircle } from 'lucide-react';

interface RawMaterialsInputProps {
  materials: {
    cement: CementData;
    fineAggregate: FineAggregateData;
    coarseAggregate: CoarseAggregateData;
    flyAsh: FlyAshData;
    slagPowder: SlagPowderData;
    waterReducer: WaterReducerData;
    otherAdmixture: OtherAdmixtureData;
    otherAdditive: OtherAdditiveData;
  };
  onMaterialsChange: (materials: any) => void;
}

export const RawMaterialsInput: React.FC<RawMaterialsInputProps> = ({ materials, onMaterialsChange }) => {
  const [activeTab, setActiveTab] = useState<string>('cement');

  const updateMaterial = (category: string, field: string, value: any) => {
    const currentCategory = materials[category as keyof typeof materials] as any;
    // 创建全新的对象，确保React能检测到变化
    const updatedMaterials: RawMaterialsData = {
      ...materials,
      [category]: {
        ...currentCategory,
        [field]: value
      }
    };
    // 确保状态更新
    onMaterialsChange(updatedMaterials);
  };

  // 批量更新多个字段（避免连续调用导致状态不同步）
  const updateMaterialFields = (category: string, updates: Record<string, any>) => {
    const currentCategory = materials[category as keyof typeof materials] as any;
    const updatedMaterials: RawMaterialsData = {
      ...materials,
      [category]: {
        ...currentCategory,
        ...updates
      }
    };
    onMaterialsChange(updatedMaterials);
  };

  // 水泥联动
  useEffect(() => {
    if (materials.cement.type && !getCementGrades(materials.cement.type).includes(materials.cement.grade as CementGrade)) {
      updateMaterial('cement', 'grade', '');
    }
  }, [materials.cement.type]);

  // 细骨料联动
  useEffect(() => {
    if (materials.fineAggregate.type && !getFineAggregateGrades(materials.fineAggregate.type).includes(materials.fineAggregate.grade as FineAggregateGrade)) {
      updateMaterial('fineAggregate', 'grade', '');
    }
  }, [materials.fineAggregate.type]);

  // 粗骨料联动
  useEffect(() => {
    if (materials.coarseAggregate.type && !getGradationTypes(materials.coarseAggregate.type).includes(materials.coarseAggregate.gradationType as GradationType)) {
      updateMaterial('coarseAggregate', 'gradationType', '');
      updateMaterial('coarseAggregate', 'nominalSize', '');
      updateMaterial('coarseAggregate', 'maxNominalSize', '');
    }
  }, [materials.coarseAggregate.type]);

  useEffect(() => {
    if (materials.coarseAggregate.gradationType && !getNominalSizes(materials.coarseAggregate.gradationType).includes(materials.coarseAggregate.nominalSize as NominalSize)) {
      updateMaterial('coarseAggregate', 'nominalSize', '');
      updateMaterial('coarseAggregate', 'maxNominalSize', '');
    }
  }, [materials.coarseAggregate.gradationType]);

  useEffect(() => {
    if (materials.coarseAggregate.nominalSize) {
      const maxSize = getMaxNominalSize(materials.coarseAggregate.nominalSize as NominalSize);
      if (maxSize !== null) {
        updateMaterial('coarseAggregate', 'maxNominalSize', maxSize);
      }
    }
  }, [materials.coarseAggregate.nominalSize]);

  // 减水剂联动
  useEffect(() => {
    if (materials.waterReducer.type && !getWaterReducerCategories(materials.waterReducer.type).includes(materials.waterReducer.category as WaterReducerCategory)) {
      updateMaterial('waterReducer', 'category', '');
    }
  }, [materials.waterReducer.type]);

  // 其他外加剂联动
  useEffect(() => {
    if (materials.otherAdmixture.type && !getOtherAdmixtureModels(materials.otherAdmixture.type).includes(materials.otherAdmixture.model)) {
      updateMaterial('otherAdmixture', 'model', '');
    }
  }, [materials.otherAdmixture.type]);

  // 其他掺合料联动
  useEffect(() => {
    if (materials.otherAdditive.type && !getOtherAdditiveSpecifications(materials.otherAdditive.type).includes(materials.otherAdditive.specification)) {
      updateMaterial('otherAdditive', 'specification', '');
    }
  }, [materials.otherAdditive.type]);

  const tabs = [
    { id: 'cement', label: '水泥', icon: '🏗️' },
    { id: 'fineAggregate', label: '细骨料', icon: '🏖️' },
    { id: 'coarseAggregate', label: '粗骨料', icon: '🪨' },
    { id: 'flyAsh', label: '粉煤灰', icon: '⚫' },
    { id: 'slagPowder', label: '矿粉', icon: '🔷' },
    { id: 'waterReducer', label: '减水剂', icon: '💧' },
    { id: 'otherAdmixture', label: '其他外加剂', icon: '🧪' },
    { id: 'otherAdditive', label: '其他掺合料', icon: '✨' }
  ];

  const renderCementInput = () => {
    const cement = materials.cement;
    const availableGrades = getCementGrades(cement.type as CementType);

    return (
      <div className="space-y-3">
        <Input
          label="生产厂家"
          value={cement.manufacturer}
          onChange={(e) => updateMaterial('cement', 'manufacturer', e.target.value)}
        />
        <Select
          label="水泥名称/品种"
          value={String(cement.type || '')}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== materials.cement.type) {
              // 一次性更新type和grade，避免状态不同步
              updateMaterialFields('cement', { type: newValue, grade: '' });
            }
          }}
          options={Object.values(CementType).map(v => ({ value: v, label: v }))}
        />
        <Select
          label="水泥规格/等级"
          value={cement.grade || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== cement.grade) {
              updateMaterial('cement', 'grade', newValue);
            }
          }}
          options={availableGrades.map(v => ({ value: v, label: v }))}
          disabled={!cement.type || availableGrades.length === 0}
        />
        {!cement.type && (
          <div className="text-xs text-concrete-500 mt-1">
            请先选择水泥名称/品种
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="28天强度 (MPa)"
            type="number"
            value={cement.strength28d}
            onChange={(e) => updateMaterial('cement', 'strength28d', e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label="标准稠度用水量 (%)"
            type="number"
            step="0.1"
            value={cement.standardConsistency}
            onChange={(e) => updateMaterial('cement', 'standardConsistency', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="初凝时间 (min)"
            type="number"
            value={cement.initialSettingTime}
            onChange={(e) => updateMaterial('cement', 'initialSettingTime', e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label="终凝时间 (min)"
            type="number"
            value={cement.finalSettingTime}
            onChange={(e) => updateMaterial('cement', 'finalSettingTime', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <Input
          label="安定性"
          value={cement.soundness}
          onChange={(e) => updateMaterial('cement', 'soundness', e.target.value)}
          placeholder="合格/不合格"
        />
      </div>
    );
  };

  const renderFineAggregateInput = () => {
    const fine = materials.fineAggregate;
    const availableGrades = getFineAggregateGrades(fine.type as FineAggregateType);
    const finenessModulusRange = getFinenessModulusRange(fine.grade as FineAggregateGrade);
    const finenessModulusValidations = validateFinenessModulus(
      fine.grade as FineAggregateGrade,
      fine.finenessModulus
    );
    const finenessModulusError = finenessModulusValidations.find(v => !v.isValid);

    return (
      <div className="space-y-3">
        <Input
          label="生产厂家"
          value={fine.manufacturer}
          onChange={(e) => updateMaterial('fineAggregate', 'manufacturer', e.target.value)}
        />
        <Select
          label="细骨料名称/品种"
          value={fine.type || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== fine.type) {
              updateMaterialFields('fineAggregate', { type: newValue, grade: '' });
            }
          }}
          options={Object.values(FineAggregateType).map(v => ({ value: v, label: v }))}
        />
        <Select
          label="细骨料规格/等级"
          value={fine.grade || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== fine.grade) {
              updateMaterial('fineAggregate', 'grade', newValue);
            }
          }}
          options={availableGrades.map(v => ({ value: v, label: v }))}
          disabled={!fine.type}
        />

        <div>
          <Input
            label="细度模数"
            type="number"
            step="0.1"
            value={fine.finenessModulus}
            onChange={(e) => updateMaterial('fineAggregate', 'finenessModulus', e.target.value ? Number(e.target.value) : '')}
            disabled={!fine.grade}
            placeholder={finenessModulusRange ? `${finenessModulusRange.min} ~ ${finenessModulusRange.max}` : '请先选择细骨料规格/等级'}
          />
          {finenessModulusRange && (
            <div className="text-xs text-concrete-500 mt-1">
              要求范围：{finenessModulusRange.min} ~ {finenessModulusRange.max}
            </div>
          )}
          {finenessModulusError && (
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
              <AlertCircle className="w-3 h-3" />
              <span>{finenessModulusError.message}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCoarseAggregateInput = () => {
    const coarse = materials.coarseAggregate;
    const availableGradations = getGradationTypes(coarse.type as CoarseAggregateType);
    const availableSizes = getNominalSizes(coarse.gradationType as GradationType);

    return (
      <div className="space-y-3">
        <Input
          label="生产厂家"
          value={coarse.manufacturer}
          onChange={(e) => updateMaterial('coarseAggregate', 'manufacturer', e.target.value)}
        />
        <Select
          label="粗骨料名称/品种"
          value={coarse.type || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== coarse.type) {
              updateMaterialFields('coarseAggregate', {
                type: newValue,
                gradationType: '',
                nominalSize: '',
                maxNominalSize: ''
              });
            }
          }}
          options={Object.values(CoarseAggregateType).map(v => ({ value: v, label: v }))}
        />
        <Select
          label="颗粒级配类型"
          value={coarse.gradationType || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== coarse.gradationType) {
              updateMaterialFields('coarseAggregate', {
                gradationType: newValue,
                nominalSize: '',
                maxNominalSize: ''
              });
            }
          }}
          options={availableGradations.map(v => ({ value: v, label: v }))}
          disabled={!coarse.type}
        />
        <Select
          label="公称粒级 (mm)"
          value={coarse.nominalSize || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== coarse.nominalSize) {
              updateMaterial('coarseAggregate', 'nominalSize', newValue);
            }
          }}
          options={availableSizes.map(v => ({ value: v, label: v }))}
          disabled={!coarse.gradationType}
        />
        <Input
          label="最大公称粒径 (mm)"
          type="number"
          value={coarse.maxNominalSize}
          onChange={(e) => updateMaterial('coarseAggregate', 'maxNominalSize', e.target.value ? Number(e.target.value) : '')}
          disabled={!!coarse.nominalSize}
        />
      </div>
    );
  };

  const renderFlyAshInput = () => {
    const flyAsh = materials.flyAsh;
    const limits = getFlyAshLimits(flyAsh.grade as FlyAshGrade);

    return (
      <div className="space-y-3">
        <Input
          label="生产厂家"
          value={flyAsh.manufacturer}
          onChange={(e) => updateMaterial('flyAsh', 'manufacturer', e.target.value)}
        />
        <Select
          label="粉煤灰名称/品种"
          value={flyAsh.type || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== flyAsh.type) {
              updateMaterial('flyAsh', 'type', newValue);
            }
          }}
          options={Object.values(FlyAshType).map(v => ({ value: v, label: v }))}
        />
        <Select
          label="粉煤灰规格/等级"
          value={flyAsh.grade || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== flyAsh.grade) {
              updateMaterial('flyAsh', 'grade', newValue);
            }
          }}
          options={Object.values(FlyAshGrade).map(v => ({ value: v, label: v }))}
        />
        {limits && (
          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-200">
            <div className="font-medium mb-1">标准限值参考：</div>
            <div>强度活性指数 ≥ {limits.strengthActivityIndex.min}%</div>
            <div>需水量比 ≤ {limits.waterDemandRatio.max}%</div>
            <div>烧失量 ≤ {limits.lossOnIgnition.max}%</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              label="强度活性指数 (%)"
              type="number"
              value={flyAsh.strengthActivityIndex}
              onChange={(e) => updateMaterial('flyAsh', 'strengthActivityIndex', e.target.value ? Number(e.target.value) : '')}
            />
            {(() => {
              const validations = validateFlyAsh(
                flyAsh.grade as FlyAshGrade,
                flyAsh.strengthActivityIndex,
                '',
                ''
              );
              const error = validations.find(v => !v.isValid && v.message?.includes('强度活性指数'));
              return error ? (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error.message}</span>
                </div>
              ) : null;
            })()}
          </div>
          <div>
            <Input
              label="需水量比 (%)"
              type="number"
              step="0.1"
              value={flyAsh.waterDemandRatio}
              onChange={(e) => updateMaterial('flyAsh', 'waterDemandRatio', e.target.value ? Number(e.target.value) : '')}
            />
            {(() => {
              const validations = validateFlyAsh(
                flyAsh.grade as FlyAshGrade,
                '',
                flyAsh.waterDemandRatio,
                ''
              );
              const error = validations.find(v => !v.isValid && v.message?.includes('需水量比'));
              return error ? (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error.message}</span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              label="烧失量 (%)"
              type="number"
              step="0.1"
              value={flyAsh.lossOnIgnition}
              onChange={(e) => updateMaterial('flyAsh', 'lossOnIgnition', e.target.value ? Number(e.target.value) : '')}
            />
            {(() => {
              const validations = validateFlyAsh(
                flyAsh.grade as FlyAshGrade,
                '',
                '',
                flyAsh.lossOnIgnition
              );
              const error = validations.find(v => !v.isValid && v.message?.includes('烧失量'));
              return error ? (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error.message}</span>
                </div>
              ) : null;
            })()}
          </div>
          <Input
            label="含水率 (%)"
            type="number"
            step="0.1"
            value={flyAsh.moistureContent}
            onChange={(e) => updateMaterial('flyAsh', 'moistureContent', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="细度 (45μm方孔筛筛余) (%)"
            type="number"
            step="0.1"
            value={flyAsh.fineness}
            onChange={(e) => updateMaterial('flyAsh', 'fineness', e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label="掺量 (%)"
            type="number"
            step="0.1"
            value={flyAsh.dosage}
            onChange={(e) => updateMaterial('flyAsh', 'dosage', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
      </div>
    );
  };

  const renderSlagPowderInput = () => {
    const slag = materials.slagPowder;
    const activityGrade = getSlagPowderActivityGrade(slag.grade as SlagPowderGrade);
    const limits = getSlagPowderLimits(slag.grade as SlagPowderGrade);

    return (
      <div className="space-y-3">
        <Input
          label="生产厂家"
          value={slag.manufacturer}
          onChange={(e) => updateMaterial('slagPowder', 'manufacturer', e.target.value)}
        />
        <Select
          label="矿粉规格/等级"
          value={slag.grade || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== slag.grade) {
              const activity = getSlagPowderActivityGrade(newValue as SlagPowderGrade);
              updateMaterialFields('slagPowder', { grade: newValue, activityGrade: activity });
            }
          }}
          options={Object.values(SlagPowderGrade).map(v => ({ value: v, label: v }))}
        />
        {activityGrade && (
          <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 border border-blue-200">
            <span className="font-medium">活性等级：</span>{activityGrade}
          </div>
        )}
        {limits && (
          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-200">
            <div className="font-medium mb-1">标准限值参考：</div>
            {limits.strengthActivityIndex.min && (
              <div>强度活性指数 ≥ {limits.strengthActivityIndex.min}%</div>
            )}
            {limits.strengthActivityIndex.max && (
              <div>强度活性指数 ≤ {limits.strengthActivityIndex.max}%</div>
            )}
            {!limits.strengthActivityIndex.max && limits.strengthActivityIndex.min && (
              <div>强度活性指数 ≥ {limits.strengthActivityIndex.min}%</div>
            )}
            <div>比表面积 ≥ {limits.specificSurfaceArea.min} m²/kg</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              label="强度活性指数 (%)"
              type="number"
              value={slag.strengthActivityIndex}
              onChange={(e) => updateMaterial('slagPowder', 'strengthActivityIndex', e.target.value ? Number(e.target.value) : '')}
            />
            {(() => {
              const validations = validateSlagPowder(
                slag.grade as SlagPowderGrade,
                slag.strengthActivityIndex,
                ''
              );
              const error = validations.find(v => !v.isValid && v.message?.includes('强度活性指数'));
              return error ? (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error.message}</span>
                </div>
              ) : null;
            })()}
          </div>
          <div>
            <Input
              label="比表面积 (m²/kg)"
              type="number"
              value={slag.specificSurfaceArea}
              onChange={(e) => updateMaterial('slagPowder', 'specificSurfaceArea', e.target.value ? Number(e.target.value) : '')}
            />
            {(() => {
              const validations = validateSlagPowder(
                slag.grade as SlagPowderGrade,
                '',
                slag.specificSurfaceArea
              );
              const error = validations.find(v => !v.isValid && v.message?.includes('比表面积'));
              return error ? (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error.message}</span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="需水量比 (%)"
            type="number"
            step="0.1"
            value={slag.waterDemandRatio}
            onChange={(e) => updateMaterial('slagPowder', 'waterDemandRatio', e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label="烧失量 (%)"
            type="number"
            step="0.1"
            value={slag.lossOnIgnition}
            onChange={(e) => updateMaterial('slagPowder', 'lossOnIgnition', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="流动度比 (%)"
            type="number"
            step="0.1"
            value={slag.fluidityRatio}
            onChange={(e) => updateMaterial('slagPowder', 'fluidityRatio', e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label="掺量 (%)"
            type="number"
            step="0.1"
            value={slag.dosage}
            onChange={(e) => updateMaterial('slagPowder', 'dosage', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
      </div>
    );
  };

  const renderWaterReducerInput = () => {
    const reducer = materials.waterReducer;
    const availableCategories = getWaterReducerCategories(reducer.type as WaterReducerType);
    const limits = getWaterReducerLimits(reducer.type as WaterReducerType);

    return (
      <div className="space-y-3">
        <Input
          label="生产厂家"
          value={reducer.manufacturer}
          onChange={(e) => updateMaterial('waterReducer', 'manufacturer', e.target.value)}
        />
        <Select
          label="减水剂名称/品种"
          value={reducer.type || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== reducer.type) {
              updateMaterialFields('waterReducer', { type: newValue, category: '' });
            }
          }}
          options={Object.values(WaterReducerType).map(v => ({ value: v, label: v }))}
        />
        <Select
          label="减水剂类型"
          value={reducer.category || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== reducer.category) {
              updateMaterial('waterReducer', 'category', newValue);
            }
          }}
          options={availableCategories.map(v => ({ value: v, label: v }))}
          disabled={!reducer.type}
        />
        {limits && (
          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-200">
            <div className="font-medium mb-1">标准限值参考：</div>
            <div>减水率 ≥ {limits.waterReductionRate.min}%</div>
            <div>掺量推荐范围：{limits.dosageRange.min}% - {limits.dosageRange.max}%</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              label="减水率 (%)"
              type="number"
              step="0.1"
              value={reducer.waterReductionRate}
              onChange={(e) => updateMaterial('waterReducer', 'waterReductionRate', e.target.value ? Number(e.target.value) : '')}
            />
            {(() => {
              const validations = validateWaterReducer(
                reducer.type as WaterReducerType,
                reducer.waterReductionRate,
                ''
              );
              const error = validations.find(v => !v.isValid && v.message?.includes('减水率'));
              return error ? (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{error.message}</span>
                </div>
              ) : null;
            })()}
          </div>
          <div>
            <Input
              label="掺量 (%)"
              type="number"
              step="0.1"
              value={reducer.dosage}
              onChange={(e) => updateMaterial('waterReducer', 'dosage', e.target.value ? Number(e.target.value) : '')}
            />
            {(() => {
              const validations = validateWaterReducer(
                reducer.type as WaterReducerType,
                '',
                reducer.dosage
              );
              const warning = validations.find(v => v.warning);
              return warning ? (
                <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{warning.warning}</span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
        <Input
          label="固含量 (%)"
          type="number"
          step="0.1"
          value={reducer.solidContent}
          onChange={(e) => updateMaterial('waterReducer', 'solidContent', e.target.value ? Number(e.target.value) : '')}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="坍落度保留值 30min (mm)"
            type="number"
            value={reducer.slumpRetention30min}
            onChange={(e) => updateMaterial('waterReducer', 'slumpRetention30min', e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label="坍落度保留值 60min (mm)"
            type="number"
            value={reducer.slumpRetention60min}
            onChange={(e) => updateMaterial('waterReducer', 'slumpRetention60min', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <Input
          label="凝结时间差 (min)"
          type="number"
          value={reducer.settingTimeDifference}
          onChange={(e) => updateMaterial('waterReducer', 'settingTimeDifference', e.target.value ? Number(e.target.value) : '')}
        />
      </div>
    );
  };

  const renderOtherAdmixtureInput = () => {
    const admixture = materials.otherAdmixture;
    const availableModels = getOtherAdmixtureModels(admixture.type as OtherAdmixtureType);
    const dosageRange = getOtherAdmixtureDosageRange(admixture.type as OtherAdmixtureType);

    return (
      <div className="space-y-3">
        <Input
          label="生产厂家"
          value={admixture.manufacturer}
          onChange={(e) => updateMaterial('otherAdmixture', 'manufacturer', e.target.value)}
        />
        <Select
          label="外加剂名称/品种"
          value={admixture.type || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== admixture.type) {
              updateMaterialFields('otherAdmixture', { type: newValue, model: '' });
            }
          }}
          options={Object.values(OtherAdmixtureType).map(v => ({ value: v, label: v }))}
        />
        <Select
          label="外加剂型号"
          value={admixture.model || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== admixture.model) {
              updateMaterial('otherAdmixture', 'model', newValue);
            }
          }}
          options={availableModels.map(v => ({ value: v, label: v }))}
          disabled={!admixture.type}
        />
        {dosageRange && (
          <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 border border-blue-200">
            <span className="font-medium">掺量推荐范围：</span>{dosageRange.min}% - {dosageRange.max}%
          </div>
        )}
        <Input
          label="掺量 (%)"
          type="number"
          step="0.1"
          value={admixture.dosage}
          onChange={(e) => updateMaterial('otherAdmixture', 'dosage', e.target.value ? Number(e.target.value) : '')}
        />
        <Input
          label="主要功能指标"
          value={admixture.mainFunctionIndex}
          onChange={(e) => updateMaterial('otherAdmixture', 'mainFunctionIndex', e.target.value)}
          placeholder="根据品种填写关键参数"
        />
        <Input
          label="适用温度范围 (℃)"
          value={admixture.applicableTempRange}
          onChange={(e) => updateMaterial('otherAdmixture', 'applicableTempRange', e.target.value)}
          placeholder="如：-5℃ ~ 40℃"
        />
      </div>
    );
  };

  const renderOtherAdditiveInput = () => {
    const additive = materials.otherAdditive;
    const availableSpecs = getOtherAdditiveSpecifications(additive.type as OtherAdditiveType);
    const dosageRange = getOtherAdditiveDosageRange(additive.type as OtherAdditiveType);

    return (
      <div className="space-y-3">
        <Input
          label="生产厂家"
          value={additive.manufacturer}
          onChange={(e) => updateMaterial('otherAdditive', 'manufacturer', e.target.value)}
        />
        <Select
          label="掺合料名称/品种"
          value={additive.type || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== additive.type) {
              updateMaterialFields('otherAdditive', { type: newValue, specification: '' });
            }
          }}
          options={Object.values(OtherAdditiveType).map(v => ({ value: v, label: v }))}
        />
        <Select
          label="掺合料规格"
          value={additive.specification || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue !== additive.specification) {
              updateMaterial('otherAdditive', 'specification', newValue);
            }
          }}
          options={availableSpecs.map(v => ({ value: v, label: v }))}
          disabled={!additive.type}
        />
        {dosageRange && (
          <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 border border-blue-200">
            <span className="font-medium">掺量推荐范围：</span>{dosageRange.min}% - {dosageRange.max}%
          </div>
        )}
        <Input
          label="掺量 (%)"
          type="number"
          step="0.1"
          value={additive.dosage}
          onChange={(e) => updateMaterial('otherAdditive', 'dosage', e.target.value ? Number(e.target.value) : '')}
        />
        <Input
          label="主要性能指标"
          value={additive.mainPerformanceIndex}
          onChange={(e) => updateMaterial('otherAdditive', 'mainPerformanceIndex', e.target.value)}
          placeholder="根据品种填写关键参数"
        />
        <Input
          label="适用范围"
          value={additive.applicableRange}
          onChange={(e) => updateMaterial('otherAdditive', 'applicableRange', e.target.value)}
          placeholder="根据品种填写适用范围"
        />
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'cement': return renderCementInput();
      case 'fineAggregate': return renderFineAggregateInput();
      case 'coarseAggregate': return renderCoarseAggregateInput();
      case 'flyAsh': return renderFlyAshInput();
      case 'slagPowder': return renderSlagPowderInput();
      case 'waterReducer': return renderWaterReducerInput();
      case 'otherAdmixture': return renderOtherAdmixtureInput();
      case 'otherAdditive': return renderOtherAdditiveInput();
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-concrete-200 overflow-hidden">
      {/* 标签页导航 */}
      <div className="bg-concrete-50 border-b border-concrete-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-primary-600 text-primary-700 bg-white'
                : 'border-transparent text-concrete-600 hover:text-concrete-800 hover:bg-concrete-100'
                }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  );
};

