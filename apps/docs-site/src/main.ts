import "@angular/compiler";
import { CommonModule } from "@angular/common";
import { Component, ElementRef, HostListener, ViewChild, computed, signal } from "@angular/core";
import type { OnDestroy } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { gethenDarkTheme, gethenLightTheme } from "@thefoolspath/gethen-core";
import type { VirtualDomGridTheme } from "@thefoolspath/gethen-core";
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

interface PageSection {
  readonly id: string;
  readonly label: string;
}

type ThemeMode = "light" | "dark";

const themeStorageKey = "gethen-docs-theme";
const darkThemeQuery = "(prefers-color-scheme: dark)";

@Component({
  selector: "gethen-docs-app",
  standalone: true,
  imports: [CommonModule, GethenGridComponent],
  templateUrl: "/apps/docs-site/src/main.html"
})
export class DocsAppComponent implements OnDestroy {
  @ViewChild("docsGrid") private docsGrid?: GethenGridComponent;
  @ViewChild("searchInput") private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild("searchDialog") private searchDialog?: ElementRef<HTMLElement>;

  protected readonly routeGroups = groupRoutes(routes);
  protected readonly activeRoute = signal<DocRoute | undefined>(resolveRoute());
  protected readonly navigationOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly demoConfig = signal<DemoConfig | undefined>(undefined);
  protected readonly eventLog = signal<readonly string[]>([]);
  protected readonly codeForDemo = codeForDemo;
  protected readonly themeMode = signal<ThemeMode>(readInitialTheme());
  protected readonly gridTheme = computed<VirtualDomGridTheme>(() => ({
    ...(this.themeMode() === "dark" ? gethenDarkTheme : gethenLightTheme),
    ...this.demoConfig()?.theme
  }));
  protected readonly themeToggleLabel = computed(() =>
    `Switch to ${this.themeMode() === "dark" ? "light" : "dark"} theme`
  );
  protected readonly searchOpen = signal(false);
  protected readonly searchQuery = signal("");
  protected readonly activeSearchIndex = signal(0);
  protected readonly pageLinkCopied = signal(false);
  protected readonly searchResults = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase("en-US");
    if (!query) return routes;
    return routes.filter((route) =>
      [route.title, route.group, route.summary].some((value) => value.toLocaleLowerCase("en-US").includes(query))
    );
  });
  protected readonly pageSections = computed<readonly PageSection[]>(() => {
    const route = this.activeRoute();
    if (!route) return [];
    return [
      { id: "overview", label: "Overview" },
      route.demo
        ? { id: "live-example", label: "Live example" }
        : { id: "guide-content", label: "Guide" },
      ...(route.api?.length ? [{ id: "relevant-api", label: "Relevant API" }] : []),
      { id: "known-limitations", label: "Known limitations" }
    ];
  });

  private readonly systemTheme = window.matchMedia(darkThemeQuery);
  private searchReturnFocus: HTMLElement | null = null;

  constructor() {
    applyDocumentTheme(this.themeMode());
    this.systemTheme.addEventListener("change", this.handleSystemThemeChange);
    this.applyRoute(false);
  }

  ngOnDestroy(): void {
    this.systemTheme.removeEventListener("change", this.handleSystemThemeChange);
  }

  @HostListener("window:popstate")
  protected handlePopState(): void {
    this.applyRoute(true);
  }

  protected navigate(event: MouseEvent, path: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.goToPath(path);
  }

  @HostListener("window:keydown", ["$event"])
  protected handleGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase("en-US") === "k") {
      event.preventDefault();
      this.openSearch();
    } else if (event.key === "Escape" && this.searchOpen()) {
      event.preventDefault();
      this.closeSearch();
    }
  }

  protected toggleNavigation(): void {
    this.navigationOpen.update((open) => !open);
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected toggleTheme(): void {
    const nextMode = this.themeMode() === "dark" ? "light" : "dark";
    window.localStorage.setItem(themeStorageKey, nextMode);
    this.themeMode.set(nextMode);
    applyDocumentTheme(nextMode);
  }

  protected openSearch(): void {
    if (!this.searchOpen()) {
      this.searchReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.searchOpen.set(true);
      this.searchQuery.set("");
      this.activeSearchIndex.set(0);
      requestAnimationFrame(() => this.searchInput?.nativeElement.focus());
    }
  }

  protected closeSearch(): void {
    if (!this.searchOpen()) return;
    this.searchOpen.set(false);
    queueMicrotask(() => this.searchReturnFocus?.focus());
  }

  protected updateSearch(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.searchQuery.set(target.value);
    this.activeSearchIndex.set(0);
  }

  protected handleSearchKeydown(event: KeyboardEvent): void {
    const results = this.searchResults();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.activeSearchIndex.update((index) => results.length === 0 ? 0 : (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.activeSearchIndex.update((index) => results.length === 0 ? 0 : (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const route = results[this.activeSearchIndex()];
      if (route) this.selectSearchRoute(route);
    }
  }

  protected handleSearchDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== "Tab") return;
    const dialog = this.searchDialog?.nativeElement;
    if (!dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>("input, button, [href]")]
      .filter((element) => !element.hasAttribute("disabled"));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  protected selectSearchRoute(route: DocRoute): void {
    this.searchOpen.set(false);
    this.goToPath(route.path);
  }

  protected isActive(path: string): boolean {
    return this.activeRoute()?.path === path;
  }

  protected isActiveGroup(group: RouteGroup): boolean {
    return group.routes.some((route) => this.isActive(route.path));
  }

  protected groupIcon(groupName: string): string {
    switch (groupName) {
      case "Getting Started": return "▣";
      case "Core Features": return "▦";
      case "Customization": return "✦";
      case "Data Operations": return "{ }";
      case "Examples": return "△";
      case "Project": return "♡";
      default: return "•";
    }
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

  protected applyThemeOverride(): void {
    const config = this.demoConfig();
    if (!config) return;
    this.demoConfig.set({
      ...config,
      theme: {
        ...config.theme,
        activeCellBorder: "#ff5a5f"
      }
    });
    this.prependLog("Applied object-spread theme override");
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

  protected async copyPageLink(): Promise<void> {
    await navigator.clipboard.writeText(window.location.href);
    this.pageLinkCopied.set(true);
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

  protected previousRoute(route: DocRoute): DocRoute {
    return routes[routes.indexOf(route) - 1] ?? routes.at(-1)!;
  }

  private applyRoute(focusContent: boolean): void {
    const route = resolveRoute();
    this.pageLinkCopied.set(false);
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

  private goToPath(path: string): void {
    window.history.pushState({}, "", path);
    this.navigationOpen.set(false);
    this.applyRoute(true);
  }

  private readonly handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (window.localStorage.getItem(themeStorageKey)) return;
    const mode = event.matches ? "dark" : "light";
    this.themeMode.set(mode);
    applyDocumentTheme(mode);
  };

  private prependLog(message: string): void {
    this.eventLog.update((entries) => [message, ...entries].slice(0, 8));
  }
}

function readInitialTheme(): ThemeMode {
  const documentTheme = document.documentElement.dataset.theme;
  if (documentTheme === "light" || documentTheme === "dark") return documentTheme;
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia(darkThemeQuery).matches ? "dark" : "light";
}

function applyDocumentTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
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
