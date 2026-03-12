import * as vscode from "vscode";
import { PersistedSessionState } from "../types/stats";

const SESSION_STATE_KEY = "vstypingspeed.sessionState";

export class StatsStore {
  constructor(private readonly storage: vscode.Memento) {}

  public load(): PersistedSessionState | undefined {
    return this.storage.get<PersistedSessionState>(SESSION_STATE_KEY);
  }

  public save(state: PersistedSessionState): Thenable<void> {
    return this.storage.update(SESSION_STATE_KEY, state);
  }
}
