# VS Typing Speed — Configuration

Four settings, all under `vstypingspeed.*`, all editable in the Settings UI or `settings.json`.

## Settings

| Setting | Type | Default | Range | Effect |
|---|---|---|---|---|
| `vstypingspeed.enabled` | boolean | `true` | — | Tracking and the status bar item |
| `vstypingspeed.idleThresholdSeconds` | number | `5` | 1–60 | How long a pause can be before live WPM drops to zero |
| `vstypingspeed.refreshIntervalMs` | number | `1000` | 250–5000 | Status bar refresh rate |
| `vstypingspeed.pasteThresholdCharacters` | number | `20` | 1–200 | Insertions this large or larger are ignored |

Changes apply immediately — the extension re-reads configuration and restarts its refresh timer
rather than requiring a reload.

### `idleThresholdSeconds` does two things

It is worth knowing that this one value controls both:

1. **When live WPM drops to zero** — no keystroke within the threshold, and the reading resets.
2. **Which gaps count as active time** — a gap longer than the threshold is excluded from
   session active time entirely.

Raising it makes the reading more forgiving of thinking pauses *and* inflates active time.
Lowering it makes WPM twitchier and active time stricter. They cannot be tuned separately.

### `pasteThresholdCharacters`

An insertion of this size or larger is dropped — the whole change event, not just the excess.
The default of 20 is above any realistic single keystroke and below most pastes worth making.

Note that it applies to the **event total**, so a single change event carrying several
insertions is measured against it as a whole. This matters for multi-cursor editing — see
[`internal/known-issues.md`](./internal/known-issues.md).

## Fixed constants

Not configurable; edit `src/extension.ts` to change them.

| Constant | Value | Effect |
|---|---|---|
| `ROLLING_WINDOW_MS` | 60 000 | The window live WPM is computed over |
| `MINIMUM_SAMPLE_MS` | 5 000 | Floor on the divisor, so short samples cannot spike |
| `TRACKABLE_SCHEMES` | `file`, `untitled`, `vscode-userdata` | Which documents count |
| Characters per word | 5 | The standard WPM convention |

`vscode-userdata` means edits to your own `settings.json` and keybindings count toward "typing
code". Whether that is wanted is a judgement call; it is at least worth knowing.

## Storage

Session state is written to `context.workspaceState` under `vstypingspeed.sessionState`:

```json
{
  "sessionCharacters": 0,
  "activeTimeMs": 0,
  "lastActivityAt": 0,
  "paused": false,
  "recentEntries": []
}
```

**Workspace** storage, not global — every folder keeps its own session, and each survives a
restart. There is no way to see a total across projects.

Writes happen on the refresh timer when something has changed, and once more on deactivation.

## Resetting

`VS Typing Speed: Reset Session Stats` clears the current workspace's session. There is no
command to clear every workspace at once.
