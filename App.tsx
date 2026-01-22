import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  FlaskConical, 
  Scale, 
  Menu,
  X,
  Construction,
  BookOpen,
  Cpu
} from 'lucide-react';
import { ViewState } from './types';
import { MixCalculator } from './modules/MixCalculator';
import { SandRatioCalculator } from './modules/SandRatioCalculator';
import { AdmixtureAdjuster } from './modules/AdmixtureAdjuster';
import { TrialBatchCalculator } from './modules/TrialBatchCalculator';
import { HelpManual } from './modules/HelpManual';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('MIX_CALC');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'MIX_CALC', label: '配合比智能计算', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'SAND_RATIO', label: '砂率快速计算', icon: <Calculator className="w-5 h-5" /> },
    { id: 'ADMIXTURE', label: '外加剂调整', icon: <FlaskConical className="w-5 h-5" /> },
    { id: 'TRIAL_BATCH', label: '试配用量换算', icon: <Scale className="w-5 h-5" /> },
    { id: 'HELP', label: '操作手册', icon: <BookOpen className="w-5 h-5" /> },
  ];

  const NavContent = () => (
    <>
      <div className="p-4 flex items-center gap-3 border-b border-concrete-800 flex-shrink-0">
        <div className="bg-primary-600 p-1.5 rounded-lg">
          <Construction className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base tracking-wide">砼配比管理</h1>
          <p className="text-concrete-500 text-[10px]">Concrete Mix Pro</p>
        </div>
      </div>
      <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id as ViewState);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
              currentView === item.id 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50' 
                : 'text-concrete-400 hover:bg-concrete-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-concrete-800 flex-shrink-0 mt-auto">
        <div className="flex flex-col gap-3">
          <div className="text-concrete-600 text-[10px] text-center">
            &copy; 2024 砼配比管理系统 v1.0.0
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-concrete-400 bg-concrete-800/50 py-1.5 rounded-md border border-concrete-800/50">
             <Cpu className="w-3 h-3" />
             <span>数字化公司 技术支持</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-concrete-100 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-concrete-900 text-white p-3 flex justify-between items-center z-50 shadow-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <Construction className="w-4 h-4 text-primary-500" />
          <span className="font-bold text-sm">砼配比管理</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:block w-64 bg-concrete-900 h-full flex-shrink-0 flex flex-col relative">
        <NavContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-3/4 bg-concrete-900 shadow-2xl flex flex-col">
            <NavContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full p-2 md:p-4 relative min-h-0">
        <div className="w-full max-w-[1800px] mx-auto">
           {/* Mobile Title */}
           <div className="md:hidden mb-4">
              <h2 className="text-lg font-bold text-concrete-800">
                {navItems.find(n => n.id === currentView)?.label}
              </h2>
           </div>

           {/* Tab Content Areas */}
           <div className={currentView === 'MIX_CALC' ? 'block' : 'hidden'}>
             <MixCalculator />
           </div>
           <div className={currentView === 'SAND_RATIO' ? 'block' : 'hidden'}>
             <SandRatioCalculator />
           </div>
           <div className={currentView === 'ADMIXTURE' ? 'block' : 'hidden'}>
             <AdmixtureAdjuster />
           </div>
           <div className={currentView === 'TRIAL_BATCH' ? 'block' : 'hidden'}>
             <TrialBatchCalculator />
           </div>
           <div className={currentView === 'HELP' ? 'block' : 'hidden'}>
             <HelpManual />
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;