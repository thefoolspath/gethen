import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

function dataCell(page: Page, rowIndex: number, columnIndex: number): Locator {
  return page.locator(`[data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`);
}

async function pasteText(locator: Locator, text: string): Promise<void> {
  await locator.evaluate((element, pastedText) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", pastedText);
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData }));
  }, text);
}

test("virtualized DOM prototype renders visible cells", async ({ page }) => {
  await page.goto("/apps/renderer-prototype/index.html");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.locator("#mountedCells")).not.toHaveText("0");
});

test("Canvas prototype draws visible cells", async ({ page }) => {
  await page.goto("/apps/renderer-canvas-prototype/index.html");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.locator("#drawnCells")).not.toHaveText("0");
});

test("core demo mounts the virtualized DOM renderer", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.locator("#renderedCells")).not.toHaveText("0");
});

test("core demo renders headers and a focus-safe empty state", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html?empty=on");
  const grid = page.getByRole("grid");
  await expect(page.getByRole("columnheader", { name: "Column 1", exact: true })).toBeVisible();
  await expect(page.locator('[data-gethen-empty-state="true"]')).toHaveText("No rows to display");
  await expect(grid).not.toHaveAttribute("aria-activedescendant");
  await expect(page.locator('[data-gethen-status-bar="true"]')).toHaveText("0 rows");
});

test("core demo applies Alpha 2 view metadata and application classes", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await expect(grid).toHaveAttribute("aria-colcount", "51");
  await expect(grid).toHaveAttribute("aria-rowcount", "100002");
  await expect(page.getByRole("columnheader", { name: "Column 1", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Row numbers" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Column 1", exact: true })).toHaveClass(
    /gethen-primary-header/
  );
  await expect(page.getByRole("columnheader", { name: "Column 3", exact: true })).toHaveClass(
    /gethen-boolean-header/
  );
  await expect(dataCell(page, 0, 0)).toHaveClass(
    /gethen-numeric-column/
  );
  await expect(dataCell(page, 0, 0)).toHaveText("1");
  await expect(dataCell(page, 0, 2)).toHaveClass(
    /gethen-true-cell/
  );
  await expect(dataCell(page, 1, 0)).toHaveClass(
    /gethen-alternate-row/
  );
  await expect(page.locator('[data-gethen-status-bar="true"]')).toHaveText("100,000 rows");
  await expect(page.locator('[data-gethen-pinned-bottom="true"]')).not.toHaveCount(0);
});

test("core demo keeps virtualized cells visible after vertical scrolling", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.evaluate((element) => {
    element.scrollTop = 1000 * 34 + 38;
  });

  await expect(dataCell(page, 1000, 0)).toBeVisible();
  await expect(dataCell(page, 1000, 0)).toHaveText("1,001");
});

test("core demo supports keyboard active-cell navigation", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");

  await expect(page.locator("#activeCell")).toHaveText("row-2 / c1");
});

test("core demo extends and collapses a rectangular selection range", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");

  await expect(page.locator('[aria-selected="true"]')).toHaveCount(4);
  await expect(dataCell(page, 1, 1)).toHaveAttribute(
    "id",
    "gethen-active-cell"
  );

  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[aria-selected="true"]')).toHaveCount(1);
  await expect(dataCell(page, 1, 2)).toHaveAttribute(
    "id",
    "gethen-active-cell"
  );

  await dataCell(page, 0, 0).click();
  await dataCell(page, 1, 1).click({ modifiers: ["Shift"] });
  await expect(page.locator('[aria-selected="true"]')).toHaveCount(4);
});

test("core demo commits text edits with typed change events", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.keyboard.type("edited");
  await page.keyboard.press("Enter");

  await expect(page.locator("#lastChange")).toHaveText("row-1 / c1: R1 Column 2 -> edited");
});

test("core demo starts editing a cell on double-click", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const cell = dataCell(page, 0, 1);

  await cell.dblclick();
  const editor = page.locator("[data-gethen-editor='true']");
  await expect(editor).toBeFocused();
  await editor.fill("double-click edited");
  await editor.press("Enter");

  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: R1 Column 2 -> double-click edited"
  );
  await expect(editor).toHaveCount(0);

  await dataCell(page, 1, 1).click();
  await page.keyboard.type("typed after double-click");
  await page.keyboard.press("Enter");

  await expect(page.locator("#lastChange")).toHaveText(
    "row-2 / c1: R2 Column 2 -> typed after double-click"
  );
});

