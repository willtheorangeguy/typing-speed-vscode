import { strict as assert } from "assert";
import { countTypedCharacters, TypingSpeedTracker } from "../src/tracking/typingSpeedTracker";

describe("countTypedCharacters", () => {
  it("counts a normal insertion", () => {
    const total = countTypedCharacters(
      {
        contentChanges: [{ rangeLength: 0, text: "hello" }]
      },
      20
    );

    assert.equal(total, 5);
  });

  it("treats auto-closing pairs as one typed character", () => {
    const total = countTypedCharacters(
      {
        contentChanges: [{ rangeLength: 0, text: "()" }]
      },
      20
    );

    assert.equal(total, 1);
  });

  it("counts an enter press without auto-indent padding", () => {
    const total = countTypedCharacters(
      {
        contentChanges: [{ rangeLength: 0, text: "\n    " }]
      },
      20
    );

    assert.equal(total, 1);
  });

  it("ignores replacements and large insertions", () => {
    const replacement = countTypedCharacters(
      {
        contentChanges: [{ rangeLength: 1, text: "x" }]
      },
      20
    );
    const paste = countTypedCharacters(
      {
        contentChanges: [{ rangeLength: 0, text: "abcdefghijklmnopqrstu" }]
      },
      20
    );

    assert.equal(replacement, 0);
    assert.equal(paste, 0);
  });

  it("ignores undo and redo operations", () => {
    const undo = countTypedCharacters(
      { contentChanges: [{ rangeLength: 0, text: "hello" }], reason: 1 },
      20
    );
    const redo = countTypedCharacters(
      { contentChanges: [{ rangeLength: 0, text: "hello" }], reason: 2 },
      20
    );

    assert.equal(undo, 0);
    assert.equal(redo, 0);
  });

  it("ignores empty change sets and deletions", () => {
    const empty = countTypedCharacters({ contentChanges: [] }, 20);
    const deletion = countTypedCharacters(
      { contentChanges: [{ rangeLength: 3, text: "" }] },
      20
    );

    assert.equal(empty, 0);
    assert.equal(deletion, 0);
  });

  it("normalizes CRLF newlines to a single typed character", () => {
    const total = countTypedCharacters(
      { contentChanges: [{ rangeLength: 0, text: "\r\n    " }] },
      20
    );

    assert.equal(total, 1);
  });

  it("ignores multi-line insertions that contain real content (pastes)", () => {
    const total = countTypedCharacters(
      { contentChanges: [{ rangeLength: 0, text: "const a = 1;\nconst b = 2;" }] },
      20
    );

    assert.equal(total, 0);
  });

  it("sums simultaneous edits from multiple cursors", () => {
    const total = countTypedCharacters(
      {
        contentChanges: [
          { rangeLength: 0, text: "a" },
          { rangeLength: 0, text: "b" },
          { rangeLength: 0, text: "c" }
        ]
      },
      20
    );

    assert.equal(total, 3);
  });

  it("counts insertions at the paste threshold but rejects anything larger", () => {
    const atThreshold = countTypedCharacters(
      { contentChanges: [{ rangeLength: 0, text: "x".repeat(5) }] },
      5
    );
    const overThreshold = countTypedCharacters(
      { contentChanges: [{ rangeLength: 0, text: "x".repeat(6) }] },
      5
    );

    assert.equal(atThreshold, 5);
    assert.equal(overThreshold, 0);
  });
});

