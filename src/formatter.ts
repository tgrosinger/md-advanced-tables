import { Alignment, DefaultAlignment, HeaderAlignment } from './alignment';
import { Options } from './options';
import { Table } from './table';
import { TableCell } from './table-cell';
import { TableRow } from './table-row';
import { getEAW } from 'meaw';
const removeMd = require('remove-md');

export interface FormattedTable {
  /**
   * A formatted table object.
   */
  table: Table;

  /**
   * The common left margin of the formatted table.
   */
  marginLeft: string;
}

export interface CompletedTable {
  /**
   * A completed table object.
   */
  table: Table;

  /**
   * `true` if a delimiter row is inserted.
   */
  delimiterInserted: boolean;
}

/**
 * An object containing options for computing text widths.
 */
export interface TextWidthOptions {
  /**
   * Normalizes text before computing text widths.
   * @public
   */
  normalize: boolean;

  /**
   * A set of characters that should be treated as wide.
   * @public
   */
  wideChars: Set<string>;

  /**
   * A set of characters that should be treated as narrow.
   * @public
   */
  narrowChars: Set<string>;

  /**
   * Treats East Asian Ambiguous characters as wide.
   * @public
   */
  ambiguousAsWide: boolean;
}

/**
 * Creates a delimiter text.
 *
 * @private
 * @param width - Width of the horizontal bar of delimiter.
 * @throws {Error} Unknown alignment.
 */
export const _delimiterText = (alignment: Alignment, width: number): string => {
  const bar = '-'.repeat(width);
  switch (alignment) {
    case Alignment.NONE:
      return ` ${bar} `;
    case Alignment.LEFT:
      return `:${bar} `;
    case Alignment.RIGHT:
      return ` ${bar}:`;
    case Alignment.CENTER:
      return `:${bar}:`;
    default:
      throw new Error('Unknown alignment: ' + alignment);
  }
};

/**
 * Extends array size.
 *
 * @private
 * @param callback - Callback function to fill newly created cells.
 * @returns Extended array.
 */
export const _extendArray = <T>(
  arr: T[],
  size: number,
  callback: (i: number, arr: T[]) => T,
): T[] => {
  const extended = arr.slice();
  for (let i = arr.length; i < size; i++) {
    extended.push(callback(i, arr));
  }
  return extended;
};

/**
 * Completes a table by adding missing delimiter and cells.
 * After completion, all rows in the table have the same width.
 *
 * @private
 *
 * @throws {Error} Empty table.
 */
export const completeTable = (
  table: Table,
  options: Options,
): CompletedTable => {
  const tableHeight = table.getHeight();
  const tableWidth = table.getWidth();
  if (tableHeight === 0) {
    throw new Error('Empty table');
  }
  const rows = table.getRows();
  const newRows = [];
  // header
  const headerRow = rows[0];
  const headerCells = headerRow.getCells();
  newRows.push(
    new TableRow(
      _extendArray(
        headerCells,
        tableWidth,
        (j) =>
          new TableCell(j === headerCells.length ? headerRow.marginRight : ''),
      ),
      headerRow.marginLeft,
      headerCells.length < tableWidth ? '' : headerRow.marginRight,
    ),
  );
  // delimiter
  const delimiterRow = table.getDelimiterRow();
  if (delimiterRow !== undefined) {
    const delimiterCells = delimiterRow.getCells();
    newRows.push(
      new TableRow(
        _extendArray(
          delimiterCells,
          tableWidth,
          (j) =>
            new TableCell(
              _delimiterText(
                Alignment.NONE,
                j === delimiterCells.length
                  ? Math.max(
                      options.minDelimiterWidth,
                      delimiterRow.marginRight.length - 2,
                    )
                  : options.minDelimiterWidth,
              ),
            ),
        ),
        delimiterRow.marginLeft,
        delimiterCells.length < tableWidth ? '' : delimiterRow.marginRight,
      ),
    );
  } else {
    newRows.push(
      new TableRow(
        _extendArray(
          [],
          tableWidth,
          () =>
            new TableCell(
              _delimiterText(Alignment.NONE, options.minDelimiterWidth),
            ),
        ),
        '',
        '',
      ),
    );
  }
  // body
  for (let i = delimiterRow !== undefined ? 2 : 1; i < tableHeight; i++) {
    const row = rows[i];
    const cells = row.getCells();
    newRows.push(
      new TableRow(
        _extendArray(
          cells,
          tableWidth,
          (j) => new TableCell(j === cells.length ? row.marginRight : ''),
        ),
        row.marginLeft,
        cells.length < tableWidth ? '' : row.marginRight,
      ),
    );
  }
  return {
    table: new Table(newRows),
    delimiterInserted: delimiterRow === undefined,
  };
};

