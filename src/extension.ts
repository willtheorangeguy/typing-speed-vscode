import * as vscode from "vscode";
import { StatsStore } from "./storage/statsStore";
import { countTypedCharacters, TypingSpeedTracker } from "./tracking/typingSpeedTracker";
import { TrackerOptions, TypingSnapshot } from "./types/stats";
import { StatusBarController } from "./ui/statusBarController";

const EXTENSION_SECTION = "vstypingspeed";
const SHOW_STATS_COMMAND = "vstypingspeed.showStats";
const TOGGLE_PAUSE_COMMAND = "vstypingspeed.togglePause";
const RESET_SESSION_COMMAND = "vstypingspeed.resetSessionStats";
const ROLLING_WINDOW_MS = 60_000;
const MINIMUM_SAMPLE_MS = 5_000;
const TRACKABLE_SCHEMES = new Set(["file", "untitled", "vscode-userdata"]);

interface ExtensionConfiguration {
  enabled: boolean;
  idleThresholdMs: number;
  refreshIntervalMs: number;
  pasteThresholdCharacters: number;
}

let deactivateHandler: (() => Thenable<void>) | undefined;

function readConfiguration(): ExtensionConfiguration {
  const configuration = vscode.workspace.getConfiguration(EXTENSION_SECTION);

  return {
    enabled: configuration.get<boolean>("enabled", true),
    idleThresholdMs: Math.max(
      1_000,
      Math.round(configuration.get<number>("idleThresholdSeconds", 5) * 1_000)
    ),
    refreshIntervalMs: Math.max(250, configuration.get<number>("refreshIntervalMs", 1_000)),
    pasteThresholdCharacters: Math.max(
      1,
      configuration.get<number>("pasteThresholdCharacters", 20)
    )
  };
}

function toTrackerOptions(configuration: ExtensionConfiguration): TrackerOptions {
  return {
    idleThresholdMs: configuration.idleThresholdMs,
    rollingWindowMs: ROLLING_WINDOW_MS,
    minimumSampleMs: MINIMUM_SAMPLE_MS,
    pasteThresholdCharacters: configuration.pasteThresholdCharacters
  };
}

function isTrackableEditorChange(event: vscode.TextDocumentChangeEvent): boolean {
  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor) {
    return false;
  }

  return (
    activeEditor.document.uri.toString() === event.document.uri.toString() &&
    TRACKABLE_SCHEMES.has(event.document.uri.scheme)
  );
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }

  return `${seconds}s`;
}

function formatStatsMessage(snapshot: TypingSnapshot): string {
  const statusLabel = snapshot.paused ? "Paused" : "Tracking";
  const roundedWords =
    snapshot.sessionWords >= 100
      ? snapshot.sessionWords.toFixed(0)
      : snapshot.sessionWords.toFixed(1);

  return [
    `State: ${statusLabel}`,
    `Live WPM: ${Math.round(snapshot.liveWpm)}`,
    `Session characters: ${snapshot.sessionCharacters}`,
    `Estimated words: ${roundedWords}`,
    `Active time: ${formatDuration(snapshot.activeTimeMs)}`
  ].join(" | ");
}

export function activate(context: vscode.ExtensionContext): void {
  const store = new StatsStore(context.workspaceState);
  let configuration = readConfiguration();
  const tracker = new TypingSpeedTracker(toTrackerOptions(configuration), store.load());
  const statusBar = new StatusBarController(
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
  );

  context.subscriptions.push(statusBar);

  let dirty = false;
  let saveChain: Promise<void> = Promise.resolve();
  let refreshTimer: NodeJS.Timeout | undefined;

  const refreshStatus = (): void => {
    statusBar.update(tracker.getSnapshot(Date.now()), configuration.enabled);
  };

  const persistState = async (): Promise<void> => {
    const state = tracker.getPersistedState(Date.now());
    dirty = false;
    saveChain = saveChain.then(() => store.save(state));
    await saveChain;
  };

  const persistIfDirty = (): void => {
    if (!dirty) {
      return;
    }

    void persistState().then(undefined, (error: unknown) => {
      console.error("Failed to persist VS Typing Speed state.", error);
    });
  };

  const restartRefreshTimer = (): void => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(() => {
      refreshStatus();
      persistIfDirty();
    }, configuration.refreshIntervalMs);
  };

  const handleTrackerMutation = (): void => {
    dirty = true;
    refreshStatus();
  };

  const showStats = async (): Promise<void> => {
    const snapshot = tracker.getSnapshot(Date.now());
    const followUpAction = await vscode.window.showInformationMessage(
      formatStatsMessage(snapshot),
      tracker.isPaused() ? "Resume Tracking" : "Pause Tracking",
      "Reset Session"
    );

    if (followUpAction === "Reset Session") {
      await vscode.commands.executeCommand(RESET_SESSION_COMMAND);
      return;
    }

    if (followUpAction === "Pause Tracking" || followUpAction === "Resume Tracking") {
      await vscode.commands.executeCommand(TOGGLE_PAUSE_COMMAND);
    }
  };

  const togglePause = async (): Promise<void> => {
    const isPaused = tracker.togglePaused(Date.now());
    handleTrackerMutation();
    await persistState();

    vscode.window.setStatusBarMessage(
      isPaused ? "VS Typing Speed paused." : "VS Typing Speed resumed.",
      2_000
    );
  };

  const resetSession = async (): Promise<void> => {
    const confirmation = await vscode.window.showWarningMessage(
      "Reset the current VS Typing Speed session stats?",
      { modal: true },
      "Reset"
    );

    if (confirmation !== "Reset") {
      return;
    }

    tracker.reset();
    handleTrackerMutation();
    await persistState();
    vscode.window.setStatusBarMessage("VS Typing Speed session reset.", 2_000);
  };

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!configuration.enabled || !isTrackableEditorChange(event)) {
        return;
      }

      const typedCharacters = countTypedCharacters(event, configuration.pasteThresholdCharacters);

      if (typedCharacters === 0) {
        return;
      }

      if (tracker.recordTypedCharacters(typedCharacters, Date.now())) {
        handleTrackerMutation();
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration(EXTENSION_SECTION)) {
        return;
      }

      configuration = readConfiguration();
      tracker.updateOptions(toTrackerOptions(configuration));
      restartRefreshTimer();
      refreshStatus();
    }),
    vscode.commands.registerCommand(SHOW_STATS_COMMAND, showStats),
    vscode.commands.registerCommand(TOGGLE_PAUSE_COMMAND, togglePause),
    vscode.commands.registerCommand(RESET_SESSION_COMMAND, resetSession),
    new vscode.Disposable(() => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    })
  );

  restartRefreshTimer();
  refreshStatus();

  deactivateHandler = () => store.save(tracker.getPersistedState(Date.now()));
}

export function deactivate(): Thenable<void> | undefined {
  return deactivateHandler?.();
}
