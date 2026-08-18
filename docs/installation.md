# VS Typing Speed — Installation

Not published to the Visual Studio Marketplace. Two ways to run it.

## Extension Development Host

For trying it or working on it:

```bash
npm install
npm run compile
```

Press <kbd>F5</kbd> in VS Code. A second window opens with the extension loaded. Changes need
a recompile and a reload of that window.

## Build a VSIX

For actually using it day to day:

```bash
npm install
npm run compile
npx @vscode/vsce package
```

That produces `vs-typing-speed-<version>.vsix`. Install it with:

```bash
code --install-extension vs-typing-speed-0.0.1.vsix
```

Or from the Extensions view: **… → Install from VSIX**.

## From a release

`.github/workflows/build-and-release.yml` builds a VSIX and attaches it to a GitHub release when
a `v*` tag is pushed. Download it from
[Releases](https://github.com/willtheorangeguy/typing-speed-vscode/releases) and install as
above.

## Requirements

| | |
|---|---|
| VS Code | 1.120.0 or newer (`engines.vscode` in `package.json`) |
| Node | Any current LTS, for building |

No runtime dependencies — the extension uses only the VS Code API.

## Verify

```bash
npm run check-types
npm test
```

Then type in the dev host and watch the status bar. If it does not appear, check
`vstypingspeed.enabled` — see [Troubleshooting](./troubleshooting.md).

## Uninstall

Remove it from the Extensions view. Session state lives in VS Code's workspace storage under the
key `vstypingspeed.sessionState` and is cleaned up with the workspace's storage; nothing is
written outside VS Code.
