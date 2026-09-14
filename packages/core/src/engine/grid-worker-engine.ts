import type {
  GridColumnarBuffer,
  GridEngineWorkerResponse,
  GridWorkerShapeDefinition
} from "../contracts/engine-contract.js";
import type { GridDataShapingResult } from "../shaping/grid-data-shaping.js";
import { TypeScriptWorkerGridEngine } from "./typescript-worker/typescript-worker-grid-engine.js";

export interface GridWorkerExecutionOptions {
  readonly data: GridColumnarBuffer;
  readonly definition: GridWorkerShapeDefinition;
  readonly signal?: AbortSignal;
  readonly onProgress?: (response: Extract<GridEngineWorkerResponse, { type: "progress" }>) => void;
}

export interface GridWorkerEngine {
  shape(options: GridWorkerExecutionOptions): Promise<GridDataShapingResult>;
  destroy(): void;
}

/** Creates the production client shaping engine selected by the Alpha 4 bake-off. */
export function createGridWorkerEngine(): GridWorkerEngine {
  return new TypeScriptWorkerGridEngine();
}
