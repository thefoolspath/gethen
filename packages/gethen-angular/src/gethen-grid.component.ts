import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from "@angular/core";
import type { AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import type { CellChangeEvent, GridColumn } from "@thefoolspath/gethen-protocol";
import type { GridRow, VirtualDomGrid, VirtualDomGridSelection } from "@thefoolspath/gethen-core";
import { mountVirtualDomGrid } from "@thefoolspath/gethen-core";

export type GethenGridCellChange = CellChangeEvent;
export type GethenGridSelection = VirtualDomGridSelection;

@Component({
  selector: "gethen-grid",
  standalone: true,
  template: '<div #host class="gethen-grid-host"></div>',
  styles: [
    `
      :host {
        display: block;
        min-height: 0;
      }

      .gethen-grid-host {
        width: 100%;
        height: 100%;
        min-height: 240px;
      }
    `
  ]
})
export class GethenGridComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) columns: readonly GridColumn[] = [];
  @Input({ required: true }) rows: readonly GridRow[] = [];
  @Input() rowHeight = 32;
  @Input() columnWidth = 132;

  @Output() cellChange = new EventEmitter<GethenGridCellChange>();
  @Output() selectionChange = new EventEmitter<GethenGridSelection>();

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
      onCellChange: (change) => this.cellChange.emit(change),
      onSelectionChange: (selection) => this.selectionChange.emit(selection)
    });
  }
}
