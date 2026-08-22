# Known Issues — typing-speed-vscode

Concrete defects and gaps found while writing this repository's documentation in
August 2026. **Nothing here was changed** — each one needs a code, configuration, or
licensing decision rather than a documentation one.

Ordered by severity. See [`docs/roadmap.md`](../roadmap.md) for the narrative version,
which also covers deliberate non-goals.

**4 open:** 3 medium, 1 low.

## 1. CLAUDE.md documents three npm scripts and a CONTRIBUTING.md that do not exist

**Severity:** Medium
**Where:** `CLAUDE.md` 'Release' section vs `package.json`, repository root

**What:** CLAUDE.md instructs: 'Use the release scripts from CONTRIBUTING.md' and lists `npm run release:patch`, `release:minor`, and `release:major`. `package.json` defines none of them -- its scripts are `vscode:prepublish`, `compile`, `watch`, `package`, `check-types`, `lint`, `pretest`, and `test`. `CONTRIBUTING.md` was removed when health files were consolidated into the org-wide `.github` repository.

**Why it matters:** Releasing is the one workflow here that is hard to reverse -- a pushed tag triggers `build-and-release.yml`, which creates a public GitHub release. The only written instructions for it point at a file that is gone and three commands that fail with `npm ERR! Missing script`. Someone following them either gives up or improvises the version bump, and improvising a version bump is how a tag ends up disagreeing with `package.json`.

**Suggested fix:** Either add the three scripts (`npm version patch && git push --follow-tags` and friends) or replace the section with the actual procedure. Drop the `CONTRIBUTING.md` reference; the org-wide guide does not carry this repository's release steps.

## 2. CLAUDE.md describes the minimum sample as a gate; the code uses it as a divisor floor

**Severity:** Medium
**Where:** `CLAUDE.md` 'WPM calculation' vs `src/tracking/typingSpeedTracker.ts` -> `calculateLiveWpm`

**What:** CLAUDE.md states: 'Requires at least 5 s of active sample time (`MINIMUM_SAMPLE_MS`) before reporting a non-zero WPM.' The code computes `activeSampleMs = Math.max(this.calculateRollingActiveMs(now), this.options.minimumSampleMs)` -- a floor on the divisor, applied unconditionally. A single character typed half a second ago yields `(1/5) / (5000/60000)` = 2.4 WPM, not zero.

**Why it matters:** The two behaviours differ in exactly the case a reader would be checking: what the extension shows in the first seconds of typing. Someone told there is a five-second gate, watching a small number appear immediately, has to decide whether they are looking at a bug or bad documentation -- and this file is what a contributor reads before touching the maths. The floor is the better design, which makes the wrong description the thing to change.

**Suggested fix:** Reword to describe the floor and why it exists: it damps the first seconds rather than withholding a reading, so a two-character sample cannot divide by a near-zero interval and produce a spike.

## 3. Multi-cursor typing multiplies the character count by the number of cursors

**Severity:** Medium
**Where:** `src/tracking/typingSpeedTracker.ts` -> `countTypedCharacters`

**What:** One keystroke with N cursors active produces a single change event containing N `contentChanges`, each with `rangeLength === 0` and one character of text. The loop sums them all, so the keystroke is counted N times. Above `pasteThresholdCharacters` (20) the running total trips the paste guard and the **entire event returns 0** instead.

**Why it matters:** The number is meant to answer 'how fast am I typing', and multi-cursor editing is a way of typing *less* to achieve more -- so the count moves in the wrong direction, then inverts entirely past twenty cursors. Both outcomes are silent. Every other rule in this function exists to stop non-typing from inflating the figure, which makes this the one gap in an otherwise deliberate filter.

**Suggested fix:** Count distinct keystrokes rather than inserted characters when every change in an event is identical: take the per-change count once, not once per cursor. That also stops the paste guard from firing on a wide multi-cursor edit.

## 4. The trailing active-time allowance is persisted, then counted a second time after a reload

**Severity:** Low
**Where:** `src/tracking/typingSpeedTracker.ts` -> `getPersistedState`, `getActiveTimeMs`, `recordTypedCharacters`

**What:** `getActiveTimeMs(now)` returns the stored `activeTimeMs` plus a trailing allowance of `min(now - lastActivityAt, idleThresholdMs)`, so the display advances while typing continues. `getPersistedState` saves **that** value as `activeTimeMs`. `restore` assigns it back to the field and, when rolling entries survived, keeps `lastActivityAt` -- so the next `recordTypedCharacters` measures the gap from that same timestamp and adds an overlapping interval again.

**Why it matters:** Session active time is inflated by up to one idle threshold per reload, silently and permanently -- the field is a running total with no way to reconcile it. Window reloads are routine in VS Code (extension development, settings changes, updates), so the error accumulates rather than being a one-off. The `restore` method already guards the related case where all entries aged out, which shows the hazard was seen from one direction but not the other.

**Suggested fix:** Persist the raw `activeTimeMs` field rather than `getActiveTimeMs(now)`, keeping the trailing allowance a display-only concern. If the trailing time should survive a reload, fold it into the field and clear `lastActivityAt` at the same moment, as the pause path already does.

---

## Also, across every repository

**`.bandit` is present on disk but untracked in git.** Verified in PyWorkout, treklogger,
skyscanner-cli, booking-cli, piggy, and aibot — the config file exists locally in each but
`git ls-files` does not know about it, so none of it reached GitHub.

The August 2026 security sweep therefore looks complete locally and landed nowhere. Worth
checking across all 44 repositories it covered.
