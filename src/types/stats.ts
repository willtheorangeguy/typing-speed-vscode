export interface TypingEventSample {
  timestamp: number;
  characters: number;
}

export interface PersistedSessionState {
  sessionCharacters: number;
  activeTimeMs: number;
  lastActivityAt?: number;
  paused: boolean;
  recentEntries: TypingEventSample[];
}

export interface TypingSnapshot {
  liveWpm: number;
  sessionCharacters: number;
  sessionWords: number;
  activeTimeMs: number;
  paused: boolean;
  lastActivityAt?: number;
  recentCharacters: number;
}

export interface TrackerOptions {
  idleThresholdMs: number;
  rollingWindowMs: number;
  minimumSampleMs: number;
  pasteThresholdCharacters: number;
}

export interface TextContentChangeLike {
  readonly text: string;
  readonly rangeLength: number;
}

export interface DocumentChangeEventLike {
  readonly contentChanges: readonly TextContentChangeLike[];
  readonly reason?: number;
}
