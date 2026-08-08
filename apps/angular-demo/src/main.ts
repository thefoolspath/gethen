import "@angular/compiler";
import { Component, signal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { GethenGridComponent } from "@thefoolspath/gethen-angular";
import type { GethenGridCellChange, GethenGridSelection } from "@thefoolspath/gethen-angular";
import type { GridRow } from "@thefoolspath/gethen-core";
import type { CellValue, ColumnId, GridColumn } from "@thefoolspath/gethen-protocol";

const columns: readonly GridColumn[] = Array.from({ length: 32 }, (_, columnIndex) => ({
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

  protected handleSelection(selection: GethenGridSelection): void {
    this.activeCell.set(`${selection.rowId} / ${selection.columnId}`);
  }

  protected handleCellChange(change: GethenGridCellChange): void {
    this.lastChange.set(
      `${change.rowId} / ${change.columnId}: ${String(change.oldValue)} -> ${String(change.newValue)}`
    );
  }
}

bootstrapApplication(DemoAppComponent).catch((error: unknown) => {
  console.error(error);
});