test("core demo starts editing with the first typed character", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.type("typed edit");
  await page.keyboard.press("Enter");

  await expect(page.locator("#lastChange")).toHaveText("row-1 / c1: R1 Column 2 -> typed edit");
});

test("Alpha 3 commits with Tab and advances the logical active cell", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");
  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.keyboard.type("tab committed");
  await page.keyboard.press("Tab");
  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: R1 Column 2 -> tab committed"
  );
  await expect(page.locator("#activeCell")).toHaveText("row-1 / c2");
});

test("core demo toggles boolean cells", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");

  await expect(page.locator("#lastChange")).toHaveText("row-1 / c2: true -> false");
});

test("core demo commits typed tabular paste as one validated range", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await dataCell(page, 0, 0).click();
  await pasteText(grid, "123\tpasted\tfalse");

  await expect(page.locator("#lastPaste")).toHaveText("3 cells committed");
  await expect(page.locator("#lastChange")).toHaveText("row-1 / c2: true -> false");
  await expect(dataCell(page, 0, 0)).toHaveText("123");
  await expect(dataCell(page, 0, 1)).toHaveText("pasted");
  await expect(dataCell(page, 0, 2)).toHaveText("false");
  await expect(page.locator('[aria-selected="true"]')).toHaveCount(3);
});

test("core demo rejects an invalid paste without partial changes", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await dataCell(page, 0, 0).click();
  await pasteText(grid, "not-a-number\tshould-not-commit");

  await expect(page.locator("#lastPaste")).toHaveText("1 cells rejected");
  await expect(page.locator("#lastChange")).toHaveText("none");
  await expect(dataCell(page, 0, 0)).toHaveText("1");
  await expect(dataCell(page, 0, 1)).toHaveText("R1 Column 2");
});

test("Alpha 3 layout resizes, reorders, and freezes multiple panes", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html?alpha3=on");
  const grid = page.getByRole("grid");
  const firstCell = dataCell(page, 0, 0);

  await page.locator("#resizeColumn").click();
  await expect(firstCell).toHaveCSS("width", "220px");

  await page.locator("#reorderColumn").click();
  await expect(dataCell(page, 0, 0)).toHaveText(
    "Custom: R1 Column 2"
  );
  await expect(dataCell(page, 0, 1)).toHaveAttribute(
    "id",
    "gethen-active-cell"
  );
  await expect(page.locator("#activeCell")).toHaveText("row-1 / c0");

  await page.locator("#freezePanes").click();
  await expect(page.locator("#layoutStatus")).toHaveText("freeze: 2 x 2");
  const before = await dataCell(page, 0, 0).boundingBox();
  await grid.evaluate((element) => {
    element.scrollTop = 1000;
    element.scrollLeft = 500;
  });
  await expect(dataCell(page, 0, 0)).toBeVisible();
  const after = await dataCell(page, 0, 0).boundingBox();
  expect(after?.x).toBeCloseTo(before?.x ?? 0, 0);
  expect(after?.y).toBeCloseTo(before?.y ?? 0, 0);
});

test("Alpha 3 JSON editor validates, commits, and reports lifecycle state", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html?alpha3=on");
  const cell = dataCell(page, 0, 3);
  await cell.dblclick();
  const editor = page.locator("textarea[data-gethen-editor='true']");
  await editor.fill("{invalid");
  await editor.press("Enter");
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#editorStatus")).toHaveText("editing");

  await editor.fill('{"status":"ok"}');
  await editor.press("Enter");
  await expect(editor).toHaveCount(0);
  await expect(page.locator("#lastChange")).toContainText('-> {"status":"ok"}');
  await expect(page.locator("#editorStatus")).toHaveText("inactive");
});

test("Alpha 3 history emits inverse changes and supports redo", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");
  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.keyboard.type("history value");
  await page.keyboard.press("Enter");
  await expect(page.locator("#historyStatus")).toHaveText("1 undo / 0 redo");

  await page.locator("#undo").click();
  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: history value -> R1 Column 2"
  );
  await page.locator("#redo").click();
  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: R1 Column 2 -> history value"
  );
});

