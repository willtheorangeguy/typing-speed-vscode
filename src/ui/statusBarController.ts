import * as vscode from "vscode";
import { TypingSnapshot } from "../types/stats";

const SHOW_STATS_COMMAND = "vstypingspeed.showStats";

function formatWords(words: number): string {
  if (words >= 100) {
    return words.toFixed(0);
  }

  return words.toFixed(1);
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

export class StatusBarController implements vscode.Disposable {
  constructor(private readonly item: vscode.StatusBarItem) {
    this.item.name = "VS Typing Speed";
    this.item.command = SHOW_STATS_COMMAND;
  }

  public update(snapshot: TypingSnapshot, enabled: boolean): void {
    if (!enabled) {
      this.item.hide();
      return;
    }

    this.item.text = snapshot.paused
      ? "$(debug-pause) WPM paused"
      : `$(keyboard) ${Math.round(snapshot.liveWpm)} WPM`;
    this.item.tooltip = this.buildTooltip(snapshot);
    this.item.show();
  }

  public dispose(): void {
    this.item.dispose();
  }

  private buildTooltip(snapshot: TypingSnapshot): vscode.MarkdownString {
    const tooltip = new vscode.MarkdownString(undefined, true);
    tooltip.isTrusted = false;
    tooltip.appendMarkdown("**VS Typing Speed**\n\n");
    tooltip.appendMarkdown(`- State: ${snapshot.paused ? "Paused" : "Tracking"}\n`);
    tooltip.appendMarkdown(`- Live WPM: ${Math.round(snapshot.liveWpm)}\n`);
    tooltip.appendMarkdown(`- Session characters: ${snapshot.sessionCharacters}\n`);
    tooltip.appendMarkdown(`- Estimated words: ${formatWords(snapshot.sessionWords)}\n`);
    tooltip.appendMarkdown(`- Active time: ${formatDuration(snapshot.activeTimeMs)}\n\n`);
    tooltip.appendMarkdown("Click to view current session commands.");
    return tooltip;
  }
}
