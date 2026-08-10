import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from "@angular/core";
import type { AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import type { CellChangeEvent } from "@thefoolspath/gethen-protocol";
import type {
  GridColumnView,
  GridClipboardOptions,
  GridPasteResult,
  GridRow,
  GridStylingOptions,
  VirtualDomGrid,
  VirtualDomGridSelection,
  VirtualDomGridSelectionRange,
  VirtualDomGridTheme
} from "@thefoolspath/gethen-core";
import { mountVirtualDomGrid } from "@thefoolspath/gethen-core";

export type GethenGridCellChange = CellChangeEvent;
export type GethenGridSelection = VirtualDomGridSelection;
export type GethenGridSelectionRange = VirtualDomGridSelectionRange;
export type GethenGridPasteResult = GridPasteResult;

@Component({
  selector: "gethen-grid",
  standalone: true,
  templateUrl: new URL("./gethen-grid.component.html", import.meta.url).href,
  styleUrls: [new URL("./gethen-grid.component.css", import.meta.url).href]
})
export class GethenGridComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) columns: readonly GridColumnView[] = [];
  @Input({ required: true }) rows: readonly GridRow[] = [];
  @Input() rowHeight = 32;
  @Input() columnWidth = 132;
  @Input() styling: GridStylingOptions | undefined;
  @Input() theme: VirtualDomGridTheme | undefined;
  @Input() clipboard: GridClipboardOptions | undefined;

  @Output() cellChange = new EventEmitter<GethenGridCellChange>();
  @Output() selectionChange = new EventEmitter<GethenGridSelection>();
  @Output() selectionRangeChange = new EventEmitter<GethenGridSelectionRange>();
  @Output() pasteResult = new EventEmitter<GethenGridPasteResult>();

  @ViewChild("host", { static: true }) private host?: ElementRef<HTMLElement>;

  private grid: VirtualDomGrid | undefined;
  private initialized = false;

  ngAfterViewInit(): void {
    this.initialized = true;
    this.mountGrid();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.initialized) {
      this.mountGrid();
    }
  }

  ngOnDestroy(): void {
    this.grid?.destroy();
    this.grid = undefined;
  }

  private mountGrid(): void {
    const hostElement = this.host?.nativeElement;

    if (!hostElement) {
      return;
    }

    this.grid?.destroy();
    this.grid = mountVirtualDomGrid(hostElement, {
      columns: this.columns,
      rows: this.rows,
      rowHeight: this.rowHeight,
      columnWidth: this.columnWidth,
      ...(this.styling ? { styling: this.styling } : {}),
      ...(this.theme ? { theme: this.theme } : {}),
      ...(this.clipboard ? { clipboard: this.clipboard } : {}),
      onCellChange: (change) => this.cellChange.emit(change),
      onSelectionChange: (selection) => this.selectionChange.emit(selection),
      onSelectionRangeChange: (selection) => this.selectionRangeChange.emit(selection),
      onPaste: (result) => this.pasteResult.emit(result)
    });
  }
}
