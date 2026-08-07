import { expect, test } from "@playwright/test";

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

test("core demo supports keyboard active-cell navigation", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");

  await expect(page.locator("#activeCell")).toHaveText("row-2 / c1");
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

test("core demo toggles boolean cells", async ({ page }) => {
  await page.goto("/apps/core-demo/index.html");
  const grid = page.getByRole("grid");

  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");

  await expect(page.locator("#lastChange")).toHaveText("row-1 / c2: true -> false");
});

test("Angular demo mounts the adapter-backed grid", async ({ page }) => {
  await page.goto("/apps/angular-demo/index.html");
  await expect(page.locator("gethen-angular-demo")).toBeVisible();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.locator("#rowCount")).toHaveText("50000");
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
