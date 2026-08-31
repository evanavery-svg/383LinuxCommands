/* =====================================================================
   Build-the-command challenges.
   ---------------------------------------------------------------------
   Flashcards ask "what does -t do". These ask the question an exam asks:
   here is what I want to happen — write the line. Graded by outcome
   (see gradeBuild in app.js), so any command that genuinely achieves the
   goal is accepted; there is no single blessed string.

     goal    what you are asked to achieve
     expect  a model answer, used only to produce the target outcome
     must    optional pattern, when the wording demands a technique that
             the outcome alone cannot distinguish (octal vs symbolic)
     teach   the item ids this exercises — all of them get credited
     mod/cat which module and topic it belongs to
   ===================================================================== */

const BUILD_TASKS = [
  /* ---- navigation & listing ---- */
  { id:'c1', mod:1, cat:'nav', teach:['ls_l','ls_h'],
    goal:'Show everything in /var/log in long format, with sizes in K, M or G rather than raw bytes.',
    expect:'ls -lh /var/log' },
  { id:'c2', mod:1, cat:'nav', teach:['ls_l','ls_t','ls_r'],
    goal:'List your home directory in long format sorted by time, oldest first — so the newest file ends up at the bottom.',
    expect:'ls -ltr' },
  { id:'c3', mod:1, cat:'nav', teach:['ls_l','ls_S'],
    goal:'List Documents in long format with the biggest file first.',
    expect:'ls -lS Documents' },
  { id:'c4', mod:1, cat:'nav', teach:['ls_a','ls_F'],
    goal:'List Documents including hidden files, with a slash after each directory name.',
    expect:'ls -aF Documents' },
  { id:'c5', mod:1, cat:'nav', teach:['ls_d','ls_l'],
    goal:'Show the details of the /etc directory itself — permissions, owner, date — not a listing of what is inside it.',
    expect:'ls -ld /etc' },
  { id:'c6', mod:1, cat:'nav', teach:['cd','pwd'],
    goal:'Move into /var/log and print where you are standing, in one line.',
    expect:'cd /var/log; pwd' },

  /* ---- files & directories ---- */
  { id:'c7', mod:1, cat:'files', teach:['mkdir'],
    goal:'Create a directory called backup in your home directory.',
    expect:'mkdir backup' },
  { id:'c8', mod:1, cat:'files', teach:['cp','cp_v'],
    goal:'Copy Documents/report.txt into /tmp, and have the shell tell you what it did.',
    expect:'cp -v Documents/report.txt /tmp' },
  { id:'c9', mod:1, cat:'files', teach:['cp','cp_a'],
    goal:'Copy /etc/hostname into /tmp keeping its original ownership and permissions.',
    expect:'cp -a /etc/hostname /tmp' },
  { id:'c10', mod:1, cat:'files', teach:['cp','cp_r'],
    goal:'Copy the whole scripts directory into /tmp.',
    expect:'cp -r scripts /tmp' },
  { id:'c11', mod:1, cat:'files', teach:['mv'],
    goal:'Rename big.log to old.log.',
    expect:'mv big.log old.log' },
  { id:'c12', mod:1, cat:'files', teach:['rm','rm_r'],
    goal:'Delete the Pictures directory and everything inside it.',
    expect:'rm -r Pictures' },
  { id:'c13', mod:1, cat:'files', teach:['ln_s'],
    goal:'Create a symbolic link in your home called syslog that points at /var/log/messages.',
    expect:'ln -s /var/log/messages syslog' },
  { id:'c14', mod:1, cat:'files', teach:['mkdir','cp_a'],
    goal:'Make a directory called archive, then copy Documents into it preserving every attribute.',
    expect:'mkdir archive; cp -a Documents archive' },

  /* ---- viewing & inspecting ---- */
  { id:'c15', mod:1, cat:'view', teach:['head'],
    goal:'Show only the first 3 lines of Documents/report.txt.',
    expect:'head -n 3 Documents/report.txt' },
  { id:'c16', mod:1, cat:'view', teach:['tail'],
    goal:'Show only the last 5 lines of /var/log/messages.',
    expect:'tail -n 5 /var/log/messages' },
  { id:'c17', mod:1, cat:'view', teach:['wc'],
    goal:'Count the lines, words and bytes in Documents/notes.txt.',
    expect:'wc Documents/notes.txt' },
  { id:'c18', mod:1, cat:'view', teach:['file'],
    goal:'Find out what kind of data Pictures/holiday.jpg actually contains.',
    expect:'file Pictures/holiday.jpg' },

  /* ---- permissions & users ---- */
  { id:'c19', mod:1, cat:'perms', teach:['chmod','chmod_644'], must:/^chmod\s+[0-7]{3,4}\s/,
    goal:'Using octal numbers, set secret.txt so only you can read and write it and nobody else can do anything.',
    expect:'chmod 600 secret.txt' },
  { id:'c20', mod:1, cat:'perms', teach:['chmod','chmod_755'], must:/^chmod\s+[0-7]{3,4}\s/,
    goal:'Using octal numbers, set scripts/backup.sh to rwx for you and r-x for group and others.',
    expect:'chmod 755 scripts/backup.sh' },
  { id:'c21', mod:1, cat:'perms', teach:['chmod','chmod_ux'], must:/[ugoa]*[+\-=][rwxst]/,
    goal:'Using symbolic notation, add execute permission for the owner of scripts/backup.sh.',
    expect:'chmod u+x scripts/backup.sh' },
  { id:'c22', mod:1, cat:'perms', teach:['chmod','chmod_gow'], must:/[ugoa]*[+\-=][rwxst]/,
    goal:'Using symbolic notation, take write permission away from the group and from others on Documents/report.txt.',
    expect:'chmod go-w Documents/report.txt' },
  { id:'c23', mod:1, cat:'perms', teach:['chmod','chmod_sticky'],
    goal:'Turn on the sticky bit for /tmp, so only a file owner can delete their own files there.',
    expect:'chmod +t /tmp' },
  { id:'c24', mod:1, cat:'perms', teach:['chmod','chmod_R'],
    goal:'Give the group write permission on the scripts directory and everything inside it, in one command.',
    expect:'chmod -R g+w scripts' },
  { id:'c25', mod:1, cat:'perms', teach:['chown','chown_both'],
    goal:'Make Documents/todo.md owned by bob with group staff, in a single command.',
    expect:'chown bob:staff Documents/todo.md' },
  { id:'c26', mod:1, cat:'perms', teach:['chgrp'],
    goal:'Change only the group of Documents/notes.txt to staff, leaving the owner alone.',
    expect:'chgrp staff Documents/notes.txt' },

  /* ---- processes & jobs ---- */
  { id:'c27', mod:1, cat:'proc', teach:['ps','ps_aux'],
    goal:'Show every process running on the machine, from every user, with the CPU and memory columns.',
    expect:'ps aux' },
  { id:'c28', mod:1, cat:'proc', teach:['kill','kill_l'],
    goal:'List every signal this system supports.',
    expect:'kill -l' },
  { id:'c29', mod:1, cat:'proc', teach:['pstree'],
    goal:'Show the running processes as a parent-child tree.',
    expect:'pstree' },
  { id:'c30', mod:1, cat:'proc', teach:['amp','jobs'],
    goal:'Start xload in the background so you get your prompt straight back, then list your background jobs.',
    expect:'xload &; jobs' },

  /* ---- identity & help ---- */
  { id:'c31', mod:1, cat:'help', teach:['man','man_sec'],
    goal:'Open the manual page for the passwd FILE FORMAT — section 5 — not the passwd command.',
    expect:'man 5 passwd' },
  { id:'c32', mod:1, cat:'help', teach:['type'],
    goal:'Ask the shell whether cd is a builtin, an alias or a program on disk.',
    expect:'type cd' },
  { id:'c33', mod:1, cat:'help', teach:['apropos','man_k'],
    goal:'Search the manual descriptions for anything to do with directories.',
    expect:'apropos directory' },
  { id:'c34', mod:1, cat:'help', teach:['alias'],
    goal:"Create an alias called ll that runs 'ls -lh'.",
    expect:"alias ll='ls -lh'" },

  /* ---- environment & packages ---- */
  { id:'c35', mod:1, cat:'sys', teach:['echo','echo_home'], must:/\$\{?HOME\}?/,
    goal:'Print the path of your home directory by expanding a variable, not by typing the path.',
    expect:'echo $HOME' },
  { id:'c36', mod:1, cat:'sys', teach:['dnf','dnf_install'],
    goal:'Install the vim package on this Fedora system, with the privileges that needs.',
    expect:'sudo dnf install vim' },

  /* ---- Lab 01 ---- */
  { id:'c37', mod:1, cat:'lab01', teach:['grep'],
    goal:'Search network.conf for every line that contains the word "timeout".',
    expect:'grep timeout lab-01/network.conf' },
  { id:'c38', mod:1, cat:'lab01', teach:['sed_i'],
    goal:'Change the port from 3000 to 8080 in lab-01/network.conf, editing the file in place.',
    expect:"sed -i 's/3000/8080/' lab-01/network.conf" },
  { id:'c39', mod:1, cat:'lab01', teach:['chmod','chmod_ux'], must:/[ugoa]*[+\-=][rwxst]/,
    goal:'Using symbolic notation, add execute permission for the owner of lab-01/broken_backup.sh.',
    expect:'chmod u+x lab-01/broken_backup.sh' },
  { id:'c40', mod:1, cat:'lab01', teach:['pipe','grep'],
    goal:'List every process and pipe the output into grep to show only lines containing "sshd".',
    expect:'ps aux | grep sshd' },
  { id:'c41', mod:1, cat:'lab01', teach:['redir'],
    goal:'Write the text "done" into a new file called lab-01/report.txt using output redirection.',
    expect:'echo done > lab-01/report.txt' },
  { id:'c42', mod:1, cat:'lab01', teach:['printf'],
    goal:'Use printf to print your username via command substitution: User: student',
    expect:'printf \'User: %s\\n\' "$(whoami)"' },

  /* ================================================================
     MODULE 2 — Version Control with Git
     ================================================================ */

  /* ---- git setup & config ---- */
  { id:'c43', mod:2, cat:'gitsetup', teach:['git_config_name','git_config_email'],
    goal:'Set your Git name to "Alice Smith" and email to alice@example.com, both globally.',
    expect:"git config --global user.name 'Alice Smith'; git config --global user.email alice@example.com" },
  { id:'c44', mod:2, cat:'gitsetup', teach:['git_init'],
    goal:'Create a new directory called myproject, move into it, and initialize a Git repository.',
    expect:'mkdir myproject; cd myproject; git init' },
  { id:'c45', mod:2, cat:'gitsetup', teach:['git_clone','git_clone_dir'],
    goal:'Clone https://github.com/user/repo.git into a directory called my-repo.',
    expect:'git clone https://github.com/user/repo.git my-repo' },

  /* ---- staging & committing ---- */
  { id:'c46', mod:2, cat:'gitstage', teach:['git_add','git_commit_m'],
    goal:'Stage app.js and commit it with the message "add app".',
    expect:"git add app.js; git commit -m 'add app'" },
  { id:'c47', mod:2, cat:'gitstage', teach:['git_add_all','git_commit_m'],
    goal:'Stage everything in the current directory and commit with the message "initial commit".',
    expect:"git add .; git commit -m 'initial commit'" },
  { id:'c48', mod:2, cat:'gitstage', teach:['git_commit_am'],
    goal:'Stage all tracked changes and commit with the message "quick fix", in a single command.',
    expect:"git commit -am 'quick fix'" },
  { id:'c49', mod:2, cat:'gitstage', teach:['git_restore_staged'],
    goal:'You accidentally staged .env. Unstage it without losing the file.',
    expect:'git restore --staged .env' },

  /* ---- branching & merging ---- */
  { id:'c50', mod:2, cat:'gitbranch', teach:['git_switch_c'],
    goal:'Create a new branch called feature-nav and switch to it in one command.',
    expect:'git switch -c feature-nav' },
  { id:'c51', mod:2, cat:'gitbranch', teach:['git_switch','git_merge','git_branch_d'],
    goal:'Switch to main, merge feature-nav into it, then delete the feature-nav branch.',
    expect:'git switch main; git merge feature-nav; git branch -d feature-nav' },
  { id:'c52', mod:2, cat:'gitbranch', teach:['git_merge_noff'],
    goal:'Merge feature-login into the current branch, forcing a merge commit even if fast-forward is possible.',
    expect:'git merge --no-ff feature-login' },

  /* ---- remotes & push/pull ---- */
  { id:'c53', mod:2, cat:'gitremote', teach:['git_remote_add'],
    goal:'Add a remote called origin pointing to https://github.com/alice/project.git.',
    expect:'git remote add origin https://github.com/alice/project.git' },
  { id:'c54', mod:2, cat:'gitremote', teach:['git_push_u'],
    goal:'Push your main branch to origin and set it as the upstream tracking branch.',
    expect:'git push -u origin main' },
  { id:'c55', mod:2, cat:'gitremote', teach:['git_pull'],
    goal:'Pull the latest changes from origin into your main branch.',
    expect:'git pull origin main' },
  { id:'c56', mod:2, cat:'gitremote', teach:['git_fetch'],
    goal:'Download new commits from origin without merging them into your working branch.',
    expect:'git fetch origin' },

  /* ---- history & diffs ---- */
  { id:'c57', mod:2, cat:'gitlog', teach:['git_log_oneline','git_log_graph'],
    goal:'Show the commit history in a compact one-line format with a branch graph.',
    expect:'git log --oneline --graph' },
  { id:'c58', mod:2, cat:'gitlog', teach:['git_diff_staged'],
    goal:'Show the changes that are staged and about to be committed.',
    expect:'git diff --staged' },

  /* ---- stashing & tagging ---- */
  { id:'c59', mod:2, cat:'gitmisc', teach:['git_stash','git_stash_pop'],
    goal:'Stash your current changes, then reapply them.',
    expect:'git stash; git stash pop' },
  { id:'c60', mod:2, cat:'gitmisc', teach:['git_tag','git_push_tags'],
    goal:'Tag the current commit as v2.0, then push all tags to the remote.',
    expect:'git tag v2.0; git push --tags' }
];

const BUILD_BY_ID = Object.fromEntries(BUILD_TASKS.map(t => [t.id, t]));
