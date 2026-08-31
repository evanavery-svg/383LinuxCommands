/* =====================================================================
   PATHfinder — game engine
   ===================================================================== */

const SAVE_KEY = 'pathfinder.v1';
const OLD_SAVE_KEYS = ['sudolearn.v1'];      // pre-0.6 name; read once, then migrate
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
  reviews: {},              // category id -> best score on that topic's review round
  bestCombo: 0, perfects: 0, goal: 100,
  settings: { theme:'matrix', crt:true, bite:3, freeroam:true, briefs:true }
};

let P = load();
function load() {
  try {
    let stored = localStorage.getItem(SAVE_KEY);
    if (stored === null) {
      /* Renamed in 0.6. Carry a pre-0.6 save over rather than orphaning it —
         the next save() writes it under the new key. */
      for (const k of OLD_SAVE_KEYS) {
        const prev = localStorage.getItem(k);
        if (prev === null) continue;
        stored = prev;
        /* Write through and drop the old key now, so the migration does not
           depend on the user happening to trigger a save this session. */
        try { localStorage.setItem(SAVE_KEY, prev); localStorage.removeItem(k); } catch {}
        break;
      }
    }
    const raw = JSON.parse(stored || '{}');
    const merged = { ...structuredClone(DEFAULTS), ...raw, settings: { ...DEFAULTS.settings, ...(raw.settings||{}) } };
    merged.settings.freeroam = true;
    return merged;
  } catch { return structuredClone(DEFAULTS); }
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch {} }

/* ---------------- sync helpers ---------------- */
function downloadSave() {
  const blob = new Blob([JSON.stringify(P, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href:url, download:`pathfinder-${new Date().toISOString().slice(0,10)}.json` });
  document.body.append(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('Save file downloaded');
}
function importFile() {
  const inp = Object.assign(document.createElement('input'), { type:'file', accept:'.json' });
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const raw = JSON.parse(r.result);
        P = { ...structuredClone(DEFAULTS), ...raw, settings:{ ...DEFAULTS.settings, ...(raw.settings||{}) } };
        save(); toast('Progress restored from file'); render();
      } catch { toast('That file was not valid progress data'); }
    };
    r.readAsText(f);
  };
  inp.click();
}
async function encodeSave() {
  const json = JSON.stringify(P);
  if (typeof CompressionStream !== 'undefined') {
    const cs = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate'));
    const buf = await new Response(cs).arrayBuffer();
    return 'z' + btoa(String.fromCharCode(...new Uint8Array(buf)));
  }
  return 'r' + btoa(unescape(encodeURIComponent(json)));
}
async function decodeSave(str) {
  const tag = str[0], payload = str.slice(1);
  if (tag === 'z' && typeof DecompressionStream !== 'undefined') {
    const bin = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
    const ds = new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate'));
    return JSON.parse(await new Response(ds).text());
  }
  if (tag === 'r') return JSON.parse(decodeURIComponent(escape(atob(payload))));
  throw new Error('unknown encoding');
}
function mergeSaves(local, inc) {
  const out = structuredClone(local);
  out.xp = Math.max(local.xp||0, inc.xp||0);
  out.bestCombo = Math.max(local.bestCombo||0, inc.bestCombo||0);
  out.perfects = Math.max(local.perfects||0, inc.perfects||0);
  const ld = local.lastDay||'', id = inc.lastDay||'';
  if (id > ld) { out.streak = inc.streak||0; out.lastDay = id; }
  const daysAll = new Set([...Object.keys(local.days||{}), ...Object.keys(inc.days||{})]);
  out.days = {}; for (const d of daysAll) out.days[d] = Math.max((local.days||{})[d]||0, (inc.days||{})[d]||0);
  for (const [k,v] of Object.entries(inc.mastery||{})) {
    const l = (local.mastery||{})[k];
    if (!l) { out.mastery[k] = v; continue; }
    out.mastery[k] = (v.b > l.b || (v.b === l.b && (v.c+v.w) > (l.c+l.w))) ? v : l;
  }
  for (const k of Object.keys(inc.learned||{})) out.learned[k] = true;
  for (const k of Object.keys(inc.missions||{})) out.missions[k] = true;
  for (const [k,v] of Object.entries(inc.badges||{})) { if (!out.badges[k]) out.badges[k] = v; }
  for (const [k,v] of Object.entries(inc.quick||{})) { if (v === true) out.quick[k] = true; }
  for (const [k,v] of Object.entries(inc.reviews||{})) out.reviews[k] = Math.max(out.reviews[k]||0, v);
  const exL = local.exams||[], exI = inc.exams||[];
  const seen = new Set(exL.map(x => x.date+x.pct+x.total));
  const merged = [...exL]; for (const x of exI) { if (!seen.has(x.date+x.pct+x.total)) merged.push(x); }
  merged.sort((a,b) => b.date.localeCompare(a.date));
  out.exams = merged.slice(0, 20);
  return out;
}
async function syncLink() {
  try {
    const encoded = await encodeSave();
    const url = location.origin + location.pathname + '#sync=' + encoded;
    if (navigator.share) { navigator.share({ title:'PATHfinder progress', url }); return; }
    await navigator.clipboard?.writeText(url);
    toast('Sync link copied — open it on another device');
  } catch { toast('Could not create sync link'); }
}
function showSyncModal(raw) {
  const inc = { ...structuredClone(DEFAULTS), ...raw, settings:{ ...DEFAULTS.settings, ...(raw.settings||{}) } };
  const incLearned = Object.keys(inc.learned||{}).length;
  const incMissions = Object.keys(inc.missions||{}).length;
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="inner">
    <h2>Import progress?</h2>
    <p style="font-size:13.5px;line-height:1.7">Incoming save from another device:</p>
    <ul style="font-size:13px;color:var(--dim);line-height:1.8;margin:0 0 14px;padding-left:20px">
      <li><b style="color:var(--fg)">${inc.xp||0}</b> XP</li>
      <li><b style="color:var(--fg)">${incLearned}</b> cards learned</li>
      <li><b style="color:var(--fg)">${incMissions}</b> missions solved</li>
    </ul>
    <p class="muted" style="font-size:12.5px">Your local settings (theme, bite size) are kept either way.</p>
    <div class="row" style="margin-top:18px;gap:8px;flex-wrap:wrap">
      <button class="btn primary" data-replace>Replace my progress</button>
      <button class="btn" data-merge>Merge (keep the best of both)</button>
      <button class="btn ghost" data-cancel>Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(d);
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelector('[data-cancel]').onclick = () => d.remove();
  d.querySelector('[data-replace]').onclick = () => {
    const keep = { ...P.settings };
    P = inc; P.settings = keep; save(); d.remove(); toast('Progress replaced'); render();
  };
  d.querySelector('[data-merge]').onclick = () => {
    const keep = { ...P.settings };
    P = mergeSaves(P, raw); P.settings = keep; save(); d.remove(); toast('Progress merged — best of both kept'); render();
  };
}
(function checkSyncHash() {
  if (typeof location === 'undefined') return;
  const h = location.hash;
  if (!h.startsWith('#sync=')) return;
  const payload = h.slice(6);
  history.replaceState(null, '', location.pathname + location.search);
  decodeSave(payload).then(raw => showSyncModal(raw)).catch(() => toast('Invalid sync link'));
})();

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

/* What a topic or module is "at": the average of its set scores, with sets you
   have not reached counting as zero. Finish every set at 100% and it reads 100%,
   which is what "5/5 sets" leads you to expect. Distinct from masteryPct below,
   which is the spaced-repetition depth and climbs only over days. */
