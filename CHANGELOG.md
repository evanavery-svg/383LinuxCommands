# Changelog

All notable changes to sudo LEARN are recorded here. This file mirrors the
in-app changelog (the **changelog** link in the page footer); the source of
truth for that is the `CHANGELOG` array at the top of `assets/js/data.js`.

The course is planned as **seven modules**. Each release note says which module
it adds.

Versions follow `MAJOR.MINOR`: a new module bumps the minor number, fixes and
tweaks get a patch suffix.

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
