# VS Typing Speed — Troubleshooting

## No status bar item at all

| Check | Detail |
|---|---|
| Is it enabled? | `vstypingspeed.enabled` must be `true` |
| Did the extension activate? | **Help → Toggle Developer Tools → Console** for activation errors |
| Is `out/` built? | The entry point is `./out/src/extension.js`; run `npm run compile` |
| VS Code version | 1.120.0 or newer is required |

A missing or stale `out/` is the usual cause when running from source — the extension simply
never activates, with no visible error.

## WPM stays at zero while I type

Work down this list:

**1. Is tracking paused?** Run `VS Typing Speed: Pause or Resume Tracking`.

**2. Is the file trackable?** Only the schemes `file`, `untitled`, and `vscode-userdata` count.
Output panels, diff views, notebook cells, and remote or virtual filesystems do not.

**3. Is it the active editor?** Only the focused editor is tracked.

**4. Is your typing being rejected?** These count for nothing:

- Pastes of 20 characters or more
- Undo and redo
- Anything that replaces a range — accepted completions, formatter output, renames
- Multi-line insertions containing non-whitespace

**5. Are you typing fast enough to register?** The reading is damped over the first few seconds
by a five-second floor on the divisor.

## WPM looks far too high

Multi-cursor editing counts one keystroke once per cursor. Recorded in
[`internal/known-issues.md`](./internal/known-issues.md).

## WPM drops to zero the moment I pause

Working as intended — `idleThresholdSeconds`, default 5. Raise it if you want a more forgiving
reading, remembering it also widens which gaps count as active time.

## Session totals reset unexpectedly

| Cause | Detail |
|---|---|
| Different workspace | Sessions are per folder, not global |
| Reset command | `VS Typing Speed: Reset Session Stats` |
| Storage cleared | Removing the workspace from VS Code's recent list clears its storage |

## Session did not survive a restart

State is flushed by the persist loop when something has changed, and again on deactivation. A
hard kill of VS Code can lose the last few seconds — a lower `refreshIntervalMs` narrows that
window at the cost of more writes.

Check the console for `Failed to persist VS Typing Speed state.`

## Active time looks higher than the time I spent typing

Two contributors, both bounded: the display adds a trailing allowance since your last keystroke,
capped at the idle threshold; and after a reload, part of that allowance can be counted twice.
Recorded in [`internal/known-issues.md`](./internal/known-issues.md).

## Settings changes do nothing

They should apply immediately. If they do not, reload the window — and note that
`refreshIntervalMs` and `idleThresholdSeconds` have enforced ranges, so a value outside them is
rejected by VS Code rather than applied.

## `npm test` fails to find tests

`pretest` compiles first; Mocha runs `out/test/**/*.test.js`, not the TypeScript. A failed
compile leaves nothing to run — check the `tsc` output above the Mocha output.

## Still stuck

[Open an issue](https://github.com/willtheorangeguy/typing-speed-vscode/issues/new/choose) with
your VS Code version, the file type, and what you were typing.
