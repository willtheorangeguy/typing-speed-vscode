// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface TypingSession {
	startTime: number;
	charactersTyped: number;
	lastActivityTime: number;
	documentUri: string;
}

class TypingSpeedTracker {
	private statusBarItem: vscode.StatusBarItem;
	private sessions: Map<string, TypingSession> = new Map();
	private updateInterval: NodeJS.Timeout | undefined;
	private disposables: vscode.Disposable[] = [];
	private isEnabled: boolean = true;
	
	// Configuration constants
	private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
	private readonly UPDATE_INTERVAL = 1000; // 1 second
	private readonly WORDS_PER_MINUTE_DIVISOR = 5; // Standard: 5 characters = 1 word

	constructor() {
		// Create status bar item
		this.statusBarItem = vscode.window.createStatusBarItem(
			'typing-speed',
			vscode.StatusBarAlignment.Right,
			100
		);
		this.statusBarItem.name = 'Typing Speed';
		this.statusBarItem.command = 'typing-speed.showStats';
		
		this.initializeEventListeners();
		this.startUpdateLoop();
		this.updateDisplay();
	}

	private initializeEventListeners(): void {
		// Listen for text document changes
		const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
			if (!this.isEnabled) {
				return;
			}
			
			const document = event.document;
			
			// Ignore certain document types
			if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
				return;
			}
			
			// Count only actual text changes (not just cursor movements)
			const totalChanges = event.contentChanges.reduce((total, change) => {
				return total + change.text.length;
			}, 0);
			
