/* =====================================================================
   sudo LEARN — game engine
   ===================================================================== */

const SAVE_KEY = 'sudolearn.v1';
const XP_PER_LEVEL = 250;
const RANKS = ['Guest','Novice','User','Power User','Scripter','Sysadmin','Kernel Hacker','root'];

const DEFAULTS = {
  xp: 0, days: {}, streak: 0, lastDay: null,
  mastery: {},              // id -> {b:box 0..5, c:correct, w:wrong, ts:lastSeen}
  missions: {},             // id -> true
  chunks: {},               // "lessonId#n" -> true
  settings: { theme:'matrix', crt:true, bite:5, sound:false }
};

let P = load();
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return { ...structuredClone(DEFAULTS), ...raw, settings: { ...DEFAULTS.settings, ...(raw.settings||{}) } };
  } catch { return structuredClone(DEFAULTS); }
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch {} }

const today = () => new Date().toISOString().slice(0,10);
const level = () => Math.floor(P.xp / XP_PER_LEVEL) + 1;
const rank  = () => RANKS[Math.min(RANKS.length-1, level()-1)];
const el = (id) => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const shuffle = a => { a = [...a]; for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const sample = (a,n) => shuffle(a).slice(0,n);

function m(id) { return P.mastery[id] || (P.mastery[id] = { b:0, c:0, w:0, ts:0 }); }
function masteryPct(ids) {
  if (!ids.length) return 0;
  return Math.round(ids.reduce((s,id) => s + Math.min(5, (P.mastery[id]||{}).b || 0), 0) / (ids.length*5) * 100);
}
function awardXP(n) {
  P.xp += n;
  const d = today();
  P.days[d] = (P.days[d]||0) + n;
  if (P.lastDay !== d) {
    const y = new Date(Date.now()-864e5).toISOString().slice(0,10);
    P.streak = (P.lastDay === y) ? P.streak + 1 : 1;
    P.lastDay = d;
  }
  save();
}
function scoreAnswer(id, ok) {
  const s = m(id);
  s.ts = Date.now();
  if (ok) { s.c++; s.b = Math.min(5, s.b + 1); awardXP(10); }
  else    { s.w++; s.b = Math.max(0, s.b - 1); awardXP(2); }
  save();
}

/* ---------------- answer checking ---------------- */
function normalize(s) {
  return String(s).toLowerCase().trim()
    .replace(/\s+/g,' ')
    .replace(/^sudo\s+/,'')
    .replace(/^(the|press|type|use|hit)\s+/,'')
    .replace(/\s*key$/,'')
    .replace(/[`'"]/g,'')
    .replace(/\bcontrol\b/,'ctrl')
    .replace(/ctrl\s*[+ ]\s*/,'ctrl-')
    .replace(/\^([a-z])/,'ctrl-$1');
}
function accepted(item) {
  const list = [item.cmd, ...(item.ans||[])];
  if (item.ex) list.push(item.ex);
  return [...new Set(list.map(normalize))];
}
function checkTyped(item, input) {
  const got = normalize(input);
  if (!got) return false;
  if (accepted(item).includes(got)) return true;
  // flag order does not matter:  ls -lh  ==  ls -hl
  const canon = s => { const t = s.split(' '); const head = t.shift();
    const flags = t.filter(x => /^-[a-z]+$/i.test(x)).join('').replace(/-/g,'').split('').sort().join('');
    const rest = t.filter(x => !/^-[a-z]+$/i.test(x)).join(' ');
    return (head + ' ' + flags + ' ' + rest).trim(); };
  return accepted(item).some(a => canon(a) === canon(got));
}

/* ---------------- question generator ---------------- */
function distractors(item, n) {
  const sameLesson = ALL_ITEMS.filter(i => i.lesson === item.lesson && i.id !== item.id);
  const sameCat    = ALL_ITEMS.filter(i => i.cat === item.cat && i.lesson !== item.lesson);
  const rest       = ALL_ITEMS.filter(i => i.cat !== item.cat);
  const out = []; const seen = new Set([item.what, item.cmd]);
  for (const src of [shuffle(sameLesson), shuffle(sameCat), shuffle(rest)]) {
    for (const d of src) {
      if (out.length >= n) break;
      if (seen.has(d.what) || seen.has(d.cmd)) continue;
      seen.add(d.what); seen.add(d.cmd); out.push(d);
    }
  }
  return out;
}
function makeQuestion(item, forceType) {
  const box = m(item.id).b;
  let type = forceType;
  if (!type) {
    const pool = box >= 3 ? ['type','type','mcq-cmd'] : box >= 1 ? ['mcq-cmd','type','mcq-what'] : ['mcq-what','mcq-cmd'];
    type = pool[Math.floor(Math.random()*pool.length)];
  }
  const isKey = item.kind === 'key';
  if (type === 'type') {
    return { type, item,
      prompt: isKey ? `Which keystroke ${item.what}?` : `Type the command that ${item.what}.`,
      placeholder: isKey ? 'keystroke…' : 'command…' };
  }
  if (type === 'mcq-cmd') {
    const ds = distractors(item, 3);
    return { type, item, prompt: (isKey ? 'Which keystroke ' : 'Which command ') + item.what + '?',
      options: shuffle([item, ...ds]).map(o => ({ label: o.cmd, right: o.id === item.id })) };
  }
  const ds = distractors(item, 3);
  return { type:'mcq-what', item, prompt: `What does <span class="cmdtag">${esc(item.cmd)}</span> do?`,
    options: shuffle([item, ...ds]).map(o => ({ label: 'It ' + o.what + '.', right: o.id === item.id })) };
}

/* ---------------- app state ---------------- */
const A = {
  tab: 'home',
  view: null,          // sub-view inside a tab
  quiz: null,
  learn: null,
  sh: null,
  mission: null,
  missTries: 0,
  histIdx: -1
};

const TABS = [
  ['home','Home'], ['learn','Learn'], ['drill','Drill'],
  ['terminal','Terminal'], ['reference','Reference'], ['progress','Progress']
];

/* ---------------- boot ---------------- */
const BOOT_LINES = [
  '[  <b>OK</b>  ] Started Command Practice Daemon',
  `[  <b>OK</b>  ] Mounted /usr/share/curriculum (Module 1, ${ALL_ITEMS.length} commands)`,
  '[  <b>OK</b>  ] Reached target Multi-User System',
  '[  <b>OK</b>  ] Loaded student progress from localStorage',
  '',
  'sudolearn login: <span style="color:var(--fg)">student</span>',
  'Password: <span style="color:var(--fg)">••••••••</span>',
  '',
  'Last login: just now on tty1'
];
function boot() {
  const log = el('bootlog');
  if (sessionStorage.getItem('booted')) { finishBoot(); return; }
  let i = 0;
  const tick = () => {
    if (i >= BOOT_LINES.length) { setTimeout(finishBoot, 420); return; }
    log.innerHTML += BOOT_LINES[i++] + '\n';
    setTimeout(tick, 190 + Math.random()*160);
  };
  setTimeout(tick, 320);
  el('boot').addEventListener('click', finishBoot);
  document.addEventListener('keydown', function once(e){ if(e.key==='Escape'||e.key==='Enter'){ finishBoot(); document.removeEventListener('keydown', once);} });
}
function finishBoot() {
  sessionStorage.setItem('booted','1');
  const b = el('boot'); if (b) b.remove();
  el('app').classList.remove('hidden');
}

/* ---------------- chrome ---------------- */
function applySettings() {
  document.documentElement.dataset.theme = P.settings.theme;
  document.body.classList.toggle('crt', !!P.settings.crt);
}
function renderTabs() {
  el('tabs').innerHTML = TABS.map(([id,label],i) =>
    `<button class="tab ${A.tab===id?'on':''}" data-tab="${id}">${label} <span class="k">[${i+1}]</span></button>`).join('');
  el('tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => go(b.dataset.tab));
}
function renderStatusbar() {
  const done = Object.values(P.mastery).filter(x => x.b >= 4).length;
  el('statusbar').innerHTML =
    `<span><b>${rank()}</b> · lvl ${level()}</span>` +
    `<span>XP <b>${P.xp}</b></span>` +
    `<span>streak <b>${P.streak}</b>d</span>` +
    `<span>mastered <b>${done}</b>/${ALL_ITEMS.length}</span>` +
    `<span>bite size <b>${P.settings.bite}</b></span>` +
    `<span class="muted">^L clear · Esc back</span>`;
  const bb = el('bitebtn'); if (bb) bb.textContent = `bite: ${P.settings.bite}`;
  const tb = el('themebtn'); if (tb) tb.textContent = (THEMES.find(t => t[0] === P.settings.theme) || ['','theme'])[1].toLowerCase();
}
function go(tab, view) { A.tab = tab; A.view = view || null; A.quiz = null; A.learn = null; render(); window.scrollTo({top:0,behavior:'smooth'}); }
function render() {
  renderTabs(); renderStatusbar();
  el('winpath').textContent = 'student@fedora: ~' + (A.tab === 'home' ? '' : '/' + A.tab);
  const s = el('screen');
  ({ home:renderHome, learn:renderLearn, drill:renderDrill, terminal:renderTerminal,
     reference:renderReference, progress:renderProgress }[A.tab] || renderHome)(s);
}
function prompt(cmd) {
  return `<p class="psline"><span class="u">student@fedora</span>:<span class="p">~</span>$ <span class="c">${esc(cmd)}</span><span class="cursor"></span></p>`;
}
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = msg;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2600);
}

/* ---------------- HOME ---------------- */
function renderHome(s) {
  const due = dueItems();
  const totalPct = masteryPct(ALL_ITEMS.map(i => i.id));
  const nextChunk = firstUnfinishedChunk();
  s.innerHTML = prompt('./sudolearn --start') + `
    <h1>sudo LEARN — practise Linux without breaking anything</h1>
    <p class="lead">${ALL_ITEMS.length} commands, flags and keystrokes, cut into ${countChunks()} bite-sized sets.
      Learn a set, get quizzed on it, then prove it in a real (simulated) terminal.<br>
      <span class="tag ok">Module ${READY_MODULES.map(mo => mo.num).join(', ')} of ${MODULES.length} loaded</span>
      <span class="tag">v${VERSION}</span></p>

    <div class="grid g3" style="margin-bottom:18px">
      <div class="card static"><div class="k muted" style="font-size:11px;letter-spacing:.7px">OVERALL MASTERY</div>
        <div style="font-size:26px;color:var(--accent)">${totalPct}%</div>
        <div class="bar" style="margin-top:8px"><i style="width:${totalPct}%"></i></div></div>
      <div class="card static"><div class="k muted" style="font-size:11px;letter-spacing:.7px">RANK</div>
        <div style="font-size:22px;color:var(--accent)">${rank()}</div>
        <div class="muted" style="font-size:12px">level ${level()} · ${P.xp % XP_PER_LEVEL}/${XP_PER_LEVEL} XP to next</div>
        <div class="bar" style="margin-top:8px"><i style="width:${(P.xp%XP_PER_LEVEL)/XP_PER_LEVEL*100}%"></i></div></div>
      <div class="card static"><div class="k muted" style="font-size:11px;letter-spacing:.7px">DUE FOR REVIEW</div>
        <div style="font-size:26px;color:${due.length?'var(--warn)':'var(--accent)'}">${due.length}</div>
        <div class="muted" style="font-size:12px">${due.length ? 'spaced repetition keeps these from fading' : 'nothing fading yet — nice'}</div></div>
    </div>

    <div class="grid g2">
      <button class="card" data-act="continue">
        <h3>▶ ${nextChunk ? 'Continue learning' : 'Review everything'}</h3>
        <p>${nextChunk ? `Next up: <b>${esc(nextChunk.lesson.title)}</b> — set ${nextChunk.n+1} of ${nextChunk.total}, ${nextChunk.items.length} new bites.`
                       : 'You have been through every set. Time to drill.'}</p>
        <div class="meta"><span>Learn mode</span><span>+40 XP per set</span></div>
      </button>
      <button class="card" data-act="drill">
        <h3>⚡ Quick drill — 10 questions</h3>
        <p>Adaptive mix of multiple choice and type-the-command, weighted towards whatever you keep getting wrong.</p>
        <div class="meta"><span>Drill mode</span><span>+10 XP per correct</span></div>
      </button>
      <button class="card" data-act="review" ${due.length?'':'disabled style="opacity:.5"'}>
        <h3>🔁 Review ${due.length} fading command${due.length===1?'':'s'}</h3>
        <p>Only the ones your memory is about to drop. The fastest way to keep what you have already learned.</p>
        <div class="meta"><span>Spaced repetition</span><span>${due.length ? 'ready' : 'clear'}</span></div>
      </button>
      <button class="card" data-act="terminal">
        <h3>🖥 Terminal missions</h3>
        <p>A working fake Linux box with a real filesystem. ${MISSIONS.length} missions — solve them by actually typing commands.</p>
        <div class="meta"><span>${Object.keys(P.missions).length}/${MISSIONS.length} solved</span><span>+25 XP each</span></div>
      </button>
    </div>

    ${READY_MODULES.map(mo => `<h2>${esc(mo.label)} — where you stand</h2>
    <div class="grid g3">
      ${mo.cats.map(c => {
        const ids = ALL_ITEMS.filter(i => i.cat === c.id).map(i => i.id);
        const pct = masteryPct(ids);
        return `<button class="card" data-cat="${c.id}">
          <h3>${c.icon} ${esc(c.name)}</h3>
          <p>${esc(c.blurb)}</p>
          <div class="meta"><span>${ids.length} bites</span><span>${pct}%</span></div>
          <div class="bar" style="margin-top:6px"><i style="width:${pct}%"></i></div></button>`;
      }).join('')}
    </div>`).join('')}
    ${MODULES.filter(mo => !mo.ready).length ? `<p class="muted" style="font-size:12.5px;margin-top:18px">
      Modules ${MODULES.filter(mo => !mo.ready).map(mo => mo.num).join(', ')} have not been added yet —
      they will appear here as soon as their command lists land.</p>` : ''}`;

  s.querySelector('[data-act="continue"]').onclick = () => nextChunk ? startChunk(nextChunk.lesson.id, nextChunk.n) : go('drill');
  s.querySelector('[data-act="drill"]').onclick = () => startDrill(pickAdaptive(10));
  s.querySelector('[data-act="review"]').onclick = () => { if (due.length) startDrill(sample(due, Math.min(12, due.length))); };
  s.querySelector('[data-act="terminal"]').onclick = () => go('terminal');
  s.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => go('learn', b.dataset.cat));
}

/* ---------------- chunking ---------------- */
function chunksOf(lesson) {
  const size = P.settings.bite;
  const out = [];
  for (let i = 0; i < lesson.items.length; i += size) out.push(lesson.items.slice(i, i + size));
  // a trailing set of one or two cards is not worth its own quiz — fold it back
  if (out.length > 1 && out[out.length-1].length <= 2) {
    const tail = out.pop();
    out[out.length-1] = out[out.length-1].concat(tail);
  }
  return out;
}
function countChunks() { return LESSONS.reduce((n,l) => n + chunksOf(l).length, 0); }
function chunkKey(lessonId, n) { return `${lessonId}#${n}#${P.settings.bite}`; }
function firstUnfinishedChunk() {
  for (const lesson of LESSONS) {
    const cs = chunksOf(lesson);
    for (let n = 0; n < cs.length; n++)
      if (!P.chunks[chunkKey(lesson.id, n)]) return { lesson, n, total: cs.length, items: cs[n] };
  }
  return null;
}
function dueItems() {
  const now = Date.now();
  const gaps = [0, 6e4*20, 864e5, 3*864e5, 7*864e5, 21*864e5];  // box -> wait
  return ALL_ITEMS.filter(i => {
    const s = P.mastery[i.id];
    return s && s.ts && (now - s.ts) > gaps[Math.min(5, s.b)];
  }).map(i => i.id);
}
function pickAdaptive(n) {
  const seen = ALL_ITEMS.filter(i => P.mastery[i.id]);
  const pool = seen.length >= n ? seen : ALL_ITEMS;
  const weight = i => { const s = P.mastery[i.id]; return s ? (6 - s.b) * 2 + s.w * 3 : 3; };
  const bag = [];
  pool.forEach(i => { const w = Math.max(1, weight(i)); for (let k=0;k<w;k++) bag.push(i.id); });
  const out = [];
  while (out.length < Math.min(n, pool.length)) { const c = bag[Math.floor(Math.random()*bag.length)]; if (!out.includes(c)) out.push(c); }
  return out;
}

/* ---------------- LEARN ---------------- */
function renderLearn(s) {
  if (A.quiz) return renderQuestion(s);
  if (A.learn) return renderChunkCard(s);
  if (A.view && CURRICULUM.some(c => c.id === A.view)) return renderLessonList(s, A.view);
  if (A.view && /^mod\d+$/.test(A.view)) return renderTopicList(s, +A.view.slice(3));
  return renderModuleList(s);
}

function renderModuleList(s) {
  s.innerHTML = prompt('ls /usr/share/curriculum') + `
    <h1>Learn — pick a module</h1>
    <p class="lead">The course runs over ${MODULES.length} modules. Module 1 is loaded;
      the rest arrive as they are handed out.</p>
    <div class="grid g2">
      ${MODULES.map(mo => {
        if (!mo.ready) return `<button class="card static locked" disabled>
            <h3>${esc(mo.label)}</h3><p>${esc(mo.blurb)}</p>
            <div class="meta"><span>not added yet</span><span>🔒</span></div></button>`;
        const ids = mo.items.map(i => i.id);
        const allChunks = mo.cats.reduce((n,c) => n + c.lessons.reduce((k,l) => k + chunksOf(l).length, 0), 0);
        const doneChunks = mo.cats.reduce((n,c) => n + c.lessons.reduce((k,l) =>
          k + chunksOf(l).filter((_,i) => P.chunks[chunkKey(l.id,i)]).length, 0), 0);
        return `<button class="card" data-mod="${mo.num}">
            <h3>${esc(mo.label)}</h3>
            <p>${esc(mo.blurb)}</p>
            <div class="meta"><span>${mo.cats.length} topics · ${ids.length} bites</span>
              <span>${doneChunks}/${allChunks} sets done</span></div>
            <div class="bar" style="margin-top:6px"><i style="width:${masteryPct(ids)}%"></i></div>
          </button>`;
      }).join('')}
    </div>`;
  s.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => go('learn', 'mod' + b.dataset.mod));
}

function renderTopicList(s, num) {
  const mo = MODULE_OF[num];
  s.innerHTML = prompt(`cd module${num} && ls`) + `
    <h1>${esc(mo.label)}</h1>
    <p class="lead">${esc(mo.blurb)}<br>
      Every topic is split into short lessons, and every lesson into sets of ${P.settings.bite} bites.
      One idea per card, then a quick check on just those cards. Change the set size with the <b>bite</b> chip at the top right.</p>
    <div class="grid g2">
      ${mo.cats.map(c => {
        const ids = ALL_ITEMS.filter(i => i.cat === c.id).map(i => i.id);
        const lessons = c.lessons.length;
        const doneChunks = c.lessons.reduce((n,l) => n + chunksOf(l).filter((_,i) => P.chunks[chunkKey(l.id,i)]).length, 0);
        const allChunks = c.lessons.reduce((n,l) => n + chunksOf(l).length, 0);
        return `<button class="card" data-cat="${c.id}">
            <h3>${c.icon} ${esc(c.name)}</h3>
            <p>${esc(c.blurb)}</p>
            <div class="meta"><span>${lessons} lesson${lessons>1?'s':''} · ${ids.length} bites</span>
              <span>${doneChunks}/${allChunks} sets done</span></div>
            <div class="bar" style="margin-top:6px"><i style="width:${masteryPct(ids)}%"></i></div>
          </button>`;
      }).join('')}
    </div>
    <div class="row" style="margin-top:16px"><button class="btn" data-back>← all modules</button></div>`;
  s.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => go('learn', b.dataset.cat));
  s.querySelector('[data-back]').onclick = () => go('learn');
}

function renderLessonList(s, catId) {
  const cat = CURRICULUM.find(c => c.id === catId);
  s.innerHTML = prompt(`cd ${catId} && ls -l`) + `
    <h1>${cat.icon} ${esc(cat.name)}</h1>
    <p class="lead">${esc(cat.blurb)}</p>
    <p class="muted" style="font-size:12px;margin:-12px 0 16px">${esc(MODULE_OF[cat.mod].label)}</p>
    ${cat.lessons.map(l => {
      const cs = chunksOf(l);
      const ids = l.items.map(i => i.id);
      return `<div class="card static" style="margin-bottom:12px">
        <h3>${esc(l.title)}</h3>
        <p>${l.brief}</p>
        <div class="tagrow">${cs.map((c,i) => {
          const done = P.chunks[chunkKey(l.id,i)];
          return `<button class="btn ${done?'':'primary'}" style="padding:6px 12px;font-size:12px" data-l="${l.id}" data-n="${i}">
            ${done ? '✓ ' : '▶ '}Set ${i+1} <span class="muted">(${c.length})</span></button>`;
        }).join('')}
        <button class="btn ghost" style="padding:6px 12px;font-size:12px" data-quiz="${l.id}">Quiz this lesson</button></div>
        <div class="meta"><span>${l.items.length} bites</span><span>${masteryPct(ids)}% mastered</span></div>
        <div class="bar" style="margin-top:6px"><i style="width:${masteryPct(ids)}%"></i></div>
      </div>`;
    }).join('')}
    <button class="btn" data-back>← ${esc(MODULE_OF[cat.mod].label)}</button>`;
  s.querySelectorAll('[data-l]').forEach(b => b.onclick = () => startChunk(b.dataset.l, +b.dataset.n));
  s.querySelectorAll('[data-quiz]').forEach(b => b.onclick = () => {
    const l = LESSONS.find(x => x.id === b.dataset.quiz);
    startDrill(shuffle(l.items.map(i => i.id)));
  });
  s.querySelector('[data-back]').onclick = () => go('learn', 'mod' + cat.mod);
}

function startChunk(lessonId, n) {
  const lesson = LESSONS.find(l => l.id === lessonId);
  const items = chunksOf(lesson)[n];
  A.tab = 'learn';
  A.learn = { lesson, n, total: chunksOf(lesson).length, items, i: 0 };
  render();
}

function renderChunkCard(s) {
  const L = A.learn;
  const it = L.items[L.i];
  const box = m(it.id).b;
  s.innerHTML = prompt(`man ${it.cmd.split(' ')[0]}`) + `
    <h1>${esc(L.lesson.title)} <span class="muted" style="font-size:13px">· set ${L.n+1}/${L.total} · card ${L.i+1}/${L.items.length}</span></h1>
    <div class="lessonbrief">${L.lesson.brief}</div>
    <div class="chunkbar">${L.items.map((_,i) => `<i class="${i<L.i?'done':i===L.i?'now':''}"></i>`).join('')}</div>
    <div class="flash">
      <p class="big">${esc(it.cmd)}</p>
      <p class="what">It ${esc(it.what)}.</p>
      ${it.ex ? `<div class="demo"><span class="p">student@fedora:~$</span> ${esc(it.ex)}${
          it.out ? '\n' + `<span class="o">${esc(it.out)}</span>` : ''}</div>` : ''}
      ${it.note ? `<div class="chunknote"><b>Remember:</b> ${esc(it.note)}</div>` : ''}
    </div>
    <div class="row" style="margin-top:16px">
      <button class="btn" data-prev ${L.i===0?'disabled':''}>← back</button>
      <span class="muted" style="font-size:12px">${box >= 4 ? '★ you have this one down' : box > 0 ? '· seen before' : '· new to you'}</span>
      <span class="spacer"></span>
      <span class="muted" style="font-size:12px">Enter</span>
      <button class="btn primary" data-next>${L.i === L.items.length-1 ? 'Quick check →' : 'Next bite →'}</button>
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn ghost" style="font-size:12px;padding:6px 12px" data-exit>← leave lesson</button>
    </div>`;
  s.querySelector('[data-next]').onclick = advanceChunk;
  s.querySelector('[data-prev]').onclick = () => { if (L.i>0) { L.i--; render(); } };
  s.querySelector('[data-exit]').onclick = () => go('learn', L.lesson.cat);
}
function advanceChunk() {
  const L = A.learn;
  if (L.i < L.items.length - 1) { L.i++; render(); return; }
  // finished the cards -> quick check on exactly these items
  const ids = shuffle(L.items.map(i => i.id));
  const ctx = { lessonId: L.lesson.id, n: L.n, catId: L.lesson.cat };
  A.learn = null;
  startDrill(ids, { title:`Quick check — ${L.lesson.title} (set ${L.n+1})`, chunk: ctx, first:true });
}

/* ---------------- DRILL / QUIZ ---------------- */
function renderDrill(s) {
  if (A.quiz) return renderQuestion(s);
  const due = dueItems();
  s.innerHTML = prompt('./drill --pick-a-mode') + `
    <h1>Drill — prove you know it</h1>
    <p class="lead">Questions adapt to you: new commands come as multiple choice, and once you are getting them right
      you have to type them from memory.</p>
    <div class="grid g2">
      <button class="card" data-n="10"><h3>⚡ Quick drill · 10</h3>
        <p>Weighted towards your weak spots across everything you have seen.</p>
        <div class="meta"><span>adaptive</span><span>~3 min</span></div></button>
      <button class="card" data-n="25"><h3>🔥 Long drill · 25</h3>
        <p>A proper workout. Good the night before a lab quiz.</p>
        <div class="meta"><span>adaptive</span><span>~8 min</span></div></button>
      <button class="card" data-due ${due.length?'':'disabled style="opacity:.5"'}>
        <h3>🔁 Review due · ${due.length}</h3>
        <p>Only the commands your memory is about to lose. Spaced repetition.</p>
        <div class="meta"><span>spaced repetition</span><span>${due.length ? 'ready now' : 'nothing due'}</span></div></button>
      <button class="card" data-type><h3>⌨ Typing only</h3>
        <p>No multiple choice. Every answer typed out, exactly as you would at a real prompt.</p>
        <div class="meta"><span>hard mode</span><span>15 questions</span></div></button>
    </div>
    ${READY_MODULES.map(mo => `
      <h2>Drill one topic <span class="muted" style="font-size:12.5px">· ${esc(mo.label)}</span></h2>
      <div class="row" style="margin-bottom:10px">
        <button class="btn" data-mod="${mo.num}">Drill the whole module · 20 questions</button></div>
      <div class="grid g3">
        ${mo.cats.map(c => `<button class="card" data-cat="${c.id}"><h3>${c.icon} ${esc(c.name)}</h3>
          <div class="meta"><span>${ALL_ITEMS.filter(i=>i.cat===c.id).length} bites</span>
          <span>${masteryPct(ALL_ITEMS.filter(i=>i.cat===c.id).map(i=>i.id))}%</span></div></button>`).join('')}
      </div>`).join('')}`;
  s.querySelectorAll('[data-n]').forEach(b => b.onclick = () => startDrill(pickAdaptive(+b.dataset.n)));
  s.querySelector('[data-due]').onclick = () => { if (due.length) startDrill(sample(due, Math.min(15,due.length))); };
  s.querySelector('[data-type]').onclick = () => startDrill(pickAdaptive(15), { force:'type', title:'Typing drill' });
  s.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => {
    const ids = ALL_ITEMS.filter(i => i.cat === b.dataset.cat).map(i => i.id);
    startDrill(sample(ids, Math.min(15, ids.length)), { title: CURRICULUM.find(c=>c.id===b.dataset.cat).name + ' drill' });
  });
  s.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => {
    const mo = MODULE_OF[+b.dataset.mod];
    startDrill(sample(mo.items.map(i => i.id), Math.min(20, mo.items.length)), { title: mo.label + ' drill' });
  });
}

