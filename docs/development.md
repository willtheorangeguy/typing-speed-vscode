# VS Typing Speed — Development

## Scripts

| Script | Does |
|---|---|
| `npm run compile` | `tsc -p ./` → `out/` |
| `npm run watch` | Incremental compilation |
| `npm run check-types` | Type-check, no emit |
| `npm run lint` | Alias for `check-types` — there is no ESLint here |
| `npm test` | `pretest` compiles, then Mocha over `out/test/**/*.test.js` |
| `npx @vscode/vsce package` | Build a `.vsix` |

`out/` is gitignored. The entry point declared in `package.json` is `./out/src/extension.js`, so
a stale or missing compile means the extension does not activate.

## Tests

```bash
npm test
```

Everything lives in `test/typingSpeedTracker.test.ts`. There is no per-file runner flag, and
none is needed.

The suite runs under plain Mocha with no editor, because the tracker accepts
`DocumentChangeEventLike` — a minimal shape — rather than VS Code's `TextDocumentChangeEvent`.
Timestamps are passed in explicitly (`recordTypedCharacters(n, now)`, `getSnapshot(now)`) rather
than read from the clock, so time-dependent behaviour is tested directly instead of with timers.

**Keep both of those properties.** They are what make this suite fast and deterministic, and
they are easy to lose by reaching for `vscode.` inside `tracking/`.

Anything in `extension.ts` — activation, commands, configuration — is not covered and needs the
Extension Development Host.

## Manual testing

<kbd>F5</kbd> opens the Extension Development Host. Worth exercising, since none of it is
covered by tests:

- Paste something over the threshold; the count must not move.
- Undo and redo; likewise.
- Accept a completion — it is a replacement, so it should not count.
- Type `(` and confirm one character, not two.
- Press Enter in an indented block and confirm one character.
- Pause, type, resume; reload the window and confirm the session survived.

## Conventions

- **The tracker stays free of VS Code imports.** See above.
- **Pass `now` explicitly** in tracker methods; default it to `Date.now()` at the boundary.
- **New filtering rules belong in `countTypedCharacters`**, with a test, not scattered through
  `extension.ts`.
- **Conventional commits** — `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.

## Releasing

Push a `v*` tag. `.github/workflows/build-and-release.yml` builds the VSIX and creates the
GitHub release.

`CLAUDE.md` refers to `npm run release:patch|minor|major` and to instructions in
`CONTRIBUTING.md`. **Neither exists** — the scripts are not in `package.json` and the file was
consolidated into the org-wide `.github` repository. Bump the version with `npm version` and
push the tag. Recorded in [`internal/known-issues.md`](./internal/known-issues.md).

## CI

`ci.yml` runs on push and pull request. `build-and-release.yml` runs on `v*` tags.

## Recording defects

Bugs found while working here go in [`internal/known-issues.md`](./internal/known-issues.md)
rather than being fixed in passing, unless fixing them is the job you are on.
