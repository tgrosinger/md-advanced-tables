/**
 * A `Focus` object represents which cell is focused in the table.
 *
 * Note that `row` and `column` properties specifiy a cell's position in the
 * table, not the cursor's position in the text editor as {@link Point} class.
 *
 * @private
 */
export class Focus {
  /**
   * Row of the focused cell.
   */
  public readonly row: number;

  /**
   * Column of the focused cell.
   */
  public readonly column: number;

  /**
   * Raw offset in the cell.
   */
  public readonly offset: number;

  /**
   * Creates a new `Focus` object.
   *
   * @param row - Row of the focused cell.
   * @param column - Column of the focused cell.
   * @param offset - Raw offset in the cell.
   */
  constructor(row: number, column: number, offset: number) {
    this.row = row;
    this.column = column;
    this.offset = offset;
  }

  /**
   * Checks if two focuses point the same cell.
   * Offsets are ignored.
   */
  public posEquals(focus: Focus): boolean {
    return this.row === focus.row && this.column === focus.column;
  }

  /**
   * Creates a copy of the focus object by setting its row to the specified value.
   *
   * @param row - Row of the focused cell.
   * @returns A new focus object with the specified row.
   */
  public setRow(row: number): Focus {
    return new Focus(row, this.column, this.offset);
  }

  /**
   * Creates a copy of the focus object by setting its column to the specified value.
   *
   * @param column - Column of the focused cell.
   * @returns A new focus object with the specified column.
   */
  public setColumn(column: number): Focus {
    return new Focus(this.row, column, this.offset);
  }

  /**
   * Creates a copy of the focus object by setting its offset to the specified value.
   *
   * @param offset - Offset in the focused cell.
   * @returns A new focus object with the specified offset.
   */
  public setOffset(offset: number): Focus {
    return new Focus(this.row, this.column, offset);
  }
}
