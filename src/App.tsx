import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Code2, Layers, Zap, Github, Twitter, ArrowRight, Sparkles, Smartphone, Copy, Check } from 'lucide-react';
import { SelectorOverlay } from './components/SelectorOverlay';
import { FloatingPanel } from './components/FloatingPanel';
import { EditorView } from './components/EditorView';
import { PopupView } from './components/PopupView';
import { extractElement, ExtractedData } from './lib/extractor';
import { cn } from './lib/utils';

export default function App() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isPopup, setIsPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle data from extension URL params or storage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    const popupParam = params.get('popup');
    const editorParam = params.get('editor');

    if (popupParam === 'true') {
      setIsPopup(true);
      setIsLoading(false);
      return;
    }

    if (editorParam === 'true' && typeof chrome !== 'undefined' && chrome.storage) {
      console.log('DivCraft: Editor mode detected, fetching data from storage...');
      chrome.storage.local.get(['lastExtractedData'], (result) => {
        if (result.lastExtractedData) {
          console.log('DivCraft: Data found in storage');
          setExtractedData(result.lastExtractedData as ExtractedData);
          setShowEditor(true);
        } else {
          console.warn('DivCraft: No data found in storage for editor');
        }
        setIsLoading(false);
      });
    } else if (dataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        setExtractedData(decodedData);
        setShowEditor(true);
      } catch (e) {
        console.error('Failed to parse extension data:', e);
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleStartSelection = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.runtime.sendMessage({ type: 'START_SELECTION', tabId: tabs[0].id });
          window.close(); // Close the popup after starting selection
        }
      });
    } else {
      setIsSelecting(true);
    }
  }, []);

  const handleSelect = useCallback((element: HTMLElement) => {
    const data = extractElement(element);
    setExtractedData(data);
    setIsSelecting(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSelecting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-[#6fa38f]">Loading DivCraft...</div>;
  }

  if (isPopup) {
    return <PopupView onStartSelection={handleStartSelection} />;
  }

  // If we are in editor mode (from extension), only show the editor or a placeholder
  const params = new URLSearchParams(window.location.search);
  if (params.get('editor') === 'true' || params.get('data')) {
    if (!extractedData) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">No data found to edit.</div>;
    }
    return (
      <div className="min-h-screen bg-black">
        <EditorView data={extractedData} onClose={() => window.close()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#cccccc] selection:bg-[#6fa38f]/30 relative overflow-x-hidden">
      {/* Extension Simulation UI */}
      <SelectorOverlay active={isSelecting} onSelect={handleSelect} />
      
      <FloatingPanel 
        data={extractedData} 
        onClose={() => setExtractedData(null)} 
        onOpenEditor={() => setShowEditor(true)}
      />

      <AnimatePresence>
        {showEditor && extractedData && (
          <EditorView 
            data={extractedData} 
            onClose={() => setShowEditor(false)} 
          />
        )}
      </AnimatePresence>

      {/* Demo Page Content */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-[#000000]/50 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#6fa38f] rounded-lg shadow-lg shadow-[#6fa38f]/20">
              <Code2 className="w-5 h-5 text-[#003d1f]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">DivCraft</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[#777777] hover:text-[#cccccc] transition-colors">Features</a>
            <a href="#showcase" className="text-sm font-medium text-[#777777] hover:text-[#cccccc] transition-colors">Showcase</a>
            <a href="#pricing" className="text-sm font-medium text-[#777777] hover:text-[#cccccc] transition-colors">Pricing</a>
            <a href="#docs" className="text-sm font-medium text-[#777777] hover:text-[#cccccc] transition-colors">Docs</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSelecting(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg",
                isSelecting 
                  ? "bg-[#6fa38f] text-[#003d1f] scale-105 ring-4 ring-[#6fa38f]/20 shadow-[#6fa38f]/40" 
                  : "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#aaaaaa] border border-white/5"
              )}
            >
              <MousePointer2 className="w-4 h-4" />
              {isSelecting ? "Selecting..." : "Try Extension"}
            </button>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero Section with Background Image */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden bg-black">
          {/* Background Image Layer */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1635776062127-d379bfcbb9c8?q=80&w=2564&auto=format&fit=crop")',
            }}
          />
          
          {/* Vector Field Overlay (Programmatic version of the image) */}
          <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden z-1">
            <div className="absolute inset-0 flex flex-wrap justify-around content-around p-4 gap-12">
              {Array.from({ length: 200 }).map((_, i) => (
                <div 
                  key={i}
                  className="w-4 h-0.5 bg-white/20 rounded-full"
                  style={{ 
                    transform: `rotate(${Math.sin(i * 0.2) * 45 + (i % 360)}deg)`,
                    opacity: Math.max(0.1, Math.cos(i * 0.1))
                  }}
                />
              ))}
            </div>
            {/* Dark Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-70" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6fa38f]/10 border border-[#6fa38f]/20 text-[#6fa38f] text-xs font-bold mb-6"
            >
              <Sparkles className="w-3 h-3" />
              NEW: TAILWIND CONVERSION BETA
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight leading-tight"
            >
              Copy any element <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6fa38f] to-[#5f9f80]">into clean code.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-[#777777] mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The ultimate browser extension for developers. Visually select any component on the web and get production-ready HTML, JSX, and CSS instantly.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <button className="px-8 py-4 bg-[#6fa38f] text-[#003d1f] rounded-2xl font-bold hover:bg-[#5f9f80] transition-all flex items-center gap-2 group shadow-xl shadow-[#6fa38f]/20">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-[#0a0a0a] text-[#aaaaaa] rounded-2xl font-bold hover:bg-[#1a1a1a] transition-all border border-white/5">
                View Demo
              </button>
            </motion.div>
          </div>
        </section>

        <div className="px-6 pb-20">
          {/* Feature Grid */}
          <section id="features" className="max-w-7xl mx-auto py-32">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Powerful Features</h2>
              <p className="text-[#777777] max-w-2xl mx-auto">Everything you need to bridge the gap between design and development.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Zap className="w-6 h-6" />, title: "Instant Extraction", desc: "One click to get the full HTML and computed CSS of any element." },
                { icon: <Layers className="w-6 h-6" />, title: "JSX Support", desc: "Automatically converts HTML attributes and styles to React-friendly JSX." },
                { icon: <MousePointer2 className="w-6 h-6" />, title: "Visual Selector", desc: "Intuitive hover highlighting that feels like native browser dev tools." },
                { icon: <Code2 className="w-6 h-6" />, title: "Clean Output", desc: "Removes unnecessary attributes and minifies CSS for production use." },
                { icon: <Smartphone className="w-6 h-6" />, title: "Responsive Preview", desc: "Test your extracted components on mobile, tablet, and desktop views." },
                { icon: <Copy className="w-6 h-6" />, title: "Smart Clipboard", desc: "Format-aware copying that respects your project's coding style." }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-[#6fa38f]/30 transition-all group cursor-default"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#6fa38f]/10 flex items-center justify-center text-[#6fa38f] mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-[#777777] leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Showcase Section */}
          <section id="showcase" className="max-w-7xl mx-auto py-32 border-t border-white/5">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Built with DivCraft</h2>
              <p className="text-[#777777] max-w-2xl mx-auto">See how developers are using DivCraft to build stunning interfaces in record time.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              {[
                { title: "SaaS Dashboard", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop", tags: ["React", "Tailwind"] },
                { title: "E-commerce UI", image: "https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=2089&auto=format&fit=crop", tags: ["HTML", "CSS"] },
                { title: "Portfolio Hero", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop", tags: ["JSX", "Framer Motion"] },
                { title: "Marketing Site", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop", tags: ["Clean CSS"] }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="group relative rounded-[2rem] overflow-hidden border border-white/5 bg-[#0a0a0a]"
                >
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-8 flex flex-col justify-end">
                    <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                    <div className="flex gap-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#aaaaaa] uppercase tracking-wider">{tag}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Docs Section */}
          <section id="docs" className="max-w-7xl mx-auto py-32 border-t border-white/5">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Simple Documentation</h2>
                <p className="text-[#777777] text-lg mb-10 leading-relaxed">
                  DivCraft is designed to be intuitive. No complex setup, no steep learning curve. Just install and start building.
                </p>
                <div className="space-y-6">
                  {[
                    { q: "How do I start selecting?", a: "Click the 'Try Extension' button or use the keyboard shortcut Alt+S." },
                    { q: "Can I export to Tailwind?", a: "Yes, our beta converter handles most standard utility classes automatically." },
                    { q: "Does it work with local files?", a: "Absolutely. DivCraft can inspect any HTML file rendered in your browser." }
                  ].map((faq, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/5">
                      <h4 className="text-white font-bold mb-2">{faq.q}</h4>
                      <p className="text-[#555555] text-sm">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 font-mono text-sm overflow-hidden">
                <div className="flex gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="space-y-2 text-[#777777]">
                  <p className="text-[#6fa38f]"># Quick Start Guide</p>
                  <p>1. Open any website</p>
                  <p>2. Activate DivCraft (Alt+S)</p>
                  <p>3. Hover and click an element</p>
                  <p>4. Copy HTML/JSX instantly</p>
                  <p className="pt-4 text-[#6fa38f]"># Keyboard Shortcuts</p>
                  <p><span className="text-[#aaaaaa]">Alt + S</span> : Toggle Selector</p>
                  <p><span className="text-[#aaaaaa]">Esc</span> : Cancel Selection</p>
                  <p><span className="text-[#aaaaaa]">Enter</span> : Open Editor</p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="max-w-7xl mx-auto py-32 border-t border-white/5">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Simple Pricing</h2>
              <p className="text-[#777777] mb-16">No subscriptions. No hidden fees. Just great tools for developers.</p>
              
              <div className="p-12 rounded-[3rem] bg-gradient-to-br from-[#003d1f] to-[#0a0a0a] border border-[#6fa38f]/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#6fa38f]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#6fa38f]/10 transition-colors" />
                <h3 className="text-2xl font-bold text-white mb-2">Community Edition</h3>
                <div className="flex items-center justify-center gap-1 mb-8">
                  <span className="text-5xl font-extrabold text-white">$0</span>
                  <span className="text-[#777777]">/ forever</span>
                </div>
                <ul className="space-y-4 mb-10 text-left max-w-xs mx-auto">
                  {["Unlimited extractions", "HTML & JSX support", "Live Editor access", "Community support", "Regular updates"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-[#aaaaaa]">
                      <Check className="w-5 h-5 text-[#6fa38f]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 bg-[#6fa38f] text-[#003d1f] rounded-2xl font-bold hover:bg-[#5f9f80] transition-all shadow-xl shadow-[#6fa38f]/20">
                  Download Extension
                </button>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-[#003d1f] to-[#0a0a0a] rounded-[3rem] p-12 md:p-20 relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#6fa38f]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-6">Ready to speed up your workflow?</h2>
                  <p className="text-[#aaaaaa] text-lg mb-8">Join 10,000+ developers who are building faster with DivCraft.</p>
                  <div className="flex gap-4">
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"><Github className="w-6 h-6 text-[#aaaaaa]" /></button>
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"><Twitter className="w-6 h-6 text-[#aaaaaa]" /></button>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-white/10" />
                    <div>
                      <div className="h-4 w-32 bg-white/20 rounded mb-2" />
                      <div className="h-3 w-20 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#6fa38f]" />
          <span className="font-bold text-white">DivCraft</span>
        </div>
        <p className="text-[#555555] text-sm">© 2026 DivCraft. Built for the modern web.</p>
        <div className="flex gap-6">
          <a href="#" className="text-[#555555] hover:text-white transition-colors text-sm">Privacy</a>
          <a href="#" className="text-[#555555] hover:text-white transition-colors text-sm">Terms</a>
          <a href="#" className="text-[#555555] hover:text-white transition-colors text-sm">Contact</a>
        </div>
      </footer>
    </div>
  );
}