function startDrill(ids, opt = {}) {
  A.tab = opt.chunk ? 'learn' : A.tab === 'learn' ? 'learn' : 'drill';
  A.quiz = { ids, i:0, right:0, wrong:[], answered:false, opt, title: opt.title || 'Drill' };
  render();
}
function renderQuestion(s) {
  const Q = A.quiz;
  if (Q.i >= Q.ids.length) return renderQuizResult(s);
  const item = ITEM_BY_ID[Q.ids[Q.i]];
  if (!Q.q || Q.qFor !== Q.i) { Q.q = makeQuestion(item, Q.opt.force); Q.qFor = Q.i; Q.answered = false; }
  const q = Q.q;
  const pct = Math.round(Q.i / Q.ids.length * 100);

  s.innerHTML = prompt(`quiz --topic ${item.cat}`) + `
    <h1>${esc(Q.title)} <span class="muted" style="font-size:13px">· ${Q.i+1}/${Q.ids.length} · ${Q.right} correct</span></h1>
    <div class="bar" style="margin:0 0 18px"><i style="width:${pct}%"></i></div>
    <p class="qprompt">${q.prompt}</p>
    <div id="qbody"></div>
    <div id="qverdict"></div>
    <div class="row" style="margin-top:6px">
      <button class="btn ghost" style="font-size:12px;padding:6px 12px" data-quit>← give up on this round</button>
      <span class="spacer"></span>
      <span class="muted" style="font-size:12px">${q.type==='type' ? 'Enter to answer' : 'keys 1–4'}</span>
    </div>`;

  const body = el('qbody');
  if (q.type === 'type') {
    body.innerHTML = `<div class="typebox"><span class="ps">student@fedora:~$</span>
        <input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${q.placeholder}"></div>
      <div class="row"><button class="btn primary" id="tgo">Answer</button>
        <button class="btn" id="tskip">I don't know</button></div>`;
    const input = el('tin'); input.focus();
    const submit = () => answer(checkTyped(item, input.value), input.value);
    el('tgo').onclick = submit;
    el('tskip').onclick = () => answer(false, '');
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
  } else {
    body.innerHTML = `<div class="opts">${q.options.map((o,i) =>
      `<button class="opt" data-i="${i}"><span class="n">${i+1}</span><span>${esc(o.label)}</span></button>`).join('')}</div>`;
    body.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const o = q.options[+b.dataset.i];
      body.querySelectorAll('.opt').forEach((x,i) => { x.disabled = true;
        if (q.options[i].right) x.classList.add('right'); });
      if (!o.right) b.classList.add('wrong');
      answer(o.right, o.label);
    });
  }
  s.querySelector('[data-quit]').onclick = () => { A.quiz = null; render(); };
}

