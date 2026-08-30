/* =====================================================================
   PATHfinder  —  command curriculum
   ---------------------------------------------------------------------
   Every entry is one "bite". Keep bites small: one idea each.
     id    unique key (used for mastery tracking in localStorage)
     cmd   the literal thing you type (the answer)
     what  plain-English description (one line, self-contained)
     ex    example usage
     out   sample terminal output (optional flavour)
     note  the "chunk" — one extra easy-to-remember fact
     ans   extra accepted answers for type-it-in questions
     kind  'cmd' (default) | 'key' (keystroke) | 'opt' (flag)
     mod   which course module a topic belongs to (see MODULES below)
   ---------------------------------------------------------------------
   The course runs over seven modules. Only Module 1 has been supplied so
   far. To add the next one:
     1. add its categories here with `mod: 2`
     2. flip that module's `ready` flag in MODULES
     3. add its missions in missions.js with `mod: 2`
     4. add a CHANGELOG entry at the top and bump VERSION
   ===================================================================== */

const VERSION = '0.13';
const COPYRIGHT_HOLDER = 'Avery LLC';

/* Newest first. This is the single source of truth for the in-app
   changelog; CHANGELOG.md mirrors it. */
const CHANGELOG = [
  { version:'0.13', date:'2026-08-30', title:'Lab 01 — a simulated lab assignment',
    notes:[
      'New: Lab 01, an 18-mission guided lab inside the terminal. Fix a broken script, edit config files with grep and sed, build pipelines with pipes, redirect output to files, and use command substitution.',
      'New shell features: pipes (cmd | cmd), output redirection (cmd > file), command substitution ($(cmd)), and script execution (./script.sh).',
      'New commands: grep (pattern search with -i, -n, -c, -v), sed (stream editing with s/old/new/ and -i), printf (formatted output with %s, %d), and sleep.',
      '6 new build-the-command challenges for the Lab 01 topic.',
      'New Lab 01 topic added to the Module 1 curriculum.'
    ] },
  { version:'0.12', date:'2026-08-27', title:'Sync your progress to another device',
    notes:[
      'New: Sync to another device. One tap generates a link that carries your entire save — compressed, encoded, and tucked into the URL fragment so nothing hits the server. Open the link on your phone, laptop or any other browser and choose Replace or Merge.',
      'Merge keeps the best of both sides: the higher XP, the better scores, the union of badges and missions, and the stronger mastery box for every command.',
      'On a phone the link opens the native share sheet (AirDrop, Messages, etc.); on desktop it copies to the clipboard.',
      'New: Download save file and Load from file replace the old clipboard-only export and import. Your save downloads as a timestamped .json file you can keep anywhere.',
      'A Download backup button is now in Settings too, alongside Copy a backup.'
    ] },
  { version:'0.11', date:'2026-08-24', title:'Every set now opens with a briefing',
    notes:[
      'New: a briefing before every set. It names the commands you are about to meet and what each one does, so you see the shape before the detail instead of meeting them cold, one card at a time.',
      'New on every briefing: “When you would actually use this” — a worked terminal transcript per lesson. Not what the command means, but the moment you would reach for it: the log has rolled, the script will not run, the port changed in forty places.',
      'Every one of the 221 entries now has an example. The 98 that had none were filled in: real commands with realistic output, and for the 83 keystrokes a before → press → after demo, which is what an example means for a keystroke.',
      'The one-line idea written for each of the 32 lessons is finally shown — it had been sitting unused in the course file since the first release.',
      'Briefings can be switched off in ⚙ settings if you would rather go straight to the cards.',
      'Note: the scenarios and examples were written for this app, not by your instructor — check anything that matters against your course notes.'
    ] },
  { version:'0.10', date:'2026-08-24', title:'Hints when you are stuck on a typed answer',
    notes:[
      'New: a 💡 Hint button on the questions you type from a blank prompt — both "type the command that…" and Build the command. Two tiers: first the topic it came from and the shape of the answer (ls -ltr shows as "ls -···"), then the Remember note from its card.',
      'Hints are honest about the cost: taking one marks that question as a miss, and the button says so before you press it. Type it right afterwards and you still get a ✓ — it just goes back in the deck to come round again.',
      'The mock exam has no hints, on purpose. That is what exam conditions are.',
      'The boot screen now carries the version and © Avery LLC, bottom right, the way a BIOS screen does.'
    ] },
  { version:'0.9', date:'2026-08-24', title:'A whole-topic round at the end of every topic',
    notes:[
      'New: the ★ bonus round. Clear every set in a topic and one more step opens at the end of that row — every command in the topic in a single sitting, not three at a time.',
      'It really is all of them: 23 questions for Navigation & Listing, 42 for Permissions & Users, 48 for Processes & Jobs, 71 for Vim. Each topic\'s build-the-command challenges are folded in too.',
      'It is a bonus, so it does not count toward "5/5 sets" and never changes the topic percentage. The review keeps its own best score on its own bubble.',
      'Long rounds survive you: switch tabs or press Esc mid-review and the attempt is parked, with the bubble offering to resume where you left off. Quitting with ✕ asks first.',
      'New badge — Full sweep, for scoring 100% on a whole-topic review.'
    ] },
  { version:'0.8', date:'2026-08-20', title:'Build the command, and sit a mock exam',
    notes:[
      'New: Build the command. You are given a goal and write the whole line — flags, paths and all. Marked on what the command actually does, not on its text, so any line that gets there counts.',
      '36 build challenges across Module 1, each crediting every command it exercises.',
      'New: Mock exam. A timed paper, typed answers only, no multiple choice, no hints and no feedback until you hand it in. Skip a question and it comes back at the end.',
      'The report grades you, ranks your topics worst-first, lists every miss with what you wrote, and drills them in one click. Past papers are kept so you can watch the score climb.'
    ] },
  { version:'0.7', date:'2026-08-20', title:'Finish a topic and it actually says 100%',
    notes:[
      'The percentage on a topic is now the average of your set scores, so finishing every set at 100% reads 100%. It used to show spaced-repetition depth, which needs each card right on five separate days and could never reach 100% just by finishing.',
      'The module header shows that same score instead of "mastered", and the home module list agrees with both.',
      'The old depth figure is still there, on the Progress tab, now called Retention with a note explaining what it means and why it fills slowly.',
      'The Halfway and Module mastered badges now track score, so they are winnable.'
    ] },
  { version:'0.6', date:'2026-08-20', title:'Now called PATHfinder, and Enter behaves',
    notes:[
      'Renamed from sudo LEARN to PATHfinder \u2014 a $PATH pun, and the course is already laid out as a path of steps. Your progress carries over automatically.',
      'Fixed: pressing Enter could skip straight past a card you had not typed yet. A second Enter during the brief pause after a correct answer advanced twice \u2014 once from the button, once from the timer.',
      'Holding Enter down no longer fires over and over.',
      'Enter now works on the results screen too: finish a set and press Enter to go straight into the next one.'
    ] },
  { version:'0.5', date:'2026-08-20', title:'Built for a phone as well as a desktop',
    notes:[
      'Typing no longer zooms the page on iPhone \u2014 every input is 16px on touch, with autocorrect and autocapitalise off and a Go key on the keyboard.',
      'Tapped cards no longer stick in a hover state, and every button, tab and chip is now a proper thumb-sized target.',
      'The tab bar is one sideways-scrolling row instead of wrapping to two, and the title bar collapses to a single settings gear \u2014 bite size and theme live in Settings.',
      'The learn card keeps its Got it button pinned within thumb reach at the bottom of the screen.',
      'Terminal on a phone: the mission goal comes first, the 55-mission list collapses behind a toggle, and a row of shortcut keys (- / ~ . * $ | > & % + :) sits above the keyboard.',
      'Fixed: the terminal column ran about 200px past the screen edge and was being silently clipped.',
      'Add it to your home screen \u2014 it installs with an icon and opens fullscreen, with the status bar tinted to match your theme.'
    ] },
  { version:'0.4', date:'2026-08-20', title:'Set scores on the path, and a wipe button',
    notes:[
      'Finished sets show your score on the path instead of a tick \u2014 100% fills the circle in, 50-99% outlines it, below 50% turns it amber.',
      'Scores keep your best result, so retrying a set can only push it up. The results screen tells you what the set currently reads.',
      'Settings has a Your progress section with a wipe button, which asks to confirm and offers a backup first. Themes and settings survive a wipe.'
    ] },
  { version:'0.3', date:'2026-08-20', title:'Type every command as you learn it',
    notes:[
      'Every learning card now has a prompt of its own \u2014 you type the command out before moving on. Enter checks it, and a correct answer is worth 3 XP.',
      'Get it wrong and it says so; get it wrong twice and it shows you the exact text to copy.',
      'There is a "skip typing this one" link if you would rather just read.',
      'Results screen now offers Retry all as well as Retry just the missed ones.',
      'Fixed: pressing Enter could advance two cards at once and skip one.'
    ] },
  { version:'0.2', date:'2026-08-20', title:'Bite-sized path, calmer home page',
    notes:[
      'Home page is now just the module list. All the detail moved to the module\u2019s own page, one click in.',
      'New Learn path: every set is a numbered step grouped by topic, with the next one always highlighted.',
      'Topics unlock in turn, so there is always one obvious thing to do next (Settings has a free-roam switch).',
      'Default set size dropped to 3 cards, and 2 is now an option.',
      'Set completion is tracked per card, so changing the bite size no longer wipes your ticks.',
      '15 badges to unlock, a combo bonus for correct answers in a row, and a daily XP goal ring.',
      'Learning cards stripped back to one command, one plain sentence, one example, one memory hook.'
    ] },
  { version:'0.1', date:'2026-08-20', title:'First release — Module 1',
    notes:[
      'Module 1 in full: 9 topics, 32 lessons, 221 commands, flags and keystrokes.',
      'Learn mode with adjustable bite-sized card sets (3 / 5 / 8) and a quick check after each set.',
      'Drill mode: multiple choice for new commands, type-from-memory once they stick.',
      'Leitner spaced repetition for commands that are starting to fade.',
      'Terminal mode: simulated Fedora box with a virtual filesystem, plus 55 missions.',
      'Searchable reference of every entry, and a progress screen with XP, ranks, streak and heatmap.',
      'Six themes with optional CRT scanlines; works down to phone width.'
    ] }
];

/* The seven modules of the course. Modules 2-7 are placeholders until
   their command lists are added. */
const MODULES = [
  { num:1, name:'Linux Fundamentals', ready:true,
    blurb:'Navigation, file handling, viewing files, permissions and users, processes and jobs, help systems, packages, Vim and bash editing modes.' },
  { num:2, name:'', ready:false, blurb:'Not added yet — this module\u2019s command list has not been supplied.' },
  { num:3, name:'', ready:false, blurb:'Not added yet — this module\u2019s command list has not been supplied.' },
  { num:4, name:'', ready:false, blurb:'Not added yet — this module\u2019s command list has not been supplied.' },
  { num:5, name:'', ready:false, blurb:'Not added yet — this module\u2019s command list has not been supplied.' },
  { num:6, name:'', ready:false, blurb:'Not added yet — this module\u2019s command list has not been supplied.' },
  { num:7, name:'', ready:false, blurb:'Not added yet — this module\u2019s command list has not been supplied.' }
];

