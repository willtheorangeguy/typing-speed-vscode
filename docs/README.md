# VS Typing Speed — Documentation

A VS Code extension that estimates your live typing speed and keeps it in the status bar.

```
typing-speed-vscode/
├── src/
│   ├── extension.ts                    activation, event wiring, commands, config
│   ├── tracking/typingSpeedTracker.ts  the counting and the WPM maths
│   ├── storage/statsStore.ts           a thin wrapper over workspace Memento
│   ├── ui/statusBarController.ts       the status bar item and its tooltip
│   └── types/stats.ts                  shared interfaces
├── test/typingSpeedTracker.test.ts     the whole suite
└── docs/                               this documentation
```

## Pages

- [Quickstart](./quickstart.md) — run it and read the number
- [Installation](./installation.md) — dev host or VSIX
- [Configuration](./configuration.md) — the four settings and the fixed constants
- [Architecture](./architecture.md) — what counts as a character, and as active time
- [Development](./development.md) — build, test, release
- [FAQ](./faq.md) — pastes, multi-cursor, why the number looks low
- [Troubleshooting](./troubleshooting.md) — when WPM stays at zero
- [Roadmap](./roadmap.md) — direction and non-goals
- [Known issues](./internal/known-issues.md) — recorded defects

## The two questions it has to answer

**What counts as a character you typed?** Not a paste, not an undo, not a formatter's rewrite.
An auto-closing pair is one keystroke even though VS Code inserts two characters; a newline
followed by eight spaces of auto-indent is also one. Every one of those is a decision, and each
is in [Architecture](./architecture.md).

**What counts as time spent typing?** Wall-clock time would make every reading meaningless the
moment you stop to think. Gaps longer than the idle threshold are excluded, so "active time"
means time you were actually typing.

Getting either wrong produces a number that is confidently useless, which is why the tracker is
where the care went — and why it is the part with tests.

## Scope

Nothing leaves your machine. There is no telemetry, no network code, and no account. Session
state lives in VS Code's workspace storage, which means it is **per workspace** — a different
folder is a different session.