function answer(ok, given) {
  const Q = A.quiz;
  if (Q.answered) return;
  Q.answered = true;
  const item = ITEM_BY_ID[Q.ids[Q.i]];
  scoreAnswer(item.id, ok);
  if (ok) Q.right++; else Q.wrong.push(item.id);

  el('qverdict').innerHTML = `<div class="verdict ${ok?'ok':'no'}">
      <h4>${ok ? '✓ Correct — +10 XP' : '✗ Not quite'}</h4>
      <div><span class="cmdtag">${esc(item.cmd)}</span> — it ${esc(item.what)}.</div>
      ${!ok && given ? `<span class="note">You said: <span class="mono">${esc(given)}</span></span>` : ''}
      ${item.ex ? `<span class="note">Example: <span class="mono">${esc(item.ex)}</span></span>` : ''}
      ${item.note ? `<span class="note">${esc(item.note)}</span>` : ''}
    </div>
    <button class="btn primary" id="qnext">${Q.i === Q.ids.length-1 ? 'See results →' : 'Next question →'} <span class="muted">Enter</span></button>`;
  el('qnext').focus();
  el('qnext').onclick = () => { Q.i++; render(); };
}

function renderQuizResult(s) {
  const Q = A.quiz;
  const pct = Math.round(Q.right / Q.ids.length * 100);
  let bonus = 0;
  if (Q.opt.chunk) { P.chunks[chunkKey(Q.opt.chunk.lessonId, Q.opt.chunk.n)] = true; bonus = 40; awardXP(40); }
  else if (pct === 100) { bonus = 25; awardXP(25); }
  save();
  const mood = pct === 100 ? '🏆' : pct >= 80 ? '✅' : pct >= 50 ? '⚠️' : '📚';
  const msg = pct === 100 ? 'Perfect run. That is mastery.'
            : pct >= 80 ? 'Strong. The misses are already queued for review.'
            : pct >= 50 ? 'Getting there — the ones you missed will come round again sooner.'
            : 'That is what practice is for. Go back through the cards, then try again.';
  s.innerHTML = prompt('echo $?') + `
    <div class="center" style="padding:10px 0 4px"><div class="big-emoji">${mood}</div>
      <h1 style="margin-top:10px">${Q.right} / ${Q.ids.length} — ${pct}%</h1>
      <p class="lead">${msg}${bonus ? ` <b style="color:var(--accent)">+${bonus} bonus XP</b>` : ''}</p></div>
    ${Q.wrong.length ? `<h2>Worth another look</h2>
      <div class="reflist">${[...new Set(Q.wrong)].map(id => { const i = ITEM_BY_ID[id];
        return `<div class="refrow"><div class="c">${esc(i.cmd)}</div>
          <div class="w">It ${esc(i.what)}.${i.note ? `<span class="n">${esc(i.note)}</span>` : ''}</div></div>`;
      }).join('')}</div>` : ''}
    <div class="row" style="margin-top:18px">
      <button class="btn primary" data-again>Drill again</button>
      ${Q.wrong.length ? '<button class="btn" data-fix>Retry just the misses</button>' : ''}
      ${Q.opt.chunk ? '<button class="btn" data-nextset>Next set →</button>' : ''}
      <button class="btn ghost" data-home>← home</button>
    </div>`;
  s.querySelector('[data-again]').onclick = () => startDrill(pickAdaptive(10));
  const fix = s.querySelector('[data-fix]'); if (fix) fix.onclick = () => startDrill([...new Set(Q.wrong)]);
  const ns = s.querySelector('[data-nextset]');
  if (ns) ns.onclick = () => {
    const nx = firstUnfinishedChunk();
    if (nx) startChunk(nx.lesson.id, nx.n); else go('learn', Q.opt.chunk.catId);
  };
  s.querySelector('[data-home]').onclick = () => go('home');
  A.quiz = null;
}

