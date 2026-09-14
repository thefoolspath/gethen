import { parentPort } from "node:worker_threads";

if (!parentPort) {
  throw new Error("The TypeScript reference worker must run in a worker thread.");
}

parentPort.on("message", ({ id, buffer }) => {
  const values = new Float64Array(buffer);
  let sum = 0;
  let aboveThreshold = 0;
  for (const value of values) {
    if (value > 250_000) {
      sum += value;
      aboveThreshold += 1;
    }
  }
  parentPort.postMessage({ id, sum, aboveThreshold });
});

parentPort.postMessage({ type: "ready" });
