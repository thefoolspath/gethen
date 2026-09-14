export type DocStability = "Alpha" | "Experimental" | "Preview" | "Project";

export type DemoKind =
  | "angular"
  | "basic"
  | "clipboard"
  | "custom-editor"
  | "custom-renderer"
  | "editing"
  | "formatting"
  | "frozen"
  | "history"
  | "large"
  | "layout"
  | "readonly"
  | "selection"
  | "shaping"
  | "theme";

export interface DocRoute {
  readonly path: string;
  readonly title: string;
  readonly summary: string;
  readonly group: string;
  readonly stability: DocStability;
  readonly details: string;
  readonly demo?: DemoKind;
  readonly api?: readonly string[];
  readonly limitation: string;
}

export const routes: readonly DocRoute[] = [
  route("Getting Started", "introduction", "Introduction", "Understand what Gethen implements today and where the project is heading.", "Gethen is an MIT-licensed, framework-neutral data-grid ecosystem for data-heavy web applications. The Alpha packages cover virtualized rendering, interaction, customization, layout, history, and an experimental client shaping pipeline.", undefined, ["@thefoolspath/gethen-core", "@thefoolspath/gethen-angular", "@thefoolspath/gethen-protocol"]),
  route("Getting Started", "installation", "Installation", "Consume locally built workspace packages without bypassing their public boundaries.", "Packages are local release candidates and have not been published. Install and build through the pnpm workspace, then import only from a package entry point.", undefined, ["pnpm install", "pnpm run build"]),
  route("Getting Started", "basic-grid", "Basic Grid", "Mount a virtualized, keyboard-accessible grid from the built Core package.", "Define typed columns and rows, choose a host element, and mount the framework-neutral DOM renderer. The returned API owns renderer cleanup and layout operations.", "basic", ["mountVirtualDomGrid", "VirtualDomGridOptions", "GridColumnView"]),
  route("Getting Started", "angular-setup", "Angular Setup", "Mount the standalone Angular adapter while keeping Core framework-neutral.", "The Angular package passes typed inputs and outputs to Core. This embedded demo is the existing Angular workspace application, so it exercises the same built adapter package.", "angular", ["GethenGridComponent", "GethenAngularRendererRegistry"]),

  route("Core Features", "virtualization", "Virtualization", "Keep a large client dataset responsive by mounting only visible cells.", "The DOM renderer calculates row and column windows from the current scroll position and adds a small overscan region. Scroll deeply in either direction to verify that cells remain populated.", "large", ["calculateVirtualViewport", "overscanRows", "overscanColumns"]),
  route("Core Features", "selection", "Selection", "Navigate a single cell or extend a rectangular range with keyboard and pointer input.", "Use arrow keys for the active cell and hold Shift while navigating or clicking to extend the normalized selection range. Selection callbacks report stable row and column identifiers.", "selection", ["onSelectionChange", "onSelectionRangeChange", "VirtualDomGridSelectionRange"]),
  route("Core Features", "cell-editing", "Cell Editing", "Edit typed values with keyboard, pointer, validation, and explicit commit or cancel behavior.", "Double-click a cell, press Enter, or start typing to open its editor. Enter and Tab commit, Escape cancels, and readonly columns never enter edit mode.", "editing", ["GridEditorStateMachine", "GridBuiltInEditorDefinition", "onCellChange"]),
  route("Core Features", "clipboard", "Clipboard", "Validate a rectangular TSV paste before committing the complete change set.", "Clipboard paste is opt-in. The renderer parses values by column type, treats the operation atomically, and reports per-cell validation errors instead of partially mutating the grid.", "clipboard", ["GridClipboardOptions", "prepareGridPaste", "onPaste"]),
  route("Core Features", "column-layout", "Column Layout", "Resize and reorder columns through a host-persisted layout state.", "The renderer emits normalized layout events while the host remains responsible for persistence. Use the controls to resize or reorder the sample columns.", "layout", ["GridLayoutState", "resizeColumn", "reorderColumn"]),
  route("Core Features", "frozen-panes", "Frozen Panes", "Keep leading columns and top rows visible inside the virtualized viewport.", "Frozen panes share the same logical layout and accessibility model as the scrolling cells. Multiple rows and leading columns can be frozen together.", "frozen", ["freezePanes", "frozenRowCount", "frozenColumnCount"]),
  route("Core Features", "undo-redo", "Undo / Redo", "Record bounded local cell history without replaying network requests.", "Edits, committed pastes, and saved row transactions can produce reversible local history. Entry count and retained bytes are bounded, and a new change clears the redo branch.", "history", ["GridHistory", "GridHistoryOptions", "undo", "redo"]),

  route("Customization", "themes", "Themes", "Apply Gethen theme tokens and comfortable, compact, or spacious density.", "The default modern-enterprise theme is dependency-free. Theme values are scoped to the mounted grid and can be combined with application-owned CSS variables.", "theme", ["VirtualDomGridTheme", "GridDensity"]),
  route("Customization", "cell-formatting", "Cell Formatting", "Format visible text without converting formatter output into HTML.", "Formatters receive the typed row and column context. Their result is assigned through textContent, preserving the untrusted-cell-value security boundary.", "formatting", ["CellFormatContext", "formatter"]),
  route("Customization", "conditional-styling", "Conditional Styling", "Attach application-owned classes to rows, cells, and headers.", "Class callbacks receive readonly context and return class names. The sample highlights review rows and large totals without exposing raw DOM mutation.", "formatting", ["GridStylingOptions", "getRowClass", "getCellClass", "getHeaderClass"]),
  route("Customization", "custom-renderers", "Custom Renderers", "Use the trusted renderer lifecycle for application-controlled cell content.", "A renderer mounts, updates, and destroys content inside a cell-owned host. Core does not import framework code, and custom rendering remains an explicit trusted extension boundary.", "custom-renderer", ["GridCellRenderer", "GridCellRendererFactory"]),
  route("Customization", "custom-editors", "Custom Editors", "Provide a typed editor lifecycle or select a built-in editor definition.", "Custom editors control focus, value extraction, validation, commit, cancellation, and cleanup. This example uses a built-in select editor through the public column definition.", "custom-editor", ["GridCellEditor", "GridCellEditorFactory", "GridBuiltInEditorKind"]),

  route("Data Operations", "client-data-source", "Client DataSource", "Load and retain typed client rows through the framework-neutral data boundary.", "The current client DataSource serves in-memory rows. Server DataSource, server protocol, and C# integration are explicitly deferred to the separate 2.0 workstream.", "basic", ["ClientDataSource", "createClientDataSource"]),
  experimental("sorting", "Sorting", "Apply deterministic stable multi-column ordering to mixed client values.", "Sort descriptors declare the column, direction, comparison type, and null placement. Equal keys retain source order.", ["stableMultiSort", "GridSortDescriptor"]),
  experimental("filtering", "Filtering", "Filter client rows with explicit operators and comparison types.", "The canonical pipeline filters before sorting, grouping, aggregation, flattening, and viewport slicing.", ["GridFilterDescriptor", "GridFilterOperator"]),
  experimental("grouping", "Grouping", "Create deterministic readonly synthetic group rows with provenance.", "Group rows are distinct from source rows and must never enter editing or row-save paths. The production engine selection is still open.", ["GridGroupRow", "GridGroupDescriptor"]),
  experimental("aggregation", "Aggregation", "Calculate built-in count, sum, min, max, and average values.", "Built-in aggregates run in both Worker candidates. Custom reducers remain client-only and are not portable to the Rust/WASM boundary.", ["GridAggregateDescriptor", "GridBuiltInAggregate"]),

  route("Examples", "large-client-dataset", "Large Client Dataset", "Exercise virtualization with a deterministic 20,000-row workspace.", "This bounded documentation fixture is large enough for deep-scroll regression checks while keeping page startup appropriate for an interactive guide.", "large", ["mountVirtualDomGrid", "calculateVirtualViewport"]),
  route("Examples", "editable-grid", "Editable Grid", "Combine typed editors, selection, clipboard, and bounded history.", "This scenario demonstrates the primary Alpha editing path from activation through typed commit and local undo.", "editing", ["VirtualDomGridOptions", "GridHistoryOptions"]),
  preview("readonly-preview", "Readonly Preview", "Preview a grid surface that declares every displayed column readonly.", "The example blocks editing by column metadata. The optimized Alpha 5 read-only interaction boundary is not implemented yet, so mutation infrastructure may still be installed internally."),
  route("Examples", "enterprise-style-grid", "Enterprise-Style Grid", "Combine headers, row numbers, pinned summary, status, styling, and layout.", "This example uses the implemented Alpha 4 grid shell and default theme without claiming parity with a commercial grid product.", "theme", ["createGridAggregatePinnedRow", "GridStatusBarOptions"]),

  project("roadmap", "Roadmap", "Follow the accepted client-first path through local 1.0 and the deferred Server 2.0 workstream.", "Alpha 5 focuses on read-only Grid Table behavior, Alpha 6 on Formula, Alpha 7 on Pivot, followed by client Beta and 1.0 hardening."),
  project("changelog", "Changelog", "Review the locally verified Alpha release-candidate checkpoints.", "Alpha 1 established the vertical slice, Alpha 2 added customization and row transactions, and Alpha 3 completed the current editing, extension, history, and layout checkpoint."),
  project("known-limitations", "Known Limitations", "Keep experimental boundaries and missing evidence visible.", "No package is published. The Alpha 4 production engine selection, larger capacity evidence, representative-user walkthroughs, and manual NVDA/Chrome validation remain open. Formula, Pivot, and Server DataSource are not available.")
];