test("Alpha 3 custom editor lifecycle validates and commits trusted host code", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html?alpha3=on");
  await dataCell(page, 0, 6).dblclick();
  const editor = page.locator("[data-custom-editor='true']");
  await expect(editor).toBeFocused();
  await editor.fill("invalid");
  await editor.press("Enter");
  await expect(page.locator("#editorStatus")).toHaveText("failed");
  await expect(editor).toBeVisible();

  await editor.fill("custom:accepted");
  await editor.press("Enter");
  await expect(editor).toHaveCount(0);
  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c6: R1 Column 7 -> custom:accepted"
  );
});

test("Alpha 3 cancels an editor while asynchronous validation is pending", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html?alpha3=on&asyncEditor=on");
  await dataCell(page, 0, 6).dblclick();
  const editor = page.locator("[data-custom-editor='true']");
  await editor.fill("custom:cancelled");
  await editor.press("Enter");
  await expect(page.locator("#editorStatus")).toHaveText("validating");
  await editor.press("Escape");

  await expect(editor).toHaveCount(0);
  await expect(page.locator("#editorStatus")).toHaveText("inactive");
  await page.waitForTimeout(150);
  await expect(page.locator("#lastChange")).not.toContainText("custom:cancelled");
});

test("Alpha 3 ignores asynchronous validation after grid destruction", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/apps/core-demo/index.html?alpha3=on&asyncEditor=on");
  await dataCell(page, 0, 6).dblclick();
  const editor = page.locator("[data-custom-editor='true']");
  await editor.fill("custom:destroyed");
  await editor.press("Enter");
  await expect(page.locator("#editorStatus")).toHaveText("validating");
  await page.evaluate(() => window.dispatchEvent(new Event("gethen-demo-destroy-grid")));

  await expect(page.getByRole("grid")).toHaveCount(0);
  await page.waitForTimeout(150);
  expect(pageErrors).toEqual([]);
});

test("Alpha 3 coalesces double commit and contains rejected custom-editor commits", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/apps/core-demo/index.html?alpha3=on&asyncEditor=on");
  await dataCell(page, 0, 6).dblclick();
  let editor = page.locator("[data-custom-editor='true']");
  await editor.fill("custom:double");
  await editor.press("Enter");
  await editor.press("Enter");
  await expect(editor).toHaveCount(0);
  await expect(page.locator("#historyStatus")).toHaveText("1 undo / 0 redo");
  await expect(page.locator("#lastChange")).toContainText("custom:double");

  await dataCell(page, 0, 6).dblclick();
  editor = page.locator("[data-custom-editor='true']");
  await editor.fill("custom:reject");
  await editor.press("Enter");
  await expect(page.locator("#editorStatus")).toHaveText("failed");
  await expect(editor).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("Alpha 4 production Grid Worker shapes transferable columnar data", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  await page.locator("#runWorker").click();
  await expect(page.locator("#workerStatus")).toHaveText("50 filtered / 52 view rows");
});

