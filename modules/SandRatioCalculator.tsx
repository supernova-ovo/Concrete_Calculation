import React, { useState, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, Input, Button } from '../components/UIComponents';

export const SandRatioCalculator: React.FC = () => {
  const [sand, setSand] = useState<string>('');
  const [stone, setStone] = useState<string>('');
  const [ratio, setRatio] = useState<number | null>(null);

  const calculate = () => {
    const s = parseFloat(sand);
    const st = parseFloat(stone);
    if (!isNaN(s) && !isNaN(st) && (s + st) > 0) {
      const r = (s / (s + st)) * 100;
      setRatio(parseFloat(r.toFixed(2)));
    } else {
      setRatio(null);
    }
  };

  useEffect(() => {
    calculate();
  }, [sand, stone]);

  const getFeedback = (r: number) => {
    if (r < 30) return {
      label: '过低 (Very Low)',
      colorClass: 'text-red-800 bg-red-50 border-red-200',
      barColor: 'bg-red-500',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      desc: '粘聚性差，极易离析、泌水。通常仅用于碾压混凝土或特大骨料级配，泵送极其困难。'
    };
    if (r < 36) return {
      label: '偏低 (Low)',
      colorClass: 'text-orange-800 bg-orange-50 border-orange-200',
      barColor: 'bg-orange-400',
      icon: <Info className="w-5 h-5 text-orange-600" />,
      desc: '骨料空隙率较大。适用于路面或低流动性混凝土。若用于泵送，摩擦阻力大，易堵管。'
    };
    if (r <= 42) return {
      label: '适中 (Optimal)',
      colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      barColor: 'bg-emerald-500',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      desc: '常规泵送混凝土的理想范围 (36%-42%)。在此区间内，通常能获得较好的流动性、粘聚性和保水性。'
    };
    if (r <= 48) return {
      label: '偏高 (High)',
      colorClass: 'text-blue-800 bg-blue-50 border-blue-200',
      barColor: 'bg-blue-500',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      desc: '适用于高强(C50+)、自密实或细石混凝土。随砂率增加，比表面积增大，需水量增加，需注意早期收缩。'
    };
    return {
      label: '过高 (Very High)',
      colorClass: 'text-red-800 bg-red-50 border-red-200',
      barColor: 'bg-red-500',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      desc: '将显著增加用水量和胶材用量，不仅降低强度，且硬化后干燥收缩大，极易产生裂缝。'
    };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card title="砂率快速计算器" icon={<Calculator className="w-5 h-5"/>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-sm text-concrete-500 mb-4">
              砂率 (Sp) 是指混凝土中砂的质量占砂、石总质量的百分率。
              <br/>
              公式: Sp = [ 砂 / (砂 + 石) ] × 100%
            </p>
            <Input 
              label="砂用量 (kg)" 
              type="number" 
              placeholder="请输入砂重"
              value={sand}
              onChange={(e) => setSand(e.target.value)}
            />
            <Input 
              label="石用量 (kg)" 
              type="number" 
              placeholder="请输入石重"
              value={stone}
              onChange={(e) => setStone(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 bg-concrete-50 rounded-xl border border-concrete-100">
             <span className="text-concrete-500 text-sm font-medium uppercase tracking-wider mb-2">计算结果 (砂率)</span>
             <div className="text-6xl font-bold text-primary-600 tabular-nums">
               {ratio !== null ? ratio : '--'}
               <span className="text-2xl text-concrete-400 ml-1">%</span>
             </div>
             
             {ratio !== null && (() => {
               const feedback = getFeedback(ratio);
               return (
                 <div className="mt-6 w-full space-y-4">
                   <div className="w-full">
                     <div className="flex justify-between text-[10px] text-concrete-400 mb-1">
                       <span>30%</span>
                       <span>36%</span>
                       <span>42%</span>
                       <span>48%</span>
                     </div>
                     <div className="w-full h-3 bg-concrete-200 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 w-px bg-white/50 z-10" style={{ left: '30%' }} />
                        <div className="absolute top-0 bottom-0 w-px bg-white/50 z-10" style={{ left: '36%' }} />
                        <div className="absolute top-0 bottom-0 w-px bg-white/50 z-10" style={{ left: '42%' }} />
                        <div className="absolute top-0 bottom-0 w-px bg-white/50 z-10" style={{ left: '48%' }} />
                        <div 
                          className={`h-full transition-all duration-500 ease-out ${feedback.barColor}`}
                          style={{ width: `${Math.min(Math.max(ratio, 0), 100)}%` }}
                        />
                     </div>
                   </div>

                   <div className={`p-3 rounded-lg border flex gap-3 text-left ${feedback.colorClass}`}>
                      <div className="flex-shrink-0 mt-0.5">{feedback.icon}</div>
                      <div>
                        <div className="font-bold text-sm mb-1">{feedback.label}</div>
                        <div className="text-xs opacity-90 leading-relaxed">{feedback.desc}</div>
                      </div>
                   </div>
                 </div>
               );
             })()}
          </div>
        </div>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <strong>提示：</strong> 合理的砂率能改善混凝土的和易性。对于泵送混凝土，建议砂率控制在 36% - 42% 之间，具体应根据骨料粒径和空隙率通过试验确定。
        </div>
      </div>
    </div>
  );
};