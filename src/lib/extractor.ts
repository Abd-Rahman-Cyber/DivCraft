/**
 * Core logic to extract HTML and CSS from a DOM element.
 */

export interface ExtractedData {
  html: string;
  jsx: string;
  css: string;
  combined: string;
}

const RELEVANT_STYLES = [
  "display", "position", "top", "left", "right", "bottom",
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "margin", "padding", "background", "color", "font-family", "font-size",
  "font-weight", "line-height", "text-align", "border", "border-radius",
  "box-shadow", "opacity", "z-index", "flex", "grid", "gap", "justify-content",
  "align-items", "overflow", "cursor", "transition", "transform",
  "backdrop-filter", "box-sizing"
];

export function extractElement(element: HTMLElement): ExtractedData {
  const clone = element.cloneNode(true) as HTMLElement;
  let cssBlock = "";
  let classCounter = 0;

  const processElement = (el: HTMLElement, originalEl: HTMLElement) => {
    const computed = window.getComputedStyle(originalEl);
    const className = `dc-extracted-${classCounter++}`;
    let elStyles = "";

    for (let i = 0; i < RELEVANT_STYLES.length; i++) {
      const prop = RELEVANT_STYLES[i];
      const value = computed.getPropertyValue(prop);
      if (value && value !== "none" && value !== "normal" && value !== "auto" && value !== "0px" && value !== "rgba(0, 0, 0, 0)") {
        elStyles += `  ${prop}: ${value};\n`;
      }
    }

    if (elStyles) {
      cssBlock += `.${className} {\n${elStyles}}\n\n`;
      el.classList.add(className);
    }

    const children = el.children;
    const originalChildren = originalEl.children;
    const len = children.length;
    for (let i = 0; i < len; i++) {
      processElement(children[i] as HTMLElement, originalChildren[i] as HTMLElement);
    }
  };

  processElement(clone, element);

  const html = clone.outerHTML;
  
  // Simple JSX conversion
  const jsx = html
    .replace(/class=/g, "className=")
    .replace(/for=/g, "htmlFor=")
    .replace(/style="([^"]*)"/g, (match, p1) => {
      const styleObj = p1.split(';').reduce((acc: any, style: string) => {
        const [key, val] = style.split(':').map(s => s.trim());
        if (key && val) {
          const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
          acc[camelKey] = val;
        }
        return acc;
      }, {});
      return `style={${JSON.stringify(styleObj)}}`;
    });

  const combined = `
<!-- HTML -->
${html}

<!-- CSS -->
<style>
${cssBlock}
</style>
  `.trim();

  return { html, jsx, css: cssBlock, combined };
}
