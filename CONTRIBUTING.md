# Contributing to Typing Speed Tracker

Thank you for your interest in contributing to the Typing Speed Tracker VS Code extension!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/typing-speed-vscode.git
   cd typing-speed-vscode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development:
   ```bash
   npm run watch
   ```

4. Test the extension:
   - Press `F5` to open a new Extension Development Host window
   - The extension will be automatically loaded for testing

## Building

- **Development build**: `npm run compile`
- **Production build**: `npm run package`
- **Create VSIX package**: `npx @vscode/vsce package`

## Testing

- **Run tests**: `npm test`
- **Watch tests**: `npm run watch-tests`
- **Type checking**: `npm run check-types`
- **Linting**: `npm run lint`

## Release Process

### Automated Release (Recommended)

1. Make your changes and commit them
2. Run the release script:
   ```bash
   # For patch version (0.0.1 -> 0.0.2)
   npm run release:patch
   
   # For minor version (0.0.1 -> 0.1.0)
   npm run release:minor
   
   # For major version (0.0.1 -> 1.0.0)
   npm run release:major
   ```

The script will:
- Run tests
- Update version in package.json
- Create a git tag
- Push changes and tag to GitHub
- Trigger GitHub Actions to build and create a release

### Manual Release

1. Update version in `package.json`
2. Commit the version change
3. Create a git tag: `git tag v0.0.2`
4. Push tag: `git push origin v0.0.2`
5. GitHub Actions will automatically create the release

## Project Structure

```
├── .github/
│   ├── workflows/          # GitHub Actions workflows
│   └── copilot-instructions.md
├── src/
│   ├── extension.ts        # Main extension code
│   └── test/              # Test files
├── scripts/               # Release scripts
├── dist/                  # Compiled output
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript configuration
└── README.md            # Documentation
```

## Code Style

- Use TypeScript for type safety
- Follow VS Code extension best practices
- Use ESLint for code formatting
- Include proper JSDoc comments for public methods

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass: `npm test`
6. Commit with conventional commit messages
7. Push to your fork and create a pull request

## Conventional Commits

We use conventional commit messages:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Example: `feat: add session timeout configuration option`
