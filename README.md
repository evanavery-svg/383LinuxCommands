# sudo LEARN — a Linux command trainer

**v0.1** · &copy; 2026 Avery LLC. All rights reserved.

A browser game for learning and drilling the Linux command line, built for a
383 Linux commands class. The course is planned as **seven modules**;
**Module 1 — Linux Fundamentals** is loaded in full: **221 commands, flags and
keystrokes** across nine topics, from `pwd` all the way through Vim's
command-line mode.

Everything runs client-side. No build step, no dependencies, no server.

See [CHANGELOG.md](CHANGELOG.md) for release history — it is also readable
in-app from the **changelog** link in the page footer.

## What is in it

**Learn** — every topic is split into short lessons, and every lesson into
*sets* of bite-sized cards. One idea per card: the command, what it does in plain
English, a worked example with realistic output, and a "Remember" line that gives
you a hook for it (`-h` only matters with `-l`, because only long format prints
sizes). Finish a set and you get a quick check on exactly those cards — nothing
you have not just seen. Set size is adjustable (3 / 5 / 8 cards) with the **bite**
chip in the title bar; drop it to 3 for a topic that is brand new to you.

**Drill** — adaptive questions. A command you have never met arrives as multiple
choice; once you are getting it right, the game stops offering options and makes
you type it from a blank prompt. Flag order does not matter, so `ls -lh` and
`ls -hl` both pass. Every wrong answer sinks that command down a level so it comes
back sooner.

**Review** — a Leitner spaced-repetition queue. The home screen tells you how many
commands are about to fade and drills only those.

**Terminal** — a working simulated Fedora box with a real virtual filesystem,
permissions, ownership, jobs and signals. `ls -ltr`, `chmod u+s`, `cp -r`,
`ln -s`, `ps aux`, `xload &`, `kill -9 %1`, `man 5 passwd` all behave the way they
should, including the error messages. 55 missions are checked against what
actually happened to the filesystem, not against the text you typed — so any
correct route counts. `cat` a binary and the screen really does fill with garbage
until you run `reset`.

**Reference** — all 221 entries, searchable by command, description, flag or
example, each showing your mastery bar.

**Progress** — XP, rank (Guest → root), day streak, accuracy, a 35-day activity
heatmap, mastery per topic, and your current weakest commands with a one-click
drill for them. Export/import your save as JSON.

## Themes

Six, cycled with the **theme** chip: Matrix green, Amber CRT, Ubuntu, Dracula,
Nord, and a light Paper theme for bright rooms. CRT scanlines can be switched off
in settings. The whole thing is styled as a terminal emulator — window chrome,
tabs, prompt lines, and an htop-style status bar.

## Keyboard

| Key | Does |
|---|---|
| `1`–`6` | switch tabs |
| `1`–`4` | pick a multiple-choice answer |
| `Enter` | next card / next question |
| `Esc` | back out of a lesson, quiz or modal |
| `↑` `↓` | command history in the terminal |
| `Ctrl-L` | clear the terminal |

## Running it

Open `index.html` — that is all. Or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

### GitHub Pages

Push this repository, then in **Settings → Pages** set *Source* to
**Deploy from a branch** and pick the branch with these files, folder `/ (root)`.
The site appears at `https://<username>.github.io/<repo>/` after a minute.
`.nojekyll` is included so Jekyll leaves the `assets/` folder alone.

## Modules

| Module | Status | Contents |
|---|---|---|
| 1 — Linux Fundamentals | **loaded** | the nine topics listed below (221 bites, 55 missions) |
| 2–7 | not added yet | shown as locked placeholders in the Learn tab |

### Module 1 — topics covered

| Topic | Contents |
|---|---|
| Navigation & Listing | `pwd`, `cd` and its forms, `ls` with `-a -A -d -F -h -l -r -S -t --reverse` |
| Files & Directories | `cp`, `mv`, `mkdir`, `rmdir`, `rm`, `ln` and their flags |
| Viewing & Inspecting | `cat`, `less` (and its navigation keys), `head`, `tail`, `file`, `wc`, `reset` |
| Permissions & Users | `id`, `chmod` octal + symbolic + special bits, `umask`, `chown`, `chgrp`, `su`, `sudo`, `passwd`, user and group administration, `lastlog` |
| Processes & Jobs | `ps`, `top`, `htop`, `jobs`, `bg`, `fg`, `&`, `kill` and 11 signals, `killall`, `nice`, `renice`, `nohup`, `pstree`, `vmstat`, `xload`, `tload`, `Ctrl-c`, `Ctrl-z`, power commands |
| Identity & Help | `type`, `which`, `help`, `--help`, `man` with sections, `apropos`, `whatis`, `info`, `alias` |
| Environment & Packages | `env`, `echo`, `$HOME`, `dnf` |
| The Vim Editor | modes, movement, insert/append, editing, yank & put, undo/search, command-line mode, buffers, substitution, `vimtutor` |
| Bash Editing Modes | `set -o vi`, `set -o emacs` |

## Adding the next module

1. Add the new topics to `CURRICULUM` in `assets/js/data.js`, each tagged
   `mod: <n>` next to its `id`, `name` and `icon`.
2. Flip that module's `ready` flag to `true` in `MODULES` (same file), with a
   real name and blurb.
3. Add its terminal missions in `assets/js/missions.js` with `mod: <n>`.
4. Add a `CHANGELOG` entry at the top of the array in `data.js`, bump `VERSION`,
   and mirror it in `CHANGELOG.md`.

Every screen reads from `MODULES`, so the new module shows up on its own.

## Files

```
index.html              page shell, boot screen and footer
assets/css/style.css    six themes, terminal chrome, responsive layout
assets/js/data.js       version, changelog, module registry, and the
                        curriculum: Module 1's 9 topics, 32 lessons, 221 bites
assets/js/vfs.js        virtual filesystem + shell (about 60 commands)
assets/js/missions.js   55 Module 1 terminal missions, state-based checking
assets/js/app.js        game engine: chunking, quizzes, spaced repetition, UI
```

Progress is stored in your browser's `localStorage` under `sudolearn.v1`.
Nothing leaves the machine.

---

&copy; 2026 Avery LLC. All rights reserved.