describe("TypingSpeedTracker", () => {
  const trackerOptions = {
    idleThresholdMs: 5_000,
    rollingWindowMs: 60_000,
    minimumSampleMs: 5_000,
    pasteThresholdCharacters: 20
  };

  it("tracks session totals and live wpm while active", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.recordTypedCharacters(10, 1_000);

    const snapshot = tracker.getSnapshot(6_000);

    assert.equal(snapshot.sessionCharacters, 10);
    assert.equal(snapshot.sessionWords, 2);
    assert.equal(snapshot.activeTimeMs, 5_000);
    assert.equal(Math.round(snapshot.liveWpm), 24);
  });

  it("drops live wpm to zero after the idle threshold", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.recordTypedCharacters(10, 1_000);

    const snapshot = tracker.getSnapshot(6_100);

    assert.equal(snapshot.liveWpm, 0);
  });

  it("preserves accumulated active time across multiple bursts", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.recordTypedCharacters(5, 1_000);
    tracker.recordTypedCharacters(5, 3_000);

    const snapshot = tracker.getSnapshot(4_000);

    assert.equal(snapshot.sessionCharacters, 10);
    assert.equal(snapshot.activeTimeMs, 3_000);
    assert.equal(Math.round(snapshot.liveWpm), 24);
  });

  it("freezes live activity while paused", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.recordTypedCharacters(10, 1_000);
    tracker.setPaused(true, 2_000);

    const snapshot = tracker.getSnapshot(4_000);

    assert.equal(snapshot.paused, true);
    assert.equal(snapshot.activeTimeMs, 1_000);
    assert.equal(snapshot.liveWpm, 0);
  });

  it("resets the session without changing paused state", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.recordTypedCharacters(10, 1_000);
    tracker.setPaused(true, 2_000);
    tracker.reset();

    const snapshot = tracker.getSnapshot(3_000);

    assert.equal(snapshot.paused, true);
    assert.equal(snapshot.sessionCharacters, 0);
    assert.equal(snapshot.activeTimeMs, 0);
    assert.equal(snapshot.liveWpm, 0);
  });

  it("does not count idle gaps longer than the threshold as active time", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.recordTypedCharacters(5, 1_000);
    tracker.recordTypedCharacters(5, 10_000);

    const snapshot = tracker.getSnapshot(10_000);

    assert.equal(snapshot.sessionCharacters, 10);
    assert.equal(snapshot.activeTimeMs, 0);
  });

  it("ignores characters recorded while paused", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.setPaused(true, 1_000);

    assert.equal(tracker.recordTypedCharacters(10, 2_000), false);
    assert.equal(tracker.getSnapshot(3_000).sessionCharacters, 0);
  });

  it("resumes tracking after being unpaused", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.recordTypedCharacters(10, 1_000);
    tracker.setPaused(true, 2_000);
    tracker.setPaused(false, 3_000);
    tracker.recordTypedCharacters(5, 4_000);

    const snapshot = tracker.getSnapshot(5_000);

    assert.equal(snapshot.paused, false);
    assert.equal(snapshot.sessionCharacters, 15);
    assert.equal(snapshot.activeTimeMs, 2_000);
  });

  it("reports the rolling recent character count", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.recordTypedCharacters(4, 1_000);
    tracker.recordTypedCharacters(6, 3_000);

    assert.equal(tracker.getSnapshot(4_000).recentCharacters, 10);
  });

  it("applies updated idle threshold options", () => {
    const tracker = new TypingSpeedTracker(trackerOptions);
    tracker.updateOptions({ ...trackerOptions, idleThresholdMs: 1_000 });
    tracker.recordTypedCharacters(5, 1_000);

    // 2s after the last keystroke is now beyond the 1s idle threshold.
    assert.equal(tracker.getSnapshot(3_000).liveWpm, 0);
  });
});

describe("TypingSpeedTracker persistence", () => {
  const trackerOptions = {
    idleThresholdMs: 5_000,
    rollingWindowMs: 60_000,
    minimumSampleMs: 5_000,
    pasteThresholdCharacters: 20
  };

  it("restores a recent session and keeps it live", () => {
    const now = Date.now();
    const source = new TypingSpeedTracker(trackerOptions);
    source.recordTypedCharacters(10, now);

    const restored = new TypingSpeedTracker(trackerOptions, source.getPersistedState(now));
    const snapshot = restored.getSnapshot(now);

    assert.equal(snapshot.sessionCharacters, 10);
    assert.equal(snapshot.recentCharacters, 10);
    assert.ok(snapshot.liveWpm > 0);
  });

  it("discards stale activity so it does not inflate active time on restore", () => {
    const stale = {
      sessionCharacters: 10,
      activeTimeMs: 5_000,
      lastActivityAt: 1_000,
      paused: false,
      recentEntries: [{ timestamp: 1_000, characters: 10 }]
    };

    const restored = new TypingSpeedTracker(trackerOptions, stale);
    const snapshot = restored.getSnapshot(Date.now());

    assert.equal(snapshot.sessionCharacters, 10);
    // No phantom trailing time: active time stays exactly what was persisted.
    assert.equal(snapshot.activeTimeMs, 5_000);
    assert.equal(snapshot.liveWpm, 0);
  });

  it("clears live activity for a session persisted while paused", () => {
    const paused = {
      sessionCharacters: 42,
      activeTimeMs: 12_000,
      paused: true,
      recentEntries: []
    };

    const restored = new TypingSpeedTracker(trackerOptions, paused);
    const snapshot = restored.getSnapshot(Date.now());

    assert.equal(snapshot.paused, true);
    assert.equal(snapshot.sessionCharacters, 42);
    assert.equal(snapshot.activeTimeMs, 12_000);
    assert.equal(snapshot.liveWpm, 0);
  });
});