test("Alpha 4 Rust/WASM filter and sort match the 10K mixed-type fixture", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const parity = await page.evaluate(async () => {
    const fixtureUrl = "/benchmarks/engine-bakeoff/alpha4-mixed-type-fixtures.mjs";
    const coreUrl = "/packages/core/dist/index.js";
    const [{ createAlpha4MixedTypeFixture }, core, typescriptCandidate, rustCandidate] = await Promise.all([
      import(fixtureUrl),
      import(coreUrl),
      import("/packages/core/dist/engine/typescript-worker/typescript-worker-grid-engine.js"),
      import("/packages/core/dist/engine/rust-wasm-worker/rust-wasm-worker-grid-engine.js")
    ]);
    const fixture = createAlpha4MixedTypeFixture("small");
    const definition = core.createGridWorkerShapeDefinition({
      filter: [
        { columnId: "number-00", operator: "greaterThan", value: -2_500, comparisonType: "number" },
        { columnId: "text-00", operator: "contains", value: "a", comparisonType: "text" },
        { columnId: "boolean-00", operator: "equals", value: true, comparisonType: "boolean" },
        { columnId: "date-00", operator: "greaterThanOrEqual", value: "2021-01-01", comparisonType: "date" },
        { columnId: "json-00", operator: "isNotNull", comparisonType: "json" }
      ],
      sort: [
        { columnId: "json-00", direction: "asc", comparisonType: "json", nulls: "last" },
        { columnId: "date-01", direction: "desc", comparisonType: "date", nulls: "last" },
        { columnId: "number-01", direction: "desc", comparisonType: "number", nulls: "last" }
      ]
    });
    const typescriptEngine = typescriptCandidate.createTypeScriptWorkerGridEngine();
    const rustEngine = rustCandidate.createRustWasmWorkerGridEngine();
    try {
      const [typescriptResult, rustResult] = await Promise.all([
        typescriptEngine.shape({ data: fixture.data, definition }),
        rustEngine.shape({ data: createAlpha4MixedTypeFixture("small").data, definition })
      ]);
      return {
        equal: JSON.stringify(typescriptResult) === JSON.stringify(rustResult),
        filteredRowCount: rustResult.filteredRowCount,
        returnedRowCount: rustResult.rows.length
      };
    } finally {
      typescriptEngine.destroy();
      rustEngine.destroy();
    }
  });
  expect(parity).toEqual({ equal: true, filteredRowCount: 898, returnedRowCount: 898 });
});

test("Alpha 4 Rust/WASM grouping and aggregates match the 10K mixed-type fixture", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const parity = await page.evaluate(async () => {
    const fixtureUrl = "/benchmarks/engine-bakeoff/alpha4-mixed-type-fixtures.mjs";
    const coreUrl = "/packages/core/dist/index.js";
    const [{ createAlpha4MixedTypeFixture }, core, typescriptCandidate, rustCandidate] = await Promise.all([
      import(fixtureUrl),
      import(coreUrl),
      import("/packages/core/dist/engine/typescript-worker/typescript-worker-grid-engine.js"),
      import("/packages/core/dist/engine/rust-wasm-worker/rust-wasm-worker-grid-engine.js")
    ]);
    const definition = core.createGridWorkerShapeDefinition({
      filter: [
        { columnId: "number-02", operator: "greaterThan", value: -7_500, comparisonType: "number" }
      ],
      sort: [
        { columnId: "number-03", direction: "asc", comparisonType: "number", nulls: "last" }
      ],
      group: [
        { columnId: "boolean-01", comparisonType: "boolean" },
        { columnId: "text-02", comparisonType: "text" }
      ],
      aggregate: [
        { id: "rowCount", operation: "count" },
        { id: "valueCount", operation: "count", columnId: "number-04" },
        { id: "valueSum", operation: "sum", columnId: "number-04" },
        { id: "valueMin", operation: "min", columnId: "number-04" },
        { id: "valueMax", operation: "max", columnId: "number-04" },
        { id: "valueAverage", operation: "average", columnId: "number-04" }
      ],
      expandedGroupIds: "all"
    });
    const typescriptEngine = typescriptCandidate.createTypeScriptWorkerGridEngine();
    const rustEngine = rustCandidate.createRustWasmWorkerGridEngine();
    try {
      const [typescriptResult, rustResult] = await Promise.all([
        typescriptEngine.shape({
          data: createAlpha4MixedTypeFixture("small").data,
          definition
        }),
        rustEngine.shape({
          data: createAlpha4MixedTypeFixture("small").data,
          definition
        })
      ]);
      const viewportDefinition = {
        ...definition,
        viewport: { start: 8_870, count: Number.MAX_SAFE_INTEGER }
      };
      const [typescriptViewport, rustViewport] = await Promise.all([
        typescriptEngine.shape({
          data: createAlpha4MixedTypeFixture("small").data,
          definition: viewportDefinition
        }),
        rustEngine.shape({
          data: createAlpha4MixedTypeFixture("small").data,
          definition: viewportDefinition
        })
      ]);
      return {
        equal: JSON.stringify(typescriptResult) === JSON.stringify(rustResult),
        viewportEqual: JSON.stringify(typescriptViewport) === JSON.stringify(rustViewport),
        viewportRowCount: rustViewport.rows.length,
        filteredRowCount: rustResult.filteredRowCount,
        totalViewRowCount: rustResult.totalViewRowCount,
        returnedRowCount: rustResult.rows.length,
        groupRowCount: rustResult.rows.filter((row: { kind: string }) => row.kind === "group").length
      };
    } finally {
      typescriptEngine.destroy();
      rustEngine.destroy();
    }
  });
  expect(parity).toEqual({
    equal: true,
    viewportEqual: true,
    viewportRowCount: 6,
    filteredRowCount: 8_840,
    totalViewRowCount: 8_876,
    returnedRowCount: 8_876,
    groupRowCount: 36
  });
});

