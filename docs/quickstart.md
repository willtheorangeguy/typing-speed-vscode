# VS Typing Speed — Quickstart

## Run it

```bash
npm install
npm run compile
```

Then press <kbd>F5</kbd> in VS Code to open the Extension Development Host with the extension
loaded.

## Read the status bar

Bottom-left shows live WPM. Click it for a summary:

| Figure | Meaning |
|---|---|
| Live WPM | Over the last 60 seconds of typing |
| Session characters | Characters counted this session |
| Session words | Characters ÷ 5, the standard convention |
| Active time | Time spent typing, excluding idle gaps |

## Why it shows 0

Live WPM drops to zero once you have been idle longer than the idle threshold (5 seconds by
default). That is the intended behaviour — a speed measurement should not keep reporting a
number after you have stopped.

If it stays at zero while you type, see [Troubleshooting](./troubleshooting.md).

## Why the number may be lower than you expect

Several things deliberately do not count:

- **Pastes** — anything over 20 characters in one insertion is dropped entirely.
- **Undo and redo.**
- **Replacements** — including accepted completions and formatter rewrites, which replace a
  range rather than inserting into one.
- **Edits outside the active editor**, and files whose scheme is not `file`, `untitled`, or
  `vscode-userdata`.

An auto-closing `()` counts as one character, not two, and a newline with auto-indent counts as
one regardless of how much whitespace VS Code adds.

## Commands

<kbd>Ctrl/Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>:

- `VS Typing Speed: Show Current Stats`
- `VS Typing Speed: Pause or Resume Tracking`
- `VS Typing Speed: Reset Session Stats`

## The session is per workspace

State is stored in VS Code's **workspace** storage, so each folder has its own session and each
survives a restart. Opening a different project does not continue the previous count.

## Install it properly

```bash
npx @vscode/vsce package    # → a .vsix you can install
```

See [Installation](./installation.md).
