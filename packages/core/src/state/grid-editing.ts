import type { CellValue } from "@thefoolspath/gethen-protocol";

import type { GridRow } from "../contracts/grid-types.js";
import type { GridColumnView, GridCellContext } from "../renderer/dom/grid-customization.js";

export type GridEditorPhase =
  | "inactive"
  | "activating"
  | "editing"
  | "validating"
  | "committing"
  | "cancelling"
  | "failed"
  | "suspended"
  | "disposed";

export type GridEditorExitReason = "commit" | "cancel" | "scroll" | "unmount";
export type GridBuiltInEditorKind =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "json";

export type GridEditorValue = CellValue;

export type GridValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly message: string; readonly code?: string };

export interface GridSelectOption {
  readonly value: CellValue;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface GridBuiltInEditorDefinition {
  readonly kind: GridBuiltInEditorKind;
  readonly options?: readonly GridSelectOption[];
}

export interface GridEditorContext<TRow extends GridRow = GridRow>
  extends GridCellContext<TRow> {
  readonly initialValue: GridEditorValue;
  readonly nullable: boolean;
  readonly readonly: boolean;
  readonly signal: AbortSignal;
  requestCommit(): void;
  requestCancel(): void;
}

export interface GridCellRenderer<TRow extends GridRow = GridRow> {
  mount(host: HTMLElement, context: GridCellContext<TRow>): void;
  update(context: GridCellContext<TRow>): void;
  destroy(): void;
}

export interface GridCellEditor<TRow extends GridRow = GridRow> {
  mount(host: HTMLElement, context: GridEditorContext<TRow>): void;
  update(context: GridEditorContext<TRow>): void;
  focus(): void;
  getValue(): GridEditorValue;
  validate(value: GridEditorValue): GridValidationResult | Promise<GridValidationResult>;
  commit(value: GridEditorValue): void | Promise<void>;
  cancel(): void | Promise<void>;
  destroy(): void;
}

export type GridCellRendererFactory<TRow extends GridRow = GridRow> =
  () => GridCellRenderer<TRow>;
export type GridCellEditorFactory<TRow extends GridRow = GridRow> =
  () => GridCellEditor<TRow>;

export interface GridEditorSnapshot {
  readonly phase: GridEditorPhase;
  readonly rowId?: string;
  readonly columnId?: string;
  readonly initialValue?: GridEditorValue;
  readonly draftValue?: GridEditorValue;
  readonly error?: GridValidationResult & { readonly valid: false };
  readonly exitReason?: GridEditorExitReason;
}

export interface GridEditorActivation {
  readonly rowId: string;
  readonly columnId: string;
  readonly initialValue: GridEditorValue;
  readonly draftValue?: GridEditorValue;
}

export type GridEditorStateListener = (snapshot: GridEditorSnapshot) => void;

export class GridEditorStateMachine {
  #snapshot: GridEditorSnapshot = { phase: "inactive" };
  readonly #listeners = new Set<GridEditorStateListener>();

  get snapshot(): GridEditorSnapshot {
    return this.#snapshot;
  }

