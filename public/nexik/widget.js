/**
 * Nexik AI Chat Widget v4.0
 * Premium animated widget with Siri-like orb effects
 * 
 * Usage:
 * <script src="https://nexik.org/nexik/widget.js" data-id="YOUR_WIDGET_ID"></script>
 * 
 * With custom color:
 * <script src="https://nexik.org/nexik/widget.js" data-id="YOUR_ID" data-color="#ff6b6b"></script>
 * 
 * All options:
 * data-id           - Your widget ID (required)
 * data-color        - Primary color (default: #4fd1c5)
 * data-position     - bottom-right | bottom-left (default: bottom-right)
 * data-display-mode - modal | mini (default: modal)
 * data-modal-size   - sm | md | lg | xl (default: lg)
 * data-greeting     - Welcome message
 * data-bot-name     - Assistant name (default: Nexik)
 */

(function(window, document) {
  'use strict';

  const VERSION = '4.0.0';
  
  // State
  let config = {
    clientId: '',
    color: '#4fd1c5',
    secondaryColor: '#63b3ed',
    position: 'bottom-right',
    greeting: 'Привет! Чем могу помочь?',
    botName: 'Nexik',
    displayMode: 'modal',
    modalSize: 'lg',
    apiEndpoint: '/api/nexik/chat'
  };
  
  let sessionId = null;
  let messages = [];
  let isOpen = false;
  let isTyping = false;
  let isInitialized = false;
  let orbState = 'idle'; // idle | listening | thinking | speaking

  // DOM elements
  let widget = null;
  let backdrop = null;
  let container = null;
  let messagesEl = null;
  let inputEl = null;
  let orbs = [];

  // Color utilities
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 79, g: 209, b: 197 };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function getColorVariants(hex) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      primary: hex,
      light: `hsl(${hsl.h}, ${Math.min(hsl.s + 10, 100)}%, ${Math.min(hsl.l + 15, 90)}%)`,
      dark: `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 15, 20)}%)`,
      glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
      subtle: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
    };
  }

  // Session management
  function getSessionId() {
    const stored = localStorage.getItem('nexik_session_id');
    if (stored) return stored;
    const id = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem('nexik_session_id', id);
    return id;
  }

  function loadHistory() {
    try {
      const stored = localStorage.getItem('nexik_messages_' + config.clientId);
      if (stored) messages = JSON.parse(stored).slice(-50);
    } catch { messages = []; }
  }

  function saveHistory() {
    try {
      localStorage.setItem('nexik_messages_' + config.clientId, JSON.stringify(messages.slice(-50)));
    } catch {}
  }

  // Send message
  async function sendMessage(text) {
    if (!text.trim() || isTyping) return;

    const userMessage = {
      id: 'msg_' + Date.now(),
      content: text.trim(),
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    messages.push(userMessage);
    renderMessages();
    saveHistory();
    
    inputEl.value = '';
    inputEl.style.height = 'auto';
    isTyping = true;
    setOrbState('thinking');
    showTyping();

    try {
      const baseUrl = config.apiEndpoint.startsWith('http') 
        ? config.apiEndpoint 
        : (window.location.origin + config.apiEndpoint);
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: config.clientId,
          message: text.trim(),
          sessionId: sessionId,
          context: { companyName: config.botName, assistantName: config.botName },
          previousMessages: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      
      setOrbState('speaking');
      
      const aiMessage = {
        id: 'msg_' + Date.now(),
        content: data.text || data.response || data.message || 'Извините, произошла ошибка.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      messages.push(aiMessage);
      saveHistory();
      
      setTimeout(() => setOrbState('idle'), 2000);
      
    } catch (error) {
      console.error('[Nexik]', error);
      messages.push({
        id: 'msg_' + Date.now(),
        content: 'Извините, произошла ошибка. Попробуйте позже.',
        role: 'assistant',
        timestamp: new Date().toISOString()
      });
      setOrbState('idle');
    }

    hideTyping();
    renderMessages();
    isTyping = false;
  }

  function setOrbState(state) {
    orbState = state;
    orbs.forEach(orb => orb.setState && orb.setState(state));
  }

  // Render messages
  function renderMessages() {
    if (!messagesEl) return;
    messagesEl.innerHTML = '';

    if (messages.length === 0) {
      const welcomeDiv = document.createElement('div');
      welcomeDiv.className = 'nexik-welcome';
      welcomeDiv.innerHTML = `
        <div class="nexik-orb" id="nexik-welcome-orb"></div>
        <div class="nexik-welcome-title">${escapeHtml(config.botName)}</div>
        <div class="nexik-welcome-text">${escapeHtml(config.greeting)}</div>
        <div class="nexik-quick-actions">
          <button class="nexik-quick-btn" data-msg="Расскажите об услугах">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            Узнать об услугах
          </button>
          <button class="nexik-quick-btn" data-msg="Хочу записаться">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
            Записаться
          </button>
          <button class="nexik-quick-btn" data-msg="Связаться с менеджером">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            Связаться с менеджером
          </button>
        </div>
      `;
      messagesEl.appendChild(welcomeDiv);
      
      setTimeout(() => {
        const welcomeOrbEl = document.getElementById('nexik-welcome-orb');
        if (welcomeOrbEl) {
          const orb = createSiriOrb(welcomeOrbEl, 120);
          orbs.push(orb);
        }
      }, 50);
      return;
    }

    for (const msg of messages) {
      const msgEl = document.createElement('div');
      msgEl.className = `nexik-msg nexik-msg-${msg.role}`;
      
      if (msg.role === 'user') {
        msgEl.innerHTML = `
          <div class="nexik-msg-content">${escapeHtml(msg.content)}</div>
          <div class="nexik-msg-avatar nexik-avatar-user">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
        `;
      } else {
        const msgId = 'orb-msg-' + msg.id;
        msgEl.innerHTML = `
          <div class="nexik-msg-avatar nexik-avatar-ai" id="${msgId}"></div>
          <div class="nexik-msg-content">${escapeHtml(msg.content)}</div>
        `;
        setTimeout(() => {
          const orbEl = document.getElementById(msgId);
          if (orbEl && !orbEl.querySelector('canvas')) {
            createSiriOrb(orbEl, 32, false);
          }
        }, 50);
      }
      
      messagesEl.appendChild(msgEl);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'nexik-msg nexik-msg-assistant';
    el.id = 'nexik-typing';
    el.innerHTML = `
      <div class="nexik-msg-avatar nexik-avatar-ai nexik-avatar-thinking" id="nexik-typing-orb"></div>
      <div class="nexik-typing-indicator">
        <div class="nexik-typing-wave">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesEl?.appendChild(el);
    
    setTimeout(() => {
      const typingOrb = document.getElementById('nexik-typing-orb');
      if (typingOrb) createSiriOrb(typingOrb, 32, true, 'thinking');
    }, 50);
    
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('nexik-typing')?.remove();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // Premium Siri-like Orb with WebGL-quality canvas animation
  function createSiriOrb(container, size, animated = true, initialState = 'idle') {
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    let time = Math.random() * 100;
    let state = initialState;
    let animationId = null;
    const colors = getColorVariants(config.color);
    const rgb = hexToRgb(config.color);
    
    function draw() {
      time += state === 'thinking' ? 0.06 : state === 'speaking' ? 0.04 : 0.015;
      ctx.clearRect(0, 0, size, size);
      
      const cx = size / 2;
      const cy = size / 2;
      const baseRadius = size * 0.35;
      
      // Intensity based on state
      const intensity = state === 'thinking' ? 1.5 : state === 'speaking' ? 1.2 : state === 'listening' ? 1.3 : 1;
      const waveIntensity = state === 'thinking' ? 8 : state === 'speaking' ? 5 : 3;
      
      // Outer glow rings
      for (let ring = 3; ring >= 1; ring--) {
        const ringRadius = baseRadius * (1 + ring * 0.25);
        const alpha = 0.15 / ring * intensity;
        const pulseOffset = Math.sin(time * (0.5 + ring * 0.1)) * 0.1;
        
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius * (1 + pulseOffset), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        ctx.fill();
      }
      
      // Main blob with multiple wave layers
      const layers = 4;
      for (let layer = layers - 1; layer >= 0; layer--) {
        const layerProgress = layer / (layers - 1);
        const layerRadius = baseRadius * (0.5 + layerProgress * 0.5);
        
        ctx.beginPath();
        const points = 72;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Multiple harmonics for organic movement
          const wave1 = Math.sin(angle * 3 + time * 1.2 + layer) * waveIntensity * 0.4;
          const wave2 = Math.cos(angle * 5 - time * 0.8 + layer * 0.5) * waveIntensity * 0.3;
          const wave3 = Math.sin(angle * 7 + time * 1.5 - layer * 0.3) * waveIntensity * 0.2;
          const wave4 = Math.cos(angle * 2 - time * 0.5) * waveIntensity * 0.1;
          
          const r = layerRadius + (wave1 + wave2 + wave3 + wave4) * (1 - layerProgress * 0.5);
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Gradient for each layer
        const grad = ctx.createRadialGradient(
          cx - layerRadius * 0.3, 
          cy - layerRadius * 0.3, 
          0, 
          cx, cy, layerRadius * 1.5
        );
        
        const alpha = layer === 0 ? 1 : 0.6 - layerProgress * 0.3;
        const hueShift = layerProgress * 30;
        
        if (layer === 0) {
          grad.addColorStop(0, colors.light);
          grad.addColorStop(0.5, config.color);
          grad.addColorStop(1, colors.dark);
        } else {
          grad.addColorStop(0, `hsla(${rgbToHsl(rgb.r, rgb.g, rgb.b).h + hueShift}, 80%, 70%, ${alpha})`);
          grad.addColorStop(1, `hsla(${rgbToHsl(rgb.r, rgb.g, rgb.b).h - hueShift}, 70%, 50%, ${alpha * 0.5})`);
        }
        
        ctx.fillStyle = grad;
        ctx.fill();
      }
      
      // Inner bright core
      const coreGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.2, 
        cy - baseRadius * 0.2, 
        0, 
        cx, cy, baseRadius * 0.6
      );
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGrad.addColorStop(0.3, `rgba(255, 255, 255, ${0.4 * intensity})`);
      coreGrad.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);
      coreGrad.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
      
      // Sparkle effect for thinking state
      if (state === 'thinking') {
        for (let i = 0; i < 6; i++) {
          const sparkleAngle = time * 0.5 + (i / 6) * Math.PI * 2;
          const sparkleRadius = baseRadius * (0.8 + Math.sin(time * 2 + i) * 0.2);
          const sparkleX = cx + Math.cos(sparkleAngle) * sparkleRadius;
          const sparkleY = cy + Math.sin(sparkleAngle) * sparkleRadius;
          const sparkleSize = 2 + Math.sin(time * 3 + i) * 1;
          
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time * 4 + i) * 0.3})`;
          ctx.fill();
        }
      }
      
      if (animated) {
        animationId = requestAnimationFrame(draw);
      }
    }
    
    draw();
    
    return {
      setState: (newState) => { state = newState; },
      destroy: () => { 
        if (animationId) cancelAnimationFrame(animationId); 
        canvas.remove();
      }
    };
  }

  // Build styles
  function buildStyles() {
    const c = config.color;
    const colors = getColorVariants(c);
    const pos = config.position;
    const isLeft = pos.includes('left');
    const modalWidth = { sm: '50vw', md: '60vw', lg: '70vw', xl: '80vw' }[config.modalSize] || '70vw';
    
    return `
      .nexik-widget{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.5;--nx-primary:${c};--nx-primary-glow:${colors.glow};--nx-primary-subtle:${colors.subtle};--nx-bg:#0a0a0f;--nx-card:#111118;--nx-text:#fff;--nx-muted:rgba(255,255,255,0.6);--nx-border:rgba(255,255,255,0.08)}
      
      .nexik-btn{position:fixed;${isLeft?'left':'right'}:20px;bottom:20px;width:72px;height:72px;border-radius:50%;background:transparent;border:none;cursor:pointer;z-index:9998;padding:0;transition:transform .3s,box-shadow .3s}
      .nexik-btn:hover{transform:scale(1.08);box-shadow:0 0 40px var(--nx-primary-glow)}
      .nexik-btn canvas{border-radius:50%}
      
      .nexik-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);z-index:9999;opacity:0;pointer-events:none;transition:opacity .4s}
      .nexik-backdrop.open{opacity:1;pointer-events:auto}
      
      .nexik-box{position:fixed;z-index:10000;display:flex;flex-direction:column;background:var(--nx-bg);border:1px solid var(--nx-border);box-shadow:0 25px 100px rgba(0,0,0,0.6),0 0 80px var(--nx-primary-subtle);opacity:0;pointer-events:none;transition:all .4s cubic-bezier(0.16,1,0.3,1)}
      .nexik-box.open{opacity:1;pointer-events:auto}
      
      .nexik-box.mode-modal{top:50%;left:50%;transform:translate(-50%,-50%) scale(0.9);width:${modalWidth};max-width:calc(100vw - 40px);height:85vh;max-height:calc(100vh - 60px);border-radius:24px}
      .nexik-box.mode-modal.open{transform:translate(-50%,-50%) scale(1)}
      
      .nexik-box.mode-mini{${isLeft?'left':'right'}:20px;bottom:100px;width:400px;max-width:calc(100vw - 40px);height:600px;max-height:calc(100vh - 140px);border-radius:20px;transform:translateY(30px) scale(0.9)}
      .nexik-box.mode-mini.open{transform:translateY(0) scale(1)}
      
      .nexik-header{display:flex;align-items:center;gap:14px;padding:18px 22px;border-bottom:1px solid var(--nx-border);background:linear-gradient(180deg,rgba(255,255,255,0.02) 0%,transparent 100%)}
      .nexik-header-orb{width:44px;height:44px;flex-shrink:0}
      .nexik-header-info{flex:1;min-width:0}
      .nexik-header-name{font-weight:600;font-size:16px;color:var(--nx-text)}
      .nexik-header-status{font-size:12px;color:var(--nx-primary);display:flex;align-items:center;gap:6px}
      .nexik-header-status::before{content:'';width:7px;height:7px;background:var(--nx-primary);border-radius:50%;box-shadow:0 0 10px var(--nx-primary);animation:nexik-status-pulse 2s infinite}
      .nexik-header-actions{display:flex;gap:6px}
      .nexik-header-btn{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid var(--nx-border);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
      .nexik-header-btn:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15)}
      .nexik-header-btn svg{width:18px;height:18px;fill:var(--nx-muted)}
      
      .nexik-msgs{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:18px;scrollbar-width:thin;scrollbar-color:var(--nx-primary-subtle) transparent}
      .nexik-msgs::-webkit-scrollbar{width:5px}
      .nexik-msgs::-webkit-scrollbar-thumb{background:var(--nx-primary-subtle);border-radius:3px}
      
      .nexik-welcome{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:40px 24px;text-align:center}
      .nexik-orb{width:120px;height:120px;margin-bottom:28px}
      .nexik-welcome-title{font-size:22px;font-weight:600;color:var(--nx-text);margin-bottom:10px}
      .nexik-welcome-text{color:var(--nx-muted);font-size:15px;max-width:300px;margin-bottom:36px;line-height:1.6}
      .nexik-quick-actions{display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px}
      .nexik-quick-btn{display:flex;align-items:center;gap:14px;padding:16px 20px;background:rgba(255,255,255,0.02);border:1px solid var(--nx-border);border-radius:14px;color:var(--nx-text);font-size:14px;cursor:pointer;transition:all .25s;text-align:left}
      .nexik-quick-btn:hover{background:var(--nx-primary-subtle);border-color:var(--nx-primary);transform:translateX(6px);box-shadow:0 4px 20px var(--nx-primary-subtle)}
      .nexik-quick-btn svg{color:var(--nx-primary);flex-shrink:0}
      
      .nexik-msg{display:flex;gap:12px;max-width:85%;animation:nexik-msg-in .4s cubic-bezier(0.16,1,0.3,1)}
      .nexik-msg-user{align-self:flex-end;flex-direction:row-reverse}
      .nexik-msg-assistant{align-self:flex-start}
      .nexik-msg-avatar{width:36px;height:36px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .nexik-avatar-user{background:linear-gradient(135deg,var(--nx-primary-subtle),transparent)}
      .nexik-avatar-user svg{width:20px;height:20px;fill:var(--nx-primary)}
      .nexik-avatar-ai{background:transparent}
      .nexik-avatar-thinking{animation:nexik-think-pulse 1s infinite}
      .nexik-msg-content{padding:14px 18px;border-radius:18px;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
      .nexik-msg-user .nexik-msg-content{background:linear-gradient(135deg,var(--nx-primary),${colors.dark});color:#000;border-bottom-right-radius:6px;font-weight:500}
      .nexik-msg-assistant .nexik-msg-content{background:var(--nx-card);color:var(--nx-text);border:1px solid var(--nx-border);border-bottom-left-radius:6px}
      
      .nexik-typing-indicator{padding:14px 20px;background:var(--nx-card);border:1px solid var(--nx-border);border-radius:18px;border-bottom-left-radius:6px}
      .nexik-typing-wave{display:flex;gap:3px;height:20px;align-items:center}
      .nexik-typing-wave span{width:4px;height:4px;background:var(--nx-primary);border-radius:50%;animation:nexik-wave 1.2s infinite}
      .nexik-typing-wave span:nth-child(2){animation-delay:.1s}
      .nexik-typing-wave span:nth-child(3){animation-delay:.2s}
      .nexik-typing-wave span:nth-child(4){animation-delay:.3s}
      .nexik-typing-wave span:nth-child(5){animation-delay:.4s}
      
      .nexik-input-area{padding:18px 22px;border-top:1px solid var(--nx-border);display:flex;gap:14px;align-items:flex-end;background:rgba(0,0,0,0.3)}
      .nexik-input-wrap{flex:1;position:relative}
      .nexik-input-wrap::before{content:'';position:absolute;inset:-2px;border-radius:16px;background:linear-gradient(135deg,var(--nx-primary),${colors.light});opacity:0;transition:opacity .3s;pointer-events:none;z-index:-1}
      .nexik-input-wrap:focus-within::before{opacity:1}
      .nexik-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid var(--nx-border);border-radius:14px;padding:14px 18px;font-size:14px;color:var(--nx-text);outline:none;resize:none;max-height:120px;position:relative;transition:all .3s}
      .nexik-input::placeholder{color:var(--nx-muted)}
      .nexik-input:focus{border-color:transparent;background:rgba(255,255,255,0.06)}
      .nexik-send{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,var(--nx-primary),${colors.dark});border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s;flex-shrink:0;box-shadow:0 4px 15px var(--nx-primary-subtle)}
      .nexik-send:hover:not(:disabled){transform:scale(1.05) translateY(-2px);box-shadow:0 8px 30px var(--nx-primary-glow)}
      .nexik-send:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none}
      .nexik-send svg{width:22px;height:22px;fill:#000}
      
      .nexik-footer{text-align:center;padding:12px;font-size:11px;color:var(--nx-muted);border-top:1px solid var(--nx-border);opacity:0.6}
      .nexik-footer a{color:var(--nx-primary);text-decoration:none;transition:opacity .2s}
      .nexik-footer a:hover{opacity:0.8}
      
      @keyframes nexik-msg-in{from{opacity:0;transform:translateY(15px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes nexik-wave{0%,60%,100%{transform:translateY(0) scaleY(1)}30%{transform:translateY(-8px) scaleY(1.3)}}
      @keyframes nexik-status-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.9)}}
      @keyframes nexik-think-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      
      @media(max-width:640px){
        .nexik-box.mode-modal,.nexik-box.mode-mini{width:100%;height:100%;max-width:100%;max-height:100%;top:0;left:0;right:0;bottom:0;border-radius:0;transform:translateY(100%)}
        .nexik-box.mode-modal.open,.nexik-box.mode-mini.open{transform:translateY(0)}
        .nexik-btn{bottom:16px;${isLeft?'left':'right'}:16px;width:64px;height:64px}
        .nexik-header{padding:14px 18px}
        .nexik-msgs{padding:18px}
        .nexik-input-area{padding:14px 18px}
      }
    `;
  }

  // Build widget HTML
  function buildWidget() {
    const icons = {
      close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
      send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
      minimize: '<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>',
      expand: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>'
    };

    widget = document.createElement('div');
    widget.className = 'nexik-widget';
    widget.innerHTML = `
      <style>${buildStyles()}</style>
      <button class="nexik-btn" aria-label="Открыть чат" id="nexik-trigger-orb"></button>
      <div class="nexik-backdrop"></div>
      <div class="nexik-box mode-${config.displayMode}">
        <div class="nexik-header">
          <div class="nexik-header-orb" id="nexik-header-orb"></div>
          <div class="nexik-header-info">
            <div class="nexik-header-name">${escapeHtml(config.botName)}</div>
            <div class="nexik-header-status">Онлайн</div>
          </div>
          <div class="nexik-header-actions">
            <button class="nexik-header-btn nexik-btn-mode" aria-label="Сменить режим">${config.displayMode === 'modal' ? icons.minimize : icons.expand}</button>
            <button class="nexik-header-btn nexik-btn-close" aria-label="Закрыть">${icons.close}</button>
          </div>
        </div>
        <div class="nexik-msgs"></div>
        <div class="nexik-input-area">
          <div class="nexik-input-wrap">
            <textarea class="nexik-input" rows="1" placeholder="Напишите сообщение..."></textarea>
          </div>
          <button class="nexik-send" aria-label="Отправить">${icons.send}</button>
        </div>
        <div class="nexik-footer">Powered by <a href="https://netnext.site/nexik" target="_blank" rel="noopener">Nexik</a></div>
      </div>
    `;

    document.body.appendChild(widget);

    // Cache elements
    backdrop = widget.querySelector('.nexik-backdrop');
    container = widget.querySelector('.nexik-box');
    messagesEl = widget.querySelector('.nexik-msgs');
    inputEl = widget.querySelector('.nexik-input');

    // Create orbs
    const triggerOrb = createSiriOrb(document.getElementById('nexik-trigger-orb'), 72);
    const headerOrb = createSiriOrb(document.getElementById('nexik-header-orb'), 44);
    orbs.push(triggerOrb, headerOrb);

    // Event listeners
    widget.querySelector('.nexik-btn').addEventListener('click', toggle);
    widget.querySelector('.nexik-btn-close').addEventListener('click', close);
    widget.querySelector('.nexik-btn-mode').addEventListener('click', toggleMode);
    backdrop.addEventListener('click', close);
    widget.querySelector('.nexik-send').addEventListener('click', () => sendMessage(inputEl.value));
    
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputEl.value);
      }
    });
    
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });

    inputEl.addEventListener('focus', () => setOrbState('listening'));
    inputEl.addEventListener('blur', () => { if (!isTyping) setOrbState('idle'); });

    widget.addEventListener('click', (e) => {
      if (e.target.classList.contains('nexik-quick-btn')) {
        sendMessage(e.target.dataset.msg);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    renderMessages();
  }

  function toggleMode() {
    const newMode = config.displayMode === 'modal' ? 'mini' : 'modal';
    setMode(newMode);
  }

  function setMode(mode) {
    config.displayMode = mode;
    container.classList.remove('mode-modal', 'mode-mini');
    container.classList.add('mode-' + mode);
    
    const modeBtn = widget.querySelector('.nexik-btn-mode');
    modeBtn.innerHTML = mode === 'modal' 
      ? '<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
    
    if (isOpen) {
      backdrop.classList.toggle('open', mode === 'modal');
    }
  }

  function open() {
    if (!isInitialized) return;
    isOpen = true;
    container?.classList.add('open');
    if (config.displayMode === 'modal') {
      backdrop?.classList.add('open');
    }
    inputEl?.focus();
  }

  function close() {
    isOpen = false;
    container?.classList.remove('open');
    backdrop?.classList.remove('open');
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function updateColor(newColor) {
    config.color = newColor;
    const styleEl = widget.querySelector('style');
    if (styleEl) styleEl.textContent = buildStyles();
    
    // Recreate orbs with new color
    orbs.forEach(orb => orb.destroy && orb.destroy());
    orbs = [];
    
    const triggerOrb = createSiriOrb(document.getElementById('nexik-trigger-orb'), 72);
    const headerOrb = createSiriOrb(document.getElementById('nexik-header-orb'), 44);
    orbs.push(triggerOrb, headerOrb);
    
    renderMessages();
  }

  function init(options = {}) {
    if (isInitialized) {
      console.warn('[Nexik] Already initialized');
      return;
    }

    Object.assign(config, options);
    
    const script = document.currentScript || document.querySelector('script[data-client-id],script[data-id]');
    if (script) {
      config.clientId = script.getAttribute('data-id') || script.getAttribute('data-client-id') || config.clientId;
      config.color = script.getAttribute('data-color') || config.color;
      config.position = script.getAttribute('data-position') || config.position;
      config.greeting = script.getAttribute('data-greeting') || config.greeting;
      config.botName = script.getAttribute('data-bot-name') || config.botName;
      config.displayMode = script.getAttribute('data-display-mode') || config.displayMode;
      config.modalSize = script.getAttribute('data-modal-size') || config.modalSize;
    }

    sessionId = getSessionId();
    loadHistory();
    buildWidget();
    isInitialized = true;
    
    console.log('[Nexik] Widget v' + VERSION + ' initialized with color:', config.color);
  }

  window.Nexik = {
    init,
    open,
    close,
    toggle,
    setMode,
    updateColor,
    version: VERSION
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