/**
 * Calculates the width of a text based on characters' EAW properties.
 *
 * @private
 *
 * @returns Calculated width of the text.
 */
export const _computeTextWidth = (
  text: string,
  options: TextWidthOptions,
): number => {
  const unformattedText = removeMd(text);
  const normalized = options.normalize
    ? unformattedText.normalize('NFC')
    : unformattedText;
  let w = 0;
  // If text has inline link add 2 spaces to account for the link icon
  if (/\[([^\]]*?)\][\[\(].*?[\]\)]/g.test(text)) {
    w += 2;
  }
  for (const char of normalized) {
    if (options.wideChars.has(char)) {
      w += 2;
      continue;
    }
    if (options.narrowChars.has(char)) {
      w += 1;
      continue;
    }
    switch (getEAW(char)) {
      case 'F':
      case 'W':
        w += 2;
        break;
      case 'A':
        w += options.ambiguousAsWide ? 2 : 1;
        break;
      default:
        w += 1;
    }
  }
  return w;
};

/**
 * Returns a aligned cell content.
 *
 * @throws {Error} Unknown alignment.
 * @throws {Error} Unexpected default alignment.
 */
export const _alignText = (
  text: string,
  width: number,
  alignment: Alignment,
  options: TextWidthOptions,
): string => {
  const space = width - _computeTextWidth(text, options);
  if (space < 0) {
    return text;
  }
  switch (alignment) {
    case Alignment.NONE:
      throw new Error('Unexpected default alignment');
    case Alignment.LEFT:
      return text + ' '.repeat(space);
    case Alignment.RIGHT:
      return ' '.repeat(space) + text;
    case Alignment.CENTER:
      return (
        ' '.repeat(Math.floor(space / 2)) +
        text +
        ' '.repeat(Math.ceil(space / 2))
      );
    default:
      throw new Error('Unknown alignment: ' + alignment);
  }
};

/**
 * Just adds one space paddings to both sides of a text.
 *
 * @private
 */
export const _padText = (text: string): string => ` ${text} `;

/**
 * Formats a table.
 *
 * @private
 */
export const _formatTable = (
  table: Table,
  options: Options,
): FormattedTable => {
  const tableHeight = table.getHeight();
  const tableWidth = table.getWidth();
  if (tableHeight === 0) {
    return {
      table,
      marginLeft: '',
    };
  }
  const marginLeft = table.getRows()[0].marginLeft;
  if (tableWidth === 0) {
    const rows = new Array(tableHeight).fill(new TableRow([], marginLeft, ''));
    return {
      table: new Table(rows),
      marginLeft,
    };
  }
  // compute column widths
  const delimiterRow = table.getDelimiterRow();
  const columnWidths = new Array(tableWidth).fill(0);
  if (delimiterRow !== undefined) {
    const delimiterRowWidth = delimiterRow.getWidth();
    for (let j = 0; j < delimiterRowWidth; j++) {
      columnWidths[j] = options.minDelimiterWidth;
    }
  }
  for (let i = 0; i < tableHeight; i++) {
    if (delimiterRow !== undefined && i === 1) {
      continue;
    }
    const row = table.getRows()[i];
    const rowWidth = row.getWidth();
    for (let j = 0; j < rowWidth; j++) {
      columnWidths[j] = Math.max(
        columnWidths[j],
        _computeTextWidth(row.getCellAt(j)!.content, options.textWidthOptions),
      );
    }
  }
  // get column alignments
  const alignments =
    delimiterRow !== undefined
      ? _extendArray(
          delimiterRow.getCells().map((cell) => cell.getAlignment()),
          tableWidth,
          // Safe conversion because DefaultAlignment is a subset of Alignment
          () => (options.defaultAlignment as unknown) as Alignment,
        )
      : new Array(tableWidth).fill(options.defaultAlignment);
  // format
  const rows = [];
  // header
  const headerRow = table.getRows()[0];
  rows.push(
    new TableRow(
      headerRow
        .getCells()
        .map(
          (cell, j) =>
            new TableCell(
              _padText(
                _alignText(
                  cell.content,
                  columnWidths[j],
                  options.headerAlignment === HeaderAlignment.FOLLOW
                    ? alignments[j] === Alignment.NONE
                      ? options.defaultAlignment
                      : alignments[j]
                    : options.headerAlignment,
                  options.textWidthOptions,
                ),
              ),
            ),
        ),
      marginLeft,
      '',
    ),
  );
  // delimiter
  if (delimiterRow !== undefined) {
    rows.push(
      new TableRow(
        delimiterRow
          .getCells()
          .map(
            (cell, j) =>
              new TableCell(_delimiterText(alignments[j], columnWidths[j])),
          ),
        marginLeft,
        '',
      ),
    );
  }
  // body
  for (let i = delimiterRow !== undefined ? 2 : 1; i < tableHeight; i++) {
    const row = table.getRows()[i];
    rows.push(
      new TableRow(
        row
          .getCells()
          .map(
            (cell, j) =>
              new TableCell(
                _padText(
                  _alignText(
                    cell.content,
                    columnWidths[j],
                    alignments[j] === Alignment.NONE
                      ? options.defaultAlignment
                      : alignments[j],
                    options.textWidthOptions,
                  ),
                ),
              ),
          ),
        marginLeft,
        '',
      ),
    );
  }
  return {
    table: new Table(rows),
    marginLeft,
  };
};

