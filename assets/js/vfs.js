/* =====================================================================
   A tiny in-browser Linux: virtual filesystem + shell.
   Enough of a real system that practising commands feels honest.
   ===================================================================== */

const USER = 'student', HOST = 'fedora', GROUP = 'student';
const ELF_MAGIC = 'ELF';
const JPG_MAGIC = 'JPG';

function dir(mode, children, owner)  { return { type:'dir',  mode: mode ?? 0o755, owner: owner||USER, group: owner||GROUP, mtime: 0, children: children||{} }; }
function file(content, mode, owner, mtime) { return { type:'file', mode: mode ?? 0o644, owner: owner||USER, group: owner||GROUP, mtime: mtime||0, content: content||'' }; }
function link(target)                { return { type:'link', mode: 0o777, owner:USER, group:GROUP, mtime:0, target }; }

function globToRegex(pat) {
  let re = '^';
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i];
    if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '[') {
      const close = pat.indexOf(']', i + 1);
      if (close < 0) { re += '\\['; continue; }
      re += pat.slice(i, close + 1);
      i = close;
    } else {
      re += c.replace(/[.+^${}()|\\]/g, '\\$&');
    }
  }
  return new RegExp(re + '$');
}

function freshRoot() {
  return dir(0o755, {
    bin:  dir(0o755, { ls:file(ELF_MAGIC,0o755,'root'), cat:file(ELF_MAGIC,0o755,'root'), bash:file(ELF_MAGIC,0o755,'root') }, 'root'),
    etc:  dir(0o755, {
            passwd: file('root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:Student:/home/student:/bin/bash\nbob:x:1001:1001:Bob:/home/bob:/bin/bash\n', 0o644, 'root', 14),
            group:  file('root:x:0:\nsudo:x:27:student\nstudent:x:1000:\nstaff:x:1002:student,bob\n', 0o644, 'root', 14),
            hostname: file('fedora\n', 0o644, 'root', 3),
            shadow: file('(unreadable)', 0o000, 'root', 2)
          }, 'root'),
    home: dir(0o755, {
      student: dir(0o755, {
        '.bashrc':  file("# .bashrc\nalias ll='ls -lh'\nalias ..='cd ..'\n", 0o644, USER, 40),
        '.profile': file('# login shell settings\n', 0o644, USER, 39),
        Documents: dir(0o755, {
          'report.txt': file(Array.from({length:24},(_,i)=>`Line ${i+1} of the quarterly report.`).join('\n')+'\n', 0o664, USER, 55),
          'notes.txt':  file('Remember: rm has no undo.\nls -ltr puts newest last.\npwd tells you where you are.\n', 0o644, USER, 58),
          'todo.md':    file('- [ ] learn vim\n- [ ] practise chmod\n', 0o644, USER, 59)
        }),
        Pictures: dir(0o755, { 'holiday.jpg': file(JPG_MAGIC, 0o644, USER, 44) }),
        scripts: dir(0o755, {
          'backup.sh': file('#!/bin/bash\necho backing up...\n', 0o644, USER, 50),
          'hello.sh':  file('#!/bin/bash\necho hello\n', 0o640, USER, 51)
        }),
        'big.log':    file(Array.from({length:60},(_,i)=>`log entry ${i+1}`).join('\n')+'\n', 0o644, USER, 60),
        'secret.txt': file('classified\n', 0o644, USER, 47),
        'lab-01': dir(0o755, {
          'broken_backup.sh': file("#!/usr/bin/env bsh\n\nprintf 'Backup completed at %s\\n' \"$(date)\"\n", 0o644, USER, 55),
          'network.conf': file('# Network service settings\nbind_address=0.0.0.0\nport=3000\nmax_retries=50\ntimeout_seconds=30\nverbose=true\n', 0o644, USER, 55),
          'sysinfo.sh': file('#!/bin/bash\necho "=== System Info ==="\nwhoami\nuname -r\ndate\n', 0o755, USER, 55)
        })
      }),
      bob: dir(0o755, { 'readme.txt': file('bob was here\n', 0o644, 'bob', 30) }, 'bob')
    }, 'root'),
    tmp:  dir(0o777, {}, 'root'),
    var:  dir(0o755, { log: dir(0o755, { 'messages': file(Array.from({length:30},(_,i)=>`Aug 20 09:${String(i).padStart(2,'0')}:00 fedora systemd: message ${i+1}`).join('\n')+'\n', 0o640, 'root', 61) }, 'root') }, 'root'),
    usr:  dir(0o755, { bin: dir(0o755, { vim:file(ELF_MAGIC,0o755,'root'), python3:file(ELF_MAGIC,0o755,'root'), htop:file(ELF_MAGIC,0o755,'root') }, 'root'),
                       share: dir(0o755, {}, 'root') }, 'root'),
    root: dir(0o700, { '.bashrc': file('# root\n',0o644,'root') }, 'root')
  }, 'root');
}

class Shell {
  constructor() { this.reset(); }
  reset() {
    this.root = freshRoot();
    this.cwd = '/home/student';
    this.prev = '/home/student';
    this.umask = 0o022;
    this.aliases = { ll:'ls -lh', '..':'cd ..' };
    this.jobs = [];
    this.nextJob = 1; this.nextPid = 4120;
    this.history = [];
    this.log = [];        // every command line typed, for mission checking
  }

