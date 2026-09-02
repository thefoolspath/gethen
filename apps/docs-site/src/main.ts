import "@angular/compiler";
import { CommonModule } from "@angular/common";
import { Component, HostListener, ViewChild, signal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { GethenGridComponent } from "@thefoolspath/gethen-angular";
import type {
  GethenGridCellChange,
  GethenGridEditorStateChange,
  GethenGridHistoryChange,
  GethenGridLayoutChange,
  GethenGridPasteResult,
  GethenGridSelection,
  GethenGridSelectionRange
} from "@thefoolspath/gethen-angular";

import { codeForDemo, createDemoConfig, shapeDemoRows } from "./demos.js";
import type { DemoConfig } from "./demos.js";
import { routes } from "./docs-data.js";
import type { DocRoute } from "./docs-data.js";

interface RouteGroup {
  readonly name: string;
  readonly routes: readonly DocRoute[];
}

@Component({
  selector: "gethen-docs-app",
  standalone: true,
  imports: [CommonModule, GethenGridComponent],
  templateUrl: "/apps/docs-site/src/main.html"
})
export class DocsAppComponent {
  @ViewChild("docsGrid") private docsGrid?: GethenGridComponent;

  protected readonly routeGroups = groupRoutes(routes);
  protected readonly activeRoute = signal<DocRoute | undefined>(resolveRoute());
  protected readonly navigationOpen = signal(false);
  protected readonly demoConfig = signal<DemoConfig | undefined>(undefined);
  protected readonly eventLog = signal<readonly string[]>([]);
  protected readonly codeForDemo = codeForDemo;

  constructor() {
    this.applyRoute(false);
  }

  @HostListener("window:popstate")
  protected handlePopState(): void {
    this.applyRoute(true);
  }

  protected navigate(event: MouseEvent, path: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, "", path);
    this.navigationOpen.set(false);
    this.applyRoute(true);
  }

  protected toggleNavigation(): void {
    this.navigationOpen.update((open) => !open);
  }

  protected isActive(path: string): boolean {
    return this.activeRoute()?.path === path;
  }

  protected resetDemo(): void {
    const demo = this.activeRoute()?.demo;
    if (!demo) return;
    const config = createDemoConfig(demo);
    this.demoConfig.set(config);
    this.eventLog.set([`Mounted ${config.rows.length.toLocaleString("en-US")} rows through @thefoolspath/gethen-angular`]);
  }

  protected clearLog(): void {
    this.eventLog.set([]);
  }

  protected handleSelection(selection: GethenGridSelection): void {
    this.prependLog(`Selected ${selection.rowId} / ${selection.columnId}`);
  }

  protected handleSelectionRange(range: GethenGridSelectionRange): void {
    if (this.activeRoute()?.demo === "selection") {
      this.prependLog(`Range ${range.startRowIndex + 1}:${range.endRowIndex + 1}`);
    }
  }

  protected handleCellChange(change: GethenGridCellChange): void {
    this.prependLog(`Changed ${change.rowId} / ${change.columnId}`);
  }

  protected handlePaste(result: GethenGridPasteResult): void {
    this.prependLog(result.committed ? `Pasted ${result.changes.length} cells` : `Rejected ${result.errors.length} cells`);
  }

  protected handleLayout(event: GethenGridLayoutChange): void {
    this.prependLog(`Layout ${event.reason}`);
  }

  protected handleHistory(event: GethenGridHistoryChange): void {
    if (this.activeRoute()?.demo === "history") {
      this.prependLog(`History ${event.undoCount} undo / ${event.redoCount} redo`);
    }
  }

  protected handleEditorState(event: GethenGridEditorStateChange): void {
    if (this.activeRoute()?.demo === "editing" && event.phase !== "inactive") {
      this.prependLog(`Editor ${event.phase}`);
    }
  }

  protected resizeCustomer(): void {
    this.docsGrid?.resizeColumn("customer", 240);
  }

  protected moveStatusFirst(): void {
    this.docsGrid?.reorderColumn("status", 0);
  }

  protected freezePanes(): void {
    this.docsGrid?.freezePanes(2, 2);
  }

  protected undo(): void {
    this.docsGrid?.undo();
  }

  protected redo(): void {
    this.docsGrid?.redo();
  }

  protected applyTealTheme(): void {
    const config = this.demoConfig();
    if (!config) return;
    this.demoConfig.set({
      ...config,
      theme: {
        ...config.theme,
        selectionBackground: "#d6efed",
        activeCellBorder: "#087f78"
      }
    });
    this.prependLog("Applied teal theme tokens");
  }

  protected runShaping(): void {
    const config = this.demoConfig();
    if (!config) return;
    const rows = shapeDemoRows();
    this.demoConfig.set({ ...config, rows, statusBar: { totalRowCount: rows.length } });
    this.prependLog(`Shaped 1,000 rows into ${rows.length} view rows`);
  }

  protected pasteSample(): void {
    const grid = document.querySelector<HTMLElement>("#grid-host [role='grid']");
    const target = grid?.querySelector<HTMLElement>('[data-row-index="0"][data-column-index="1"]');
    if (!grid || !target) return;
    target.click();
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", "Edited customer\tEMEA\nSecond customer\tAPAC");
    grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData }));
  }

  protected async copyCode(): Promise<void> {
    const demo = this.activeRoute()?.demo;
    if (!demo) return;
    await navigator.clipboard.writeText(codeForDemo(demo));
    this.prependLog("Copied Angular example code");
  }

  protected instructionFor(route: DocRoute): string {
    switch (route.demo) {
      case "selection": return "Focus the Angular grid, use Arrow keys, then hold Shift while navigating to extend a range.";
      case "editing": return "Double-click an editable cell, or focus it and start typing. Enter commits and Escape cancels.";
      case "clipboard": return "Select a Customer cell and paste TSV, or use Paste Sample to exercise the Angular output.";
      case "layout": return "Call the public Angular component methods and watch its layoutChange output.";
      case "frozen": return "Scroll after freezing the first two rows and columns to verify the synchronized surfaces.";
      case "history": return "Edit a cell, then use the Angular component's Undo and Redo methods.";
      case "shaping": return "Core shapes deterministic rows, then the Angular adapter renders the resulting public rows.";
      case "large": return "Scroll deeply in both directions while the Angular adapter owns the mounted grid lifecycle.";
      case "readonly": return "Try to edit any cell. Readonly column metadata passes through the Angular adapter.";
      case "angular": return "This page and its live grid both run inside the Angular documentation application.";
      default: return "Use keyboard and pointer input, then inspect the Angular outputs beside the grid.";
    }
  }

  protected nextRoute(route: DocRoute): DocRoute {
    return routes[routes.indexOf(route) + 1] ?? routes[0]!;
  }

  private applyRoute(focusContent: boolean): void {
    const route = resolveRoute();
    this.activeRoute.set(route);
    document.title = route ? `${route.title} · Gethen Documentation` : "Page not found · Gethen Documentation";
    if (route?.demo) {
      const config = createDemoConfig(route.demo);
      this.demoConfig.set(config);
      this.eventLog.set([`Mounted ${config.rows.length.toLocaleString("en-US")} rows through @thefoolspath/gethen-angular`]);
    } else {
      this.demoConfig.set(undefined);
      this.eventLog.set([]);
    }
    if (focusContent) queueMicrotask(() => document.getElementById("main-content")?.focus());
  }

  private prependLog(message: string): void {
    this.eventLog.update((entries) => [message, ...entries].slice(0, 8));
  }
}

function resolveRoute(): DocRoute | undefined {
  if (window.location.pathname === "/docs" || window.location.pathname === "/docs/") return routes[0];
  return routes.find((candidate) => candidate.path === window.location.pathname);
}

function groupRoutes(sourceRoutes: readonly DocRoute[]): readonly RouteGroup[] {
  const groups = new Map<string, DocRoute[]>();
  for (const route of sourceRoutes) {
    const entries = groups.get(route.group) ?? [];
    entries.push(route);
    groups.set(route.group, entries);
  }
  return [...groups.entries()].map(([name, groupedRoutes]) => ({ name, routes: groupedRoutes }));
}

bootstrapApplication(DocsAppComponent).catch((error: unknown) => {
  console.error(error);
});
