/* =====================================================================
   Labs — structured, graded lab assignments.
   Each lab is a standalone simulation with its own shell, filesystem,
   assignment document, and step-by-step objectives. Labs are separate
   from missions (bite-sized tasks) and scenarios (open-ended puzzles).

   A lab is closer to a real homework assignment: a multi-page document
   describing what to do, with checkpoints graded by filesystem state
   or command history.
   ===================================================================== */

const LABS = [
  {
    id: 'lab01',
    mod: 1,
    title: 'Lab 01 — Linux Command Line Basics',
    subtitle: 'Script repair, config editing, pipelines, and output redirection',
    description: `In this lab you will practise essential command-line skills on a simulated Fedora system.

You have a directory called <b>lab-01/</b> in your home folder containing three files:
<br>• <b>broken_backup.sh</b> — a shell script that will not run (two problems to fix)
<br>• <b>network.conf</b> — a configuration file that needs several values changed
<br>• <b>sysinfo.sh</b> — a working information-gathering script

Work through the steps below in order. Each step is checked automatically.`,
    steps: [
      /* ---- Part 1: Navigation & inspection ---- */
      { id:'s1', section:'Part 1 — Navigation & Inspection',
        desc:'Navigate into the lab-01 directory.',
        check: sh => sh.cwd === '/home/student/lab-01',
        hint:'cd lab-01', teach:'cd' },
      { id:'s2',
        desc:'List the files in long format to see permissions, sizes, and dates.',
        check: (sh,l) => /^ls\s+.*-[a-zA-Z]*l/.test((l||'').trim()) && sh.cwd === '/home/student/lab-01',
        hint:'ls -l', teach:'ls_l' },
      { id:'s3',
        desc:'Read the contents of broken_backup.sh to spot what is wrong.',
        check: (sh,l) => /^cat\s+.*broken_backup\.sh/.test((l||'').trim()),
        hint:'cat broken_backup.sh', teach:'cat' },

      /* ---- Part 2: Fix the broken script ---- */
      { id:'s4', section:'Part 2 — Fix the Broken Script',
        desc:'The shebang on line 1 says "bsh" instead of "bash". Fix it in place with sed.',
        check: sh => {
          const n = sh.node('/home/student/lab-01/broken_backup.sh');
          return n && /^#!.*\bbash\b/.test(n.content);
        },
        hint:"sed -i 's/bsh/bash/' broken_backup.sh", teach:'sed_i' },
      { id:'s5',
        desc:'The script is not executable. Add execute permission for the owner.',
        check: sh => {
          const n = sh.node('/home/student/lab-01/broken_backup.sh');
          return n && !!(n.mode & 0o100);
        },
        hint:'chmod u+x broken_backup.sh', teach:'chmod_ux' },
      { id:'s6',
        desc:'Verify: show just the first line of broken_backup.sh to confirm the shebang.',
        check: (sh,l) => /^head\s+(-n\s*1|-1)\s+.*broken_backup\.sh/.test((l||'').trim()),
        hint:'head -n 1 broken_backup.sh', teach:'head' },

      /* ---- Part 3: Edit network.conf ---- */
      { id:'s7', section:'Part 3 — Edit network.conf',
        desc:'Before editing, back up network.conf by copying it to network.conf.bak.',
        check: sh => !!sh.node('/home/student/lab-01/network.conf.bak'),
        hint:'cp network.conf network.conf.bak', teach:'cp' },
      { id:'s8',
        desc:'Use grep to find which line in network.conf sets the port.',
        check: (sh,l) => /^grep\s+.*port\s+.*network\.conf/.test((l||'').trim()) || /^grep\s+.*port\s/.test((l||'').trim()),
        hint:'grep port network.conf', teach:'grep' },
      { id:'s9',
        desc:'Change the port from 3000 to 8080 in network.conf, editing in place.',
        check: sh => {
          const n = sh.node('/home/student/lab-01/network.conf');
          return n && /port=8080/.test(n.content) && !/port=3000/.test(n.content);
        },
        hint:"sed -i 's/3000/8080/' network.conf", teach:'sed_i' },
      { id:'s10',
        desc:'Change max_retries from 50 to 3 in network.conf, editing in place.',
        check: sh => {
          const n = sh.node('/home/student/lab-01/network.conf');
          return n && /max_retries=3\b/.test(n.content) && !/max_retries=50/.test(n.content);
        },
        hint:"sed -i 's/50/3/' network.conf", teach:'sed_i' },
      { id:'s11',
        desc:'Verify: use grep to confirm the port is now 8080.',
        check: (sh,l) => /^grep\s+.*8080\s+.*network\.conf/.test((l||'').trim()) || /^grep\s+.*port\s+.*network\.conf/.test((l||'').trim()),
        hint:'grep 8080 network.conf', teach:'grep' },
      { id:'s12',
        desc:'Count how many lines are in network.conf.',
        check: (sh,l) => /^wc\b.*network\.conf/.test((l||'').trim()),
        hint:'wc -l network.conf', teach:'wc' },

      /* ---- Part 4: Pipelines & redirection ---- */
      { id:'s13', section:'Part 4 — Pipelines & Redirection',
        desc:'Pipe ls /var/log into wc -l to count how many entries the log directory holds.',
        check: (sh,l) => /^ls\s+\/var\/log\s*\|\s*wc/.test((l||'').trim()),
        hint:'ls /var/log | wc -l', teach:'pipe' },
      { id:'s14',
        desc:'Use a pipe: run ps aux and pipe it into grep to find sshd.',
        check: (sh,l) => /^ps\s+aux\s*\|\s*grep\s+sshd/.test((l||'').trim()),
        hint:'ps aux | grep sshd', teach:'pipe' },
      { id:'s15',
        desc:'Write the text "Lab 01 complete" into a new file called report.txt using output redirection.',
        check: sh => {
          const n = sh.node('/home/student/lab-01/report.txt');
          return n && /Lab 01 complete/.test(n.content);
        },
        hint:"echo 'Lab 01 complete' > report.txt", teach:'redir' },
      { id:'s16',
        desc:'Run sysinfo.sh and send its output into a file called sysinfo_output.txt.',
        check: sh => !!sh.node('/home/student/lab-01/sysinfo_output.txt'),
        hint:'./sysinfo.sh > sysinfo_output.txt', teach:'redir' },
      { id:'s17',
        desc:'Use printf with command substitution to print: User: student',
        check: (sh,l) => /^printf\b/.test((l||'').trim()) && /\$\(whoami\)/.test(l||''),
        hint:'printf \'User: %s\\n\' "$(whoami)"', teach:'printf' },

      /* ---- Part 5: Final test ---- */
      { id:'s18', section:'Part 5 — Run the Repaired Script',
        desc:'Everything should be fixed. Run broken_backup.sh to prove it works.',
        check: (sh,l) => /\.\/broken_backup\.sh|lab-01\/broken_backup\.sh/.test((l||'').trim()),
        hint:'./broken_backup.sh', teach:'script' }
    ],
    xp: 60,
    teach: ['cd','ls_l','cat','sed_i','chmod_ux','head','cp','grep','wc','pipe','redir','printf','script']
  }
];

const labsFor = num => LABS.filter(l => l.mod === num);
const LAB_BY_ID = Object.fromEntries(LABS.map(l => [l.id, l]));
