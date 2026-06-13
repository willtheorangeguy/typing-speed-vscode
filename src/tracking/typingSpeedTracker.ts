import {
  DocumentChangeEventLike,
  PersistedSessionState,
  TrackerOptions,
  TypingEventSample,
  TypingSnapshot
} from "../types/stats";

const AUTO_CLOSING_PAIRS = new Set(["()", "[]", "{}", "\"\"", "''", "``"]);
const UNDO_REASON = 1;
const REDO_REASON = 2;

function countCharactersInInsertedText(text: string): number | null {
  const normalized = text.replace(/\r\n/g, "\n");

  if (normalized.includes("\n")) {
    const withoutNewlines = normalized.replace(/\n/g, "");

    if (/^\s*$/.test(withoutNewlines)) {
      return normalized.split("\n").length - 1;
    }

    return null;
  }

  if (AUTO_CLOSING_PAIRS.has(normalized)) {
    return 1;
  }

  return normalized.length;
}

export function countTypedCharacters(
  changeEvent: DocumentChangeEventLike,
  pasteThresholdCharacters: number
): number {
  if (
    changeEvent.reason === UNDO_REASON ||
    changeEvent.reason === REDO_REASON ||
    changeEvent.contentChanges.length === 0
  ) {
    return 0;
  }

  let totalCharacters = 0;

  for (const change of changeEvent.contentChanges) {
    if (change.rangeLength !== 0 || change.text.length === 0) {
      return 0;
    }

    const characterCount = countCharactersInInsertedText(change.text);

    if (characterCount === null) {
      return 0;
    }

    totalCharacters += characterCount;

    if (totalCharacters > pasteThresholdCharacters) {
      return 0;
    }
  }

  return totalCharacters;
}

export class TypingSpeedTracker {
  private options: TrackerOptions;
  private sessionCharacters = 0;
  private activeTimeMs = 0;
  private lastActivityAt?: number;
  private paused = false;
  private recentEntries: TypingEventSample[] = [];

  constructor(options: TrackerOptions, initialState?: PersistedSessionState) {
    this.options = options;
    this.restore(initialState);
  }

  public updateOptions(options: TrackerOptions): void {
    this.options = options;
    this.pruneRecentEntries(Date.now());
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public togglePaused(now = Date.now()): boolean {
    return this.setPaused(!this.paused, now);
  }

  public setPaused(paused: boolean, now = Date.now()): boolean {
    if (this.paused === paused) {
      return this.paused;
    }

    if (paused) {
      this.activeTimeMs = this.getActiveTimeMs(now);
      this.lastActivityAt = undefined;
      this.recentEntries = [];
    }

    this.paused = paused;
    return this.paused;
  }

  public reset(): void {
    this.sessionCharacters = 0;
    this.activeTimeMs = 0;
    this.lastActivityAt = undefined;
    this.recentEntries = [];
  }

  public recordTypedCharacters(characters: number, now = Date.now()): boolean {
    if (this.paused || characters <= 0) {
      return false;
    }

    if (this.lastActivityAt !== undefined) {
      const gapMs = now - this.lastActivityAt;

      if (gapMs > 0 && gapMs <= this.options.idleThresholdMs) {
        this.activeTimeMs += gapMs;
      }
    }

    this.sessionCharacters += characters;
    this.lastActivityAt = now;
    this.recentEntries.push({ timestamp: now, characters });
    this.pruneRecentEntries(now);
    return true;
  }

  public getSnapshot(now = Date.now()): TypingSnapshot {
    this.pruneRecentEntries(now);

    return {
      liveWpm: this.calculateLiveWpm(now),
      sessionCharacters: this.sessionCharacters,
      sessionWords: this.sessionCharacters / 5,
      activeTimeMs: this.getActiveTimeMs(now),
      paused: this.paused,
      lastActivityAt: this.lastActivityAt,
      recentCharacters: this.getRecentCharacterCount()
    };
  }

  public getPersistedState(now = Date.now()): PersistedSessionState {
    this.pruneRecentEntries(now);

    return {
      sessionCharacters: this.sessionCharacters,
      activeTimeMs: this.getActiveTimeMs(now),
      lastActivityAt: this.lastActivityAt,
      paused: this.paused,
      recentEntries: this.paused ? [] : this.recentEntries
    };
  }

  private restore(initialState?: PersistedSessionState): void {
    if (!initialState) {
      return;
    }

    this.sessionCharacters = initialState.sessionCharacters;
    this.activeTimeMs = initialState.activeTimeMs;
    this.paused = initialState.paused;
    this.lastActivityAt = initialState.paused ? undefined : initialState.lastActivityAt;
    this.recentEntries = initialState.paused ? [] : [...(initialState.recentEntries ?? [])];
    this.pruneRecentEntries(Date.now());

    // If the persisted activity is older than the rolling window, every recent
    // entry is pruned away on restore. Clearing lastActivityAt in that case
    // avoids counting phantom trailing "active time" for a session the user has
    // long since stopped typing in.
    if (this.recentEntries.length === 0) {
      this.lastActivityAt = undefined;
    }
  }

  private pruneRecentEntries(now: number): void {
    const cutoff = now - this.options.rollingWindowMs;
    this.recentEntries = this.recentEntries.filter((entry) => entry.timestamp >= cutoff);
  }

  private getActiveTimeMs(now: number): number {
    if (this.paused || this.lastActivityAt === undefined) {
      return this.activeTimeMs;
    }

    const trailingMs = Math.min(
      Math.max(now - this.lastActivityAt, 0),
      this.options.idleThresholdMs
    );

    return this.activeTimeMs + trailingMs;
  }

  private calculateRollingActiveMs(now: number): number {
    if (this.recentEntries.length === 0) {
      return 0;
    }

    let totalMs = 0;

    for (let index = 1; index < this.recentEntries.length; index += 1) {
      const current = this.recentEntries[index];
      const previous = this.recentEntries[index - 1];
      const gapMs = current.timestamp - previous.timestamp;

      if (gapMs > 0 && gapMs <= this.options.idleThresholdMs) {
        totalMs += gapMs;
      }
    }

    const newestEntry = this.recentEntries[this.recentEntries.length - 1];
    const trailingMs = now - newestEntry.timestamp;

    if (trailingMs > 0 && trailingMs <= this.options.idleThresholdMs) {
      totalMs += trailingMs;
    }

    return totalMs;
  }

  private calculateLiveWpm(now: number): number {
    if (
      this.paused ||
      this.lastActivityAt === undefined ||
      now - this.lastActivityAt > this.options.idleThresholdMs
    ) {
      return 0;
    }

    const recentCharacters = this.getRecentCharacterCount();

    if (recentCharacters === 0) {
      return 0;
    }

    const activeSampleMs = Math.max(
      this.calculateRollingActiveMs(now),
      this.options.minimumSampleMs
    );

    if (activeSampleMs <= 0) {
      return 0;
    }

    return (recentCharacters / 5) / (activeSampleMs / 60000);
  }

  private getRecentCharacterCount(): number {
    return this.recentEntries.reduce((total, entry) => total + entry.characters, 0);
  }
}
