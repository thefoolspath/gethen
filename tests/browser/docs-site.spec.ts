import { expect, test } from "@playwright/test";

import { routes } from "../../apps/docs-site/src/docs-data.js";

test.describe.configure({ mode: "serial" });

test("documentation registered routes load through the Angular shell", async ({ page }) => {
  test.setTimeout(180_000);

  const pageErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  for (const route of routes) {
    pageErrors.length = 0;
    failedResponses.length = 0;

    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.title, { timeout: 15_000 });
    await expect(page.locator(`a[href="${route.path}"][aria-current="page"]`)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Known limitations", exact: true })).toBeVisible();
    expect(pageErrors, route.path).toEqual([]);
    expect(failedResponses, route.path).toEqual([]);
  }
});

test("documentation clean-path navigation preserves history and focus", async ({ page }) => {
  await page.goto("/docs/introduction");
  await page.getByRole("link", { name: "Build an Angular grid" }).click();

  await expect(page).toHaveURL(/\/docs\/basic-grid$/u);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Basic Grid");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/\/docs\/introduction$/u);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Introduction");
});

test("documentation not-found route keeps the site shell", async ({ page }) => {
  await page.goto("/docs/not-a-real-page");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Documentation" })).toBeVisible();
});

test("basic grid mounts from the built Angular adapter and resets deterministically", async ({ page }) => {
  await page.goto("/docs/basic-grid");
  await expect(page.locator("gethen-docs-app")).toBeVisible();
  await expect(page.locator("gethen-grid")).toBeVisible();
  const grid = page.getByRole("grid");
  await expect(grid).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Order", exact: true })).toBeVisible();

  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#event-log li").first()).toContainText("Selected order-1 / customer");

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#event-log li").first()).toContainText("Mounted 1,000 rows");
});

test("virtualization example remains populated after deep two-axis scrolling", async ({ page }) => {
  await page.goto("/docs/virtualization");
  const grid = page.getByRole("grid");
  await grid.evaluate((element) => {
    element.scrollTop = 10_000 * 34 + 38;
    element.scrollLeft = 400;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });

  await expect.poll(async () =>
    page.locator("[data-row-index]").evaluateAll((elements) =>
      elements.some((element) => Number(element.getAttribute("data-row-index")) >= 10_000)
    )
  ).toBe(true);
  await expect(page.locator("gethen-grid")).toBeVisible();
});

test("selection example reports a rectangular keyboard range", async ({ page }) => {
  await page.goto("/docs/selection");
  const grid = page.getByRole("grid");
  await grid.focus();
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");

  await expect(page.locator('[aria-selected="true"]')).toHaveCount(4);
  await expect(page.locator("#event-log")).toContainText("Range 1:2");
});

test("editing and local history perform their advertised interaction", async ({ page }) => {
  await page.goto("/docs/undo-redo");
  const grid = page.getByRole("grid");
  await grid.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.keyboard.type("History edit");
  await page.keyboard.press("Enter");
  await expect(page.locator("#event-log")).toContainText("History 1 undo / 0 redo");

  await page.getByRole("button", { name: "Undo" }).click();
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(page.locator("#event-log")).toContainText("History");
});

test("clipboard example commits the deterministic sample", async ({ page }) => {
  await page.goto("/docs/clipboard");
  await page.getByRole("button", { name: "Paste Sample" }).click();
  await expect(page.locator("#event-log")).toContainText("Pasted 4 cells");
});

test("layout controls emit resize and reorder events", async ({ page }) => {
  await page.goto("/docs/column-layout");
  await page.getByRole("button", { name: "Resize Customer" }).click();
  await page.getByRole("button", { name: "Move Status First" }).click();
  await expect(page.locator("#event-log")).toContainText("Layout resize");
  await expect(page.locator("#event-log")).toContainText("Layout reorder");
});

test("frozen panes and shaping controls report their advertised operation", async ({ page }) => {
  await page.goto("/docs/frozen-panes");
  await page.getByRole("button", { name: "Freeze 2 × 2" }).click();
  await expect(page.locator("#event-log")).toContainText("Layout freeze");

  await page.goto("/docs/grouping");
  await page.getByRole("button", { name: "Run Shaping" }).click();
  await expect(page.locator("#event-log")).toContainText("Shaped 1,000 rows");
});

test("Angular setup renders through the built Angular adapter", async ({ page }) => {
  await page.goto("/docs/angular-setup");
  await expect(page.locator("gethen-docs-app")).toBeVisible();
  await expect(page.locator("gethen-grid")).toBeVisible();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Order", exact: true })).toBeVisible();
});

test("experimental shaping and readonly preview disclose their boundaries", async ({ page }) => {
  await page.goto("/docs/grouping");
  await expect(page.getByText("Experimental", { exact: true }).first()).toBeVisible();
  await expect(page.locator("#event-log")).toContainText("Mounted 100 rows");

  await page.goto("/docs/readonly-preview");
  await expect(page.getByText("Preview", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Known limitations" }).locator(".." )).toContainText("Alpha 5");
});

test("narrow viewport exposes keyboard-accessible documentation navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/introduction");
  const toggle = page.getByRole("button", { name: "Browse docs" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Documentation" })).toBeVisible();
});