function route(
  group: string,
  slug: string,
  title: string,
  summary: string,
  details: string,
  demo?: DemoKind,
  api?: readonly string[]
): DocRoute {
  return {
    path: `/docs/${slug}`,
    title,
    summary,
    group,
    stability: "Alpha",
    details,
    ...(demo ? { demo } : {}),
    ...(api ? { api } : {}),
    limitation: "This page documents locally verified Alpha behavior. APIs may still change before Beta."
  };
}

function experimental(slug: string, title: string, summary: string, details: string, api: readonly string[]): DocRoute {
  return {
    ...route("Data Operations", slug, title, summary, details, "shaping", api),
    stability: "Experimental",
    limitation: "The canonical behavior is implemented, but end-to-end capacity evidence and the production engine decision remain open."
  };
}

function preview(slug: string, title: string, summary: string, details: string): DocRoute {
  return {
    ...route("Examples", slug, title, summary, details, "readonly", ["readonly", "VirtualDomGridOptions"]),
    stability: "Preview",
    limitation: "This preview is not the Alpha 5 optimized read-only interaction boundary and must not be represented as production-ready."
  };
}

function project(slug: string, title: string, summary: string, details: string): DocRoute {
  return {
    ...route("Project", slug, title, summary, details),
    stability: "Project",
    limitation: "Roadmap items are targets, not implemented capability claims."
  };
}