function setScore(set) { return set.pct === null ? (set.done ? 100 : 0) : set.pct; }
function scoreOf(sets) {
  return sets.length ? Math.round(sets.reduce((s, x) => s + setScore(x), 0) / sets.length) : 0;
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
  { id:'sweep',   icon:'🧹', name:'Full sweep',       desc:'Score 100% on a whole-topic review', test:()=>Object.values(P.reviews||{}).some(v => v >= 100) },
  /* These track score, not retention — retention needs every card right on five
     separate days, which would make "Module mastered" all but unwinnable. */
  { id:'mod50',   icon:'🥈', name:'Halfway',          desc:'Score 50% across a whole module',    test:()=>READY_MODULES.some(mo => scoreOf(allSets(mo.num)) >= 50) },
  { id:'mod100',  icon:'👑', name:'Module mastered',  desc:'Score 100% across a whole module',   test:()=>READY_MODULES.some(mo => scoreOf(allSets(mo.num)) >= 100) }
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

/* ---------------- building whole command lines ----------------
   Graded by outcome, not by text: your line and the model answer each run in
   their own throwaway shell, and we compare what they printed and what they
   left behind on disk. So any route that genuinely achieves the goal passes —
   `ls -ltr` and `ls -rlt` and `ls -l -t -r` are all simply correct. A `must`
   pattern is added only where the wording asks for a specific technique that
   output alone cannot distinguish (octal vs symbolic, say). */

function outText(blocks) {
  return blocks.map(o => {
    switch (o.t) {
      case 'ls':     return 'ls|' + o.s + o.name;
      case 'lsgrid': return 'grid|' + o.items.map(i => i.kind + ':' + i.name).join(' ');
      case 'app':    return 'app|' + JSON.stringify(o);
      default:       return (o.t || '') + '|' + (o.s ?? '');
    }
  }).join('\n');
}
/* key order follows creation order, so mkdir a; mkdir b and mkdir b; mkdir a
   would serialise differently — sort so only the content matters */
function fsSnapshot(node) {
  if (!node) return 'null';
  const base = `${node.type},${node.mode},${node.owner},${node.group},${node.target || ''}`;
  if (node.type !== 'dir') return base + ',' + (node.content || '');
  return base + '{' + Object.keys(node.children).sort()
    .map(k => k + ':' + fsSnapshot(node.children[k])).join(',') + '}';
}
function runIsolated(line) {
  const sh = new Shell();
  let out = [];
  try { out = sh.run(line) || []; } catch { return null; }
  return { out: outText(out), fs: fsSnapshot(sh.root) };
}
function gradeBuild(task, line) {
  if (!line || !line.trim()) return false;
  if (task.must && !task.must.test(line.trim())) return false;
  const mine = runIsolated(line), model = runIsolated(task.expect);
  if (!mine || !model) return false;
  return mine.out === model.out && mine.fs === model.fs;
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

/* ---------------- hints ----------------
   Only on the questions you type from a blank prompt, and never in an exam.
   Nothing new is authored: every one of the 221 items already carries a
   "Remember" note, a lesson and a command, which is all a hint needs.
   Taking one forfeits the mark (see answer()), so the tiers go weakest first. */

/* Reveal the shape, not the letters: the command name and the punctuation that
   makes it a shell command stay, the part you have to remember becomes dots.
   ls -ltr -> "ls -···" */
function maskAnswer(text) {
  const t = String(text).trim(), toks = t.split(/\s+/);
  const soft = toks.map((tok, n) => n === 0 ? tok : tok.replace(/[A-Za-z0-9]/g, '·')).join(' ');
  if (soft !== t) return soft;
  /* nothing alphanumeric to hide — "cd -" and "cd .." would come back whole,
     so dot out the argument entirely and keep only its length */
  return toks.map((tok, n) => n === 0 ? tok : '·'.repeat(tok.length)).join(' ');
}
function hintShape(text) {
  const t = String(text).trim();
  if (t.split(/\s+/).length > 1) return maskAnswer(t);
  if (t.length <= 2) return null;            // masking "dd" or "G" would just hand it over
  return t[0] + '·'.repeat(t.length - 1);
}

function hintsFor(q) {
  const out = [];
  if (q.type === 'build') {
    const t = q.task;
    out.push({ label:'What it uses',
      html:`This one is built from: ${t.teach.map(id => `<span class="cmdtag">${
        esc(ITEM_BY_ID[id] ? ITEM_BY_ID[id].cmd : id)}</span>`).join(' ')}` });
    out.push({ label:'The shape of it',
      html:`One route looks like <span class="skel">${esc(maskAnswer(t.expect))}</span>
        <span class="note">Only a shape — marking is on what your line does, so a different
        line that gets there is just as right.</span>` });
    return out;
  }
  const it = q.item;
  const shape = hintShape(it.cmd);
  const isKey = it.kind === 'key';
  out.push({ label:'Where it comes from',
    html:`<span class="note">${esc(it.catName)} · ${esc(it.lessonTitle)}</span>` +
      (shape ? `<span class="skel">${esc(shape)}</span>`
             : `<div>It is a single ${isKey ? 'keystroke' : 'short command'} — ${it.cmd.length} character${
                 it.cmd.length === 1 ? '' : 's'}.</div>`) });
  if (it.note) out.push({ label:'Remember', html:esc(it.note) });
  return out;
}

/* ---------------- app state ---------------- */
const A = {
  tab: 'home',
  view: null,          // sub-view inside a tab
  quiz: null,
  paused: null,        // an in-flight topic review, kept alive across tab switches
  learn: null,
  sh: null,
  mission: null,
  missTries: 0,
  missCmds: 0,
  histIdx: -1,
  combo: 0,
  exam: null,
  examTimer: null,
  examCfg: { count: 20, mins: 20 },
  showTree: false,
  showScenarios: false,
  scenario: null,
  isearch: null,
  _manId: 0
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
  `[  <b>OK</b>  ] Started Command Practice Daemon (PATHfinder v${VERSION})`,
  `[  <b>OK</b>  ] Mounted /usr/share/curriculum (Module 1, ${ALL_ITEMS.length} commands)`,
  '[  <b>OK</b>  ] Reached target Multi-User System',
  '[  <b>OK</b>  ] Loaded student progress from localStorage',
  '',
  'pathfinder login: <span style="color:var(--fg)">student</span>',
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
function go(tab, view) {
  /* A topic review runs to 70 questions. Park an unfinished one instead of
     binning it, so a stray tab click does not cost the whole attempt — the
     path offers it back as "resume". Ordinary rounds are short; they reset. */
  if (A.quiz && A.quiz.opt.review && A.quiz.i < A.quiz.ids.length) A.paused = A.quiz;
  A.tab = tab; A.view = view || null; A.quiz = null; A.learn = null; render();
  window.scrollTo({top:0,behavior:'smooth'});
}
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
      ${MODULES.filter(mo => mo.ready).map(mo => {
        const sets = allSets(mo.num);
        const pct = scoreOf(sets);
        const done = sets.filter(x => x.done).length;
        return `<button class="modrow" data-mod="${mo.num}">
            <div class="num">${mo.num}</div>
            <div class="body">
              <h3>${esc(mo.label)}</h3>
              <p>${done ? `${done} of ${sets.length} sets done · scoring ${pct}%` : `${sets.length} short sets · start anywhere`}</p>
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
      <div><b>${scoreOf(sets)}%</b><span>score</span></div>
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
      <button class="card" data-act="build"><h3>🔧 Build the command</h3>
        <p>Write whole command lines from a goal, marked on what they do.</p></button>
      <button class="card" data-act="exam"><h3>📝 Mock exam</h3>
        <p>Timed, typed, no hints — then a report of what to study.</p></button>
    </div>

    <h2>Topics in this module</h2>
    <div class="grid g3">
      ${mo.cats.map(c => {
        const csets = sets.filter(x => x.cat === c.id);
        const pct = scoreOf(csets);
        const cdone = csets.filter(x => x.done).length;
        const call  = csets.length;
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
  s.querySelector('[data-act="exam"]').onclick = () => go('drill', 'exam');
  s.querySelector('[data-act="build"]').onclick = () =>
    startDrill(shuffle(BUILD_TASKS.filter(t => t.mod === num).map(t => 'build:' + t.id)).slice(0, 10),
               { title:'Build the command' });
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
/* The bonus round at the end of a topic: every command in it, plus every build
   challenge that belongs to it, in one sitting. Deliberately NOT part of
   allSets() — that list feeds the "N/M sets" counter, scoreOf() and
   firstUnfinishedChunk(), and a review counted there would knock a finished
   topic off 100%. Its score lives in its own store for the same reason:
   deriving it from P.quick would just mirror the topic average. */
function reviewFor(catId, sets) {
  const catObj = CURRICULUM.find(c => c.id === catId);
  const own    = (sets || allSets(catObj.mod)).filter(x => x.cat === catId);
  const items  = ALL_ITEMS.filter(i => i.cat === catId);
  const builds = BUILD_TASKS.filter(t => t.cat === catId).map(t => 'build:' + t.id);
  const best   = P.reviews[catId];
  return {
    cat: catId, catObj, items, builds, sets: own,
    ids: [...items.map(i => i.id), ...builds],
    /* cumulative by definition, so it makes no sense before the sets are done */
    unlocked: true,
    pct: best === undefined ? null : best
  };
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
      ${MODULES.filter(mo => mo.ready).map(mo =>
        `<button class="modrow" data-mod="${mo.num}"><div class="num">${mo.num}</div>
             <div class="body"><h3>${esc(mo.label)}</h3><p>${esc(mo.blurb)}</p></div><div class="go">▶</div></button>`).join('')}
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
      Jump into any set you like.
      Clear every set in a topic and its <b>★ bonus round</b> opens at the end of the row: the whole
      topic in one sitting. It scores separately and never changes the topic's own percentage.</p>
    <div class="pathtop">
      <div class="bar" style="flex:1"><i style="width:${sets.length ? done/sets.length*100 : 0}%"></i></div>
      <span class="muted" style="font-size:12px;white-space:nowrap">${done}/${sets.length} done</span>
    </div>

    ${groups.map((g, gi) => {
      const gdone = g.steps.filter(x => x.set.done).length;
      const isFocus = focusCat === g.cat;
      const gLocked = false;
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
          ${reviewStep(g.cat, sets, gLocked)}
        </div>
      </section>`;
    }).join('')}

    <div class="row" style="margin-top:20px">
      ${nextIdx >= 0 ? '<button class="btn primary" data-next-step>▶ Continue where I left off</button>' : ''}
      <button class="btn ghost" data-back>← module page</button>
    </div>`;

  s.querySelectorAll('[data-l]').forEach(b => b.onclick = () => startChunk(b.dataset.l, +b.dataset.n));
  s.querySelectorAll('[data-review]').forEach(b => b.onclick = () => startReview(b.dataset.review));
  const nb = s.querySelector('[data-next-step]');
  if (nb) nb.onclick = () => startChunk(sets[nextIdx].lesson.id, sets[nextIdx].n);
  s.querySelector('[data-back]').onclick = () => go('home', 'mod' + num);
  if (focusCat) { const t = el('cat-' + focusCat); if (t) t.scrollIntoView({ block:'start', behavior:'smooth' }); }
}

/* One extra bubble at the end of every chapter: the whole topic at once.
   It is a bonus, so it is not counted in the chapter's tally above. */
function reviewStep(catId, sets, gLocked) {
  const rv = reviewFor(catId, sets);
  if (!rv.ids.length) return '';
  const held  = A.paused && A.paused.opt.review && A.paused.opt.review.cat === catId ? A.paused : null;
  const grade = rv.pct === null ? '' : rv.pct === 100 ? ' done full' : rv.pct >= 50 ? ' done part' : ' done low';
  /* a parked attempt is always resumable — you started it, so a locked chapter
     must not strand your answers */
  const shut  = !held && (!rv.unlocked || gLocked);
  const state = held ? 'now' : shut ? 'locked' : grade ? grade.trim() : 'open';
  const label = held ? '▶' : rv.pct === null ? (rv.unlocked ? '★' : '🔒') : `${rv.pct}<i>%</i>`;
  const cap   = held ? `resume · ${held.i} of ${held.ids.length} answered`
              : shut ? `finish the ${rv.sets.length} sets above first`
              : `★ review all ${rv.ids.length}`;
  const title = `Topic review — ${rv.catObj.name}: every command in this topic` +
                (rv.builds.length ? ` plus its ${rv.builds.length} build challenges` : '') +
                `, ${rv.ids.length} questions.` +
                (rv.pct === null ? '' : ` Best score ${rv.pct}%.`) +
                ' Bonus round — it does not change the topic score.';
  return `<button class="step review ${state}" data-review="${catId}"
            ${shut ? 'disabled' : ''} title="${esc(title)}">
      <span class="bub">${label}</span>
      <span class="cap">${esc(cap)}</span>
    </button>`;
}

function startReview(catId) {
  /* pick a parked attempt back up rather than starting the 70 again */
  if (A.paused && A.paused.opt.review && A.paused.opt.review.cat === catId) {
    A.quiz = A.paused; A.paused = null; A.tab = 'learn'; A.combo = 0; render(); return;
  }
  const rv = reviewFor(catId);
  if (!rv.unlocked || !rv.ids.length) return;
  A.tab = 'learn';
  startDrill(shuffle(rv.ids), {
    title: `Topic review — ${rv.catObj.name}`,
    review: { cat: catId, mod: rv.catObj.mod, total: rv.ids.length }
  });
}

function startChunk(lessonId, n) {
  const lesson = LESSONS.find(l => l.id === lessonId);
  const items = chunksOf(lesson)[n];
  A.tab = 'learn';
  /* every set opens on its briefing — what is coming and why you would reach for it —
     unless you have turned them off. It is a preamble: it marks nothing. */
  A.learn = { lesson, n, total: chunksOf(lesson).length, items, i: 0, typed: {},
              brief: P.settings.briefs !== false };
  render();
}

/* ---------------- the briefing ----------------
   Shown before every set: the idea behind the lesson, the commands in THIS set
   with what each does, and a worked example of when you would actually reach
   for them. An advance organiser — you meet the shape before the detail.
   Marks nothing, scores nothing; it is reading, not answering. */
function renderBriefing(s) {
  const L = A.learn;
  const lesson = L.lesson;
  const firstSet = L.n === 0;                 // the scenario is per lesson, not per set
  const use = lesson.use;

  const useHtml = !use ? '' : `
    <p class="scene">${esc(use.scene)}</p>
    <div class="demo">${use.lines.map(l => l.c
        ? `<span class="p">$</span> ${esc(l.c)}${l.o ? `\n<span class="o">${esc(l.o)}</span>` : ''}`
        : `<span class="o">${esc(l.o || '')}</span>`).join('\n')}</div>
    ${use.point ? `<p class="point">${esc(use.point)}</p>` : ''}`;

  s.innerHTML = `
    <div class="cardtop">
      <button class="x" data-exit title="Leave this set">✕</button>
      <div class="chunkbar">${L.items.map(() => '<i></i>').join('')}</div>
      <span class="muted" style="font-size:12px;white-space:nowrap">set ${L.n+1} of ${L.total}</span>
    </div>
    <div class="kicker">${esc(lesson.catName)} · ${esc(lesson.title)}</div>
    <h1 class="briefh">Coming up — ${L.items.length} ${L.items.length === 1 ? 'command' : 'commands'}</h1>

    ${lesson.brief ? `<div class="lessonbrief">${lesson.brief}</div>` : ''}

    <div class="brieflist">
      ${L.items.map(i => `<div class="briefrow">
          <div class="c">${esc(i.cmd)}</div>
          <div class="w">${esc(cap(i.what))}${((P.mastery[i.id]||{}).b || 0) >= 4 ? '<span class="seen">★ you know this one</span>' : ''}</div>
        </div>`).join('')}
    </div>

    ${!useHtml ? '' : firstSet
      ? `<div class="usebox"><h2>When you would actually use this</h2>${useHtml}</div>`
      : `<details class="usebox"><summary>Show the worked example for this lesson again</summary>${useHtml}</details>`}

    <div class="row actionbar" style="margin-top:18px">
      <span class="spacer"></span>
      <button class="btn primary big" data-enter data-go>Start the set → <span class="k">Enter</span></button>
    </div>
    <p class="muted center" style="font-size:11.5px;margin-top:10px">
      Briefings can be switched off in ⚙ settings.</p>`;

  const startBtn = s.querySelector('[data-go]');   // not `go` — that is the navigator
  startBtn.onclick = () => { L.brief = false; render(); };
  startBtn.focus();
  /* same exit as the cards behind it */
  s.querySelector('[data-exit]').onclick = () => go('learn', 'mod' + (lesson.mod || 1));
}

function renderChunkCard(s) {
  const L = A.learn;
  if (L.brief) return renderBriefing(s);
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
      ${it.demo ? kbDemo(it.demo) : ''}
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
  L.guard = false;                  // this card can be advanced away from once
  if (!typed) {
    input.focus();
    let tries = 0;
    const submit = () => {
      const val = input.value;
      if (!val.trim()) return;
      if (checkTyped(it, val)) {
        if (L.typed[L.i]) return;       // already accepted; ignore repeat keys
        L.typed[L.i] = true;
        awardXP(3); save();
        el('typeit').classList.add('ok');
        tbox.classList.remove('bad'); tbox.classList.add('good');
        input.disabled = true;
        fb.innerHTML = '<span class="good">✓ That is it — +3 XP</span>';
        next.disabled = false;
        next.textContent = last ? 'Quick check →' : 'Got it →';
        renderStatusbar();                      // show the XP straight away
        /* Disabling the input drops focus to <body>, which used to let a second
           Enter reach the global handler and click "Got it" while the timer below
           was still pending — advancing twice and skipping the next card. Parking
           focus on the button means a second Enter just presses it, and
           advanceChunk's guard makes that a no-op against the timer. */
        next.focus();
        L.timer = setTimeout(() => { if (A.learn === L) advanceChunk(); }, 700);
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
    input.onkeydown = e => {
      if (e.key !== 'Enter' || e.repeat) return;
      e.preventDefault(); e.stopPropagation(); submit();
    };
  }
  next.onclick = advanceChunk;
  s.querySelector('[data-prev]').onclick = () => { if (L.i>0) { L.i--; render(); } };
  s.querySelector('[data-exit]').onclick = () => go('learn', 'mod' + (L.lesson.mod || 1));
  s.querySelector('[data-skip]').onclick = () => advanceChunk();
}
function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

/* What "an example" means for a keystroke: the line before, the key, the line after. */
function kbDemo(d) {
  return `<div class="kbdemo">
      ${d.where ? `<span class="where">${esc(d.where)}</span>` : ''}
      <div class="ba"><span class="lbl">before</span><code>${esc(d.before)}</code></div>
      <div class="key"><span class="lbl">press</span><kbd>${esc(d.keys)}</kbd></div>
      <div class="ba"><span class="lbl">after</span><code>${esc(d.after)}</code></div>
    </div>`;
}

function advanceChunk() {
  const L = A.learn;
  if (!L || L.guard) return;      // one advance per card, whoever asks first
  L.guard = true;
  clearTimeout(L.timer);          // cancel the auto-advance still in flight
  L.timer = null;
  if (L.i < L.items.length - 1) { L.i++; render(); return; }
  // finished the cards -> quick check on exactly these items
  const ids = shuffle(L.items.map(i => i.id));
  const ctx = { lessonId: L.lesson.id, n: L.n, catId: L.lesson.cat, mod: L.lesson.mod, items: L.items };
  A.learn = null;
  startDrill(ids, { title:`Quick check — ${L.lesson.title} (set ${L.n+1})`, chunk: ctx, first:true });
}

/* ---------------- DRILL / QUIZ ---------------- */
function renderDrill(s) {
  if (A.exam) return renderExam(s);
  if (A.view === 'exam') return renderExamSetup(s);
  if (A.quiz) return renderQuestion(s);
  const due = dueItems();
  s.innerHTML = prompt('./drill --pick-a-mode') + `
    <h1>Drill — prove you know it</h1>
    <p class="lead">Questions adapt to you: new commands come as multiple choice, and once you are getting them right
      you have to type them from memory.</p>
    <div class="grid g2">
      <button class="card hi" data-exam><h3>📝 Mock exam</h3>
        <p>A timed paper: typed answers only, no hints, no feedback until you hand it in — then a report
          of what to study. The closest thing here to sitting the real test.</p>
        <div class="meta"><span>exam conditions</span><span>${(P.exams||[]).length ? 'best ' + Math.max(...P.exams.map(x=>x.pct)) + '%' : 'not taken yet'}</span></div></button>
      <button class="card hi" data-build><h3>🔧 Build the command</h3>
        <p>Given a goal, write the whole line — flags, paths and all. Marked on what it actually does,
          so any command that gets there counts.</p>
        <div class="meta"><span>${BUILD_TASKS.length} challenges</span><span>composition, not recall</span></div></button>
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
          <span>${scoreOf(allSets(mo.num).filter(x => x.cat === c.id))}%</span></div></button>`).join('')}
      </div>`).join('')}`;
  s.querySelector('[data-exam]').onclick = () => go('drill', 'exam');
  s.querySelector('[data-build]').onclick = () =>
    startDrill(shuffle(BUILD_TASKS.map(t => 'build:' + t.id)).slice(0, 10), { title:'Build the command' });
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
const isBuild = id => typeof id === 'string' && id.startsWith('build:');
const buildOf  = id => BUILD_BY_ID[id.slice(6)];

/* Paints however many hints have been taken so far and re-arms the button.
   Q.hinted lives on the round, so a re-render (or answering) keeps them on
   screen, and the next question starts clean. */
function wireHints(q) {
  const box = el('hintbox'), btn = el('thint');
  if (!box || !btn) return;
  const Q = A.quiz;
  const hints = hintsFor(q);
  const shown = Math.min(Q.hinted || 0, hints.length);

  box.innerHTML = shown ? hints.slice(0, shown).map((h, i) =>
    `<div class="hint"><b>💡 Hint ${i+1}</b> <span class="lab">${esc(h.label)}</span>
       <div class="hbody">${h.html}</div></div>`).join('') +
    '<p class="hwarn">You took a hint, so this one is marked as a miss — it will come back.</p>' : '';

  /* once they are exhausted the button goes, and the "costs you the mark"
     caption with it — the box above now says so */
  if (shown >= hints.length) { btn.remove(); el('hcost')?.remove(); return; }
  btn.textContent = shown ? `💡 Another hint (${shown+1} of ${hints.length})` : '💡 Hint';
  btn.title = shown ? 'Show the next hint' : 'A hint marks this question as a miss';
  /* under the row, not inside it — the three buttons belong together */
  if (!shown && !el('hcost')) btn.parentElement.insertAdjacentHTML('afterend',
    '<p class="hcost muted" id="hcost">A hint marks this one as a miss — it will come back around.</p>');
  btn.onclick = () => {
    if (Q.answered) return;              // no peeking once it has been marked
    Q.hinted = (Q.hinted || 0) + 1;
    wireHints(q);
    const inp = el('tin'); if (inp) inp.focus();
  };
}

function renderQuestion(s) {
  const Q = A.quiz;
  if (Q.i >= Q.ids.length) return renderQuizResult(s);
  const entry = Q.ids[Q.i];
  const task = isBuild(entry) ? buildOf(entry) : null;
  const item = task ? null : ITEM_BY_ID[entry];
  if (!Q.q || Q.qFor !== Q.i) {
    Q.q = task ? { type:'build', task, prompt:'Write a command line that does this:' }
               : makeQuestion(item, Q.opt.force);
    Q.qFor = Q.i; Q.answered = false; Q.hinted = 0;   // hints never carry over
  }
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
    ${q.type === 'build' ? `<div class="goalbox">${esc(q.task.goal)}</div>` : ''}
    <div id="qbody"></div>
    <div id="qverdict"></div>
    <p class="muted center" style="font-size:11.5px;margin-top:14px">${q.type==='mcq-what'||q.type==='mcq-cmd' ? 'or press keys 1–4' : 'press Enter to answer'}</p>`;

  const body = el('qbody');
  if (q.type === 'build') {
    body.innerHTML = `<div id="hintbox"></div>
      <div class="typebox"><span class="ps">student@fedora:~$</span>
        <input id="tin" ${TYPING_ATTRS} enterkeyhint="go" placeholder="type the whole command…"></div>
      <div class="row"><button class="btn primary" id="tgo">Run it</button>
        <button class="btn" id="thint">💡 Hint</button>
        <button class="btn" id="tskip">I don't know</button></div>
      <p class="muted" style="font-size:12px;margin-top:10px">Judged on what it actually does, so any
        line that achieves the goal counts — flag order and spacing do not matter.</p>`;
    wireHints(q);
    const input = el('tin'); input.focus();
    const submit = () => answer(gradeBuild(q.task, input.value), input.value);
    el('tgo').onclick = submit;
    el('tskip').onclick = () => answer(false, '');
    input.onkeydown = e => {
      if (e.key !== 'Enter' || e.repeat) return;
      e.preventDefault(); e.stopPropagation(); submit();
    };
  } else if (q.type === 'type') {
    body.innerHTML = `<div id="hintbox"></div>
      <div class="typebox"><span class="ps">student@fedora:~$</span>
        <input id="tin" ${TYPING_ATTRS} enterkeyhint="go" placeholder="${q.placeholder}"></div>
      <div class="row"><button class="btn primary" id="tgo">Answer</button>
        <button class="btn" id="thint">💡 Hint</button>
        <button class="btn" id="tskip">I don't know</button></div>`;
    wireHints(q);
    const input = el('tin'); input.focus();
    const submit = () => answer(checkTyped(item, input.value), input.value);
    el('tgo').onclick = submit;
    el('tskip').onclick = () => answer(false, '');
    input.onkeydown = e => {
      if (e.key !== 'Enter' || e.repeat) return;
      e.preventDefault(); e.stopPropagation(); submit();
    };
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
    /* Leaving a long review by the ✕ really does throw the answers away, so
       once there is something to lose, ask first. */
    if (Q.opt.review && Q.i >= 3 &&
        !confirm(`Leave the topic review? You have answered ${Q.i} of ${Q.ids.length} — ` +
                 'quitting here discards them and the review keeps its old score.')) return;
    const back = Q.opt.review ? ['learn', Q.opt.review.cat]
               : Q.opt.chunk  ? ['learn', 'mod' + Q.opt.chunk.mod]
                              : [A.tab === 'learn' ? 'learn' : 'drill'];
    A.quiz = null; A.paused = null; go(...back);
  };
}