const CURRICULUM = [
{
  mod: 1, id: 'nav', name: 'Navigation & Listing', icon: '🧭',
  blurb: 'Knowing where you are, moving around, and seeing what is there.',
  lessons: [
    {
      id: 'nav1', title: 'Where am I & how do I move?',
      brief: 'The filesystem is a tree. <b>pwd</b> tells you which branch you are standing on, <b>cd</b> moves you.',
      use: {
        scene: "You have just logged into a server and you are not sure where the shell put you.",
        lines: [{ c:"pwd", o:"/home/student" },
               { c:"cd /var/log" },
               { c:"pwd", o:"/var/log" },
               { c:"cd -", o:"/home/student" }],
        point: "cd - is the undo of moving around: it bounces you between the last two places you stood. cd on its own always takes you home."
      },
      items: [
        { id:'pwd', cmd:'pwd', what:'prints the absolute path of the directory you are currently in',
          ex:'pwd', out:'/home/student/projects', note:'Think "Print Working Directory". It never changes anything — it only reports.' },
        { id:'cd', cmd:'cd', what:'changes the current working directory to a given path',
          ex:'cd /var/log', note:'"Change Directory". It is a shell builtin, not a program on disk.' },
        { id:'cd_home', cmd:'cd', what:'jumps straight to your home directory when given no arguments',
          ex:'cd', out:'', ans:['cd','cd ~'], note:'Naked cd = go home. cd ~ does the same thing.' },
        { id:'cd_prev', cmd:'cd -', what:'returns you to the previous working directory you were in',
          ex:'cd -', out:'/home/student/projects', note:'The dash means "back". Press it twice and you are where you started.' },
        { id:'cd_user', cmd:'cd ~user_name', what:'changes to the home directory of a named user',
          ex:'cd ~bob', ans:['cd ~user_name','cd ~username','cd ~user','cd ~bob'], note:'~ alone = my home. ~bob = bob’s home.' },
        { id:'cd_up', cmd:'cd ..', what:'moves up one level to the parent directory',
          ex:'cd ..', note:'One dot . = here. Two dots .. = up one. cd ../.. climbs two levels.' }
      ]
    },
    {
      id: 'nav2', title: 'ls — the basics',
      brief: '<b>ls</b> lists what is in a directory. Its options are the most-used flags in all of Linux.',
      use: {
        scene: "A config file is missing from a project folder — but files starting with a dot are hidden, so a plain ls will not show it.",
        lines: [{ c:"ls", o:"notes.txt  report.txt  src" },
               { c:"ls -a", o:".  ..  .env  notes.txt  report.txt  src" },
               { c:"ls -l .env", o:"-rw-------. 1 student student 84 Aug 24 09:03 .env" }],
        point: "It was there all along. ls hides anything beginning with a dot until you ask with -a, and -l is what shows you the permissions and the size."
      },
      items: [
        { id:'ls', cmd:'ls', what:'lists the contents of a directory',
          ex:'ls', out:'Desktop  Documents  notes.txt  scripts', note:'With no path it lists where you are standing.' },
        { id:'ls_a', cmd:'ls -a', what:'lists all files including hidden dotfiles', ex:'ls -a',
          out:'.  ..  .bashrc  .config  Desktop  notes.txt', ans:['ls -a','ls --all'], kind:'opt',
          note:'-a = --all. A file is "hidden" only because its name starts with a dot.' },
        { id:'ls_A', cmd:'ls -A', what:'lists all files except the . and .. entries', ex:'ls -A',
          out:'.bashrc  .config  Desktop  notes.txt', ans:['ls -A','ls --almost-all'], kind:'opt',
          note:'-A = --almost-all. Same as -a minus the two useless dots.' },
        { id:'ls_l', cmd:'ls -l', what:'shows a detailed long listing: permissions, links, owner, group, size, date',
          ex:'ls -l', out:'-rw-r--r-- 1 student student  1204 Aug 20 09:31 notes.txt', kind:'opt',
          note:'Long format is the one you will read all semester. Memorise its 7 columns.' },
        { id:'ls_d', cmd:'ls -ld', what:'shows details about the directory itself instead of its contents',
          ex:'ls -ld /etc', out:'drwxr-xr-x 132 root root 12288 Aug 20 08:02 /etc',
          ans:['ls -ld','ls -d','ls --directory','ls -l -d','ls -dl'], kind:'opt',
          note:'-d = --directory. Almost always paired with -l, otherwise it just prints the name.' },
        { id:'ls_F', cmd:'ls -F', what:'appends a type indicator character to each name, such as / for directories',
          ex:'ls -F', out:'Desktop/  notes.txt  backup@  run.sh*', ans:['ls -F','ls --classify'], kind:'opt',
          note:'/ directory, * executable, @ symlink. -F = --classify.' }
      ]
    },
    {
      id: 'nav3', title: 'ls — sorting & readability',
      brief: 'Same command, different lens. These flags change the <i>order</i> and the <i>units</i>.',
      use: {
        scene: "A job failed a few minutes ago and you need the newest file in /var/log.",
        lines: [{ c:"cd /var/log" },
               { c:"ls -ltr", o:"-rw-r--r--. 1 root root  84210 Aug 23 11:02 dnf.log\n-rw-r--r--. 1 root root   1203 Aug 24 09:14 messages" }],
        point: "ls -ltr is the most-typed ls there is: long, sorted by time, reversed — so the newest file lands at the bottom, right above your prompt where you are already looking."
      },
      items: [
        { id:'ls_h', cmd:'ls -lh', what:'shows file sizes in human-readable units like K, M and G',
          ex:'ls -lh', out:'-rw-r--r-- 1 student student 1.2K Aug 20 09:31 notes.txt',
          ans:['ls -lh','ls -h','ls --human-readable','ls -l -h','ls -hl'], kind:'opt',
          note:'-h only matters with -l, because only long format prints sizes.' },
        { id:'ls_r', cmd:'ls -r', what:'reverses the order of the listing',
          ex:'ls -r', ans:['ls -r','ls --reverse'], kind:'opt',
          note:'-r = --reverse. It reverses whatever sort is active, not just alphabetical.' },
        { id:'ls_S', cmd:'ls -S', what:'sorts the listing by file size, largest first',
          ex:'ls -lS', ans:['ls -S','ls -lS','ls -Sl'], kind:'opt', note:'Capital S = Size. Add -r to put the biggest last.' },
        { id:'ls_t', cmd:'ls -t', what:'sorts the listing by modification time, newest first',
          ex:'ls -lt', ans:['ls -t','ls -lt','ls -tl'], kind:'opt',
          note:'t = time. "ls -ltr" (time, reversed) puts the newest file at the bottom — a classic combo.' },
        { id:'ls_revlong', cmd:'ls --reverse', what:'is the long-option spelling that reverses the sort order',
          ex:'ls -lt --reverse', ans:['ls --reverse','--reverse','ls -r'], kind:'opt',
          note:'Short options use one dash (-r); long options use two (--reverse).' }
      ]
    }
  ]
},
{
  mod: 1, id: 'files', name: 'Files & Directories', icon: '🗂️',
  blurb: 'Copying, moving, creating, deleting and linking. The commands that actually change things.',
  lessons: [
    {
      id:'files1', title:'cp — copying',
      brief:'Pattern to memorise: <b>cp SOURCE DESTINATION</b>. Source first, always.',
      use: {
        scene: "Before you edit a config you cannot afford to break, take a copy of it.",
        lines: [{ c:"cp -i sshd_config sshd_config.bak" },
               { c:"ls", o:"sshd_config  sshd_config.bak" },
               { c:"cp -r ~/project /backup/" }],
        point: "Source first, destination second — always. -r is what lets you copy a whole directory; without it cp refuses and says “omitting directory”. -i asks before it would overwrite something."
      },
      items:[
        { id:'cp', cmd:'cp', what:'copies files and directories',
          ex:'cp notes.txt backup.txt', note:'cp file1 file2 duplicates. cp file1 file2 dir/ drops both into dir.' },
        { id:'cp_a', cmd:'cp -a', what:'copies preserving every attribute including ownership and permissions',
          ex:'cp -a /home/student /backup/', ans:['cp -a','cp --archive'], kind:'opt',
          note:'a = archive. This is the flag for real backups; a plain cp resets ownership to you.' },
        { id:'cp_i', cmd:'cp -i', what:'prompts you for confirmation before overwriting an existing file',
          ex:'cp -i a.txt b.txt', out:"cp: overwrite 'b.txt'? y", ans:['cp -i','cp --interactive'], kind:'opt',
          note:'i = interactive. Without it, cp overwrites silently and the old file is gone.' },
        { id:'cp_r', cmd:'cp -r', what:'copies a directory and everything inside it, recursively',
          ex:'cp -r projects/ /backup/', ans:['cp -r','cp -R','cp --recursive'], kind:'opt',
          note:'Copying a directory WITHOUT -r fails. cp refuses and says "omitting directory".' },
        { id:'cp_u', cmd:'cp -u', what:'copies only files that are missing at the destination or newer than the copy there',
          ex:'cp -u *.txt /backup/', ans:['cp -u','cp --update'], kind:'opt',
          note:'u = update. Great for re-running a big copy without redoing work.' },
        { id:'cp_v', cmd:'cp -v', what:'prints a progress message for each file as it is copied',
          ex:'cp -v a.txt /tmp/', out:"'a.txt' -> '/tmp/a.txt'", ans:['cp -v','cp --verbose'], kind:'opt',
          note:'v = verbose. cp, mv and rm all share this flag.' }
      ]
    },
    {
      id:'files2', title:'mv — moving & renaming',
      brief:'In Linux, renaming and moving are the <i>same operation</i>. mv does both.',
      use: {
        scene: "You misnamed a file this morning and now you want it filed properly.",
        lines: [{ c:"ls", o:"archive  reprot.txt" },
               { c:"mv -i reprot.txt report.txt" },
               { c:"mv -v report.txt archive/", o:"renamed 'report.txt' -> 'archive/report.txt'" }],
        point: "Renaming and moving are the same operation — you are only changing the path. -i asks first if the destination already exists, which is the one that saves you."
      },
      items:[
        { id:'mv', cmd:'mv', what:'moves or renames files and directories',
          ex:'mv draft.txt final.txt', note:'mv within one directory = rename. mv into another directory = move.' },
        { id:'mv_i', cmd:'mv -i', what:'prompts before overwriting an existing file during a move',
          ex:'mv -i a.txt b.txt', ans:['mv -i','mv --interactive'], kind:'opt', note:'Same i as cp -i and rm -i. One letter, three commands.' },
        { id:'mv_u', cmd:'mv -u', what:'moves only files that are missing or newer than the destination copy',
          ex:'mv -u *.log /var/log/', ans:['mv -u','mv --update'], kind:'opt', note:'u = update, exactly like cp -u.' },
        { id:'mv_v', cmd:'mv -v', what:'prints a message for each item as it is moved',
          ex:'mv -v a.txt /tmp/', out:"renamed 'a.txt' -> '/tmp/a.txt'", ans:['mv -v','mv --verbose'], kind:'opt', note:'v = verbose. Handy when moving with wildcards.' }
      ]
    },
    {
      id:'files3', title:'mkdir, rmdir & rm',
      brief:'Making things is safe. Removing things is <b>permanent</b> — there is no recycle bin.',
      use: {
        scene: "Setting up a scratch folder, then clearing it away when you are done with it.",
        lines: [{ c:"mkdir scratch" },
               { c:"rm -i scratch/notes.txt", o:"rm: remove regular file 'scratch/notes.txt'? y" },
               { c:"rmdir scratch" },
               { c:"rm -r old-project/" }],
        point: "rmdir only removes an EMPTY directory, and that refusal is the whole point of it. rm -r removes a full one — and there is no recycle bin, so -i is worth the extra keystroke."
      },
      items:[
        { id:'mkdir', cmd:'mkdir', what:'creates one or more new directories',
          ex:'mkdir reports archive', note:'Takes many names at once. mkdir -p a/b/c makes the whole chain.' },
        { id:'rmdir', cmd:'rmdir', what:'deletes a directory only if it is completely empty',
          ex:'rmdir oldstuff', note:'Refuses on a non-empty directory — which makes it the SAFE delete.' },
        { id:'rm', cmd:'rm', what:'removes (deletes) files',
          ex:'rm notes.txt', note:'There is no undo and no trash can. What rm removes is gone.' },
        { id:'rm_i', cmd:'rm -i', what:'asks you to confirm before deleting each file',
          ex:'rm -i *.log', out:"rm: remove regular file 'a.log'? y", ans:['rm -i','rm --interactive'], kind:'opt',
          note:'Train yourself to type rm -i by default.' },
        { id:'rm_r', cmd:'rm -r', what:'recursively deletes a directory and everything inside it',
          ex:'rm -r oldproject/', ans:['rm -r','rm -R','rm --recursive'], kind:'opt',
          note:'Needed for directories. "rm -rf /" is the infamous system-destroying typo — respect it.' },
        { id:'rm_f', cmd:'rm -f', what:'forces deletion, ignoring missing files and skipping all prompts',
          ex:'rm -f nothere.txt', ans:['rm -f','rm --force'], kind:'opt', note:'f = force. It cancels out -i, so -f wins over safety.' },
        { id:'rm_v', cmd:'rm -v', what:'prints a message for each file as it is deleted',
          ex:'rm -v a.txt', out:"removed 'a.txt'", ans:['rm -v','rm --verbose'], kind:'opt', note:'Use -v with -r so you can watch what disappears.' }
      ]
    },
    {
      id:'files4', title:'ln — links',
      brief:'A hard link is another <i>name</i> for the same data. A symbolic link is a signpost pointing at a path.',
      use: {
        scene: "A script hard-codes /opt/app/current, but the real release lives in a versioned folder that changes every deploy.",
        lines: [{ c:"ln -s /opt/app/v2.4.1 /opt/app/current" },
               { c:"ls -l /opt/app/current", o:"lrwxrwxrwx. 1 root root 16 Aug 24 09:12 /opt/app/current -> /opt/app/v2.4.1" }],
        point: "The l at the front of the mode and the arrow give a symlink away. Point it at v2.4.2 tomorrow and every script that says /opt/app/current follows, unchanged."
      },
      items:[
        { id:'ln', cmd:'ln file link', what:'creates a hard link — a second name pointing at the same file data',
          ex:'ln report.txt report-hard', ans:['ln file link','ln'], note:'Delete the original and a hard link still works: the data survives until the last name is gone.' },
        { id:'ln_s', cmd:'ln -s item link', what:'creates a symbolic (soft) link that points at a path',
          ex:'ln -s /var/log/syslog mylog', ans:['ln -s item link','ln -s','ln --symbolic'], kind:'opt',
          note:'s = symbolic. Symlinks can cross filesystems and can point at directories; hard links cannot. Delete the target and the symlink "dangles".' }
      ]
    }
  ]
},
{
  mod: 1, id:'view', name:'Viewing & Inspecting Files', icon:'👁️',
  blurb:'Reading file contents without opening an editor.',
  lessons:[
    {
      id:'view1', title:'Reading files',
      brief:'Small file? <b>cat</b>. Big file? <b>less</b>. Just the ends? <b>head</b> / <b>tail</b>.',
      use: {
        scene: "A 40,000-line log file. You want the end of it, not all of it.",
        lines: [{ c:"wc -l app.log", o:"41883 app.log" },
               { c:"tail app.log", o:"09:14:07 ERROR connection refused (attempt 12)" },
               { c:"file app.log", o:"app.log: ASCII text" }],
        point: "Check what you are dealing with before you cat it. cat on a huge file floods the screen, and cat on a BINARY file fills your terminal with garbage — which is exactly what reset is for."
      },
      items:[
        { id:'cat', cmd:'cat', what:'concatenates and dumps the entire contents of a file to the screen',
          ex:'cat notes.txt', note:'cat = conCATenate. cat a.txt b.txt prints both, joined together.' },
        { id:'less', cmd:'less', what:'is a pager that lets you scroll through a text file one screen at a time',
          ex:'less /etc/passwd', note:'The saying is "less is more" — less replaced the older pager called more.' },
        { id:'head', cmd:'head', what:'shows the first lines at the beginning of a file',
          ex:'head -n 5 access.log', note:'Defaults to 10 lines. -n changes the count.' },
        { id:'tail', cmd:'tail', what:'shows the last lines at the end of a file',
          ex:'tail -n 20 /var/log/messages', note:'Defaults to 10 lines. tail -f follows a log live as it grows.' },
        { id:'file', cmd:'file', what:'inspects a file and reports what type of data it actually contains',
          ex:'file /bin/ls', out:'/bin/ls: ELF 64-bit LSB pie executable, x86-64', note:'Linux does not trust extensions. file reads the contents to decide.' },
        { id:'wc', cmd:'wc', what:'counts the lines, words and bytes in a file',
          ex:'wc notes.txt', out:'  42  318  1204 notes.txt', note:'Word Count. Columns are lines, words, bytes — in that order. wc -l gives lines only.' },
        { id:'reset', cmd:'reset', what:'restores a terminal whose display got scrambled, such as after cat-ing a binary file',
          ex:'reset', note:'If your prompt turns into garbage characters, type reset blindly and press Enter.' }
      ]
    },
    {
      id:'view2', title:'Living inside less',
      brief:'less is its own little program with its own keys. These same keys work in <b>man</b> pages.',
      use: {
        scene: "You opened a long log in less and you need every mention of the word timeout.",
        lines: [{ c:"less /var/log/app.log" },
               { o:"/timeout    search forwards for “timeout”" },
               { o:"n           jump to the next match" },
               { o:"G           leap to the end of the file" },
               { o:"1G          back to the top" },
               { o:"q           quit, back to the shell" }],
        point: "less does not load the whole file, so it opens instantly however big it is. These are the same keys man uses — learn them once and you can read every manual page too."
      },
      items:[
        { id:'less_fwd', cmd:'Space', what:'scrolls forward one full page inside less', kind:'key',
          ans:['space','spacebar','page down','pagedown','space / page down'], note:'Space or Page Down — forward one screen.' ,
          demo:{ where:"in less, at the top of a 900-line log", before:"lines 1–40 filling the screen",
        keys:"Space", after:"lines 41–80 filling the screen" } },
        { id:'less_back', cmd:'b', what:'scrolls back one full page inside less', kind:'key',
          ans:['b','page up','pageup','b / page up'], note:'b = back. Page Up does the same thing.' ,
          demo:{ where:"in less, having paged down too far", before:"lines 41–80 on screen",
        keys:"b", after:"lines 1–40 on screen" } },
        { id:'less_line', cmd:'Down Arrow', what:'scrolls down a single line inside less', kind:'key',
          ans:['down arrow','down','downarrow','j'], note:'Up Arrow scrolls up one line, Down Arrow scrolls down one line.' ,
          demo:{ where:"in less, easing down slowly", before:"lines 1–40 on screen",
        keys:"↓", after:"lines 2–41 on screen" } },
        { id:'less_G', cmd:'G', what:'jumps to the end of the file inside less', kind:'key',
          ans:['g'], note:'Capital G = Go to the bottom. Same key as in Vim.' ,
          demo:{ where:"in less, anywhere in the file", before:"line 1 of 900",
        keys:"G", after:"line 900 of 900 — the end" } },
        { id:'less_1G', cmd:'1G', what:'jumps back to the start of the file inside less', kind:'key',
          ans:['1g','g','1G / g'], note:'1G means "go to line 1". Lowercase g does it too.' ,
          demo:{ where:"in less, down at the bottom", before:"line 900 of 900",
        keys:"1G", after:"line 1 of 900 — back at the top" } },
        { id:'less_search', cmd:'/characters', what:'searches forward for text inside less', kind:'key',
          ans:['/characters','/','/pattern','/text'], note:'Type / then your text and press Enter.' ,
          demo:{ where:"in less, hunting for a word", before:"somewhere in a 900-line log",
        keys:"/timeout", after:"cursor on the next line containing “timeout”" } },
        { id:'less_n', cmd:'n', what:'repeats the last search and jumps to the next match inside less', kind:'key',
          note:'n = next. Same key as Vim search.' ,
          demo:{ where:"in less, after a /timeout search", before:"sitting on the first match",
        keys:"n", after:"sitting on the second match" } },
        { id:'less_h', cmd:'h', what:'opens the built-in help screen inside less', kind:'key', note:'h = help. Press q to leave the help screen.' ,
          demo:{ where:"in less, and you have forgotten a key", before:"your log on screen",
        keys:"h", after:"less's own key summary on screen" } },
        { id:'less_q', cmd:'q', what:'quits less and returns you to the shell', kind:'key',
          note:'q = quit. If you are ever stuck inside a pager, press q.' ,
          demo:{ where:"in less, finished reading", before:"your log on screen",
        keys:"q", after:"$   ← back at the shell prompt" } }
      ]
    }
  ]
},
{
  mod: 1, id:'perms', name:'Permissions & Users', icon:'🔐',
  blurb:'Who owns a file, who may read it, and how to become someone else.',
  lessons:[
    {
      id:'perms1', title:'Identity & the octal numbers',
      brief:'Permissions are just three numbers added together: <b>r=4, w=2, x=1</b>.',
      use: {
        scene: "A script you just wrote will not run: bash says “Permission denied”.",
        lines: [{ c:"ls -l deploy.sh", o:"-rw-r--r--. 1 student student 312 Aug 24 09:20 deploy.sh" },
               { c:"chmod 755 deploy.sh" },
               { c:"ls -l deploy.sh", o:"-rwxr-xr-x. 1 student student 312 Aug 24 09:20 deploy.sh" }],
        point: "r=4, w=2, x=1, added up per column: you, your group, everyone else. 7 = 4+2+1, 5 = 4+1. 755 is the standard for anything you run, 644 for a plain file you only read and write."
      },
      items:[
        { id:'id', cmd:'id', what:'displays your user identity: UID, GID and group memberships',
          ex:'id', out:'uid=1000(student) gid=1000(student) groups=1000(student),27(sudo)', note:'Run it on yourself, or "id bob" to inspect another user.' },
        { id:'chmod', cmd:'chmod', what:'changes the access permissions (mode) of a file or directory',
          ex:'chmod 644 notes.txt', note:'chmod = CHange MODe. It takes octal numbers or symbolic letters.' },
        { id:'oct_r', cmd:'4', what:'is the octal value of the read permission', kind:'opt',
          ans:['4','r=4'], note:'r = 4. Read.' ,
          ex:'chmod 444 notes.txt', out:'# -r--r--r--   4 on its own is read, and nothing else' },
        { id:'oct_w', cmd:'2', what:'is the octal value of the write permission', kind:'opt',
          ans:['2','w=2'], note:'w = 2. Write.' ,
          ex:'chmod 222 scratch.txt', out:'# --w--w--w-   2 on its own is write, and nothing else' },
        { id:'oct_x', cmd:'1', what:'is the octal value of the execute permission', kind:'opt',
          ans:['1','x=1'], note:'x = 1. Execute. 4+2+1 = 7 = rwx.' ,
          ex:'chmod 111 runme', out:'# ---x--x--x   1 on its own is execute, and nothing else' },
        { id:'chmod_755', cmd:'chmod 755', what:'gives the owner rwx and gives group and others r-x',
          ex:'chmod 755 script.sh', ans:['chmod 755','755'], note:'7=rwx, 5=r-x (4+1). The classic mode for a program or a directory.' },
        { id:'chmod_644', cmd:'chmod 644', what:'gives the owner read and write, and everyone else read only',
          ex:'chmod 644 notes.txt', ans:['chmod 644','644'], note:'6=rw- (4+2), 4=r--. The classic mode for a plain data file.' },
        { id:'umask', cmd:'umask', what:'displays or sets the permission mask applied to newly created files',
          ex:'umask', out:'0022', note:'It MASKS OUT bits. 022 removes write from group and others, so new files land as 644.' }
      ]
    },
    {
      id:'perms2', title:'Symbolic chmod & special bits',
      brief:'Symbolic form reads like a sentence: <b>who</b> + <b>operator</b> + <b>permission</b>.',
      use: {
        scene: "The same fix, but you want to add only the execute bit and leave the rest exactly as it is.",
        lines: [{ c:"chmod u+x deploy.sh" },
               { c:"ls -l deploy.sh", o:"-rwxr--r--. 1 student student 312 Aug 24 09:20 deploy.sh" },
               { c:"chmod go-w notes.txt" }],
        point: "Octal replaces all nine bits at once; symbolic edits only the ones you name. u+x is the safer choice when you do not already know what the other bits are set to."
      },
      items:[
        { id:'sym_who', cmd:'u g o a', what:'are the "who" letters in symbolic chmod: user, group, others, all', kind:'opt',
          ans:['u g o a','ugoa','u,g,o,a'], note:'u = the owner, g = the group, o = everyone else, a = all three at once.' ,
          ex:'chmod go-rwx private.txt', out:'# -rw-------   g and o lose everything; u is left alone' },
        { id:'sym_ops', cmd:'+ - =', what:'are the symbolic chmod operators that add, remove, or set permissions exactly', kind:'opt',
          ans:['+ - =','+-=','+,-,='], note:'+ adds, - removes, = sets exactly and wipes whatever was there.' ,
          ex:'chmod u+x,g-w,o=r script.sh', out:'# -rwxr--r--   + adds, - removes, = sets exactly' },
        { id:'chmod_ux', cmd:'chmod u+x', what:'adds execute permission for the file owner only',
          ex:'chmod u+x script.sh', ans:['chmod u+x','u+x'], note:'The most common chmod you will ever type: making your own script runnable.' },
        { id:'chmod_gow', cmd:'chmod go-w', what:'removes write permission from the group and from others',
          ex:'chmod go-w notes.txt', ans:['chmod go-w','go-w'], note:'You can stack "who" letters: go = group and others.' },
        { id:'chmod_setuid', cmd:'chmod u+s', what:'assigns the setuid bit so a program runs as its owner',
          ex:'chmod u+s /usr/local/bin/tool', ans:['chmod u+s','u+s','chmod 4000'], note:'Octal 4000. This is how passwd can edit root-owned files while you run it.' },
        { id:'chmod_setgid', cmd:'chmod g+s', what:'assigns the setgid bit so a program runs with its group, or new files inherit the directory group',
          ex:'chmod g+s /srv/shared', ans:['chmod g+s','g+s','chmod 2000'], note:'Octal 2000. On a shared directory it keeps the whole team’s files in one group.' },
        { id:'chmod_sticky', cmd:'chmod +t', what:'assigns the sticky bit so only a file’s owner may delete it from a shared directory',
          ex:'chmod +t /tmp', ans:['chmod +t','+t','chmod 1000'], note:'Octal 1000. This is why /tmp is world-writable but nobody can delete your files.' },
        { id:'chmod_R', cmd:'chmod --recursive', what:'applies a permission change down through a directory and all its contents',
          ex:'chmod --recursive g+w /srv/shared', ans:['chmod --recursive','chmod -R','--recursive','-R'], kind:'opt',
          note:'-R / --recursive. Careful: it hits files and directories alike.' }
      ]
    },
    {
      id:'perms3', title:'Ownership',
      brief:'Permissions answer "what may be done". Ownership answers "by whom".',
      use: {
        scene: "You copied a file into a shared folder as root, and now your teammate cannot edit it.",
        lines: [{ c:"ls -l report.txt", o:"-rw-r--r--. 1 root root 88 Aug 24 09:25 report.txt" },
               { c:"sudo chown bob:staff report.txt" },
               { c:"ls -l report.txt", o:"-rw-r--r--. 1 bob staff 88 Aug 24 09:25 report.txt" }],
        point: "Permissions answer “what may be done”; ownership answers “by whom”. chown sets user and group in one go with a colon; chgrp changes just the group."
      },
      items:[
        { id:'chown', cmd:'chown', what:'changes the owner and/or the group of a file',
          ex:'sudo chown bob:staff report.txt', note:'Syntax: chown [owner][:[group]] file. Normally needs sudo.' },
        { id:'chown_owner', cmd:'chown bob file', what:'changes only the owner of a file, leaving the group alone',
          ex:'sudo chown bob report.txt', ans:['chown bob file','chown bob','chown owner file'], note:'No colon = owner only.' },
        { id:'chown_both', cmd:'chown bob:staff file', what:'changes both the owner and the group in one command',
          ex:'sudo chown bob:staff report.txt', ans:['chown bob:staff file','chown bob:staff','chown owner:group file'],
          note:'owner:group. Leave the owner off (chown :staff file) to change only the group.' },
        { id:'chgrp', cmd:'chgrp', what:'changes only the group ownership of a file',
          ex:'sudo chgrp staff report.txt', note:'CHange GRouP. Same job as the :group half of chown.' }
      ]
    },
    {
      id:'perms4', title:'Becoming another user',
      brief:'<b>su</b> switches user for a whole shell. <b>sudo</b> borrows privilege for one command.',
      use: {
        scene: "One command needs root. You do not want a root shell sitting open all afternoon.",
        lines: [{ c:"sudo passwd bob", o:"[sudo] password for student:\nChanging password for user bob." },
               { c:"su -c 'ls /root' root", o:"Password:\nanaconda-ks.cfg" },
               { c:"su - bob", o:"Password:" }],
        point: "sudo borrows root for ONE command and writes it to a log. su hands you a whole root shell — which is easy to forget you are still sitting in. Reach for sudo first."
      },
      items:[
        { id:'su', cmd:'su', what:'starts an interactive shell as a substitute user',
          ex:'su bob', note:'Substitute User. It asks for the TARGET user’s password.' },
        { id:'su_l', cmd:'su -l', what:'starts a full login shell that loads the target user’s environment',
          ex:'su -l', ans:['su -l','su -','su --login'], note:'su - and su -l are identical. With no username it means root.' },
        { id:'su_c', cmd:"su -c 'command'", what:'runs a single command as another user and then exits',
          ex:"su -c 'ls /root'", ans:["su -c 'command'",'su -c','su -c command'], note:'-c = command. Quote it so your own shell does not eat it.' },
        { id:'sudo', cmd:'sudo', what:'executes one command with superuser or alternate privileges',
          ex:'sudo dnf install vim', note:'Asks for YOUR password, not root’s, and it is logged. That is why it beats su.' },
        { id:'sudo_i', cmd:'sudo -i', what:'opens an interactive superuser shell session',
          ex:'sudo -i', out:'root@fedora:~#', note:'-i = interactive login. Your prompt changes from $ to #. # means root.' },
        { id:'passwd', cmd:'passwd', what:'sets or changes a user login password',
          ex:'passwd', out:'Changing password for student.', note:'passwd on its own changes your own. "sudo passwd bob" changes bob’s.' }
      ]
    },
    {
      id:'perms5', title:'Managing accounts & groups',
      brief:'Admin verbs follow a pattern: <b>add</b> creates, <b>mod</b> edits, <b>del</b> destroys.',
      use: {
        scene: "A new student joins the lab and needs an account that can get into the developers group.",
        lines: [{ c:"sudo groupadd developers" },
               { c:"sudo useradd alice" },
               { c:"sudo usermod -aG developers alice" },
               { c:"sudo passwd alice", o:"Changing password for user alice." },
               { c:"lastlog", o:"alice   pts/1   **Never logged in**" }],
        point: "The verbs are consistent for users and groups alike: add creates, mod changes, del destroys. On usermod, -aG APPENDS a group — plain -G would replace every group they are in."
      },
      items:[
        { id:'useradd', cmd:'useradd', what:'creates a new user account',
          ex:'sudo useradd -m bob', note:'Low-level tool. -m also creates the home directory.' },
        { id:'usermod', cmd:'usermod', what:'modifies the properties of an existing user account',
          ex:'sudo usermod -aG sudo bob', note:'-aG appends a user to a group. Forget the "a" and you wipe their other groups.' },
        { id:'userdel', cmd:'userdel', what:'deletes a user account and its associated files',
          ex:'sudo userdel -r bob', note:'-r also removes the home directory and mail spool.' },
        { id:'groupadd', cmd:'groupadd', what:'creates a new group',
          ex:'sudo groupadd staff', note:'Groups live in /etc/group.' },
        { id:'groupmod', cmd:'groupmod', what:'modifies an existing group definition',
          ex:'sudo groupmod -n crew staff', note:'-n renames the group.' },
        { id:'groupdel', cmd:'groupdel', what:'deletes a group from the system',
          ex:'sudo groupdel staff', note:'You cannot delete a group that is somebody’s primary group.' },
        { id:'addgroup', cmd:'addgroup', what:'is the friendly wrapper that adds a group, or adds a user to a group',
          ex:'sudo addgroup bob staff', note:'Debian-family convenience tool that wraps groupadd with sane defaults.' },
        { id:'lastlog', cmd:'lastlog', what:'reports the most recent login event for each user on the system',
          ex:'lastlog', out:'student  pts/0  192.168.1.5  Wed Aug 20 09:02 2025', note:'Reads /var/log/lastlog. "Never logged in" flags dormant accounts.' }
      ]
    }
  ]
},
{
  mod: 1, id:'proc', name:'Processes & Jobs', icon:'⚙️',
  blurb:'Seeing what is running, backgrounding it, and killing it when it misbehaves.',
  lessons:[
    {
      id:'proc1', title:'Seeing what runs',
      brief:'<b>ps</b> is a photograph. <b>top</b> and <b>htop</b> are live video.',
      use: {
        scene: "The machine has gone sluggish and you want to know what is eating it.",
        lines: [{ c:"ps aux", o:"USER      PID %CPU %MEM COMMAND\nstudent  2041 97.3  1.2 ffmpeg\nstudent  2103  0.1  0.4 bash" },
               { c:"top" },
               { o:"h   open top's help      q   quit back to the shell" }],
        point: "ps is a photograph — one instant, frozen. top and htop are live video, redrawing every couple of seconds. aux is the combination worth memorising: all users, including processes with no terminal."
      },
      items:[
        { id:'ps', cmd:'ps', what:'reports a static one-time snapshot of running processes',
          ex:'ps', out:'  PID TTY          TIME CMD\n 2841 pts/0    00:00:00 bash', note:'Bare ps shows only your processes on this terminal — usually just bash and ps.' },
        { id:'ps_x', cmd:'ps x', what:'shows all of your processes, even ones with no controlling terminal',
          ex:'ps x', ans:['ps x'], kind:'opt', note:'x drops the "must have a terminal" filter.' },
        { id:'ps_ax', cmd:'ps ax', what:'lists every running process belonging to every user',
          ex:'ps ax', ans:['ps ax'], kind:'opt', note:'a = all users, x = including terminal-less. Together: the whole system.' },
        { id:'ps_aux', cmd:'ps aux', what:'gives a verbose listing of all processes from all users with CPU and memory columns',
          ex:'ps aux', out:'USER  PID %CPU %MEM   VSZ   RSS TTY  STAT START TIME COMMAND', ans:['ps aux'], kind:'opt',
          note:'BSD style: no leading dash. This is the single most-typed ps invocation.' },
        { id:'ps_u', cmd:'ps u', what:'adds the user-oriented verbose layout with owner, CPU and memory columns',
          ex:'ps u', ans:['ps u'], kind:'opt', note:'u = user-oriented output. It is the "u" inside aux.' },
        { id:'ps_w', cmd:'ps w', what:'shows full wide command names instead of truncating them',
          ex:'ps axw', ans:['ps w'], kind:'opt', note:'w = wide. Use it twice (ww) for really long command lines.' },
        { id:'top', cmd:'top', what:'is an interactive viewer showing continuously updated CPU and memory activity',
          ex:'top', note:'Refreshes every few seconds. Inside it: h = help, q = quit.' },
        { id:'top_h', cmd:'h', what:'opens the help menu inside top', kind:'key', note:'Inside top: h for help, q to get out.' ,
          demo:{ where:"inside top, wondering what the columns mean", before:"the live process table",
        keys:"h", after:"top's help screen" } },
        { id:'top_q', cmd:'q', what:'quits top and returns to the shell', kind:'key', note:'q = quit. The same escape hatch as less and man.' ,
          demo:{ where:"inside top, finished looking", before:"the live process table",
        keys:"q", after:"$   ← back at the shell prompt" } },
        { id:'htop', cmd:'htop', what:'is the modernised, colourful interactive process monitor',
          ex:'htop', note:'Same idea as top with mouse support, colour bars and easier killing. Often needs installing.' }
      ]
    },
    {
      id:'proc2', title:'Job control',
      brief:'One terminal, many jobs. Foreground has your keyboard; background does not.',
      use: {
        scene: "You started a long job in the foreground and now your terminal is stuck.",
        lines: [{ c:"tload" },
               { o:"Ctrl-z      suspend it and get your prompt back" },
               { c:"jobs", o:"[1]+  Stopped                 tload" },
               { c:"bg %1", o:"[1]+ tload &" },
               { c:"fg %1" }],
        point: "Ctrl-z suspends, it does not kill. bg sets it running again in the background, fg pulls it back to the foreground. Starting the command with & does all of that in one step."
      },
      items:[
        { id:'jobs', cmd:'jobs', what:'lists the background and stopped jobs started from this terminal',
          ex:'jobs', out:'[1]+  Stopped                 vim notes.txt', note:'The [1] is the jobspec number you feed to fg and bg.' },
        { id:'bg', cmd:'bg', what:'resumes a suspended job so it keeps running in the background',
          ex:'bg %1', note:'Classic combo: Ctrl-z to pause it, then bg to let it run behind you.' },
        { id:'amp', cmd:'&', what:'launches a command in the background immediately when placed at the end of the line',
          ex:'xload &', out:'[1] 4127', ans:['&','command &'], kind:'opt', note:'The shell prints [job] PID and hands your prompt straight back.' },
        { id:'fg', cmd:'fg', what:'brings a background or stopped job back to the foreground',
          ex:'fg %1', ans:['fg','fg %jobspec','fg %1'], note:'Syntax: fg %jobspec. The percent sign means "job number", not PID.' },
        { id:'ctrl_c', cmd:'Ctrl-c', what:'sends an interrupt signal to stop the foreground process', kind:'key',
          ans:['ctrl-c','ctrl c','^c','control-c','ctrl+c'], note:'Sends INT (signal 2). The universal "make it stop".' ,
          demo:{ where:"a command is running and you want it to stop", before:"$ ping example.com   ← still going",
        keys:"Ctrl-c", after:"$   ← prompt back, the process is gone" } },
        { id:'ctrl_z', cmd:'Ctrl-z', what:'sends a terminal stop signal that pauses the foreground process and puts it in the job list', kind:'key',
          ans:['ctrl-z','ctrl z','^z','control-z','ctrl+z'], note:'Sends TSTP (signal 20). Paused, not killed — bring it back with fg.' ,
          demo:{ where:"a command has your terminal and you want it back", before:"$ tload   ← running in the foreground",
        keys:"Ctrl-z", after:"[1]+  Stopped   tload   ← paused, prompt is yours" } }
      ]
    },
    {
      id:'proc3', title:'Signals & killing',
      brief:'<b>kill</b> does not mean "destroy". It means "send a signal" — and the default signal is a polite one.',
      use: {
        scene: "A process has stopped responding. Ask it politely first, then insist.",
        lines: [{ c:"ps aux", o:"student  3310 99.0  8.1 stuckapp" },
               { c:"kill 3310", o:"(sends 15/TERM — asks it to tidy up and exit)" },
               { c:"kill -9 3310", o:"(sends 9/KILL — the kernel removes it, no cleanup at all)" },
               { c:"killall stuckapp" }],
        point: "kill does not mean destroy, it means “send a signal”, and the default is the polite one. 9/KILL cannot be caught or ignored, so it is the last resort, not the first — a killed process cannot save its work."
      },
      items:[
        { id:'kill', cmd:'kill', what:'sends a signal to a process by PID or jobspec',
          ex:'kill 4127', note:'With no signal named it sends 15 (TERM), which asks politely to shut down.' },
        { id:'kill_l', cmd:'kill -l', what:'lists every signal the system supports',
          ex:'kill -l', out:' 1) SIGHUP   2) SIGINT   3) SIGQUIT   9) SIGKILL  15) SIGTERM', ans:['kill -l'], kind:'opt', note:'l = list. Use it when you forget a signal number.' },
        { id:'sig_1', cmd:'1 / HUP', what:'is the hangup signal, number 1, historically sent when a terminal disconnects', kind:'opt',
          ans:['1','hup','sighup','1 / hup'], note:'Many daemons reuse HUP to mean "reload your config file".' ,
          ex:"kill -1 3310", out:"# 1 = HUP. Most daemons take it as “re-read your config” rather than “die”." },
        { id:'sig_2', cmd:'2 / INT', what:'is the interrupt signal, number 2, the same thing Ctrl-c sends', kind:'opt',
          ans:['2','int','sigint','2 / int'], note:'INT = interrupt. Ctrl-c in signal form.' ,
          ex:"kill -2 3310", out:"# 2 = INT. Exactly what Ctrl-c sends." },
        { id:'sig_3', cmd:'3 / QUIT', what:'is the quit signal, number 3', kind:'opt', ans:['3','quit','sigquit','3 / quit'], note:'Like INT but also dumps a core file. Ctrl-\\ sends it.' ,
          ex:"kill -3 3310", out:"# 3 = QUIT. Like INT, but it also dumps core for debugging." },
        { id:'sig_9', cmd:'9 / KILL', what:'is the immediate kernel-level termination signal, number 9, which cannot be ignored', kind:'opt',
          ans:['9','kill','sigkill','9 / kill'], note:'Last resort. The process gets no chance to clean up or save.' ,
          ex:"kill -9 3310", out:"# 9 = KILL. Cannot be caught or ignored — no cleanup, nothing saved." },
        { id:'sig_11', cmd:'11 / SEGV', what:'is the segmentation violation signal, number 11, sent when a program touches illegal memory', kind:'opt',
          ans:['11','segv','sigsegv','11 / segv'], note:'You do not send this one — you see it in crash reports.' ,
          ex:"kill -11 3310", out:"# 11 = SEGV. The signal behind “Segmentation fault”." },
        { id:'sig_15', cmd:'15 / TERM', what:'is the orderly termination signal, number 15, and the default sent by kill', kind:'opt',
          ans:['15','term','sigterm','15 / term'], note:'Always try TERM before KILL. Try 15, then 9.' ,
          ex:"kill 3310", out:"# 15 = TERM, the default. The polite “please finish up and exit”." },
        { id:'sig_18', cmd:'18 / CONT', what:'is the continue signal, number 18, that resumes a stopped process', kind:'opt',
          ans:['18','cont','sigcont','18 / cont'], note:'The undo for STOP. It is what bg and fg use under the hood.' ,
          ex:"kill -18 3310", out:"# 18 = CONT. Resumes a process you had stopped." },
        { id:'sig_19', cmd:'19 / STOP', what:'is the pause signal, number 19, which stops a process and cannot be ignored', kind:'opt',
          ans:['19','stop','sigstop','19 / stop'], note:'Unignorable, like KILL — but it freezes instead of killing.' ,
          ex:"kill -19 3310", out:"# 19 = STOP. Freezes it. Like KILL, it cannot be ignored." },
        { id:'sig_20', cmd:'20 / TSTP', what:'is the terminal stop signal, number 20, the same thing Ctrl-z sends', kind:'opt',
          ans:['20','tstp','sigtstp','20 / tstp'], note:'TSTP can be ignored by a program; STOP cannot.' ,
          ex:"kill -20 3310", out:"# 20 = TSTP. Exactly what Ctrl-z sends." },
        { id:'sig_28', cmd:'28 / WINCH', what:'is the window-change signal, number 28, sent when a terminal is resized', kind:'opt',
          ans:['28','winch','sigwinch','28 / winch'], note:'It is how top and vim notice you dragged the window bigger.' ,
          ex:"kill -28 3310", out:"# 28 = WINCH. Sent for you automatically when you resize the window." },
        { id:'kill_9', cmd:'kill -9', what:'forcibly terminates a process using the unignorable KILL signal',
          ex:'kill -9 4127', ans:['kill -9','kill -KILL','kill -sigkill'], note:'kill -9 PID. Also written kill -KILL PID.' },
        { id:'killall', cmd:'killall', what:'sends a signal to every process matching a program name',
          ex:'killall -9 firefox', note:'Syntax: killall [-u user] [-signal] name. By name, not by PID.' }
      ]
    },
    {
      id:'proc4', title:'Priority & monitoring',
      brief:'Niceness runs <b>-20 (greedy) to 19 (generous)</b>. Higher number = nicer to others = lower priority.',
      use: {
        scene: "A big render must not fight your editor for CPU, and it has to survive you closing the laptop.",
        lines: [{ c:"nice -n 10 ffmpeg -i in.mp4 out.mp4 &", o:"[1] 4120" },
               { c:"renice 15 -p 4120", o:"4120 (process ID) old priority 10, new priority 15" },
               { c:"nohup ./long-job.sh &", o:"nohup: ignoring input and appending output to 'nohup.out'" },
               { c:"pstree", o:"systemd──┬sshd───bash───ffmpeg" }],
        point: "Niceness runs -20 (greedy) to 19 (generous), so a HIGHER number means it gives way to everything else. nohup is the part that lets it keep running after you disconnect."
      },
      items:[
        { id:'nice', cmd:'nice', what:'launches a new program with a modified scheduling priority',
          ex:'nice -n 10 ./backup.sh', note:'Range -20 to 19. Only root may pick a negative (greedier) value.' },
        { id:'nice_n', cmd:'nice -n', what:'specifies the niceness level when launching a program', ex:'nice -n 15 ./job.sh',
          ans:['nice -n','-n'], kind:'opt', note:'-n takes the number. nice -n 19 = run only with leftover CPU.' },
        { id:'renice', cmd:'renice', what:'changes the scheduling priority of a process that is already running',
          ex:'renice -n 5 -p 4127', note:'nice starts it nicely; renice re-nices it mid-flight.' },
        { id:'nohup', cmd:'nohup', what:'runs a command immune to hangup signals so it survives the terminal closing',
          ex:'nohup ./longjob.sh &', out:'nohup: appending output to nohup.out', note:'NO HangUP. Pair it with & and you can log out safely.' },
        { id:'pstree', cmd:'pstree', what:'displays running processes as a visual parent-child hierarchy tree',
          ex:'pstree', out:'systemd─┫sshd───bash───pstree', note:'Great for seeing which process spawned which.' },
        { id:'vmstat', cmd:'vmstat', what:'prints a snapshot of system resource usage: memory, swap and disk I/O',
          ex:'vmstat 5', note:'Give it a number and it reprints every N seconds.' },
        { id:'xload', cmd:'xload', what:'is a graphical window that draws system load over time',
          ex:'xload &', note:'X11 program — needs a graphical desktop. The classic & background demo.' },
        { id:'tload', cmd:'tload', what:'draws a system load graph inside the terminal itself',
          ex:'tload', note:'The text-mode twin of xload. Ctrl-c to leave.' }
      ]
    },
    {
      id:'proc5', title:'Powering the machine',
      brief:'These need root. Use them on your own VM, never on a shared server.',
      use: {
        scene: "Finishing up on your own virtual machine at the end of a lab session.",
        lines: [{ c:"sudo shutdown -h now", o:"Broadcast message: The system is going down for halt NOW!" },
               { c:"sudo shutdown -r now", o:"(the same, except it comes back up)" }],
        point: "-h halts, -r reboots, and now means now. Run these on your own VM only — on a shared server you will make yourself extremely unpopular."
      },
      items:[
        { id:'halt', cmd:'halt', what:'stops the system',
          ex:'sudo halt', note:'Halts the CPU. Often leaves the hardware still powered.' },
        { id:'poweroff', cmd:'poweroff', what:'stops the system and cuts the power',
          ex:'sudo poweroff', note:'halt plus actually switching the machine off.' },
        { id:'reboot', cmd:'reboot', what:'restarts the system',
          ex:'sudo reboot', note:'Shut down and come straight back up.' },
        { id:'shutdown', cmd:'shutdown', what:'orchestrates a system shutdown or reboot, optionally on a timer',
          ex:'sudo shutdown +10 "Maintenance"', note:'Warns logged-in users first, which halt and poweroff do not.' },
        { id:'shutdown_h', cmd:'shutdown -h now', what:'powers the system down immediately',
          ex:'sudo shutdown -h now', ans:['shutdown -h now','sudo shutdown -h now'], note:'-h = halt. "now" means do not wait.' },
        { id:'shutdown_r', cmd:'shutdown -r now', what:'reboots the system immediately',
          ex:'sudo shutdown -r now', ans:['shutdown -r now','sudo shutdown -r now'], note:'-r = reboot. Remember: h = halt, r = reboot.' }
      ]
    }
  ]
},
{
  mod: 1, id:'help', name:'Identity & Help', icon:'📖',
  blurb:'How to answer your own questions without leaving the terminal.',
  lessons:[
    {
      id:'help1', title:'What IS this command?',
      brief:'Before you read the manual, find out what kind of thing you are dealing with.',
      use: {
        scene: "A command behaved strangely and you want to know what actually ran.",
        lines: [{ c:"type ls", o:"ls is aliased to `ls --color=auto'" },
               { c:"type cd", o:"cd is a shell builtin" },
               { c:"which python3", o:"/usr/bin/python3" },
               { c:"ls --help", o:"Usage: ls [OPTION]... [FILE]..." }],
        point: "type tells you WHAT it is — an alias, a builtin, or a program on disk. which only searches the disk, which is why it has nothing to say about cd. Builtins are documented by help, not man."
      },
      items:[
        { id:'type', cmd:'type', what:'tells you how the shell interprets a name: builtin, alias, function or program on disk',
          ex:'type cd', out:'cd is a shell builtin', note:'Try "type ls" — on most systems it is secretly an alias for ls --color=auto.' },
        { id:'which', cmd:'which', what:'shows the filesystem path of the executable that will actually run',
          ex:'which python3', out:'/usr/bin/python3', note:'Only finds real programs. It cannot see builtins like cd.' },
        { id:'help', cmd:'help', what:'displays usage instructions for shell builtin commands',
          ex:'help cd', note:'For BUILTINS only. help cd works, help ls does not — ls is a program, so use man.' },
        { id:'help_m', cmd:'help -m', what:'displays builtin help formatted like a man page',
          ex:'help -m cd', ans:['help -m','-m'], kind:'opt', note:'-m = man-page style layout with NAME / SYNOPSIS sections.' },
        { id:'dashhelp', cmd:'--help', what:'is the option most programs accept to print a short usage summary',
          ex:'ls --help', ans:['--help'], kind:'opt', note:'Quick reminder of flags. man gives the full story, --help gives the cheat sheet.' }
      ]
    },
    {
      id:'help2', title:'The manuals',
      brief:'man pages are split into numbered <b>sections</b>. Same name can appear in several.',
      use: {
        scene: "You know roughly what you want, but not what the command is called.",
        lines: [{ c:"man -k password", o:"passwd (1) - update user's authentication tokens\npasswd (5) - password file" },
               { c:"man 5 passwd" },
               { c:"whatis ls", o:"ls (1) - list directory contents" }],
        point: "The number in brackets is the manual SECTION: 1 is user commands, 5 is file formats. That is why man passwd shows the command and man 5 passwd shows the file. apropos is the same thing as man -k."
      },
      items:[
        { id:'man', cmd:'man', what:'displays the formal reference manual page for a command',
          ex:'man ls', note:'It opens in less — so Space, /search, q to quit all work.' },
        { id:'man_sec', cmd:'man 5 passwd', what:'opens a manual page from a specific numbered section',
          ex:'man 5 passwd', ans:['man 5 passwd','man [section] search_term','man 5'],
          note:'Section 1 = commands, 5 = file formats, 8 = admin. "man passwd" gives the command; "man 5 passwd" gives the file.' },
        { id:'man_k', cmd:'man -k', what:'searches all manual page descriptions for a keyword',
          ex:'man -k directory', ans:['man -k','apropos'], kind:'opt', note:'-k = keyword. Identical to running apropos.' },
        { id:'apropos', cmd:'apropos', what:'searches manual page descriptions and lists commands matching your query',
          ex:'apropos compress', note:'Use it when you know WHAT you want but not the command name. Same as man -k.' },
        { id:'whatis', cmd:'whatis', what:'prints the concise one-line manual description of a command',
          ex:'whatis ls', out:'ls (1)  - list directory contents', note:'The one-line version of man. Nice for a fast sanity check.' },
        { id:'info', cmd:'info', what:'displays the longer hyperlinked GNU documentation manuals',
          ex:'info coreutils', note:'GNU’s deeper docs, navigated by links. Often more tutorial than man.' }
      ]
    },
    {
      id:'help3', title:'Aliases',
      brief:'An alias is a nickname you invent for a longer command.',
      use: {
        scene: "You keep typing the same long ls and want a short name for it.",
        lines: [{ c:"alias ll='ls -ltrh'" },
               { c:"ll", o:"-rw-r--r--. 1 student student 1.2K Aug 24 09:31 notes.txt" },
               { c:"alias", o:"alias ll='ls -ltrh'" }],
        point: "An alias lives only in the shell you typed it in. Put the same line in ~/.bashrc and you get it in every session from then on."
      },
      items:[
        { id:'alias', cmd:'alias', what:'defines a shorthand nickname for a longer command sequence',
          ex:"alias ll='ls -lh --color=auto'", note:"Syntax: alias name='string'. No spaces around the = sign." },
        { id:'alias_list', cmd:'alias', what:'lists every alias currently defined when run with no arguments',
          ex:'alias', out:"alias ll='ls -lh'\nalias ..='cd ..'", ans:['alias'], note:'Aliases vanish when you close the shell — put them in ~/.bashrc to keep them.' }
      ]
    }
  ]
},
{
  mod: 1, id:'sys', name:'Environment & Packages', icon:'📦',
  blurb:'Shell variables and installing software.',
  lessons:[
    {
      id:'sys1', title:'Environment & installing',
      brief:'Variables are the shell’s memory. <b>$</b> in front of a name means "the value of".',
      use: {
        scene: "A tool is missing, and you want to see the environment your shell is working in.",
        lines: [{ c:"echo $HOME", o:"/home/student" },
               { c:"env", o:"HOME=/home/student\nPATH=/usr/local/bin:/usr/bin\nSHELL=/bin/bash" },
               { c:"sudo dnf install vim", o:"Complete!" }],
        point: "$HOME is one variable out of the set env prints; the shell expands it before the command ever sees it. dnf is the package manager on Fedora and RHEL — Debian and Ubuntu use apt instead."
      },
      items:[
        { id:'env', cmd:'env', what:'displays the active environment variables',
          ex:'env', out:'HOME=/home/student\nPATH=/usr/local/bin:/usr/bin\nSHELL=/bin/bash', note:'Look for PATH — it is the list of directories the shell searches for commands.' },
        { id:'echo', cmd:'echo', what:'prints text or the value of a variable to standard output',
          ex:'echo Hello', out:'Hello', note:'The shell’s "print" statement.' },
        { id:'echo_home', cmd:'echo $HOME', what:'prints the path of your home directory by expanding a variable',
          ex:'echo $HOME', out:'/home/student', ans:['echo $HOME','echo ${HOME}'], note:'HOME is the variable, $HOME is its value. Same trick with $PATH and $USER.' },
        { id:'dnf', cmd:'dnf', what:'is the package manager used on Fedora and Red Hat systems to install software',
          ex:'sudo dnf install vim', note:'Fedora/RHEL use dnf. Debian/Ubuntu use apt — same job, different family.' },
        { id:'dnf_install', cmd:'sudo dnf install vim', what:'installs the vim package on a Fedora or Red Hat system',
          ex:'sudo dnf install vim', ans:['sudo dnf install vim','dnf install vim'], note:'Installing is system-wide, so it needs sudo.' }
      ]
    }
  ]
},
{
  mod: 1, id:'vim', name:'The Vim Editor', icon:'✍️',
  blurb:'Vim is modal: the same key means different things depending on the mode you are in.',
  lessons:[
    {
      id:'vim1', title:'Modes — the one idea that unlocks Vim',
      brief:'<b>Normal</b> mode = keys are commands. <b>Insert</b> mode = keys are text. When lost, press <b>Esc</b>.',
      use: {
        scene: "You open a file in Vim, start typing, and the cursor leaps around instead of letters appearing.",
        lines: [{ c:"vim notes.txt" },
               { o:"Vim opens in NORMAL mode — keys are commands, not text" },
               { o:"i        switch to Insert mode; now typing types" },
               { o:"Esc      back to Normal mode" }],
        point: "Rule one: confused? Press Esc. You are in Normal mode and everything else starts from there. vimtutor, run from the shell, is a free 30-minute guided lesson that ships with Vim."
      },
      items:[
        { id:'vim_esc', cmd:'Esc', what:'returns you to Normal mode from any other mode in Vim', kind:'key',
          ans:['esc','escape'], note:'Rule #1: confused? Press Esc. You are now in Normal mode.' ,
          demo:{ where:"you are in Insert mode and want commands back", before:"-- INSERT --   at the bottom of the screen",
        keys:"Esc", after:"the -- INSERT -- marker is gone; you are in Normal mode" } },
        { id:'vim_i_mode', cmd:'i', what:'switches from Normal mode into Insert mode so your typing becomes text', kind:'key',
          note:'Vim opens in NORMAL mode, not insert. That is why typing gibberish moves the cursor around.' ,
          demo:{ where:"Vim has just opened the file in Normal mode", before:"typing “hello” moves the cursor around",
        keys:"i", after:"-- INSERT --   now typing “hello” types hello" } },
        { id:'vimtutor', cmd:'vimtutor', what:'launches Vim’s built-in interactive tutorial from the shell',
          ex:'vimtutor', note:'A free 30-minute guided lesson that ships with Vim. Run it from bash, not inside Vim.' }
      ]
    },
    {
      id:'vim2', title:'Moving the cursor (Normal mode)',
      brief:'Your right hand never leaves the home row: <b>h j k l</b>. j looks like a down arrow.',
      use: {
        scene: "A 400-line config file, and the setting you need is somewhere near the bottom.",
        lines: [{ c:"vim /etc/ssh/sshd_config" },
               { o:"G        jump to the last line" },
               { o:"42G      jump straight to line 42" },
               { o:"gg       back to the first line" },
               { o:"w  b     forward / back one word" },
               { o:"0  $     start / end of the line" }],
        point: "Never hold an arrow key down. hjkl move one character, w and b move by words, G moves by lines — which is why Vim users appear to teleport around a file."
      },
      items:[
        { id:'vim_h', cmd:'h', what:'moves the cursor one character to the left', kind:'key', note:'h is the leftmost of the four keys — so it goes left.' ,
          demo:{ where:"cursor on the b of “brown”", before:"The quick brown fox",
        keys:"h", after:"cursor moves left, onto the space before “brown”" } },
        { id:'vim_j', cmd:'j', what:'moves the cursor down one line', kind:'key', note:'j has a hook that hangs down. Down.' ,
          demo:{ where:"cursor on line 1 of 3", before:"line one\nline two\nline three",
        keys:"j", after:"cursor is now on line two" } },
        { id:'vim_k', cmd:'k', what:'moves the cursor up one line', kind:'key', note:'k has a tall stem pointing up. Up.' ,
          demo:{ where:"cursor on line 3 of 3", before:"line one\nline two\nline three",
        keys:"k", after:"cursor is now on line two" } },
        { id:'vim_l', cmd:'l', what:'moves the cursor one character to the right', kind:'key', note:'l is the rightmost key — so it goes right.' ,
          demo:{ where:"cursor on the b of “brown”", before:"The quick brown fox",
        keys:"l", after:"cursor moves right, onto the r" } },
        { id:'vim_0', cmd:'0', what:'moves the cursor to the very start of the current line', kind:'key', note:'Zero = column zero, the absolute start including whitespace.' ,
          demo:{ where:"cursor on the f of “fox”", before:"    The quick brown fox",
        keys:"0", after:"cursor jumps to column 1 — the first space, before the indent" } },
        { id:'vim_caret', cmd:'^', what:'moves the cursor to the first non-whitespace character on the line', kind:'key',
          ans:['^','caret'], note:'^ skips the indentation; 0 does not.' ,
          demo:{ where:"cursor on the f of “fox”", before:"    The quick brown fox",
        keys:"^", after:"cursor jumps to the T — the first thing that is not whitespace" } },
        { id:'vim_dollar', cmd:'$', what:'moves the cursor to the end of the current line', kind:'key',
          ans:['$','dollar'], note:'Same $ that means "end" in regular expressions.' ,
          demo:{ where:"cursor on the T of “The”", before:"The quick brown fox",
        keys:"$", after:"cursor jumps to the x at the end of the line" } },
        { id:'vim_w', cmd:'w', what:'jumps forward to the start of the next word, counting punctuation as words', kind:'key', note:'w = word.' ,
          demo:{ where:"cursor on the T of “The”", before:"The quick brown fox",
        keys:"w", after:"cursor jumps to the q of “quick”" } },
        { id:'vim_W', cmd:'W', what:'jumps forward to the start of the next word, ignoring punctuation', kind:'key', note:'Capital = bigger jumps. W treats "don’t-stop" as one word.' ,
          demo:{ where:"cursor on the u of “user.name”, where w would stop at the dot", before:"user.name is here",
        keys:"W", after:"cursor jumps clean past the dot to the i of “is”" } },
        { id:'vim_b', cmd:'b', what:'jumps backward to the start of the previous word, counting punctuation', kind:'key', note:'b = back.' ,
          demo:{ where:"cursor on the f of “fox”", before:"The quick brown fox",
        keys:"b", after:"cursor jumps back to the b of “brown”" } },
        { id:'vim_B', cmd:'B', what:'jumps backward to the start of the previous word, ignoring punctuation', kind:'key', note:'Capital B = the whitespace-only version of b.' ,
          demo:{ where:"cursor on the i of “is”", before:"user.name is here",
        keys:"B", after:"cursor jumps back to the u of “user.name”, treating it as one word" } },
        { id:'vim_ctrlf', cmd:'Ctrl-f', what:'pages down one full screen in Vim', kind:'key',
          ans:['ctrl-f','ctrl f','^f','page down','ctrl+f'], note:'f = forward. Page Down does the same.' ,
          demo:{ where:"cursor at the top of a long file", before:"showing lines 1–40",
        keys:"Ctrl-f", after:"showing lines 41–80 — a page forward" } },
        { id:'vim_ctrlb', cmd:'Ctrl-b', what:'pages up one full screen in Vim', kind:'key',
          ans:['ctrl-b','ctrl b','^b','page up','ctrl+b'], note:'b = back. Page Up does the same.' ,
          demo:{ where:"cursor a screen into a long file", before:"showing lines 41–80",
        keys:"Ctrl-b", after:"showing lines 1–40 — a page back" } },
        { id:'vim_G', cmd:'G', what:'jumps to the very last line of the file', kind:'key', note:'Capital G = Go to the bottom.' ,
          demo:{ where:"anywhere in a 900-line file", before:"cursor on line 12",
        keys:"G", after:"cursor on line 900 — the last line" } },
        { id:'vim_gg', cmd:'gg', what:'jumps to the very first line of the file', kind:'key',
          ans:['gg','1g','1G'], note:'gg or 1G. G alone goes to the end, 1G goes to line 1.' ,
          demo:{ where:"down at the bottom of a long file", before:"cursor on line 900",
        keys:"gg", after:"cursor on line 1" } },
        { id:'vim_numG', cmd:'42G', what:'jumps to a specific line number', kind:'key',
          ans:['42g','numberg','ng','42G','numberG'], note:'Type the number then G. 42G = line 42.' ,
          demo:{ where:"an error message said the problem is on line 42", before:"cursor on line 1",
        keys:"42G", after:"cursor on line 42" } }
      ]
    },
    {
      id:'vim3', title:'Getting into Insert mode',
      brief:'Six ways in, and the difference is <i>where the cursor lands</i>. Lowercase = near, uppercase = far.',
      use: {
        scene: "You need to add a new line underneath the one your cursor is sitting on.",
        lines: [{ o:"i   insert BEFORE the cursor       a   append AFTER it" },
               { o:"I   insert at the start of the line  A   append at the end" },
               { o:"o   open a new line BELOW            O   open one ABOVE" }],
        point: "Lower case works from the cursor, upper case works on the whole line. Every one of these drops you into Insert mode, so press Esc when you have finished typing."
      },
      items:[
        { id:'vim_i', cmd:'i', what:'inserts text directly before the cursor', kind:'key', note:'i = insert, right here.' ,
          demo:{ where:"cursor on the q of “quick”", before:"The quick fox",
        keys:"i then very ", after:"The very quick fox" } },
        { id:'vim_I', cmd:'I', what:'inserts text at the very beginning of the line', kind:'key', note:'Capital I = insert at the line start. Like ^ then i.' ,
          demo:{ where:"cursor anywhere on the line", before:"    listen 8080",
        keys:"I then # ", after:"    # listen 8080   ← commented out, indent kept" } },
        { id:'vim_a', cmd:'a', what:'appends text directly after the cursor', kind:'key', note:'a = append, one character right of i.' ,
          demo:{ where:"cursor on the x of “fox”", before:"The quick fox",
        keys:"a then es", after:"The quick foxes" } },
        { id:'vim_A', cmd:'A', what:'jumps to the end of the line and starts inserting', kind:'key', note:'Capital A = append at the end of the line. Like $ then a.' ,
          demo:{ where:"cursor on the T, at the start", before:"The quick fox",
        keys:"A then  jumped", after:"The quick fox jumped" } },
        { id:'vim_o', cmd:'o', what:'opens a blank line below the cursor and starts inserting', kind:'key', note:'o = open a line below.' ,
          demo:{ where:"cursor on line 1", before:"listen 8080",
        keys:"o then server_name x", after:"listen 8080\nserver_name x   ← new line BELOW" } },
        { id:'vim_O', cmd:'O', what:'opens a blank line above the cursor and starts inserting', kind:'key', note:'Capital O = open above. Uppercase goes "up".' ,
          demo:{ where:"cursor on line 1", before:"listen 8080",
        keys:"O then # config", after:"# config   ← new line ABOVE\nlisten 8080" } }
      ]
    },
    {
      id:'vim4', title:'Deleting & changing',
      brief:'<b>d</b> is a verb. Attach any movement to it and it deletes exactly that far.',
      use: {
        scene: "Removing a stray line and fixing a typo, without ever leaving Normal mode.",
        lines: [{ o:"x      delete the character under the cursor" },
               { o:"dd     delete the whole line      5dd   delete five lines" },
               { o:"dW     delete to the end of the word" },
               { o:"d$     delete to the end of the line" },
               { o:"J      join the next line onto this one" }],
        point: "The pattern is verb + how far: d means delete, and W, $, 0, G say where to stop. Learn it once and the same endings work with y for yank."
      },
      items:[
        { id:'vim_x', cmd:'x', what:'deletes the single character under the cursor', kind:'key', note:'x = crossing out one letter.' ,
          demo:{ where:"cursor on the second o of “foox”", before:"The quick foox",
        keys:"x", after:"The quick fox" } },
        { id:'vim_r', cmd:'r', what:'replaces the character under the cursor with the very next key you press', kind:'key',
          note:'r then a = that character becomes "a". No mode change involved.' ,
          demo:{ where:"cursor on the 8 you want to be a 9", before:"listen 8080",
        keys:"r9", after:"listen 9080" } },
        { id:'vim_dd', cmd:'dd', what:'deletes (cuts) the entire current line', kind:'key', note:'Doubling a verb applies it to the whole line. The most-used Vim command.' ,
          demo:{ where:"cursor on line 2", before:"one\ntwo\nthree",
        keys:"dd", after:"one\nthree" } },
        { id:'vim_ndd', cmd:'5dd', what:'deletes a given number of lines starting at the cursor', kind:'key',
          ans:['5dd','ndd','3dd'], note:'Number first: 5dd = delete 5 lines. The count-then-command pattern is everywhere in Vim.' ,
          demo:{ where:"cursor on line 1 of five", before:"one\ntwo\nthree\nfour\nfive",
        keys:"5dd", after:"(all five lines gone — the file is empty)" } },
        { id:'vim_dW', cmd:'dW', what:'deletes from the cursor to the beginning of the next word', kind:'key',
          ans:['dw','dW'], note:'d (delete) + W (word movement). Verb + motion.' ,
          demo:{ where:"cursor on the q of “quick”", before:"The quick brown fox",
        keys:"dW", after:"The brown fox" } },
        { id:'vim_ddollar', cmd:'d$', what:'deletes from the cursor to the end of the line', kind:'key',
          ans:['d$'], note:'d + $ (end of line). Also written D.' ,
          demo:{ where:"cursor on the b of “brown”", before:"The quick brown fox",
        keys:"d$", after:"The quick " } },
        { id:'vim_d0', cmd:'d0', what:'deletes from the cursor back to the start of the line', kind:'key', note:'d + 0 (start of line).' ,
          demo:{ where:"cursor on the b of “brown”", before:"The quick brown fox",
        keys:"d0", after:"brown fox" } },
        { id:'vim_dcaret', cmd:'d^', what:'deletes from the cursor back to the first non-whitespace character', kind:'key',
          ans:['d^'], note:'d + ^. Same as d0 but keeps the indentation.' ,
          demo:{ where:"cursor on the b of “brown”, on an indented line", before:"    The quick brown fox",
        keys:"d^", after:"    brown fox   ← the indent survives" } },
        { id:'vim_dG', cmd:'dG', what:'deletes from the current line to the end of the file', kind:'key', note:'d + G. Careful — that can be a lot of lines. u undoes it.' ,
          demo:{ where:"cursor on line 3 of 900", before:"line 1\nline 2\nline 3\n… 897 more",
        keys:"dG", after:"line 1\nline 2   ← line 3 to the end are gone" } },
        { id:'vim_d20G', cmd:'d20G', what:'deletes from the current line down to a specific line number', kind:'key',
          ans:['d20g','d20G'], note:'d + 20G = delete through line 20.' ,
          demo:{ where:"cursor on line 10", before:"lines 1–900",
        keys:"d20G", after:"lines 10 to 20 are gone; 1–9 and 21–900 remain" } },
        { id:'vim_J', cmd:'J', what:'joins the current line together with the line below it', kind:'key',
          note:'Capital J = Join. It pulls the next line up onto this one.' ,
          demo:{ where:"cursor on line 1", before:"The quick\nbrown fox",
        keys:"J", after:"The quick brown fox" } }
      ]
    },
    {
      id:'vim5', title:'Copy & paste (yank & put)',
      brief:'Vim calls copy <b>yank</b>. Every d-command has a matching y-command with identical grammar.',
      use: {
        scene: "Copying a block of configuration and pasting it in further down.",
        lines: [{ o:"5yy    yank (copy) five lines" },
               { o:"p      put them BELOW the cursor" },
               { o:"P      put them ABOVE it" }],
        point: "Yank is copy — there is no Ctrl-C in Normal mode. dd puts the deleted line in the same register, so dd followed by p is how you MOVE a line."
      },
      items:[
        { id:'vim_yy', cmd:'yy', what:'copies (yanks) the current line into the buffer', kind:'key', note:'Doubled verb = whole line, exactly like dd.' ,
          demo:{ where:"cursor on the line you want to copy", before:"listen 8080",
        keys:"yy", after:"nothing visibly changes — the line is now in the register" } },
        { id:'vim_nyy', cmd:'5yy', what:'copies a given number of lines into the buffer', kind:'key',
          ans:['5yy','nyy','3yy'], note:'Count first: 5yy = yank 5 lines.' ,
          demo:{ where:"cursor on the first of five lines", before:"server {\n  listen 8080;\n  root /srv;\n}\n",
        keys:"5yy", after:"all five lines copied, ready for p" } },
        { id:'vim_yW', cmd:'yW', what:'copies from the cursor to the beginning of the next word', kind:'key', ans:['yw','yW'], note:'The y twin of dW.' ,
          demo:{ where:"cursor on the q of “quick”", before:"The quick brown fox",
        keys:"yW", after:"“quick ” is copied; the line is untouched" } },
        { id:'vim_ydollar', cmd:'y$', what:'copies from the cursor to the end of the line', kind:'key', ans:['y$'], note:'The y twin of d$.' ,
          demo:{ where:"cursor on the b of “brown”", before:"The quick brown fox",
        keys:"y$", after:"“brown fox” is copied; the line is untouched" } },
        { id:'vim_y0', cmd:'y0', what:'copies from the cursor back to the start of the line', kind:'key', note:'The y twin of d0.' ,
          demo:{ where:"cursor on the b of “brown”", before:"The quick brown fox",
        keys:"y0", after:"“The quick ” is copied; the line is untouched" } },
        { id:'vim_ycaret', cmd:'y^', what:'copies from the cursor back to the first non-whitespace character', kind:'key', ans:['y^'], note:'The y twin of d^.' ,
          demo:{ where:"cursor on the b of “brown”, on an indented line", before:"    The quick brown fox",
        keys:"y^", after:"“The quick ” is copied, without the indent" } },
        { id:'vim_yG', cmd:'yG', what:'copies from the current line to the end of the file', kind:'key', note:'The y twin of dG.' ,
          demo:{ where:"cursor on line 3", before:"line 1\nline 2\nline 3\n… to the end",
        keys:"yG", after:"line 3 to the last line copied; nothing is removed" } },
        { id:'vim_y20G', cmd:'y20G', what:'copies from the current line down to a specific line number', kind:'key',
          ans:['y20g','y20G'], note:'The y twin of d20G.' ,
          demo:{ where:"cursor on line 10", before:"lines 1–900",
        keys:"y20G", after:"lines 10 to 20 copied; nothing is removed" } },
        { id:'vim_p', cmd:'p', what:'pastes the buffer on the line below or after the cursor', kind:'key', note:'p = put, after.' ,
          demo:{ where:"you have just pressed yy on “listen 8080”, cursor on line 1", before:"listen 8080\nroot /srv;",
        keys:"p", after:"listen 8080\nlisten 8080   ← pasted BELOW\nroot /srv;" } },
        { id:'vim_P', cmd:'P', what:'pastes the buffer on the line above or before the cursor', kind:'key', note:'Capital P = put above. Uppercase goes up.' ,
          demo:{ where:"you have just pressed yy on “listen 8080”, cursor on line 1", before:"listen 8080\nroot /srv;",
        keys:"P", after:"listen 8080   ← pasted ABOVE\nlisten 8080\nroot /srv;" } }
      ]
    },
    {
      id:'vim6', title:'Undo, redo & searching',
      brief:'Two searches: <b>f</b> hunts a character on this line, <b>/</b> hunts a pattern in the whole file.',
      use: {
        scene: "You deleted the wrong line, and then you need to find every mention of the word port.",
        lines: [{ o:"u          undo one change      Ctrl-r   redo it" },
               { o:"/port      search forwards" },
               { o:"n  N       next / previous match" },
               { o:"ZZ         save and quit" }],
        point: "u steps back one change at a time and Ctrl-r walks forward again. The / and n keys are the same ones less and man use."
      },
      items:[
        { id:'vim_u', cmd:'u', what:'undoes the last editing action', kind:'key', note:'Vim allows many levels of undo; classic vi only allowed one.' ,
          demo:{ where:"you just deleted the wrong line with dd", before:"one\nthree   ← “two” is gone",
        keys:"u", after:"one\ntwo\nthree   ← it is back" } },
        { id:'vim_ctrlr', cmd:'Ctrl-r', what:'redoes an action that was undone', kind:'key',
          ans:['ctrl-r','ctrl r','^r','ctrl+r'], note:'u undoes, Ctrl-r redoes.' ,
          demo:{ where:"you have just pressed u and changed your mind", before:"one\ntwo\nthree",
        keys:"Ctrl-r", after:"one\nthree   ← the undo is undone" } },
        { id:'vim_f', cmd:'fa', what:'searches forward on the current line and lands on the next instance of a given character', kind:'key',
          ans:['fa','f','f{char}','fchar'], note:'f then the character. fa jumps to the next "a" on this line only.' ,
          demo:{ where:"cursor at the start of the line, looking for the next a", before:"The quick brown fox ran away",
        keys:"fa", after:"cursor lands on the a of “ran”" } },
        { id:'vim_semi', cmd:';', what:'repeats the last single-character line search', kind:'key',
          ans:[';','semicolon'], note:'Press ; again and again to hop between matches.' ,
          demo:{ where:"cursor on the a of “ran”, after an fa", before:"The quick brown fox ran away",
        keys:";", after:"cursor lands on the a of “away” — the next one" } },
        { id:'vim_slash', cmd:'/pattern', what:'searches the whole file forward for a matching word or pattern', kind:'key',
          ans:['/pattern','/','/word'], note:'Type / then the text and press Enter. Same key as in less.' ,
          demo:{ where:"anywhere in the file", before:"a 900-line config",
        keys:"/listen", after:"cursor jumps to the next line containing “listen”" } },
        { id:'vim_n', cmd:'n', what:'jumps forward to the next search match', kind:'key', note:'n = next.' ,
          demo:{ where:"after a /listen search", before:"sitting on the first match",
        keys:"n", after:"sitting on the next match, further down" } },
        { id:'vim_N', cmd:'N', what:'jumps backward to the previous search match', kind:'key', note:'Capital N = next, but backwards.' ,
          demo:{ where:"after a /listen search, gone one too far", before:"sitting on the second match",
        keys:"N", after:"back on the first match" } },
        { id:'vim_ZZ', cmd:'ZZ', what:'saves the file and exits Vim immediately', kind:'key', note:'Two capital Z’s = the keyboard shortcut for :wq.' ,
          demo:{ where:"you have finished editing and want out", before:"-- your edited file --",
        keys:"ZZ", after:"$   ← saved and back at the shell, in two keystrokes" } }
      ]
    },
    {
      id:'vim7', title:'Command-line mode — saving & quitting',
      brief:'Press <b>:</b> in Normal mode and a command line appears at the bottom. This is how you leave Vim.',
      use: {
        scene: "The famous one: you have made your edit, now how do you get out of this thing?",
        lines: [{ o:":w                save, and stay in the file" },
               { o:":q                quit — refuses if there are unsaved changes" },
               { o:":wq               save and quit" },
               { o:":q!               quit and THROW AWAY your changes" },
               { o:":w filename       write a copy under a new name" }],
        point: "If :q refuses to go, Vim is protecting work you have not saved. Either :wq to keep it or :q! to abandon it — the ! means “yes, I meant it”."
      },
      items:[
        { id:'vim_q', cmd:':q', what:'quits Vim, but refuses if there are unsaved changes', kind:'key', note:'q = quit. Vim protects you from losing work.' ,
          demo:{ where:"nothing has been changed since the last save", before:"-- your file --",
        keys:":q", after:"$   ← back at the shell" } },
        { id:'vim_qbang', cmd:':q!', what:'quits Vim immediately and throws away all unsaved changes', kind:'key',
          note:'The ! means "I mean it". The famous escape hatch.' ,
          demo:{ where:"you have made edits you want to throw away", before:"E37: No write since last change",
        keys:":q!", after:"$   ← back at the shell, edits discarded" } },
        { id:'vim_write', cmd:':w', what:'writes (saves) the buffer to disk without quitting', kind:'key', note:'w = write.' ,
          demo:{ where:"mid-edit, and you want it on disk without leaving", before:"-- your edited file --",
        keys:":w", after:"\"notes.txt\" 42L, 903B written   ← still in Vim" } },
        { id:'vim_wfile', cmd:':w filename', what:'writes the buffer to a different file while you keep editing the original', kind:'key',
          ans:[':w filename',':w file'], note:'Like "Save a copy" — the file you are editing does NOT change.' ,
          demo:{ where:"you want a second copy under another name", before:"-- editing notes.txt --",
        keys:":w backup.txt", after:"\"backup.txt\" 42L, 903B written   ← still editing notes.txt" } },
        { id:'vim_wq', cmd:':wq', what:'writes the file to disk and then exits Vim', kind:'key', note:'write + quit. Same result as ZZ.' ,
          demo:{ where:"finished, and you want it saved", before:"-- your edited file --",
        keys:":wq", after:"$   ← written to disk, back at the shell" } },
        { id:'vim_saveas', cmd:':saveas newname', what:'writes the buffer to a new file and switches editing focus to that new file', kind:'key',
          ans:[':saveas newname',':saveas'], note:'This is true "Save As" — unlike :w filename, you continue in the NEW file.' ,
          demo:{ where:"you want to carry on in the NEW file, not the old one", before:"-- editing notes.txt --",
        keys:":saveas draft.txt", after:"-- editing draft.txt --   ← focus has moved" } }
      ]
    },
    {
      id:'vim8', title:'Buffers, reading files & substitution',
      brief:'A buffer is one open file. Vim can juggle several at once.',
      use: {
        scene: "Renaming a setting everywhere in a config, and pulling in a second file to compare against.",
        lines: [{ o:":%s/8080/9090/g      replace every 8080 with 9090, whole file" },
               { o:":%s/8080/9090/gc     the same, but confirm each one" },
               { o:":e other.conf        open a second file" },
               { o:":bn  :bp  :buffers   next / previous / list open buffers" },
               { o:":set number          show line numbers" }],
        point: "Read :%s/old/new/g as “over the whole file (%), substitute (s), every match on each line (g)”. Without the g it changes only the first match per line; add c and Vim asks y/n each time."
      },
      items:[
        { id:'vim_buffers', cmd:':buffers', what:'lists every file currently open in the session', kind:'key',
          ans:[':buffers',':ls'], note:'Shows each buffer with its number.' ,
          demo:{ where:"two files open in one Vim session", before:"-- editing notes.txt --",
        keys:":buffers", after:"  1  \"notes.txt\"    line 12\n  2  \"other.conf\"   line 1" } },
        { id:'vim_buffer', cmd:':b 2', what:'switches the editor to a buffer by its number', kind:'key',
          ans:[':b 2',':buffer 2',':b',':buffer {num}',':b {num}'], note:':buffer 2 and :b 2 are the same command.' ,
          demo:{ where:"the list showed other.conf as buffer 2", before:"-- editing notes.txt --",
        keys:":b 2", after:"-- editing other.conf --" } },
        { id:'vim_bn', cmd:':bn', what:'switches to the next buffer', kind:'key', note:'bn = buffer next.' ,
          demo:{ where:"buffer 1 of 3 open", before:"-- editing notes.txt --",
        keys:":bn", after:"-- editing other.conf --   ← the next one" } },
        { id:'vim_bp', cmd:':bp', what:'switches to the previous buffer', kind:'key', note:'bp = buffer previous.' ,
          demo:{ where:"buffer 2 of 3 open", before:"-- editing other.conf --",
        keys:":bp", after:"-- editing notes.txt --   ← the previous one" } },
        { id:'vim_e', cmd:':e filename', what:'opens an additional file for editing in a new buffer', kind:'key',
          ans:[':e filename',':e'], note:'e = edit. It opens the file as its own buffer.' ,
          demo:{ where:"editing one file, and you need a second", before:"-- editing notes.txt --",
        keys:":e other.conf", after:"-- editing other.conf, notes.txt still open behind it --" } },
        { id:'vim_rfile', cmd:':r filename', what:'reads another file and inserts its contents below the cursor', kind:'key',
          ans:[':r filename',':r'], note:'r = read. It pastes the file INTO the one you are editing.' ,
          demo:{ where:"cursor on line 1, wanting another file's contents here", before:"# my config",
        keys:":r header.txt", after:"# my config\n(the whole of header.txt, pasted below the cursor)" } },
        { id:'vim_sub', cmd:':%s/old/new/g', what:'replaces every occurrence of a pattern throughout the whole file', kind:'key',
          ans:[':%s/old/new/g'], note:'% = all lines, s = substitute, g = every match on each line, not just the first.' ,
          demo:{ where:"the port has changed everywhere in the file", before:"listen 8080;\nproxy_pass http://localhost:8080;",
        keys:":%s/8080/9090/g", after:"listen 9090;\nproxy_pass http://localhost:9090;" } },
        { id:'vim_subc', cmd:':%s/old/new/gc', what:'replaces globally but asks you to confirm each change', kind:'key',
          ans:[':%s/old/new/gc'], note:'The extra c = confirm. Vim asks y/n at every match.' ,
          demo:{ where:"the same, but you do not trust every match", before:"listen 8080;",
        keys:":%s/8080/9090/gc", after:"replace with 9090 (y/n/a/q/l/^E/^Y)?   ← asks at each one" } },
        { id:'vim_setnu', cmd:':set number', what:'turns on line numbers in the editor margin', kind:'key',
          ans:[':set number',':set nu'], note:':set nonumber turns them back off.' ,
          demo:{ where:"you are chasing an error on line 42", before:"listen 8080",
        keys:":set number", after:"  1 listen 8080   ← numbers in the margin" } },
        { id:'vim_setnocp', cmd:':set nocp', what:'disables vi compatibility mode and enables the advanced Vim features', kind:'key',
          ans:[':set nocp',':set nocompatible'], note:'nocp = no compatible. Without it Vim pretends to be 1976 vi.' ,
          demo:{ where:"Vim is behaving like plain old vi", before:"arrow keys print letters in Insert mode",
        keys:":set nocp", after:"full Vim behaviour: undo, multi-level history, the lot" } },
        { id:'vim_help', cmd:':help', what:'opens Vim’s built-in reference documentation', kind:'key',
          ans:[':help',':h'], note:':help then a topic, e.g. :help dd. Close it with :q.' ,
          demo:{ where:"you cannot remember what dW does", before:"-- your file --",
        keys:":help dW", after:"Vim's own manual opens in a split window" } }
      ]
    }
  ]
},
{
  mod: 1, id:'bash', name:'Bash Editing Modes', icon:'⌨️',
  blurb:'Your command line itself has an editor, and you get to choose which one.',
  lessons:[
    {
      id:'bash1', title:'vi mode vs emacs mode',
      brief:'Bash line editing defaults to Emacs keys. If you love Vim, you can switch.',
      use: {
        scene: "Editing a long command you have already typed at the prompt, without retyping the whole thing.",
        lines: [{ c:"set -o vi" },
               { o:"Esc then k, w, dd, x — Vim keys, on the command line itself" },
               { c:"set -o emacs" },
               { o:"Ctrl-a start of line   Ctrl-e end   Ctrl-k cut to the end" }],
        point: "Bash gives you a small editor on the prompt itself. emacs mode is the default; set -o vi swaps in Vim's keys if those are already in your fingers."
      },
      items:[
        { id:'set_vi', cmd:'set -o vi', what:'makes bash command-line editing use Vim-style keys',
          ex:'set -o vi', ans:['set -o vi'], note:'You start in insert mode; tap Esc to navigate with h j k l, dd, etc.' },
        { id:'set_emacs', cmd:'set -o emacs', what:'returns bash command-line editing to the default Emacs-style keys',
          ex:'set -o emacs', ans:['set -o emacs'], note:'The default. Ctrl-a start of line, Ctrl-e end of line, Ctrl-k kill to end.' }
      ]
    }
  ]
},
{
  mod: 1, id:'lab01', name:'Lab 01', icon:'📋',
  blurb:'A simulated lab assignment: fix scripts, edit configs, run pipelines, and build reports.',
  lessons:[]
}
];

/* ---- flat index -------------------------------------------------- */
const ALL_ITEMS = [];
CURRICULUM.forEach(cat => cat.lessons.forEach(les => les.items.forEach(it => {
  it.mod = cat.mod; it.cat = cat.id; it.catName = cat.name; it.lesson = les.id; it.lessonTitle = les.title;
  ALL_ITEMS.push(it);
})));
const ITEM_BY_ID = Object.fromEntries(ALL_ITEMS.map(i => [i.id, i]));
const LESSONS = CURRICULUM.flatMap(c => c.lessons.map(l => ({ ...l, mod: c.mod, cat: c.id, catName: c.name, icon: c.icon })));

/* hang each module's topics off its entry, and count what it holds */
MODULES.forEach(mo => {
  mo.id    = 'mod' + mo.num;
  mo.cats  = CURRICULUM.filter(c => c.mod === mo.num);
  mo.items = ALL_ITEMS.filter(i => i.mod === mo.num);
  mo.label = mo.name ? `Module ${mo.num} — ${mo.name}` : `Module ${mo.num}`;
});
const MODULE_OF = Object.fromEntries(MODULES.map(mo => [mo.num, mo]));
const READY_MODULES = MODULES.filter(mo => mo.ready);