  /* ---------- path plumbing ---------- */
  norm(p) {
    const abs = p.startsWith('/');
    const parts = (abs ? p : this.cwd + '/' + p).split('/');
    const out = [];
    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') out.pop(); else out.push(part);
    }
    return '/' + out.join('/');
  }
  expand(p) {
    if (p === '~') return '/home/' + USER;
    if (p.startsWith('~/')) return '/home/' + USER + p.slice(1);
    if (p.startsWith('~')) return '/home/' + p.slice(1);
    return p;
  }
  globExpand(token) {
    if (!/[*?\[]/.test(token)) return [token];
    const lastSlash = token.lastIndexOf('/');
    const dirPart = lastSlash >= 0 ? token.slice(0, lastSlash) || '/' : '.';
    const pattern = lastSlash >= 0 ? token.slice(lastSlash + 1) : token;
    const dirNode = this.node(dirPart);
    if (!dirNode || dirNode.type !== 'dir') return [token];
    const re = globToRegex(pattern);
    const hideDots = !pattern.startsWith('.');
    const matches = Object.keys(dirNode.children)
      .filter(n => re.test(n) && (!hideDots || !n.startsWith('.')))
      .sort();
    if (!matches.length) return [token];
    const prefix = lastSlash >= 0 ? (dirPart === '/' ? '/' : dirPart + '/') : '';
    return matches.map(n => prefix + n);
  }
  node(p) {
    const path = this.norm(this.expand(p));
    if (path === '/') return this.root;
    let cur = this.root;
    for (const part of path.split('/').slice(1)) {
      if (!cur || cur.type !== 'dir' || !cur.children[part]) return null;
      cur = cur.children[part];
    }
    return cur;
  }
  parentOf(p) {
    const path = this.norm(this.expand(p));
    const idx = path.lastIndexOf('/');
    return { parent: this.node(path.slice(0, idx) || '/'), name: path.slice(idx + 1), path };
  }
  basename(p){ const n = this.norm(this.expand(p)); return n.slice(n.lastIndexOf('/')+1) || '/'; }

  /* ---------- formatting ---------- */
  modeStr(n) {
    const t = { dir:'d', link:'l', file:'-' };
    const b = n.mode.toString(8).padStart(4,'0');
    const bits = b.slice(1).split('').map(d => {
      d = +d; return (d&4?'r':'-') + (d&2?'w':'-') + (d&1?'x':'-');
    });
    const sp = +b[0];
    if (sp & 4) bits[0] = bits[0].slice(0,2) + (bits[0][2]==='x'?'s':'S');
    if (sp & 2) bits[1] = bits[1].slice(0,2) + (bits[1][2]==='x'?'s':'S');
    if (sp & 1) bits[2] = bits[2].slice(0,2) + (bits[2][2]==='x'?'t':'T');
    return (t[n.type]||'-') + bits.join('');
  }
  sizeOf(n) { return n.type === 'dir' ? 4096 : n.type === 'link' ? (n.target||'').length : (n.content||'').length; }
  human(b) {
    if (b < 1024) return b + '';
    const u = ['K','M','G']; let i = -1, v = b;
    while (v >= 1024 && i < 2) { v /= 1024; i++; }
    return (v < 10 ? v.toFixed(1) : Math.round(v)) + u[i];
  }
  dateOf(n) { const d = 20 - Math.floor((60 - (n.mtime||0)) / 8); return `Aug ${String(Math.max(1,d)).padStart(2,' ')} 09:${String((n.mtime||0)%60).padStart(2,'0')}`; }

  /* ---------- run ---------- */
  run(line) {
    line = line.trim();
    if (!line) return [];
    this.history.push(line); this.log.push(line);
    const out = [];
    for (const seg of line.split(';')) {
      const pipes = seg.trim().split('|');
      let stdin = null;
      for (let i = 0; i < pipes.length; i++) {
        this._stdin = stdin;
        const r = this.runOne(pipes[i].trim());
        if (i < pipes.length - 1) {
          const parts = [];
          for (const o of (r || [])) {
            if (o.t === 'out') parts.push(o.s);
            else if (o.t === 'lsgrid') o.items.forEach(it => parts.push(it.name));
            else if (o.t === 'ls') parts.push(o.s + o.name);
          }
          stdin = parts.join('\n');
        } else {
          if (r && r.length) out.push(...r);
        }
        this._stdin = null;
      }
    }
    return out;
  }
  runOne(line) {
    if (!line) return [];
    // command substitution: $(cmd) → its stdout
    line = line.replace(/\$\(([^)]+)\)/g, (_, inner) => {
      const saved = this._stdin; this._stdin = null;
      const res = this.runOne(inner);
      this._stdin = saved;
      return res.filter(o => o.t === 'out').map(o => o.s).join('\n');
    });
    let bg = false;
    if (line.endsWith('&')) { bg = true; line = line.slice(0, -1).trim(); }
    let tagged = this.tokenize(line, true);
    if (!tagged.length) return [];
    let argv = tagged.map(t => t.v);
    // output redirection: cmd > file  or  cmd >> file
    let redir = null, redirAppend = false;
    let gtIdx = argv.indexOf('>>');
    if (gtIdx >= 0) { redirAppend = true; }
    else { gtIdx = argv.indexOf('>'); }
    if (gtIdx >= 0) {
      redir = argv[gtIdx + 1] || null;
      argv = argv.slice(0, gtIdx);
      tagged = tagged.slice(0, gtIdx);
      if (!argv.length) return [];
    }
    // one level of alias expansion
    if (this.aliases[argv[0]] && !line.startsWith('alias')) {
      const aliasTokens = this.tokenize(this.aliases[argv[0]], true);
      tagged = aliasTokens.concat(tagged.slice(1));
      argv = tagged.map(t => t.v);
    }
    // glob expansion: expand unquoted operands (skip argv[0])
    const expanded = [argv[0]], expTags = [tagged[0]];
    for (let k = 1; k < argv.length; k++) {
      if (tagged[k].q) { expanded.push(argv[k]); expTags.push(tagged[k]); }
      else { const g = this.globExpand(argv[k]); expanded.push(...g); g.forEach(v => expTags.push({v,q:false})); }
    }
    argv = expanded; tagged = expTags;
    let cmd = argv[0];
    if (cmd === 'sudo' && argv.length > 1 && !argv[1].startsWith('-')) { argv = argv.slice(1); cmd = argv[0]; }
    if (bg) {
      const pid = this.nextPid++;
      const j = this.nextJob++;
      this.jobs.push({ n: j, pid, cmd: line, state:'Running' });
      return [{ t:'out', s:`[${j}] ${pid}` }];
    }
    let result;
    const fn = this.cmds[cmd];
    if (fn) {
      try { result = fn.call(this, argv.slice(1), argv) || []; }
      catch (e) { result = [{ t:'err', s:`${cmd}: ${e.message}` }]; }
    } else if (cmd.includes('/')) {
      // script execution: ./script.sh or /path/to/script
      const path = cmd.startsWith('./') ? this.norm(this.cwd + '/' + cmd.slice(2)) : this.norm(cmd);
      const n = this.node(path);
      if (!n) return [{ t:'err', s:`bash: ${cmd}: No such file or directory` }];
      if (n.type !== 'file') return [{ t:'err', s:`bash: ${cmd}: Is a directory` }];
      if (!(n.mode & 0o111)) return [{ t:'err', s:`bash: ${cmd}: Permission denied` }];
      const slines = (n.content||'').split('\n').filter(l => l && !l.startsWith('#'));
      result = [];
      for (const sl of slines) { const r = this.runOne(sl.trim()); if (r && r.length) result.push(...r); }
    } else {
      return [{ t:'err', s:`bash: ${cmd}: command not found` }];
    }
    if (redir) {
      const content = result.filter(o => o.t === 'out').map(o => o.s).join('\n') + '\n';
      const { parent, name } = this.parentOf(redir);
      if (parent) {
        const existing = parent.children[name];
        if (redirAppend && existing && existing.type === 'file') {
          existing.content = (existing.content || '') + content;
        } else {
          parent.children[name] = file(content, 0o666 & ~this.umask, USER, 62);
        }
      }
      return [];
    }
    return result;
  }
  tokenize(line, tag) {
    const out = []; let cur = '', q = null, wasQ = false;
    for (const ch of line) {
      if (q) { if (ch === q) q = null; else cur += ch; }
      else if (ch === '"' || ch === "'") { q = ch; wasQ = true; }
      else if (/\s/.test(ch)) { if (cur || wasQ) { out.push(tag ? { v:cur, q:wasQ } : cur); cur = ''; wasQ = false; } }
      else cur += ch;
    }
    if (cur || wasQ) out.push(tag ? { v:cur, q:wasQ } : cur);
    return out;
  }
  /* split argv into flag set + operands */
  parse(args) {
    const flags = new Set(); const longs = []; const ops = [];
    for (const a of args) {
      if (a.startsWith('--') && a.length > 2) { longs.push(a.slice(2)); }
      else if (a.startsWith('-') && a.length > 1 && !/^-\d/.test(a)) { a.slice(1).split('').forEach(c => flags.add(c)); }
      else ops.push(a);
    }
    const L = { all:'a', 'almost-all':'A', directory:'d', classify:'F', 'human-readable':'h', reverse:'r',
                recursive:'r', archive:'a', interactive:'i', update:'u', verbose:'v', force:'f', symbolic:'s', login:'l' };
    longs.forEach(l => { const k = l.split('=')[0]; if (L[k]) flags.add(L[k]); });
    return { f: flags, ops, longs };
  }
  out(s){ return { t:'out', s }; }
  err(s){ return { t:'err', s }; }
  note(s){ return { t:'note', s }; }
}

