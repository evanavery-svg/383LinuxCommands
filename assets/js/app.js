/* =====================================================================
   sudo LEARN — game engine
   ===================================================================== */

const SAVE_KEY = 'sudolearn.v1';
const XP_PER_LEVEL = 250;
const RANKS = ['Guest','Novice','User','Power User','Scripter','Sysadmin','Kernel Hacker','root'];

const DEFAULTS = {
  xp: 0, days: {}, streak: 0, lastDay: null,
  mastery: {},              // id -> {b:box 0..5, c:correct, w:wrong, ts:lastSeen}
  learned: {},              // id -> true once its set has been finished
  quick: {},                // id -> best quiz result so far (true = got it right)
  missions: {},             // id -> true
  badges: {},               // id -> date unlocked
  chunks: {},               // legacy set-completion marks, kept so old saves still read
  bestCombo: 0, perfects: 0, goal: 100,
  settings: { theme:'matrix', crt:true, bite:3, freeroam:false }
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
  if (ok) {
    P.quick[id] = true;                       // best-ever result, so scores only climb
    s.c++; s.b = Math.min(5, s.b + 1);
    A.combo++;
    if (A.combo > P.bestCombo) P.bestCombo = A.combo;
    awardXP(10 + Math.min(10, Math.max(0, A.combo - 2) * 2));   // combo bonus, capped
  } else {
    if (P.quick[id] === undefined) P.quick[id] = false;
    s.w++; s.b = Math.max(0, s.b - 1); A.combo = 0; awardXP(2);
  }
  save();
}

/* a set counts as finished once every card in it has been learned.
   Tracking per item (not per set) means changing the bite size does not
   wipe your ticks. */
function setDone(items) { return items.every(i => P.learned[i.id]); }
/* A set's score is the share of its cards you have answered right — best
   result kept, so retrying a set can only push it up. Returns null for sets
   finished before scores were recorded, which still just show a tick. */
function setPct(items) {
  const scored = items.filter(i => P.quick[i.id] !== undefined);
  if (!scored.length) return null;
  return Math.round(scored.filter(i => P.quick[i.id]).length / items.length * 100);
}
function markLearned(items) { items.forEach(i => { P.learned[i.id] = true; }); save(); }
function learnedCount() { return Object.keys(P.learned).length; }
function missionCount() { return Object.keys(P.missions).length; }
function todayXP() { return P.days[today()] || 0; }
function goalPct() { return Math.min(100, Math.round(todayXP() / P.goal * 100)); }

/* ---------------- badges ---------------- */
const BADGES = [
  { id:'first',   icon:'🌱', name:'First steps',      desc:'Finish your first set',              test:()=>learnedCount() > 0 },
  { id:'bites25', icon:'📚', name:'Twenty-five in',   desc:'Learn 25 commands',                  test:()=>learnedCount() >= 25 },
  { id:'bites100',icon:'🎓', name:'Century',          desc:'Learn 100 commands',                 test:()=>learnedCount() >= 100 },
  { id:'combo5',  icon:'🔥', name:'On a roll',        desc:'5 correct answers in a row',         test:()=>P.bestCombo >= 5 },
  { id:'combo10', icon:'⚡', name:'Unstoppable',      desc:'10 correct answers in a row',        test:()=>P.bestCombo >= 10 },
  { id:'perfect', icon:'💯', name:'Flawless',         desc:'Score 100% on a quick check',        test:()=>P.perfects >= 1 },
  { id:'goal',    icon:'🎯', name:'Goal met',         desc:'Hit your daily XP goal',             test:()=>todayXP() >= P.goal },
  { id:'streak3', icon:'📅', name:'Three days',       desc:'Practise 3 days running',            test:()=>P.streak >= 3 },
  { id:'streak7', icon:'🗓️', name:'A full week',      desc:'Practise 7 days running',            test:()=>P.streak >= 7 },
  { id:'mission1',icon:'🖥️', name:'Hands on',         desc:'Solve your first terminal mission',  test:()=>missionCount() >= 1 },
  { id:'mission10',icon:'🛠️',name:'Shell tinkerer',   desc:'Solve 10 terminal missions',         test:()=>missionCount() >= 10 },
  { id:'missionAll',icon:'🏆',name:'Mission complete', desc:'Solve every terminal mission',       test:()=>missionCount() >= MISSIONS.length },
  { id:'vimquit', icon:'🚪', name:'Escaped Vim',      desc:'Master how to quit Vim',             test:()=>(P.mastery.vim_qbang||{}).b >= 3 },
  { id:'mod50',   icon:'🥈', name:'Halfway',          desc:'50% mastery of a whole module',      test:()=>READY_MODULES.some(mo => masteryPct(mo.items.map(i=>i.id)) >= 50) },
  { id:'mod100',  icon:'👑', name:'Module mastered',  desc:'100% mastery of a whole module',     test:()=>READY_MODULES.some(mo => masteryPct(mo.items.map(i=>i.id)) >= 100) }
];
function checkBadges() {
  const fresh = [];
  for (const b of BADGES) {
    if (P.badges[b.id]) continue;
    let got = false; try { got = !!b.test(); } catch {}
    if (got) { P.badges[b.id] = today(); fresh.push(b); }
  }
  if (fresh.length) { save(); fresh.forEach((b,i) => setTimeout(() => toast(`${b.icon} <b>Badge unlocked</b> — ${esc(b.name)}`), 500 + i*1400)); }
  return fresh;
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
  histIdx: -1,
  combo: 0
};

