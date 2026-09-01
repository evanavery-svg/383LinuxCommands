# Changelog

All notable changes to PATHfinder are recorded here. This file mirrors the
in-app changelog (the **changelog** link in the page footer); the source of
truth for that is the `CHANGELOG` array at the top of `assets/js/data.js`.

The course is planned as **seven modules**. Each release note says which module
it adds.

Versions follow `MAJOR.MINOR`: a new module bumps the minor number, fixes and
tweaks get a patch suffix.

---

## [0.28] — 2026-09-01

### Lab checklist keeps the active step in view

- Fixed: completing a lab step reset the checklist scroll to the top, forcing you to scroll back down to see the current step every time.
- The checklist now auto-scrolls so the active step stays visible after each step is checked off.

---

## [0.27] — 2026-09-01

### Fix lab hint button visibility

- Fixed: the lab Hint button could get scrolled far out of view on labs with many steps, since it sat below the entire step checklist inside a small scrolling panel.
- The step checklist now scrolls in its own area while the Hint and Exit lab buttons stay pinned and always visible.
- Fixed: the lab description was showing raw HTML tags instead of rendering bold text and line breaks.

---

## [0.26] — 2026-08-31

### Labs tab, interactive Vim, better hints

- Labs now have their own top-level tab between Terminal and Reference.
- The Labs tab shows a lab picker when no lab is active, with progress bars and completion status for each lab.
- Starting a lab opens a dedicated terminal with the lab step checklist in the sidebar.
- Lab-specific code removed from the Terminal tab — Terminal is now purely for missions and scenarios.
- Interactive Vim editor: open files with `vim`/`vi`, edit in normal/insert/command modes, save back to the filesystem.
- Vim supports hjkl navigation, i/a/o/O/A/I insert, dd/x/J/r editing, `:w`/`:q`/`:wq`/`:q!` commands, line numbers, and cursor display.
- Lab step hints now appear inline beneath the active step when the Hint button is clicked, with the exact command highlighted.

## [0.25] — 2026-08-31

### Labs — standalone lab simulations

- Labs are now fully independent simulations, separate from terminal missions and scenarios.
- Lab 01 runs in its own shell with a step-by-step sidebar showing section headers, progress bar, hint button, and live checkmarks.
- Lab missions (m56-m73) no longer appear in the terminal mission list — they belong to the lab system.
- Scenario 1 replaced: "The missing log" (deploy script typo) replaces the old broken-script scenario that overlapped with Lab 01.

## [0.24] — 2026-08-31

### Module 2 — Version Control with Git

- New: Module 2 adds 7 topics and 15 lessons covering git config, init, clone, status, add, commit, branching, merging, merge conflicts, remotes, push/pull/fetch, log, diff, stash, tags, .gitignore, and pull request workflows.
- New: 50+ flashcard items for Git commands with examples, memory notes, and accepted answer variants.
- New: 30 missions for Module 2 (m74–m103) across 6 tours: Git setup, Staging & committing, Branching & merging, Remotes & collaboration, History & diffs, Stashing & tagging.
- New: 18 build-the-command challenges for Module 2 (c43–c60).
- New: Simulated `git` command in the terminal — all major git subcommands produce realistic output.
- File tree improved: click a directory to expand/collapse it freely. Double-click to cd into it. Directories on the path to cwd auto-expand. Arrow indicators show open/closed state.
- File tree depth increased from 5 to 8 levels.

---

## [0.23] — 2026-08-31

### Everything unlocked

- All content is now fully accessible from the start — no progression gates, no locked topics, no sequential unlocking.
- The mission list now shows tour headers (e.g. "Lab 01") so you can quickly find and jump to any mission group.
- Removed the "Free roam" toggle from settings — free roam is now always on.
- Empty placeholder modules are hidden instead of showing lock icons.

## [0.22] — 2026-08-31

### Added
- **Interactive man pages** — `man` pages are now interactive pagers with real
  keyboard navigation. Space/b to page, j/k to scroll, g/G to jump.
- Press `/` to search within the man page — matches are highlighted. Use `n`/`N`
  to cycle through matches.
