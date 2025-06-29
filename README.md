# Typing Speed Tracker

A VS Code extension that tracks your typing speed in real-time and displays it in the status bar.

## Features

- **Real-time tracking**: See your WPM (Words Per Minute) and CPM (Characters Per Minute) as you type
- **Per-document sessions**: Each document maintains its own typing session
- **Status bar integration**: Non-intrusive display with detailed tooltips
- **Session management**: Automatic session reset after 5 minutes of inactivity
- **Interactive commands**: Reset statistics and toggle display

## Usage

1. Install and activate the extension
2. Start typing in any document
3. View your typing speed in the status bar (right side)
4. Click the status bar item to see detailed statistics
5. Use Command Palette commands for additional controls

## Commands

- **Typing Speed: Show Typing Statistics** - View detailed stats for current session
- **Typing Speed: Reset Typing Statistics** - Reset stats for current document
- **Typing Speed: Toggle Typing Speed Display** - Show/hide the status bar display

## Status Bar Display

The status bar shows: `⌨ %% WPM/%%% CPM`

Example: `⌨ 45 WPM/225 CPM` means 45 words per minute and 225 characters per minute.

Hover over the status bar item to see detailed information including:

- Words per minute (WPM)
- Characters per minute (CPM)
- Total characters typed in session
- Session duration

## Session Management

- Each document has its own typing session
- Sessions automatically reset after 5 minutes of inactivity
- Closing a document clears its session data
- Manual reset options available through commands

## Development

To run the extension in development mode:

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press `F5` to open a new VS Code window with the extension loaded
4. Start typing to see the typing speed tracker in action

## Requirements

- VS Code 1.101.0 or higher