/**
 * Formats a table weakly.
 * Rows are formatted independently to each other, cell contents are just trimmed and not aligned.
 * This is useful when using a non-monospaced font or dealing with wide tables.
 *
 * @private
 */
export const _weakFormatTable = (
  table: Table,
  options: Options,
): FormattedTable => {
  const tableHeight = table.getHeight();
  const tableWidth = table.getWidth();
  if (tableHeight === 0) {
    return {
      table,
      marginLeft: '',
    };
  }
  const marginLeft = table.getRows()[0].marginLeft;
  if (tableWidth === 0) {
    const rows = new Array(tableHeight).fill(new TableRow([], marginLeft, ''));
    return {
      table: new Table(rows),
      marginLeft,
    };
  }
  const delimiterRow = table.getDelimiterRow();
  // format
  const rows = [];
  // header
  const headerRow = table.getRows()[0];
  rows.push(
    new TableRow(
      headerRow.getCells().map((cell) => new TableCell(_padText(cell.content))),
      marginLeft,
      '',
    ),
  );
  // delimiter
  if (delimiterRow !== undefined) {
    rows.push(
      new TableRow(
        delimiterRow
          .getCells()
          .map(
            (cell) =>
              new TableCell(
                _delimiterText(cell.getAlignment()!, options.minDelimiterWidth),
              ),
          ),
        marginLeft,
        '',
      ),
    );
  }
  // body
  for (let i = delimiterRow !== undefined ? 2 : 1; i < tableHeight; i++) {
    const row = table.getRows()[i];
    rows.push(
      new TableRow(
        row.getCells().map((cell) => new TableCell(_padText(cell.content))),
        marginLeft,
        '',
      ),
    );
  }
  return {
    table: new Table(rows),
    marginLeft,
  };
};

/**
 * Represents table format type.
 *
 * - `FormatType.NORMAL` - Formats table normally.
 * - `FormatType.WEAK` - Formats table weakly, rows are formatted independently to each other, cell
 *   contents are just trimmed and not aligned.
 */
export enum FormatType {
  NORMAL = 'normal',
  WEAK = 'weak',
}

/**
 * Formats a table.
 *
 * @private
 *
 * @throws {Error} Unknown format type.
 */
export const formatTable = (table: Table, options: Options): FormattedTable => {
  switch (options.formatType) {
    case FormatType.NORMAL:
      return _formatTable(table, options);
    case FormatType.WEAK:
      return _weakFormatTable(table, options);
    default:
      throw new Error('Unknown format type: ' + options.formatType);
  }
};

/**
 * Alters a column's alignment of a table.
 *
 * @private
 * @param table - A completed non-empty table.
 * @param columnIndex - An index of the column.
 * @param alignment - A new alignment of the column.
 * @param options - An object containing options for completion.
 * @returns {Table} An altered table object.
 * If the column index is out of range, returns the original table.
 */
export const alterAlignment = (
  table: Table,
  columnIndex: number,
  alignment: Alignment,
  options: Options,
): Table => {
  if (table.getHeight() < 1) {
    return table;
  }
  const delimiterRow = table.getRows()[1];
  if (columnIndex < 0 || delimiterRow.getWidth() - 1 < columnIndex) {
    return table;
  }
  const delimiterCells = delimiterRow.getCells();
  delimiterCells[columnIndex] = new TableCell(
    _delimiterText(alignment, options.minDelimiterWidth),
  );
  const rows = table.getRows();
  rows[1] = new TableRow(
    delimiterCells,
    delimiterRow.marginLeft,
    delimiterRow.marginRight,
  );
  return new Table(rows);
};