- Man pages now show full DESCRIPTION, all OPTIONS with notes, and SEE ALSO.
- A status bar shows current line and scroll percentage, like the real `less` pager.

---

## [0.21] — 2026-08-31

### Added
- **Mission replay & par score** — every mission now has a par score (fewest
  commands for the ideal solution).
- On solving a mission, you see your command count vs. par. Achieve par or
  fewer for a "(par!)" tag.
- The mission list shows your score alongside par for every solved mission.

---

## [0.20] — 2026-08-31

### Added
- **"Explain this command" mode** — type `explain ls -ltrS /var/log` to get a
  token-by-token breakdown of any command line.
- Click any command in your terminal history to explain it (history lines are
  now clickable).
- Flags like `-ltr` are split into individual flags and each is looked up
  separately. Pipes, redirects, and background operators are explained too.

---

## [0.19] — 2026-08-31

### Added
- **Reverse history search (Ctrl+R)** — press Ctrl+R in the terminal to search
  your command history, just like real bash.
- Type any fragment and the most recent matching command appears. Press Ctrl+R
  again to cycle through older matches.
- Press Enter to execute the match, Escape or Ctrl+G to cancel, or an arrow key
  to accept the match and edit it.

---

## [0.18] — 2026-08-31

### Added
- **Scenario challenges** — 5 open-ended troubleshooting tasks with multiple valid
  solutions. Fix a broken script, lock down permissions, kill a rogue process,
  organize scattered files, and repair a server config.
- Each scenario sets up a realistic situation on a fresh filesystem. A live checklist
  in the sidebar tracks your progress as you work.
- Progressive hints available if you get stuck, revealed one at a time.
- Completing a scenario awards 40 XP and credits relevant commands to your mastery.
- Access from the **Scenarios** button in the terminal tab.

---

## [0.17] — 2026-08-31

### Added
- **Exportable study guide** — generate a printable cheat sheet from the Progress tab.
  Two options: "Weak spots guide" focuses on commands you struggle with, "Full
  reference sheet" covers everything.
- The guide opens in a new tab as a clean, print-optimized page. Use Ctrl+P / Cmd+P
  to print or save as PDF.
- Content includes command, description, example, and memory note — grouped by topic.

---

## [0.16] — 2026-08-31

### Added
- **Filesystem tree visualization** — a live directory tree sidebar in the terminal.
  Click "File tree" to toggle between the mission panel and a collapsible directory tree.
- The tree highlights your current directory and auto-expands the path to it. Click
  any directory to navigate there.
- Directories show open/closed folder icons, files show document icons, and
  executables are highlighted in green. Updates in real time.

---

## [0.15] — 2026-08-31

### Added
- **Tab completion** — press Tab in the terminal to autocomplete commands and file
  paths, just like a real shell.
- First token: completes command names. Later tokens: completes file and directory paths.
- Directories get a trailing slash; single matches auto-insert a space. Multiple
  matches show all candidates and insert the common prefix.

---

## [0.14] — 2026-08-31

### Added
- **Glob and wildcard expansion** in the shell. Patterns like `*.txt`, `file?`, and
  `[a-c]*` now expand against the virtual filesystem.
- Works transparently with all commands: `ls *.sh`, `cat Documents/*.txt`, etc.
- Quoted patterns are not expanded, matching real bash behaviour.
- Dotfiles are hidden from glob matches unless the pattern starts with a dot.

---

## [0.13] — 2026-08-30

### Added
- **Lab 01** — an 18-mission guided lab inside the terminal. Fix a broken script,
  edit config files with grep and sed, build pipelines with pipes, redirect output
  to files, and use command substitution.
- **Pipes** (`cmd | cmd`), **output redirection** (`cmd > file`), **command
  substitution** (`$(cmd)`), and **script execution** (`./script.sh`) in the
  simulated shell.
- New commands: `grep` (with `-i`, `-n`, `-c`, `-v`), `sed` (`s/old/new/` with
  `-i`), `printf` (`%s`, `%d`, `\n`), and `sleep`.
- 6 new build-the-command challenges for the Lab 01 topic.
- Lab 01 topic added to the Module 1 curriculum.

