// DivCraft - Content Script (Manifest V3)
import { extractElement } from './lib/extractor';

console.log('DivCraft: Content script loading...');

// Use a unique property on window to prevent duplicate initialization
if (!(window as any).divCraftInitialized) {
  (window as any).divCraftInitialized = true;
  console.log('DivCraft: Content script initialized');

  let isSelecting = false;
  let hoverElement: HTMLElement | null = null;
  let overlay: HTMLDivElement | null = null;
  let styleTag: HTMLStyleElement | null = null;
  let panelContainer: HTMLDivElement | null = null;
  let shadowRoot: ShadowRoot | null = null;

  function createOverlay() {
    if (document.getElementById('divcraft-selector-overlay')) {
      overlay = document.getElementById('divcraft-selector-overlay') as HTMLDivElement;
      return;
    }
    overlay = document.createElement('div');
    overlay.id = 'divcraft-selector-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '2147483647',
      border: '2px solid #6fa38f',
      backgroundColor: 'rgba(111, 163, 143, 0.1)',
      transition: 'all 0.05s ease-out',
      display: 'none',
      boxSizing: 'border-box'
    });
    document.documentElement.appendChild(overlay);
  }

  function createStyleTag() {
    if (document.getElementById('divcraft-selector-styles')) return;
    styleTag = document.createElement('style');
    styleTag.id = 'divcraft-selector-styles';
    styleTag.textContent = `
      .divcraft-selecting, .divcraft-selecting * {
        cursor: crosshair !important;
      }
      #divcraft-selector-overlay {
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(styleTag);
  }

  let currentFormat = 'html';
  let currentStyle = 'inline';
  let mediaQuery = 'on';
  let currentExtractedData: any = null;

  // Cached DOM elements for panel
  let cachedOrigTag: HTMLElement | null = null;
  let cachedMappedTag: HTMLElement | null = null;

  function createPanel() {
    if (document.getElementById('divcraft-panel-container')) {
      panelContainer = document.getElementById('divcraft-panel-container') as HTMLDivElement;
      shadowRoot = panelContainer.shadowRoot;
      return;
    }
    panelContainer = document.createElement('div');
    panelContainer.id = 'divcraft-panel-container';
    Object.assign(panelContainer.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: '2147483647',
      display: 'none'
    });
    document.documentElement.appendChild(panelContainer);
    shadowRoot = panelContainer.attachShadow({ mode: 'open' });
    
    const styles = document.createElement('style');
    styles.textContent = `
      :host {
        all: initial;
      }
      .panel {
        background: rgba(18, 18, 20, 0.9);
        backdrop-filter: blur(12px);
        color: #ffffff;
        padding: 20px;
        border-radius: 20px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
        width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        position: relative;
        box-sizing: border-box;
        user-select: none;
      }
      .panel:focus {
        outline: none;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .top-toggle {
        display: flex;
        background: #1c1c1f;
        padding: 3px;
        border-radius: 100px;
        border: 1px solid rgba(255, 255, 255, 0.03);
      }
      .top-toggle-btn {
        padding: 6px 16px;
        font-size: 13px;
        font-weight: 500;
        border-radius: 100px;
        cursor: pointer;
        transition: all 0.2s;
        color: #777;
        border: none;
        background: transparent;
      }
      .top-toggle-btn.active {
        background: #2a2a2e;
        color: #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .header-actions {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .nav-controls {
        display: flex;
        background: #1c1c1f;
        padding: 2px;
        border-radius: 8px;
        margin-right: 8px;
        border: 1px solid rgba(255, 255, 255, 0.03);
      }
      .nav-btn {
        background: none;
        border: none;
        color: #555;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        border-radius: 6px;
      }
      .nav-btn:hover { color: #6fa38f; background: rgba(111, 163, 143, 0.1); }
      .nav-btn svg { width: 14px; height: 14px; }
      
      .icon-btn {
        background: none;
        border: none;
        color: #555;
        cursor: pointer;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        border-radius: 8px;
      }
      .icon-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
      .icon-btn svg { width: 18px; height: 18px; }
      
      .element-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 24px;
        font-size: 14px;
        color: #777;
      }
      .element-info .tag {
        color: #ffffff;
        font-weight: 700;
      }
      .element-info .arrow {
        font-size: 12px;
      }
      .element-info .nav-icons {
        margin-left: auto;
        display: flex;
        gap: 4px;
        color: #444;
      }
      .element-info .nav-icons svg { width: 14px; height: 14px; }

      .section {
        margin-bottom: 20px;
      }
      .section-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
      }
      .section-title {
        font-size: 12px;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .info-icon {
        color: #444;
        display: flex;
        cursor: help;
      }
      .info-icon svg { width: 14px; height: 14px; }

      .options-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 24px;
      }
      .option {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 13px;
        color: #777;
        transition: all 0.2s;
        padding: 4px 8px;
        margin: -4px -8px;
        border-radius: 6px;
      }
      .option:hover { color: #fff; }
      .option.active { color: #ffffff; }
      .radio-circle {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid #333;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        box-sizing: border-box;
      }
      .option.active .radio-circle {
        border-color: #6fa38f;
      }
      .radio-inner {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #6fa38f;
        transform: scale(0);
        transition: transform 0.2s;
      }
      .option.active .radio-inner {
        transform: scale(1);
      }
      
      .slider-container {
        position: relative;
        padding: 12px 8px;
        margin: -4px -8px;
        border-radius: 8px;
        transition: all 0.2s;
      }
      .slider {
        -webkit-appearance: none;
        width: 100%;
        height: 4px;
        background: #2a2a2e;
        border-radius: 2px;
        outline: none;
      }
      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        background: #6fa38f;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(111, 163, 143, 0.3);
        border: 2px solid #121214;
      }
      .slider-label {
        font-size: 13px;
        font-weight: 700;
        color: #ffffff;
        margin-top: 12px;
      }

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 14px;
        background: #6fa38f;
        color: #003d1f;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        margin-top: 12px;
        box-shadow: 0 4px 12px rgba(111, 163, 143, 0.2);
      }
      .action-btn:hover { background: #7fb39f; transform: translateY(-1px); }
      .action-btn:active { transform: translateY(0); }
      .action-btn .menu-icon {
        margin-left: auto;
        opacity: 0.8;
      }

      /* Keyboard Focus Highlight */
      .focused {
        background: rgba(111, 163, 143, 0.1) !important;
        box-shadow: 0 0 0 2px #6fa38f !important;
      }
      .top-toggle-btn.focused { box-shadow: 0 0 0 2px #6fa38f !important; }
      .action-btn.focused { box-shadow: 0 0 0 3px rgba(111, 163, 143, 0.4) !important; }
    `;
    shadowRoot.appendChild(styles);
    
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.tabIndex = 0;
    panel.innerHTML = `
      <div class="header">
        <div class="top-toggle">
          <button class="top-toggle-btn active" data-nav="top" data-idx="0">Copy</button>
          <button class="top-toggle-btn" data-nav="top" data-idx="1">Editor</button>
        </div>
        <div class="header-actions">
          <div class="nav-controls">
            <button class="nav-btn" id="nav-up" title="Select Parent (↑)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button class="nav-btn" id="nav-down" title="Select Child (↓)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <button class="nav-btn" id="nav-left" title="Prev Sibling (←)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="nav-btn" id="nav-right" title="Next Sibling (→)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <button class="icon-btn" id="expand-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </button>
          <button class="icon-btn" id="close-panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      
      <div class="element-info">
        <span id="orig-tag">h1</span>
        <span class="arrow">→</span>
        <span class="tag" id="mapped-tag">span</span>
        <div class="nav-icons">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">Component Format</span>
          <span class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>
        </div>
        <div class="options-grid">
          <div class="option active" data-nav="format" data-val="html" data-idx="0">
            <div class="radio-circle"><div class="radio-inner"></div></div>
            <span>HTML</span>
          </div>
          <div class="option" data-nav="format" data-val="jsx" data-idx="1">
            <div class="radio-circle"><div class="radio-inner"></div></div>
            <span>JSX</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">Style Format</span>
          <span class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>
        </div>
        <div class="options-grid">
          <div class="option" data-nav="style" data-val="tailwind" data-idx="0">
            <div class="radio-circle"><div class="radio-inner"></div></div>
            <span>Tailwind CSS</span>
          </div>
          <div class="option active" data-nav="style" data-val="inline" data-idx="1">
            <div class="radio-circle"><div class="radio-inner"></div></div>
            <span>Inline CSS</span>
          </div>
          <div class="option" data-nav="style" data-val="external" data-idx="2">
            <div class="radio-circle"><div class="radio-inner"></div></div>
            <span>External CSS</span>
          </div>
          <div class="option" data-nav="style" data-val="local" data-idx="3">
            <div class="radio-circle"><div class="radio-inner"></div></div>
            <span>Local CSS</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">Media Query</span>
          <span class="info-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>
        </div>
        <div class="options-grid">
          <div class="option active" data-nav="media" data-val="on" data-idx="0">
            <div class="radio-circle"><div class="radio-inner"></div></div>
            <span>On</span>
          </div>
          <div class="option" data-nav="media" data-val="off" data-idx="1">
            <div class="radio-circle"><div class="radio-inner"></div></div>
            <span>Off</span>
          </div>
        </div>
      </div>

      <button class="action-btn" id="main-copy-btn" data-nav="action" data-idx="0">
        <span>Copy</span>
        <div class="menu-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></div>
      </button>
    `;
    shadowRoot.appendChild(panel);
    
    // Event Listeners
    shadowRoot.getElementById('close-panel')?.addEventListener('click', () => {
      panelContainer!.style.display = 'none';
    });
    
    shadowRoot.getElementById('expand-btn')?.addEventListener('click', () => {
      console.log('DivCraft: Expand button clicked');
      if (currentExtractedData) {
        console.log('DivCraft: Sending OPEN_EDITOR message');
        chrome.runtime.sendMessage({ type: 'OPEN_EDITOR', data: currentExtractedData });
        panelContainer!.style.display = 'none';
      } else {
        console.warn('DivCraft: No extracted data available to open editor');
      }
    });

    const handleNav = (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!hoverElement) return;
      let nextElement: HTMLElement | null = null;
      if (direction === 'up') nextElement = hoverElement.parentElement;
      else if (direction === 'down') nextElement = hoverElement.firstElementChild as HTMLElement;
      else if (direction === 'left') nextElement = hoverElement.previousElementSibling as HTMLElement;
      else if (direction === 'right') nextElement = hoverElement.nextElementSibling as HTMLElement;

      if (nextElement && nextElement !== document.documentElement && nextElement !== document.body) {
        hoverElement = nextElement;
        updateOverlay(hoverElement);
        
        if (extractionTimeout) window.clearTimeout(extractionTimeout);
        extractionTimeout = window.setTimeout(() => {
          const data = extractElement(hoverElement!);
          showPanel(data, hoverElement!);
          extractionTimeout = null;
        }, 100);
      }
    };

    shadowRoot.getElementById('nav-up')?.addEventListener('click', () => handleNav('up'));
    shadowRoot.getElementById('nav-down')?.addEventListener('click', () => handleNav('down'));
    shadowRoot.getElementById('nav-left')?.addEventListener('click', () => handleNav('left'));
    shadowRoot.getElementById('nav-right')?.addEventListener('click', () => handleNav('right'));

    const topBtns = shadowRoot.querySelectorAll('.top-toggle-btn');
    topBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        topBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.textContent === 'Editor') {
          shadowRoot!.getElementById('expand-btn')?.click();
        }
      });
    });

    const options = shadowRoot.querySelectorAll('.option');
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const nav = opt.getAttribute('data-nav');
        const val = opt.getAttribute('data-val');
        shadowRoot!.querySelectorAll(`[data-nav="${nav}"]`).forEach(el => el.classList.remove('active'));
        opt.classList.add('active');
        if (nav === 'format') currentFormat = val!;
        if (nav === 'style') currentStyle = val!;
        if (nav === 'media') mediaQuery = val!;
      });
    });

    const copyBtn = shadowRoot.getElementById('main-copy-btn') as HTMLButtonElement;
    copyBtn.onclick = () => {
      if (!currentExtractedData) return;
      const textToCopy = currentFormat === 'html' ? currentExtractedData.combined : currentExtractedData.jsx;
      navigator.clipboard.writeText(textToCopy);
      const span = copyBtn.querySelector('span')!;
      const originalText = span.textContent;
      span.textContent = 'Copied!';
      setTimeout(() => span.textContent = originalText, 2000);
    };

    // Keyboard Navigation Logic
    let currentGroupIdx = 0;
    let currentItemIdx = 0;
    const groups = ['top', 'format', 'style', 'media', 'action'];
    
    const updateFocus = () => {
      shadowRoot!.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
      const group = groups[currentGroupIdx];
      const items = shadowRoot!.querySelectorAll(`[data-nav="${group}"]`);
      const item = items[currentItemIdx] as HTMLElement;
      if (item) {
        item.classList.add('focused');
        item.scrollIntoView({ block: 'nearest' });
      }
    };

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentGroupIdx = (currentGroupIdx + 1) % groups.length;
        currentItemIdx = 0;
        updateFocus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentGroupIdx = (currentGroupIdx - 1 + groups.length) % groups.length;
        currentItemIdx = 0;
        updateFocus();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const items = shadowRoot!.querySelectorAll(`[data-nav="${groups[currentGroupIdx]}"]`);
        currentItemIdx = (currentItemIdx + 1) % items.length;
        updateFocus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const items = shadowRoot!.querySelectorAll(`[data-nav="${groups[currentGroupIdx]}"]`);
        currentItemIdx = (currentItemIdx - 1 + items.length) % items.length;
        updateFocus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const group = groups[currentGroupIdx];
        const items = shadowRoot!.querySelectorAll(`[data-nav="${group}"]`);
        const item = items[currentItemIdx] as HTMLElement;
        if (item) item.click();
      }
    });
  }

  function startSelection() {
    if (isSelecting) {
      console.log('DivCraft: Already selecting');
      return;
    }
    isSelecting = true;
    console.log('DivCraft: Starting selection mode');
    
    if (!overlay) createOverlay();
    if (!styleTag) createStyleTag();
    if (panelContainer) panelContainer.style.display = 'none';
    
    document.documentElement.classList.add('divcraft-selecting');
    
    window.addEventListener('mouseover', handleMouseOver, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('mousedown', preventAll, true);
    window.addEventListener('mouseup', preventAll, true);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    console.log('DivCraft: Selection mode active');
  }

  function stopSelection() {
    if (!isSelecting) return;
    isSelecting = false;
    console.log('DivCraft: Stopping selection mode');
    
    if (overlay) overlay.style.display = 'none';
    document.documentElement.classList.remove('divcraft-selecting');
    
    window.removeEventListener('mouseover', handleMouseOver, true);
    window.removeEventListener('click', handleClick, true);
    window.removeEventListener('mousedown', preventAll, true);
    window.removeEventListener('mouseup', preventAll, true);
    window.removeEventListener('scroll', handleScroll);
    
    console.log('DivCraft: Selection mode inactive');
  }

  function handleScroll() {
    if (isSelecting && hoverElement) {
      updateOverlay(hoverElement);
    }
  }

  function preventAll(e: Event) {
    if (!isSelecting) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  let overlayRafId: number | null = null;

  function updateOverlay(element: HTMLElement) {
    if (!overlay) return;
    
    if (overlayRafId) cancelAnimationFrame(overlayRafId);
    
    overlayRafId = requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      Object.assign(overlay.style, {
        display: 'block',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
      overlayRafId = null;
    });
  }

  function handleMouseOver(e: MouseEvent) {
    if (!isSelecting || !overlay) return;
    const target = e.target as HTMLElement;
    
    if (target === hoverElement) return; // Only update if target changed
    if (target === overlay || target === document.documentElement) return;
    if (panelContainer && panelContainer.contains(target)) return;
    
    hoverElement = target;
    updateOverlay(target);
  }

  function handleClick(e: MouseEvent) {
    if (!isSelecting) return;
    console.log('DivCraft: Click detected');
    
    preventAll(e);
    
    if (hoverElement) {
      console.log('DivCraft: Element selected', hoverElement);
      try {
        const data = extractElement(hoverElement);
        // Save to storage for popup
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ lastExtractedData: data }, () => {
            console.log('DivCraft: Data saved to storage');
          });
        }
        showPanel(data, hoverElement);
      } catch (err) {
        console.error('DivCraft: Extraction failed', err);
      }
    }
    
    stopSelection();
  }

  function showPanel(data: any, element: HTMLElement) {
    currentExtractedData = data;
    hoverElement = element; // Track current element for navigation
    
    if (!panelContainer) createPanel();
    panelContainer!.style.display = 'block';
    
    // Update element info (internal state)
    if (shadowRoot) {
      if (!cachedOrigTag) cachedOrigTag = shadowRoot.getElementById('orig-tag');
      if (!cachedMappedTag) cachedMappedTag = shadowRoot.getElementById('mapped-tag');
      
      if (cachedOrigTag) cachedOrigTag.textContent = element.tagName.toLowerCase();
      if (cachedMappedTag) {
        const jsx = data.jsx.trim();
        cachedMappedTag.textContent = jsx.startsWith('<div') ? 'div' : (jsx.match(/^<([a-z0-9]+)/i)?.[1] || 'div');
      }
    }

    console.log('DivCraft: Element data updated for popup');
  }

  let extractionTimeout: number | null = null;

  function handleKeyDown(e: KeyboardEvent) {
    const isPanelVisible = panelContainer && panelContainer.style.display !== 'none';
    if (!isSelecting && !isPanelVisible) return;

    if (e.key === 'Escape') {
      if (isSelecting) stopSelection();
      if (isPanelVisible) panelContainer!.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      // If panel is focused, let it handle its own navigation
      if (shadowRoot && shadowRoot.activeElement) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (!hoverElement) return;

      let nextElement: HTMLElement | null = null;
      if (e.key === 'ArrowUp') nextElement = hoverElement.parentElement;
      else if (e.key === 'ArrowDown') nextElement = hoverElement.firstElementChild as HTMLElement;
      else if (e.key === 'ArrowLeft') nextElement = hoverElement.previousElementSibling as HTMLElement;
      else if (e.key === 'ArrowRight') nextElement = hoverElement.nextElementSibling as HTMLElement;

      if (nextElement && nextElement !== document.documentElement && nextElement !== document.body) {
        hoverElement = nextElement;
        updateOverlay(hoverElement);
        
        // Debounce extraction for performance
        if (extractionTimeout) window.clearTimeout(extractionTimeout);
        extractionTimeout = window.setTimeout(() => {
          const data = extractElement(hoverElement!);
          if (isPanelVisible) showPanel(data, hoverElement!);
          extractionTimeout = null;
        }, 100);
        
        console.log('DivCraft: Keyboard navigated to', hoverElement.tagName);
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown, true);

  // Listen for messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('DivCraft: Message received in content script:', message.type);
    if (message.type === 'TOGGLE_SELECTION') {
      if (isSelecting) stopSelection();
      else startSelection();
      sendResponse({ status: 'toggled', isSelecting });
    } else if (message.type === 'NAVIGATE_DOM') {
      if (!hoverElement) return;
      
      let nextElement: HTMLElement | null = null;
      if (message.direction === 'up') nextElement = hoverElement.parentElement;
      else if (message.direction === 'down') nextElement = hoverElement.firstElementChild as HTMLElement;
      else if (message.direction === 'left') nextElement = hoverElement.previousElementSibling as HTMLElement;
      else if (message.direction === 'right') nextElement = hoverElement.nextElementSibling as HTMLElement;
      
      if (nextElement && nextElement !== document.documentElement && nextElement !== document.body) {
        hoverElement = nextElement;
        const data = extractElement(nextElement);
        showPanel(data, nextElement);
        
        // Update overlay position
        updateOverlay(nextElement);
        
        sendResponse({ data });
      } else {
        sendResponse({ error: 'No element in that direction' });
      }
      return true; // Keep channel open for async response
    }
  });

  // Listen for toggle command from window event (for simulation)
  window.addEventListener('divcraft-toggle-selection', () => {
    if (isSelecting) stopSelection();
    else startSelection();
  });

  // Initial check for URL params
  if (window.location.search.includes('divcraft_select=true')) {
    startSelection();
  }
}