const TABS = [
  ['home','Home'], ['learn','Learn'], ['drill','Drill'],
  ['terminal','Terminal'], ['reference','Reference'], ['progress','Progress']
];

/* Shell text is case-sensitive and full of things a phone keyboard loves to
   "helpfully" correct, so every input we render turns all of that off. */
const TYPING_ATTRS = 'autocomplete="off" autocapitalize="off" autocorrect="off" ' +
                     'spellcheck="false" inputmode="text"';

/* Touch keyboards bury these behind a symbol layer or two. */
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches;
const TERM_KEYS = [
  { ins:'-' }, { ins:'/' }, { ins:'~' }, { ins:'.' }, { ins:'*' }, { ins:'$' },
  { ins:'|' }, { ins:'>' }, { ins:'&' }, { ins:'%' }, { ins:'+' }, { ins:':' },
  { ins:' ', label:'space', w:true }
];

/* ---------------- boot ---------------- */
const BOOT_LINES = [
  `[  <b>OK</b>  ] Started Command Practice Daemon (sudo LEARN v${VERSION})`,
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
  /* match the phone's status bar to the theme when installed to the home screen */
  const meta = el('themecolor');
  if (meta) {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--wall1').trim();
    if (bg) meta.setAttribute('content', bg);
  }
}
function renderTabs() {
  el('tabs').innerHTML = TABS.map(([id,label],i) =>
    `<button class="tab ${A.tab===id?'on':''}" data-tab="${id}">${label} <span class="k">[${i+1}]</span></button>`).join('');
  el('tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => go(b.dataset.tab));
  /* the bar is one sideways-scrolling row on a phone, so keep the active tab in view */
  const on = el('tabs').querySelector('.tab.on');
  if (on && on.scrollIntoView) on.scrollIntoView({ inline:'center', block:'nearest' });
}
function renderStatusbar() {
  const done = Object.values(P.mastery).filter(x => x.b >= 4).length;
  /* opt-hide drops out on phones, leaving the three numbers worth glancing at */
  el('statusbar').innerHTML =
    `<span class="opt-hide"><b>${rank()}</b> · lvl ${level()}</span>` +
    `<span class="opt-hide">XP <b>${P.xp}</b></span>` +
    `<span>streak <b>${P.streak}</b>d</span>` +
    `<span>learned <b>${learnedCount()}</b>/${ALL_ITEMS.length}</span>` +
    `<span>today <b>${todayXP()}</b>/${P.goal} XP</span>` +
    `<span class="muted opt-hide">^L clear · Esc back</span>`;
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
/* The home page is deliberately bare: just the modules. Everything else
   lives one click deeper, on the module's own page. */
function renderHome(s) {
  if (A.view && /^mod\d+$/.test(A.view)) return renderModuleHome(s, +A.view.slice(3));

  s.innerHTML = prompt('ls ~/course') + `
    <div class="hero">
      <h1>Choose a module</h1>
      <p class="lead">Work through one module at a time. Each is broken into short sets
        of ${P.settings.bite} cards — a couple of minutes each.</p>
    </div>
    <div class="modlist">
      ${MODULES.map(mo => {
        if (!mo.ready) return `<div class="modrow locked">
            <div class="num">${mo.num}</div>
            <div class="body"><h3>${esc(mo.label)}</h3></div>
            <div class="go">not added yet 🔒</div></div>`;
        const ids = mo.items.map(i => i.id);
        const pct = masteryPct(ids);
        const sets = allSets(mo.num);
        const done = sets.filter(x => x.done).length;
        return `<button class="modrow" data-mod="${mo.num}">
            <div class="num">${mo.num}</div>
            <div class="body">
              <h3>${esc(mo.label)}</h3>
              <p>${done ? `${done} of ${sets.length} sets done · ${pct}% mastered` : `${sets.length} short sets · start anywhere`}</p>
              <div class="bar"><i style="width:${sets.length ? done/sets.length*100 : 0}%"></i></div>
            </div>
            <div class="go">${done ? '▶' : '▶'}</div>
          </button>`;
      }).join('')}
    </div>
    <p class="muted center" style="font-size:12px;margin-top:22px">
      New here? Open Module 1 and press <b>Start learning</b> — it picks up wherever you left off.</p>`;
  s.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => go('home', 'mod' + b.dataset.mod));
}

/* the module's own page — this is where all the detail lives */
function renderModuleHome(s, num) {
  const mo = MODULE_OF[num];
  const ids = mo.items.map(i => i.id);
  const sets = allSets(num);
  const done = sets.filter(x => x.done).length;
  const next = sets.find(x => !x.done);
  const due = dueItems().filter(id => ITEM_BY_ID[id].mod === num);
  const missions = missionsFor(num);
  const solved = missions.filter(mi => P.missions[mi.id]).length;

  s.innerHTML = prompt(`cd ~/course/module${num}`) + `
    <div class="row" style="margin-bottom:6px">
      <button class="btn ghost sm" data-back>← modules</button>
    </div>
    <h1>${esc(mo.label)}</h1>
    <p class="lead">${esc(mo.blurb)}</p>

    <div class="hero-next">
      <div class="ring" style="--p:${goalPct()}">
        <span>${todayXP()}<small>/${P.goal} XP</small></span>
      </div>
      <div class="hero-text">
        <div class="kicker">${next ? 'Next up' : 'All sets finished'}</div>
        <h2>${next ? esc(next.lesson.title) + ' · set ' + (next.n + 1) : 'Keep it fresh'}</h2>
        <p>${next ? `${next.items.length} new card${next.items.length === 1 ? '' : 's'}, then a quick check on just those.`
                  : 'You have been through every set in this module. Drilling is what makes it stick now.'}</p>
        <div class="row" style="margin-top:12px">
          <button class="btn primary" data-start>${next ? '▶ Start learning' : '⚡ Drill this module'}</button>
          <button class="btn" data-path>See the full path</button>
        </div>
      </div>
    </div>

    <div class="strip">
      <div><b>${done}</b><span>of ${sets.length} sets</span></div>
      <div><b>${masteryPct(ids)}%</b><span>mastered</span></div>
      <div><b>${P.streak}</b><span>day streak</span></div>
      <div><b>${solved}</b><span>of ${missions.length} missions</span></div>
    </div>

    <h2>Practise</h2>
    <div class="grid g3">
      <button class="card" data-act="drill"><h3>⚡ Quick drill</h3>
        <p>10 questions, weighted to whatever you keep getting wrong.</p></button>
      <button class="card" data-act="review" ${due.length ? '' : 'disabled style="opacity:.45"'}>
        <h3>🔁 Review ${due.length}</h3>
        <p>${due.length ? 'Commands that are starting to fade.' : 'Nothing fading yet.'}</p></button>
      <button class="card" data-act="terminal"><h3>🖥️ Missions</h3>
        <p>${solved}/${missions.length} solved in the practice terminal.</p></button>
    </div>

    <h2>Topics in this module</h2>
    <div class="grid g3">
      ${mo.cats.map(c => {
        const cids = ALL_ITEMS.filter(i => i.cat === c.id).map(i => i.id);
        const pct = masteryPct(cids);
        const cdone = sets.filter(x => x.cat === c.id && x.done).length;
        const call  = sets.filter(x => x.cat === c.id).length;
        return `<button class="card" data-cat="${c.id}">
          <h3>${c.icon} ${esc(c.name)}</h3>
          <p>${esc(c.blurb)}</p>
          <div class="meta"><span>${cdone}/${call} sets</span><span>${pct}%</span></div>
          <div class="bar" style="margin-top:6px"><i style="width:${pct}%"></i></div></button>`;
      }).join('')}
    </div>`;

  s.querySelector('[data-back]').onclick = () => go('home');
  s.querySelector('[data-start]').onclick = () => next ? startChunk(next.lesson.id, next.n)
    : startDrill(sample(ids, Math.min(20, ids.length)), { title: mo.label + ' drill' });
  s.querySelector('[data-path]').onclick = () => go('learn', 'mod' + num);
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
function chunkKey(lessonId, n) { return `${lessonId}#${n}#${P.settings.bite}`; }

/* every set in a module, in teaching order, flattened for the path view */
function allSets(num) {
  const out = [];
  LESSONS.filter(l => l.mod === num).forEach(lesson => {
    const cs = chunksOf(lesson);
    cs.forEach((items, n) => out.push({
      lesson, n, total: cs.length, items, cat: lesson.cat,
      done: setDone(items) || !!P.chunks[chunkKey(lesson.id, n)],
      pct: setPct(items)
    }));
  });
  return out;
}
function firstUnfinishedChunk() {
  for (const mo of READY_MODULES) {
    const nx = allSets(mo.num).find(x => !x.done);
    if (nx) return nx;
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
/* The path: every set in the module as a numbered step. One step at a
   time, the next one always obvious. */
function renderLearn(s) {
  if (A.quiz) return renderQuestion(s);
  if (A.learn) return renderChunkCard(s);
  if (A.view && CURRICULUM.some(c => c.id === A.view)) return renderPath(s, CURRICULUM.find(c => c.id === A.view).mod, A.view);
  if (A.view && /^mod\d+$/.test(A.view)) return renderPath(s, +A.view.slice(3));
  if (READY_MODULES.length === 1) return renderPath(s, READY_MODULES[0].num);
  return renderModuleList(s);
}

function renderModuleList(s) {
  s.innerHTML = prompt('ls /usr/share/curriculum') + `
    <h1>Learn — pick a module</h1>
    <p class="lead">The course runs over ${MODULES.length} modules.</p>
    <div class="modlist">
      ${MODULES.map(mo => mo.ready
        ? `<button class="modrow" data-mod="${mo.num}"><div class="num">${mo.num}</div>
             <div class="body"><h3>${esc(mo.label)}</h3><p>${esc(mo.blurb)}</p></div><div class="go">▶</div></button>`
        : `<div class="modrow locked"><div class="num">${mo.num}</div>
             <div class="body"><h3>${esc(mo.label)}</h3><p>${esc(mo.blurb)}</p></div><div class="go">🔒</div></div>`).join('')}
    </div>`;
  s.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => go('learn', 'mod' + b.dataset.mod));
}

function renderPath(s, num, focusCat) {
  const mo = MODULE_OF[num];
  const sets = allSets(num);
  const nextIdx = sets.findIndex(x => !x.done);
  const done = sets.filter(x => x.done).length;

  /* group the steps by topic so the path reads as chapters */
  const groups = [];
  sets.forEach((set, i) => {
    const g = groups[groups.length-1];
    if (!g || g.cat !== set.cat) groups.push({ cat:set.cat, catObj:CURRICULUM.find(c => c.id === set.cat), steps:[{ set, i }] });
    else g.steps.push({ set, i });
  });
  const curGroup = nextIdx === -1 ? groups.length - 1
                 : groups.findIndex(g => g.steps.some(x => x.i === nextIdx));

  s.innerHTML = prompt(`cat ~/course/module${num}/path`) + `
    <h1>Your path <span class="muted" style="font-size:13px">· ${esc(mo.label)}</span></h1>
    <p class="lead">${sets.length} sets of ${P.settings.bite} cards. Finish one, take the quick check, move on.
      ${P.settings.freeroam ? 'Free roam is on — jump anywhere you like.' : 'The next step is always the highlighted one.'}</p>
    <div class="pathtop">
      <div class="bar" style="flex:1"><i style="width:${sets.length ? done/sets.length*100 : 0}%"></i></div>
      <span class="muted" style="font-size:12px;white-space:nowrap">${done}/${sets.length} done</span>
    </div>

    ${groups.map((g, gi) => {
      const gdone = g.steps.filter(x => x.set.done).length;
      const isFocus = focusCat === g.cat;
      /* whole topics unlock in turn — inside your current topic you can
         move around freely, which beats a wall of padlocks */
      const gLocked = !P.settings.freeroam && nextIdx !== -1 && gi > curGroup;
      return `<section class="chapter${isFocus ? ' focus' : ''}${gLocked ? ' dim' : ''}${gi === curGroup ? ' current' : ''}" id="cat-${g.cat}">
        <header><span class="ic">${gLocked ? '🔒' : g.catObj.icon}</span>
          <div><h3>${esc(g.catObj.name)}</h3><p>${gLocked ? 'Unlocks when you finish the topic above.' : esc(g.catObj.blurb)}</p></div>
          <span class="cnt">${gdone}/${g.steps.length}</span></header>
        <div class="steps">
          ${g.steps.map(({set, i}) => {
            const scored = set.done && set.pct !== null;
            const grade = !scored ? '' : set.pct === 100 ? ' full' : set.pct >= 50 ? ' part' : ' low';
            const state = (set.done ? 'done' : i === nextIdx ? 'now' : gLocked ? 'locked' : 'open') + grade;
            const preview = [...new Set(set.items.map(it => it.cmd))].join('  ');
            const label = scored ? `${set.pct}<i>%</i>` : set.done ? '✓' : (i + 1);
            return `<button class="step ${state}" data-l="${set.lesson.id}" data-n="${set.n}" ${gLocked ? 'disabled' : ''}
                      title="${esc(set.lesson.title)} — set ${set.n+1} of ${set.total}${scored ? ` · best score ${set.pct}%` : ''}">
                <span class="bub">${label}</span>
                <span class="cap">${esc(preview)}</span>
              </button>`;
          }).join('')}
        </div>
      </section>`;
    }).join('')}

    <div class="row" style="margin-top:20px">
      ${nextIdx >= 0 ? '<button class="btn primary" data-next-step>▶ Continue where I left off</button>' : ''}
      <button class="btn ghost" data-back>← module page</button>
    </div>`;

  s.querySelectorAll('[data-l]').forEach(b => b.onclick = () => startChunk(b.dataset.l, +b.dataset.n));
  const nb = s.querySelector('[data-next-step]');
  if (nb) nb.onclick = () => startChunk(sets[nextIdx].lesson.id, sets[nextIdx].n);
  s.querySelector('[data-back]').onclick = () => go('home', 'mod' + num);
  if (focusCat) { const t = el('cat-' + focusCat); if (t) t.scrollIntoView({ block:'start', behavior:'smooth' }); }
}

function startChunk(lessonId, n) {
  const lesson = LESSONS.find(l => l.id === lessonId);
  const items = chunksOf(lesson)[n];
  A.tab = 'learn';
  A.learn = { lesson, n, total: chunksOf(lesson).length, items, i: 0, typed: {} };
  render();
}

function renderChunkCard(s) {
  const L = A.learn;
  const it = L.items[L.i];
  const box = m(it.id).b;
  const last = L.i === L.items.length - 1;
  const isKey = it.kind === 'key';
  const typed = !!L.typed[L.i];

  s.innerHTML = `
    <div class="cardtop">
      <button class="x" data-exit title="Leave this set">✕</button>
      <div class="chunkbar">${L.items.map((_,i) => `<i class="${i<L.i?'done':i===L.i?'now':''}"></i>`).join('')}</div>
      <span class="muted" style="font-size:12px;white-space:nowrap">${L.i+1}/${L.items.length}</span>
    </div>
    <div class="kicker">${esc(L.lesson.title)} · set ${L.n+1} of ${L.total}${box >= 4 ? ' · ★ you know this one' : ''}</div>

    <div class="flash">
      <p class="big">${esc(it.cmd)}</p>
      <p class="what">${esc(cap(it.what))}</p>
      ${it.ex ? `<div class="demo"><span class="p">$</span> ${esc(it.ex)}${
          it.out ? '\n' + `<span class="o">${esc(it.out)}</span>` : ''}</div>` : ''}
      ${it.note ? `<div class="chunknote"><b>Remember</b> ${esc(it.note)}</div>` : ''}
    </div>

    <div class="typeit ${typed ? 'ok' : ''}" id="typeit">
      <div class="tlabel">${typed ? '✓ typed' : isKey ? 'Now type the keystroke yourself' : 'Now type it yourself'}</div>
      <div class="typebox" id="tbox">
        ${isKey ? '<span class="ps key">⌨</span>'
                : '<span class="ps"><span class="host">student@fedora:~</span>$</span>'}
        <input id="cardin" ${TYPING_ATTRS} enterkeyhint="go"
               ${typed ? 'disabled' : ''} value="${typed ? esc(it.cmd) : ''}"
               placeholder="${isKey ? 'the keystroke…' : 'type the command…'}">
      </div>
      <div class="tfb" id="cardfb">${typed ? '' : 'Copy it out — muscle memory is half of learning a shell.'}</div>
    </div>

    <p class="center" style="margin-top:12px">
      <button class="linkbtn muted" data-skip style="font-size:11.5px">skip typing this one</button>
    </p>
    <div class="row actionbar" style="margin-top:10px">
      <button class="btn" data-prev ${L.i===0?'disabled':''}>←</button>
      <span class="spacer"></span>
      <button class="btn primary big" data-next ${typed ? '' : 'disabled'}>${
        typed ? (last ? 'Quick check →' : 'Got it →') : 'Type it first'}</button>
    </div>`;

  const input = el('cardin'), fb = el('cardfb'), tbox = el('tbox'), next = s.querySelector('[data-next]');
  if (!typed) {
    input.focus();
    let tries = 0;
    const submit = () => {
      const val = input.value;
      if (!val.trim()) return;
      if (checkTyped(it, val)) {
        if (L.pending) return;
        L.pending = true;
        L.typed[L.i] = true;
        awardXP(3); save();
        el('typeit').classList.add('ok');
        tbox.classList.remove('bad'); tbox.classList.add('good');
        input.disabled = true;
        fb.innerHTML = '<span class="good">✓ That is it — +3 XP</span>';
        next.disabled = false;
        next.textContent = last ? 'Quick check →' : 'Got it →';
        renderStatusbar();                      // show the XP straight away
        setTimeout(() => { L.pending = false; if (A.learn === L) advanceChunk(); }, 700);  // they may have navigated away
      } else {
        tries++;
        tbox.classList.remove('good'); tbox.classList.add('bad');
        setTimeout(() => tbox.classList.remove('bad'), 450);
        fb.innerHTML = tries >= 2
          ? `<span class="bad">Not quite.</span> Type it exactly like this: <span class="cmdtag">${esc(it.cmd)}</span>`
          : '<span class="bad">Not quite</span> — check the line above and try again.';
        input.select();
      }
    };
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit(); } };
  }
  next.onclick = advanceChunk;
  s.querySelector('[data-prev]').onclick = () => { if (L.i>0) { L.i--; render(); } };
  s.querySelector('[data-exit]').onclick = () => go('learn', 'mod' + (L.lesson.mod || 1));
  s.querySelector('[data-skip]').onclick = () => advanceChunk();
}
function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

function advanceChunk() {
  const L = A.learn;
  if (L.i < L.items.length - 1) { L.i++; render(); return; }
  // finished the cards -> quick check on exactly these items
  const ids = shuffle(L.items.map(i => i.id));
  const ctx = { lessonId: L.lesson.id, n: L.n, catId: L.lesson.cat, mod: L.lesson.mod, items: L.items };
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
  A.combo = 0;
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

  s.innerHTML = `
    <div class="cardtop">
      <button class="x" data-quit title="Leave this round">✕</button>
      <div class="bar" style="flex:1"><i style="width:${pct}%"></i></div>
      <span class="combo ${A.combo >= 3 ? 'hot' : ''}">${A.combo >= 3 ? '🔥 ' + A.combo + ' in a row' : Q.i + 1 + '/' + Q.ids.length}</span>
    </div>
    <div class="kicker">${esc(Q.title)}</div>
    <p class="qprompt">${q.prompt}</p>
    <div id="qbody"></div>
    <div id="qverdict"></div>
    <p class="muted center" style="font-size:11.5px;margin-top:14px">${q.type==='type' ? 'press Enter to answer' : 'or press keys 1–4'}</p>`;

  const body = el('qbody');
  if (q.type === 'type') {
    body.innerHTML = `<div class="typebox"><span class="ps">student@fedora:~$</span>
        <input id="tin" ${TYPING_ATTRS} enterkeyhint="go" placeholder="${q.placeholder}"></div>
      <div class="row"><button class="btn primary" id="tgo">Answer</button>
        <button class="btn" id="tskip">I don't know</button></div>`;
    const input = el('tin'); input.focus();
    const submit = () => answer(checkTyped(item, input.value), input.value);
    el('tgo').onclick = submit;
    el('tskip').onclick = () => answer(false, '');
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit(); } };
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
  s.querySelector('[data-quit]').onclick = () => {
    const back = Q.opt.chunk ? ['learn', 'mod' + Q.opt.chunk.mod] : [A.tab === 'learn' ? 'learn' : 'drill'];
    A.quiz = null; go(...back);
  };
}