---

## [0.12] — 2026-08-27

### Added
- **Sync to another device.** One tap generates a link that carries your entire save —
  compressed, encoded, and tucked into the URL fragment so nothing hits the server. Open
  the link on your phone, laptop or any other browser and choose **Replace** or **Merge**.
- **Merge** keeps the best of both sides: the higher XP, the better scores, the union of
  badges and missions, and the stronger mastery box for every command.
- On a phone the link opens the native share sheet (AirDrop, Messages, etc.); on desktop
  it copies to the clipboard.
- **Download save file** and **Load from file** replace the old clipboard-only export and
  import. Your save downloads as a timestamped `.json` file you can keep anywhere.
- A **Download backup** button is now in Settings too, alongside Copy a backup.

### Notes
- The sync link uses the `#` fragment, which browsers never send to the server — your
  progress stays between your own devices. The data is deflate-compressed and base64-encoded.
- Nothing about the save format has changed. Old saves, old exports and the clipboard
  buttons all still work.

---

## [0.11] — 2026-08-24

### Added
- **A briefing before every set.** It opens with the lesson's one-line idea, then lists the
  **commands in that set** with what each one does — so you see the shape before the detail
  instead of meeting each command cold. Enter starts the set.
- **“When you would actually use this”** — a worked terminal transcript on every briefing,
  one per lesson, all 32 written from scratch. Not what a command *means* but the moment you
  reach for it: the log has just rolled, the script will not run, the port changed in forty
  places. Shown in full on a lesson's first set, collapsed behind a summary after that.
- **An example on every single entry.** 98 of the 221 had none. Commands got a real example
  with realistic output; the **83 keystrokes** got a **before → press → after** demo, which is
  what an example honestly means for a keystroke:

  ```
  cursor on line 2
  BEFORE  one / two / three
  PRESS   dd
  AFTER   one / three
  ```
- Keystroke demos are searchable in the **Reference** tab too.
- **Set briefings: on/off** in ⚙ settings, next to Free roam.

### Fixed
- The one-line `brief` written for each of the 32 lessons — and the CSS to style it — had
  been in the project since the first release and was **never rendered anywhere**. It is now
  the first thing you read in each set.

### Notes
- The briefing is reading, not answering: it scores nothing, marks nothing learned, and does
  not even write to your save.
- The scenarios and examples here were written for this app, **not by your instructor** —
  worth checking anything that matters against your own course notes.

---

## [0.10] — 2026-08-24

### Added
- **Hints on the questions you type.** Both *"type the command that…"* and **Build the
  command** now have a **💡 Hint** button. Two tiers, weakest first:
  1. where it comes from — the topic and lesson — plus the **shape** of the answer, with
     the part you have to remember dotted out (`ls -ltr` shows as `ls -···`);
  2. the **Remember** note from that command's card.
  For a build challenge the tiers are the commands it is made from, then a masked route.
- The version and **© Avery LLC** now appear on the **boot screen**, bottom right, the way
  a BIOS screen carries them. Read from `VERSION` at runtime, so it cannot go stale.

### Notes
- **A hint costs you the mark.** Taking one scores that question as a miss: it lands on
  *worth another look*, breaks your combo and comes back sooner. The button says so before
  you press it. Type it right afterwards and you still get a ✓ — the verdict just says
  plainly that it counts as a miss.
- A hinted miss can never pull down a set score you have already earned on the path.
- **The mock exam has no hints**, on purpose — that is what exam conditions are.
- The learn card is unchanged: it already shows you the exact text after two wrong tries.

---

## [0.9] — 2026-08-24

### Added
- **The ★ bonus round.** Clear every set in a topic and one more step opens at the end of that
  row: **every command in the topic in one sitting**, instead of three at a time. Each topic's
  build-the-command challenges are folded in too.
- It really is all of them — **23** questions for Navigation & Listing, 27 for Files &
  Directories, 20 for Viewing & Inspecting, **42** for Permissions & Users, **48** for
  Processes & Jobs, 17 for Identity & Help, 7 for Environment & Packages, **71** for Vim,
  2 for Bash Editing Modes.
