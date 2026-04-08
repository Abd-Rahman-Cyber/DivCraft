import React from 'react';
import { 
  Code2, Settings, HelpCircle, MousePointer2, Sparkles
} from 'lucide-react';

interface PopupViewProps {
  onStartSelection: () => void;
}

export function PopupView({ onStartSelection }: PopupViewProps) {
  return (
    <div className="w-[320px] bg-[#000000] text-[#cccccc] font-sans overflow-hidden border border-white/5 shadow-2xl">
      <header className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#6fa38f] rounded-md shadow-lg shadow-[#6fa38f]/20">
            <Code2 className="w-4 h-4 text-[#003d1f]" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">DivCraft</span>
        </div>
        <div className="flex items-center gap-3 text-[#777777]">
          <button className="hover:text-white transition-colors"><HelpCircle className="w-4 h-4" /></button>
          <button className="hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#6fa38f]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-2 mb-3">
            <span className="px-1.5 py-0.5 rounded-md bg-[#6fa38f]/10 border border-[#6fa38f]/20 text-[#6fa38f] text-[10px] font-bold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              READY
            </span>
          </div>
          <h2 className="text-white font-bold text-base mb-2">Element Extractor</h2>
          <p className="text-[#777777] text-xs leading-relaxed">
            Click the button below to start selecting elements on the page.
          </p>
        </div>

        <button 
          onClick={onStartSelection}
          className="w-full py-4 bg-[#6fa38f] text-[#003d1f] rounded-xl font-bold text-sm hover:bg-[#5f9f80] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#6fa38f]/10 active:scale-[0.98]"
        >
          <MousePointer2 className="w-4 h-4" />
          Start Selecting
        </button>
      </main>
      
      <footer className="px-4 py-3 bg-[#050505] border-t border-white/5 flex justify-center">
        <span className="text-[10px] text-[#444] font-medium uppercase tracking-widest">v1.0.0 Beta</span>
      </footer>
    </div>
  );
}
