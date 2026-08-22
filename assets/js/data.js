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

const VERSION = '0.6';
const COPYRIGHT_HOLDER = 'Avery LLC';

/* Newest first. This is the single source of truth for the in-app
   changelog; CHANGELOG.md mirrors it. */
const CHANGELOG = [
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
      items:[
        { id:'less_fwd', cmd:'Space', what:'scrolls forward one full page inside less', kind:'key',
          ans:['space','spacebar','page down','pagedown','space / page down'], note:'Space or Page Down — forward one screen.' },
        { id:'less_back', cmd:'b', what:'scrolls back one full page inside less', kind:'key',
          ans:['b','page up','pageup','b / page up'], note:'b = back. Page Up does the same thing.' },
        { id:'less_line', cmd:'Down Arrow', what:'scrolls down a single line inside less', kind:'key',
          ans:['down arrow','down','downarrow','j'], note:'Up Arrow scrolls up one line, Down Arrow scrolls down one line.' },
        { id:'less_G', cmd:'G', what:'jumps to the end of the file inside less', kind:'key',
          ans:['g'], note:'Capital G = Go to the bottom. Same key as in Vim.' },
        { id:'less_1G', cmd:'1G', what:'jumps back to the start of the file inside less', kind:'key',
          ans:['1g','g','1G / g'], note:'1G means "go to line 1". Lowercase g does it too.' },
        { id:'less_search', cmd:'/characters', what:'searches forward for text inside less', kind:'key',
          ans:['/characters','/','/pattern','/text'], note:'Type / then your text and press Enter.' },
        { id:'less_n', cmd:'n', what:'repeats the last search and jumps to the next match inside less', kind:'key',
          note:'n = next. Same key as Vim search.' },
        { id:'less_h', cmd:'h', what:'opens the built-in help screen inside less', kind:'key', note:'h = help. Press q to leave the help screen.' },
        { id:'less_q', cmd:'q', what:'quits less and returns you to the shell', kind:'key',
          note:'q = quit. If you are ever stuck inside a pager, press q.' }
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
      items:[
        { id:'id', cmd:'id', what:'displays your user identity: UID, GID and group memberships',
          ex:'id', out:'uid=1000(student) gid=1000(student) groups=1000(student),27(sudo)', note:'Run it on yourself, or "id bob" to inspect another user.' },
        { id:'chmod', cmd:'chmod', what:'changes the access permissions (mode) of a file or directory',
          ex:'chmod 644 notes.txt', note:'chmod = CHange MODe. It takes octal numbers or symbolic letters.' },
        { id:'oct_r', cmd:'4', what:'is the octal value of the read permission', kind:'opt',
          ans:['4','r=4'], note:'r = 4. Read.' },
        { id:'oct_w', cmd:'2', what:'is the octal value of the write permission', kind:'opt',
          ans:['2','w=2'], note:'w = 2. Write.' },
        { id:'oct_x', cmd:'1', what:'is the octal value of the execute permission', kind:'opt',
          ans:['1','x=1'], note:'x = 1. Execute. 4+2+1 = 7 = rwx.' },
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
      items:[
        { id:'sym_who', cmd:'u g o a', what:'are the "who" letters in symbolic chmod: user, group, others, all', kind:'opt',
          ans:['u g o a','ugoa','u,g,o,a'], note:'u = the owner, g = the group, o = everyone else, a = all three at once.' },
        { id:'sym_ops', cmd:'+ - =', what:'are the symbolic chmod operators that add, remove, or set permissions exactly', kind:'opt',
          ans:['+ - =','+-=','+,-,='], note:'+ adds, - removes, = sets exactly and wipes whatever was there.' },
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
        { id:'top_h', cmd:'h', what:'opens the help menu inside top', kind:'key', note:'Inside top: h for help, q to get out.' },
        { id:'top_q', cmd:'q', what:'quits top and returns to the shell', kind:'key', note:'q = quit. The same escape hatch as less and man.' },
        { id:'htop', cmd:'htop', what:'is the modernised, colourful interactive process monitor',
          ex:'htop', note:'Same idea as top with mouse support, colour bars and easier killing. Often needs installing.' }
      ]
    },
    {
      id:'proc2', title:'Job control',
      brief:'One terminal, many jobs. Foreground has your keyboard; background does not.',
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
          ans:['ctrl-c','ctrl c','^c','control-c','ctrl+c'], note:'Sends INT (signal 2). The universal "make it stop".' },
        { id:'ctrl_z', cmd:'Ctrl-z', what:'sends a terminal stop signal that pauses the foreground process and puts it in the job list', kind:'key',
          ans:['ctrl-z','ctrl z','^z','control-z','ctrl+z'], note:'Sends TSTP (signal 20). Paused, not killed — bring it back with fg.' }
      ]
    },
    {
      id:'proc3', title:'Signals & killing',
      brief:'<b>kill</b> does not mean "destroy". It means "send a signal" — and the default signal is a polite one.',
      items:[
        { id:'kill', cmd:'kill', what:'sends a signal to a process by PID or jobspec',
          ex:'kill 4127', note:'With no signal named it sends 15 (TERM), which asks politely to shut down.' },
        { id:'kill_l', cmd:'kill -l', what:'lists every signal the system supports',
          ex:'kill -l', out:' 1) SIGHUP   2) SIGINT   3) SIGQUIT   9) SIGKILL  15) SIGTERM', ans:['kill -l'], kind:'opt', note:'l = list. Use it when you forget a signal number.' },
        { id:'sig_1', cmd:'1 / HUP', what:'is the hangup signal, number 1, historically sent when a terminal disconnects', kind:'opt',
          ans:['1','hup','sighup','1 / hup'], note:'Many daemons reuse HUP to mean "reload your config file".' },
        { id:'sig_2', cmd:'2 / INT', what:'is the interrupt signal, number 2, the same thing Ctrl-c sends', kind:'opt',
          ans:['2','int','sigint','2 / int'], note:'INT = interrupt. Ctrl-c in signal form.' },
        { id:'sig_3', cmd:'3 / QUIT', what:'is the quit signal, number 3', kind:'opt', ans:['3','quit','sigquit','3 / quit'], note:'Like INT but also dumps a core file. Ctrl-\\ sends it.' },
        { id:'sig_9', cmd:'9 / KILL', what:'is the immediate kernel-level termination signal, number 9, which cannot be ignored', kind:'opt',
          ans:['9','kill','sigkill','9 / kill'], note:'Last resort. The process gets no chance to clean up or save.' },
        { id:'sig_11', cmd:'11 / SEGV', what:'is the segmentation violation signal, number 11, sent when a program touches illegal memory', kind:'opt',
          ans:['11','segv','sigsegv','11 / segv'], note:'You do not send this one — you see it in crash reports.' },
        { id:'sig_15', cmd:'15 / TERM', what:'is the orderly termination signal, number 15, and the default sent by kill', kind:'opt',
          ans:['15','term','sigterm','15 / term'], note:'Always try TERM before KILL. Try 15, then 9.' },
        { id:'sig_18', cmd:'18 / CONT', what:'is the continue signal, number 18, that resumes a stopped process', kind:'opt',
          ans:['18','cont','sigcont','18 / cont'], note:'The undo for STOP. It is what bg and fg use under the hood.' },
        { id:'sig_19', cmd:'19 / STOP', what:'is the pause signal, number 19, which stops a process and cannot be ignored', kind:'opt',
          ans:['19','stop','sigstop','19 / stop'], note:'Unignorable, like KILL — but it freezes instead of killing.' },
        { id:'sig_20', cmd:'20 / TSTP', what:'is the terminal stop signal, number 20, the same thing Ctrl-z sends', kind:'opt',
          ans:['20','tstp','sigtstp','20 / tstp'], note:'TSTP can be ignored by a program; STOP cannot.' },
        { id:'sig_28', cmd:'28 / WINCH', what:'is the window-change signal, number 28, sent when a terminal is resized', kind:'opt',
          ans:['28','winch','sigwinch','28 / winch'], note:'It is how top and vim notice you dragged the window bigger.' },
        { id:'kill_9', cmd:'kill -9', what:'forcibly terminates a process using the unignorable KILL signal',
          ex:'kill -9 4127', ans:['kill -9','kill -KILL','kill -sigkill'], note:'kill -9 PID. Also written kill -KILL PID.' },
        { id:'killall', cmd:'killall', what:'sends a signal to every process matching a program name',
          ex:'killall -9 firefox', note:'Syntax: killall [-u user] [-signal] name. By name, not by PID.' }
      ]
    },
    {
      id:'proc4', title:'Priority & monitoring',
      brief:'Niceness runs <b>-20 (greedy) to 19 (generous)</b>. Higher number = nicer to others = lower priority.',
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
      items:[
        { id:'vim_esc', cmd:'Esc', what:'returns you to Normal mode from any other mode in Vim', kind:'key',
          ans:['esc','escape'], note:'Rule #1: confused? Press Esc. You are now in Normal mode.' },
        { id:'vim_i_mode', cmd:'i', what:'switches from Normal mode into Insert mode so your typing becomes text', kind:'key',
          note:'Vim opens in NORMAL mode, not insert. That is why typing gibberish moves the cursor around.' },
        { id:'vimtutor', cmd:'vimtutor', what:'launches Vim’s built-in interactive tutorial from the shell',
          ex:'vimtutor', note:'A free 30-minute guided lesson that ships with Vim. Run it from bash, not inside Vim.' }
      ]
    },
    {
      id:'vim2', title:'Moving the cursor (Normal mode)',
      brief:'Your right hand never leaves the home row: <b>h j k l</b>. j looks like a down arrow.',
      items:[
        { id:'vim_h', cmd:'h', what:'moves the cursor one character to the left', kind:'key', note:'h is the leftmost of the four keys — so it goes left.' },
        { id:'vim_j', cmd:'j', what:'moves the cursor down one line', kind:'key', note:'j has a hook that hangs down. Down.' },
        { id:'vim_k', cmd:'k', what:'moves the cursor up one line', kind:'key', note:'k has a tall stem pointing up. Up.' },
        { id:'vim_l', cmd:'l', what:'moves the cursor one character to the right', kind:'key', note:'l is the rightmost key — so it goes right.' },
        { id:'vim_0', cmd:'0', what:'moves the cursor to the very start of the current line', kind:'key', note:'Zero = column zero, the absolute start including whitespace.' },
        { id:'vim_caret', cmd:'^', what:'moves the cursor to the first non-whitespace character on the line', kind:'key',
          ans:['^','caret'], note:'^ skips the indentation; 0 does not.' },
        { id:'vim_dollar', cmd:'$', what:'moves the cursor to the end of the current line', kind:'key',
          ans:['$','dollar'], note:'Same $ that means "end" in regular expressions.' },
        { id:'vim_w', cmd:'w', what:'jumps forward to the start of the next word, counting punctuation as words', kind:'key', note:'w = word.' },
        { id:'vim_W', cmd:'W', what:'jumps forward to the start of the next word, ignoring punctuation', kind:'key', note:'Capital = bigger jumps. W treats "don’t-stop" as one word.' },
        { id:'vim_b', cmd:'b', what:'jumps backward to the start of the previous word, counting punctuation', kind:'key', note:'b = back.' },
        { id:'vim_B', cmd:'B', what:'jumps backward to the start of the previous word, ignoring punctuation', kind:'key', note:'Capital B = the whitespace-only version of b.' },
        { id:'vim_ctrlf', cmd:'Ctrl-f', what:'pages down one full screen in Vim', kind:'key',
          ans:['ctrl-f','ctrl f','^f','page down','ctrl+f'], note:'f = forward. Page Down does the same.' },
        { id:'vim_ctrlb', cmd:'Ctrl-b', what:'pages up one full screen in Vim', kind:'key',
          ans:['ctrl-b','ctrl b','^b','page up','ctrl+b'], note:'b = back. Page Up does the same.' },
        { id:'vim_G', cmd:'G', what:'jumps to the very last line of the file', kind:'key', note:'Capital G = Go to the bottom.' },
        { id:'vim_gg', cmd:'gg', what:'jumps to the very first line of the file', kind:'key',
          ans:['gg','1g','1G'], note:'gg or 1G. G alone goes to the end, 1G goes to line 1.' },
        { id:'vim_numG', cmd:'42G', what:'jumps to a specific line number', kind:'key',
          ans:['42g','numberg','ng','42G','numberG'], note:'Type the number then G. 42G = line 42.' }
      ]
    },
    {
      id:'vim3', title:'Getting into Insert mode',
      brief:'Six ways in, and the difference is <i>where the cursor lands</i>. Lowercase = near, uppercase = far.',
      items:[
        { id:'vim_i', cmd:'i', what:'inserts text directly before the cursor', kind:'key', note:'i = insert, right here.' },
        { id:'vim_I', cmd:'I', what:'inserts text at the very beginning of the line', kind:'key', note:'Capital I = insert at the line start. Like ^ then i.' },
        { id:'vim_a', cmd:'a', what:'appends text directly after the cursor', kind:'key', note:'a = append, one character right of i.' },
        { id:'vim_A', cmd:'A', what:'jumps to the end of the line and starts inserting', kind:'key', note:'Capital A = append at the end of the line. Like $ then a.' },
        { id:'vim_o', cmd:'o', what:'opens a blank line below the cursor and starts inserting', kind:'key', note:'o = open a line below.' },
        { id:'vim_O', cmd:'O', what:'opens a blank line above the cursor and starts inserting', kind:'key', note:'Capital O = open above. Uppercase goes "up".' }
      ]
    },
    {
      id:'vim4', title:'Deleting & changing',
      brief:'<b>d</b> is a verb. Attach any movement to it and it deletes exactly that far.',
      items:[
        { id:'vim_x', cmd:'x', what:'deletes the single character under the cursor', kind:'key', note:'x = crossing out one letter.' },
        { id:'vim_r', cmd:'r', what:'replaces the character under the cursor with the very next key you press', kind:'key',
          note:'r then a = that character becomes "a". No mode change involved.' },
        { id:'vim_dd', cmd:'dd', what:'deletes (cuts) the entire current line', kind:'key', note:'Doubling a verb applies it to the whole line. The most-used Vim command.' },
        { id:'vim_ndd', cmd:'5dd', what:'deletes a given number of lines starting at the cursor', kind:'key',
          ans:['5dd','ndd','3dd'], note:'Number first: 5dd = delete 5 lines. The count-then-command pattern is everywhere in Vim.' },
        { id:'vim_dW', cmd:'dW', what:'deletes from the cursor to the beginning of the next word', kind:'key',
          ans:['dw','dW'], note:'d (delete) + W (word movement). Verb + motion.' },
        { id:'vim_ddollar', cmd:'d$', what:'deletes from the cursor to the end of the line', kind:'key',
          ans:['d$'], note:'d + $ (end of line). Also written D.' },
        { id:'vim_d0', cmd:'d0', what:'deletes from the cursor back to the start of the line', kind:'key', note:'d + 0 (start of line).' },
        { id:'vim_dcaret', cmd:'d^', what:'deletes from the cursor back to the first non-whitespace character', kind:'key',
          ans:['d^'], note:'d + ^. Same as d0 but keeps the indentation.' },
        { id:'vim_dG', cmd:'dG', what:'deletes from the current line to the end of the file', kind:'key', note:'d + G. Careful — that can be a lot of lines. u undoes it.' },
        { id:'vim_d20G', cmd:'d20G', what:'deletes from the current line down to a specific line number', kind:'key',
          ans:['d20g','d20G'], note:'d + 20G = delete through line 20.' },
        { id:'vim_J', cmd:'J', what:'joins the current line together with the line below it', kind:'key',
          note:'Capital J = Join. It pulls the next line up onto this one.' }
      ]
    },
    {
      id:'vim5', title:'Copy & paste (yank & put)',
      brief:'Vim calls copy <b>yank</b>. Every d-command has a matching y-command with identical grammar.',
      items:[
        { id:'vim_yy', cmd:'yy', what:'copies (yanks) the current line into the buffer', kind:'key', note:'Doubled verb = whole line, exactly like dd.' },
        { id:'vim_nyy', cmd:'5yy', what:'copies a given number of lines into the buffer', kind:'key',
          ans:['5yy','nyy','3yy'], note:'Count first: 5yy = yank 5 lines.' },
        { id:'vim_yW', cmd:'yW', what:'copies from the cursor to the beginning of the next word', kind:'key', ans:['yw','yW'], note:'The y twin of dW.' },
        { id:'vim_ydollar', cmd:'y$', what:'copies from the cursor to the end of the line', kind:'key', ans:['y$'], note:'The y twin of d$.' },
        { id:'vim_y0', cmd:'y0', what:'copies from the cursor back to the start of the line', kind:'key', note:'The y twin of d0.' },
        { id:'vim_ycaret', cmd:'y^', what:'copies from the cursor back to the first non-whitespace character', kind:'key', ans:['y^'], note:'The y twin of d^.' },
        { id:'vim_yG', cmd:'yG', what:'copies from the current line to the end of the file', kind:'key', note:'The y twin of dG.' },
        { id:'vim_y20G', cmd:'y20G', what:'copies from the current line down to a specific line number', kind:'key',
          ans:['y20g','y20G'], note:'The y twin of d20G.' },
        { id:'vim_p', cmd:'p', what:'pastes the buffer on the line below or after the cursor', kind:'key', note:'p = put, after.' },
        { id:'vim_P', cmd:'P', what:'pastes the buffer on the line above or before the cursor', kind:'key', note:'Capital P = put above. Uppercase goes up.' }
      ]
    },
    {
      id:'vim6', title:'Undo, redo & searching',
      brief:'Two searches: <b>f</b> hunts a character on this line, <b>/</b> hunts a pattern in the whole file.',
      items:[
        { id:'vim_u', cmd:'u', what:'undoes the last editing action', kind:'key', note:'Vim allows many levels of undo; classic vi only allowed one.' },
        { id:'vim_ctrlr', cmd:'Ctrl-r', what:'redoes an action that was undone', kind:'key',
          ans:['ctrl-r','ctrl r','^r','ctrl+r'], note:'u undoes, Ctrl-r redoes.' },
        { id:'vim_f', cmd:'fa', what:'searches forward on the current line and lands on the next instance of a given character', kind:'key',
          ans:['fa','f','f{char}','fchar'], note:'f then the character. fa jumps to the next "a" on this line only.' },
        { id:'vim_semi', cmd:';', what:'repeats the last single-character line search', kind:'key',
          ans:[';','semicolon'], note:'Press ; again and again to hop between matches.' },
        { id:'vim_slash', cmd:'/pattern', what:'searches the whole file forward for a matching word or pattern', kind:'key',
          ans:['/pattern','/','/word'], note:'Type / then the text and press Enter. Same key as in less.' },
        { id:'vim_n', cmd:'n', what:'jumps forward to the next search match', kind:'key', note:'n = next.' },
        { id:'vim_N', cmd:'N', what:'jumps backward to the previous search match', kind:'key', note:'Capital N = next, but backwards.' },
        { id:'vim_ZZ', cmd:'ZZ', what:'saves the file and exits Vim immediately', kind:'key', note:'Two capital Z’s = the keyboard shortcut for :wq.' }
      ]
    },
    {
      id:'vim7', title:'Command-line mode — saving & quitting',
      brief:'Press <b>:</b> in Normal mode and a command line appears at the bottom. This is how you leave Vim.',
      items:[
        { id:'vim_q', cmd:':q', what:'quits Vim, but refuses if there are unsaved changes', kind:'key', note:'q = quit. Vim protects you from losing work.' },
        { id:'vim_qbang', cmd:':q!', what:'quits Vim immediately and throws away all unsaved changes', kind:'key',
          note:'The ! means "I mean it". The famous escape hatch.' },
        { id:'vim_write', cmd:':w', what:'writes (saves) the buffer to disk without quitting', kind:'key', note:'w = write.' },
        { id:'vim_wfile', cmd:':w filename', what:'writes the buffer to a different file while you keep editing the original', kind:'key',
          ans:[':w filename',':w file'], note:'Like "Save a copy" — the file you are editing does NOT change.' },
        { id:'vim_wq', cmd:':wq', what:'writes the file to disk and then exits Vim', kind:'key', note:'write + quit. Same result as ZZ.' },
        { id:'vim_saveas', cmd:':saveas newname', what:'writes the buffer to a new file and switches editing focus to that new file', kind:'key',
          ans:[':saveas newname',':saveas'], note:'This is true "Save As" — unlike :w filename, you continue in the NEW file.' }
      ]
    },
    {
      id:'vim8', title:'Buffers, reading files & substitution',
      brief:'A buffer is one open file. Vim can juggle several at once.',
      items:[
        { id:'vim_buffers', cmd:':buffers', what:'lists every file currently open in the session', kind:'key',
          ans:[':buffers',':ls'], note:'Shows each buffer with its number.' },
        { id:'vim_buffer', cmd:':b 2', what:'switches the editor to a buffer by its number', kind:'key',
          ans:[':b 2',':buffer 2',':b',':buffer {num}',':b {num}'], note:':buffer 2 and :b 2 are the same command.' },
        { id:'vim_bn', cmd:':bn', what:'switches to the next buffer', kind:'key', note:'bn = buffer next.' },
        { id:'vim_bp', cmd:':bp', what:'switches to the previous buffer', kind:'key', note:'bp = buffer previous.' },
        { id:'vim_e', cmd:':e filename', what:'opens an additional file for editing in a new buffer', kind:'key',
          ans:[':e filename',':e'], note:'e = edit. It opens the file as its own buffer.' },
        { id:'vim_rfile', cmd:':r filename', what:'reads another file and inserts its contents below the cursor', kind:'key',
          ans:[':r filename',':r'], note:'r = read. It pastes the file INTO the one you are editing.' },
        { id:'vim_sub', cmd:':%s/old/new/g', what:'replaces every occurrence of a pattern throughout the whole file', kind:'key',
          ans:[':%s/old/new/g'], note:'% = all lines, s = substitute, g = every match on each line, not just the first.' },
        { id:'vim_subc', cmd:':%s/old/new/gc', what:'replaces globally but asks you to confirm each change', kind:'key',
          ans:[':%s/old/new/gc'], note:'The extra c = confirm. Vim asks y/n at every match.' },
        { id:'vim_setnu', cmd:':set number', what:'turns on line numbers in the editor margin', kind:'key',
          ans:[':set number',':set nu'], note:':set nonumber turns them back off.' },
        { id:'vim_setnocp', cmd:':set nocp', what:'disables vi compatibility mode and enables the advanced Vim features', kind:'key',
          ans:[':set nocp',':set nocompatible'], note:'nocp = no compatible. Without it Vim pretends to be 1976 vi.' },
        { id:'vim_help', cmd:':help', what:'opens Vim’s built-in reference documentation', kind:'key',
          ans:[':help',':h'], note:':help then a topic, e.g. :help dd. Close it with :q.' }
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
      items:[
        { id:'set_vi', cmd:'set -o vi', what:'makes bash command-line editing use Vim-style keys',
          ex:'set -o vi', ans:['set -o vi'], note:'You start in insert mode; tap Esc to navigate with h j k l, dd, etc.' },
        { id:'set_emacs', cmd:'set -o emacs', what:'returns bash command-line editing to the default Emacs-style keys',
          ex:'set -o emacs', ans:['set -o emacs'], note:'The default. Ctrl-a start of line, Ctrl-e end of line, Ctrl-k kill to end.' }
      ]
    }
  ]
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
