# VS Typing Speed

VS Typing Speed is a Visual Studio Code extension that estimates how fast you are actively typing code and keeps the latest `WPM` visible in the status bar.

## Features

- Live `WPM` in the bottom status bar
- Session totals for typed characters and estimated words
- Session active time
- Pause/resume tracking
- Reset the current session

## How it works

The extension listens for text insertions in the active editor and uses a few guardrails so your stats stay useful:

- It tracks only active editor changes in regular text documents like `file` and `untitled`.
- It ignores undo/redo operations.
- It ignores replacements and large insertions so paste operations do not spike your numbers.
- It treats words as `5` characters for WPM calculations.
- It resets live WPM to `0` after an idle period.

The status bar shows live `WPM`. Click it, or run the commands below, to inspect or manage the current session.

## Commands

- `VS Typing Speed: Show Current Stats`
- `VS Typing Speed: Pause or Resume Tracking`
- `VS Typing Speed: Reset Session Stats`

## Settings

- `vstypingspeed.enabled`
- `vstypingspeed.idleThresholdSeconds`
- `vstypingspeed.refreshIntervalMs`
- `vstypingspeed.pasteThresholdCharacters`

## Development

```bash
npm install
npm run compile
npm test
```

Press `F5` in VS Code to launch the Extension Development Host and try the extension locally.