/* ---------------- TERMINAL ---------------- */
function renderTerminal(s) {
  if (!A.sh) { A.sh = new Shell(); A.buffer = []; }
  const solved = Object.keys(P.missions).length;
  const cur = A.mission || nextMission();
  A.mission = cur;
  s.innerHTML = prompt('bash --login') + `
    <h1>Terminal — a Linux box you cannot break</h1>
    <p class="lead">Real filesystem, real flags, real error messages. Missions are checked against what actually happened,
      so any correct route counts. Type <span class="cmdtag">help</span>, or just explore.<br>
      <span class="tag ok">${MISSIONS.length} missions · ${READY_MODULES.map(mo => 'Module ' + mo.num).join(', ')}</span></p>
    <div class="termgrid">
      <div>
        <div id="term"></div>
        <div class="terminput"><span class="ps">[student@fedora <span id="cwdlab">${esc(shortCwd())}</span>]$</span>
          <input id="tinput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type a command and press Enter"></div>
        <div class="row" style="margin-top:8px">
          <button class="btn ghost" style="font-size:12px;padding:5px 11px" data-hint>Hint</button>
          <button class="btn ghost" style="font-size:12px;padding:5px 11px" data-skip>Skip mission</button>
          <button class="btn ghost" style="font-size:12px;padding:5px 11px" data-clear>Clear screen</button>
          <button class="btn ghost" style="font-size:12px;padding:5px 11px" data-resetfs>Reset filesystem</button>
        </div>
      </div>
      <div>
        <div class="mission ${cur?'':'done'}" id="missionbox">
          <h3>${cur ? 'Mission ' + (MISSIONS.indexOf(cur)+1) + ' / ' + MISSIONS.length : 'All missions solved'}</h3>
          ${cur ? `<div class="muted" style="font-size:11.5px;margin-bottom:6px">${esc(cur.tour)}</div>
                   <p class="goal">${esc(cur.goal)}</p>
                   <div class="muted" style="font-size:12px" id="hintbox"></div>`
                : `<p class="goal">You have cleared every mission. Free-play mode: try anything you like.</p>`}
          <div class="bar" style="margin-top:10px"><i style="width:${solved/MISSIONS.length*100}%"></i></div>
          <div class="muted" style="font-size:11.5px;margin-top:6px">${solved}/${MISSIONS.length} solved</div>
          <div class="misslist">${MISSIONS.map((mi,i) => `<div class="${P.missions[mi.id]?'done':''} ${cur&&cur.id===mi.id?'cur':''}" data-m="${mi.id}">
            ${P.missions[mi.id]?'✓':'·'} ${i+1}. ${esc(mi.goal.slice(0,48))}${mi.goal.length>48?'…':''}</div>`).join('')}</div>
        </div>
      </div>
    </div>`;

  const term = el('term');
  if (!A.buffer.length) {
    pushTerm({ t:'note', s:'Fedora Linux 40 (Workstation Edition) — simulated for practice' });
    pushTerm({ t:'out',  s:'Type a command below. Everything you learned in the lessons works here.' });
    pushTerm({ t:'out',  s:'' });
  }
  paintTerm();
  const input = el('tinput');
  input.focus();
  input.onkeydown = e => {
    if (e.key === 'Enter') { e.preventDefault(); runLine(input.value); input.value = ''; A.histIdx = -1; }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); const h = A.sh.history; if (h.length) { A.histIdx = A.histIdx < 0 ? h.length-1 : Math.max(0, A.histIdx-1); input.value = h[A.histIdx]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const h = A.sh.history; if (A.histIdx >= 0) { A.histIdx++; input.value = A.histIdx >= h.length ? (A.histIdx=-1, '') : h[A.histIdx]; } }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); A.buffer = []; paintTerm(); }
  };
  s.querySelector('[data-clear]').onclick = () => { A.buffer = []; paintTerm(); input.focus(); };
  s.querySelector('[data-resetfs]').onclick = () => { A.sh = new Shell(); A.buffer = []; pushTerm({t:'note',s:'Filesystem restored to its original state.'}); paintTerm(); input.focus(); };
  s.querySelector('[data-skip]').onclick = () => { if (A.mission) { A.mission = nextMission(A.mission.id); render(); } };
  s.querySelector('[data-hint]').onclick = () => { const h = el('hintbox'); if (h && A.mission) h.innerHTML = `💡 ${esc(A.mission.hint)}`; input.focus(); };
  s.querySelectorAll('[data-m]').forEach(d => d.onclick = () => { A.mission = MISSIONS.find(x => x.id === d.dataset.m); render(); });
}
function nextMission(afterId) {
  const start = afterId ? MISSIONS.findIndex(m2 => m2.id === afterId) + 1 : 0;
  return MISSIONS.slice(start).find(m2 => !P.missions[m2.id]) || MISSIONS.find(m2 => !P.missions[m2.id]) || null;
}
function pushTerm(o) { A.buffer.push(o); }
function shortCwd() { return A.sh.cwd.replace('/home/student', '~'); }
function runLine(line) {
  if (!line.trim()) { pushTerm({ t:'in', cwd: shortCwd(), s:'' }); paintTerm(); return; }
  pushTerm({ t:'in', cwd: shortCwd(), s: line });
  const res = A.sh.run(line);
  for (const r of res) {
    if (r.t === 'clear' || r.t === 'reset') { A.buffer = []; if (r.t === 'reset') pushTerm({ t:'note', s:'Terminal settings restored.' }); continue; }
    pushTerm(r);
  }
  const lab = el('cwdlab'); if (lab) lab.textContent = shortCwd();

  // mission check
  if (A.mission && !P.missions[A.mission.id]) {
    let solved = false;
    try { solved = !!A.mission.check(A.sh, line); } catch {}
    if (solved) {
      P.missions[A.mission.id] = true;
      const it = ITEM_BY_ID[A.mission.teach];
      if (it) scoreAnswer(it.id, true);
      awardXP(25); save();
      pushTerm({ t:'note', s:`✓ Mission solved  (+25 XP)${it ? '  —  ' + it.cmd + ': it ' + it.what + '.' : ''}` });
      A.missTries = 0;
      const nx = nextMission(A.mission.id);
      A.mission = nx;
      paintTerm();
      render();
      setTimeout(() => { const i2 = el('tinput'); if (i2) i2.focus(); }, 30);
      toast(nx ? '✓ Mission solved — next one loaded' : '🏆 Every mission solved!');
      return;
    }
    A.missTries++;
    if (A.missTries === 3) { const h = el('hintbox'); if (h) h.innerHTML = `💡 ${esc(A.mission.hint)}`; A.missTries = 0; }
  }
  paintTerm();
}
function paintTerm() {
  const term = el('term'); if (!term) return;
  term.innerHTML = A.buffer.map(o => {
    switch (o.t) {
      case 'in':   return `<div class="l in"><span class="ps">[student@fedora <span class="pth">${esc(o.cwd)}</span>]$</span> <span class="c">${esc(o.s)}</span></div>`;
      case 'err':  return `<div class="l err">${esc(o.s)}</div>`;
      case 'note': return `<div class="l note">${esc(o.s)}</div>`;
      case 'pager':return `<div class="l"><span class="pager">${esc(o.s)}</span></div>`;
      case 'garbage': return `<div class="l garbage">^@^H&lt;9f&gt;ELF^B^A^A^@&lt;fe&gt;^C&gt;^@^A^@^@&lt;c0&gt;^E^@^@&lt;bf&gt;@^@8^@^M^@@^@^^</div>`;
      case 'ls':   return `<div class="l nw">${esc(o.s)}<span class="${o.kind==='dir'?'d':o.kind==='link'?'ln':o.exec?'x':''}">${esc(o.name)}</span></div>`;
      case 'lsgrid': return `<div class="l nw grid2">${o.items.map(i =>
                        `<span class="${i.kind==='dir'?'d':i.kind==='link'?'ln':i.exec?'x':''}">${esc(i.name)}</span>`).join(' ')}</div>`;
      case 'app':  return appWindow(o);
      default:     return `<div class="l">${esc(o.s)}</div>`;
    }
  }).join('');
  term.scrollTop = term.scrollHeight;
}
function appWindow(o) {
  if (o.app === 'top') return `<div class="appwin"><h4>top — 09:31:07 up 2:14, 1 user, load average: 0.42, 0.31, 0.28</h4>
    <div class="l">Tasks: 213 total, 1 running, 212 sleeping</div>
    <div class="l">%Cpu(s):  2.3 us,  0.7 sy, 96.8 id</div>
    <div class="l">MiB Mem : 7842.1 total, 612.3 free, 2481.9 used</div>
    <div class="l">&nbsp;</div>
    <div class="l">  PID USER      PR  NI    RES %CPU %MEM COMMAND</div>
    <div class="l">  980 student   20   0   312M  2.4  3.8 gnome-shell</div>
    <div class="l"> 2841 student   20   0    5.1M  0.0  0.1 bash</div>
    <div class="keys">h = help · q = quit · (this snapshot does not refresh)</div></div>`;
  if (o.app === 'vim') {
    const it = ALL_ITEMS.filter(i => i.cat === 'vim');
    return `<div class="appwin"><h4>VIM — editing ${esc(o.file)} · NORMAL mode</h4>
      <div class="l">You are now in Vim. This simulator does not run the editor, but here is the way out:</div>
      <div class="l">&nbsp;</div>
      <div class="l"><b>:q</b>  quit (refuses if unsaved) &nbsp;·&nbsp; <b>:q!</b> quit and discard &nbsp;·&nbsp; <b>:wq</b> save and quit &nbsp;·&nbsp; <b>ZZ</b> save and quit</div>
      <div class="keys">Vim has ${it.length} bites in the Learn tab — that is where to practise the keys.</div></div>`;
  }
  if (o.app === 'man') {
    const t = o.topic;
    const it = ALL_ITEMS.find(i => i.cmd === t) || ITEM_BY_ID[t];
    const rel = ALL_ITEMS.filter(i => i.cmd.split(' ')[0] === t && i.cmd !== t).slice(0, 10);
    if (!it && !rel.length) return `<div class="appwin"><h4>man</h4><div class="l err">No manual entry for ${esc(t)}</div></div>`;
    return `<div class="appwin"><h4>${esc(t.toUpperCase())}(${o.section || 1})${o.section ? ' — section ' + o.section : ''}</h4>
      <div class="l"><b>NAME</b></div><div class="l">     ${esc(t)} — ${esc(it ? it.what : 'see options below')}</div>
      ${it && it.ex ? `<div class="l">&nbsp;</div><div class="l"><b>SYNOPSIS</b></div><div class="l">     ${esc(it.ex)}</div>` : ''}
      ${rel.length ? `<div class="l">&nbsp;</div><div class="l"><b>OPTIONS</b></div>${rel.map(r =>
        `<div class="l">     <span class="x">${esc(r.cmd)}</span> — ${esc(r.what)}</div>`).join('')}` : ''}
      ${it && it.note ? `<div class="l">&nbsp;</div><div class="l"><b>NOTES</b></div><div class="l">     ${esc(it.note)}</div>` : ''}
      <div class="keys">Space = page down · b = back · /text = search · q = quit</div></div>`;
  }
  return '';
}

