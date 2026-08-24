# PATHfinder — a Linux command trainer

**v0.11** · &copy; 2026 Avery LLC. All rights reserved.

A browser game for learning and drilling the Linux command line, built for a
383 Linux commands class. The course is planned as **seven modules**;
**Module 1 — Linux Fundamentals** is loaded in full: **221 commands, flags and
keystrokes** across nine topics, from `pwd` all the way through Vim's
command-line mode.

Everything runs client-side. No build step, no dependencies, no server.

See [CHANGELOG.md](CHANGELOG.md) for release history — it is also readable
in-app from the **changelog** link in the page footer.

## What is in it

**Home** is deliberately bare: just the list of modules. Click one and its own
page opens with everything else — what is next, your progress, practice options
and the topic grid.

**The path** — a module is laid out as a line of numbered steps, grouped by
topic. Each step is one short set of cards. The next step is highlighted and
pulsing, and topics unlock in turn so there is always exactly one obvious thing to
do. (Settings has a **free roam** switch if you would rather jump around.)

Finished steps show **your score** rather than a tick: 100% fills the circle in,
50–99% leaves it outlined, below 50% turns it amber. Scores keep your best result,
so retrying a set only ever pushes it up — which makes turning a path of 60s and
80s into a wall of 100s something to chase.

**The ★ bonus round** — clear every set in a topic and one more step opens at the end of
that row: the *whole topic in one sitting*. Not a sample — every command in it, plus that
topic's build challenges. Navigation & Listing is 23 questions, Permissions & Users 42,
Processes & Jobs 48, Vim 71. Finishing five sets of three at a time is not the same as
knowing the topic, and this is where you find out which.

It is a **bonus**, so it is not counted in the topic's "5/5 sets" and never moves the topic
percentage — it keeps its own best score on its own bubble. A 71-question round is a long
sitting, so it looks after you: switch tabs or press `Esc` and the attempt is parked, with
the bubble offering to *resume · 8 of 71 answered*. Only the ✕ discards it, and it asks first.

**Every set opens with a briefing** — before the first card you get the lesson's one-line
idea, the **commands in that set** with what each one does, and **"when you would actually
use this"**: a worked terminal transcript of the moment you would reach for them. The log
has just rolled and you need the newest file; the script will not run; the port changed in
forty places. You see the shape before the detail instead of meeting each command cold.
Enter starts the set, and briefings can be switched off in settings.

**Learn** — one idea per card: the command, one plain sentence saying what it
does, a worked example with realistic output, and a "Remember" hook (`-h` only
matters with `-l`, because only long format prints sizes). **Every one of the 221 entries
has an example** — and for a keystroke that means a before → press → after demo, because
`dd` has no `$ dd` to show:

```
cursor on line 2
BEFORE  one / two / three
PRESS   dd
AFTER   one / three
```

Then you **type it yourself** at a prompt on the card before moving on — reading a command and
typing one are different skills, and only one of them is what you do in a real
shell. Get it wrong twice and it shows you the exact text to copy; there is a
skip link if you would rather just read.

Finish a set and you get a quick check on exactly those cards — nothing you have
not just seen — with **Retry all** and **Retry just the missed ones** at the end.
Set size is adjustable (2 / 3 / 5 / 8 cards, default 3) with the **bite** chip in
the title bar. Completion is tracked per card, so changing the size never loses
your place.

**Drill** — adaptive questions. A command you have never met arrives as multiple
choice; once you are getting it right, the game stops offering options and makes
you type it from a blank prompt. Flag order does not matter, so `ls -lh` and
`ls -hl` both pass. Every wrong answer sinks that command down a level so it comes
back sooner.

**Stuck on a typed answer?** There is a **💡 Hint** button, in two tiers: first the topic
it came from and the *shape* of the answer with the part you have to remember dotted out
(`ls -ltr` shows as `ls -···`), then the Remember note from its card. It is honest about
the price — a hint marks that question as a miss, and says so before you press it, so it
comes back around instead of quietly counting as known. Get it right after a hint and you
still get a ✓; it just tells you it counts as a miss. There are no hints in the mock exam.

