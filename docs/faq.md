# VS Typing Speed — FAQ

## Why is my WPM lower than on a typing test?

A typing test measures copying prose. This measures writing code, and deliberately excludes a
lot of what happens while you do it: pastes, undo, accepted completions, formatter rewrites, and
anything in a file that is not the active editor.

It also excludes thinking time from the denominator, which pushes the number the other way. The
two are not comparable, and this one is the more honest description of typing code.

## Does a paste count?

No. Any insertion of 20 characters or more (`vstypingspeed.pasteThresholdCharacters`) is dropped
entirely — the whole change event, not just the excess.

## Does autocomplete count?

No. Accepting a completion replaces a range rather than inserting into one, and every change
with `rangeLength !== 0` is rejected.

## Does typing `(` count as one character or two?

One. VS Code inserts the closing bracket for you, and the six auto-closing pairs are normalised
to a single character. A newline plus auto-indent is likewise one, however much whitespace gets
added.

## What about multi-cursor editing?

One keystroke at five cursors currently counts as five characters, and above the paste threshold
the whole event is dropped instead. Neither is really right. Recorded in
[`internal/known-issues.md`](./internal/known-issues.md).

## Why does the number drop to zero when I stop?

By design. After `idleThresholdSeconds` (5 by default) with no keystroke, live WPM resets — a
speed reading should not persist after you have stopped typing. Session totals are unaffected.

## What is "active time"?

Time you were actually typing. Gaps longer than the idle threshold are excluded, so a
twenty-minute break does not appear as twenty minutes of activity.

## Why did my session reset when I opened another project?

It did not — sessions are stored **per workspace**. Each folder keeps its own, and the previous
one is still there when you go back. There is no cross-project total.

## Does it track me?

No. No telemetry, no network code, no account. Everything lives in VS Code's workspace storage
on your machine.

## Does editing settings.json count?

Yes. The `vscode-userdata` scheme is tracked alongside `file` and `untitled`, so edits to your
own settings and keybindings count toward the session.

## Why does it not count edits in the file next to the one I am in?

Only the **active** editor is tracked. An edit applied by an extension to a background file is
not you typing.

## Is it on the Marketplace?

No. Build a VSIX, or take one from [Releases](https://github.com/willtheorangeguy/typing-speed-vscode/releases) — see [Installation](./installation.md).
