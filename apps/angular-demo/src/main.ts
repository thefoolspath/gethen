import "@angular/compiler";
import { Component, signal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { GethenGridComponent } from "@thefoolspath/gethen-angular";
import type {
  GethenGridCellChange,
  GethenGridPasteResult,
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

const columns: readonly GridColumnView[] = Array.from({ length: 32 }, (_, columnIndex) => ({
  id: `c${columnIndex}`,
  title: `Column ${columnIndex + 1}`,
  dataType: columnIndex === 2 ? "boolean" : columnIndex % 5 === 0 ? "number" : "text"
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
  protected readonly rows = rows;
  protected readonly activeCell = signal("row-1 / c0");
  protected readonly lastChange = signal("None");
  protected readonly selectedRange = signal("R1:C1–R1:C1");
  protected readonly pasteStatus = signal("None");
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
}

bootstrapApplication(DemoAppComponent).catch((error: unknown) => {
  console.error(error);
});
