# VS Typing Speed — Architecture

Five small modules. Almost all of the thinking is in one of them.

```text
onDidChangeTextDocument
   └── isTrackableEditorChange()      active editor? trackable scheme?
          └── countTypedCharacters()  what of this event was typing?
                 └── tracker.recordTypedCharacters()
                        ├── setInterval → statusBar.update(tracker.getSnapshot())
                        └──            → store.save() when dirty
```

| Module | Role |
|---|---|
| `extension.ts` | Activation, event wiring, commands, configuration, the persist loop |
| `tracking/typingSpeedTracker.ts` | Counting, active time, WPM, pause and resume |
| `storage/statsStore.ts` | Wrapper over `vscode.Memento` (workspace storage) |
| `ui/statusBarController.ts` | The status bar item and its Markdown tooltip |
| `types/stats.ts` | Shared interfaces |

The tracker takes plain data, not VS Code objects — `DocumentChangeEventLike` rather than
`TextDocumentChangeEvent`. That is what lets the whole suite run under Mocha with no editor and
no mocking framework.

## What counts as a typed character

`countTypedCharacters` is the filter, and every rule in it exists to stop something from
inflating the number.

**Rejected outright, returning 0 for the entire event:**

| Condition | Why |
|---|---|
| `reason` is undo (1) or redo (2) | Not typing |
| Any change with `rangeLength !== 0` | A replacement — a formatter, an accepted completion, a rename |
| Any change with empty text | A deletion |
| A running total above `pasteThresholdCharacters` | A paste |

**Normalised rather than counted literally:**

| Input | Counted as |
|---|---|
| `()`, `[]`, `{}`, `""`, `''`, ` `` ` | 1 — VS Code inserted two, you pressed one key |
| Newline plus whitespace-only indent | 1 per newline, however much indent was added |
| Text containing a newline *and* other content | 0 — a multi-line insertion is not typing |

The strictness is deliberate. A typing-speed number that a paste can move is worse than no
number, because it looks equally plausible either way.

## What counts as active time

Wall-clock time would make every reading meaningless the moment you stopped to think, so active
time accumulates only the gaps between consecutive keystrokes that are **shorter than the idle
threshold**.

Two places compute it:

- **`activeTimeMs`** — the session total, grown in `recordTypedCharacters` by each qualifying
  gap. `getActiveTimeMs` adds a trailing allowance since the last keystroke, capped at the idle
  threshold, so the display advances while you are still typing.
- **`calculateRollingActiveMs`** — the same idea over the last 60 seconds only, used as the
  divisor for live WPM.

## Live WPM

```text
liveWpm = (recentCharacters / 5) / (activeSampleMs / 60000)
```

with

```text
activeSampleMs = max(rollingActiveMs, MINIMUM_SAMPLE_MS)
```

Three guards return zero before that: paused, no activity yet, or the last keystroke older than
the idle threshold.

`MINIMUM_SAMPLE_MS` is a **floor on the divisor**, not a gate — a reading is produced from the
very first keystroke, damped rather than withheld. `CLAUDE.md` describes it as a gate; see
[`internal/known-issues.md`](./internal/known-issues.md).

## Persistence

`getPersistedState` serialises the counters plus the surviving rolling-window entries. The
persist loop writes on the refresh timer when the dirty flag is set, and `deactivate` flushes
once more.

Writes are chained through a single promise (`saveChain`) so two saves cannot interleave.

**On restore**, if every rolling entry has aged out of the window, `lastActivityAt` is cleared
too — otherwise the first keystroke of a new day would be treated as continuing yesterday's
session and credit a full idle threshold of phantom active time. The code says so in a comment;
it is the kind of thing that would otherwise look like an unnecessary line.

## Pause

Pausing folds the trailing time into `activeTimeMs`, clears `lastActivityAt`, and empties the
rolling window — so resuming starts a clean measurement rather than one spanning the break.

## Status bar

`StatusBarController` owns the item, formats the WPM text, and builds a Markdown tooltip. It
reads a snapshot and holds no state of its own, so the display can never disagree with the
tracker.
