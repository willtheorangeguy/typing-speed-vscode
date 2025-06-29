# Copilot Instructions for VSCode Typing Speed Extension

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.

## Project Overview
This extension tracks the user's typing speed in real-time and displays it in the VS Code status bar. It provides:
- Real-time WPM (Words Per Minute) and CPM (Characters Per Minute) tracking
- Per-document session tracking
- Status bar integration with detailed tooltips
- Commands to reset and view typing statistics

## Key Features
- Automatic session management (resets after 5 minutes of inactivity)
- Clean separation between typing sessions for different documents
- Non-intrusive status bar display
- Interactive commands for user control

## Architecture
- `TypingSpeedTracker` class handles all core functionality
- Event listeners for document changes and closures
- Status bar item with real-time updates
- Command registration for user interactions

## Development Guidelines
- Follow VS Code extension best practices
- Use TypeScript for type safety
- Implement proper disposal patterns for resources
- Maintain clean event handling
- Ensure performance optimization for real-time updates
