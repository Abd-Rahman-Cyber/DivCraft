import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SelectorOverlayProps {
  active: boolean;
  onSelect: (element: HTMLElement) => void;
}

export const SelectorOverlay: React.FC<SelectorOverlayProps> = ({ active, onSelect }) => {
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      setHoveredRect(null);
      setHoveredElement(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target !== document.body && target !== document.documentElement) {
        // Don't highlight our own UI
        if (target.closest('.dc-ui')) return;

        const rect = target.getBoundingClientRect();
        setHoveredRect(rect);
        setHoveredElement(target);
      } else {
        setHoveredRect(null);
        setHoveredElement(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!active || !hoveredElement) return;
      
      // Prevent default actions
      e.preventDefault();
      e.stopPropagation();
      
      onSelect(hoveredElement);
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('click', handleClick, true);
    };
  }, [active, hoveredElement, onSelect]);

  return (
    <AnimatePresence>
      {active && hoveredRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            top: hoveredRect.top + window.scrollY,
            left: hoveredRect.left + window.scrollX,
            width: hoveredRect.width,
            height: hoveredRect.height,
          }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
          className="fixed pointer-events-none z-[9999] border-2 border-blue-500 bg-blue-500/10 rounded-sm"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-t-sm font-mono whitespace-nowrap">
            {hoveredElement?.tagName.toLowerCase()} 
            <span className="opacity-70 ml-1">
              {Math.round(hoveredRect.width)} × {Math.round(hoveredRect.height)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
