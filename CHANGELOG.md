# Changelog

All notable changes to sudo LEARN are recorded here. This file mirrors the
in-app changelog (the **changelog** link in the page footer); the source of
truth for that is the `CHANGELOG` array at the top of `assets/js/data.js`.

The course is planned as **seven modules**. Each release note says which module
it adds.

Versions follow `MAJOR.MINOR`: a new module bumps the minor number, fixes and
tweaks get a patch suffix.

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