/* ---------- the commands ---------- */
Shell.prototype.cmds = {
  pwd() { return [this.out(this.cwd)]; },

  cd(args) {
    let target = args[0];
    if (!target || target === '~') target = '/home/' + USER;
    else if (target === '-') target = this.prev;
    const path = this.norm(this.expand(target));
    const n = this.node(path);
    if (!n) return [this.err(`bash: cd: ${args[0]}: No such file or directory`)];
    if (n.type !== 'dir') return [this.err(`bash: cd: ${args[0]}: Not a directory`)];
    this.prev = this.cwd; this.cwd = path;
    return args[0] === '-' ? [this.out(path)] : [];
  },

  ls(args) {
    const { f, ops } = this.parse(args);
    const targets = ops.length ? ops : ['.'];
    const blocks = [];
    for (const t of targets) {
      const n = this.node(t);
      if (!n) { blocks.push(this.err(`ls: cannot access '${t}': No such file or directory`)); continue; }
      let entries;
      const listing = n.type === 'dir' && !f.has('d');
      if (listing) {
        entries = Object.entries(n.children).map(([name, node]) => ({ name, node }));
        if (!f.has('a') && !f.has('A')) entries = entries.filter(e => !e.name.startsWith('.'));
        if (f.has('a')) entries = [{ name:'.', node:n }, { name:'..', node:this.node(this.norm(this.expand(t)) + '/..') || n }, ...entries];
      } else {
        entries = [{ name: t, node: n }];
      }
      if (f.has('S'))      entries.sort((a,b) => this.sizeOf(b.node) - this.sizeOf(a.node));
      else if (f.has('t')) entries.sort((a,b) => (b.node.mtime||0) - (a.node.mtime||0));
      else entries.sort((a,b) => a.name.replace(/^\./,'').localeCompare(b.name.replace(/^\./,'')));
      if (f.has('r')) entries.reverse();

      const cls = e => f.has('F') ? e.name + (e.node.type==='dir' ? '/' : e.node.type==='link' ? '@' : (e.node.mode & 0o111) ? '*' : '') : e.name;
      if (targets.length > 1 && listing) blocks.push(this.out(`${t}:`));
      if (f.has('l')) {
        if (listing) blocks.push(this.out(`total ${entries.length * 4}`));
        entries.forEach(e => {
          const nd = e.node;
          const size = f.has('h') ? this.human(this.sizeOf(nd)) : String(this.sizeOf(nd));
          const arrow = nd.type === 'link' ? ` -> ${nd.target}` : '';
          blocks.push({ t:'ls',
            s: `${this.modeStr(nd)} ${String(nd.type==='dir'?2:1).padStart(2)} ${nd.owner.padEnd(7)} ${nd.group.padEnd(7)} ${size.padStart(6)} ${this.dateOf(nd)} `,
            name: cls(e) + arrow, kind: nd.type, exec: !!(nd.mode & 0o111) });
        });
      } else {
        blocks.push({ t:'lsgrid', items: entries.map(e => ({ name: cls(e), kind: e.node.type, exec: !!(e.node.mode & 0o111) })) });
      }
    }
    return blocks;
  },

  cat(args) {
    const { ops } = this.parse(args);
    if (!ops.length && this._stdin) return this._stdin.replace(/\n$/,'').split('\n').map(l => this.out(l));
    if (!ops.length) return [this.note('cat is waiting for keyboard input. Give it a file: cat notes.txt')];
    const out = [];
    for (const p of ops) {
      const n = this.node(p);
      if (!n) { out.push(this.err(`cat: ${p}: No such file or directory`)); continue; }
      if (n.type === 'dir') { out.push(this.err(`cat: ${p}: Is a directory`)); continue; }
      if (n.mode === 0o000) { out.push(this.err(`cat: ${p}: Permission denied`)); continue; }
      if (n.content === ELF_MAGIC || n.content === JPG_MAGIC) {
        out.push({ t:'garbage' });
        out.push(this.note('That was a binary file and it scrambled your terminal. Fix it with: reset'));
        continue;
      }
      n.content.replace(/\n$/,'').split('\n').forEach(l => out.push(this.out(l)));
    }
    return out;
  },

  less(args) {
    const { ops } = this.parse(args);
    const n = ops[0] && this.node(ops[0]);
    if (!n) return [this.err(`less: ${ops[0]||''}: No such file or directory`)];
    if (n.type === 'dir') return [this.err(`less: ${ops[0]}: is a directory`)];
    const lines = (n.content||'').replace(/\n$/,'').split('\n');
    const out = lines.slice(0, 12).map(l => this.out(l));
    out.push({ t:'pager', s:`(lines 1-${Math.min(12,lines.length)} of ${lines.length})  Space=forward  b=back  G=end  1G=start  /text=search  n=next  q=quit` });
    return out;
  },

  head(args) {
    const { ops } = this.parse(args);
    let n = 10;
    const i = args.indexOf('-n'); if (i >= 0) n = parseInt(args[i+1]) || 10;
    const m = args.find(a => /^-\d+$/.test(a)); if (m) n = parseInt(m.slice(1));
    const name = ops.filter(o => !/^-?\d+$/.test(o))[0];
    if (!name && this._stdin) return this._stdin.replace(/\n$/,'').split('\n').slice(0, n).map(l => this.out(l));
    const node = name && this.node(name);
    if (!node) return [this.err(`head: cannot open '${name||''}' for reading: No such file or directory`)];
    return (node.content||'').replace(/\n$/,'').split('\n').slice(0, n).map(l => this.out(l));
  },

  tail(args) {
    const { ops } = this.parse(args);
    let n = 10;
    const i = args.indexOf('-n'); if (i >= 0) n = parseInt(args[i+1]) || 10;
    const m = args.find(a => /^-\d+$/.test(a)); if (m) n = parseInt(m.slice(1));
    const name = ops.filter(o => !/^-?\d+$/.test(o))[0];
    if (!name && this._stdin) return this._stdin.replace(/\n$/,'').split('\n').slice(-n).map(l => this.out(l));
    const node = name && this.node(name);
    if (!node) return [this.err(`tail: cannot open '${name||''}' for reading: No such file or directory`)];
    return (node.content||'').replace(/\n$/,'').split('\n').slice(-n).map(l => this.out(l));
  },

  file(args) {
    const out = [];
    for (const p of this.parse(args).ops) {
      const n = this.node(p);
      if (!n) { out.push(this.err(`${p}: cannot open (No such file or directory)`)); continue; }
      let d = 'ASCII text';
      if (n.type === 'dir') d = 'directory';
      else if (n.type === 'link') d = `symbolic link to ${n.target}`;
      else if (n.content === ELF_MAGIC) d = 'ELF 64-bit LSB pie executable, x86-64, dynamically linked';
      else if (n.content === JPG_MAGIC) d = 'JPEG image data, JFIF standard 1.01';
      else if (n.content.startsWith('#!')) d = 'Bourne-Again shell script, ASCII text executable';
      else if (!n.content) d = 'empty';
      out.push(this.out(`${p}: ${d}`));
    }
    return out;
  },

  wc(args) {
    const { f, ops } = this.parse(args);
    const out = [];
    if (!ops.length && this._stdin) {
      const c = this._stdin;
      const lines = c ? c.split('\n').length - (c.endsWith('\n') ? 1 : 0) : 0;
      const words = c.split(/\s+/).filter(Boolean).length;
      if (f.has('l'))      out.push(this.out(String(lines).padStart(7)));
      else if (f.has('w')) out.push(this.out(String(words).padStart(7)));
      else                 out.push(this.out(`${String(lines).padStart(7)}${String(words).padStart(8)}${String(c.length).padStart(8)}`));
      return out;
    }
    for (const p of ops) {
      const n = this.node(p);
      if (!n) { out.push(this.err(`wc: ${p}: No such file or directory`)); continue; }
      const c = n.content || '';
      const lines = c ? c.split('\n').length - (c.endsWith('\n') ? 1 : 0) : 0;
      const words = c.split(/\s+/).filter(Boolean).length;
      if (f.has('l'))      out.push(this.out(`${String(lines).padStart(7)} ${p}`));
      else if (f.has('w')) out.push(this.out(`${String(words).padStart(7)} ${p}`));
      else                 out.push(this.out(`${String(lines).padStart(7)}${String(words).padStart(8)}${String(c.length).padStart(8)} ${p}`));
    }
    return out.length ? out : [this.err('wc: needs a file name')];
  },

  mkdir(args) {
    const { f, ops, longs } = this.parse(args);
    const p = f.has('p') || longs.includes('parents');
    const out = [];
    for (const t of ops) {
      if (p) {
        let cur = '';
        for (const part of this.norm(this.expand(t)).split('/').slice(1)) {
          cur += '/' + part;
          if (!this.node(cur)) { const { parent, name } = this.parentOf(cur); parent.children[name] = dir(0o777 & ~this.umask); }
        }
      } else {
        const { parent, name } = this.parentOf(t);
        if (!parent) { out.push(this.err(`mkdir: cannot create directory '${t}': No such file or directory`)); continue; }
        if (parent.children[name]) { out.push(this.err(`mkdir: cannot create directory '${t}': File exists`)); continue; }
        parent.children[name] = dir(0o777 & ~this.umask);
      }
    }
    if (!ops.length) out.push(this.err('mkdir: missing operand'));
    return out;
  },

  rmdir(args) {
    const out = [];
    for (const t of this.parse(args).ops) {
      const n = this.node(t);
      if (!n) { out.push(this.err(`rmdir: failed to remove '${t}': No such file or directory`)); continue; }
      if (n.type !== 'dir') { out.push(this.err(`rmdir: failed to remove '${t}': Not a directory`)); continue; }
      if (Object.keys(n.children).length) { out.push(this.err(`rmdir: failed to remove '${t}': Directory not empty`)); continue; }
      const { parent, name } = this.parentOf(t); delete parent.children[name];
    }
    return out;
  },

  rm(args) {
    const { f, ops } = this.parse(args);
    const out = [];
    for (const t of ops) {
      const n = this.node(t);
      if (!n) { if (!f.has('f')) out.push(this.err(`rm: cannot remove '${t}': No such file or directory`)); continue; }
      if (n.type === 'dir' && !f.has('r') && !f.has('R')) { out.push(this.err(`rm: cannot remove '${t}': Is a directory`)); continue; }
      const { parent, name } = this.parentOf(t); delete parent.children[name];
      if (f.has('v')) out.push(this.out(`removed ${n.type==='dir'?"directory ":''}'${t}'`));
    }
    if (!ops.length) out.push(this.err('rm: missing operand'));
    return out;
  },

  cp(args) {
    const { f, ops } = this.parse(args);
    if (ops.length < 2) return [this.err('cp: missing destination file operand')];
    const dest = ops.pop(); const out = [];
    const dn = this.node(dest);
    for (const src of ops) {
      const s = this.node(src);
      if (!s) { out.push(this.err(`cp: cannot stat '${src}': No such file or directory`)); continue; }
      if (s.type === 'dir' && !f.has('r') && !f.has('R') && !f.has('a')) { out.push(this.err(`cp: -r not specified; omitting directory '${src}'`)); continue; }
      const copy = JSON.parse(JSON.stringify(s));
      if (!f.has('a')) { copy.owner = USER; copy.group = GROUP; }
      let target = dest, parent, name;
      if (dn && dn.type === 'dir') { parent = dn; name = this.basename(src); target = dest.replace(/\/$/,'') + '/' + name; }
      else { const pr = this.parentOf(dest); parent = pr.parent; name = pr.name; }
      if (!parent) { out.push(this.err(`cp: cannot create '${dest}': No such file or directory`)); continue; }
      if (f.has('u') && parent.children[name] && (parent.children[name].mtime||0) >= (s.mtime||0)) continue;
      parent.children[name] = copy;
      if (f.has('v')) out.push(this.out(`'${src}' -> '${target}'`));
    }
    return out;
  },

  mv(args) {
    const { f, ops } = this.parse(args);
    if (ops.length < 2) return [this.err('mv: missing destination file operand')];
    const dest = ops.pop(); const out = []; const dn = this.node(dest);
    for (const src of ops) {
      const s = this.node(src);
      if (!s) { out.push(this.err(`mv: cannot stat '${src}': No such file or directory`)); continue; }
      let target = dest, parent, name;
      if (dn && dn.type === 'dir') { parent = dn; name = this.basename(src); target = dest.replace(/\/$/,'') + '/' + name; }
      else { const pr = this.parentOf(dest); parent = pr.parent; name = pr.name; }
      if (!parent) { out.push(this.err(`mv: cannot move '${src}': No such file or directory`)); continue; }
      if (f.has('u') && parent.children[name] && (parent.children[name].mtime||0) >= (s.mtime||0)) continue;
      const sp = this.parentOf(src); delete sp.parent.children[sp.name];
      parent.children[name] = s;
      if (f.has('v')) out.push(this.out(`renamed '${src}' -> '${target}'`));
    }
    return out;
  },

  ln(args) {
    const { f, ops } = this.parse(args);
    if (ops.length < 2) return [this.err('ln: missing file operand')];
    const [src, dst] = ops;
    const s = this.node(src);
    if (!s && !f.has('s')) return [this.err(`ln: failed to access '${src}': No such file or directory`)];
    const { parent, name } = this.parentOf(dst);
    if (!parent) return [this.err(`ln: failed to create link '${dst}': No such file or directory`)];
    parent.children[name] = f.has('s') ? link(src) : JSON.parse(JSON.stringify(s));
    return [];
  },

  touch(args) {
    for (const t of this.parse(args).ops) {
      const n = this.node(t);
      if (n) n.mtime = 62;
      else { const { parent, name } = this.parentOf(t); if (parent) parent.children[name] = file('', 0o666 & ~this.umask, USER, 62); }
    }
    return [];
  },

  chmod(args) {
    const { f, ops, longs } = this.parse(args);
    const rec = f.has('R') || longs.includes('recursive');
    const spec = ops[0]; const out = [];
    if (ops.length < 2) return [this.err('chmod: missing operand')];
    const apply = n => {
      if (/^[0-7]{3,4}$/.test(spec)) { n.mode = parseInt(spec, 8); return; }
      const m = spec.match(/^([ugoa]*)([+\-=])([rwxst]*)$/);
      if (!m) { out.push(this.err(`chmod: invalid mode: '${spec}'`)); return; }
      let [, who, op, perms] = m;
      const bitFor = { r:4, w:2, x:1 };
      const shift = { u:6, g:3, o:0 };
      const whoList = (!who || who === 'a') ? ['u','g','o'] : who.split('');
      let mode = n.mode;
      if (perms.includes('s')) {
        let sb = 0;
        if (who.includes('u')) sb |= 0o4000;
        if (who.includes('g')) sb |= 0o2000;
        if (!sb) sb = 0o6000;
        mode = op === '-' ? (mode & ~sb) : (mode | sb);
      }
      if (perms.includes('t')) mode = op === '-' ? (mode & ~0o1000) : (mode | 0o1000);
      let val = 0; perms.split('').forEach(p => { if (bitFor[p]) val |= bitFor[p]; });
      whoList.forEach(w => {
        const sh = shift[w]; const cur = (mode >> sh) & 7;
        const nv = op === '+' ? (cur | val) : op === '-' ? (cur & ~val) : val;
        mode = (mode & ~(7 << sh)) | (nv << sh);
      });
      n.mode = mode;
    };
    const walk = n => { apply(n); if (rec && n.type === 'dir') Object.values(n.children).forEach(walk); };
    for (const t of ops.slice(1)) {
      const n = this.node(t);
      if (!n) { out.push(this.err(`chmod: cannot access '${t}': No such file or directory`)); continue; }
      walk(n);
    }
    return out;
  },

  chown(args) {
    const { f, ops, longs } = this.parse(args);
    const rec = f.has('R') || longs.includes('recursive');
    const [owner, group] = (ops[0]||'').split(':');
    const out = [];
    const apply = n => {
      if (owner) n.owner = owner;
      if (group) n.group = group;
      if (rec && n.type === 'dir') Object.values(n.children).forEach(apply);
    };
    if (ops.length < 2) return [this.err('chown: missing operand')];
    for (const t of ops.slice(1)) {
      const n = this.node(t);
      if (!n) { out.push(this.err(`chown: cannot access '${t}': No such file or directory`)); continue; }
      apply(n);
    }
    return out;
  },

  chgrp(args) {
    const { ops } = this.parse(args); const out = [];
    if (ops.length < 2) return [this.err('chgrp: missing operand')];
    for (const t of ops.slice(1)) {
      const n = this.node(t);
      if (!n) { out.push(this.err(`chgrp: cannot access '${t}': No such file or directory`)); continue; }
      n.group = ops[0];
    }
    return out;
  },

  umask(args) {
    if (!args.length) return [this.out('0' + this.umask.toString(8).padStart(3,'0'))];
    this.umask = parseInt(args[0], 8); return [];
  },

  id(args) {
    if (args[0] === 'bob')  return [this.out('uid=1001(bob) gid=1001(bob) groups=1001(bob),1002(staff)')];
    if (args[0] === 'root') return [this.out('uid=0(root) gid=0(root) groups=0(root)')];
    return [this.out(`uid=1000(${USER}) gid=1000(${GROUP}) groups=1000(${GROUP}),27(sudo),1002(staff)`)];
  },
  whoami() { return [this.out(USER)]; },
  groups() { return [this.out(`${GROUP} sudo staff`)]; },

  echo(args) {
    const vars = { HOME:'/home/'+USER, USER, SHELL:'/bin/bash', PWD:this.cwd, PATH:'/usr/local/bin:/usr/bin:/bin', HOSTNAME:HOST };
    return [this.out(args.map(a => a.replace(/\$\{?(\w+)\}?/g, (m, v) => vars[v] ?? '')).join(' '))];
  },

  env() { return ['HOME=/home/'+USER, 'USER='+USER, 'SHELL=/bin/bash', 'PATH=/usr/local/bin:/usr/bin:/bin', 'PWD='+this.cwd, 'LANG=en_US.UTF-8', 'TERM=xterm-256color'].map(l => this.out(l)); },

  ps(args, argv) {
    const raw = (argv[1] && !argv[1].startsWith('-')) ? argv[1] : (argv[1]||'').replace('-','');
    const all = /a/.test(raw), userfmt = /u/.test(raw);
    const rows = [];
    const mine = [ { pid:2841, cmd:'-bash', cpu:0.0, mem:0.1 }, { pid:this.nextPid, cmd:'ps ' + raw, cpu:0.0, mem:0.0 } ];
    const sys  = [ { pid:1,   cmd:'/usr/lib/systemd/systemd', cpu:0.1, mem:0.4, user:'root' },
                   { pid:412, cmd:'/usr/sbin/sshd -D',        cpu:0.0, mem:0.2, user:'root' },
                   { pid:980, cmd:'/usr/bin/gnome-shell',     cpu:2.4, mem:3.8, user:USER } ];
    const list = all ? [...sys, ...mine] : [...mine];
    this.jobs.forEach(j => list.push({ pid:j.pid, cmd:j.cmd, cpu:0.0, mem:0.1 }));
    if (userfmt) {
      rows.push('USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');
      list.forEach(p => rows.push(`${(p.user||USER).padEnd(9)} ${String(p.pid).padStart(4)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)}  22344  5120 ${(p.user === 'root' ? '?' : 'pts/0').padEnd(8)} Ss   09:02   0:00 ${p.cmd}`));
    } else {
      rows.push('    PID TTY          TIME CMD');
      list.forEach(p => rows.push(`${String(p.pid).padStart(7)} ${(p.user === 'root' ? '?' : 'pts/0').padEnd(8)} 00:00:00 ${p.cmd.split(' ')[0]}`));
    }
    return rows.map(r => this.out(r));
  },

  jobs() {
    if (!this.jobs.length) return [];
    return this.jobs.map((j, i) => this.out(`[${j.n}]${i === this.jobs.length-1 ? '+' : '-'}  ${j.state.padEnd(22)} ${j.cmd}`));
  },
  bg(args) {
    const n = parseInt((args[0]||'').replace('%','')) || (this.jobs[0]||{}).n;
    const j = this.jobs.find(x => x.n === n);
    if (!j) return [this.err(`bash: bg: job ${args[0]||''} not found`)];
    j.state = 'Running'; return [this.out(`[${j.n}]+ ${j.cmd} &`)];
  },
  fg(args) {
    const n = parseInt((args[0]||'').replace('%','')) || (this.jobs[0]||{}).n;
    const i = this.jobs.findIndex(x => x.n === n);
    if (i < 0) return [this.err(`bash: fg: ${args[0]||'current'}: no such job`)];
    const j = this.jobs.splice(i,1)[0];
    return [this.out(j.cmd), this.note('That job now owns your keyboard. Ctrl-z would stop it again.')];
  },
  kill(args) {
    if (args[0] === '-l') return [
      this.out(' 1) SIGHUP     2) SIGINT     3) SIGQUIT    4) SIGILL     5) SIGTRAP'),
      this.out(' 6) SIGABRT    7) SIGBUS     8) SIGFPE     9) SIGKILL   10) SIGUSR1'),
      this.out('11) SIGSEGV   12) SIGUSR2   13) SIGPIPE   14) SIGALRM   15) SIGTERM'),
      this.out('18) SIGCONT   19) SIGSTOP   20) SIGTSTP   28) SIGWINCH')];
    const target = args[args.length-1];
    if (!target) return [this.err('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec')];
    if (target.startsWith('%')) {
      const n = parseInt(target.slice(1)); const i = this.jobs.findIndex(j => j.n === n);
      if (i < 0) return [this.err(`bash: kill: ${target}: no such job`)];
      const j = this.jobs.splice(i,1)[0];
      return [this.out(`[${j.n}]+  Terminated              ${j.cmd}`)];
    }
    const pid = parseInt(target); const i = this.jobs.findIndex(j => j.pid === pid);
    if (i >= 0) { const j = this.jobs.splice(i,1)[0]; return [this.out(`[${j.n}]+  Terminated              ${j.cmd}`)]; }
    return [this.note(`Signal sent to PID ${pid}.`)];
  },
  killall(args) {
    const name = args[args.length-1];
    const hits = this.jobs.filter(j => j.cmd.includes(name));
    hits.forEach(j => this.jobs.splice(this.jobs.indexOf(j), 1));
    return hits.length ? [this.out(`${name}: ${hits.length} process(es) signalled`)] : [this.err(`${name}: no process found`)];
  },
  nice()      { return [this.note('nice: program launched with an adjusted priority (niceness runs -20 greedy to 19 generous).')]; },
  renice(args){ return [this.out(`${args[args.length-1]||'0'}: old priority 0, new priority ${args[1]||'0'}`)]; },
  nohup()     { return [this.note("nohup: ignoring input and appending output to 'nohup.out' — this job now survives logout.")]; },
  pstree()    { return ['systemd-+-sshd---bash---pstree','        |-gnome-shell','        |-NetworkManager','        `-systemd-journald'].map(l => this.out(l)); },
  vmstat()    { return [this.out('procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----'),
                        this.out(' r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st'),
                        this.out(' 1  0      0 612344  84120 993216    0    0    12    18  142  310  2  1 97  0  0')]; },
  top()   { return [{ t:'app', app:'top' }]; },
  htop()  { return [{ t:'app', app:'top' }]; },
  tload() { return [this.out('  1.20, 0.94, 0.71'), this.out('  .:iIHHIi:.  .:iIHHHIi:.  .:iI'), this.note('Ctrl-c to leave tload.')]; },
  xload() { return [this.note('xload needs a graphical desktop. Try running it in the background: xload &   then: jobs')]; },
  vim(args)  {
    const name = this.parse(args).ops[0] || '';
    const path = name ? this.norm(this.expand(name)) : '';
    let content = '';
    let isNew = true;
    if (path) {
      const node = this.node(path);
      if (node && node.type === 'dir') return [this.err('vim: ' + name + ' is a directory')];
      if (node) { content = node.content || ''; isNew = false; }
    }
    return [{ t:'app', app:'vim', file: name || '[No Name]', path, content, isNew }];
  },
  vi(args)   { return Shell.prototype.cmds.vim.call(this, args); },
  vimtutor() { return [this.note('vimtutor opens a 30-minute guided Vim lesson. In here, try the Vim lessons in Learn mode.')]; },
  man(args)  { const ops = this.parse(args).ops;
               if (args[0] === '-k') return Shell.prototype.cmds.apropos.call(this, args.slice(1));
               return [{ t:'app', app:'man', topic: ops[ops.length-1] || '', section: ops.length > 1 ? ops[0] : '' }]; },
  whatis(args){ const a = args[0]||''; const it = ALL_ITEMS.find(i => i.cmd === a) || ITEM_BY_ID[a];
                return [this.out(it ? `${a} (1)  - ${it.what}` : `${a}: nothing appropriate.`)]; },
  apropos(args){ const q = (args[0]||'').toLowerCase();
                 if (!q) return [this.err('apropos: what should I search for?')];
                 const hits = ALL_ITEMS.filter(i => i.what.toLowerCase().includes(q) || i.cmd.toLowerCase().includes(q)).slice(0, 8);
                 return hits.length ? hits.map(i => this.out(`${i.cmd.split(' ')[0].padEnd(12)} (1)  - ${i.what}`))
                                    : [this.err(`${q}: nothing appropriate.`)]; },
  info()     { return [this.note('info: the GNU hypertext manuals would open here. Press q to leave. For most things, man is quicker.')]; },
  which(args){ const known = { ls:'/bin/ls', cat:'/bin/cat', vim:'/usr/bin/vim', python3:'/usr/bin/python3', htop:'/usr/bin/htop', bash:'/bin/bash', rm:'/bin/rm', cp:'/bin/cp' };
               const a = args[0]||'';
               return known[a] ? [this.out(known[a])] : [this.err(`which: no ${a} in (/usr/local/bin:/usr/bin:/bin)`)]; },
  type(args) { const builtins = ['cd','pwd','echo','alias','type','help','jobs','fg','bg','umask','set','kill','history','export'];
               const a = args[0]||'';
               if (this.aliases[a]) return [this.out(`${a} is aliased to \`${this.aliases[a]}'`)];
               if (builtins.includes(a)) return [this.out(`${a} is a shell builtin`)];
               const known = { ls:'/bin/ls', cat:'/bin/cat', vim:'/usr/bin/vim', htop:'/usr/bin/htop', rm:'/bin/rm' };
               return known[a] ? [this.out(`${a} is ${known[a]}`)] : [this.err(`bash: type: ${a}: not found`)]; },
  help(args) { if (!args.length) return [this.out("GNU bash, version 5.2. Type `help name' to find out more about the builtin `name'.")];
               const a = args[args.length-1];
               const it = ITEM_BY_ID[a] || ALL_ITEMS.find(i => i.cmd === a);
               return [this.out(`${a}: ${it ? it.what : 'no help topics match. Note that help only covers shell builtins - use man for programs.'}`)]; },
  alias(args, argv) {
    if (!args.length) return Object.entries(this.aliases).map(([k,v]) => this.out(`alias ${k}='${v}'`));
    const joined = argv.slice(1).join(' ');
    const m = joined.match(/^([\w.]+)=['"]?(.+?)['"]?$/);
    if (m) { this.aliases[m[1]] = m[2]; return []; }
    return this.aliases[args[0]] ? [this.out(`alias ${args[0]}='${this.aliases[args[0]]}'`)]
                                 : [this.err(`bash: alias: ${args[0]}: not found`)];
  },
  unalias(args) { delete this.aliases[args[0]]; return []; },
  passwd()      { return [this.out(`Changing password for user ${USER}.`), this.note('(Password prompts are switched off in the simulator.)')]; },
  useradd(a)    { return [this.note(`useradd: account '${a[a.length-1]||'?'}' created. Add -m and it gets a home directory too.`)]; },
  usermod()     { return [this.note('usermod: account modified. Remember: -aG appends groups, -G alone replaces them.')]; },
  userdel()     { return [this.note('userdel: account removed. -r also deletes the home directory and mail spool.')]; },
  groupadd(a)   { return [this.note(`groupadd: group '${a[a.length-1]||'?'}' created.`)]; },
  groupdel()    { return [this.note('groupdel: group removed.')]; },
  groupmod()    { return [this.note('groupmod: group modified (-n renames it).')]; },
  addgroup()    { return [this.note('addgroup: the friendly wrapper around groupadd / usermod.')]; },
  lastlog()     { return [this.out('Username         Port     From             Latest'),
                          this.out('root             pts/1    192.168.1.4      Tue Aug 19 21:14:02 2025'),
                          this.out(`${USER}          pts/0    192.168.1.5      Wed Aug 20 09:02:41 2025`),
                          this.out('bob                                       **Never logged in**')]; },
  su(args)   { if (args.includes('-c')) return [this.note('su -c ran that single command as the other user, then exited.')];
               return [this.note('su would open a shell as another user (it asks for THEIR password). sudo -i is the modern way.')]; },
  sudo(args) { if (!args.length) return [this.err('usage: sudo [-i] command')];
               if (args[0] === '-i') return [this.note('You would now be root. Watch the prompt: $ becomes #.')];
               return this.runOne(args.join(' ')); },
  dnf(args)  { const pkg = args[args.length-1];
               if (!args.includes('install')) return [this.note('dnf: try  sudo dnf install vim')];
               return [this.out('Fedora 40 - x86_64                    12 MB/s |  82 MB     00:06'),
                       this.out(`Installing       : ${pkg}`), this.out('Complete!')]; },
  halt()     { return [this.note('The system would halt now. (Not in a browser, thankfully.)')]; },
  poweroff() { return [this.note('The system would power off now.')]; },
  reboot()   { return [this.note('The system would reboot now.')]; },
  shutdown(args) { const r = args.includes('-r');
                   return [this.note(`Shutdown scheduled: the system would ${r ? 'reboot' : 'power off'} ${args.includes('now') ? 'immediately' : 'shortly'}.`)]; },
  reset()    { return [{ t:'reset' }]; },
  clear()    { return [{ t:'clear' }]; },
  history()  { return this.history.map((h,i) => this.out(`${String(i+1).padStart(5)}  ${h}`)); },
  explain(args) {
    if (!args.length) return [this.err('explain: usage: explain <command line>')];
    const line = args.join(' ');
    const toks = line.split(/\s+/).filter(Boolean);
    const base = toks[0];
    const baseItem = ALL_ITEMS.find(i => i.cmd === base) || ITEM_BY_ID[base];
    const out = [];
    out.push({ t:'explain', parts:[] });
    const parts = out[0].parts;
    if (baseItem) parts.push({ token: base, kind:'cmd', what: baseItem.what, note: baseItem.note || '' });
    else parts.push({ token: base, kind:'cmd', what:'(not in the course reference)', note:'' });
    for (let k = 1; k < toks.length; k++) {
      const tok = toks[k];
      if (tok.startsWith('-') && tok.length > 1 && !tok.startsWith('--') && !/^-\d/.test(tok)) {
        const flags = tok.slice(1).split('');
        for (const f of flags) {
          const combo = base + ' -' + f;
          const it = ALL_ITEMS.find(i => i.cmd === combo) || ITEM_BY_ID[base + '_' + f];
          parts.push({ token: '-' + f, kind:'flag', what: it ? it.what : '(unknown flag)', note: it ? (it.note||'') : '' });
        }
      } else if (tok.startsWith('--')) {
        const name = tok.replace(/=.*/, '');
        const it = ALL_ITEMS.find(i => i.cmd === base + ' ' + name);
        parts.push({ token: tok, kind:'flag', what: it ? it.what : '(long option)', note: it ? (it.note||'') : '' });
      } else if (tok === '|') {
        parts.push({ token: '|', kind:'op', what:'pipe: sends the output of the left command into the input of the right command', note:'' });
      } else if (tok === '>' || tok === '>>') {
        parts.push({ token: tok, kind:'op', what: tok === '>' ? 'redirect: write output to a file (overwrites)' : 'append: add output to the end of a file', note:'' });
      } else if (tok === '<') {
        parts.push({ token: tok, kind:'op', what:'redirect: read input from a file', note:'' });
      } else if (tok === '&') {
        parts.push({ token: '&', kind:'op', what:'run the command in the background', note:'' });
      } else if (tok === ';') {
        parts.push({ token: ';', kind:'op', what:'command separator: run the next command after this one finishes', note:'' });
      } else if (/^\$[\({]?\w/.test(tok)) {
        parts.push({ token: tok, kind:'var', what:'variable or command substitution', note:'' });
      } else {
        parts.push({ token: tok, kind:'path', what:'argument (file, directory, or value)', note:'' });
      }
    }
    return out;
  },
  set(args)  { if (args[0] === '-o' && args[1] === 'vi')    return [this.note('bash line editing is now vi-style: you begin in insert mode, tap Esc for normal mode.')];
               if (args[0] === '-o' && args[1] === 'emacs') return [this.note('bash line editing is back to emacs-style: Ctrl-a start, Ctrl-e end, Ctrl-k kill to end of line.')];
               return [this.note('set: try  set -o vi  or  set -o emacs')]; },
  date()     { return [this.out('Wed Aug 20 09:31:07 AM UTC 2025')]; },
  uname(a)   { return [this.out(a.includes('-a') ? 'Linux fedora 6.9.7-200.fc40.x86_64 #1 SMP x86_64 GNU/Linux' : 'Linux')]; },
  exit()     { return [this.note('No escape from the simulator - press Esc to leave the terminal.')]; },
  hostname() { return [this.out(HOST)]; },

  grep(args) {
    const flags = new Set(); const ops = [];
    for (const a of args) {
      if (a.startsWith('-') && a.length > 1 && !/^-\d/.test(a)) a.slice(1).split('').forEach(c => flags.add(c));
      else ops.push(a);
    }
    const pattern = ops[0];
    if (!pattern) return [this.err('grep: missing pattern')];
    const reFlags = flags.has('i') ? 'i' : '';
    let re; try { re = new RegExp(pattern, reFlags); } catch(e) { return [this.err(`grep: invalid regex: ${pattern}`)]; }
    const grepLines = (lines, prefix) => {
      const out = []; let count = 0;
      lines.forEach((l, i) => {
        const hit = re.test(l);
        if (flags.has('v') ? !hit : hit) { count++; if (!flags.has('c')) { let p = prefix; if (flags.has('n')) p += (i+1)+':'; out.push(this.out(p+l)); } }
      });
      if (flags.has('c')) out.push(this.out(prefix + count));
      return out;
    };
    const files = ops.slice(1);
    if (!files.length) {
      if (this._stdin) return grepLines(this._stdin.replace(/\n$/,'').split('\n'), '');
      return [this.err('grep: missing file operand')];
    }
    const out = []; const multi = files.length > 1;
    for (const f of files) {
      const n = this.node(f);
      if (!n) { out.push(this.err(`grep: ${f}: No such file or directory`)); continue; }
      if (n.type === 'dir') { out.push(this.err(`grep: ${f}: Is a directory`)); continue; }
      out.push(...grepLines((n.content||'').replace(/\n$/,'').split('\n'), multi ? f+':' : ''));
    }
    return out;
  },

  sed(args) {
    const rest = [...args];
    let inplace = false;
    if (rest[0] === '-i') { inplace = true; rest.shift(); }
    const expr = rest[0];
    if (!expr) return [this.err('sed: missing expression')];
    const m = expr.match(/^s(.)(.+?)\1(.*?)\1([gi]*)$/);
    if (!m) return [this.err(`sed: invalid expression: ${expr}`)];
    const [, , search, replace, sf] = m;
    const re = new RegExp(search, sf.includes('g') ? 'g' : '');
    const transform = t => t.split('\n').map(l => l.replace(re, replace)).join('\n');
    const files = rest.slice(1);
    if (!files.length && this._stdin) return transform(this._stdin).replace(/\n$/,'').split('\n').map(l => this.out(l));
    if (!files.length) return [this.err('sed: missing file operand')];
    const out = [];
    for (const f of files) {
      const n = this.node(f);
      if (!n) { out.push(this.err(`sed: can't read ${f}: No such file or directory`)); continue; }
      const result = transform(n.content || '');
      if (inplace) n.content = result;
      else result.replace(/\n$/,'').split('\n').forEach(l => out.push(this.out(l)));
    }
    return out;
  },

  printf(args) {
    if (!args.length) return [];
    let fmt = args[0];
    const vals = args.slice(1);
    fmt = fmt.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    let vi = 0;
    const result = fmt.replace(/%[sd]/g, spec => { const v = vals[vi++] || ''; return spec === '%d' ? String(parseInt(v)||0) : v; });
    if (!result) return [];
    const lines = result.split('\n'); const out = [];
    for (let i = 0; i < lines.length; i++) { if (i === lines.length - 1 && lines[i] === '') continue; out.push(this.out(lines[i])); }
    return out;
  },

  sleep() { return [this.note('(sleeping...)')]; },

  git(args, argv) {
    if (!args.length) return [this.note('usage: git <command> [<args>]\n\nCommon commands:\n   init       Create an empty Git repository\n   clone      Clone a repository\n   status     Show the working tree status\n   add        Add file contents to the index\n   commit     Record changes to the repository\n   branch     List, create, or delete branches\n   switch     Switch branches\n   merge      Join two development histories\n   push       Update remote refs\n   pull       Fetch and integrate with another repository\n   log        Show commit logs\n   diff       Show changes between commits')];
    const sub = args[0];
    const rest = args.slice(1);
    const line = argv.join(' ');
    const { f, ops } = this.parse(rest);
    switch (sub) {
      case 'init':
        return [this.out('Initialized empty Git repository in ' + this.cwd + '/.git/')];
      case 'clone':
        if (!ops.length) return [this.err('fatal: You must specify a repository to clone.')];
        { const name = ops[1] || ops[0].split('/').pop().replace(/\.git$/, '');
          return [this.out("Cloning into '" + name + "'..."), this.out('done.')]; }
      case 'config': {
        if (f.has('l') || rest.includes('--list'))
          return [this.out('user.name=student'), this.out('user.email=student@example.com'), this.out('core.editor=vim')];
        if (rest.length >= 2) {
          const key = rest.find(a => !a.startsWith('-'));
          const val = rest.filter(a => !a.startsWith('-')).slice(1).join(' ');
          if (val) return [this.note('Config set: ' + key + ' = ' + val)];
          if (key === 'user.name') return [this.out('student')];
          if (key === 'user.email') return [this.out('student@example.com')];
          return [this.out('')];
        }
        return [this.note('usage: git config [--global] <key> [<value>]')]; }
      case 'status':
        return [this.out('On branch main'), this.out('nothing to commit, working tree clean')];
      case 'add':
        if (!ops.length && !rest.includes('.') && !rest.includes('-A') && !rest.includes('--all'))
          return [this.err('Nothing specified, nothing added.')];
        return [this.note('Changes staged for commit.')];
      case 'commit': {
        const hasM = rest.includes('-m') || rest.includes('-am') || rest.some(a => /^-[a-z]*m/.test(a));
        if (hasM) return [this.out('[main abc1234] ' + (rest.filter(a => !a.startsWith('-')).join(' ') || 'commit')),
                          this.out(' 1 file changed, 1 insertion(+)')];
        return [this.note('(editor opens for commit message — type your message, save, and close)')]; }
      case 'branch': {
        if (f.has('d') || f.has('D')) return [this.out('Deleted branch ' + (ops[0]||'branch') + '.')];
        if (ops.length) return [this.note('Branch ' + ops[0] + ' created.')];
        const branches = f.has('a')
          ? ['* main', '  remotes/origin/main']
          : ['* main'];
        return branches.map(b => this.out(b)); }
      case 'switch':
      case 'checkout': {
        const create = f.has('c') || f.has('b');
        const name = ops[0] || 'main';
        if (create) return [this.out("Switched to a new branch '" + name + "'")];
        return [this.out("Switched to branch '" + name + "'")]; }
      case 'merge': {
        if (rest.includes('--abort')) return [this.out('Merge aborted.')];
        if (!ops.length) return [this.err('fatal: No remote for the current branch.')];
        return [this.out('Updating a1b2c3d..e4f5g6h'), this.out('Fast-forward'),
                this.out(' 1 file changed, 1 insertion(+)')]; }
      case 'push': {
        const remote = ops[0] || 'origin';
        const branch = ops[1] || 'main';
        if (rest.includes('--tags'))
          return [this.out('To https://github.com/student/project.git'), this.out(' * [new tag]  v1.0 -> v1.0')];
        return [this.out('Enumerating objects: 5, done.'), this.out('Counting objects: 100% (5/5), done.'),
                this.out('To https://github.com/student/project.git'),
                this.out('   a1b2c3d..e4f5g6h  ' + branch + ' -> ' + branch)]; }
      case 'pull': {
        const remote = ops[0] || 'origin';
        const branch = ops[1] || 'main';
        return [this.out('remote: Enumerating objects: 3, done.'),
                this.out('Updating a1b2c3d..f7g8h9i'), this.out('Fast-forward'),
                this.out(' README.md | 2 ++'), this.out(' 1 file changed, 2 insertions(+)')]; }
      case 'fetch':
        return [this.out('remote: Enumerating objects: 3, done.'),
                this.out('From https://github.com/student/project.git'),
                this.out('   a1b2c3d..f7g8h9i  main -> origin/main')];
      case 'log': {
        if (f.has('n') || rest.some(a => /^-\d+$/.test(a))) {
          const n = parseInt(rest.find(a => /^-\d+$/.test(a))?.slice(1) || '3');
          const hashes = ['e4f5g6h','a1b2c3d','9z8y7x6'];
          const msgs = ['fix login bug','add login page','initial commit'];
          const lines = [];
          for (let i = 0; i < Math.min(n, 3); i++) {
            if (rest.includes('--oneline')) lines.push(this.out(hashes[i] + ' ' + msgs[i]));
            else { lines.push(this.out('commit ' + hashes[i] + '0'.repeat(33)));
                   lines.push(this.out('Author: student <student@example.com>'));
                   lines.push(this.out('Date:   Wed Aug 20 09:31:07 2025'));
                   lines.push(this.out('')); lines.push(this.out('    ' + msgs[i])); lines.push(this.out('')); }
          }
          return lines;
        }
        if (rest.includes('--oneline'))
          return [this.out('e4f5g6h fix login bug'), this.out('a1b2c3d add login page'), this.out('9z8y7x6 initial commit')];
        return [{ t:'app', app:'pager', content:
          'commit e4f5g6h' + '0'.repeat(33) + '\nAuthor: student <student@example.com>\nDate:   Wed Aug 20 09:31:07 2025\n\n    fix login bug\n\n' +
          'commit a1b2c3d' + '0'.repeat(33) + '\nAuthor: student <student@example.com>\nDate:   Tue Aug 19 14:22:01 2025\n\n    add login page\n\n' +
          'commit 9z8y7x6' + '0'.repeat(33) + '\nAuthor: student <student@example.com>\nDate:   Mon Aug 18 10:00:00 2025\n\n    initial commit\n' }]; }
      case 'diff':
        if (rest.includes('--staged') || rest.includes('--cached'))
          return [this.out('diff --git a/app.js b/app.js'), this.out('--- a/app.js'), this.out('+++ b/app.js'),
                  this.out('@@ -1,3 +1,4 @@'), this.out(" const app = require('express')();"),
                  this.out("+const db = require('./db');")];
        return [this.out('diff --git a/README.md b/README.md'), this.out('--- a/README.md'), this.out('+++ b/README.md'),
                this.out('@@ -1 +1,2 @@'), this.out(' # My Project'), this.out('+A sample project.')];
      case 'show':
        return [this.out('commit e4f5g6h' + '0'.repeat(33)), this.out('Author: student <student@example.com>'),
                this.out('Date:   Wed Aug 20 09:31:07 2025'), this.out(''), this.out('    fix login bug'),
                this.out(''), this.out('diff --git a/app.js b/app.js'),
                this.out('+  fixed the bug')];
      case 'stash':
        if (rest[0] === 'pop') return [this.out('On branch main'), this.out('Changes not staged for commit:'),
                                        this.out('  modified: app.js'), this.out('Dropped refs/stash@{0}')];
        if (rest[0] === 'list') return [this.out('stash@{0}: WIP on main: a1b2c3d fix login bug')];
        if (rest[0] === 'apply') return [this.out('On branch main'), this.out('Changes not staged for commit:'),
                                          this.out('  modified: app.js')];
        return [this.out('Saved working directory and index state WIP on main: a1b2c3d fix login bug')];
      case 'tag':
        if (f.has('a')) return [this.note('Tag ' + (ops[0]||'v1.0') + ' created (annotated).')];
        if (ops.length) return [this.note('Tag ' + ops[0] + ' created.')];
        return [this.out('v1.0')];
      case 'remote':
        if (rest[0] === 'add') return [this.note('Remote ' + (rest[1]||'origin') + ' added.')];
        if (f.has('v')) return [this.out('origin  https://github.com/student/project.git (fetch)'),
                                this.out('origin  https://github.com/student/project.git (push)')];
        return [this.out('origin')];
      case 'restore':
        if (rest.includes('--staged')) return [this.note('Unstaged: ' + (ops[0]||'file'))];
        return [this.note('Restored: ' + (ops[0]||'file'))];
      case 'rm':
        if (!ops.length) return [this.err('fatal: No pathspec given.')];
        return [this.out('rm \'' + ops[0] + '\'')];
      case 'mv':
        if (ops.length < 2) return [this.err('fatal: destination required.')];
        return [this.note('Renamed ' + ops[0] + ' -> ' + ops[1])];
      default:
        return [this.err('git: \'' + sub + '\' is not a git command.')];
    }
  }
};
