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
});
