(function () {
  'use strict';
  if (document.getElementById('__bb_panel__')) {
    document.getElementById('__bb_panel__').style.display = 'flex';
    return;
  }

  // ── Config ──────────────────────────────────────────────────────────────────
  const SCRIPT_ORIGIN = (function () {
    const el = document.currentScript;
    if (el && el.src) {
      try { return new URL(el.src).origin; } catch (_) {}
    }
    return window.location.origin;
  })();
  const JOIN_API = SCRIPT_ORIGIN + '/api/blooket/join';

  const FB_CONFIG = {
    apiKey: 'AIzaSyCA-cTOnX19f6LFnDVVsHXya3k6ByP_MnU',
    authDomain: 'blooket-2020.firebaseapp.com',
    projectId: 'blooket-2020',
    storageBucket: 'blooket-2020.appspot.com',
    messagingSenderId: '741533559105',
    appId: '1:741533559105:web:b8cbb10e6123f2913519c0',
  };
  const FB_VER = '10.12.0';
  const FB_CDN = `https://www.gstatic.com/firebasejs/${FB_VER}`;

  const BLOOKS = ['Chick','Chicken','Cow','Dog','Cat','Bear','Fox','Owl','Deer','Wolf'];
  const ADJ = ['Fast','Crazy','Wild','Dark','Mega','Super','Ultra','Epic','Neon','Ice'];
  const NOUN = ['Shark','Tiger','Dragon','Eagle','Fox','Wolf','Hawk','Bear','Lion','Cobra'];
  const randName = () => `${ADJ[Math.random()*ADJ.length|0]}${NOUN[Math.random()*NOUN.length|0]}${Math.random()*99+1|0}`;
  const randBlook = () => BLOOKS[Math.random()*BLOOKS.length|0];

  // ── State ───────────────────────────────────────────────────────────────────
  let bots = [];
  let firebase = null;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #__bb_panel__ {
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      width: 340px; max-height: 90vh; overflow-y: auto;
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.22);
      font: 14px/1.4 system-ui, sans-serif;
      display: flex; flex-direction: column; color: #222;
      border: 2px solid #f4a800;
    }
    #__bb_panel__ * { box-sizing: border-box; }
    #__bb_hdr__ {
      background: #f4a800; color: #fff;
      padding: 10px 14px; border-radius: 14px 14px 0 0;
      font-weight: 800; font-size: 15px; cursor: move;
      display: flex; justify-content: space-between; align-items: center;
      user-select: none;
    }
    #__bb_hdr__ button {
      background: none; border: none; color: #fff; font-size: 18px;
      cursor: pointer; padding: 0 4px; line-height: 1;
    }
    #__bb_body__ { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    #__bb_panel__ label { font-size: 11px; font-weight: 700; letter-spacing: .04em; color: #666; text-transform: uppercase; }
    #__bb_panel__ input[type=text], #__bb_panel__ input[type=number], #__bb_panel__ input[type=password] {
      width: 100%; padding: 8px 10px; border: 1.5px solid #e0e0e0;
      border-radius: 8px; font-size: 13px; outline: none; margin-top: 2px;
    }
    #__bb_panel__ input:focus { border-color: #f4a800; }
    .bb-row { display: flex; gap: 6px; }
    .bb-row input { flex: 1; }
    .bb-btn {
      background: #f4a800; color: #fff; border: none; border-radius: 8px;
      padding: 9px 14px; font-weight: 700; font-size: 13px; cursor: pointer; width: 100%;
    }
    .bb-btn:hover { background: #e09600; }
    .bb-btn:disabled { opacity: .5; cursor: not-allowed; }
    .bb-btn-sm {
      background: #f4a800; color: #fff; border: none; border-radius: 6px;
      padding: 4px 8px; font-size: 11px; font-weight: 700; cursor: pointer;
    }
    .bb-btn-red { background: #e03c3c; }
    .bb-btn-red:hover { background: #c02020; }
    .bb-divider { border: none; border-top: 1px solid #f0f0f0; margin: 4px 0; }
    .bb-err { background: #fff0f0; border: 1px solid #f4a8a8; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #c00; }
    .bb-ok  { background: #f0fff4; border: 1px solid #a8f4c0; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #080; }
    .bb-section-title { font-size: 12px; font-weight: 800; color: #f4a800; letter-spacing: .06em; text-transform: uppercase; }
    .bb-bot-list { display: flex; flex-direction: column; gap: 4px; }
    .bb-bot-item {
      display: flex; align-items: center; gap: 6px;
      background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 6px 8px;
      font-size: 12px;
    }
    .bb-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .bb-dot-green { background: #22c55e; }
    .bb-dot-yellow { background: #eab308; }
    .bb-dot-red { background: #ef4444; }
    .bb-bot-name { flex: 1; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bb-toggle-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
    .bb-toggle { position: relative; width: 36px; height: 20px; }
    .bb-toggle input { opacity: 0; width: 0; height: 0; }
    .bb-slider { position: absolute; inset: 0; background: #ccc; border-radius: 20px; cursor: pointer; transition: .2s; }
    .bb-toggle input:checked + .bb-slider { background: #f4a800; }
    .bb-slider:before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .2s; }
    .bb-toggle input:checked + .bb-slider:before { transform: translateX(16px); }
  `;
  document.head.appendChild(style);

  // ── Panel HTML ───────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = '__bb_panel__';
  panel.innerHTML = `
    <div id="__bb_hdr__">
      <span>🤖 Blooket Bot</span>
      <button onclick="document.getElementById('__bb_panel__').style.display='none'" title="Hide">✕</button>
    </div>
    <div id="__bb_body__">
      <div id="__bb_msg__"></div>
      <div>
        <label>Game Code</label>
        <input type="text" id="bb_code" placeholder="e.g. 123456" />
      </div>
      <div>
        <label>Nickname</label>
        <input type="text" id="bb_nick" placeholder="Your bot name" />
      </div>
      <div>
        <label>Game Password <span style="font-weight:400;opacity:.6">(if any)</span></label>
        <input type="text" id="bb_pass" placeholder="Leave blank if none" />
      </div>
      <div class="bb-toggle-row">
        <span>Invisible prefix (First Place Switch)</span>
        <label class="bb-toggle"><input type="checkbox" id="bb_fps" checked><span class="bb-slider"></span></label>
      </div>
      <button class="bb-btn" id="bb_join_btn">Join Game</button>
      <hr class="bb-divider">
      <div class="bb-section-title">Flood Bots</div>
      <div class="bb-row">
        <input type="text" id="bb_prefix" placeholder="Name prefix (optional)" />
        <input type="number" id="bb_count" value="5" min="1" max="50" style="width:60px;flex:none" />
      </div>
      <button class="bb-btn" id="bb_flood_btn">Spawn Bots</button>
      <hr class="bb-divider">
      <div id="bb_bots_section" style="display:none">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="bb-section-title">My Bots (<span id="bb_bot_count">0</span> connected)</div>
          <button class="bb-btn-sm bb-btn-red" id="bb_kick_all">Kick All</button>
        </div>
        <div class="bb-bot-list" id="bb_bot_list"></div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // ── Drag ────────────────────────────────────────────────────────────────────
  (function () {
    const hdr = document.getElementById('__bb_hdr__');
    let ox = 0, oy = 0, dragging = false;
    hdr.addEventListener('mousedown', (e) => {
      dragging = true;
      const r = panel.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      panel.style.left = (e.clientX - ox) + 'px';
      panel.style.top  = (e.clientY - oy) + 'px';
      panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  })();

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function showMsg(html, type) {
    const el = document.getElementById('__bb_msg__');
    if (!html) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="bb-${type || 'err'}">${html}</div>`;
  }

  function renderBots() {
    const list = document.getElementById('bb_bot_list');
    const section = document.getElementById('bb_bots_section');
    const connected = bots.filter(b => b.status === 'connected').length;
    document.getElementById('bb_bot_count').textContent = connected;
    section.style.display = bots.length ? 'block' : 'none';
    list.innerHTML = bots.map((b, i) => {
      const dotClass = b.status === 'connected' ? 'bb-dot-green' : b.status === 'connecting' ? 'bb-dot-yellow' : 'bb-dot-red';
      return `<div class="bb-bot-item">
        <div class="bb-dot ${dotClass}"></div>
        <div class="bb-bot-name" title="${b.name}">${b.name}</div>
        ${b.status === 'connected' ? `
          <button class="bb-btn-sm" onclick="__bb_rename__(${i})">Rename</button>
          <button class="bb-btn-sm bb-btn-red" onclick="__bb_kick__(${i})">Kick</button>
        ` : `<span style="font-size:11px;color:#999">${b.status}</span>`}
      </div>`;
    }).join('');
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function ensureFirebase() {
    if (firebase) return;
    await loadScript(`${FB_CDN}/firebase-app-compat.js`);
    await loadScript(`${FB_CDN}/firebase-auth-compat.js`);
    await loadScript(`${FB_CDN}/firebase-database-compat.js`);
    firebase = window.firebase;
  }

  async function joinOneBot(code, name, password) {
    const res = await fetch(JOIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: code, name, ...(password ? { password } : {}) }),
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); }
    catch { throw new Error('API returned unexpected response. Make sure the game code is correct.'); }
    if (!body.success || !body.fbToken || !body.fbShardURL) {
      throw new Error(body.msg || 'Failed to join game');
    }
    const app = firebase.initializeApp(
      { ...FB_CONFIG, databaseURL: body.fbShardURL },
      `bb-${Date.now()}-${Math.random()}`
    );
    const auth = firebase.auth(app);
    await auth.signInWithCustomToken(body.fbToken);
    const db = firebase.database(app);
    await db.ref(`${code}/c/${name}`).set({ b: randBlook() });
    return { app, db };
  }

  // ── Join single bot ──────────────────────────────────────────────────────────
  document.getElementById('bb_join_btn').addEventListener('click', async function () {
    const code = document.getElementById('bb_code').value.trim();
    const nick = document.getElementById('bb_nick').value.trim();
    const pass = document.getElementById('bb_pass').value.trim();
    const fps  = document.getElementById('bb_fps').checked;
    if (!code || !nick) { showMsg('Enter a game code and nickname.'); return; }
    let name = fps ? '\u0020\u0020' + nick : nick;
    this.disabled = true; this.textContent = 'Joining…'; showMsg('');
    try {
      await ensureFirebase();
      const bot = { name, code, status: 'connecting', app: null, db: null };
      bots.push(bot); renderBots();
      const { app, db } = await joinOneBot(code, name, pass);
      bot.status = 'connected'; bot.app = app; bot.db = db;
      renderBots();
      showMsg('Bot joined successfully!', 'ok');
    } catch (e) {
      if (bots.length) bots[bots.length - 1].status = 'error';
      renderBots();
      showMsg(e.message);
    }
    this.disabled = false; this.textContent = 'Join Game';
  });

  // ── Flood bots ───────────────────────────────────────────────────────────────
  document.getElementById('bb_flood_btn').addEventListener('click', async function () {
    const code   = document.getElementById('bb_code').value.trim();
    const pass   = document.getElementById('bb_pass').value.trim();
    const prefix = document.getElementById('bb_prefix').value.trim();
    const fps    = document.getElementById('bb_fps').checked;
    const count  = Math.max(1, Math.min(50, parseInt(document.getElementById('bb_count').value) || 5));
    if (!code) { showMsg('Enter a game code first.'); return; }
    this.disabled = true; this.textContent = 'Spawning…'; showMsg('');
    try {
      await ensureFirebase();
      const newBots = Array.from({ length: count }, (_, i) => ({
        name: (prefix ? `${prefix}${bots.length + i + 1}` : randName()),
        code, status: 'connecting', app: null, db: null,
      }));
      newBots.forEach(b => {
        if (fps) b.name = '\u0020\u0020' + b.name;
        bots.push(b);
      });
      renderBots();
      await Promise.allSettled(newBots.map(async (bot) => {
        try {
          const { app, db } = await joinOneBot(code, bot.name, pass);
          bot.status = 'connected'; bot.app = app; bot.db = db;
        } catch { bot.status = 'error'; }
        renderBots();
      }));
      const ok = bots.filter(b => b.status === 'connected').length;
      showMsg(`${ok} bot(s) connected.`, 'ok');
    } catch (e) { showMsg(e.message); }
    this.disabled = false; this.textContent = 'Spawn Bots';
  });

  // ── Kick all ─────────────────────────────────────────────────────────────────
  document.getElementById('bb_kick_all').addEventListener('click', async function () {
    for (const bot of bots) {
      if (bot.status === 'connected' && bot.db && bot.code) {
        try { await bot.db.ref(`${bot.code}/c/${bot.name}`).remove(); } catch (_) {}
        try { bot.app && (await bot.app.delete()); } catch (_) {}
      }
    }
    bots = []; renderBots(); showMsg('All bots kicked.', 'ok');
  });

  // ── Rename / Kick individual ──────────────────────────────────────────────────
  window.__bb_rename__ = async function (i) {
    const bot = bots[i];
    if (!bot || bot.status !== 'connected') return;
    const newName = prompt('New name for bot:', bot.name);
    if (!newName || newName === bot.name) return;
    try {
      await bot.db.ref(`${bot.code}/c/${bot.name}`).remove();
      await bot.db.ref(`${bot.code}/c/${newName}`).set({ b: randBlook() });
      bot.name = newName;
      renderBots();
    } catch (e) { alert('Rename failed: ' + e.message); }
  };

  window.__bb_kick__ = async function (i) {
    const bot = bots[i];
    if (!bot) return;
    try {
      if (bot.db && bot.code) await bot.db.ref(`${bot.code}/c/${bot.name}`).remove();
      if (bot.app) await bot.app.delete();
    } catch (_) {}
    bots.splice(i, 1);
    renderBots();
  };

  renderBots();
})();
