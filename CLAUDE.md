# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run compile      # compile TypeScript → out/
npm run watch        # incremental TypeScript compilation
npm run check-types  # type-check only (no emit)
npm run lint         # alias for check-types
npm test             # compile then run mocha tests
npx @vscode/vsce package  # produce a .vsix for local install
```

To run tests: `npm test` (runs `pretest` → `compile`, then `mocha out/test/**/*.test.js`). There is no per-file test runner flag; all tests live in a single file (`test/typingSpeedTracker.test.ts`) so running `npm test` always runs the full suite.

Press `F5` in VS Code to launch the Extension Development Host for manual testing.

## Architecture

This is a VS Code extension. TypeScript compiles to `out/` (gitignored); the extension entry point declared in `package.json` is `./out/src/extension.js`.

**Module layout under `src/`:**

| File | Role |
|---|---|
| `extension.ts` | Activation/deactivation, event wiring, command registration, configuration reading, dirty-flag persistence loop |
| `tracking/typingSpeedTracker.ts` | Core stateful tracker — records timestamped character samples, calculates live WPM over a rolling window, manages pause/resume |
| `storage/statsStore.ts` | Thin wrapper around `vscode.Memento` (workspace storage); key `vstypingspeed.sessionState` |
| `ui/statusBarController.ts` | Owns the `StatusBarItem`, formats WPM display and Markdown tooltip |
| `types/stats.ts` | Shared TypeScript interfaces (`TypingSnapshot`, `PersistedSessionState`, `TrackerOptions`, etc.) |

**Data flow:**

1. `onDidChangeTextDocument` fires → `countTypedCharacters()` filters the event (rejects undo/redo via `reason` codes 1 & 2, replacements via `rangeLength > 0`, large pastes via `pasteThresholdCharacters`; normalises newline-with-indent and auto-closing pairs to 1 character).
2. Non-zero count → `tracker.recordTypedCharacters()` → appends a `TypingEventSample` and sets `dirty = true`.
3. A `setInterval` timer (default 1 s) calls `statusBar.update(tracker.getSnapshot(now))` and, when dirty, serialises state via `store.save()`.
4. On deactivation, `deactivateHandler` flushes the last state to workspace storage so the session survives restarts.

**WPM calculation** (`TypingSpeedTracker.getSnapshot`):
- Rolling window: last 60 s of samples (`ROLLING_WINDOW_MS`).
- Gaps > `idleThresholdMs` between consecutive samples are excluded from active time.
- Requires at least 5 s of active sample time (`MINIMUM_SAMPLE_MS`) before reporting a non-zero WPM.
- Formula: `(recentCharacters / 5) / (activeSampleMs / 60 000)`.

## Key Conventions

- **Trackable schemes**: only `file`, `untitled`, and `vscode-userdata` URIs are tracked.
- **Paste detection**: insertions ≥ `pasteThresholdCharacters` (default 20) are silently dropped.
- **Auto-closing pairs** `()`, `[]`, `{}`, `""`, `''`, ` `` ` count as 1 character even though VS Code inserts 2.
- **Newline + auto-indent**: counted as 1 character regardless of the number of indent characters inserted.
- **Session persistence**: stored in workspace (`context.workspaceState`), not global state, so it is per-workspace.
- **Conventional commits** are used: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.

## Release

Releases are triggered by pushing a version tag (`v*`). The GitHub Actions workflow `build-and-release.yml` builds the VSIX and creates a GitHub release automatically. Use the release scripts from CONTRIBUTING.md:

```bash
npm run release:patch   # 0.0.1 → 0.0.2
npm run release:minor   # 0.0.1 → 0.1.0
npm run release:major   # 0.0.1 → 1.0.0
```