/* ---------------- REFERENCE ---------------- */
function renderReference(s) {
  s.innerHTML = prompt('apropos .') + `
    <h1>Reference — every command in the course</h1>
    <p class="lead">${ALL_ITEMS.length} entries, all from ${READY_MODULES.map(mo => mo.label).join(' and ')}.
      Search by command, by what it does, or by flag. The bar on the right is your mastery.</p>
    <input class="search" id="refsearch" placeholder="search…  try: permission, background, ls, vim, delete" autocomplete="off">
    <div id="refout"></div>`;
  const draw = (q = '') => {
    const ql = q.toLowerCase().trim();
    const hits = ALL_ITEMS.filter(i => !ql || i.cmd.toLowerCase().includes(ql) || i.what.toLowerCase().includes(ql)
      || (i.note||'').toLowerCase().includes(ql) || i.catName.toLowerCase().includes(ql) || (i.ex||'').toLowerCase().includes(ql));
    if (!hits.length) { el('refout').innerHTML = `<p class="muted">No match. <span class="mono">apropos</span> would say: nothing appropriate.</p>`; return; }
    let html = '', cat = null;
    hits.forEach(i => {
      if (i.catName !== cat) { if (cat) html += '</div>'; cat = i.catName;
        html += `<div class="cathead">Module ${i.mod} · ${esc(cat)}</div><div class="reflist">`; }
      const b = (P.mastery[i.id]||{}).b || 0;
      html += `<div class="refrow"><div class="c">${esc(i.cmd)}</div>
        <div class="w">It ${esc(i.what)}.
          ${i.note ? `<span class="n">${esc(i.note)}</span>` : ''}
          ${i.ex ? `<span class="n">$ ${esc(i.ex)}</span>` : ''}
          <span class="st">${'█'.repeat(b)}${'░'.repeat(5-b)} ${['unseen','shaky','learning','solid','strong','mastered'][b]} · ${esc(i.lessonTitle)}</span>
        </div></div>`;
    });
    html += '</div>';
    el('refout').innerHTML = html;
  };
  draw();
  el('refsearch').oninput = e => draw(e.target.value);
  el('refsearch').focus();
}

