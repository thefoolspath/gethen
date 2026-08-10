import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

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

test("core demo applies Alpha 2 view metadata and application classes", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await expect(grid).toHaveAttribute("aria-colcount", "50");
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="1"]')).toHaveClass(
    /gethen-numeric-column/
  );
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="1"]')).toHaveText("1");
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="3"]')).toHaveClass(
    /gethen-true-cell/
  );
  await expect(page.locator('[aria-rowindex="2"][aria-colindex="1"]')).toHaveClass(
    /gethen-alternate-row/
  );
});

test("core demo keeps virtualized cells visible after vertical scrolling", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.evaluate((element) => {
    element.scrollTop = 1000 * 32;
  });

  await expect(page.locator('[aria-rowindex="1001"][aria-colindex="1"]')).toBeVisible();
  await expect(page.locator('[aria-rowindex="1001"][aria-colindex="1"]')).toHaveText("1,001");
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
  await expect(page.locator('[aria-rowindex="2"][aria-colindex="2"]')).toHaveAttribute(
    "id",
    "gethen-active-cell"
  );

  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[aria-selected="true"]')).toHaveCount(1);
  await expect(page.locator('[aria-rowindex="2"][aria-colindex="3"]')).toHaveAttribute(
    "id",
    "gethen-active-cell"
  );

  await page.locator('[aria-rowindex="1"][aria-colindex="1"]').click();
  await page.locator('[aria-rowindex="2"][aria-colindex="2"]').click({ modifiers: ["Shift"] });
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
  const cell = page.locator('[aria-rowindex="1"][aria-colindex="2"]');

  await cell.dblclick();
  const editor = page.locator("[data-gethen-editor='true']");
  await expect(editor).toBeFocused();
  await editor.fill("double-click edited");
  await editor.press("Enter");

  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: R1 Column 2 -> double-click edited"
  );
  await expect(editor).toHaveCount(0);

  await page.locator('[aria-rowindex="2"][aria-colindex="2"]').click();
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

  await page.locator('[aria-rowindex="1"][aria-colindex="1"]').click();
  await pasteText(grid, "123\tpasted\tfalse");

  await expect(page.locator("#lastPaste")).toHaveText("3 cells committed");
  await expect(page.locator("#lastChange")).toHaveText("row-1 / c2: true -> false");
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="1"]')).toHaveText("123");
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="2"]')).toHaveText("pasted");
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="3"]')).toHaveText("false");
  await expect(page.locator('[aria-selected="true"]')).toHaveCount(3);
});

test("core demo rejects an invalid paste without partial changes", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await page.locator('[aria-rowindex="1"][aria-colindex="1"]').click();
  await pasteText(grid, "not-a-number\tshould-not-commit");

  await expect(page.locator("#lastPaste")).toHaveText("1 cells rejected");
  await expect(page.locator("#lastChange")).toHaveText("none");
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="1"]')).toHaveText("1");
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="2"]')).toHaveText("R1 Column 2");
});

test("Alpha 3 layout resizes, reorders, and freezes multiple panes", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html?alpha3=on");
  const grid = page.getByRole("grid");
  const firstCell = page.locator('[aria-rowindex="1"][aria-colindex="1"]');

  await page.locator("#resizeColumn").click();
  await expect(firstCell).toHaveCSS("width", "220px");

  await page.locator("#reorderColumn").click();
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="1"]')).toHaveText(
    "Custom: R1 Column 2"
  );
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="2"]')).toHaveAttribute(
    "id",
    "gethen-active-cell"
  );
  await expect(page.locator("#activeCell")).toHaveText("row-1 / c0");

  await page.locator("#freezePanes").click();
  await expect(page.locator("#layoutStatus")).toHaveText("freeze: 2 x 2");
  const before = await page.locator('[aria-rowindex="1"][aria-colindex="1"]').boundingBox();
  await grid.evaluate((element) => {
    element.scrollTop = 1000;
    element.scrollLeft = 500;
  });
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="1"]')).toBeVisible();
  const after = await page.locator('[aria-rowindex="1"][aria-colindex="1"]').boundingBox();
  expect(after?.x).toBeCloseTo(before?.x ?? 0, 0);
  expect(after?.y).toBeCloseTo(before?.y ?? 0, 0);
});

test("Alpha 3 JSON editor validates, commits, and reports lifecycle state", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html?alpha3=on");
  const cell = page.locator('[aria-rowindex="1"][aria-colindex="4"]');
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
  await page.locator('[aria-rowindex="1"][aria-colindex="7"]').dblclick();
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

test("Angular demo mounts the adapter-backed grid", async ({ page }) => {
  await page.goto("/apps/angular-demo/index.html");
  await expect(page.locator("gethen-angular-demo")).toBeVisible();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.locator("#rowCount")).toHaveText("50000");
  await expect(page.locator('[aria-rowindex="1"][aria-colindex="3"]')).toHaveClass(
    /demo-approved-cell/
  );
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

  await page.locator('[aria-rowindex="1"][aria-colindex="2"]').click();
  await pasteText(grid, "adapter paste");

  await expect(page.locator("#pasteStatus")).toHaveText("1 cells committed");
  await expect(page.locator("#lastChange")).toHaveText(
    "row-1 / c1: R1 Column 2 -> adapter paste"
  );
});