/**
 * Inserts a row to a table.
 * The row is always inserted after the header and the delimiter rows, even if the index specifies
 * the header or the delimiter.
 *
 * @private
 * @param table - A completed non-empty table.
 * @param rowIndex - An row index at which a new row will be inserted.
 * @param row - A table row to be inserted.
 * @returns An altered table obejct.
 */
export const insertRow = (
  table: Table,
  rowIndex: number,
  row: TableRow,
): Table => {
  const rows = table.getRows();
  rows.splice(Math.max(rowIndex, 2), 0, row);
  return new Table(rows);
};

/**
 * Deletes a row in a table.
 * If the index specifies the header row, the cells are emptied but the row will not be removed.
 * If the index specifies the delimiter row, it does nothing.
 *
 * @private
 * @param table - A completed non-empty table.
 * @param rowIndex - An index of the row to be deleted.
 * @returns An altered table obejct.
 */
export const deleteRow = (table: Table, rowIndex: number): Table => {
  if (rowIndex === 1) {
    return table;
  }
  const rows = table.getRows();
  if (rowIndex === 0) {
    const headerRow = rows[0];
    rows[0] = new TableRow(
      new Array(headerRow.getWidth()).fill(new TableCell('')),
      headerRow.marginLeft,
      headerRow.marginRight,
    );
  } else {
    rows.splice(rowIndex, 1);
  }
  return new Table(rows);
};

/**
 * Moves a row at the index to the specified destination.
 *
 * @private
 * @param table - A completed non-empty table.
 * @param rowIndex - Index of the row to be moved.
 * @param destIndex - Index of the destination.
 * @returns An altered table object.
 */
export const moveRow = (
  table: Table,
  rowIndex: number,
  destIndex: number,
): Table => {
  if (rowIndex <= 1 || destIndex <= 1 || rowIndex === destIndex) {
    return table;
  }
  const rows = table.getRows();
  const row = rows[rowIndex];
  rows.splice(rowIndex, 1);
  rows.splice(destIndex, 0, row);
  return new Table(rows);
};

/**
 * Inserts a column to a table.
 *
 * @private
 * @param table - A completed non-empty table.
 * @param columnIndex - An column index at which the new column will be inserted.
 * @param column - An array of cells.
 * @param options - An object containing options for completion.
 * @returns An altered table obejct.
 */
export const insertColumn = (
  table: Table,
  columnIndex: number,
  column: TableCell[],
  options: Options,
): Table => {
  const rows = table.getRows();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = rows[i].getCells();
    const cell =
      i === 1
        ? new TableCell(
            _delimiterText(Alignment.NONE, options.minDelimiterWidth),
          )
        : column[i > 1 ? i - 1 : i];
    cells.splice(columnIndex, 0, cell);
    rows[i] = new TableRow(cells, row.marginLeft, row.marginRight);
  }
  return new Table(rows);
};

/**
 * Deletes a column in a table.
 * If there will be no columns after the deletion, the cells are emptied but the column will not be
 * removed.
 *
 * @private
 * @param table - A completed non-empty table.
 * @param columnIndex - An index of the column to be deleted.
 * @param options - An object containing options for completion.
 * @returns An altered table object.
 */
export const deleteColumn = (
  table: Table,
  columnIndex: number,
  options: Options,
): Table => {
  const rows = table.getRows();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let cells = row.getCells();
    if (cells.length <= 1) {
      cells = [
        new TableCell(
          i === 1
            ? _delimiterText(Alignment.NONE, options.minDelimiterWidth)
            : '',
        ),
      ];
    } else {
      cells.splice(columnIndex, 1);
    }
    rows[i] = new TableRow(cells, row.marginLeft, row.marginRight);
  }
  return new Table(rows);
};

/**
 * Moves a column at the index to the specified destination.
 *
 * @private
 * @param table - A completed non-empty table.
 * @param columnIndex - Index of the column to be moved.
 * @param destIndex - Index of the destination.
 * @returns An altered table object.
 */
export const moveColumn = (
  table: Table,
  columnIndex: number,
  destIndex: number,
): Table => {
  if (columnIndex === destIndex) {
    return table;
  }
  const rows = table.getRows();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.getCells();
    const cell = cells[columnIndex];
    cells.splice(columnIndex, 1);
    cells.splice(destIndex, 0, cell);
    rows[i] = new TableRow(cells, row.marginLeft, row.marginRight);
  }
  return new Table(rows);
};
