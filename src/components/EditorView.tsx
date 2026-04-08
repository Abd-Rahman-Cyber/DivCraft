import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Download, Play, Code, Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExtractedData } from '../lib/extractor';
import { cn } from '../lib/utils';

interface EditorViewProps {
  data: ExtractedData;
  onClose: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({ data, onClose }) => {
  const [view, setView] = useState<'code' | 'preview' | 'split'>(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'split' : 'code'
  );
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [code, setCode] = useState(data.combined);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const previewHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            margin: 0; 
            padding: 4rem; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            font-family: sans-serif;
            background: transparent;
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${data.html}
        <style>
          ${data.css}
        </style>
      </body>
    </html>
  `;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[11000] bg-[#000000] flex flex-col"
    >
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a] backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h2 className="text-[#cccccc] font-bold text-lg flex items-center gap-2">
            <div className="p-1.5 bg-[#6fa38f] rounded-lg shadow-lg shadow-[#6fa38f]/20">
              <Code className="w-4 h-4 text-[#003d1f]" />
            </div>
            DivCraft Editor
          </h2>
          <div className="h-6 w-px bg-white/5" />
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setView('code')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                view === 'code' ? "bg-[#6fa38f] text-[#003d1f]" : "text-[#777777] hover:text-[#aaaaaa]"
              )}
            >
              Code
            </button>
            <button
              onClick={() => setView('split')}
              className={cn(
                "hidden md:block px-3 py-1 text-xs font-medium rounded-md transition-all",
                view === 'split' ? "bg-[#6fa38f] text-[#003d1f]" : "text-[#777777] hover:text-[#aaaaaa]"
              )}
            >
              Split
            </button>
            <button
              onClick={() => setView('preview')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                view === 'preview' ? "bg-[#6fa38f] text-[#003d1f]" : "text-[#777777] hover:text-[#aaaaaa]"
              )}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#aaaaaa] rounded-lg text-sm font-medium border border-white/5 transition-all active:scale-95"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={onClose}
            className="p-2 text-[#555555] hover:text-[#cccccc] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Code Panel */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300 border-r border-white/5",
          view === 'preview' ? 'hidden' : 'flex'
        )}>
          <div className="h-10 bg-[#0a0a0a] border-b border-white/5 flex items-center px-4 justify-between">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#555555]">Extracted Source</span>
          </div>
          <div className="flex-1 overflow-auto bg-[#000000] custom-scrollbar">
            <SyntaxHighlighter
              language="html"
              style={atomDark}
              customStyle={{ 
                margin: 0, 
                padding: '1.5rem', 
                background: 'transparent', 
                fontSize: '13px',
                lineHeight: '1.6',
                fontFamily: 'JetBrains Mono, monospace'
              }}
              wrapLongLines
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Preview Panel */}
        <div className={cn(
          "flex-1 flex flex-col bg-[#0a0a0a] transition-all duration-300",
          view === 'code' ? 'hidden' : 'flex'
        )}>
          <div className="h-10 bg-[#0a0a0a] border-b border-white/5 flex items-center px-4 justify-between">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#555555]">Live Preview</span>
            <div className="flex gap-2">
              <button onClick={() => setDevice('desktop')} className={cn("p-1.5 rounded-lg transition-all", device === 'desktop' ? "text-[#6fa38f] bg-[#6fa38f]/10" : "text-[#555555] hover:text-[#aaaaaa]")}><Monitor className="w-4 h-4" /></button>
              <button onClick={() => setDevice('tablet')} className={cn("p-1.5 rounded-lg transition-all", device === 'tablet' ? "text-[#6fa38f] bg-[#6fa38f]/10" : "text-[#555555] hover:text-[#aaaaaa]")}><Tablet className="w-4 h-4" /></button>
              <button onClick={() => setDevice('mobile')} className={cn("p-1.5 rounded-lg transition-all", device === 'mobile' ? "text-[#6fa38f] bg-[#6fa38f]/10" : "text-[#555555] hover:text-[#aaaaaa]")}><Smartphone className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 p-8 flex justify-center items-start overflow-auto bg-[#000000] relative">
            {/* Transparency Grid Background */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-10" 
              style={{ 
                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} 
            />
            
            <div 
              className="rounded-xl shadow-2xl overflow-hidden transition-all duration-500 border border-white/5"
              style={{ 
                width: deviceWidths[device], 
                height: '100%', 
                minHeight: '600px',
                background: 'transparent'
              }}
            >
              <iframe
                title="preview"
                srcDoc={previewHtml}
                className="w-full h-full border-none"
                allowTransparency
              />
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};
