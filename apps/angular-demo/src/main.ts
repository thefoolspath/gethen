import "@angular/compiler";
import { Component, signal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { GethenGridComponent, GridSortingMode } from "@thefoolspath/gethen-angular";
import type {
  GethenGridCellChange,
  GethenGridPasteResult,
  GethenGridLayoutChange,
  GethenGridQueryChange,
  GethenGridSelection,
  GethenGridSelectionRange
} from "@thefoolspath/gethen-angular";
import type {
  GridClipboardOptions,
  GridColumnView,
  GridRow,
  GridStylingOptions
} from "@thefoolspath/gethen-core";
import type { CellValue, ColumnId } from "@thefoolspath/gethen-protocol";

const sortingParameter = new URLSearchParams(window.location.search).get("sortingMode");
const sortingDemoEnabled = sortingParameter !== null;
const normalizedSortingParameter = sortingParameter?.toLowerCase();
const initialSortingMode: GridSortingMode = normalizedSortingParameter === GridSortingMode.Single
  ? GridSortingMode.Single
  : normalizedSortingParameter === GridSortingMode.Multiple || normalizedSortingParameter === "multi"
    ? GridSortingMode.Multiple : GridSortingMode.None;

const columns: readonly GridColumnView[] = Array.from({ length: 32 }, (_, columnIndex) => ({
  id: `c${columnIndex}`,
  title: `Column ${columnIndex + 1}`,
  dataType: columnIndex === 2 ? "boolean" : columnIndex % 5 === 0 ? "number" : "text",
  ...(columnIndex === 0 ? { width: 96 } : columnIndex === 1 ? { width: 220 } : {})
}));

const rows: readonly GridRow[] = Array.from({ length: 50000 }, (_, rowIndex) => {
  const cells: Record<ColumnId, CellValue> = {};

  for (const column of columns) {
    const columnIndex = Number(column.id.slice(1));
    cells[column.id] =
      columnIndex === 2
        ? rowIndex % 2 === 0
        : columnIndex % 5 === 0
          ? (rowIndex + 1) * (columnIndex + 1)
          : `R${rowIndex + 1} ${column.title}`;
  }

  return {
    id: `row-${rowIndex + 1}`,
    cells
  };
});

@Component({
  selector: "gethen-angular-demo",
  standalone: true,
  imports: [GethenGridComponent],
  templateUrl: "./src/main.html"
})
export class DemoAppComponent {
  protected readonly columns = columns;
  protected readonly rows = sortingDemoEnabled ? rows.slice(0, 100) : rows;
  protected readonly sortingDemoEnabled = sortingDemoEnabled;
  protected readonly sortingMode = signal<GridSortingMode>(initialSortingMode);
  protected readonly pinnedBottomRows: readonly GridRow[] = [{
    id: "summary",
    cells: { c0: rows.length, c1: "Rows loaded" }
  }];
  protected readonly activeCell = signal("row-1 / c0");
  protected readonly lastChange = signal("None");
  protected readonly selectedRange = signal("R1:C1–R1:C1");
  protected readonly pasteStatus = signal("None");
  protected readonly layoutStatus = signal("default");
  protected readonly sortStatus = signal("none");
  protected readonly columnReordering = signal(true);
  protected readonly styling: GridStylingOptions = {
    getCellClass: ({ column, value }) =>
      column.id === "c2" && value === true ? "demo-approved-cell" : undefined
  };
  protected readonly clipboard: GridClipboardOptions = {
    enabled: true,
    pasteMode: "direct-and-dialog",
    validateBeforeCommit: true
  };

  protected handleSelection(selection: GethenGridSelection): void {
    this.activeCell.set(`${selection.rowId} / ${selection.columnId}`);
  }

  protected handleCellChange(change: GethenGridCellChange): void {
    this.lastChange.set(
      `${change.rowId} / ${change.columnId}: ${String(change.oldValue)} -> ${String(change.newValue)}`
    );
  }

  protected handleSelectionRange(selection: GethenGridSelectionRange): void {
    this.selectedRange.set(
      `R${selection.startRowIndex + 1}:C${selection.startColumnIndex + 1}`
      + `–R${selection.endRowIndex + 1}:C${selection.endColumnIndex + 1}`
    );
  }

  protected handlePaste(result: GethenGridPasteResult): void {
    this.pasteStatus.set(
      result.committed
        ? `${result.changes.length} cells committed`
        : `${result.errors.length} cells rejected`
    );
  }

  protected handleLayoutChange(event: GethenGridLayoutChange): void {
    this.layoutStatus.set(`${event.reason}: ${event.state.columns.map((column) => column.columnId).join(",")}`);
  }

  protected handleQueryChange(event: GethenGridQueryChange): void {
    this.sortStatus.set(`${event.status}: ${event.state.sort.map((sort) =>
      `${sort.columnId}:${sort.direction}`).join(",")}`);
  }

  protected toggleColumnReordering(): void {
    this.columnReordering.update((enabled) => !enabled);
  }

  protected cycleSortingMode(): void {
    this.sortingMode.update((mode) => mode === GridSortingMode.None
      ? GridSortingMode.Single : mode === GridSortingMode.Single
        ? GridSortingMode.Multiple : GridSortingMode.None);
  }
}

bootstrapApplication(DemoAppComponent).catch((error: unknown) => {
  console.error(error);
});
