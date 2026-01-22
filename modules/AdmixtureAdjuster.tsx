import React, { useState } from 'react';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { Card, Input, Button } from '../components/UIComponents';

export const AdmixtureAdjuster: React.FC = () => {
  const [binder, setBinder] = useState<string>('300'); // Cement + Flyash
  const [dosageRate, setDosageRate] = useState<string>('1.5'); // %
  const [solidContent, setSolidContent] = useState<string>('10'); // % for liquid admixture conversion if needed

  const binderVal = parseFloat(binder) || 0;
  const dosageVal = parseFloat(dosageRate) || 0;
  
  const totalAdmixture = (binderVal * dosageVal) / 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card title="外加剂掺量调整" icon={<FlaskConical className="w-5 h-5"/>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <Input 
              label="胶凝材料总量 (kg/m³)" 
              type="number" 
              suffix="kg"
              value={binder}
              onChange={(e) => setBinder(e.target.value)}
              placeholder="水泥 + 粉煤灰 + 矿粉"
            />
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-concrete-600">掺量比例 (%)</label>
                <span className="text-sm font-bold text-primary-600">{dosageRate}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="5.0" 
                step="0.1" 
                value={dosageRate}
                onChange={(e) => setDosageRate(e.target.value)}
                className="w-full h-2 bg-concrete-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-concrete-400 mt-1">
                <span>0.5%</span>
                <span>2.5%</span>
                <span>5.0%</span>
              </div>
            </div>

            <Input 
              label="精确微调掺量 (%)" 
              type="number" 
              step="0.1"
              value={dosageRate}
              onChange={(e) => setDosageRate(e.target.value)}
            />
          </div>

          <div className="bg-concrete-900 text-white rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            
            <h4 className="text-concrete-400 text-sm font-medium uppercase tracking-widest mb-4">每方外加剂用量</h4>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-bold tracking-tight">{totalAdmixture.toFixed(2)}</span>
              <span className="text-xl text-concrete-400">kg/m³</span>
            </div>

            <div className="border-t border-concrete-700 my-4"></div>

            <div className="space-y-2 text-sm text-concrete-300">
               <div className="flex justify-between">
                 <span>胶凝材料基数:</span>
                 <span className="font-mono text-white">{binderVal} kg</span>
               </div>
               <div className="flex justify-between">
                 <span>当前掺比:</span>
                 <span className="font-mono text-white">{dosageVal}%</span>
               </div>
            </div>
            
            <div className="mt-6 pt-4 bg-concrete-800 rounded-lg p-3">
               <p className="text-xs text-concrete-400 mb-1">若外加剂含固量为 {solidContent}% (液体)</p>
               <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">
                    {solidContent ? ((totalAdmixture * 100) / parseFloat(solidContent)).toFixed(2) : '--'}
                  </span>
                  <span className="text-xs text-concrete-400">kg (液体总重)</span>
               </div>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-concrete-200">
           <h5 className="font-semibold text-concrete-800 mb-2">减水型</h5>
           <p className="text-sm text-concrete-500">常规掺量 1.5% - 2.5%。主要用于大幅度减少用水量，提高强度。</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-concrete-200">
           <h5 className="font-semibold text-concrete-800 mb-2">缓凝型</h5>
           <p className="text-sm text-concrete-500">常规掺量 1.8% - 3.0%。用于高温季节施工，延缓初凝时间。</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-concrete-200">
           <h5 className="font-semibold text-concrete-800 mb-2">早强型</h5>
           <p className="text-sm text-concrete-500">常规掺量 2.0% - 4.0%。用于冬季施工或抢工期，加速硬化。</p>
        </div>
      </div>
    </div>
  );
};
