import {
  Component,
  ApplicationRef,
  ElementRef,
  EnvironmentInjector,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject
} from "@angular/core";
import type { AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import type { CellChangeEvent } from "@thefoolspath/gethen-protocol";
import type {
  GridColumnView,
  GridClipboardOptions,
  GridEditorSnapshot,
  GridHistoryEvent,
  GridHistoryOptions,
  GridLayoutEvent,
  GridLayoutState,
  GridPasteResult,
  GridRowNumberOptions,
  GridRow,
  GridStatusBarOptions,
  GridStylingOptions,
  VirtualDomGrid,
  VirtualDomGridSelection,
  VirtualDomGridSelectionRange,
  VirtualDomGridTheme
} from "@thefoolspath/gethen-core";
import { mountVirtualDomGrid } from "@thefoolspath/gethen-core";
import type {
  GethenAngularEditorRegistry,
  GethenAngularGridColumn,
  GethenAngularRendererRegistry
} from "./gethen-angular-registry.js";
import { resolveAngularGridColumns } from "./gethen-angular-registry.js";

export type GethenGridCellChange = CellChangeEvent;
export type GethenGridSelection = VirtualDomGridSelection;
export type GethenGridSelectionRange = VirtualDomGridSelectionRange;
export type GethenGridPasteResult = GridPasteResult;
export type GethenGridLayoutChange = GridLayoutEvent;
export type GethenGridHistoryChange = GridHistoryEvent<CellChangeEvent>;
export type GethenGridEditorStateChange = GridEditorSnapshot;

@Component({
  selector: "gethen-grid",
  standalone: true,
  templateUrl: new URL("./gethen-grid.component.html", import.meta.url).href,
  styleUrls: [new URL("./gethen-grid.component.css", import.meta.url).href]
})
export class GethenGridComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) columns: readonly GethenAngularGridColumn[] = [];
  @Input({ required: true }) rows: readonly GridRow[] = [];
  @Input() rowHeight = 32;
  @Input() columnWidth = 132;
  @Input() styling: GridStylingOptions | undefined;
  @Input() theme: VirtualDomGridTheme | undefined;
  @Input() showColumnHeaders = true;
  @Input() rowNumbers: boolean | GridRowNumberOptions = true;
  @Input() statusBar: false | GridStatusBarOptions = {};
  @Input() pinnedBottomRows: readonly GridRow[] = [];
  @Input() clipboard: GridClipboardOptions | undefined;
  @Input() layoutState: GridLayoutState | undefined;
  @Input() frozenRowCount = 0;
  @Input() frozenColumnCount = 0;
  @Input() history: GridHistoryOptions | false = {};
  @Input() rendererRegistry: GethenAngularRendererRegistry | undefined;
  @Input() editorRegistry: GethenAngularEditorRegistry | undefined;

  @Output() cellChange = new EventEmitter<GethenGridCellChange>();
  @Output() selectionChange = new EventEmitter<GethenGridSelection>();
  @Output() selectionRangeChange = new EventEmitter<GethenGridSelectionRange>();
  @Output() pasteResult = new EventEmitter<GethenGridPasteResult>();
  @Output() layoutChange = new EventEmitter<GethenGridLayoutChange>();
  @Output() historyChange = new EventEmitter<GethenGridHistoryChange>();
  @Output() editorStateChange = new EventEmitter<GethenGridEditorStateChange>();

  @ViewChild("host", { static: true }) private host?: ElementRef<HTMLElement>;

  private grid: VirtualDomGrid | undefined;
  private initialized = false;
  private readonly applicationRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);

  ngAfterViewInit(): void {
    this.initialized = true;
    this.mountGrid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized) {
      if (this.grid && Object.keys(changes).length === 1 && changes["theme"]) {
        this.grid.setTheme(this.theme);
        return;
      }
      this.mountGrid();
    }
  }

  ngOnDestroy(): void {
    this.grid?.destroy();
    this.grid = undefined;
  }

  undo(): readonly CellChangeEvent[] {
    return this.grid?.undo() ?? [];
  }

  redo(): readonly CellChangeEvent[] {
    return this.grid?.redo() ?? [];
  }

  resizeColumn(columnId: string, width: number): void {
    this.grid?.resizeColumn(columnId, width);
  }

  reorderColumn(columnId: string, targetIndex: number): void {
    this.grid?.reorderColumn(columnId, targetIndex);
  }

  freezePanes(frozenRowCount: number, frozenColumnCount: number): void {
    this.grid?.freezePanes(frozenRowCount, frozenColumnCount);
  }

  getLayoutState(): GridLayoutState | undefined {
    return this.grid?.getLayoutState();
  }

  private mountGrid(): void {
    const hostElement = this.host?.nativeElement;

    if (!hostElement) {
      return;
    }

    this.grid?.destroy();
    this.grid = mountVirtualDomGrid(hostElement, {
      columns: resolveAngularGridColumns({
        columns: this.columns,
        applicationRef: this.applicationRef,
        environmentInjector: this.environmentInjector,
        ...(this.rendererRegistry ? { rendererRegistry: this.rendererRegistry } : {}),
        ...(this.editorRegistry ? { editorRegistry: this.editorRegistry } : {})
      }),
      rows: this.rows,
      rowHeight: this.rowHeight,
      columnWidth: this.columnWidth,
      ...(this.styling ? { styling: this.styling } : {}),
      ...(this.theme ? { theme: this.theme } : {}),
      showColumnHeaders: this.showColumnHeaders,
      rowNumbers: this.rowNumbers,
      statusBar: this.statusBar,
      pinnedBottomRows: this.pinnedBottomRows,
      ...(this.clipboard ? { clipboard: this.clipboard } : {}),
      ...(this.layoutState ? { layoutState: this.layoutState } : {}),
      frozenRowCount: this.frozenRowCount,
      frozenColumnCount: this.frozenColumnCount,
      history: this.history,
      onCellChange: (change) => this.cellChange.emit(change),
      onSelectionChange: (selection) => this.selectionChange.emit(selection),
      onSelectionRangeChange: (selection) => this.selectionRangeChange.emit(selection),
      onPaste: (result) => this.pasteResult.emit(result),
      onLayoutChange: (event) => this.layoutChange.emit(event),
      onHistoryChange: (event) => this.historyChange.emit(event),
      onEditorStateChange: (state) => this.editorStateChange.emit(state)
    });
  }
}