  subscribe(listener: GridEditorStateListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  activate(activation: GridEditorActivation): GridEditorSnapshot {
    if (this.#snapshot.phase !== "inactive") {
      throw new Error("Finish the active editor before activating another cell.");
    }

    this.setSnapshot({
      phase: "activating",
      rowId: activation.rowId,
      columnId: activation.columnId,
      initialValue: activation.initialValue,
      draftValue: activation.draftValue ?? activation.initialValue
    });
    return this.setSnapshot({ ...this.#snapshot, phase: "editing" });
  }

  updateDraft(draftValue: GridEditorValue): GridEditorSnapshot {
    this.requirePhase("editing", "failed");
    const { error: _error, ...snapshot } = this.#snapshot;
    return this.setSnapshot({ ...snapshot, phase: "editing", draftValue });
  }

  beginValidation(): GridEditorSnapshot {
    this.requirePhase("editing", "failed");
    const { error: _error, ...snapshot } = this.#snapshot;
    return this.setSnapshot({ ...snapshot, phase: "validating" });
  }

  validationFailed(result: GridValidationResult & { readonly valid: false }): GridEditorSnapshot {
    this.requirePhase("validating");
    return this.setSnapshot({ ...this.#snapshot, phase: "failed", error: result });
  }

  beginCommit(): GridEditorSnapshot {
    this.requirePhase("validating");
    return this.setSnapshot({ ...this.#snapshot, phase: "committing" });
  }

  committed(): GridEditorSnapshot {
    this.requirePhase("committing");
    return this.exit("commit");
  }

  commitFailed(message: string, code = "commit"): GridEditorSnapshot {
    this.requirePhase("committing");
    return this.setSnapshot({
      ...this.#snapshot,
      phase: "failed",
      error: { valid: false, message, code }
    });
  }

  beginCancel(reason: Exclude<GridEditorExitReason, "commit"> = "cancel"): GridEditorSnapshot {
    this.requirePhase("activating", "editing", "validating", "failed", "suspended");
    return this.setSnapshot({ ...this.#snapshot, phase: "cancelling", exitReason: reason });
  }

  cancelled(): GridEditorSnapshot {
    this.requirePhase("cancelling");
    return this.exit(this.#snapshot.exitReason ?? "cancel");
  }

  suspendForScroll(): GridEditorSnapshot {
    this.requirePhase("editing", "failed");
    return this.setSnapshot({ ...this.#snapshot, phase: "suspended", exitReason: "scroll" });
  }

  resumeAfterScroll(): GridEditorSnapshot {
    this.requirePhase("suspended");
    const { exitReason: _exitReason, ...snapshot } = this.#snapshot;
    return this.setSnapshot({ ...snapshot, phase: "editing" });
  }

  unmount(): GridEditorSnapshot {
    return this.setSnapshot({ phase: "disposed", exitReason: "unmount" });
  }

  private exit(reason: GridEditorExitReason): GridEditorSnapshot {
    this.setSnapshot({ ...this.#snapshot, exitReason: reason });
    return this.setSnapshot({ phase: "inactive", exitReason: reason });
  }

  private requirePhase(...phases: readonly GridEditorPhase[]): void {
    if (!phases.includes(this.#snapshot.phase)) {
      throw new Error(
        `Invalid editor transition from '${this.#snapshot.phase}'; expected ${phases.join(" or ")}.`
      );
    }
  }

  private setSnapshot(snapshot: GridEditorSnapshot): GridEditorSnapshot {
    this.#snapshot = withoutUndefined(snapshot);
    for (const listener of this.#listeners) {
      listener(this.#snapshot);
    }
    return this.#snapshot;
  }
}

export function createGridEditorStateMachine(): GridEditorStateMachine {
  return new GridEditorStateMachine();
}

export function parseBuiltInEditorValue(
  rawValue: string | boolean,
  definition: GridBuiltInEditorDefinition,
  nullable: boolean
): { readonly value: GridEditorValue } | { readonly error: string } {
  if (rawValue === "" && nullable) {
    return { value: null };
  }

  switch (definition.kind) {
    case "boolean":
      return typeof rawValue === "boolean"
        ? { value: rawValue }
        : { error: "A boolean editor requires a boolean value." };
    case "number": {
      const value = Number(rawValue);
      return Number.isFinite(value)
        ? { value }
        : { error: "The value is not a finite number." };
    }
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/u.test(String(rawValue))
        ? { value: String(rawValue) }
        : { error: "Use an ISO date in YYYY-MM-DD format." };
    case "datetime":
      return Number.isNaN(Date.parse(String(rawValue)))
        ? { error: "Use a valid ISO date-time value." }
        : { value: String(rawValue) };
    case "select": {
      const option = definition.options?.find((candidate) => String(candidate.value) === rawValue);
      return option && !option.disabled
        ? { value: option.value }
        : { error: "Select one of the configured values." };
    }
    case "json":
      try {
        JSON.parse(String(rawValue));
        return { value: String(rawValue) };
      } catch {
        return { error: "The value is not valid JSON." };
      }
    case "text":
      return { value: String(rawValue) };
  }
}

export function resolveBuiltInEditor<TRow extends GridRow>(
  column: GridColumnView<TRow>
): GridBuiltInEditorDefinition {
  if (typeof column.editor === "object") {
    return column.editor;
  }

  if (column.dataType === "number" || column.dataType === "boolean") {
    return { kind: column.dataType };
  }

  return { kind: "text" };
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}
