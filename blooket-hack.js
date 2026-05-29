
(function () {
  if (document.getElementById('__blooket_panel__')) {
    document.getElementById('__blooket_panel__').remove();
  }

  /* ── Styles ── */
  const style = document.createElement('style');
  style.textContent = `
    #__blooket_panel__ {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      border: 1px solid #e94560;
      border-radius: 12px;
      color: #fff;
      font-family: 'Segoe UI', sans-serif;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 0 30px rgba(233,69,96,0.4);
      user-select: none;
    }
    #__blooket_panel__ .bp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(233,69,96,0.15);
      border-bottom: 1px solid #e94560;
      border-radius: 12px 12px 0 0;
      cursor: move;
    }
    #__blooket_panel__ .bp-title {
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 1px;
      color: #e94560;
    }
    #__blooket_panel__ .bp-badge {
      background: #e94560;
      color: #fff;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 20px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    #__blooket_panel__ .bp-minimize {
      cursor: pointer;
      font-size: 18px;
      color: #aaa;
      line-height: 1;
      padding: 0 4px;
      transition: color 0.2s;
    }
    #__blooket_panel__ .bp-minimize:hover { color: #e94560; }
    #__blooket_panel__ .bp-body {
      padding: 12px 14px;
    }
    #__blooket_panel__ .bp-section {
      margin-bottom: 14px;
    }
    #__blooket_panel__ .bp-section-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #e94560;
      font-weight: 700;
      margin-bottom: 7px;
      border-bottom: 1px solid rgba(233,69,96,0.25);
      padding-bottom: 4px;
    }
    #__blooket_panel__ input[type=text] {
      width: 100%;
      padding: 7px 10px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 7px;
      color: #fff;
      font-size: 12px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }
    #__blooket_panel__ input[type=text]:focus {
      border-color: #e94560;
    }
    #__blooket_panel__ input[type=number] {
      width: 100%;
      padding: 7px 10px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 7px;
      color: #fff;
      font-size: 12px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
    }
    #__blooket_panel__ input[type=number]:focus {
      border-color: #e94560;
    }
    #__blooket_panel__ .bp-btn {
      display: inline-block;
      padding: 7px 12px;
      background: linear-gradient(135deg, #e94560, #c62a47);
      color: #fff;
      border: none;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      margin-top: 6px;
      width: 100%;
      letter-spacing: 0.5px;
    }
    #__blooket_panel__ .bp-btn:hover { opacity: 0.85; }
    #__blooket_panel__ .bp-btn:active { transform: scale(0.97); }
    #__blooket_panel__ .bp-btn.secondary {
      background: linear-gradient(135deg, #0f3460, #1a4a80);
    }
    #__blooket_panel__ .bp-btn.danger {
      background: linear-gradient(135deg, #c0392b, #922b21);
    }
    #__blooket_panel__ .bp-btn.success {
      background: linear-gradient(135deg, #27ae60, #1e8449);
    }
    #__blooket_panel__ .bp-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 6px 0;
    }
    #__blooket_panel__ .bp-toggle-label {
      font-size: 12px;
      color: #ccc;
    }
    #__blooket_panel__ .bp-toggle {
      position: relative;
      width: 36px;
      height: 20px;
    }
    #__blooket_panel__ .bp-toggle input { opacity: 0; width: 0; height: 0; }
    #__blooket_panel__ .bp-toggle-slider {
      position: absolute;
      inset: 0;
      background: #555;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #__blooket_panel__ .bp-toggle-slider:before {
      content: '';
      position: absolute;
      width: 14px;
      height: 14px;
      background: #fff;
      border-radius: 50%;
      left: 3px;
      top: 3px;
      transition: transform 0.2s;
    }
    #__blooket_panel__ .bp-toggle input:checked + .bp-toggle-slider { background: #e94560; }
    #__blooket_panel__ .bp-toggle input:checked + .bp-toggle-slider:before { transform: translateX(16px); }
    #__blooket_panel__ .bp-status {
      font-size: 11px;
      color: #2ecc71;
      text-align: center;
      min-height: 16px;
      margin-top: 4px;
      font-weight: 600;
    }
    #__blooket_panel__ .bp-status.error { color: #e74c3c; }
    #__blooket_panel__ .bp-stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 4px;
    }
    #__blooket_panel__ .bp-stat-box {
      background: rgba(255,255,255,0.06);
      border-radius: 7px;
      padding: 8px;
      text-align: center;
    }
    #__blooket_panel__ .bp-stat-val {
      font-size: 18px;
      font-weight: 700;
      color: #e94560;
    }
    #__blooket_panel__ .bp-stat-lbl {
      font-size: 10px;
      color: #999;
      margin-top: 2px;
    }
    /* Host overlay */
    #__blooket_overlay__ {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 888888;
    }
    #__blooket_overlay__ .overlay-msg {
      background: rgba(0,0,0,0.75);
      color: #fff;
      font-size: 48px;
      font-weight: 900;
      padding: 24px 48px;
      border-radius: 16px;
      text-align: center;
      border: 3px solid #e94560;
      box-shadow: 0 0 60px rgba(233,69,96,0.6);
      animation: bp-pop 0.35s cubic-bezier(.34,1.56,.64,1);
      max-width: 90vw;
      word-break: break-word;
      font-family: 'Segoe UI', sans-serif;
    }
    @keyframes bp-pop {
      from { transform: scale(0.5); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  /* ── Helper: read game state from React fiber ── */
  function getFiber(el) {
    const key = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
    return key ? el[key] : null;
  }
  function walkFiber(fiber, depth = 0) {
    if (!fiber || depth > 80) return null;
    const s = fiber.memoizedState;
    if (s && s.queue && s.memoizedState) return fiber;
    return walkFiber(fiber.return, depth + 1);
  }
  function getReactState() {
    const roots = document.querySelectorAll('#root, #__next, [id]');
    for (const r of roots) {
      const f = getFiber(r);
      if (f) return f;
    }
    return null;
  }

  /* ── Find firebase/blooket globals ── */
  function getBlooketGlobals() {
    const out = {};
    for (const k of Object.keys(window)) {
      if (k.toLowerCase().includes('blooket')) out[k] = window[k];
      if (k === 'firebase') out.firebase = window[k];
      if (k === 'db') out.db = window[k];
    }
    return out;
  }

  /* ── Panel HTML ── */
  const panel = document.createElement('div');
  panel.id = '__blooket_panel__';
  panel.innerHTML = `
    <div class="bp-header" id="bp-drag-handle">
      <span class="bp-title">⚡ BLOOKET PANEL</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="bp-badge">HACK</span>
        <span class="bp-minimize" id="bp-toggle-body">▼</span>
      </div>
    </div>
    <div class="bp-body" id="bp-body">

      <!-- Live Stats -->
      <div class="bp-section">
        <div class="bp-section-title">📊 Live Stats</div>
        <div class="bp-stat-grid" id="bp-stats">
          <div class="bp-stat-box"><div class="bp-stat-val" id="stat-tokens">—</div><div class="bp-stat-lbl">Tokens</div></div>
          <div class="bp-stat-box"><div class="bp-stat-val" id="stat-name">—</div><div class="bp-stat-lbl">Your Name</div></div>
          <div class="bp-stat-box"><div class="bp-stat-val" id="stat-correct">—</div><div class="bp-stat-lbl">Correct</div></div>
          <div class="bp-stat-box"><div class="bp-stat-val" id="stat-players">—</div><div class="bp-stat-lbl">Players</div></div>
        </div>
        <button class="bp-btn secondary" style="margin-top:8px" id="btn-refresh-stats">🔄 Refresh Stats</button>
      </div>

      <!-- Change Name -->
      <div class="bp-section">
        <div class="bp-section-title">✏️ Change Your Name</div>
        <input type="text" id="bp-name-input" placeholder="Enter new nickname..." />
        <button class="bp-btn" id="btn-set-name">✅ Apply Name</button>
      </div>

      <!-- Screen Message -->
      <div class="bp-section">
        <div class="bp-section-title">📺 Show Text on Screen</div>
        <input type="text" id="bp-overlay-text" placeholder="Type message to display..." />
        <input type="number" id="bp-overlay-dur" placeholder="Duration (seconds, 0 = forever)" min="0" style="margin-top:6px" />
        <button class="bp-btn" id="btn-show-overlay">📢 Show on Screen</button>
        <button class="bp-btn danger" style="margin-top:4px" id="btn-hide-overlay">✖ Hide Message</button>
      </div>

      <!-- Token Spoof -->
      <div class="bp-section">
        <div class="bp-section-title">💰 Spoof Tokens</div>
        <input type="number" id="bp-token-input" placeholder="Token amount (e.g. 9999)" min="0" />
        <button class="bp-btn success" id="btn-set-tokens">💎 Set Tokens</button>
      </div>

      <!-- Auto Answer Toggles -->
      <div class="bp-section">
        <div class="bp-section-title">🤖 Auto Features</div>
        <div class="bp-toggle-row">
          <span class="bp-toggle-label">Highlight Correct Answer</span>
          <label class="bp-toggle"><input type="checkbox" id="tog-highlight"><span class="bp-toggle-slider"></span></label>
        </div>
        <div class="bp-toggle-row">
          <span class="bp-toggle-label">Show Question Timer</span>
          <label class="bp-toggle"><input type="checkbox" id="tog-timer"><span class="bp-toggle-slider"></span></label>
        </div>
        <div class="bp-toggle-row">
          <span class="bp-toggle-label">Freeze Screen Effect</span>
          <label class="bp-toggle"><input type="checkbox" id="tog-freeze"><span class="bp-toggle-slider"></span></label>
        </div>
      </div>

      <!-- Cosmetic Panel -->
      <div class="bp-section">
        <div class="bp-section-title">🎨 Visual FX</div>
        <button class="bp-btn secondary" id="btn-rainbow">🌈 Rainbow Mode</button>
        <button class="bp-btn secondary" id="btn-matrix">🖥 Matrix Rain</button>
        <button class="bp-btn danger" id="btn-clear-fx">✖ Clear All FX</button>
      </div>

      <div class="bp-status" id="bp-status"></div>
    </div>
  `;
  document.body.appendChild(panel);

  /* ── Status helper ── */
  const statusEl = document.getElementById('bp-status');
  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.className = 'bp-status' + (isError ? ' error' : '');
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  }

  /* ── Minimize toggle ── */
  const body = document.getElementById('bp-body');
  const minBtn = document.getElementById('bp-toggle-body');
  minBtn.addEventListener('click', () => {
    const hidden = body.style.display === 'none';
    body.style.display = hidden ? '' : 'none';
    minBtn.textContent = hidden ? '▼' : '▲';
  });

  /* ── Draggable panel ── */
  (function makeDraggable() {
    const handle = document.getElementById('bp-drag-handle');
    let ox = 0, oy = 0, dragging = false;
    handle.addEventListener('mousedown', e => {
      dragging = true;
      ox = e.clientX - panel.getBoundingClientRect().left;
      oy = e.clientY - panel.getBoundingClientRect().top;
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      panel.style.left = (e.clientX - ox) + 'px';
      panel.style.top  = (e.clientY - oy) + 'px';
      panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  })();

  /* ── Stat refresh ── */
  function refreshStats() {
    let tokens = '—', name = '—', correct = '—', players = '—';
    try {
      const allText = document.body.innerText;
      // Try to read token count from DOM
      const tokMatch = allText.match(/(\d+)\s*token/i);
      if (tokMatch) tokens = tokMatch[1];

      // Player count
      const playerEls = document.querySelectorAll('[class*="player"],[class*="Player"]');
      if (playerEls.length) players = playerEls.length;

      // Check localStorage blooket keys
      for (const k of Object.keys(localStorage)) {
        if (k.toLowerCase().includes('blooket') || k.toLowerCase().includes('token')) {
          try {
            const v = JSON.parse(localStorage.getItem(k));
            if (v && typeof v.tokens === 'number') tokens = v.tokens;
            if (v && typeof v.name === 'string') name = v.name;
          } catch (_) {}
        }
      }
    } catch (e) {}

    document.getElementById('stat-tokens').textContent = tokens;
    document.getElementById('stat-name').textContent = name !== '—' ? name.substring(0, 8) : name;
    document.getElementById('stat-correct').textContent = correct;
    document.getElementById('stat-players').textContent = players;
    setStatus('Stats refreshed!');
  }
  document.getElementById('btn-refresh-stats').addEventListener('click', refreshStats);
  refreshStats();

  /* ── Change Name ── */
  document.getElementById('btn-set-name').addEventListener('click', () => {
    const newName = document.getElementById('bp-name-input').value.trim();
    if (!newName) { setStatus('Enter a name first!', true); return; }

    let changed = false;

    // Method 1: Update visible name elements in DOM
    document.querySelectorAll('[class*="name"],[class*="Name"],[class*="nickname"],[class*="Nickname"],[class*="player"],[class*="Player"]').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim().length > 0 && el.textContent.trim().length < 30) {
        el.textContent = newName;
        changed = true;
      }
    });

    // Method 2: localStorage patch
    for (const k of Object.keys(localStorage)) {
      try {
        const val = JSON.parse(localStorage.getItem(k));
        if (val && typeof val === 'object') {
          if ('name' in val) { val.name = newName; localStorage.setItem(k, JSON.stringify(val)); changed = true; }
          if ('nickname' in val) { val.nickname = newName; localStorage.setItem(k, JSON.stringify(val)); changed = true; }
        }
      } catch (_) {}
    }

    // Method 3: window.blooketUser or similar
    for (const k of ['blooketUser','user','currentUser','gameData']) {
      if (window[k] && typeof window[k] === 'object') {
        if ('name' in window[k]) { window[k].name = newName; changed = true; }
        if ('nickname' in window[k]) { window[k].nickname = newName; changed = true; }
      }
    }

    document.getElementById('stat-name').textContent = newName.substring(0, 8);
    setStatus(changed ? `Name set to "${newName}"!` : `Name applied (reload may be needed)`);
  });

  /* ── Overlay message ── */
  let overlayEl = null;
  let overlayTimer = null;

  document.getElementById('btn-show-overlay').addEventListener('click', () => {
    const msg = document.getElementById('bp-overlay-text').value.trim();
    const dur = parseFloat(document.getElementById('bp-overlay-dur').value) || 0;
    if (!msg) { setStatus('Enter a message first!', true); return; }

    if (overlayEl) overlayEl.remove();
    if (overlayTimer) clearTimeout(overlayTimer);

    overlayEl = document.createElement('div');
    overlayEl.id = '__blooket_overlay__';
    overlayEl.innerHTML = `<div class="overlay-msg">${msg}</div>`;
    document.body.appendChild(overlayEl);

    if (dur > 0) {
      overlayTimer = setTimeout(() => { if (overlayEl) { overlayEl.remove(); overlayEl = null; } }, dur * 1000);
    }
    setStatus(`Message displayed${dur > 0 ? ` for ${dur}s` : ' (permanent)'}!`);
  });

  document.getElementById('btn-hide-overlay').addEventListener('click', () => {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    if (overlayTimer) clearTimeout(overlayTimer);
    setStatus('Message hidden.');
  });

  /* ── Spoof tokens ── */
  document.getElementById('btn-set-tokens').addEventListener('click', () => {
    const amt = parseInt(document.getElementById('bp-token-input').value);
    if (isNaN(amt)) { setStatus('Enter a valid number!', true); return; }
    let changed = false;

    for (const k of Object.keys(localStorage)) {
      try {
        const val = JSON.parse(localStorage.getItem(k));
        if (val && typeof val === 'object' && 'tokens' in val) {
          val.tokens = amt;
          localStorage.setItem(k, JSON.stringify(val));
          changed = true;
        }
      } catch (_) {}
    }

    for (const k of ['blooketUser','user','currentUser','gameData','playerData']) {
      if (window[k] && typeof window[k] === 'object' && 'tokens' in window[k]) {
        window[k].tokens = amt;
        changed = true;
      }
    }

    document.getElementById('stat-tokens').textContent = amt;
    setStatus(changed ? `Tokens set to ${amt}!` : `Tokens patched (refresh may apply)`);
  });

  /* ── Highlight correct answer ── */
  let hlInterval = null;
  document.getElementById('tog-highlight').addEventListener('change', function () {
    if (this.checked) {
      hlInterval = setInterval(() => {
        document.querySelectorAll('[class*="answer"],[class*="Answer"],[class*="choice"],[class*="Choice"],[class*="option"],[class*="Option"]').forEach(el => {
          if (el.dataset.correct === 'true' || el.getAttribute('aria-label')?.toLowerCase().includes('correct')) {
            el.style.outline = '4px solid #2ecc71';
            el.style.boxShadow = '0 0 12px #2ecc71';
          }
        });
      }, 500);
      setStatus('Answer highlight ON');
    } else {
      clearInterval(hlInterval);
      document.querySelectorAll('[style*="2ecc71"]').forEach(el => {
        el.style.outline = '';
        el.style.boxShadow = '';
      });
      setStatus('Answer highlight OFF');
    }
  });

  /* ── Timer overlay ── */
  let timerEl = null;
  document.getElementById('tog-timer').addEventListener('change', function () {
    if (this.checked) {
      timerEl = document.createElement('div');
      timerEl.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#e94560;font-size:28px;font-weight:900;padding:10px 30px;border-radius:10px;z-index:999990;font-family:monospace;border:2px solid #e94560;pointer-events:none';
      document.body.appendChild(timerEl);
      let secs = 0;
      const iv = setInterval(() => {
        if (!document.getElementById('tog-timer')?.checked) { clearInterval(iv); timerEl?.remove(); return; }
        secs++;
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `⏱ ${m}:${s}`;
      }, 1000);
      setStatus('Timer started');
    } else {
      timerEl?.remove();
      timerEl = null;
      setStatus('Timer stopped');
    }
  });

  /* ── Freeze screen FX ── */
  document.getElementById('tog-freeze').addEventListener('change', function () {
    if (this.checked) {
      document.body.style.filter = 'blur(4px) brightness(0.6)';
      panel.style.filter = 'none';
      setStatus('Freeze FX ON');
    } else {
      document.body.style.filter = '';
      setStatus('Freeze FX OFF');
    }
  });

  /* ── Rainbow mode ── */
  let rainbowInterval = null;
  document.getElementById('btn-rainbow').addEventListener('click', () => {
    if (rainbowInterval) { clearInterval(rainbowInterval); rainbowInterval = null; setStatus('Rainbow OFF'); return; }
    let h = 0;
    rainbowInterval = setInterval(() => {
      document.body.style.filter = `hue-rotate(${h}deg)`;
      panel.style.filter = `hue-rotate(-${h}deg)`;
      h = (h + 3) % 360;
    }, 30);
    setStatus('Rainbow mode ON (click again to stop)');
  });

  /* ── Matrix rain ── */
  let matrixCanvas = null;
  document.getElementById('btn-matrix').addEventListener('click', () => {
    if (matrixCanvas) { matrixCanvas.remove(); matrixCanvas = null; setStatus('Matrix OFF'); return; }
    matrixCanvas = document.createElement('canvas');
    matrixCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:777777;pointer-events:none;opacity:0.35';
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    document.body.appendChild(matrixCanvas);
    const ctx = matrixCanvas.getContext('2d');
    const cols = Math.floor(matrixCanvas.width / 16);
    const drops = Array(cols).fill(1);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';
    function drawMatrix() {
      if (!matrixCanvas) return;
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      ctx.fillStyle = '#0f0';
      ctx.font = '14px monospace';
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, y * 16);
        if (y * 16 > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      requestAnimationFrame(drawMatrix);
    }
    drawMatrix();
    setStatus('Matrix rain ON (click again to stop)');
  });

  /* ── Clear all FX ── */
  document.getElementById('btn-clear-fx').addEventListener('click', () => {
    if (rainbowInterval) { clearInterval(rainbowInterval); rainbowInterval = null; }
    if (matrixCanvas) { matrixCanvas.remove(); matrixCanvas = null; }
    document.body.style.filter = '';
    panel.style.filter = '';
    document.getElementById('tog-freeze').checked = false;
    setStatus('All visual FX cleared!');
  });

  console.log('%c⚡ Blooket Panel loaded!', 'color:#e94560;font-size:16px;font-weight:bold');
})();
