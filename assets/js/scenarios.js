/* =====================================================================
   Scenario challenges — open-ended troubleshooting graded by end state.
   Multiple valid paths to the answer.
   ===================================================================== */

const SCENARIOS = [
  {
    id: 'sc1', mod: 1, difficulty: 1,
    title: 'The broken script',
    description: 'A developer left a script at ~/debug/run.sh that is supposed to print "Build complete" but it will not run. Figure out what is wrong and fix it so it runs successfully.',
    setup(sh) {
      const home = sh.node('/home/student');
      home.children.debug = dir(0o755, {
        'run.sh': file("#!/usr/bin/env bsh\necho 'Build complete'\n", 0o644, USER, 55)
      });
    },
    checks: [
      { desc: 'Shebang says bash, not bsh',
        test: sh => { const n = sh.node('/home/student/debug/run.sh'); return n && /^#!.*\bbash\b/.test(n.content); } },
      { desc: 'Script is executable',
        test: sh => { const n = sh.node('/home/student/debug/run.sh'); return n && !!(n.mode & 0o111); } },
      { desc: 'Script was run successfully',
        test: sh => sh.log.some(l => /\.\/run\.sh|debug\/run\.sh/.test(l)) }
    ],
    hints: [
      'Start by reading the script: cat debug/run.sh',
      'Look at line 1 — the shebang. Is the interpreter name correct?',
      'Fix the shebang with sed, then make it executable with chmod.'
    ],
    teach: ['cat', 'chmod_ux']
  },

  {
    id: 'sc2', mod: 1, difficulty: 1,
    title: 'Lock it down',
    description: 'A sensitive file ~/secrets/credentials.txt is world-readable (mode 666). Lock it down so only the owner can read and write it (mode 600).',
    setup(sh) {
      const home = sh.node('/home/student');
      home.children.secrets = dir(0o755, {
        'credentials.txt': file("api_key=sk_live_abc123\ndb_password=hunter2\n", 0o666, USER, 55)
      });
    },
    checks: [
      { desc: 'File permissions are 600 (owner read+write only)',
        test: sh => { const n = sh.node('/home/student/secrets/credentials.txt'); return n && (n.mode & 0o777) === 0o600; } }
    ],
    hints: [
      'Check the current permissions with ls -l secrets/',
      'Use chmod to change the mode. 600 means owner read+write, no one else gets anything.',
      'Try: chmod 600 secrets/credentials.txt'
    ],
    teach: ['chmod_octal']
  },

  {
    id: 'sc3', mod: 1, difficulty: 2,
    title: 'Find and stop the rogue process',
    description: 'Something called "cryptominer" is running in the background and eating CPU. Find it and kill it.',
    setup(sh) {
      sh.jobs.push({ n: 1, pid: 9999, cmd: 'cryptominer --stealth', state: 'Running' });
      sh.nextJob = 2;
    },
    checks: [
      { desc: 'The cryptominer process has been killed',
        test: sh => !sh.jobs.some(j => j.cmd.includes('cryptominer') && j.state === 'Running') }
    ],
    hints: [
      'Use ps aux or jobs to find running processes.',
      'Look for something suspicious in the process list.',
      'Use kill with the job number or PID: kill %1 or kill 9999'
    ],
    teach: ['ps_aux', 'kill']
  },

  {
    id: 'sc4', mod: 1, difficulty: 2,
    title: 'Organize the mess',
    description: 'Someone dumped files into ~/mess/. Sort them: move .txt files into ~/mess/docs/, .sh files into ~/mess/scripts/, and everything else into ~/mess/other/.',
    setup(sh) {
      const home = sh.node('/home/student');
      home.children.mess = dir(0o755, {
        'readme.txt': file('Read me first.\n', 0o644, USER, 55),
        'setup.sh': file('#!/bin/bash\necho setup\n', 0o755, USER, 55),
        'data.csv': file('a,b,c\n1,2,3\n', 0o644, USER, 55),
        'notes.txt': file('Important notes.\n', 0o644, USER, 55),
        'deploy.sh': file('#!/bin/bash\necho deploy\n', 0o755, USER, 55),
        'photo.jpg': file(JPG_MAGIC, 0o644, USER, 55)
      });
    },
    checks: [
      { desc: 'docs/ directory exists',
        test: sh => { const n = sh.node('/home/student/mess/docs'); return n && n.type === 'dir'; } },
      { desc: 'scripts/ directory exists',
        test: sh => { const n = sh.node('/home/student/mess/scripts'); return n && n.type === 'dir'; } },
      { desc: 'other/ directory exists',
        test: sh => { const n = sh.node('/home/student/mess/other'); return n && n.type === 'dir'; } },
      { desc: '.txt files moved to docs/',
        test: sh => {
          const d = sh.node('/home/student/mess/docs');
          return d && d.children['readme.txt'] && d.children['notes.txt'];
        } },
      { desc: '.sh files moved to scripts/',
        test: sh => {
          const d = sh.node('/home/student/mess/scripts');
          return d && d.children['setup.sh'] && d.children['deploy.sh'];
        } },
      { desc: 'Other files moved to other/',
        test: sh => {
          const d = sh.node('/home/student/mess/other');
          return d && d.children['data.csv'] && d.children['photo.jpg'];
        } }
    ],
    hints: [
      'First create the directories: mkdir docs scripts other (from inside mess/)',
      'Move files by pattern: mv *.txt docs/',
      'Move the remaining files with mv *.csv *.jpg other/'
    ],
    teach: ['mkdir', 'mv']
  },

  {
    id: 'sc5', mod: 1, difficulty: 2,
    title: 'Config repair',
    description: 'The server config at ~/config/server.conf has the wrong port (should be 8080, not 3000) and debug mode is off (should be on). Fix both values without replacing the whole file.',
    setup(sh) {
      const home = sh.node('/home/student');
      home.children.config = dir(0o755, {
        'server.conf': file('# Server configuration\nhost=0.0.0.0\nport=3000\nmax_connections=100\ndebug=false\nlog_level=info\n', 0o644, USER, 55)
      });
    },
    checks: [
      { desc: 'Port changed from 3000 to 8080',
        test: sh => { const n = sh.node('/home/student/config/server.conf'); return n && /port=8080/.test(n.content) && !/port=3000/.test(n.content); } },
      { desc: 'Debug mode set to true',
        test: sh => { const n = sh.node('/home/student/config/server.conf'); return n && /debug=true/.test(n.content) && !/debug=false/.test(n.content); } }
    ],
    hints: [
      'Read the file first: cat config/server.conf',
      'Use sed -i to change values in place.',
      "Try: sed -i 's/3000/8080/' config/server.conf"
    ],
    teach: ['cat', 'sed_i']
  }
];

const scenariosFor = num => SCENARIOS.filter(s => s.mod === num);