/* ---------------- PROGRESS ---------------- */
function renderProgress(s) {
  const seen = ALL_ITEMS.filter(i => P.mastery[i.id]);
  const mastered = ALL_ITEMS.filter(i => (P.mastery[i.id]||{}).b >= 4);
  const weak = ALL_ITEMS.filter(i => { const x = P.mastery[i.id]; return x && x.b <= 2 && (x.w > 0 || x.c > 0); })
    .sort((a,b) => (P.mastery[a.id].b - P.mastery[b.id].b) || (P.mastery[b.id].w - P.mastery[a.id].w)).slice(0, 12);
  const totC = Object.values(P.mastery).reduce((n,x) => n + x.c, 0);
  const totW = Object.values(P.mastery).reduce((n,x) => n + x.w, 0);
  const acc = totC + totW ? Math.round(totC / (totC + totW) * 100) : 0;

  const days = []; for (let i = 34; i >= 0; i--) days.push(new Date(Date.now() - i*864e5).toISOString().slice(0,10));

  s.innerHTML = prompt('cat ~/.sudolearn/progress') + `
    <h1>Progress</h1>
    <div class="grid g3" style="margin-bottom:6px">
      <div class="stat"><div class="k">Rank</div><div class="v">${rank()}</div><div class="muted" style="font-size:12px">level ${level()}</div></div>
      <div class="stat"><div class="k">Total XP</div><div class="v">${P.xp}</div></div>
      <div class="stat"><div class="k">Day streak</div><div class="v">${P.streak}</div></div>
      <div class="stat"><div class="k">Accuracy</div><div class="v">${acc}%</div><div class="muted" style="font-size:12px">${totC} right · ${totW} wrong</div></div>
      <div class="stat"><div class="k">Mastered</div><div class="v">${mastered.length}</div><div class="muted" style="font-size:12px">of ${ALL_ITEMS.length} bites</div></div>
      <div class="stat"><div class="k">Missions</div><div class="v">${Object.keys(P.missions).length}</div><div class="muted" style="font-size:12px">of ${MISSIONS.length}</div></div>
    </div>

    <h2>Last 35 days</h2>
    <div class="heat">${days.map(d => { const xp = P.days[d]||0;
      return `<i class="${xp>=150?'l3':xp>=60?'l2':xp>0?'l1':''}" title="${d}: ${xp} XP"></i>`; }).join('')}</div>

    <h2>Mastery by module</h2>
    ${MODULES.map(mo => { const p = mo.ready ? masteryPct(mo.items.map(i => i.id)) : 0;
      return `<div class="masterrow"><div class="nm">${esc(mo.label)}</div>
        <div class="bar"><i style="width:${p}%"></i></div>
        <div class="pc">${mo.ready ? p + '%' : '—'}</div></div>`; }).join('')}

    ${READY_MODULES.map(mo => `<h2>Mastery by topic <span class="muted" style="font-size:12.5px">· ${esc(mo.label)}</span></h2>
    ${mo.cats.map(c => { const ids = ALL_ITEMS.filter(i => i.cat === c.id).map(i => i.id); const p = masteryPct(ids);
      return `<div class="masterrow"><div class="nm">${c.icon} ${esc(c.name)}</div>
        <div class="bar"><i style="width:${p}%"></i></div><div class="pc">${p}%</div></div>`; }).join('')}`).join('')}

    <h2>Weakest right now</h2>
    ${weak.length ? `<div class="reflist">${weak.map(i => `<div class="refrow"><div class="c">${esc(i.cmd)}</div>
        <div class="w">It ${esc(i.what)}.<span class="n">${P.mastery[i.id].w} wrong · ${P.mastery[i.id].c} right</span></div></div>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn primary" data-weak>Drill these ${weak.length}</button></div>`
      : `<p class="muted">Nothing flagged yet — answer some questions and your weak spots will collect here.</p>`}

    <h2>Save data</h2>
    <p class="muted" style="font-size:12.5px">Progress lives in this browser only (localStorage). ${seen.length} of ${ALL_ITEMS.length} bites touched.</p>
    <div class="row"><button class="btn" data-export>Export progress</button>
      <button class="btn" data-import>Import progress</button>
      <button class="btn ghost" data-reset>Reset everything</button></div>`;

  const w = s.querySelector('[data-weak]'); if (w) w.onclick = () => { A.tab='drill'; startDrill(weak.map(i => i.id), { title:'Weak-spot drill' }); };
  s.querySelector('[data-export]').onclick = () => {
    navigator.clipboard?.writeText(JSON.stringify(P)).then(() => toast('Progress JSON copied to clipboard'),
      () => window.prompt('Copy your progress:', JSON.stringify(P)));
  };
  s.querySelector('[data-import]').onclick = () => {
    const t = window.prompt('Paste exported progress JSON:');
    if (!t) return;
    try { P = { ...structuredClone(DEFAULTS), ...JSON.parse(t) }; save(); toast('Progress restored'); render(); }
    catch { toast('That was not valid progress data'); }
  };
  s.querySelector('[data-reset]').onclick = () => {
    if (confirm('Wipe all XP, mastery and mission progress? This cannot be undone.')) {
      P = structuredClone(DEFAULTS); save(); A.sh = null; toast('Progress wiped'); go('home');
    }
  };
}

/* ---------------- settings modal ---------------- */
const THEMES = [['matrix','Matrix'],['amber','Amber CRT'],['ubuntu','Ubuntu'],['dracula','Dracula'],['nord','Nord'],['paper','Paper (light)']];
function openSettings() {
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="inner">
    <h2>Settings</h2>
    <h3 style="font-size:13px;color:var(--dim);margin:14px 0 6px">Theme</h3>
    <div class="row">${THEMES.map(([id,n]) => `<button class="chip ${P.settings.theme===id?'on':''}" data-theme="${id}">${n}</button>`).join('')}</div>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Bite size — how many cards per learning set</h3>
    <div class="row">${[3,5,8].map(n => `<button class="chip ${P.settings.bite===n?'on':''}" data-bite="${n}">${n} cards</button>`).join('')}</div>
    <p class="muted" style="font-size:12px;margin-top:6px">Smaller sets mean more frequent quick checks. 3 is good for brand-new topics.</p>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Display</h3>
    <div class="row"><button class="chip ${P.settings.crt?'on':''}" data-crt>CRT scanlines: ${P.settings.crt?'on':'off'}</button></div>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Keyboard</h3>
    <p class="muted" style="font-size:12px">1–6 switch tabs · 1–4 pick an answer · Enter continues · Esc goes back · Ctrl-L clears the terminal</p>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">About</h3>
    <p class="muted" style="font-size:12px">sudo LEARN v${VERSION} — ${READY_MODULES.length} of ${MODULES.length} modules loaded.<br>
      &copy; ${new Date().getFullYear()} ${esc(COPYRIGHT_HOLDER)}. All rights reserved.</p>
    <div class="row" style="margin-top:8px"><button class="btn" data-changelog>View changelog</button></div>
    <div class="row" style="margin-top:18px"><button class="btn primary" data-close>Close</button></div>
  </div>`;
  document.body.appendChild(d);
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelectorAll('[data-theme]').forEach(b => b.onclick = () => { P.settings.theme = b.dataset.theme; save(); applySettings(); d.remove(); openSettings(); });
  d.querySelectorAll('[data-bite]').forEach(b => b.onclick = () => { P.settings.bite = +b.dataset.bite; save(); d.remove(); openSettings(); render(); });
  d.querySelector('[data-crt]').onclick = () => { P.settings.crt = !P.settings.crt; save(); applySettings(); d.remove(); openSettings(); };
  d.querySelector('[data-changelog]').onclick = () => { d.remove(); openChangelog(); };
  d.querySelector('[data-close]').onclick = () => d.remove();
}

/* ---------------- changelog ---------------- */
function openChangelog() {
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="inner">
    <h2>Changelog</h2>
    <p class="muted" style="font-size:12.5px;margin-top:-6px">
      sudo LEARN v${VERSION} · ${MODULES.length}-module course ·
      ${READY_MODULES.length} module${READY_MODULES.length===1?'':'s'} loaded so far</p>
    ${CHANGELOG.map(r => `<div class="release">
        <h3>v${esc(r.version)} <span class="muted">· ${esc(r.date)}</span></h3>
        <div class="rt">${esc(r.title)}</div>
        <ul>${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
      </div>`).join('')}
    <div class="release upcoming">
      <h3>Planned</h3>
      <div class="rt">Modules ${MODULES.filter(mo => !mo.ready).map(mo => mo.num).join(', ')}</div>
      <ul><li>Command lists for the remaining modules, each with its own lessons, drills and terminal missions.</li></ul>
    </div>
    <p class="muted" style="font-size:11.5px">&copy; ${new Date().getFullYear()} ${esc(COPYRIGHT_HOLDER)}. All rights reserved.</p>
    <div class="row" style="margin-top:14px"><button class="btn primary" data-close>Close</button></div>
  </div>`;
  document.body.appendChild(d);
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelector('[data-close]').onclick = () => d.remove();
}

/* ---------------- keyboard ---------------- */
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
  if (e.key === 'Escape') {
    const md = document.querySelector('.modal'); if (md) { md.remove(); return; }
    if (A.quiz) { A.quiz = null; render(); return; }
    if (A.learn) { const c = A.learn.lesson.cat; A.learn = null; go('learn', c); return; }
    if (A.view) { A.view = null; render(); return; }
    if (A.tab !== 'home') go('home');
    return;
  }
  if (typing) return;
  if (e.key === 'Enter') {
    const n = el('qnext') || document.querySelector('[data-next]');
    if (n) { e.preventDefault(); n.click(); }
    return;
  }
  if (/^[1-9]$/.test(e.key)) {
    if (A.quiz && A.quiz.q && A.quiz.q.type !== 'type' && !A.quiz.answered) {
      const o = document.querySelectorAll('.opt')[+e.key - 1]; if (o) { o.click(); return; }
    }
    const t = TABS[+e.key - 1]; if (t) go(t[0]);
  }
});

/* ---------------- start ---------------- */
applySettings();
el('settingsbtn').onclick = openSettings;
el('changelogbtn').onclick = openChangelog;
el('verstamp').textContent = 'v' + VERSION;
el('copyyear').textContent = new Date().getFullYear();
el('copyholder').textContent = COPYRIGHT_HOLDER;
el('bitebtn').onclick = () => {
  const order = [3,5,8]; P.settings.bite = order[(order.indexOf(P.settings.bite)+1) % order.length];
  save(); toast(`Bite size: ${P.settings.bite} cards per set`); render();
};
el('themebtn').onclick = () => {
  const i = THEMES.findIndex(t => t[0] === P.settings.theme);
  P.settings.theme = THEMES[(i+1) % THEMES.length][0]; save(); applySettings(); toast(`Theme: ${THEMES.find(t=>t[0]===P.settings.theme)[1]}`); render();
};
render();
boot();