test("Angular demo mounts the adapter-backed grid", async ({ page }) => {
  await page.goto("/apps/angular-demo/index.html");
  await expect(page.locator("gethen-angular-demo")).toBeVisible();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.locator("#rowCount")).toHaveText("50000");
  await expect(dataCell(page, 0, 2)).toHaveClass(
    /demo-approved-cell/
  );
  await expect(page.locator('[data-gethen-pinned-bottom="true"]')).not.toHaveCount(0);
});

test("Angular demo relays selection and edit events", async ({ page }) => {
  await page.goto("/apps/angular-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");

  await expect(page.locator("#activeCell")).toHaveText("row-2 / c1");

  await page.keyboard.press("Enter");
  await page.keyboard.type("angular edited");
  await page.keyboard.press("Enter");

  await expect(page.locator("#lastChange")).toHaveText("row-2 / c1: R2 Column 2 -> angular edited");
});

test("Angular demo retains pointer editor focus and fits the active cell", async ({ page }) => {
  await page.goto("/apps/angular-demo/index.html");
  const cell = dataCell(page, 0, 1);
  const cellBounds = await cell.boundingBox();

  await cell.dblclick();
  const editor = page.locator("[data-gethen-editor='true']");
  await expect(editor).toBeFocused();

  await editor.click();
  await expect(editor).toBeFocused();
  await expect(editor).toHaveCount(1);

  const editorBounds = await editor.boundingBox();
  expect(cellBounds).not.toBeNull();
  expect(editorBounds).not.toBeNull();
  expect(editorBounds?.x).toBeCloseTo(cellBounds?.x ?? 0, 0);
  expect(editorBounds?.y).toBeCloseTo(cellBounds?.y ?? 0, 0);
  expect(editorBounds?.width).toBeCloseTo(cellBounds?.width ?? 0, 0);
  expect(editorBounds?.height).toBeCloseTo(cellBounds?.height ?? 0, 0);

  await editor.fill("pointer edited");
  await editor.press("Enter");
  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: R1 Column 2 -> pointer edited"
  );
});

test("Angular demo commits text and number edits before focusing another cell", async ({ page }) => {
  await page.goto("/apps/angular-demo/index.html");

  await dataCell(page, 0, 1).dblclick();
  await page.locator("[data-gethen-editor='true']").fill("focus committed");
  await dataCell(page, 1, 1).click();
  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: R1 Column 2 -> focus committed"
  );
  await expect(dataCell(page, 0, 1)).toHaveText("focus committed");

  await dataCell(page, 0, 0).dblclick();
  await page.locator("[data-gethen-editor='true']").fill("42");
  await dataCell(page, 1, 0).click();
  await expect(page.locator("#lastChange")).toHaveText("row-1 / c0: 1 -> 42");
  await expect(dataCell(page, 0, 0)).toHaveText("42");
});

test("Angular demo relays range selection events", async ({ page }) => {
  await page.goto("/apps/angular-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");

  await expect(page.locator("#selectedRange")).toHaveText("R1:C1–R2:C2");
  await expect(page.locator('[aria-selected="true"]')).toHaveCount(4);
});

test("Angular demo passes clipboard options and paste results through the adapter", async ({ page }) => {
  await page.goto("/apps/angular-demo/index.html");
  const grid = page.getByRole("grid");

  await dataCell(page, 0, 1).click();
  await pasteText(grid, "adapter paste");

  await expect(page.locator("#pasteStatus")).toHaveText("1 cells committed");
  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: R1 Column 2 -> adapter paste"
  );
});
