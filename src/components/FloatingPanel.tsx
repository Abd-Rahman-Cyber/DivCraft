import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, ExternalLink, Check, Code2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ExtractedData } from '../lib/extractor';

interface FloatingPanelProps {
  data: ExtractedData | null;
  onClose: () => void;
  onOpenEditor: () => void;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ data, onClose, onOpenEditor }) => {
  const [format, setFormat] = useState<'html' | 'jsx'>('html');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data) return;
    const text = format === 'html' ? data.combined : data.jsx;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="dc-ui fixed top-6 right-6 w-80 z-[10000] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
        
        <div className="relative p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#6fa38f] rounded-lg shadow-lg shadow-[#6fa38f]/20">
                <Code2 className="w-4 h-4 text-[#003d1f]" />
              </div>
              <h3 className="text-sm font-semibold text-[#cccccc]">DivCraft</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-[#555555] hover:text-[#cccccc] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
              {(['html', 'jsx'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all",
                    format === f 
                      ? "bg-[#6fa38f] text-[#003d1f] shadow-sm" 
                      : "text-[#777777] hover:text-[#aaaaaa]"
                  )}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#6fa38f] hover:bg-[#5f9f80] text-[#003d1f] rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-[#6fa38f]/20"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy {format.toUpperCase()}</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenEditor}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#aaaaaa] rounded-xl text-sm font-medium border border-white/5 transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Editor</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] text-white/30 text-center">
              Press <kbd className="px-1 py-0.5 bg-white/5 rounded border border-white/10">Esc</kbd> to cancel selection
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
