export interface GridEditorOperationToken {
  readonly sessionGeneration: number;
  readonly operationGeneration: number;
  readonly signal: AbortSignal;
}

export class VirtualDomGridEditorCoordinator {
  #controller = new AbortController();
  #sessionGeneration = 0;
  #operationGeneration = 0;
  #pendingCommit: Promise<boolean> | undefined;
  #destroyed = false;

  get signal(): AbortSignal {
    return this.#controller.signal;
  }

  get pendingCommit(): Promise<boolean> | undefined {
    return this.#pendingCommit;
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  beginSession(): void {
    this.#controller.abort("replaced");
    this.#controller = new AbortController();
    this.#sessionGeneration += 1;
    this.#operationGeneration += 1;
    this.#pendingCommit = undefined;
  }

  runExclusiveCommit(
    operation: (token: GridEditorOperationToken) => Promise<boolean>
  ): Promise<boolean> {
    if (this.#pendingCommit) return this.#pendingCommit;
    const token = {
      sessionGeneration: this.#sessionGeneration,
      operationGeneration: ++this.#operationGeneration,
      signal: this.#controller.signal
    } as const;
    const commit = operation(token);
    this.#pendingCommit = commit;
    const clearPending = (): void => {
      if (this.#pendingCommit === commit) this.#pendingCommit = undefined;
    };
    void commit.then(clearPending, clearPending);
    return commit;
  }

  invalidateOperation(): void {
    this.#operationGeneration += 1;
  }

  cancelSession(): void {
    this.#sessionGeneration += 1;
    this.#operationGeneration += 1;
    this.#controller.abort("cancel");
    this.#pendingCommit = undefined;
  }

  completeSession(): void {
    this.#controller.abort("commit");
  }

  isCurrent(token: GridEditorOperationToken): boolean {
    return !this.#destroyed
      && !token.signal.aborted
      && token.sessionGeneration === this.#sessionGeneration
      && token.operationGeneration === this.#operationGeneration;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#sessionGeneration += 1;
    this.#operationGeneration += 1;
    this.#controller.abort("unmount");
    this.#pendingCommit = undefined;
  }
}