- New badge — **Full sweep**, for scoring 100% on a whole-topic review.

### Changed
- Long rounds now survive you. Switch tabs or press `Esc` mid-review and the attempt is
  **parked**, not thrown away — the bubble offers to *resume · 8 of 71 answered*. Leaving by
  the ✕ asks first, once there is something to lose.

### Notes
- The review is a **bonus**: it is not counted in a topic's "5/5 sets", and it never changes
  the topic's percentage or the module score. It keeps its own best score on its own bubble,
  and like set scores it only ever climbs — a worse retake cannot pull it down.
- Retrying only the questions you missed deliberately does *not* set the review score;
  five missed questions answered right is not 100% of a topic.

---

## [0.8] — 2026-08-20

### Added
- **Build the command.** A new question type that gives you a goal — *"list /var/log in long
  format with sizes in K, M or G"* — and asks for the whole line. **36 challenges** across
  Module 1, in their own drill and mixed into exams.

  They are graded **by outcome, not by text**: your line and a model answer each run in
  their own throwaway shell, and both the output and the resulting filesystem are compared.
  So `ls -ltr`, `ls -rlt` and `ls -l -t -r` are all simply correct, and there is no blessed
  string to guess. A `must` pattern is added only where the wording asks for a technique the
  outcome cannot reveal — octal versus symbolic `chmod`, or expanding `$HOME` rather than
  typing the path. Each challenge credits every command it exercises.

- **Mock exam.** A fixed paper against the clock: typed answers only, no multiple choice,
  no hints, and no feedback until you hand it in. 20 or 40 questions, 10/20/30 minutes or
  untimed, roughly a fifth of them build-the-command. Skipping sends a question to the back
  of the paper rather than losing it, and the clock turns red in the last minute.

  The report gives a percentage and a letter grade, ranks your topics worst-first, lists
  every question you missed alongside what you actually wrote, and drills the misses in one
  click. Papers are kept in history and shown on the Progress tab and the exam setup screen.

---

## [0.7] — 2026-08-20

### Changed
- **A topic's percentage now means what finishing it implies.** It is the average of
  your set scores, with sets you have not reached counting as zero — so completing every
  set in a topic at 100% shows **100%**, matching the numbers already on the path.

  Previously that slot showed the Leitner *depth* (`box ÷ 5`, averaged). Answering all
  17 Navigation & Listing cards correctly once gives exactly 20%; reaching 100% would
  have required getting every card right on five separate days. Sitting next to
  "5/5 sets", it read as though finishing the topic hadn't counted.
- The module header stat is now **score** rather than "mastered", and the home module
  list quotes the same figure, so all three surfaces agree.
- **Halfway** and **Module mastered** badges now track score instead of depth — under
  the old rule "Module mastered" was very nearly unwinnable.

### Added
- The Progress tab now separates the two ideas: **Score by module** (how much you have
  finished and how well) and **Retention** (how deeply it has settled in), each with a
  line explaining what it measures. The stat tile is renamed **Strong recall**.

Retention, the Review queue and the spaced-repetition engine are all unchanged — this
release only changes which number is shown where, and what it is called.

---

## [0.6] — 2026-08-20

### Changed
- **Renamed from sudo LEARN to PATHfinder.** The old name was taken. The new one
  is a `$PATH` pun that matches what the app already does — the Learn tab lays the
  course out as a path of numbered steps, and `$PATH` is part of the curriculum.
- Existing progress carries over by itself: the save moved from `sudolearn.v1` to
  `pathfinder.v1`, and an older save is read once and rewritten under the new key.

### Fixed
- **Enter could skip a card you had not typed yet.** After a correct answer the
  card disables its input and auto-advances 700 ms later. Disabling the input drops
  focus to `<body>`, so a second Enter in that window reached the global shortcut,
  which clicked the freshly enabled *Got it* button — advancing once immediately
  and again when the timer fired. The card in between flashed past untyped.
  `advanceChunk()` is now idempotent per card and cancels any pending auto-advance,
  and focus moves to the button rather than falling to the body.
