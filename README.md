<!-- Logo -->
<h1 align="center">VS Typing Speed</h1>

<!-- Copy -->
<h4 align="center">A VS Code extension that estimates how fast you are actually typing code, and keeps the number in your status bar.</h4>

<!-- Badges -->
<div align="center">
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/willtheorangeguy/typing-speed-vscode/ci.yml?label=ci">
  <img alt="GitHub Issues" src="https://img.shields.io/github/issues/willtheorangeguy/typing-speed-vscode">
  <img alt="GitHub Pull Requests" src="https://img.shields.io/github/issues-pr/willtheorangeguy/typing-speed-vscode">
  <img alt="License" src="https://img.shields.io/github/license/willtheorangeguy/typing-speed-vscode">
</div>

<!-- Navigation -->
<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#support">Support</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

## Key Features

- Live WPM in the status bar, over a rolling 60-second window.
- Ignores undo, redo, replacements, and anything larger than the paste threshold — so a paste does not become a personal best.
- Counts an auto-closing pair as one character, and a newline plus auto-indent as one.
- Session totals for characters, words, and **active** time — idle gaps are excluded rather than counted.
- Pause, resume, and reset, with the session persisted per workspace across restarts.

## Installation

Not on the Marketplace. Build a VSIX and install it:

```bash
npm install
npm run compile
npx @vscode/vsce package
```

Or press <kbd>F5</kbd> in VS Code to launch the Extension Development Host. See [`docs/installation.md`](docs/installation.md).

## Usage

Type. The status bar shows live WPM; click it for session stats.

| Command | Does |
|---|---|
| `VS Typing Speed: Show Current Stats` | Session characters, words, active time |
| `VS Typing Speed: Pause or Resume Tracking` | Stop and start counting |
| `VS Typing Speed: Reset Session Stats` | Clear the session |

## Documentation

Full documentation lives in [`docs/`](docs/README.md):
[Quickstart](docs/quickstart.md) · [Installation](docs/installation.md) · [Configuration](docs/configuration.md) · [Architecture](docs/architecture.md) · [Development](docs/development.md) · [FAQ](docs/faq.md) · [Troubleshooting](docs/troubleshooting.md) · [Roadmap](docs/roadmap.md)

## Support

Open a [GitHub Discussion](https://github.com/willtheorangeguy/typing-speed-vscode/discussions/new) or file an [issue](https://github.com/willtheorangeguy/typing-speed-vscode/issues/new/choose).

## Contributing

Contributions welcome. See the org-wide [Contributing Guide](https://github.com/willtheorangeguy/.github/blob/main/CONTRIBUTING.md) and [Code of Conduct](https://github.com/willtheorangeguy/.github/blob/main/CODE_OF_CONDUCT.md).

## Credits

Built on the [VS Code extension API](https://code.visualstudio.com/api). Tested with [Mocha](https://mochajs.org/).

## License

MIT — see [`LICENSE.md`](LICENSE.md).

> It measures characters you typed, over time you were actually typing. Neither half is as obvious as it sounds — see [`docs/architecture.md`](docs/architecture.md).
