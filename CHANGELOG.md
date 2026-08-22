# Changelog

All notable changes to PATHfinder are recorded here. This file mirrors the
in-app changelog (the **changelog** link in the page footer); the source of
truth for that is the `CHANGELOG` array at the top of `assets/js/data.js`.

The course is planned as **seven modules**. Each release note says which module
it adds.

Versions follow `MAJOR.MINOR`: a new module bumps the minor number, fixes and
tweaks get a patch suffix.

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
