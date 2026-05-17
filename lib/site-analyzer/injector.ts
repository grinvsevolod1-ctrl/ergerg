import * as cheerio from 'cheerio'

interface UserData {
  companyName: string
  phone: string
  email: string
  description?: string
}

interface InjectorOptions {
  userData: UserData
  currentVariant: number
  totalVariants: number
  sourceUrl: string
}

// Phone patterns to find and replace
const PHONE_PATTERNS = [
  /\+7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
  /8[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
  /\+375[\s\-]?\(?\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
  /\d{3}[\s\-]\d{3}[\s\-]\d{2}[\s\-]\d{2}/g,
]

// Email pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Replace contacts in text
function replaceContacts(text: string, userData: UserData): string {
  let result = text
  
  // Replace phones
  for (const pattern of PHONE_PATTERNS) {
    result = result.replace(pattern, userData.phone)
  }
  
  // Replace emails
  result = result.replace(EMAIL_PATTERN, userData.email)
  
  return result
}

// Generate the injected script
function generateInjectedScript(options: InjectorOptions): string {
  const { userData, currentVariant, totalVariants, sourceUrl } = options
  
  return `
<script>
(function() {
  'use strict';
  
  // User data
  const userData = ${JSON.stringify(userData)};
  const currentVariant = ${currentVariant};
  const totalVariants = ${totalVariants};
  const sourceUrl = '${sourceUrl}';
  
  // ===== AUTO-REPLACE CONTACTS =====
  function replaceInTextNodes(element) {
    const phonePatterns = [
      /\\+7[\\s\\-]?\\(?\\d{3}\\)?[\\s\\-]?\\d{3}[\\s\\-]?\\d{2}[\\s\\-]?\\d{2}/g,
      /8[\\s\\-]?\\(?\\d{3}\\)?[\\s\\-]?\\d{3}[\\s\\-]?\\d{2}[\\s\\-]?\\d{2}/g,
      /\\+375[\\s\\-]?\\(?\\d{2}\\)?[\\s\\-]?\\d{3}[\\s\\-]?\\d{2}[\\s\\-]?\\d{2}/g,
    ];
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
    
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    
    textNodes.forEach(node => {
      let text = node.textContent;
      phonePatterns.forEach(p => { text = text.replace(p, userData.phone); });
      text = text.replace(emailPattern, userData.email);
      if (text !== node.textContent) node.textContent = text;
    });
  }
  
  // ===== MAKE TEXT EDITABLE =====
  function makeEditable() {
    const editableSelectors = 'h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, button';
    document.querySelectorAll(editableSelectors).forEach(el => {
      if (el.closest('#netnext-toolbar')) return;
      if (el.children.length === 0 || el.textContent.trim().length < 100) {
        el.contentEditable = 'true';
        el.style.outline = 'none';
        el.style.cursor = 'text';
        
        el.addEventListener('focus', function() {
          this.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
          this.style.borderRadius = '2px';
        });
        
        el.addEventListener('blur', function() {
          this.style.boxShadow = 'none';
        });
      }
    });
  }
  
  // ===== WATERMARKS =====
  function addWatermarks() {
    const watermark = document.createElement('div');
    watermark.id = 'netnext-watermark';
    watermark.innerHTML = \`
      <style>
        #netnext-watermark {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 999998;
          overflow: hidden;
        }
        .netnext-wm-text {
          position: absolute;
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.07);
          white-space: nowrap;
          transform: rotate(-30deg);
          user-select: none;
        }
      </style>
    \`;
    
    // Create grid of watermarks
    for (let y = -100; y < window.innerHeight + 200; y += 150) {
      for (let x = -200; x < window.innerWidth + 200; x += 300) {
        const wm = document.createElement('div');
        wm.className = 'netnext-wm-text';
        wm.style.left = x + 'px';
        wm.style.top = y + 'px';
        wm.textContent = 'ПРЕВЬЮ • NETNEXT.SITE';
        watermark.appendChild(wm);
      }
    }
    
    document.body.appendChild(watermark);
  }
  
  // ===== TOOLBAR =====
  function addToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'netnext-toolbar';
    toolbar.innerHTML = \`
      <style>
        #netnext-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          z-index: 999999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        #netnext-toolbar * {
          box-sizing: border-box;
        }
        .netnext-tb-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .netnext-tb-logo {
          font-weight: bold;
          font-size: 16px;
          background: linear-gradient(90deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .netnext-tb-company {
          color: #94a3b8;
        }
        .netnext-tb-company strong {
          color: white;
        }
        .netnext-tb-center {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .netnext-tb-hint {
          color: #64748b;
          font-size: 12px;
        }
        .netnext-tb-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .netnext-tb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          padding: 5px 12px;
          border-radius: 20px;
        }
        .netnext-tb-nav-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .netnext-tb-nav-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        .netnext-tb-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .netnext-tb-order {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .netnext-tb-order:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
      </style>
      
      <div class="netnext-tb-left">
        <span class="netnext-tb-logo">NetNext</span>
        <span class="netnext-tb-company">Превью для <strong>\${userData.companyName}</strong></span>
      </div>
      
      <div class="netnext-tb-center">
        <span class="netnext-tb-hint">Кликните на текст чтобы изменить</span>
      </div>
      
      <div class="netnext-tb-right">
        <div class="netnext-tb-nav">
          <button class="netnext-tb-nav-btn" id="netnext-prev" \${currentVariant <= 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span>Вариант \${currentVariant} из \${totalVariants}</span>
          <button class="netnext-tb-nav-btn" id="netnext-next" \${currentVariant >= totalVariants ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        <button class="netnext-tb-order" id="netnext-order">Заказать такой</button>
      </div>
    \`;
    
    document.body.insertBefore(toolbar, document.body.firstChild);
    
    // Add padding to body for toolbar
    document.body.style.paddingTop = '50px';
    
    // Navigation handlers
    document.getElementById('netnext-prev').addEventListener('click', function() {
      if (currentVariant > 1) {
        window.parent.postMessage({ type: 'netnext-navigate', direction: 'prev' }, '*');
      }
    });
    
    document.getElementById('netnext-next').addEventListener('click', function() {
      if (currentVariant < totalVariants) {
        window.parent.postMessage({ type: 'netnext-navigate', direction: 'next' }, '*');
      }
    });
    
    document.getElementById('netnext-order').addEventListener('click', function() {
      window.parent.postMessage({ type: 'netnext-order' }, '*');
    });
  }
  
  // ===== BLOCK CONTEXT MENU =====
  function blockContextMenu() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && (e.key === 's' || e.key === 'u' || e.key === 'c')) {
        e.preventDefault();
      }
    });
  }
  
  // ===== INIT =====
  function init() {
    replaceInTextNodes(document.body);
    makeEditable();
    addWatermarks();
    addToolbar();
    blockContextMenu();
    
    // Fix any fixed positioned elements
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' && el.id !== 'netnext-toolbar' && el.id !== 'netnext-watermark') {
        const top = parseInt(style.top) || 0;
        if (top < 60) {
          el.style.top = (top + 50) + 'px';
        }
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
`
}

// Inject our script and modifications into HTML
export function injectIntoHTML(html: string, options: InjectorOptions): string {
  const $ = cheerio.load(html)
  
  // Replace contacts in visible text
  $('body *').each((_, el) => {
    const $el = $(el)
    if ($el.children().length === 0) {
      const text = $el.text()
      const replaced = replaceContacts(text, options.userData)
      if (replaced !== text) {
        $el.text(replaced)
      }
    }
  })
  
  // Replace in title
  const title = $('title').text()
  if (title) {
    const parts = title.split(/[-|–—]/)
    if (parts.length > 1) {
      parts[0] = ` ${options.userData.companyName} `
      $('title').text(parts.join('-'))
    } else {
      $('title').text(`${options.userData.companyName} - Превью сайта`)
    }
  }
  
  // Replace in meta description
  $('meta[name="description"]').attr('content', options.userData.description || `Сайт компании ${options.userData.companyName}`)
  
  // Add base tag for relative URLs if not present
  if ($('base').length === 0) {
    const origin = new URL(options.sourceUrl).origin
    $('head').prepend(`<base href="${origin}/" />`)
  }
  
  // Inject our script before </body>
  const script = generateInjectedScript(options)
  $('body').append(script)
  
  return $.html()
}
