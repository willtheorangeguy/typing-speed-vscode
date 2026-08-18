# VS Typing Speed — Roadmap

Direction, not a schedule. Defects are tracked in
[`internal/known-issues.md`](./internal/known-issues.md); this page is about what the extension
is *for*.

## Where it is

It counts typed characters with a careful set of exclusions, tracks active time excluding idle
gaps, shows live WPM over a rolling minute, and persists a session per workspace. The tracker is
tested; the VS Code wiring is not.

## Considered

**Handling multi-cursor honestly.** One keystroke at five cursors counts as five characters.
Counting distinct keystrokes rather than inserted characters would be truer to the thing being
measured.

**Correcting `CLAUDE.md`.** It documents release scripts and a `CONTRIBUTING.md` that do not
exist, and describes the minimum-sample floor as a gate.

**Tests for `extension.ts`.** Activation, commands, and configuration are only ever exercised by
hand. `@vscode/test-electron` would cover them.

**Separating the idle threshold's two jobs.** One setting decides both when WPM resets and which
gaps count as active time; they want different values.

**A session history.** Peak WPM, or a daily figure, would need somewhere to keep it — see the
non-goals.

**Marketplace publication.** Currently VSIX-only.

## Non-goals

**Counting keystrokes generally.** This measures typing *code* in the editor. A global keystroke
counter is a different tool with very different privacy implications.

**Telemetry, leaderboards, or comparison.** Nothing leaves the machine, and nothing here is
worth making competitive — optimising for a WPM number is not a good way to write software.

**Counting pastes and generated code.** Excluding them is the point. A number a paste can move
is not measuring anything.

**Cross-workspace totals.** Session state is workspace storage, which keeps it local and
disposable. A global total means global state and a decision about how long to keep it.

**Gamification.** No streaks, badges, or goals.

## Contributing

Issues and pull requests welcome — see the
[Contributing Guide](https://github.com/willtheorangeguy/.github/blob/main/CONTRIBUTING.md).
Changes to `countTypedCharacters` should arrive with a test; it is the function that decides
whether the whole number means anything.
