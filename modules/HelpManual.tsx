import React from 'react';
import { 
  BookOpen, 
  LayoutDashboard, 
  Calculator, 
  FlaskConical, 
  Scale, 
  BrainCircuit, 
  Settings2,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { Card } from '../components/UIComponents';

export const HelpManual: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-6 rounded-xl border border-concrete-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary-100 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-concrete-800">操作手册</h1>
            <p className="text-concrete-500">混凝土配比管理系统使用指南与技术说明</p>
          </div>
        </div>
        <p className="text-concrete-600 leading-relaxed">
          欢迎使用 <strong>砼配比管理 (Concrete Mix Pro)</strong>。本系统专为混凝土实验室技术人员及工程师设计，
          集成了智能配比推荐、标准计算、现场砂率分析及试配用量换算等核心功能。以下是各模块的详细操作说明。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module 1: Mix Calculation */}
        <ManualSection 
          title="配合比智能计算" 
          icon={<LayoutDashboard className="w-5 h-5"/>}
          color="blue"
        >
          <div className="space-y-4 text-sm text-concrete-600">
            <p>该模块提供两种计算模式，通过顶部的切换按钮进行选择：</p>
            
            <div className="bg-concrete-50 p-3 rounded border border-concrete-100">
              <div className="flex items-center gap-2 font-bold text-concrete-800 mb-2">
                <BrainCircuit className="w-4 h-4 text-primary-600"/> 1. AI 智能推荐模式
              </div>
              <p className="mb-2">基于大数据模型和各地工程经验。适用于快速方案设计或缺乏具体原材料参数时的初步估算。</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>输入强度等级、坍落度、最大粒径等工程要求。</li>
                <li><strong>特别是地区和季节</strong>：AI 会根据所选地区的常用地标（如北京 DB11）和季节温度特性调整配方。</li>
              </ul>
            </div>

            <div className="bg-concrete-50 p-3 rounded border border-concrete-100">
              <div className="flex items-center gap-2 font-bold text-concrete-800 mb-2">
                <Settings2 className="w-4 h-4 text-safety-600"/> 2. JGJ 55 标准计算模式
              </div>
              <p className="mb-2">严格遵循《JGJ 55-2011 普通混凝土配合比设计规程》公式。</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>需要输入实测的水泥强度、具体的减水率、外加剂掺量等详细参数。</li>
                <li>系统会自动计算配制强度(fcu,o)和胶水比(W/B)，并反推各材料用量。</li>
                <li>计算结果包含中间参数（如计算水胶比 vs 采用水胶比），方便校核书。</li>
              </ul>
            </div>
            
            <div className="flex items-start gap-2 text-xs bg-yellow-50 text-yellow-800 p-2 rounded">
              <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <span>提示：点击结果栏右上角的“保存”按钮，可将当前配比存入左下角的“近期记录”中，方便随时回溯。</span>
            </div>
          </div>
        </ManualSection>

        {/* Module 2: Sand Ratio */}
        <ManualSection 
          title="砂率快速计算" 
          icon={<Calculator className="w-5 h-5"/>}
          color="emerald"
        >
          <div className="space-y-4 text-sm text-concrete-600">
            <p>
              用于现场快速计算砂率（Sp），并评估其对泵送性能的影响。
            </p>
            <div className="space-y-2">
              <p><strong>操作步骤：</strong></p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>输入 <strong>砂用量</strong> (kg)。</li>
                <li>输入 <strong>石用量</strong> (kg)。</li>
                <li>系统自动计算百分比。</li>
              </ol>
            </div>
            <div className="border-t border-concrete-100 pt-2 mt-2">
              <p className="font-semibold mb-1">智能诊断反馈：</p>
              <p>系统会根据计算结果所在的区间（如 &lt;36% 偏低，36-42% 适中，&gt;48% 过高）给出具体的工程建议。</p>
              <ul className="mt-2 space-y-1 text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-100">
                <li><span className="font-bold">过低风险：</span> 离析、泌水、堵管。</li>
                <li><span className="font-bold">过高风险：</span> 需水量大、强度降低、收缩开裂。</li>
              </ul>
            </div>
          </div>
        </ManualSection>

        {/* Module 3: Admixture */}
        <ManualSection 
          title="外加剂调整" 
          icon={<FlaskConical className="w-5 h-5"/>}
          color="purple"
        >
          <div className="space-y-4 text-sm text-concrete-600">
            <p>
              快速计算每立方混凝土中的外加剂绝对用量，并支持液体含固量换算。
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <span className="font-bold text-concrete-700">胶凝材料总量：</span>
                输入水泥、粉煤灰、矿粉的总和。
              </li>
              <li>
                <span className="font-bold text-concrete-700">掺量比例调整：</span>
                通过滑块或输入框微调百分比（通常为 1.0% - 3.0%），实时查看每方用量变化。
              </li>
              <li>
                <span className="font-bold text-concrete-700">液体换算：</span>
                如果使用的是液体外加剂，系统会根据设定的含固量（如 10% 或 20%）自动计算所需的液体总重。
              </li>
            </ul>
          </div>
        </ManualSection>

        {/* Module 4: Trial Batch */}
        <ManualSection 
          title="试配用量换算" 
          icon={<Scale className="w-5 h-5"/>}
          color="orange"
        >
          <div className="space-y-4 text-sm text-concrete-600">
            <p>
              将每立方米的配合比设计值，转换为实验室搅拌机所需的具体称量值。
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded font-bold">Step 1</span>
                <span>设定试拌体积（如 0.03m³ 即 30升）。支持点击快捷按钮（15L/20L/30L）。</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded font-bold">Step 2</span>
                <span>输入基准配合比（单方用量）。</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded font-bold">Step 3</span>
                <span>右侧自动生成“试配称量单”，外加剂精确到小数点后3位（克级精度）。</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs bg-orange-50 text-orange-800 p-2 rounded mt-2 border border-orange-100">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <span>注意：由于实验室搅拌机通常有粘罐损耗，建议在计算出的理论体积基础上，额外增加 10% 的富余量（或直接选择更大的试拌体积）。</span>
            </div>
          </div>
        </ManualSection>

      </div>
    </div>
  );
};

interface ManualSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color: 'blue' | 'emerald' | 'purple' | 'orange';
}

const ManualSection: React.FC<ManualSectionProps> = ({ title, icon, children, color }) => {
  const colorStyles = {
    blue: "border-l-primary-500",
    emerald: "border-l-emerald-500",
    purple: "border-l-purple-500",
    orange: "border-l-safety-500",
  };

  return (
    <Card className={`border-l-4 ${colorStyles[color]} h-full`}>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-concrete-100">
        <span className={`text-${color === 'orange' ? 'safety' : color}-600`}>{icon}</span>
        <h3 className="font-bold text-lg text-concrete-800">{title}</h3>
      </div>
      {children}
    </Card>
  );
};