function answer(ok, given) {
  const Q = A.quiz;
  if (Q.answered) return;
  Q.answered = true;
  const entry = Q.ids[Q.i];
  const task = isBuild(entry) ? buildOf(entry) : null;
  const item = task ? null : ITEM_BY_ID[entry];

  /* A hint forfeits the mark: the question is scored as a miss, breaks the
     combo and follows a miss's spaced-repetition path. Done here, in one
     place, so every route into answer() obeys it. (scoreAnswer already
     refuses to overwrite a P.quick that is true, so this cannot pull down a
     set score you have already earned on the path.) */
  const hinted   = (Q.hinted || 0) > 0;
  const credited = ok && !hinted;

  /* a build task exercises several commands at once, so credit them all */
  if (task) task.teach.forEach(id => scoreAnswer(id, credited));
  else scoreAnswer(item.id, credited);
  if (credited) Q.right++; else Q.wrong.push(entry);

  const cheers = ['Nice.','Correct.','Got it.','Yes.','That is the one.','Spot on.'];
  const head = credited ? `✓ ${cheers[Math.floor(Math.random()*cheers.length)]}${A.combo >= 3 ? `  🔥 ${A.combo} in a row` : ''}`
             : ok       ? '✓ That is it — but it counts as a miss'
                        : '✗ Not this time';
  const explain = task
    ? `<div>One line that does it: <span class="cmdtag">${esc(task.expect)}</span></div>
       ${!ok && given ? `<span class="note">You wrote: <span class="mono">${esc(given)}</span></span>` : ''}
       <span class="note">Uses: ${task.teach.map(id => ITEM_BY_ID[id] ? esc(ITEM_BY_ID[id].cmd) : id).join(' · ')}</span>`
    : `<div><span class="cmdtag">${esc(item.cmd)}</span> — it ${esc(item.what)}.</div>
       ${!ok && given ? `<span class="note">You said: <span class="mono">${esc(given)}</span></span>` : ''}
       ${item.ex ? `<span class="note">Example: <span class="mono">${esc(item.ex)}</span></span>` : ''}
       ${item.note ? `<span class="note">${esc(item.note)}</span>` : ''}`;
  el('qverdict').innerHTML = `<div class="verdict ${credited ? 'ok' : ok ? 'hint' : 'no'}">
      <h4>${head}</h4>
      ${ok && hinted ? '<span class="note">You took a hint, so this one goes back in the deck and will come round again.</span>' : ''}
      ${explain}
    </div>
    <button class="btn primary" id="qnext">${Q.i === Q.ids.length-1 ? 'See results →' : 'Next question →'} <span class="muted">Enter</span></button>`;
  el('qnext').focus();
  el('qnext').onclick = () => { Q.i++; render(); };
}