			if (totalChanges > 0) {
				this.recordTyping(document.uri.toString(), totalChanges);
			}
		});

		// Listen for document closures to clean up sessions
		const onDidCloseTextDocument = vscode.workspace.onDidCloseTextDocument((document) => {
			this.sessions.delete(document.uri.toString());
		});

		// Listen for active editor changes to update display
		const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(() => {
			this.updateDisplay();
		});

		this.disposables.push(onDidChangeTextDocument, onDidCloseTextDocument, onDidChangeActiveTextEditor);
	}

	private recordTyping(documentUri: string, charactersAdded: number): void {
		const now = Date.now();
		let session = this.sessions.get(documentUri);

		if (!session || (now - session.lastActivityTime) > this.SESSION_TIMEOUT) {
			// Create new session or reset after timeout
			session = {
				startTime: now,
				charactersTyped: 0,
				lastActivityTime: now,
				documentUri: documentUri
			};
			this.sessions.set(documentUri, session);
		}

		session.charactersTyped += charactersAdded;
		session.lastActivityTime = now;
		
		// Update display immediately for responsive feedback
		this.updateDisplay();
	}

	private getCurrentSession(): TypingSession | undefined {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return undefined;
		}
		
		const documentUri = activeEditor.document.uri.toString();
		return this.sessions.get(documentUri);
	}

	private calculateStats(session: TypingSession): { wpm: number; cpm: number; duration: number } {
		const now = Date.now();
		const durationMinutes = (now - session.startTime) / (1000 * 60);
		
		// Avoid division by zero
		if (durationMinutes === 0) {
			return { wpm: 0, cpm: 0, duration: 0 };
		}

		const cpm = Math.round(session.charactersTyped / durationMinutes);
		const wpm = Math.round(session.charactersTyped / this.WORDS_PER_MINUTE_DIVISOR / durationMinutes);
		
		return {
			wpm: Math.max(0, wpm),
			cpm: Math.max(0, cpm),
			duration: Math.round(durationMinutes * 60) // duration in seconds
		};
	}

	private updateDisplay(): void {
		if (!this.isEnabled) {
			this.statusBarItem.hide();
			return;
		}

		const session = this.getCurrentSession();
		
		if (!session) {
			this.statusBarItem.text = '$(keyboard) --/-- WPM';
			this.statusBarItem.tooltip = 'No active typing session';
			this.statusBarItem.show();
			return;
		}

		const stats = this.calculateStats(session);
		
		// Format the status bar text
		this.statusBarItem.text = `$(keyboard) ${stats.wpm} WPM/${stats.cpm} CPM`;
		
		// Create detailed tooltip
		const minutes = Math.floor(stats.duration / 60);
		const seconds = stats.duration % 60;
		const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
		
		this.statusBarItem.tooltip = new vscode.MarkdownString(
			`**Typing Speed Statistics**\n\n` +
			`• **WPM (Words/min):** ${stats.wpm}\n` +
			`• **CPM (Chars/min):** ${stats.cpm}\n` +
			`• **Characters typed:** ${session.charactersTyped}\n` +
			`• **Session duration:** ${timeString}\n\n` +
			`*Click to view detailed statistics*`
		);
		
		this.statusBarItem.show();
	}

	private startUpdateLoop(): void {
		this.updateInterval = setInterval(() => {
			this.updateDisplay();
			this.cleanupOldSessions();
		}, this.UPDATE_INTERVAL);
	}

	private cleanupOldSessions(): void {
		const now = Date.now();
		for (const [uri, session] of this.sessions.entries()) {
			if ((now - session.lastActivityTime) > this.SESSION_TIMEOUT) {
				this.sessions.delete(uri);
			}
		}
	}

	public resetCurrentSession(): void {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const documentUri = activeEditor.document.uri.toString();
			this.sessions.delete(documentUri);
			this.updateDisplay();
			vscode.window.showInformationMessage('Typing statistics reset for current document');
		} else {
			vscode.window.showWarningMessage('No active document to reset statistics for');
		}
	}

	public resetAllSessions(): void {
		this.sessions.clear();
		this.updateDisplay();
		vscode.window.showInformationMessage('All typing statistics reset');
	}

	public showDetailedStats(): void {
		const session = this.getCurrentSession();
		
		if (!session) {
			vscode.window.showInformationMessage('No active typing session');
			return;
		}

		const stats = this.calculateStats(session);
		const minutes = Math.floor(stats.duration / 60);
		const seconds = stats.duration % 60;
		const timeString = minutes > 0 ? `${minutes} minutes ${seconds} seconds` : `${seconds} seconds`;
		
		const message = 
			`Typing Speed Statistics:\n\n` +
			`Words per minute (WPM): ${stats.wpm}\n` +
			`Characters per minute (CPM): ${stats.cpm}\n` +
			`Total characters typed: ${session.charactersTyped}\n` +
			`Session duration: ${timeString}`;

		vscode.window.showInformationMessage(message, 'Reset Current', 'Reset All')
			.then(selection => {
				if (selection === 'Reset Current') {
					this.resetCurrentSession();
				} else if (selection === 'Reset All') {
					this.resetAllSessions();
				}
			});
	}

	public toggleDisplay(): void {
		this.isEnabled = !this.isEnabled;
		if (this.isEnabled) {
			this.updateDisplay();
			vscode.window.showInformationMessage('Typing speed display enabled');
		} else {
			this.statusBarItem.hide();
			vscode.window.showInformationMessage('Typing speed display disabled');
		}
	}

	public dispose(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
		}
		this.statusBarItem.dispose();
		this.disposables.forEach(d => d.dispose());
	}
}

let typingSpeedTracker: TypingSpeedTracker | undefined;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Typing Speed extension is now active!');

	// Create the typing speed tracker
	typingSpeedTracker = new TypingSpeedTracker();

	// Register commands
	const resetStatsCommand = vscode.commands.registerCommand('typing-speed.resetStats', () => {
		if (typingSpeedTracker) {
			typingSpeedTracker.resetCurrentSession();
		}
	});

	const showStatsCommand = vscode.commands.registerCommand('typing-speed.showStats', () => {
		if (typingSpeedTracker) {
			typingSpeedTracker.showDetailedStats();
		}
	});

	const toggleDisplayCommand = vscode.commands.registerCommand('typing-speed.toggleDisplay', () => {
		if (typingSpeedTracker) {
			typingSpeedTracker.toggleDisplay();
		}
	});

	// Add to context subscriptions for proper cleanup
	context.subscriptions.push(
		typingSpeedTracker,
		resetStatsCommand,
		showStatsCommand,
		toggleDisplayCommand
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (typingSpeedTracker) {
		typingSpeedTracker.dispose();
		typingSpeedTracker = undefined;
	}
}
