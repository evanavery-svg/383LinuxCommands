/* =====================================================================
   Missions — real tasks carried out in the simulated shell.
   Each mission is checked against the ACTUAL state of the filesystem,
   so there is more than one right way to solve most of them.
     goal   what the student is asked to do
     check  (sh, last) => true when solved. `last` is the line just typed
     hint   nudge, shown on request or after 3 wrong tries
     teach  item id linked back to the reference card
     mod    course module the mission belongs to (defaults to 1 below)
   ===================================================================== */

const used = (last, re) => re.test((last || '').trim());
/* true when the line carries a real short flag (-l, -la, -ltr) or its long form.
   Written out properly so that -\w*l does not quietly match --classify. */
const flag = (last, short, long) => {
  const toks = (last || '').trim().split(/\s+/).slice(1);
  return toks.some(t => (long && (t === '--' + long || t.startsWith('--' + long + '=')))
                     || (/^-[a-zA-Z]+$/.test(t) && t.slice(1).includes(short)));
};
const cmdIs = (last, name) => new RegExp('^' + name + '(\\s|$)').test((last || '').trim());

const MISSIONS = [
/* ---- tour 1: getting your bearings ---- */
{ id:'m1', tour:'Getting your bearings', goal:'Find out which directory you are standing in.',
  check:(sh,l)=>used(l,/^pwd$/), hint:'Print Working Directory — three letters.', teach:'pwd' },
{ id:'m2', tour:'Getting your bearings', goal:'List the visible contents of your home directory.',
  check:(sh,l)=>used(l,/^ls\b/) && sh.cwd==='/home/student', hint:'Just: ls', teach:'ls' },
{ id:'m3', tour:'Getting your bearings', goal:'Show the hidden dotfiles in your home directory too.',
  check:(sh,l)=>cmdIs(l,'ls') && flag(l,'a','all'), hint:'Add the -a flag to ls.', teach:'ls_a' },
{ id:'m4', tour:'Getting your bearings', goal:'Show a long listing with permissions, owner, size and date.',
  check:(sh,l)=>cmdIs(l,'ls') && flag(l,'l'), hint:'ls -l  (add -a as well if you like).', teach:'ls_l' },
{ id:'m5', tour:'Getting your bearings', goal:'Move into the Documents directory.',
  check:sh=>sh.cwd==='/home/student/Documents', hint:'cd Documents', teach:'cd' },
{ id:'m6', tour:'Getting your bearings', goal:'Go back to the directory you were in before this one.',
  check:(sh,l)=>used(l,/^cd\s+-$/), hint:'A single dash means "back where I came from".', teach:'cd_prev' },
{ id:'m7', tour:'Getting your bearings', goal:'Move up one level to the parent directory.',
  check:(sh,l)=>used(l,/^cd\s+\.\.$/), hint:'Two dots mean "up one".', teach:'cd_up' },
{ id:'m8', tour:'Getting your bearings', goal:'Jump straight home again, without typing any path.',
  check:(sh,l)=>used(l,/^cd$/) && sh.cwd==='/home/student', hint:'cd with nothing after it.', teach:'cd_home' },
{ id:'m9', tour:'Getting your bearings', goal:'List your home directory so file types are marked with / and *.',
  check:(sh,l)=>cmdIs(l,'ls') && flag(l,'F','classify'), hint:'ls -F puts a slash after directories.', teach:'ls_F' },
{ id:'m10', tour:'Getting your bearings', goal:'Sort a long listing by modification time, newest first.',
  check:(sh,l)=>cmdIs(l,'ls') && flag(l,'t'), hint:'ls -lt', teach:'ls_t' },

/* ---- tour 2: reading files ---- */
{ id:'m11', tour:'Reading files', goal:'Print the whole contents of Documents/notes.txt on screen.',
  check:(sh,l)=>used(l,/^cat\s+.*notes\.txt/), hint:'cat Documents/notes.txt', teach:'cat' },
{ id:'m12', tour:'Reading files', goal:'Show only the first 5 lines of Documents/report.txt.',
  check:(sh,l)=>used(l,/^head\s+(-n\s*5|-5)\s+.*report\.txt/), hint:'head -n 5 Documents/report.txt', teach:'head' },
{ id:'m13', tour:'Reading files', goal:'Show only the last 5 lines of Documents/report.txt.',
  check:(sh,l)=>used(l,/^tail\s+(-n\s*5|-5)\s+.*report\.txt/), hint:'tail -n 5 Documents/report.txt', teach:'tail' },
{ id:'m14', tour:'Reading files', goal:'Count the lines, words and bytes in Documents/report.txt.',
  check:(sh,l)=>used(l,/^wc\s+.*report\.txt/), hint:'wc Documents/report.txt', teach:'wc' },
{ id:'m15', tour:'Reading files', goal:'big.log is long. Open it in the pager instead of dumping it.',
  check:(sh,l)=>used(l,/^less\s+.*big\.log/), hint:'less big.log', teach:'less' },
{ id:'m16', tour:'Reading files', goal:'Find out what kind of data Pictures/holiday.jpg really contains.',
  check:(sh,l)=>used(l,/^file\s+.*holiday\.jpg/), hint:'The command is literally called file.', teach:'file' },

/* ---- tour 3: making and breaking ---- */
{ id:'m17', tour:'Making and breaking', goal:'Create a directory called archive in your home directory.',
  check:sh=>{const n=sh.node('/home/student/archive'); return n && n.type==='dir';}, hint:'mkdir archive', teach:'mkdir' },
{ id:'m18', tour:'Making and breaking', goal:'Copy Documents/notes.txt into archive/, showing what happens as it copies.',
  check:(sh,l)=>!!sh.node('/home/student/archive/notes.txt') && cmdIs(l,'cp') && flag(l,'v','verbose'),
  hint:'cp -v Documents/notes.txt archive/', teach:'cp_v' },
{ id:'m19', tour:'Making and breaking', goal:'Copy the whole Documents directory into archive/ — directories need a special flag.',
  check:sh=>!!sh.node('/home/student/archive/Documents/report.txt'), hint:'cp -r Documents archive/', teach:'cp_r' },
{ id:'m20', tour:'Making and breaking', goal:'Rename archive/notes.txt to archive/old-notes.txt.',
  check:sh=>!!sh.node('/home/student/archive/old-notes.txt') && !sh.node('/home/student/archive/notes.txt'),
  hint:'mv archive/notes.txt archive/old-notes.txt — renaming IS moving.', teach:'mv' },
{ id:'m21', tour:'Making and breaking', goal:'Make an empty directory called junk, then delete it with the safe command that only removes empty directories.',
  check:(sh,l)=>used(l,/^rmdir\s+.*junk/) && !sh.node('/home/student/junk'),
  hint:'mkdir junk   then   rmdir junk', teach:'rmdir' },
{ id:'m22', tour:'Making and breaking', goal:'Delete archive/old-notes.txt and have the shell tell you what it removed.',
  check:(sh,l)=>!sh.node('/home/student/archive/old-notes.txt') && cmdIs(l,'rm') && flag(l,'v','verbose'),
  hint:'rm -v archive/old-notes.txt', teach:'rm_v' },
{ id:'m23', tour:'Making and breaking', goal:'Delete the entire archive directory and everything inside it.',
  check:sh=>!sh.node('/home/student/archive'), hint:'rm -r archive   (rmdir refuses: it is not empty)', teach:'rm_r' },
{ id:'m24', tour:'Making and breaking', goal:'Create a symbolic link called mylog that points at /var/log/messages.',
  check:sh=>{const n=sh.node('/home/student/mylog'); return n && n.type==='link';},
  hint:'ln -s /var/log/messages mylog', teach:'ln_s' },

/* ---- tour 4: permissions ---- */
{ id:'m25', tour:'Locking things down', goal:'Show your own user ID, group ID and group memberships.',
  check:(sh,l)=>used(l,/^id\b/), hint:'Two letters.', teach:'id' },
{ id:'m26', tour:'Locking things down', goal:'Make scripts/backup.sh executable for its owner only.',
  check:sh=>{const n=sh.node('/home/student/scripts/backup.sh'); return n && (n.mode & 0o100) && !(n.mode & 0o011);},
  hint:'chmod u+x scripts/backup.sh', teach:'chmod_ux' },
{ id:'m27', tour:'Locking things down', goal:'Set secret.txt to mode 600 using octal numbers: read+write for you, nothing for anybody else.',
  check:sh=>{const n=sh.node('/home/student/secret.txt'); return n && (n.mode & 0o777)===0o600;},
  hint:'6 = 4+2 = rw. chmod 600 secret.txt', teach:'chmod_644' },
{ id:'m28', tour:'Locking things down', goal:'Give scripts/hello.sh mode 755 — rwx for the owner, r-x for everyone else.',
  check:sh=>{const n=sh.node('/home/student/scripts/hello.sh'); return n && (n.mode & 0o777)===0o755;},
  hint:'chmod 755 scripts/hello.sh', teach:'chmod_755' },
{ id:'m29', tour:'Locking things down', goal:'Remove write permission from group and others on Documents/report.txt in one symbolic command.',
  check:sh=>{const n=sh.node('/home/student/Documents/report.txt'); return n && !(n.mode & 0o022);},
  hint:'chmod go-w Documents/report.txt', teach:'chmod_gow' },
{ id:'m30', tour:'Locking things down', goal:'Apply the sticky bit to the /tmp directory.',
  check:sh=>{const n=sh.node('/tmp'); return n && (n.mode & 0o1000);}, hint:'chmod +t /tmp', teach:'chmod_sticky' },
{ id:'m31', tour:'Locking things down', goal:'Recursively give the group write permission on the whole scripts directory.',
  check:sh=>{const d=sh.node('/home/student/scripts'); if(!d)return false;
             return (d.mode & 0o020) && Object.values(d.children).every(c=>c.mode & 0o020);},
  hint:'chmod -R g+w scripts   (or --recursive)', teach:'chmod_R' },
{ id:'m32', tour:'Locking things down', goal:'Change the group of Documents/todo.md to staff.',
  check:sh=>{const n=sh.node('/home/student/Documents/todo.md'); return n && n.group==='staff';},
  hint:'chgrp staff Documents/todo.md   (chown :staff also works)', teach:'chgrp' },
{ id:'m33', tour:'Locking things down', goal:'Give both the owner bob and the group staff to Documents/todo.md in a single chown.',
  check:sh=>{const n=sh.node('/home/student/Documents/todo.md'); return n && n.owner==='bob' && n.group==='staff';},
  hint:'sudo chown bob:staff Documents/todo.md', teach:'chown_both' },
{ id:'m34', tour:'Locking things down', goal:'Display the permission mask used for newly created files.',
  check:(sh,l)=>used(l,/^umask$/), hint:'One word, no arguments.', teach:'umask' },

/* ---- tour 5: processes ---- */
{ id:'m35', tour:'Wrangling processes', goal:'List every process running on the system, in the verbose user-oriented layout.',
  check:(sh,l)=>used(l,/^ps\s+(aux|auxw|axu)\b/), hint:'BSD style — no dash: ps aux', teach:'ps_aux' },
{ id:'m36', tour:'Wrangling processes', goal:'Launch xload in the background so you get your prompt straight back.',
  check:sh=>sh.jobs.some(j=>j.cmd.includes('xload')) || sh.log.some(l=>/xload\s*&$/.test(l)),
  hint:'Put an ampersand at the end: xload &', teach:'amp' },
{ id:'m37', tour:'Wrangling processes', goal:'List the background jobs belonging to this terminal.',
  check:(sh,l)=>used(l,/^jobs$/), hint:'One word: jobs', teach:'jobs' },
{ id:'m38', tour:'Wrangling processes', goal:'Bring job number 1 back into the foreground.',
  check:(sh,l)=>used(l,/^fg\s+%1$/), hint:'fg %1 — the percent sign means "job", not PID.', teach:'fg' },
{ id:'m39', tour:'Wrangling processes', goal:'List every signal your system supports.',
  check:(sh,l)=>used(l,/^kill\s+-l$/), hint:'kill -l  (that is a lowercase L for list).', teach:'kill_l' },
{ id:'m40', tour:'Wrangling processes', goal:'Start xload in the background again, then terminate it with the unignorable KILL signal by job number.',
  check:(sh,l)=>used(l,/^kill\s+-(9|KILL|SIGKILL)\s+%?\d+/), hint:'xload &   then   kill -9 %1', teach:'kill_9' },
{ id:'m41', tour:'Wrangling processes', goal:'Show the parent-child hierarchy of running processes as a tree.',
  check:(sh,l)=>used(l,/^pstree/), hint:'ps + tree.', teach:'pstree' },
{ id:'m42', tour:'Wrangling processes', goal:'Run ./backup.sh from the scripts directory so it survives you logging out.',
  check:(sh,l)=>used(l,/^nohup\b.*backup\.sh/), hint:'nohup scripts/backup.sh &', teach:'nohup' },

/* ---- tour 6: getting help ---- */
{ id:'m43', tour:'Reading the manual', goal:'Ask the shell what kind of thing cd actually is.',
  check:(sh,l)=>used(l,/^type\s+cd$/), hint:'type cd', teach:'type' },
{ id:'m44', tour:'Reading the manual', goal:'Find the full path of the vim executable.',
  check:(sh,l)=>used(l,/^which\s+vim$/), hint:'which vim', teach:'which' },
{ id:'m45', tour:'Reading the manual', goal:'Open the manual page for the ls command.',
  check:(sh,l)=>used(l,/^man\s+ls$/), hint:'man ls  (q gets you out).', teach:'man' },
{ id:'m46', tour:'Reading the manual', goal:'Open the manual page for the passwd FILE FORMAT — section 5, not the command.',
  check:(sh,l)=>used(l,/^man\s+5\s+passwd$/), hint:'The section number goes first: man 5 passwd', teach:'man_sec' },
{ id:'m47', tour:'Reading the manual', goal:'Search all manual descriptions for anything to do with "directory".',
  check:(sh,l)=>used(l,/^(apropos\s+directory|man\s+-k\s+directory)$/), hint:'apropos directory — or man -k directory.', teach:'apropos' },
{ id:'m48', tour:'Reading the manual', goal:'Get the one-line description of the wc command.',
  check:(sh,l)=>used(l,/^whatis\s+wc$/), hint:'whatis wc', teach:'whatis' },
{ id:'m49', tour:'Reading the manual', goal:'List every alias currently defined in this shell.',
  check:(sh,l)=>used(l,/^alias$/), hint:'Just: alias', teach:'alias_list' },
{ id:'m50', tour:'Reading the manual', goal:"Create an alias named la that runs 'ls -A'.",
  check:sh=>sh.aliases.la && /ls\s+-A/.test(sh.aliases.la), hint:"alias la='ls -A'  — no spaces around the = sign.", teach:'alias' },

/* ---- tour 7: environment & packages ---- */
{ id:'m51', tour:'The environment', goal:'Print the path of your home directory by expanding a variable.',
  check:(sh,l)=>used(l,/^echo\s+\$\{?HOME\}?$/), hint:'echo $HOME', teach:'echo_home' },
{ id:'m52', tour:'The environment', goal:'List all of the active environment variables.',
  check:(sh,l)=>used(l,/^env$/), hint:'Three letters.', teach:'env' },
{ id:'m53', tour:'The environment', goal:'Install the vim package on this Fedora system.',
  check:(sh,l)=>used(l,/^sudo\s+dnf\s+install\s+vim$/), hint:'sudo dnf install vim', teach:'dnf_install' },
{ id:'m54', tour:'The environment', goal:'Switch bash command-line editing into Vim mode.',
  check:(sh,l)=>used(l,/^set\s+-o\s+vi$/), hint:'set -o vi', teach:'set_vi' },
{ id:'m55', tour:'The environment', goal:'You accidentally cat-ed a binary and the screen is garbage. Fix the terminal.',
  check:(sh,l)=>used(l,/^reset$/), hint:'One word: reset', teach:'reset' }
];

/* every mission supplied so far belongs to Module 1 — later modules
   should set `mod: <n>` on their own missions */
MISSIONS.forEach(mi => { if (!mi.mod) mi.mod = 1; });

const TOURS = [...new Set(MISSIONS.map(m => m.tour))];
const missionsFor = num => MISSIONS.filter(mi => mi.mod === num);