function renderQuizResult(s) {
  const Q = A.quiz;
  const pct = Math.round(Q.right / Q.ids.length * 100);
  let bonus = 0;
  const rev = Q.opt.review;
  if (Q.opt.chunk && !Q.opt.replay) {
    P.chunks[chunkKey(Q.opt.chunk.lessonId, Q.opt.chunk.n)] = true;
    markLearned(Q.opt.chunk.items);
    bonus = 40; awardXP(40);
  } else if (rev) {
    /* best-ever, so a worse retake never drags the bubble down. Only a full
       sweep counts — "retry just the missed" drops the review flag. */
    const prev = P.reviews[rev.cat];
    if (prev === undefined || pct > prev) P.reviews[rev.cat] = pct;
    if (!Q.opt.replay) { bonus = 50; awardXP(50); }
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
      ${rev ? `<p class="lead">Your <b>${esc(CURRICULUM.find(c=>c.id===rev.cat).name)}</b> review now shows
          <b>${P.reviews[rev.cat]}%</b>${P.reviews[rev.cat] > pct ? ' (your best so far)' : ''}.
          ${pct === 100 ? 'That is the whole topic, in one sitting.' : 'Retry it to push that up — it keeps your best score.'}
          Your topic score on the path is unchanged: this round is a bonus.</p>` : ''}
      <div class="goalline"><div class="bar" style="flex:1"><i style="width:${goalPct()}%"></i></div>
        <span class="muted" style="font-size:12px;white-space:nowrap">${todayXP()}/${P.goal} XP today</span></div></div>
    ${Q.wrong.length ? `<h2>Worth another look</h2>
      <div class="reflist">${[...new Set(Q.wrong)].map(id => {
        if (isBuild(id)) { const t = buildOf(id);
          return `<div class="refrow"><div class="c">${esc(t.expect)}</div>
            <div class="w">${esc(t.goal)}<span class="n">Uses: ${t.teach.map(x => ITEM_BY_ID[x] ? esc(ITEM_BY_ID[x].cmd) : x).join(' · ')}</span></div></div>`; }
        const i = ITEM_BY_ID[id];
        return `<div class="refrow"><div class="c">${esc(i.cmd)}</div>
          <div class="w">It ${esc(i.what)}.${i.note ? `<span class="n">${esc(i.note)}</span>` : ''}</div></div>`;
      }).join('')}</div>` : ''}
    <div class="row" style="margin-top:18px">
      ${Q.opt.chunk ? '<button class="btn primary" data-enter data-nextset>▶ Next set</button>'
        : rev     ? '<button class="btn primary" data-enter data-path>▶ Back to the path</button>'
                  : '<button class="btn primary" data-enter data-again>Drill again</button>'}
      <button class="btn" data-redo>↻ Retry ${rev ? 'the whole review' : 'all ' + Q.ids.length}</button>
      ${Q.wrong.length ? `<button class="btn" data-fix>Retry just the ${[...new Set(Q.wrong)].length} missed</button>` : ''}
      ${Q.opt.chunk ? '<button class="btn" data-path>Back to the path</button>' : ''}
      <button class="btn ghost" data-home>← home</button>
    </div>`;
  const ag = s.querySelector('[data-again]'); if (ag) ag.onclick = () => startDrill(pickAdaptive(10));
  const pb = s.querySelector('[data-path]');
  if (pb) pb.onclick = () => rev ? go('learn', rev.cat) : go('learn', 'mod' + Q.opt.chunk.mod);
  const fix = s.querySelector('[data-fix]');
  /* a partial retry must not be able to set the review score — five missed
     questions answered right is not 100% of the topic */
  if (fix) fix.onclick = () => startDrill([...new Set(Q.wrong)],
    { ...Q.opt, review:null, replay:true, title:'Second look' });
  s.querySelector('[data-redo]').onclick = () => startDrill(shuffle(Q.ids), { ...Q.opt, replay:true, title:Q.title });
  const ns = s.querySelector('[data-nextset]');
  if (ns) ns.onclick = () => {
    const mod = Q.opt.chunk.mod;
    const nx = allSets(mod).find(x => !x.done) || firstUnfinishedChunk();
    if (nx) startChunk(nx.lesson.id, nx.n); else go('learn', 'mod' + mod);
  };
  s.querySelector('[data-home]').onclick = () => go('home');
  const primary = s.querySelector('[data-enter]');
  if (primary) primary.focus();     // so Enter carries straight on to the next set
  A.quiz = null;
}

/* ---------------- EXAM ----------------
   Deliberately unlike Drill: a fixed set, a clock, no hints, no feedback
   until the end, and a report that names what to study. */

const EXAM_PRESETS = { questions:[20, 40], minutes:[0, 10, 20, 30] };

function examPool(modNum, count) {
  const items = ALL_ITEMS.filter(i => i.mod === modNum).map(i => i.id);
  const builds = BUILD_TASKS.filter(t => t.mod === modNum).map(t => 'build:' + t.id);
  /* about a fifth build-the-command, the rest recall — enough to test
     composition without the paper being all typing */
  const nBuild = Math.min(builds.length, Math.max(2, Math.round(count * 0.2)));
  return shuffle([...sample(builds, nBuild), ...sample(items, count - nBuild)]);
}

function startExam(modNum, count, minutes) {
  clearInterval(A.examTimer);
  A.tab = 'drill';
  A.quiz = null;
  A.combo = 0;
  A.exam = {
    mod: modNum, ids: examPool(modNum, count), i: 0,
    answers: {},                     // entry id -> { given, ok }
    skipped: 0,
    limit: minutes * 60,
    started: Date.now(),
    done: false
  };
  if (minutes) A.examTimer = setInterval(tickExam, 1000);
  render();
}
function examLeft() {
  const E = A.exam;
  return E.limit ? Math.max(0, E.limit - Math.floor((Date.now() - E.started) / 1000)) : null;
}
function tickExam() {
  const E = A.exam;
  if (!E || E.done) { clearInterval(A.examTimer); return; }
  const left = examLeft();
  const lab = el('examclock');
  if (lab) {
    lab.textContent = fmtSecs(left);
    lab.classList.toggle('low', left <= 60);
  }
  if (left === 0) finishExam();
}
function fmtSecs(n) {
  if (n === null) return 'no limit';
  return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
}
function finishExam() {
  clearInterval(A.examTimer);
  if (A.exam) { A.exam.done = true; A.exam.took = Math.round((Date.now() - A.exam.started) / 1000); }
  if (A.tab === 'drill') render();      // otherwise the report waits until you come back
}

function renderExam(s) {
  const E = A.exam;
  if (E.done) return renderExamResult(s);
  if (E.i >= E.ids.length) return finishExam();

  const entry = E.ids[E.i];
  const task = isBuild(entry) ? buildOf(entry) : null;
  const item = task ? null : ITEM_BY_ID[entry];
  if (!E.q || E.qFor !== E.i) {
    /* no multiple choice in an exam: recall it or write it */
    E.q = task ? { type:'build', task } : makeQuestion(item, 'type');
    E.qFor = E.i; E.locked = false;
  }
  const q = E.q;
  const answered = Object.keys(E.answers).length;

  s.innerHTML = `
    <div class="cardtop">
      <button class="x" data-quit title="Abandon this exam">✕</button>
      <div class="bar" style="flex:1"><i style="width:${Math.round(answered / E.ids.length * 100)}%"></i></div>
      <span class="examclock ${E.limit && examLeft() <= 60 ? 'low' : ''}" id="examclock">${fmtSecs(examLeft())}</span>
    </div>
    <div class="kicker">Exam · question ${E.i + 1} of ${E.ids.length} · ${answered} answered</div>
    <p class="qprompt">${task ? 'Write a command line that does this:' : q.prompt}</p>
    ${task ? `<div class="goalbox">${esc(task.goal)}</div>` : ''}
    <div class="typebox"><span class="ps">${task ? 'student@fedora:~$' : '?'}</span>
      <input id="ein" ${TYPING_ATTRS} enterkeyhint="go" placeholder="${task ? 'type the whole command…' : (q.placeholder || 'your answer…')}"></div>
    <div class="row">
      <button class="btn primary" id="ego">Answer</button>
      <button class="btn" id="eskip">Skip for now</button>
      <span class="spacer"></span>
      <button class="btn ghost sm" id="eend">Finish and mark</button>
    </div>
    <p class="muted center" style="font-size:11.5px;margin-top:14px">No feedback until the end — like the real thing.</p>`;

  const input = el('ein'); input.focus();
  const submit = () => {
    if (E.locked) return;
    E.locked = true;
    const given = input.value;
    const ok = task ? gradeBuild(task, given) : checkTyped(item, given);
    E.answers[entry] = { given, ok, task: !!task };
    if (task) task.teach.forEach(id => scoreAnswer(id, ok));
    else scoreAnswer(item.id, ok);
    A.combo = 0;                       // no streak theatre mid-exam
    E.i++;
    render();
  };
  el('ego').onclick = submit;
  el('eskip').onclick = () => {
    /* send it to the back of the paper rather than losing it */
    if (E.i < E.ids.length - 1) { E.ids.push(E.ids.splice(E.i, 1)[0]); E.skipped++; E.q = null; render(); }
    else { E.i++; render(); }
  };
  el('eend').onclick = finishExam;
  input.onkeydown = e => {
    if (e.key !== 'Enter' || e.repeat) return;
    e.preventDefault(); e.stopPropagation(); submit();
  };
  s.querySelector('[data-quit]').onclick = () => {
    if (confirm('Abandon this exam? Nothing will be recorded.')) {
      clearInterval(A.examTimer); A.exam = null; go('drill');
    }
  };
}

function renderExamResult(s) {
  const E = A.exam;
  const entries = Object.entries(E.answers);
  const right = entries.filter(([, a]) => a.ok).length;
  const total = E.ids.length;
  const pct = total ? Math.round(right / total * 100) : 0;
  const unanswered = total - entries.length;

  if (!E.recorded) {
    E.recorded = true;
    P.exams = P.exams || [];
    P.exams.unshift({ date: today(), pct, right, total, secs: E.took || 0, mod: E.mod });
    P.exams = P.exams.slice(0, 20);
    awardXP(Math.round(pct / 2));
    save(); checkBadges();
  }

  /* which topics let you down */
  const byCat = {};
  entries.forEach(([id, a]) => {
    const cats = isBuild(id) ? [buildOf(id).cat] : [ITEM_BY_ID[id].cat];
    cats.forEach(c => { byCat[c] = byCat[c] || { right:0, total:0 };
      byCat[c].total++; if (a.ok) byCat[c].right++; });
  });
  const missed = entries.filter(([, a]) => !a.ok).map(([id]) => id);
  const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
  const mood = pct >= 80 ? '🎓' : pct >= 60 ? '📗' : '📕';

  s.innerHTML = prompt('./exam --report') + `
    <div class="center" style="padding:6px 0 4px">
      <div class="big-emoji">${mood}</div>
      <h1 style="margin-top:10px">${right} / ${total} — ${pct}%<span class="grade">${grade}</span></h1>
      <p class="lead">${fmtSecs(E.took || 0)} taken${E.skipped ? ` · ${E.skipped} skipped and returned to` : ''}${
        unanswered ? ` · <b style="color:var(--warn)">${unanswered} left unanswered</b>` : ''}</p>
    </div>

    <h2>By topic</h2>
    ${Object.entries(byCat).sort((a,b) => (a[1].right/a[1].total) - (b[1].right/b[1].total)).map(([c, v]) => {
      const cat = CURRICULUM.find(x => x.id === c); const p = Math.round(v.right / v.total * 100);
      return `<div class="masterrow"><div class="nm">${cat ? cat.icon + ' ' + esc(cat.name) : c}</div>
        <div class="bar"><i style="width:${p}%"></i></div>
        <div class="pc">${v.right}/${v.total}</div></div>`;
    }).join('')}

    ${missed.length ? `<h2>Every one you missed</h2>
      <div class="reflist">${missed.map(id => {
        const a = E.answers[id];
        const shown = a.given ? `<span class="n">You wrote: <span class="mono">${esc(a.given)}</span></span>` : '<span class="n">Left blank</span>';
        if (isBuild(id)) { const t = buildOf(id);
          return `<div class="refrow"><div class="c">${esc(t.expect)}</div>
            <div class="w">${esc(t.goal)}${shown}</div></div>`; }
        const i = ITEM_BY_ID[id];
        return `<div class="refrow"><div class="c">${esc(i.cmd)}</div>
          <div class="w">It ${esc(i.what)}.${shown}</div></div>`;
      }).join('')}</div>` : '<p class="lead">Nothing missed. That is a clean paper.</p>'}

    <div class="row" style="margin-top:18px">
      ${missed.length ? `<button class="btn primary" data-enter data-fix>Drill the ${missed.length} you missed</button>`
                      : '<button class="btn primary" data-enter data-again>Another exam</button>'}
      <button class="btn" data-again2>Another exam</button>
      <button class="btn ghost" data-home>← home</button>
    </div>`;

  const fix = s.querySelector('[data-fix]');
  if (fix) fix.onclick = () => { A.exam = null; startDrill(shuffle(missed), { title:'Exam misses', replay:true }); };
  const again = () => { A.exam = null; go('drill'); };
  const a1 = s.querySelector('[data-again]'); if (a1) a1.onclick = again;
  s.querySelector('[data-again2]').onclick = again;
  s.querySelector('[data-home]').onclick = () => { A.exam = null; go('home'); };
  const primary = s.querySelector('[data-enter]'); if (primary) primary.focus();
}

function renderExamSetup(s) {
  const mo = READY_MODULES[0];
  const hist = (P.exams || []);
  s.innerHTML = prompt('./exam --setup') + `
    <h1>Mock exam</h1>
    <p class="lead">A fixed paper against the clock. Every answer typed out, no multiple choice, no hints,
      and no feedback until you hand it in — then a report telling you exactly what to study.</p>

    <h2>How long</h2>
    <div class="row">${EXAM_PRESETS.questions.map(n =>
      `<button class="chip ${A.examCfg.count===n?'on':''}" data-count="${n}">${n} questions</button>`).join('')}</div>
    <div class="row" style="margin-top:8px">${EXAM_PRESETS.minutes.map(m =>
      `<button class="chip ${A.examCfg.mins===m?'on':''}" data-mins="${m}">${m ? m + ' minutes' : 'no time limit'}</button>`).join('')}</div>

    <div class="row" style="margin-top:20px">
      <button class="btn primary big" data-enter data-start>▶ Start the exam</button>
    </div>

    ${hist.length ? `<h2>Past papers</h2>
      <div class="reflist">${hist.slice(0, 8).map(x =>
        `<div class="refrow"><div class="c">${x.pct}%</div>
          <div class="w">${x.right}/${x.total} · ${fmtSecs(x.secs)} · ${esc(x.date)}</div></div>`).join('')}</div>
      ${hist.length > 1 ? `<p class="muted" style="font-size:12.5px;margin-top:8px">Best ${Math.max(...hist.map(x=>x.pct))}% ·
        last ${hist[0].pct}% · ${hist.length} taken</p>` : ''}` : ''}

    <div class="row" style="margin-top:18px"><button class="btn ghost sm" data-back>← back to drills</button></div>`;

  s.querySelectorAll('[data-count]').forEach(b => b.onclick = () => { A.examCfg.count = +b.dataset.count; render(); });
  s.querySelectorAll('[data-mins]').forEach(b => b.onclick = () => { A.examCfg.mins = +b.dataset.mins; render(); });
  s.querySelector('[data-start]').onclick = () => startExam(mo.num, A.examCfg.count, A.examCfg.mins);
  s.querySelector('[data-back]').onclick = () => { A.view = null; render(); };
  s.querySelector('[data-start]').focus();
}

/* ---------------- TERMINAL ---------------- */
function commonPrefix(arr) {
  if (!arr.length) return '';
  let p = arr[0];
  for (let i = 1; i < arr.length; i++) while (!arr[i].startsWith(p)) p = p.slice(0, -1);
  return p;
}
function fileCompletions(partial, sh) {
  const expanded = sh.expand(partial);
  const lastSlash = expanded.lastIndexOf('/');
  let dirPath, namePrefix, userPrefix;
  if (lastSlash >= 0) {
    dirPath = expanded.slice(0, lastSlash) || '/';
    namePrefix = expanded.slice(lastSlash + 1);
    userPrefix = partial.slice(0, partial.lastIndexOf('/') + 1);
  } else {
    dirPath = sh.cwd;
    namePrefix = expanded;
    userPrefix = '';
  }
  const dn = sh.node(dirPath);
  if (!dn || dn.type !== 'dir') return [];
  return Object.keys(dn.children)
    .filter(n => n.startsWith(namePrefix))
    .sort()
    .map(n => userPrefix + n + (dn.children[n].type === 'dir' ? '/' : ''));
}
function tabComplete(input) {
  const line = input.value, cursor = input.selectionStart;
  const before = line.slice(0, cursor);
  const tokens = before.trimStart().split(/\s+/);
  const isFirst = tokens.length <= 1;
  const partial = tokens[tokens.length - 1] || '';
  let candidates;
  if (isFirst) {
    candidates = Object.keys(A.sh.cmds).filter(c => c.startsWith(partial)).sort();
  } else {
    candidates = fileCompletions(partial, A.sh);
  }
  if (!candidates.length) return;
  if (candidates.length === 1) {
    const c = candidates[0];
    const pre = before.slice(0, before.length - partial.length);
    const after = line.slice(cursor);
    const suffix = c.endsWith('/') ? '' : ' ';
    input.value = pre + c + suffix + after;
    const pos = pre.length + c.length + suffix.length;
    input.setSelectionRange(pos, pos);
  } else {
    const cp = commonPrefix(candidates);
    if (cp.length > partial.length) {
      const pre = before.slice(0, before.length - partial.length);
      input.value = pre + cp + line.slice(cursor);
      const pos = pre.length + cp.length;
      input.setSelectionRange(pos, pos);
    }
    pushTerm({ t:'in', cwd: shortCwd(), s: line });
    pushTerm({ t:'out', s: candidates.join('  ') });
    paintTerm();
  }
}
function buildTree(node, path, cwd, depth) {
  if (!node || node.type !== 'dir' || depth > 5) return '';
  const entries = Object.keys(node.children).sort();
  let html = '';
  for (const name of entries) {
    if (name.startsWith('.') && depth > 0) continue;
    const child = node.children[name];
    const full = path === '/' ? '/' + name : path + '/' + name;
    const isDir = child.type === 'dir';
    const isCwd = full === cwd;
    const isParent = cwd.startsWith(full + '/');
    const icon = isDir ? (isCwd || isParent ? '\u{1F4C2}' : '\u{1F4C1}')
               : child.type === 'link' ? '\u{1F517}' : '\u{1F4C4}';
    html += `<div class="tnode${isCwd ? ' cwd' : ''}${isParent ? ' parent' : ''}" style="padding-left:${depth*16}px"${isDir ? ` data-tdir="${esc(full)}"` : ''}>` +
            `<span class="ticon">${icon}</span>` +
            `<span class="tname${isDir ? ' d' : (child.mode & 0o111) ? ' x' : ''}">${esc(name)}${isDir ? '/' : ''}</span></div>`;
    if (isDir && (isCwd || isParent) && depth < 5) html += buildTree(child, full, cwd, depth + 1);
  }
  return html;
}
function isearchStart(input) {
  A.isearch = { query: '', matchIdx: -1, savedInput: input.value, match: '' };
  isearchPaint(input);
}
function isearchPaint(input) {
  const s = A.isearch;
  const ps = document.querySelector('.terminput .ps');
  if (ps) ps.innerHTML = `<span class="isearch">(reverse-i-search)'${esc(s.query)}':</span>`;
  input.value = s.match;
}
function isearchFind(input, dir) {
  const s = A.isearch;
  const h = A.sh.history;
  if (!h.length || !s.query) { s.match = ''; s.matchIdx = -1; isearchPaint(input); return; }
  let start;
  if (dir === 'next') {
    if (s.matchIdx <= 0) { isearchPaint(input); return; }
    start = s.matchIdx - 1;
  } else {
    start = s.matchIdx < 0 ? h.length - 1 : s.matchIdx;
  }
  for (let i = start; i >= 0; i--) {
    if (h[i].includes(s.query)) { s.matchIdx = i; s.match = h[i]; isearchPaint(input); return; }
  }
  isearchPaint(input);
}
function isearchExit(input, accept) {
  const s = A.isearch;
  A.isearch = null;
  const ps = document.querySelector('.terminput .ps');
  if (ps) ps.innerHTML = `<span class="host">[student@fedora </span><span id="cwdlab">${esc(shortCwd())}</span><span class="host">]</span>$`;
  input.value = accept ? s.match : s.savedInput;
  input.setSelectionRange(input.value.length, input.value.length);
}
function isearchKey(e, input) {
  const s = A.isearch;
  if (e.key === 'r' && e.ctrlKey) { e.preventDefault(); isearchFind(input, 'next'); return true; }
  if (e.key === 'Escape' || (e.key === 'g' && e.ctrlKey)) { e.preventDefault(); isearchExit(input, false); return true; }
  if (e.key === 'Enter') { e.preventDefault(); isearchExit(input, true); runLine(input.value); input.value = ''; A.histIdx = -1; return true; }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown'
      || (e.key === 'a' && e.ctrlKey) || (e.key === 'e' && e.ctrlKey)) {
    e.preventDefault(); isearchExit(input, true); return true;
  }
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (s.query.length) { s.query = s.query.slice(0, -1); s.matchIdx = -1; isearchFind(input, 'same'); }
    return true;
  }
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    s.query += e.key;
    s.matchIdx = -1;
    isearchFind(input, 'same');
    return true;
  }
  return false;
}
function startScenario(id) {
  const sc = SCENARIOS.find(s => s.id === id);
  if (!sc) return;
  const sh = new Shell();
  sc.setup(sh);
  A.sh = sh;
  A.buffer = [];
  A.scenario = { data: sc, sh, hintIdx: 0, checkState: sc.checks.map(() => false) };
  pushTerm({ t:'note', s:'--- Scenario: ' + sc.title + ' ---' });
  pushTerm({ t:'out',  s: sc.description });
  pushTerm({ t:'out',  s:'' });
  render();
  setTimeout(() => { const i2 = el('tinput'); if (i2) i2.focus(); }, 30);
}
function exitScenario() {
  A.scenario = null;
  A.sh = new Shell();
  A.buffer = [];
  pushTerm({ t:'note', s:'Scenario exited. Filesystem restored.' });
  render();
  setTimeout(() => { const i2 = el('tinput'); if (i2) i2.focus(); }, 30);
}
function renderScenarioPanel() {
  const sc = A.scenario;
  if (!sc) return '';
  const d = sc.data;
  const allPassed = sc.checkState.every(Boolean);
  return `<div class="scenario-panel" id="scenariopanel">
    <h3>Scenario: ${esc(d.title)}</h3>
    <p class="muted" style="font-size:12px;margin:4px 0 10px">${esc(d.description)}</p>
    <h4 style="font-size:12px;color:var(--accent2);margin:0 0 6px">Objectives</h4>
    <div class="check-list">${d.checks.map((ch, i) =>
      `<div class="check-item${sc.checkState[i] ? ' passed' : ''}">
        <span class="check-icon">${sc.checkState[i] ? '✓' : '○'}</span>
        <span>${esc(ch.desc)}</span>
      </div>`).join('')}</div>
    ${allPassed ? '<div class="note" style="margin-top:10px;color:var(--good);font-weight:700">All objectives complete!</div>' : ''}
    <div id="scenariohints"></div>
    <div class="row" style="margin-top:12px">
      ${!allPassed ? '<button class="btn ghost sm" data-shint>Hint</button>' : ''}
      <button class="btn ghost sm" data-sexit>${allPassed ? 'Continue' : 'Give up'}</button>
    </div>
  </div>`;
}
function renderScenarioPicker() {
  const scenarios = scenariosFor(1);
  const done = scenarios.filter(sc => P.missions['sc_' + sc.id]).length;
  return `<div class="scenario-panel" id="scenariopanel">
    <h3>Scenarios</h3>
    <p class="muted" style="font-size:12px;margin:4px 0 10px">Open-ended troubleshooting challenges. Multiple valid paths to each solution.</p>
    <div class="muted" style="font-size:11.5px;margin-bottom:10px">${done}/${scenarios.length} completed</div>
    ${scenarios.map(sc => {
      const solved = P.missions['sc_' + sc.id];
      const stars = '★'.repeat(sc.difficulty) + '☆'.repeat(3 - sc.difficulty);
      return `<div class="sc-card${solved ? ' done' : ''}" data-scstart="${sc.id}">
        <div class="sc-title">${solved ? '✓ ' : ''}${esc(sc.title)}</div>
        <div class="sc-meta">${stars} &middot; ${esc(sc.description.slice(0, 60))}${sc.description.length > 60 ? '…' : ''}</div>
      </div>`;
    }).join('')}
    <div class="row" style="margin-top:12px">
      <button class="btn ghost sm" data-scback>Back to missions</button>
    </div>
  </div>`;
}
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
          <button class="btn ghost sm" data-tree>${A.showTree ? 'Missions' : 'File tree'}</button>
          ${!A.scenario && scenariosFor(1).length ? '<button class="btn ghost sm" data-scenarios>Scenarios</button>' : ''}
        </div>
      </div>
      <div>
        ${A.scenario ? renderScenarioPanel() :
          A.showScenarios ? renderScenarioPicker() :
          A.showTree ? `<div class="treepanel" id="treepanel">
          <h3>File System</h3>
          <div class="treeview">${buildTree(A.sh.root, '', A.sh.cwd, 0)}</div>
        </div>` : `<div class="mission ${cur?'':'done'}" id="missionbox">
          <h3>${cur ? 'Mission ' + (MISSIONS.indexOf(cur)+1) + ' / ' + MISSIONS.length : 'All missions solved'}</h3>
          ${cur ? `<div class="muted" style="font-size:11.5px;margin-bottom:6px">${esc(cur.tour)}</div>
                   <p class="goal">${esc(cur.goal)}</p>
                   <div class="muted" style="font-size:12px" id="hintbox"></div>`
                : `<p class="goal">You have cleared every mission. Free-play mode: try anything you like.</p>`}
          <div class="bar" style="margin-top:10px"><i style="width:${solved/MISSIONS.length*100}%"></i></div>
          <div class="muted" style="font-size:11.5px;margin-top:6px">${solved}/${MISSIONS.length} solved</div>
          <button class="btn ghost sm listtoggle" data-listtoggle>Browse all ${MISSIONS.length} missions</button>
          <div class="misslist">${MISSIONS.map((mi,i) => {
            const s = P.missions[mi.id]; const parTag = s && typeof s === 'object' ? ` <span class="partag${s.cmds<=s.par?' atpar':''}">${s.cmds}/${s.par}</span>` : '';
            const hdr = (i === 0 || mi.tour !== MISSIONS[i-1].tour) ? `<div class="misstour">${esc(mi.tour)}</div>` : '';
            return hdr + `<div class="${s?'done':''} ${cur&&cur.id===mi.id?'cur':''}" data-m="${mi.id}">
            ${s?'✓':'·'} ${i+1}. ${esc(mi.goal.slice(0,48))}${mi.goal.length>48?'…':''}${parTag}</div>`;}).join('')}</div>
        </div>`}
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
    if (A.isearch) { if (isearchKey(e, input)) return; }
    if (e.key === 'r' && e.ctrlKey) { e.preventDefault(); isearchStart(input); return; }
    if (e.key === 'Enter') { e.preventDefault(); runLine(input.value); input.value = ''; A.histIdx = -1; }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); const h = A.sh.history; if (h.length) { A.histIdx = A.histIdx < 0 ? h.length-1 : Math.max(0, A.histIdx-1); input.value = h[A.histIdx]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const h = A.sh.history; if (A.histIdx >= 0) { A.histIdx++; input.value = A.histIdx >= h.length ? (A.histIdx=-1, '') : h[A.histIdx]; } }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); A.buffer = []; paintTerm(); }
    else if (e.key === 'Tab') { e.preventDefault(); tabComplete(input); }
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
  s.querySelector('[data-skip]').onclick = () => { if (A.mission) { A.mission = nextMission(A.mission.id); A.missCmds = 0; render(); } };
  s.querySelector('[data-hint]').onclick = () => { const h = el('hintbox'); if (h && A.mission) h.innerHTML = `💡 ${esc(A.mission.hint)}`; input.focus(); };
  s.querySelector('[data-tree]').onclick = () => { A.showTree = !A.showTree; render(); setTimeout(() => { const i2 = el('tinput'); if (i2) i2.focus(); }, 30); };
  const scBtn = s.querySelector('[data-scenarios]');
  if (scBtn) scBtn.onclick = () => { A.showScenarios = true; A.showTree = false; render(); setTimeout(() => { const i2 = el('tinput'); if (i2) i2.focus(); }, 30); };
  s.querySelectorAll('[data-scstart]').forEach(b => b.onclick = () => { A.showScenarios = false; startScenario(b.dataset.scstart); });
  const scbackBtn = s.querySelector('[data-scback]');
  if (scbackBtn) scbackBtn.onclick = () => { A.showScenarios = false; render(); setTimeout(() => { const i2 = el('tinput'); if (i2) i2.focus(); }, 30); };
  const shintBtn = s.querySelector('[data-shint]');
  if (shintBtn) shintBtn.onclick = () => {
    if (!A.scenario) return;
    const sc = A.scenario;
    if (sc.hintIdx < sc.data.hints.length) {
      const box = el('scenariohints');
      if (box) box.innerHTML += `<div class="muted" style="font-size:12px;margin-top:6px">💡 ${esc(sc.data.hints[sc.hintIdx])}</div>`;
      sc.hintIdx++;
    }
    const i2 = el('tinput'); if (i2) i2.focus();
  };
  const sexitBtn = s.querySelector('[data-sexit]');
  if (sexitBtn) sexitBtn.onclick = () => exitScenario();
  s.querySelectorAll('[data-tdir]').forEach(d => d.onclick = () => {
    const path = d.dataset.tdir;
    runLine('cd ' + path);
    input.value = '';
    const tp = el('treepanel');
    if (tp) tp.querySelector('.treeview').innerHTML = buildTree(A.sh.root, '', A.sh.cwd, 0);
  });
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
    A.missCmds++;
    let solved = false;
    try { solved = !!A.mission.check(A.sh, line); } catch {}
    if (solved) {
      const cmds = A.missCmds;
      const par = A.mission.par || 1;
      P.missions[A.mission.id] = { cmds, par };
      const it = ITEM_BY_ID[A.mission.teach];
      if (it) scoreAnswer(it.id, true);
      awardXP(25); save(); checkBadges();
      const parMsg = cmds <= par ? ' (par!)' : cmds <= par + 1 ? ' (close to par)' : ` (par: ${par})`;
      pushTerm({ t:'note', s:`✓ Mission solved in ${cmds} command${cmds>1?'s':''}${parMsg}  (+25 XP)${it ? '  —  ' + it.cmd + ': it ' + it.what + '.' : ''}` });
      A.missTries = 0;
      A.missCmds = 0;
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

  // scenario check
  if (A.scenario) {
    const sc = A.scenario;
    let changed = false;
    sc.data.checks.forEach((ch, i) => {
      if (!sc.checkState[i]) {
        try { if (ch.test(A.sh)) { sc.checkState[i] = true; changed = true; } } catch {}
      }
    });
    if (changed) {
      const panel = el('scenariopanel');
      if (panel) {
        const items = panel.querySelectorAll('.check-item');
        sc.checkState.forEach((passed, i) => {
          if (passed && items[i]) {
            items[i].classList.add('passed');
            items[i].querySelector('.check-icon').textContent = '✓';
          }
        });
      }
    }
    if (sc.checkState.every(Boolean) && !P.missions['sc_' + sc.data.id]) {
      P.missions['sc_' + sc.data.id] = true;
      for (const tid of sc.data.teach) {
        const it = ITEM_BY_ID[tid];
        if (it) scoreAnswer(it.id, true);
      }
      awardXP(40); save(); checkBadges();
      pushTerm({ t:'note', s:'✓ Scenario complete! (+40 XP)' });
      toast('Scenario solved — well done!');
      paintTerm();
      render();
      setTimeout(() => { const i2 = el('tinput'); if (i2) i2.focus(); }, 30);
      return;
    }
  }

  paintTerm();
  if (A.showTree) { const tp = el('treepanel'); if (tp) tp.querySelector('.treeview').innerHTML = buildTree(A.sh.root, '', A.sh.cwd, 0); }
}
function paintTerm() {
  const term = el('term'); if (!term) return;
  term.innerHTML = A.buffer.map(o => {
    switch (o.t) {
      case 'in':   return `<div class="l in"><span class="ps">[student@fedora <span class="pth">${esc(o.cwd)}</span>]$</span> <span class="c${o.s ? ' explainable' : ''}"${o.s ? ` data-explain="${esc(o.s)}"` : ''}>${esc(o.s)}</span></div>`;
      case 'err':  return `<div class="l err">${esc(o.s)}</div>`;
      case 'note': return `<div class="l note">${esc(o.s)}</div>`;
      case 'pager':return `<div class="l"><span class="pager">${esc(o.s)}</span></div>`;
      case 'garbage': return `<div class="l garbage">^@^H&lt;9f&gt;ELF^B^A^A^@&lt;fe&gt;^C&gt;^@^A^@^@&lt;c0&gt;^E^@^@&lt;bf&gt;@^@8^@^M^@@^@^^</div>`;
      case 'ls':   return `<div class="l nw">${esc(o.s)}<span class="${o.kind==='dir'?'d':o.kind==='link'?'ln':o.exec?'x':''}">${esc(o.name)}</span></div>`;
      case 'lsgrid': return `<div class="l nw grid2">${o.items.map(i =>
                        `<span class="${i.kind==='dir'?'d':i.kind==='link'?'ln':i.exec?'x':''}">${esc(i.name)}</span>`).join(' ')}</div>`;
      case 'explain': return `<div class="appwin explain-box"><h4>Command breakdown</h4>${o.parts.map(p =>
          `<div class="explain-row"><span class="explain-tok ${p.kind}">${esc(p.token)}</span>
           <span class="explain-kind">${p.kind}</span>
           <span class="explain-what">${esc('it ' + p.what)}</span>
           ${p.note ? `<div class="explain-note">${esc(p.note)}</div>` : ''}</div>`).join('')}</div>`;
      case 'app':  return appWindow(o);
      default:     return `<div class="l">${esc(o.s)}</div>`;
    }
  }).join('');
  term.scrollTop = term.scrollHeight;
  term.querySelectorAll('.explainable').forEach(sp => {
    sp.style.cursor = 'pointer';
    sp.title = 'Click to explain this command';
    sp.onclick = () => {
      const cmd = sp.dataset.explain;
      if (cmd) { runLine('explain ' + cmd); const inp = el('tinput'); if (inp) inp.focus(); }
    };
  });
  term.querySelectorAll('.manpager').forEach(pager => {
    const scroll = pager.querySelector('.manscroll');
    const status = pager.querySelector('.manstatus');
    const searchBox = pager.querySelector('.mansearch');
    const searchInput = pager.querySelector('.maninput');
    let query = '', matches = [], matchIdx = -1;
    const lineH = 20;
    const updateStatus = () => {
      const lineNum = Math.floor(scroll.scrollTop / lineH) + 1;
      const pct = scroll.scrollHeight <= scroll.clientHeight ? 100 : Math.round((scroll.scrollTop + scroll.clientHeight) / scroll.scrollHeight * 100);
      const suffix = pct >= 100 ? ' (END)' : ` ${pct}%`;
      status.textContent = status.textContent.replace(/line \d+.*/, `line ${lineNum}${suffix}`);
    };
    const clearHighlight = () => scroll.querySelectorAll('.manhl').forEach(el => {
      el.outerHTML = el.textContent;
    });
    const doSearch = (q) => {
      clearHighlight();
      matches = []; matchIdx = -1;
      if (!q) return;
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
      scroll.querySelectorAll('.ml').forEach(ml => {
        const text = ml.textContent;
        if (re.test(text)) {
          matches.push(ml);
          ml.innerHTML = ml.innerHTML.replace(re, m => `<span class="manhl">${m}</span>`);
        }
        re.lastIndex = 0;
      });
      if (matches.length) { matchIdx = 0; matches[0].scrollIntoView({block:'center',behavior:'smooth'}); }
    };
    const nextMatch = (dir) => {
      if (!matches.length) return;
      matchIdx = (matchIdx + dir + matches.length) % matches.length;
      matches[matchIdx].scrollIntoView({block:'center', behavior:'smooth'});
    };
    scroll.onscroll = updateStatus;
    scroll.onkeydown = e => {
      if (searchBox && !searchBox.hidden) return;
      if (e.key === ' ' || e.key === 'f') { e.preventDefault(); scroll.scrollBy(0, scroll.clientHeight - lineH); }
      else if (e.key === 'b') { e.preventDefault(); scroll.scrollBy(0, -(scroll.clientHeight - lineH)); }
      else if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); scroll.scrollBy(0, lineH); }
      else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); scroll.scrollBy(0, -lineH); }
      else if (e.key === 'g') { e.preventDefault(); scroll.scrollTop = 0; }
      else if (e.key === 'G') { e.preventDefault(); scroll.scrollTop = scroll.scrollHeight; }
      else if (e.key === '/') { e.preventDefault(); searchBox.hidden = false; searchInput.value = ''; searchInput.focus(); }
      else if (e.key === 'n') { e.preventDefault(); nextMatch(1); }
      else if (e.key === 'N') { e.preventDefault(); nextMatch(-1); }
      else if (e.key === 'q') { e.preventDefault(); const inp = el('tinput'); if (inp) inp.focus(); }
      updateStatus();
    };
    if (searchInput) {
      searchInput.onkeydown = e => {
        if (e.key === 'Enter') { e.preventDefault(); query = searchInput.value; searchBox.hidden = true; doSearch(query); scroll.focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); searchBox.hidden = true; scroll.focus(); }
      };
    }
    scroll.focus();
  });
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
    const rel = ALL_ITEMS.filter(i => i.cmd.split(' ')[0] === t && i.cmd !== t).slice(0, 20);
    const seeAlso = ALL_ITEMS.filter(i => it && i.catName === it.catName && i.cmd !== t && !rel.includes(i)).slice(0, 8);
    if (!it && !rel.length) return `<div class="appwin"><h4>man</h4><div class="l err">No manual entry for ${esc(t)}</div></div>`;
    let lines = [];
    lines.push(`<b>${esc(t.toUpperCase())}(${o.section||1})</b>          Manual page          <b>${esc(t.toUpperCase())}(${o.section||1})</b>`);
    lines.push('');
    lines.push('<b>NAME</b>');
    lines.push(`     ${esc(t)} — ${esc(it ? it.what : 'see options below')}`);
    if (it && it.ex) { lines.push(''); lines.push('<b>SYNOPSIS</b>'); lines.push(`     ${esc(it.ex)}`); }
    if (it && it.what) { lines.push(''); lines.push('<b>DESCRIPTION</b>'); lines.push(`     ${esc(cap(it.what))}.`);
      if (it.out) lines.push(`     Example output: ${esc(it.out)}`); }
    if (rel.length) { lines.push(''); lines.push('<b>OPTIONS</b>');
      for (const r of rel) {
        lines.push(`     <span class="x">${esc(r.cmd)}</span>`);
        lines.push(`           ${esc(cap(r.what))}.`);
        if (r.note) lines.push(`           <span class="dim">${esc(r.note)}</span>`);
        lines.push('');
      }
    }
    if (it && it.note) { lines.push('<b>NOTES</b>'); lines.push(`     ${esc(it.note)}`); }
    if (seeAlso.length) { lines.push(''); lines.push('<b>SEE ALSO</b>');
      lines.push('     ' + seeAlso.map(i => `${esc(i.cmd)}(1)`).join(', ')); }
    lines.push(''); lines.push(`${esc(t)} manual          PATHfinder          ${esc(t)}(${o.section||1})`);
    const id = 'man' + (++A._manId);
    return `<div class="appwin manpager" id="${id}">
      <div class="manscroll" tabindex="0">${lines.map(l => `<div class="ml">${l || '&nbsp;'}</div>`).join('')}</div>
      <div class="manbar"><span class="manstatus">Manual page ${esc(t)}(${o.section||1}) line 1</span>
        <span class="mansearch" hidden><span class="manlabel">/</span><input class="maninput" type="text" spellcheck="false" autocomplete="off"></span>
      </div>
      <div class="keys">Space page down · b page up · / search · n next match · N prev match · q quit</div></div>`;
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
      || (i.note||'').toLowerCase().includes(ql) || i.catName.toLowerCase().includes(ql) || (i.ex||'').toLowerCase().includes(ql)
      || (i.demo ? (i.demo.where||'') + i.demo.before + i.demo.after : '').toLowerCase().includes(ql));
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
          ${i.demo ? `<span class="n">${esc(i.demo.before)} — press ${esc(i.demo.keys)} → ${esc(i.demo.after)}</span>` : ''}
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

function generateStudyGuide(fullRef) {
  const weak = ALL_ITEMS.filter(i => {
    const x = P.mastery[i.id]; return x && x.b <= 2 && (x.w > 0 || x.c > 0);
  }).sort((a,b) => (P.mastery[a.id].b - P.mastery[b.id].b) || (P.mastery[b.id].w - P.mastery[a.id].w));
  const due = dueItems().map(id => ITEM_BY_ID[id]).filter(Boolean);
  const byCat = {};
  ALL_ITEMS.forEach(i => { (byCat[i.catName] = byCat[i.catName] || []).push(i); });
  const e = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const section = (title, items) => {
    if (!items.length) return '';
    return `<h2>${e(title)}</h2><table><thead><tr><th>Command</th><th>What it does</th><th>Example</th><th>Remember</th></tr></thead><tbody>${items.map(i =>
      `<tr><td class="cmd">${e(i.cmd)}</td><td>${e(cap(i.what))}</td><td class="ex">${i.ex ? e(i.ex) : ''}</td><td class="note">${i.note ? e(i.note) : ''}</td></tr>`
    ).join('')}</tbody></table>`;
  };
  let body = '';
  if (!fullRef) {
    body += section('Commands you struggle with', weak);
    body += section('Commands due for review', due);
  }
  for (const [cat, items] of Object.entries(byCat)) body += section(cat, items);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>PATHfinder Study Guide</title><style>
    body{font-family:-apple-system,system-ui,sans-serif;font-size:11px;line-height:1.4;color:#222;max-width:1000px;margin:0 auto;padding:20px}
    h1{font-size:18px;border-bottom:2px solid #222;padding-bottom:6px}
    h2{font-size:14px;margin-top:24px;color:#333;border-bottom:1px solid #ccc;padding-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:8px;page-break-inside:auto}
    tr{page-break-inside:avoid}
    th{text-align:left;font-size:10px;text-transform:uppercase;color:#666;border-bottom:2px solid #888;padding:4px 8px}
    td{padding:4px 8px;border-bottom:1px solid #ddd;vertical-align:top;font-size:11px}
    .cmd{font-family:monospace;font-weight:700;white-space:nowrap}
    .ex{font-family:monospace;font-size:10px;color:#555}
    .note{font-size:10px;color:#666;font-style:italic}
    .meta{color:#888;font-size:10px;margin-top:4px}
    @media print{body{padding:0}h1{font-size:16px}}
    </style></head><body>
    <h1>PATHfinder ${fullRef ? 'Reference Sheet' : 'Study Guide'}</h1>
    <p class="meta">Generated ${new Date().toISOString().slice(0,10)} &middot; ${learnedCount()} of ${ALL_ITEMS.length} commands learned &middot; ${P.xp} XP &middot; ${rank()}</p>
    ${body}
    <p class="meta" style="margin-top:24px">Generated by PATHfinder v${VERSION}</p>
    </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
  else { const b = new Blob([html], {type:'text/html'}); const u = URL.createObjectURL(b); window.open(u); }
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

  s.innerHTML = prompt('cat ~/.pathfinder/progress') + `
    <h1>Progress</h1>
    <div class="grid g3" style="margin-bottom:6px">
      <div class="stat"><div class="k">Rank</div><div class="v">${rank()}</div><div class="muted" style="font-size:12px">level ${level()}</div></div>
      <div class="stat"><div class="k">Total XP</div><div class="v">${P.xp}</div></div>
      <div class="stat"><div class="k">Day streak</div><div class="v">${P.streak}</div></div>
      <div class="stat"><div class="k">Accuracy</div><div class="v">${acc}%</div><div class="muted" style="font-size:12px">${totC} right · ${totW} wrong</div></div>
      <div class="stat"><div class="k">Strong recall</div><div class="v">${mastered.length}</div><div class="muted" style="font-size:12px">of ${ALL_ITEMS.length} bites</div></div>
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

    ${(P.exams||[]).length ? `<h2>Mock exams</h2>
    <p class="lead" style="margin-bottom:10px">Timed papers under exam conditions — the best read on whether you are ready.</p>
    ${P.exams.slice(0, 6).map(x => `<div class="masterrow"><div class="nm">${esc(x.date)} · ${fmtSecs(x.secs)}</div>
      <div class="bar"><i style="width:${x.pct}%"></i></div>
      <div class="pc">${x.pct}%</div></div>`).join('')}
    <p class="muted" style="font-size:12.5px;margin-top:8px">Best ${Math.max(...P.exams.map(x=>x.pct))}% ·
      ${P.exams.length} taken · latest ${P.exams[0].pct}%</p>` : ''}

    <h2>Score by module</h2>
    <p class="lead" style="margin-bottom:10px">How much of each module you have finished, and how well.
      This is the average of your set scores — the same numbers on the path.</p>
    ${MODULES.filter(mo => mo.ready).map(mo => { const p = scoreOf(allSets(mo.num));
      return `<div class="masterrow"><div class="nm">${esc(mo.label)}</div>
        <div class="bar"><i style="width:${p}%"></i></div>
        <div class="pc">${p}%</div></div>`; }).join('')}

    <h2>Retention</h2>
    <p class="lead" style="margin-bottom:10px">A different thing: how deeply each topic has settled in.
      A command climbs one of five levels each time you get it right, so this fills slowly and on purpose —
      it is not how much you have finished. It is what the Review queue uses to decide what is fading.</p>
    ${READY_MODULES.map(mo =>
    mo.cats.map(c => { const ids = ALL_ITEMS.filter(i => i.cat === c.id).map(i => i.id); const p = masteryPct(ids);
      return `<div class="masterrow"><div class="nm">${c.icon} ${esc(c.name)}</div>
        <div class="bar"><i style="width:${p}%"></i></div><div class="pc">${p}%</div></div>`; }).join('')).join('')}

    <h2>Weakest right now</h2>
    ${weak.length ? `<div class="reflist">${weak.map(i => `<div class="refrow"><div class="c">${esc(i.cmd)}</div>
        <div class="w">It ${esc(i.what)}.<span class="n">${P.mastery[i.id].w} wrong · ${P.mastery[i.id].c} right</span></div></div>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn primary" data-weak>Drill these ${weak.length}</button></div>`
      : `<p class="muted">Nothing flagged yet — answer some questions and your weak spots will collect here.</p>`}

    <h2>Study guide</h2>
    <p class="muted" style="font-size:12.5px">A printable cheat sheet built from your progress.</p>
    <div class="row" style="margin-top:8px">
      <button class="btn primary" data-guide>Weak spots guide</button>
      <button class="btn" data-guideall>Full reference sheet</button>
    </div>

    <h2>Save data</h2>
    <p class="muted" style="font-size:12.5px">Progress lives in this browser only (localStorage). ${seen.length} of ${ALL_ITEMS.length} bites touched.</p>
    <div class="syncgrid">
      <button class="btn primary" data-sync>Sync to another device</button>
      <button class="btn" data-dl>Download save file</button>
      <button class="btn" data-export>Copy to clipboard</button>
      <button class="btn" data-import>Load from file</button>
      <button class="btn ghost" data-reset>Reset everything</button>
    </div>`;

  const w = s.querySelector('[data-weak]'); if (w) w.onclick = () => { A.tab='drill'; startDrill(weak.map(i => i.id), { title:'Weak-spot drill' }); };
  s.querySelector('[data-guide]').onclick = () => generateStudyGuide(false);
  s.querySelector('[data-guideall]').onclick = () => generateStudyGuide(true);
  s.querySelector('[data-sync]').onclick = syncLink;
  s.querySelector('[data-dl]').onclick = downloadSave;
  s.querySelector('[data-export]').onclick = () => {
    navigator.clipboard?.writeText(JSON.stringify(P)).then(() => toast('Progress JSON copied to clipboard'),
      () => window.prompt('Copy your progress:', JSON.stringify(P)));
  };
  s.querySelector('[data-import]').onclick = importFile;
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
    <div class="row"><button class="chip ${P.settings.briefs!==false?'on':''}" data-briefs>Set briefings: ${P.settings.briefs!==false?'on':'off'}</button></div>
    <p class="muted" style="font-size:12px;margin:6px 0 0">A briefing opens each set with the commands in it and a
      worked example of when you would use them. Turn it off to go straight to the cards.</p>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Display</h3>
    <div class="row"><button class="chip ${P.settings.crt?'on':''}" data-crt>CRT scanlines: ${P.settings.crt?'on':'off'}</button></div>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Your progress</h3>
    <p class="muted" style="font-size:12px;margin:0 0 8px">
      ${learnedCount()} cards learned · ${P.xp} XP · ${missionCount()} missions · ${Object.keys(P.badges).length} badges.
      Saved in this browser only.</p>
    <div class="row">
      <button class="chip" data-export2>Copy a backup</button>
      <button class="chip" data-dl2>Download backup</button>
      <button class="chip danger" data-wipe>Wipe all progress</button>
    </div>
    <p class="muted" style="font-size:12px;margin-top:6px">Wiping clears XP, scores, learned cards, badges and
      solved missions, and puts every set back to the start. Themes and settings are kept. It cannot be undone.</p>

    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">Keyboard</h3>
    <p class="muted" style="font-size:12px">1–6 switch tabs · 1–4 pick an answer · Enter continues · Esc goes back · Ctrl-L clears the terminal</p>
    <h3 style="font-size:13px;color:var(--dim);margin:18px 0 6px">About</h3>
    <p class="muted" style="font-size:12px">PATHfinder v${VERSION}.<br>
      &copy; ${new Date().getFullYear()} ${esc(COPYRIGHT_HOLDER)}. All rights reserved.</p>
    <div class="row" style="margin-top:8px"><button class="btn" data-changelog>View changelog</button></div>
    <div class="row" style="margin-top:18px"><button class="btn primary" data-close>Close</button></div>
  </div>`;
  document.body.appendChild(d);
  d.onclick = e => { if (e.target === d) d.remove(); };
  d.querySelectorAll('[data-theme]').forEach(b => b.onclick = () => { P.settings.theme = b.dataset.theme; save(); applySettings(); d.remove(); openSettings(); });
  d.querySelectorAll('[data-bite]').forEach(b => b.onclick = () => { P.settings.bite = +b.dataset.bite; save(); d.remove(); openSettings(); render(); });
  d.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { P.goal = +b.dataset.goal; save(); d.remove(); openSettings(); render(); });
  d.querySelector('[data-briefs]').onclick = () => { P.settings.briefs = P.settings.briefs === false; save(); d.remove(); openSettings(); render(); };
  d.querySelector('[data-crt]').onclick = () => { P.settings.crt = !P.settings.crt; save(); applySettings(); d.remove(); openSettings(); };
  d.querySelector('[data-changelog]').onclick = () => { d.remove(); openChangelog(); };
  d.querySelector('[data-close]').onclick = () => d.remove();
  d.querySelector('[data-export2]').onclick = () => {
    navigator.clipboard?.writeText(JSON.stringify(P)).then(() => toast('Backup copied to the clipboard'),
      () => window.prompt('Copy your progress:', JSON.stringify(P)));
  };
  d.querySelector('[data-dl2]').onclick = downloadSave;
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
    A.sh = null; A.mission = null; A.learn = null; A.quiz = null; A.paused = null;
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
      PATHfinder v${VERSION}</p>
    ${CHANGELOG.map(r => `<div class="release">
        <h3>v${esc(r.version)} <span class="muted">· ${esc(r.date)}</span></h3>
        <div class="rt">${esc(r.title)}</div>
        <ul>${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
      </div>`).join('')}
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
  if (e.repeat) return;             // holding a key must not fire it over and over
  const ae = document.activeElement;
  const typing = /^(INPUT|TEXTAREA)$/.test(ae?.tagName);
  /* a focused button already fires its own click on Enter — stepping in here
     as well would advance twice and skip a card */
  const onButton = ae?.tagName === 'BUTTON';
  if (A.exam && !A.exam.done && e.key !== 'Enter') return;   // an exam owns the keyboard
  if (e.key === 'Escape') {
    const md = document.querySelector('.modal'); if (md) { md.remove(); return; }
    /* go() parks an unfinished topic review, so Esc steps out to the path
       without losing the answers; ordinary rounds just end. */
    if (A.quiz && A.quiz.opt.review) { go('learn', A.quiz.opt.review.cat); return; }
    if (A.quiz) { A.quiz = null; render(); return; }
    if (A.learn) { const c = A.learn.lesson.cat; A.learn = null; go('learn', c); return; }
    if (A.view) { A.view = null; render(); return; }
    if (A.tab !== 'home') go('home');
    return;
  }
  if (typing) return;
  if (e.key === 'Enter') {
    if (onButton) return;
    const n = el('qnext')
           || document.querySelector('[data-enter]:not([disabled]), [data-next]:not([disabled])');
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
/* the same stamp on the boot screen, which sits over the top of that footer */
if (el('bootver')) {
  el('bootver').textContent = 'PATHfinder v' + VERSION;
  el('bootyear').textContent = new Date().getFullYear();
  el('bootholder').textContent = COPYRIGHT_HOLDER;
}
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