- **Holding Enter no longer machine-guns the UI** — auto-repeat keydowns are
  ignored.

### Added
- **Enter continues from the results screen.** Finish a set and press Enter to drop
  straight into the next one, without reaching for the mouse. The primary button is
  focused when the screen appears, so the keyboard flow is unbroken from the first
  card to the next set.

---

## [0.5] — 2026-08-20

Built for a phone as well as a desktop. Desktop rendering is unchanged — every
change here sits behind a pointer, hover or width query.

### Fixed
- **Typing zoomed the page on iPhone.** Every input was 14–15px, and iOS Safari
  auto-zooms anything under 16px on focus — so since v0.3 the app zoomed on every
  single card. All inputs are now 16px on touch, with `autocorrect`,
  `autocapitalize` and `spellcheck` off and `enterkeyhint="go"` so the keyboard
  offers a Go key instead of a newline.
- **Tapped cards stayed stuck in their hover state.** 15 hover rules had no
  pointer guard; they are now neutralised under `(hover:none)` and replaced with
  real `:active` press feedback.
- **The terminal column ran ~200px past the screen edge and was silently
  clipped** — grid and flex children default to `min-width:auto`, so the command
  input's intrinsic width dragged the whole column wider than the phone, and
  `.win{overflow:hidden}` hid the evidence rather than scrolling.
- Layout no longer jumps when mobile browser chrome or the keyboard appears
  (`dvh` instead of `vh`).

### Changed
- **Tab bar is one sideways-scrolling row** instead of wrapping to two, and keeps
  the active tab scrolled into view.
- **Title bar collapses to a single settings gear** on phones; bite size and theme
  are in Settings already. Traffic lights and the long path are dropped, and the
  status bar shows three numbers rather than six wrapped ones.
- **Tap targets**: buttons, tabs, chips, the card's ✕ and the clickable mission
  rows are all ≥40px on touch. The small inline-styled buttons became a `.btn.sm`
  class so one rule covers them.
- **The learn card's action row is pinned to the bottom** of the screen on phones,
  so *Got it* stays under your thumb instead of below the Remember box.
- `touch-action:manipulation` everywhere, removing the double-tap-zoom delay.

### Added
- **Add to home screen.** A web manifest, app icons and a `theme-color` that
  follows your chosen theme; it installs and opens fullscreen with no browser bars.
  Safe-area insets keep content clear of notches and home indicators.
- **Symbol shortcut row in the terminal** on touch devices — `- / ~ . * $ | > & % + :`
  and a space key, inserted at the cursor without dismissing the keyboard. Typing
  `ls -ltr /var/log` no longer means three trips through the symbol layers.
- On a phone the terminal shows the **mission goal first**, and the 55-mission list
  collapses behind a *Browse all missions* toggle so the prompt stays on screen.
- A compact boot banner under 430px, since the ASCII art overflowed narrow phones.

---

## [0.4] — 2026-08-20

### Changed
- **Finished sets show a score, not a tick.** Each completed step on the path
  displays the share of its cards you have answered correctly: **100%** fills the
  circle in solid, 50–99% leaves it outlined, and below 50% turns it amber so the
  shaky sets stand out.
- Scores keep your **best** result, so retrying a set can only push it up. The
  results screen now tells you what the set reads and nudges you to go for 100%.
- Sets finished before this release have no recorded score and keep their tick.

### Added
- **Wipe progress in Settings**, under a new *Your progress* section that also
  offers a one-click backup to the clipboard. Wiping asks to confirm, spells out
  exactly what will be lost (XP, learned cards, set scores, missions, badges,
  streak), and keeps your theme, bite size and daily goal. The Progress tab's
  reset button now uses the same flow.

---

## [0.3] — 2026-08-20

Learning is now hands-on: you type each command instead of only reading it.

### Added
- **Type-it step on every learning card.** Under the explanation there is a real
  prompt. Type the command, press Enter, and it is checked before you move on —
  worth **3 XP** each. Correct answers advance automatically.
