import { describe, expect, it, vi } from "vitest";

import { VirtualDomGridEditorCoordinator } from "./virtual-dom-grid-editor-coordinator.js";

describe("VirtualDomGridEditorCoordinator", () => {
  it("coalesces double commit into one operation", async () => {
    const coordinator = new VirtualDomGridEditorCoordinator();
    coordinator.beginSession();
    const operation = vi.fn(async () => true);

    const first = coordinator.runExclusiveCommit(operation);
    const second = coordinator.runExclusiveCommit(operation);

    expect(second).toBe(first);
    await expect(first).resolves.toBe(true);
    expect(operation).toHaveBeenCalledOnce();
  });

  it("invalidates pending work on cancellation, remount, and destruction", async () => {
    const coordinator = new VirtualDomGridEditorCoordinator();
    coordinator.beginSession();
    let token = await captureToken(coordinator);
    coordinator.invalidateOperation();
    expect(coordinator.isCurrent(token)).toBe(false);

    coordinator.beginSession();
    token = await captureToken(coordinator);
    coordinator.cancelSession();
    expect(token.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(token)).toBe(false);

    coordinator.beginSession();
    token = await captureToken(coordinator);
    coordinator.destroy();
    expect(token.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(token)).toBe(false);
  });
});

async function captureToken(coordinator: VirtualDomGridEditorCoordinator) {
  let captured: Parameters<VirtualDomGridEditorCoordinator["isCurrent"]>[0] | undefined;
  await coordinator.runExclusiveCommit(async (token) => {
    captured = token;
    return true;
  });
  return captured!;
}