**Build the command** — instead of "what does `-t` do", you get a goal and write the whole
line. Graded by outcome: your command and a model answer each run in their own throwaway
shell and the results are compared, so any line that genuinely achieves the goal passes and
flag order never matters. 36 challenges across Module 1.

**Mock exam** — a timed paper under exam conditions: typed answers only, no multiple choice,
no hint button, no feedback until you hand it in. Skip a question and it returns at the end.
The report grades you, ranks your topics worst-first, shows every miss next to what you wrote,
and drills them in one click. Past papers are kept so you can watch the score climb.

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
example — including the keystroke demos, so searching *delete a word* finds `dW` — each
showing your mastery bar.

**Two different numbers, kept apart.** Your **score** — on topic cards, the module
header and the Progress tab — is the average of your set scores, so finishing every set
in a topic at 100% reads 100%. (The ★ bonus round is deliberately outside that sum, which
is why taking one cannot knock a finished topic off 100%.) **Retention**, on the Progress tab, is the
spaced-repetition depth: a command climbs one of five levels each time you get it right,
so it fills slowly and is what the Review queue uses to decide what is fading.

**Progress** — XP, rank (Guest → root), day streak, accuracy, a 35-day activity
heatmap, score by module, retention by topic, and your current weakest commands with a
one-click drill for them. Export/import your save as JSON, or wipe it: Settings →
*Your progress* → **Wipe all progress** confirms first, offers a backup, and keeps
your theme and preferences.

**Keeping you coming back** — 16 badges to unlock, a combo bonus for correct
answers in a row, and a daily XP goal (50 / 100 / 200) shown as a ring on the
module page.

## On a phone

Built to be used one-handed on the bus, not just checked at a phone width:

- **Add it to your home screen** and it opens fullscreen with its own icon, no
  browser bars, and a status bar tinted to match your theme.
- Typing never zooms the page — inputs are 16px on touch, with autocorrect and
  autocapitalise off and a **Go** key on the keyboard.
- The tab bar is one sideways-scrolling row, the title bar collapses to a single
  settings gear, and the learn card's **Got it** button stays pinned under your
  thumb.
- The Terminal tab puts the **mission goal first**, collapses the mission list,
  and adds a row of shortcut keys — `- / ~ . * $ | > & % + :` — above the keyboard,
  so `ls -ltr /var/log` is realistic to type without hunting through symbol layers.
- Every button, tab and row is a proper tap target, and taps don't leave things
  stuck in a hover state.

Desktop is unchanged — all of the above sits behind pointer, hover or width
queries.

## Themes

Six, cycled with the **theme** chip: Matrix green, Amber CRT, Ubuntu, Dracula,
Nord, and a light Paper theme for bright rooms. CRT scanlines can be switched off
in settings. The whole thing is styled as a terminal emulator — window chrome,
tabs, prompt lines, and an htop-style status bar.

## Keyboard

| Key | Does |
|---|---|
| `1`–`6` | switch tabs |
| `Esc` | step back out (card → path → module → home); parks a topic review rather than losing it |
| `1`–`4` | pick a multiple-choice answer |
| `Enter` | check what you typed / next question / next set from the results screen |
| `↑` `↓` | command history in the terminal |
| `Ctrl-L` | clear the terminal |

On a touch device the shortcut row above the terminal keyboard inserts
`-` `/` `~` `.` `*` `$` `|` `>` `&` `%` `+` `:` and space at the cursor.

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
index.html              page shell, boot screen, install meta and footer
manifest.webmanifest    add-to-home-screen manifest
assets/icons/           app icons (192, 512, apple-touch)
assets/css/style.css    six themes, terminal chrome, responsive + touch layout
assets/js/data.js       version, changelog, module registry, and the
                        curriculum: Module 1's 9 topics, 32 lessons, 221 bites
assets/js/vfs.js        virtual filesystem + shell (about 60 commands)
assets/js/missions.js   55 Module 1 terminal missions, state-based checking
assets/js/challenges.js 36 build-the-command challenges, graded by outcome
assets/js/app.js        game engine: chunking, quizzes, spaced repetition, UI
```

Progress is stored in your browser's `localStorage` under `pathfinder.v1`.
Nothing leaves the machine.

---

&copy; 2026 Avery LLC. All rights reserved.
