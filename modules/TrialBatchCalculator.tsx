import React, { useState } from 'react';
import { Scale, RotateCcw, Beaker, Calculator, Package } from 'lucide-react';
import { Card, Input, Button } from '../components/UIComponents';

export const TrialBatchCalculator: React.FC = () => {
  const [volume, setVolume] = useState<string>('0.03'); // m3
  
  // Use strings for input state to handle decimal typing correctly
  const [mixForm, setMixForm] = useState({
    cement: '320',
    water: '175',
    sand: '780',
    stone: '1050',
    admixture: '5.2',
    flyAsh: '80',
    slag: '0'
  });

  const handleInputChange = (field: keyof typeof mixForm, value: string) => {
    setMixForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getNum = (val: string) => parseFloat(val) || 0;

  const vol = parseFloat(volume) || 0;
  
  const trial = {
    cement: getNum(mixForm.cement) * vol,
    water: getNum(mixForm.water) * vol,
    sand: getNum(mixForm.sand) * vol,
    stone: getNum(mixForm.stone) * vol,
    admixture: getNum(mixForm.admixture) * vol,
    flyAsh: getNum(mixForm.flyAsh) * vol,
    slag: getNum(mixForm.slag) * vol
  };

  const totalWeight = Object.values(trial).reduce((a, b) => a + b, 0);

  const quickVolumes = [
    { label: '15L (试块)', val: '0.015' },
    { label: '20L (小样)', val: '0.020' },
    { label: '30L (标准)', val: '0.030' },
    { label: '50L (大样)', val: '0.050' },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top Bar: Volume Control */}
      <div className="bg-white p-3 rounded-lg border border-concrete-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
         <div className="flex items-center gap-2">
            <div className="bg-primary-100 p-2 rounded-lg text-primary-600">
               <Beaker className="w-5 h-5" />
            </div>
            <div>
               <h2 className="font-bold text-concrete-800 text-sm md:text-base">试配用量换算</h2>
               <p className="text-xs text-concrete-400">配合比 (kg/m³) → 试验室搅拌量 (kg)</p>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex gap-2 hidden md:flex">
               {quickVolumes.map((item) => (
                 <button 
                   key={item.val}
                   onClick={() => setVolume(item.val)}
                   className={`px-3 py-1.5 text-xs rounded border transition-colors ${volume === item.val ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-concrete-600 border-concrete-200 hover:border-primary-300'}`}
                 >
                   {item.label}
                 </button>
               ))}
            </div>
            <div className="flex items-center gap-2 bg-concrete-50 px-3 py-1.5 rounded-lg border border-concrete-200">
               <span className="text-sm font-medium text-concrete-600">设定体积:</span>
               <div className="relative">
                 <input 
                   className="w-20 font-bold text-lg text-primary-600 text-right bg-transparent border-b border-concrete-300 focus:outline-none focus:border-primary-600 p-0"
                   value={volume}
                   onChange={(e) => setVolume(e.target.value)}
                   type="number"
                   step="0.001"
                 />
                 <span className="absolute -right-6 bottom-0.5 text-xs text-concrete-400">m³</span>
               </div>
               <span className="text-xs text-concrete-400 ml-6">= {(vol * 1000).toFixed(1)} 升</span>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
        {/* Left: Input Panel */}
        <div className="lg:w-[400px] xl:w-[450px] flex-shrink-0 flex flex-col bg-white rounded-xl shadow-sm border border-concrete-200 overflow-hidden">
           <div className="bg-concrete-50 px-4 py-3 border-b border-concrete-200 flex items-center justify-between">
              <span className="font-bold text-concrete-700 text-sm flex items-center gap-2">
                 <Scale className="w-4 h-4" /> 基准配合比输入
              </span>
              <button 
                 onClick={() => setMixForm({ cement: '', water: '', sand: '', stone: '', admixture: '', flyAsh: '', slag: '' })}
                 className="text-xs text-concrete-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                 <RotateCcw className="w-3 h-3" /> 清空
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <Input label="水泥 (Cement)" suffix="kg" value={mixForm.cement} onChange={e => handleInputChange('cement', e.target.value)} type="number" />
                 <Input label="水 (Water)" suffix="kg" value={mixForm.water} onChange={e => handleInputChange('water', e.target.value)} type="number" />
                 <Input label="砂 (Sand)" suffix="kg" value={mixForm.sand} onChange={e => handleInputChange('sand', e.target.value)} type="number" />
                 <Input label="石 (Stone)" suffix="kg" value={mixForm.stone} onChange={e => handleInputChange('stone', e.target.value)} type="number" />
                 <Input label="粉煤灰 (FA)" suffix="kg" value={mixForm.flyAsh} onChange={e => handleInputChange('flyAsh', e.target.value)} type="number" />
                 <Input label="矿粉 (Slag)" suffix="kg" value={mixForm.slag} onChange={e => handleInputChange('slag', e.target.value)} type="number" />
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                 <Input label="外加剂 (Admixture)" suffix="kg" value={mixForm.admixture} onChange={e => handleInputChange('admixture', e.target.value)} type="number" step="0.01" className="bg-white" />
              </div>
           </div>
        </div>

        {/* Right: Result Panel */}
        <div className="flex-1 flex flex-col bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 overflow-hidden">
           <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Package className="w-5 h-5 text-emerald-400" />
                 <h3 className="font-bold text-lg">试配称量单</h3>
              </div>
              <div className="text-right">
                 <div className="text-xs text-slate-400">试拌总体积</div>
                 <div className="font-mono font-bold text-emerald-400">{(vol * 1000).toFixed(1)} <span className="text-xs text-slate-500">L</span></div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 <ResultCard label="水泥" value={trial.cement} code="C" />
                 <ResultCard label="水" value={trial.water} code="W" color="blue" />
                 <ResultCard label="砂" value={trial.sand} code="S" />
                 <ResultCard label="石" value={trial.stone} code="G" />
                 {(trial.flyAsh > 0) && <ResultCard label="粉煤灰" value={trial.flyAsh} code="FA" />}
                 {(trial.slag > 0) && <ResultCard label="矿粉" value={trial.slag} code="SL" />}
              </div>

              {/* Special Admixture & Total Section */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                       <div className="text-yellow-200/70 text-xs uppercase tracking-wider font-semibold mb-1">外加剂 (精确称量)</div>
                       <div className="text-yellow-400 text-3xl font-bold font-mono tracking-tight">
                         {trial.admixture.toFixed(3)} <span className="text-sm font-normal text-yellow-600/70">kg</span>
                       </div>
                    </div>
                    <div className="text-right text-xs text-yellow-600/50 font-mono">
                       = {(trial.admixture * 1000).toFixed(0)} g
                    </div>
                 </div>

                 <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                       <div className="text-emerald-200/70 text-xs uppercase tracking-wider font-semibold mb-1">试拌总重量</div>
                       <div className="text-emerald-400 text-3xl font-bold font-mono tracking-tight">
                         {totalWeight.toFixed(2)} <span className="text-sm font-normal text-emerald-600/70">kg</span>
                       </div>
                    </div>
                    <Scale className="w-8 h-8 text-emerald-800/30" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ label, value, code, color = 'slate' }: { label: string, value: number, code: string, color?: string }) => (
  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 flex items-center justify-between group hover:bg-slate-700/50 transition-colors">
     <div>
        <div className="flex items-center gap-2 mb-1">
           <span className="text-xs font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{code}</span>
           <span className="text-slate-300 text-sm font-medium">{label}</span>
        </div>
        <div className="text-2xl font-bold font-mono tracking-wide text-white group-hover:text-emerald-300 transition-colors">
           {value.toFixed(2)}
        </div>
     </div>
     <div className="text-xs text-slate-500 font-medium self-end mb-1">kg</div>
  </div>
);