function answer(ok, given) {
  const Q = A.quiz;
  if (Q.answered) return;
  Q.answered = true;
  const item = ITEM_BY_ID[Q.ids[Q.i]];
  scoreAnswer(item.id, ok);
  if (ok) Q.right++; else Q.wrong.push(item.id);

  const cheers = ['Nice.','Correct.','Got it.','Yes.','That is the one.','Spot on.'];
  const head = ok ? `✓ ${cheers[Math.floor(Math.random()*cheers.length)]}${A.combo >= 3 ? `  🔥 ${A.combo} in a row` : ''}`
                  : '✗ Not this time';
  el('qverdict').innerHTML = `<div class="verdict ${ok?'ok':'no'}">
      <h4>${head}</h4>
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
  if (Q.opt.chunk && !Q.opt.replay) {
    P.chunks[chunkKey(Q.opt.chunk.lessonId, Q.opt.chunk.n)] = true;
    markLearned(Q.opt.chunk.items);
    bonus = 40; awardXP(40);
  } else if (pct === 100 && !Q.opt.replay) { bonus = 25; awardXP(25); }
  if (pct === 100 && Q.ids.length >= 3) P.perfects++;
  save();
  const fresh = checkBadges();
  const mood = pct === 100 ? '🏆' : pct >= 80 ? '✅' : pct >= 50 ? '👍' : '📚';
  const msg = pct === 100 ? 'Perfect run. Those are yours now.'
            : pct >= 80 ? 'Strong. The couple you missed are already queued to come back.'
            : pct >= 50 ? 'Good going — the ones you missed will come round again sooner.'
            : 'Totally normal for a first pass. The misses come back until they stick.';
  s.innerHTML = prompt('echo $?') + `
    <div class="center" style="padding:10px 0 4px"><div class="big-emoji">${mood}</div>
      <h1 style="margin-top:10px">${Q.right} / ${Q.ids.length} — ${pct}%</h1>
      <p class="lead">${msg}${bonus ? ` <b style="color:var(--accent)">+${bonus} bonus XP</b>` : ''}</p>
      ${fresh.length ? `<p class="lead">${fresh.map(b => `<span class="badgechip">${b.icon} ${esc(b.name)}</span>`).join(' ')}</p>` : ''}
      ${Q.opt.chunk && setPct(Q.opt.chunk.items) !== 100
        ? `<p class="lead">This set shows <b>${setPct(Q.opt.chunk.items)}%</b> on your path. Retry it to push it to 100%.</p>` : ''}
      <div class="goalline"><div class="bar" style="flex:1"><i style="width:${goalPct()}%"></i></div>
        <span class="muted" style="font-size:12px;white-space:nowrap">${todayXP()}/${P.goal} XP today</span></div></div>
    ${Q.wrong.length ? `<h2>Worth another look</h2>
      <div class="reflist">${[...new Set(Q.wrong)].map(id => { const i = ITEM_BY_ID[id];
        return `<div class="refrow"><div class="c">${esc(i.cmd)}</div>
          <div class="w">It ${esc(i.what)}.${i.note ? `<span class="n">${esc(i.note)}</span>` : ''}</div></div>`;
      }).join('')}</div>` : ''}
    <div class="row" style="margin-top:18px">
      ${Q.opt.chunk ? '<button class="btn primary" data-nextset>▶ Next set</button>'
                    : '<button class="btn primary" data-again>Drill again</button>'}
      <button class="btn" data-redo>↻ Retry all ${Q.ids.length}</button>
      ${Q.wrong.length ? `<button class="btn" data-fix>Retry just the ${[...new Set(Q.wrong)].length} missed</button>` : ''}
      ${Q.opt.chunk ? '<button class="btn" data-path>Back to the path</button>' : ''}
      <button class="btn ghost" data-home>← home</button>
    </div>`;
  const ag = s.querySelector('[data-again]'); if (ag) ag.onclick = () => startDrill(pickAdaptive(10));
  const pb = s.querySelector('[data-path]'); if (pb) pb.onclick = () => go('learn', 'mod' + Q.opt.chunk.mod);
  const fix = s.querySelector('[data-fix]');
  if (fix) fix.onclick = () => startDrill([...new Set(Q.wrong)], { ...Q.opt, replay:true, title:'Second look' });
  s.querySelector('[data-redo]').onclick = () => startDrill(shuffle(Q.ids), { ...Q.opt, replay:true, title:Q.title });
  const ns = s.querySelector('[data-nextset]');
  if (ns) ns.onclick = () => {
    const mod = Q.opt.chunk.mod;
    const nx = allSets(mod).find(x => !x.done) || firstUnfinishedChunk();
    if (nx) startChunk(nx.lesson.id, nx.n); else go('learn', 'mod' + mod);
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
    <p class="lead phone-hide">Real filesystem, real flags, real error messages. Missions are checked against what actually happened,
      so any correct route counts. Type <span class="cmdtag">help</span>, or just explore.<br>
      <span class="tag ok">${MISSIONS.length} missions · ${READY_MODULES.map(mo => 'Module ' + mo.num).join(', ')}</span></p>
    <div class="termgrid">
      <div>
        <div id="term"></div>
        <div class="terminput"><span class="ps"><span class="host">[student@fedora </span><span id="cwdlab">${esc(shortCwd())}</span><span class="host">]</span>$</span>
          <input id="tinput" ${TYPING_ATTRS} enterkeyhint="go" placeholder="type a command"></div>
        <div class="keybar${COARSE ? ' on' : ''}" id="keybar">${TERM_KEYS.map(k =>
          `<button class="keycap${k.w ? ' wide' : ''}" data-k="${esc(k.ins)}">${esc(k.label || k.ins)}</button>`).join('')}</div>
        <div class="row" style="margin-top:8px">
          <button class="btn ghost sm" data-hint>Hint</button>
          <button class="btn ghost sm" data-skip>Skip mission</button>
          <button class="btn ghost sm" data-clear>Clear screen</button>
          <button class="btn ghost sm" data-resetfs>Reset filesystem</button>
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
          <button class="btn ghost sm listtoggle" data-listtoggle>Browse all ${MISSIONS.length} missions</button>
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
  /* pointerdown + preventDefault keeps focus (and the on-screen keyboard) on
     the input, so tapping a symbol never dismisses the keyboard mid-command */
  s.querySelectorAll('.keycap').forEach(k => k.addEventListener('pointerdown', e => {
    e.preventDefault();
    const at = input.selectionStart ?? input.value.length;
    input.setRangeText(k.dataset.k, at, input.selectionEnd ?? at, 'end');
    input.focus();
  }));
  s.querySelector('[data-clear]').onclick = () => { A.buffer = []; paintTerm(); input.focus(); };
  s.querySelector('[data-resetfs]').onclick = () => { A.sh = new Shell(); A.buffer = []; pushTerm({t:'note',s:'Filesystem restored to its original state.'}); paintTerm(); input.focus(); };
  s.querySelector('[data-skip]').onclick = () => { if (A.mission) { A.mission = nextMission(A.mission.id); render(); } };
  s.querySelector('[data-hint]').onclick = () => { const h = el('hintbox'); if (h && A.mission) h.innerHTML = `💡 ${esc(A.mission.hint)}`; input.focus(); };
  s.querySelectorAll('[data-m]').forEach(d => d.onclick = () => { A.mission = MISSIONS.find(x => x.id === d.dataset.m); render(); });
  /* on a phone the 55-row list is collapsed by default so the terminal is not
     pushed off the screen; this reveals it */
  const lt = s.querySelector('[data-listtoggle]');
  if (lt) lt.onclick = () => {
    const box = el('missionbox');
    box.classList.toggle('showlist');
    lt.textContent = box.classList.contains('showlist') ? 'Hide the mission list' : `Browse all ${MISSIONS.length} missions`;
  };
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
      awardXP(25); save(); checkBadges();
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
    <input class="search" id="refsearch" type="search" enterkeyhint="search" ${TYPING_ATTRS}
           placeholder="search…  try: permission, background, ls, vim">
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

    <h2>Badges <span class="muted" style="font-size:12.5px">· ${Object.keys(P.badges).length}/${BADGES.length}</span></h2>
    <div class="badges">
      ${BADGES.map(b => `<div class="badge ${P.badges[b.id] ? 'got' : ''}" title="${esc(b.desc)}">
        <span class="bi">${P.badges[b.id] ? b.icon : '🔒'}</span>
        <b>${esc(b.name)}</b><span>${esc(b.desc)}</span></div>`).join('')}
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
  s.querySelector('[data-reset]').onclick = confirmWipe;
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
    <div class="row">${[2,3,5,8].map(n => `<button class="chip ${P.settings.bite===n?'on':''}" data-bite="${n}">${n} cards</button>`).join('')}</div>
    <p class="muted" style="font-size:12px;margin-top:6px">Smaller sets mean more frequent quick checks. 2 or 3 is right when a topic is brand new.</p>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Daily goal</h3>
    <div class="row">${[50,100,200].map(n => `<button class="chip ${P.goal===n?'on':''}" data-goal="${n}">${n} XP</button>`).join('')}</div>
    <p class="muted" style="font-size:12px;margin-top:6px">One finished set is roughly 70 XP, so 100 XP is about a set and a half a day.</p>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Path</h3>
    <div class="row"><button class="chip ${P.settings.freeroam?'on':''}" data-roam>Free roam: ${P.settings.freeroam?'on':'off'}</button></div>
    <p class="muted" style="font-size:12px;margin-top:6px">Off keeps you on the next step. On unlocks every set so you can jump around.</p>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Display</h3>
    <div class="row"><button class="chip ${P.settings.crt?'on':''}" data-crt>CRT scanlines: ${P.settings.crt?'on':'off'}</button></div>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Your progress</h3>
    <p class="muted" style="font-size:12px;margin:0 0 8px">
      ${learnedCount()} cards learned · ${P.xp} XP · ${missionCount()} missions · ${Object.keys(P.badges).length} badges.
      Saved in this browser only.</p>
    <div class="row">
      <button class="chip" data-export2>Copy a backup</button>
      <button class="chip danger" data-wipe>Wipe all progress</button>
    </div>
    <p class="muted" style="font-size:12px;margin-top:6px">Wiping clears XP, scores, learned cards, badges and
      solved missions, and puts every set back to the start. Themes and settings are kept. It cannot be undone.</p>

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
  d.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { P.goal = +b.dataset.goal; save(); d.remove(); openSettings(); render(); });
  d.querySelector('[data-roam]').onclick = () => { P.settings.freeroam = !P.settings.freeroam; save(); d.remove(); openSettings(); render(); };
  d.querySelector('[data-crt]').onclick = () => { P.settings.crt = !P.settings.crt; save(); applySettings(); d.remove(); openSettings(); };
  d.querySelector('[data-changelog]').onclick = () => { d.remove(); openChangelog(); };
  d.querySelector('[data-close]').onclick = () => d.remove();
  d.querySelector('[data-export2]').onclick = () => {
    navigator.clipboard?.writeText(JSON.stringify(P)).then(() => toast('Backup copied to the clipboard'),
      () => window.prompt('Copy your progress:', JSON.stringify(P)));
  };
  d.querySelector('[data-wipe]').onclick = () => { d.remove(); confirmWipe(); };
}

/* Wiping is irreversible, so it asks twice and offers a backup first. */
function confirmWipe() {
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="inner">
    <h2 style="color:var(--bad)">Wipe all progress?</h2>
    <p style="font-size:13.5px;line-height:1.6">This clears everything you have earned in this browser:</p>
    <ul style="font-size:13px;color:var(--dim);line-height:1.8;margin:0 0 14px;padding-left:20px">
      <li><b style="color:var(--fg)">${P.xp}</b> XP, level ${level()} (${rank()})</li>
      <li><b style="color:var(--fg)">${learnedCount()}</b> learned cards and every set score</li>
      <li><b style="color:var(--fg)">${missionCount()}</b> solved terminal missions</li>
      <li><b style="color:var(--fg)">${Object.keys(P.badges).length}</b> badges and your ${P.streak}-day streak</li>
    </ul>
    <p class="muted" style="font-size:12.5px">Your theme, bite size and daily goal are kept. This cannot be undone.</p>
    <div class="row" style="margin-top:18px">
      <button class="btn" data-backup>Copy a backup first</button>
      <span class="spacer"></span>
      <button class="btn" data-cancel>Cancel</button>
      <button class="btn danger" data-yes>Yes, wipe it</button>
    </div>
  </div>`;
  document.body.appendChild(d);
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelector('[data-cancel]').onclick = () => d.remove();
  d.querySelector('[data-backup]').onclick = () => {
    navigator.clipboard?.writeText(JSON.stringify(P)).then(() => toast('Backup copied to the clipboard'),
      () => window.prompt('Copy your progress:', JSON.stringify(P)));
  };
  d.querySelector('[data-yes]').onclick = () => {
    const keep = { ...P.settings }, goal = P.goal;
    P = structuredClone(DEFAULTS);
    P.settings = keep; P.goal = goal;         // preferences are not progress
    save();
    A.sh = null; A.mission = null; A.learn = null; A.quiz = null;
    d.remove();
    toast('Progress wiped — starting fresh');
    go('home');
  };
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
  d.querySelector('[data-export2]').onclick = () => {
    navigator.clipboard?.writeText(JSON.stringify(P)).then(() => toast('Backup copied to the clipboard'),
      () => window.prompt('Copy your progress:', JSON.stringify(P)));
  };
  d.querySelector('[data-wipe]').onclick = () => { d.remove(); confirmWipe(); };
}

/* ---------------- keyboard ---------------- */
document.addEventListener('keydown', e => {
  const ae = document.activeElement;
  const typing = /^(INPUT|TEXTAREA)$/.test(ae?.tagName);
  /* a focused button already fires its own click on Enter — stepping in here
     as well would advance twice and skip a card */
  const onButton = ae?.tagName === 'BUTTON';
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
    if (onButton) return;
    const n = el('qnext') || document.querySelector('[data-next]:not([disabled])');
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
  const order = [2,3,5,8]; P.settings.bite = order[(order.indexOf(P.settings.bite)+1) % order.length];
  save(); toast(`Bite size: ${P.settings.bite} cards per set`); render();
};
el('themebtn').onclick = () => {
  const i = THEMES.findIndex(t => t[0] === P.settings.theme);
  P.settings.theme = THEMES[(i+1) % THEMES.length][0]; save(); applySettings(); toast(`Theme: ${THEMES.find(t=>t[0]===P.settings.theme)[1]}`); render();
};
render();
boot();