- Wrong answers say so and let you retry; a second wrong attempt reveals the
  exact text to copy. Keystroke cards (`Ctrl-c`, `Esc`, `dd`) get a keyboard
  prompt instead of a shell prompt, and accept spellings like `ctrl-c`,
  `control c` or `^c`.
- A **skip typing this one** link, for when you would rather just read.
- **Retry all** on the results screen, alongside Retry just the missed ones.
  Replays do not re-award the set completion bonus.

### Fixed
- Pressing **Enter** could fire twice — once from the focused button and once
  from the global shortcut — advancing two cards and skipping one. Enter now
  advances exactly one step, whether you use the mouse or the keyboard only.

---

## [0.2] — 2026-08-20

Reshaped around learning it from scratch: a calmer home page, and the course
laid out as a path of very short steps.

### Changed
- **Home page is just the module list now.** Everything that used to crowd it —
  progress, next-up, practice options, the topic grid — moved to the module's
  own page, one click in.
- **Default set size is 3 cards** (was 5), and **2** is now an option.
- **Set completion is tracked per card** rather than per set, so changing the
  bite size no longer wipes the sets you have already finished.
- Learning cards stripped back: one command, one plain sentence, one example,
  one memory hook. No lesson blurb repeated on every card.

### Added
- **The path** — every set in a module is a numbered step, grouped by topic,
  with the next one highlighted and pulsing. Finished steps fill in with a tick.
- **Topics unlock in turn**, so there is always one obvious next thing. Inside
  your current topic you can move around freely, and Settings has a
  **free roam** switch that unlocks everything.
- **15 badges** — first set, 25 and 100 commands learned, answer combos, a
  perfect quick check, streaks, missions, escaping Vim, module mastery.
- **Combo bonus** — consecutive correct answers are worth extra XP, with a
  running "🔥 N in a row" counter.
- **Daily XP goal** (50 / 100 / 200) with a progress ring on the module page and
  a counter in the status bar.

---

## [0.1] — 2026-08-20

First release. Covers **Module 1 — Linux Fundamentals** in full.

### Added
- **Module 1**: 9 topics, 32 lessons, 221 commands, flags and keystrokes —
  navigation and listing, file and directory handling, viewing and inspecting
  files, permissions and users, processes and jobs, command identity and help,
  environment and packages, the Vim editor, and bash editing modes.
- **Learn mode** — lessons split into adjustable bite-sized card sets (3 / 5 / 8),
  one idea per card with a worked example and a memory hook, followed by a quick
  check on just those cards.
- **Drill mode** — adaptive questions: multiple choice for new commands,
  type-from-memory once they stick. Flag order is ignored when checking answers.
- **Spaced repetition** — a Leitner queue that surfaces commands about to fade.
- **Terminal mode** — a simulated Fedora box with a virtual filesystem,
  permissions, ownership, jobs and signals, plus **55 missions** checked against
  filesystem state rather than typed text, so any correct route counts.
- **Reference** — all 221 entries, searchable, each showing mastery.
- **Progress** — XP, ranks, day streak, accuracy, 35-day heatmap, mastery by
  module and by topic, weak-spot drilling, and JSON export/import.
- Six themes (Matrix, Amber CRT, Ubuntu, Dracula, Nord, Paper) with optional CRT
  scanlines; responsive down to phone width.

---

## Planned

### Modules 2–7
Command lists for the remaining six modules, each bringing its own topics,
lessons, drills and terminal missions. Modules appear in the Learn tab as locked
placeholders until their content is added.

---

## Adding a module

1. Add the new topics to `CURRICULUM` in `assets/js/data.js`, each tagged
   `mod: <n>` alongside its `id`, `name` and `icon`.
2. Flip that module's `ready` flag to `true` in `MODULES` (same file) and give it
   a real name and blurb.
3. Add its terminal missions in `assets/js/missions.js` with `mod: <n>`.
4. Add a `CHANGELOG` entry at the top of the array in `data.js`, bump `VERSION`,
   and mirror the entry in this file.

Nothing else needs touching — the Learn, Drill, Reference and Progress screens
all read from `MODULES` and pick the new module up automatically.

&copy; 2026 Avery LLC. All rights reserved.
