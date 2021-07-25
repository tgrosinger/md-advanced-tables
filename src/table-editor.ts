import { Alignment } from './alignment';
import { applyEditScript, shortestEditScript } from './edit-script';
import { Focus } from './focus';
import {
  alterAlignment,
  completeTable,
  deleteColumn,
  deleteRow,
  formatTable,
  FormattedTable,
  insertColumn,
  insertRow,
  moveColumn,
  moveRow,
} from './formatter';
import { Options } from './options';
import { marginRegexSrc, readTable } from './parser';
import { Point } from './point';
import { Range } from './range';
import { Table } from './table';
import { TableCell } from './table-cell';
import { TableRow } from './table-row';
import { ITextEditor } from './text-editor';

export enum SortOrder {
  Ascending = 'ascending',
  Descending = 'descending',
}

/**
 * Creates a regular expression object that matches a table row.
 *
 * @param leftMarginChars - A set of additional left margin characters.
 * A pipe `|`, a backslash `\`, and a backquote will be ignored.
 * @returns A regular expression object that matches a table row.
 */
export const _createIsTableRowRegex = (leftMarginChars: Set<string>): RegExp =>
  new RegExp(`^${marginRegexSrc(leftMarginChars)}\\|`, 'u');

export const _createIsTableFormulaRegex = (
  leftMarginChars: Set<string>,
): RegExp => new RegExp(`^${marginRegexSrc(leftMarginChars)}<!-- ?.+-->$`, 'u');

interface TableInfo {
  /**
   * The range of the table
   */
  range: Range;

  /**
   * An array of lines in the range.
   */
  lines: string[];

  /**
   * An array of formula lines after the range.
   */
  formulaLines: string[];

  /**
   * A table object read from the text editor.
   */
  table: Table;

  /**
   * A focus object that represents the current cursor position in the table.
   */
  focus: Focus;
}

/**
 * Computes new focus offset from information of completed and formatted tables.
 *
 * @private
 * @param focus - A focus.
 * @param table - A completed but not formatted table with original cell contents.
 * @param formatted - Information of the formatted table.
 * @param moved - Indicates whether the focus position is moved by a command or not.
 */
export const _computeNewOffset = (
  focus: Focus,
  table: Table,
  formatted: FormattedTable,
  moved: boolean,
): number => {
  if (moved) {
    const formattedFocusedCell = formatted.table.getFocusedCell(focus);
    if (formattedFocusedCell !== undefined) {
      return formattedFocusedCell.computeRawOffset(0);
    }
    return focus.column < 0 ? formatted.marginLeft.length : 0;
  }
  const focusedCell = table.getFocusedCell(focus);
  const formattedFocusedCell = formatted.table.getFocusedCell(focus);
  if (focusedCell !== undefined && formattedFocusedCell !== undefined) {
    const contentOffset = Math.min(
      focusedCell.computeContentOffset(focus.offset),
      formattedFocusedCell.content.length,
    );
    return formattedFocusedCell.computeRawOffset(contentOffset);
  }
  return focus.column < 0 ? formatted.marginLeft.length : 0;
};

/**
 * The `TableEditor` class is at the center of the markdown-table-editor.
 * When a command is executed, it reads a table from the text editor, does some operation on the
 * table, and then apply the result to the text editor.
 *
 * To use this class, the text editor (or an interface to it) must implement {@link ITextEditor}.
 */
export class TableEditor {
  private readonly _textEditor: ITextEditor;

  // smart cursor
  private _scActive: boolean;
  private _scTablePos?: Point;
  private _scStartFocus?: Focus;
  private _scLastFocus?: Focus;

  /**
   * Creates a new table editor instance.
   *
   * @param textEditor - A text editor interface.
   */
  constructor(textEditor: ITextEditor) {
    this._textEditor = textEditor;

    // smart cursor
    this._scActive = false;
  }

  /**
   * Resets the smart cursor.
   * Call this method when the table editor is inactivated.
   */
  public resetSmartCursor(): void {
    this._scActive = false;
  }

  /**
   * Checks if the cursor is in a table row.
   * This is useful to check whether the table editor should be activated or not.
   *
   * @returns `true` if the cursor is in a table row.
   */
  public cursorIsInTable(options: Options): boolean {
    const re = _createIsTableRowRegex(options.leftMarginChars);
    const pos = this._textEditor.getCursorPosition();
    return (
      this._textEditor.acceptsTableEdit(pos.row) &&
      re.test(this._textEditor.getLine(pos.row))
    );
  }

  /**
   * Finds a table under the current cursor position.
   *
   * @returns undefined if there is no table or the determined focus is invalid.
   */
  _findTable(options: Options): TableInfo | undefined {
    const re = _createIsTableRowRegex(options.leftMarginChars);
    const formulaRe = _createIsTableFormulaRegex(options.leftMarginChars);
    const pos = this._textEditor.getCursorPosition();
    const lastRow = this._textEditor.getLastRow();
    const lines = [];
    const formulaLines = [];
    let startRow = pos.row;
    let endRow = pos.row; // endRow is last line before fomulas
    // current line
    {
      const line = this._textEditor.getLine(pos.row);
      if (!this._textEditor.acceptsTableEdit(pos.row) || !re.test(line)) {
        return undefined;
      }
      lines.push(line);
    }
    // previous lines
    for (let row = pos.row - 1; row >= 0; row--) {
      const line = this._textEditor.getLine(row);
      if (!this._textEditor.acceptsTableEdit(row) || !re.test(line)) {
        break;
      }
      lines.unshift(line);
      startRow = row;
    }
    // next lines
    for (let row = pos.row + 1; row <= lastRow; row++) {
      const line = this._textEditor.getLine(row);
      if (!this._textEditor.acceptsTableEdit(row) || !re.test(line)) {
        break;
      }
      lines.push(line);
      endRow = row;
    }
    // formula lines
    for (let row = endRow + 1; row <= lastRow; row++) {
      const line = this._textEditor.getLine(row);
      if (!this._textEditor.acceptsTableEdit(row) || !formulaRe.test(line)) {
        break;
      }
      formulaLines.push(line);
    }
    const range = new Range(
      new Point(startRow, 0),
      new Point(endRow, lines[lines.length - 1].length),
    );
    const table = readTable(lines, options);
    const focus = table.focusOfPosition(pos, startRow);
    if (focus === undefined) {
      // TODO: Validate this for correctness
      return undefined;
    }
    return { range, lines, formulaLines, table, focus };
  }

  /**
   * Finds a table and does an operation with it.
   *
   * @private
   * @param func - A function that does some operation on table information obtained by
   * {@link TableEditor#_findTable}.
   */
  _withTable<T>(
    options: Options,
    func: (tableInfo: TableInfo) => T,
  ): T | undefined {
    const info = this._findTable(options);
    if (info === undefined) {
      return;
    }
    return func(info);
  }

  /**
   * Updates lines in a given range in the text editor.
   *
   * @private
   * @param startRow - Start row index, starts from `0`.
   * @param endRow - End row index.
   * Lines from `startRow` to `endRow - 1` are replaced.
   * @param newLines - New lines.
   * @param [oldLines=undefined] - Old lines to be replaced.
   */
  _updateLines(
    startRow: number,
    endRow: number,
    newLines: string[],
    oldLines: string[] | undefined = undefined,
  ): void {
    if (oldLines !== undefined) {
      // apply the shortest edit script
      // if a table is edited in a normal manner, the edit distance never exceeds 3
      const ses = shortestEditScript(oldLines, newLines, 3);
      if (ses !== undefined) {
        applyEditScript(this._textEditor, ses, startRow);
        return;
      }
    }
    this._textEditor.replaceLines(startRow, endRow, newLines);
  }

  /**
   * Moves the cursor position to the focused cell,
   *
   * @private
   * @param startRow - Row index where the table starts in the text editor.
   * @param table - A table.
   * @param focus - A focus to which the cursor will be moved.
   */
  _moveToFocus(startRow: number, table: Table, focus: Focus): void {
    const pos = table.positionOfFocus(focus, startRow);
    if (pos !== undefined) {
      this._textEditor.setCursorPosition(pos);
    }
  }

  /**
   * Selects the focused cell.
   * If the cell has no content to be selected, then just moves the cursor position.
   *
   * @private
   * @param startRow - Row index where the table starts in the text editor.
   * @param table - A table.
   * @param focus - A focus to be selected.
   */
  _selectFocus(startRow: number, table: Table, focus: Focus): void {
    const range = table.selectionRangeOfFocus(focus, startRow);
    if (range !== undefined) {
      this._textEditor.setSelectionRange(range);
    } else {
      this._moveToFocus(startRow, table, focus);
    }
  }

  /**
   * Formats the table under the cursor.
   */
  public format(options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, table, focus }: TableInfo) => {
        const newFocus = focus;
        // apply
        this._textEditor.transact(() => {
          this._updateLines(
            range.start.row,
            range.end.row + 1,
            table.toLines(),
            lines,
          );
          this._moveToFocus(range.start.row, table, newFocus);
        });
      },
    );
  }

  /**
   * Formats and escapes from the table.
   */
  public escape(options: Options): void {
    this._withTable(options, ({ range, lines, table, focus }: TableInfo) => {
      // complete
      const completed = completeTable(table, options);
      // format
      const formatted = formatTable(completed.table, options);
      // apply
      const newRow = range.end.row + (completed.delimiterInserted ? 2 : 1);
      this._textEditor.transact(() => {
        this._updateLines(
          range.start.row,
          range.end.row + 1,
          formatted.table.toLines(),
          lines,
        );
        let newPos;
        if (newRow > this._textEditor.getLastRow()) {
          this._textEditor.insertLine(newRow, '');
          newPos = new Point(newRow, 0);
        } else {
          const re = new RegExp(
            `^${marginRegexSrc(options.leftMarginChars)}`,
            'u',
          );
          const nextLine = this._textEditor.getLine(newRow);
          // @ts-expect-error TODO
          const margin = re.exec(nextLine)[0];
          newPos = new Point(newRow, margin.length);
        }
        this._textEditor.setCursorPosition(newPos);
      });
      this.resetSmartCursor();
    });
  }

  /**
   * Alters the alignment of the focused column.
   */
  public alignColumn(alignment: Alignment, options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, table, focus }: TableInfo) => {
        let newFocus = focus;
        // alter alignment
        let altered = table;
        if (
          0 <= newFocus.column &&
          newFocus.column <= altered.getHeaderWidth() - 1
        ) {
          altered = alterAlignment(table, newFocus.column, alignment, options);
        }
        // format
        const formatted = formatTable(altered, options);
        newFocus = newFocus.setOffset(
          _computeNewOffset(newFocus, table, formatted, false),
        );
        // apply
        this._textEditor.transact(() => {
          this._updateLines(
            range.start.row,
            range.end.row + 1,
            formatted.table.toLines(),
            lines,
          );
          this._moveToFocus(range.start.row, formatted.table, newFocus);
        });
      },
    );
  }

  /**
   * Selects the focused cell content.
   */
  public selectCell(options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, table, focus }: TableInfo) => {
        const newFocus = focus;
        // apply
        this._textEditor.transact(() => {
          this._updateLines(
            range.start.row,
            range.end.row + 1,
            table.toLines(),
            lines,
          );
          this._selectFocus(range.start.row, table, newFocus);
        });
      },
    );
  }

  /**
   * Moves the focus to another cell.
   *
   * @param rowOffset - Offset in row.
   * @param columnOffset - Offset in column.
   */
  public moveFocus(
    rowOffset: number,
    columnOffset: number,
    options: Options,
  ): void {
    this.withCompletedTable(
      options,
      ({ range, lines, table, focus }: TableInfo) => {
        let newFocus = focus;
        const startFocus = newFocus;
        // move focus
        if (rowOffset !== 0) {
          const height = table.getHeight();
          // skip delimiter row
          const skip =
            newFocus.row < 1 && newFocus.row + rowOffset >= 1
              ? 1
              : newFocus.row > 1 && newFocus.row + rowOffset <= 1
              ? -1
              : 0;
          newFocus = newFocus.setRow(
            Math.min(
              Math.max(newFocus.row + rowOffset + skip, 0),
              height <= 2 ? 0 : height - 1,
            ),
          );
        }
        if (columnOffset !== 0) {
          const width = table.getHeaderWidth();
          if (
            !(newFocus.column < 0 && columnOffset < 0) &&
            !(newFocus.column > width - 1 && columnOffset > 0)
          ) {
            newFocus = newFocus.setColumn(
              Math.min(Math.max(newFocus.column + columnOffset, 0), width - 1),
            );
          }
        }
        const moved = !newFocus.posEquals(startFocus);
        // format
        const formatted = formatTable(table, options);
        newFocus = newFocus.setOffset(
          _computeNewOffset(newFocus, table, formatted, moved),
        );
        // apply
        this._textEditor.transact(() => {
          this._updateLines(
            range.start.row,
            range.end.row + 1,
            formatted.table.toLines(),
            lines,
          );
          if (moved) {
            this._selectFocus(range.start.row, formatted.table, newFocus);
          } else {
            this._moveToFocus(range.start.row, formatted.table, newFocus);
          }
        });
        if (moved) {
          this.resetSmartCursor();
        }
      },
    );
  }

  /**
   * Moves the focus to the next cell.
   */
  public nextCell(options: Options): void {
    this._withTable(options, ({ range, lines, table, focus }: TableInfo) => {
      // reset smart cursor if moved
      const focusMoved =
        (this._scTablePos !== undefined &&
          !range.start.equals(this._scTablePos)) ||
        (this._scLastFocus !== undefined &&
          !focus.posEquals(this._scLastFocus));
      if (this._scActive && focusMoved) {
        this.resetSmartCursor();
      }
      let newFocus = focus;
      // complete
      const completed = completeTable(table, options);
      if (completed.delimiterInserted && newFocus.row > 0) {
        newFocus = newFocus.setRow(newFocus.row + 1);
      }
      const startFocus = newFocus;
      let altered = completed.table;
      // move focus
      if (newFocus.row === 1) {
        // move to next row
        newFocus = newFocus.setRow(2);
        if (options.smartCursor) {
          if (
            newFocus.column < 0 ||
            altered.getHeaderWidth() - 1 < newFocus.column
          ) {
            newFocus = newFocus.setColumn(0);
          }
        } else {
          newFocus = newFocus.setColumn(0);
        }
        // insert an empty row if needed
        if (newFocus.row > altered.getHeight() - 1) {
          const row = new Array(altered.getHeaderWidth()).fill(
            new TableCell(''),
          );
          altered = insertRow(
            altered,
            altered.getHeight(),
            new TableRow(row, '', ''),
          );
        }
      } else {
        // insert an empty column if needed
        if (newFocus.column > altered.getHeaderWidth() - 1) {
          const column = new Array(altered.getHeight() - 1).fill(
            new TableCell(''),
          );
          altered = insertColumn(
            altered,
            altered.getHeaderWidth(),
            column,
            options,
          );
        }
        // move to next column
        newFocus = newFocus.setColumn(newFocus.column + 1);
      }
      // format
      const formatted = formatTable(altered, options);
      newFocus = newFocus.setOffset(
        _computeNewOffset(newFocus, altered, formatted, true),
      );
      // apply
      const newLines = formatted.table.toLines();
      if (newFocus.column > formatted.table.getHeaderWidth() - 1) {
        // add margin
        newLines[newFocus.row] += ' ';
        newFocus = newFocus.setOffset(1);
      }
      this._textEditor.transact(() => {
        this._updateLines(range.start.row, range.end.row + 1, newLines, lines);
        this._selectFocus(range.start.row, formatted.table, newFocus);
      });
      if (options.smartCursor) {
        if (!this._scActive) {
          // activate smart cursor
          this._scActive = true;
          this._scTablePos = range.start;
          if (
            startFocus.column < 0 ||
            formatted.table.getHeaderWidth() - 1 < startFocus.column
          ) {
            this._scStartFocus = new Focus(startFocus.row, 0, 0);
          } else {
            this._scStartFocus = startFocus;
          }
        }
        this._scLastFocus = newFocus;
      }
    });
  }

  /**
   * Moves the focus to the previous cell.
   */
  public previousCell(options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, table, focus }: TableInfo) => {
        let newFocus = focus;
        const startFocus = newFocus;
        // move focus
        if (newFocus.row === 0) {
          if (newFocus.column > 0) {
            newFocus = newFocus.setColumn(newFocus.column - 1);
          }
        } else if (newFocus.row === 1) {
          newFocus = new Focus(0, table.getHeaderWidth() - 1, newFocus.offset);
        } else {
          if (newFocus.column > 0) {
            newFocus = newFocus.setColumn(newFocus.column - 1);
          } else {
            newFocus = new Focus(
              newFocus.row === 2 ? 0 : newFocus.row - 1,
              table.getHeaderWidth() - 1,
              newFocus.offset,
            );
          }
        }
        const moved = !newFocus.posEquals(startFocus);
        // format
        const formatted = formatTable(table, options);
        newFocus = newFocus.setOffset(
          _computeNewOffset(newFocus, table, formatted, moved),
        );
        // apply
        this._textEditor.transact(() => {
          this._updateLines(
            range.start.row,
            range.end.row + 1,
            formatted.table.toLines(),
            lines,
          );
          if (moved) {
            this._selectFocus(range.start.row, formatted.table, newFocus);
          } else {
            this._moveToFocus(range.start.row, formatted.table, newFocus);
          }
        });
        if (moved) {
          this.resetSmartCursor();
        }
      },
    );
  }

  /**
   * Moves the focus to the next row.
   */
  public nextRow(options: Options): void {
    this._withTable(options, ({ range, lines, table, focus }: TableInfo) => {
      // reset smart cursor if moved
      const focusMoved =
        (this._scTablePos !== undefined &&
          !range.start.equals(this._scTablePos)) ||
        (this._scLastFocus !== undefined &&
          !focus.posEquals(this._scLastFocus));
      if (this._scActive && focusMoved) {
        this.resetSmartCursor();
      }
      let newFocus = focus;
      // complete
      const completed = completeTable(table, options);
      if (completed.delimiterInserted && newFocus.row > 0) {
        newFocus = newFocus.setRow(newFocus.row + 1);
      }
      const startFocus = newFocus;
      let altered = completed.table;
      // move focus
      if (newFocus.row === 0) {
        newFocus = newFocus.setRow(2);
      } else {
        newFocus = newFocus.setRow(newFocus.row + 1);
      }
      if (options.smartCursor) {
        if (this._scActive && this._scStartFocus !== undefined) {
          newFocus = newFocus.setColumn(this._scStartFocus.column);
        } else if (
          newFocus.column < 0 ||
          altered.getHeaderWidth() - 1 < newFocus.column
        ) {
          newFocus = newFocus.setColumn(0);
        }
      } else {
        newFocus = newFocus.setColumn(0);
      }
      // insert empty row if needed
      if (newFocus.row > altered.getHeight() - 1) {
        const row = new Array(altered.getHeaderWidth()).fill(new TableCell(''));
        altered = insertRow(
          altered,
          altered.getHeight(),
          new TableRow(row, '', ''),
        );
      }
      // format
      const formatted = formatTable(altered, options);
      newFocus = newFocus.setOffset(
        _computeNewOffset(newFocus, altered, formatted, true),
      );
      // apply
      this._textEditor.transact(() => {
        this._updateLines(
          range.start.row,
          range.end.row + 1,
          formatted.table.toLines(),
          lines,
        );
        this._selectFocus(range.start.row, formatted.table, newFocus);
      });
      if (options.smartCursor) {
        if (!this._scActive) {
          // activate smart cursor
          this._scActive = true;
          this._scTablePos = range.start;
          if (
            startFocus.column < 0 ||
            formatted.table.getHeaderWidth() - 1 < startFocus.column
          ) {
            this._scStartFocus = new Focus(startFocus.row, 0, 0);
          } else {
            this._scStartFocus = startFocus;
          }
        }
        this._scLastFocus = newFocus;
      }
    });
  }

  /**
   * Inserts an empty row at the current focus.
   */
  public insertRow(options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, formulaLines, table, focus }: TableInfo) => {
        let newFocus = focus;
        // move focus
        if (newFocus.row <= 1) {
          newFocus = newFocus.setRow(2);
        }
        newFocus = newFocus.setColumn(0);
        // insert an empty row
        const row = new Array(table.getHeaderWidth()).fill(new TableCell(''));
        const altered = insertRow(
          table,
          newFocus.row,
          new TableRow(row, '', ''),
        );

        this.formatAndApply(
          options,
          range,
          lines,
          formulaLines,
          altered,
          newFocus,
        );
      },
    );
  }

  /**
   * Deletes a row at the current focus.
   */
  public deleteRow(options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, formulaLines, table, focus }: TableInfo) => {
        let newFocus = focus;
        // delete a row
        let altered = table;
        let moved = false;
        if (newFocus.row !== 1) {
          altered = deleteRow(altered, newFocus.row);
          moved = true;
          if (newFocus.row > altered.getHeight() - 1) {
            newFocus = newFocus.setRow(
              newFocus.row === 2 ? 0 : newFocus.row - 1,
            );
          }
        }

        this.formatAndApply(
          options,
          range,
          lines,
          formulaLines,
          altered,
          newFocus,
          moved,
        );
      },
    );
  }

  /**
   * Moves the focused row by the specified offset.
   *
   * @param offset - An offset the row is moved by.
   */
  public moveRow(offset: number, options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, formulaLines, table, focus }: TableInfo) => {
        let newFocus = focus;
        // move row
        let altered = table;
        if (newFocus.row > 1) {
          const dest = Math.min(
            Math.max(newFocus.row + offset, 2),
            altered.getHeight() - 1,
          );
          altered = moveRow(altered, newFocus.row, dest);
          newFocus = newFocus.setRow(dest);
        }

        this.formatAndApply(
          options,
          range,
          lines,
          formulaLines,
          altered,
          newFocus,
        );
      },
    );
  }

  public evaluateFormulas(options: Options): Error | undefined {
    return this.withCompletedTable(
      options,
      ({
        range,
        lines,
        formulaLines,
        table,
        focus,
      }: TableInfo): Error | undefined => {
        const result = table.applyFormulas(formulaLines);
        if (result.isErr()) {
          return result.error;
        }

        const { table: formattedTable, focus: newFocus } = this.formatAndApply(
          options,
          range,
          lines,
          formulaLines,
          result.value,
          focus,
          false,
        );
      },
    );
  }

  /**
   * Sorts rows alphanumerically using the column at the current focus.
   * If all cells in the sorting column are numbers, the column is sorted
   * numerically.
   */
  public sortRows(sortOrder: SortOrder, options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, formulaLines, table, focus }: TableInfo) => {
        const bodyRows = table.getRows().slice(2);

        const sortingCells = bodyRows.map((row) => row.getCellAt(focus.column));
        const notAllNums = sortingCells.some((cell) => {
          // return true if not a number
          if (!cell || cell.content === '') {
            return false;
          }
          return isNaN(parseFloat(cell.content));
        });

        bodyRows.sort((rowA, rowB): number => {
          const cellA = rowA.getCellAt(focus.column);
          const cellB = rowB.getCellAt(focus.column);

          if (cellA === undefined || cellA.content === '') {
            if (cellB === undefined || cellB.content === '') {
              return 0;
            }
            return -1;
          } else if (cellB === undefined || cellB.content === '') {
            return 1;
          }

          const contentA = notAllNums
            ? cellA.content
            : parseFloat(cellA.content);
          const contentB = notAllNums
            ? cellB.content
            : parseFloat(cellB.content);

          if (contentA === contentB) {
            return 0;
          } else if (contentA === undefined) {
            return -1;
          } else if (contentB === undefined) {
            return 1;
          }
          return contentA < contentB ? -1 : 1;
        });
        if (sortOrder === SortOrder.Descending) {
          bodyRows.reverse();
        }
        const allRows = table.getRows().slice(0, 2).concat(bodyRows);
        const newTable = new Table(allRows);

        const { table: formattedTable, focus: newFocus } = this.formatAndApply(
          options,
          range,
          lines,
          formulaLines,
          newTable,
          focus,
          true,
        );
        this._moveToFocus(range.start.row, formattedTable, newFocus);
      },
    );
  }

  /**
   * Inserts an empty column at the current focus.
   */
  public insertColumn(options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, formulaLines, table, focus }: TableInfo) => {
        let newFocus = focus;
        // move focus
        if (newFocus.row === 1) {
          newFocus = newFocus.setRow(0);
        }
        if (newFocus.column < 0) {
          newFocus = newFocus.setColumn(0);
        }
        // insert an empty column
        const column = new Array(table.getHeight() - 1).fill(new TableCell(''));
        const altered = insertColumn(table, newFocus.column, column, options);

        this.formatAndApply(
          options,
          range,
          lines,
          formulaLines,
          altered,
          newFocus,
        );
      },
    );
  }

  /**
   * Deletes a column at the current focus.
   */
  public deleteColumn(options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, formulaLines, table, focus }: TableInfo) => {
        let newFocus = focus;
        // move focus
        if (newFocus.row === 1) {
          newFocus = newFocus.setRow(0);
        }
        // delete a column
        let altered = table;
        let moved = false;
        if (
          0 <= newFocus.column &&
          newFocus.column <= altered.getHeaderWidth() - 1
        ) {
          altered = deleteColumn(table, newFocus.column, options);
          moved = true;
          if (newFocus.column > altered.getHeaderWidth() - 1) {
            newFocus = newFocus.setColumn(altered.getHeaderWidth() - 1);
          }
        }

        this.formatAndApply(
          options,
          range,
          lines,
          formulaLines,
          altered,
          newFocus,
          moved,
        );
      },
    );
  }

  /**
   * Moves the focused column by the specified offset.
   *
   * @param offset - An offset the column is moved by.
   */
  public moveColumn(offset: number, options: Options): void {
    this.withCompletedTable(
      options,
      ({ range, lines, formulaLines, table, focus }: TableInfo) => {
        let newFocus = focus;
        // move column
        let altered = table;
        if (
          0 <= newFocus.column &&
          newFocus.column <= altered.getHeaderWidth() - 1
        ) {
          const dest = Math.min(
            Math.max(newFocus.column + offset, 0),
            altered.getHeaderWidth() - 1,
          );
          altered = moveColumn(altered, newFocus.column, dest);
          newFocus = newFocus.setColumn(dest);
        }

        this.formatAndApply(
          options,
          range,
          lines,
          formulaLines,
          altered,
          newFocus,
        );
      },
    );
  }

  /**
   * Formats all the tables in the text editor.
   */
  public formatAll(options: Options): void {
    this._textEditor.transact(() => {
      const re = _createIsTableRowRegex(options.leftMarginChars);
      let pos = this._textEditor.getCursorPosition();
      let lines = [];
      let startRow = undefined;
      let lastRow = this._textEditor.getLastRow();
      // find tables
      for (let row = 0; row <= lastRow; row++) {
        const line = this._textEditor.getLine(row);
        if (this._textEditor.acceptsTableEdit(row) && re.test(line)) {
          lines.push(line);
          if (startRow === undefined) {
            startRow = row;
          }
        } else if (startRow !== undefined) {
          // get table info
          const endRow = row - 1;
          const range = new Range(
            new Point(startRow, 0),
            new Point(endRow, lines[lines.length - 1].length),
          );
          // formulaLines empty because formatting does not involve formulas
          const table = readTable(lines, options);
          const focus = table.focusOfPosition(pos, startRow);

          let diff: number;
          if (focus !== undefined) {
            // format
            let newFocus = focus;
            const completed = completeTable(table, options);
            if (completed.delimiterInserted && newFocus.row > 0) {
              newFocus = newFocus.setRow(newFocus.row + 1);
            }
            const formatted = formatTable(completed.table, options);
            newFocus = newFocus.setOffset(
              _computeNewOffset(newFocus, completed.table, formatted, false),
            );
            // apply
            const newLines = formatted.table.toLines();
            this._updateLines(
              range.start.row,
              range.end.row + 1,
              newLines,
              lines,
            );
            // update cursor position
            diff = newLines.length - lines.length;
            pos = formatted.table.positionOfFocus(newFocus, startRow)!;
          } else {
            // format
            const completed = completeTable(table, options);
            const formatted = formatTable(completed.table, options);
            // apply
            const newLines = formatted.table.toLines();
            this._updateLines(
              range.start.row,
              range.end.row + 1,
              newLines,
              lines,
            );
            // update cursor position
            diff = newLines.length - lines.length;
            if (pos.row > endRow) {
              pos = new Point(pos.row + diff, pos.column);
            }
          }

          // reset
          lines = [];
          startRow = undefined;
          // update
          lastRow += diff;
          row += diff;
        }
      }
      if (startRow !== undefined) {
        // get table info
        const endRow = lastRow;
        const range = new Range(
          new Point(startRow, 0),
          new Point(endRow, lines[lines.length - 1].length),
        );
        // formulaLines empty because formatting does not involve formulas
        const table = readTable(lines, options);
        const focus = table.focusOfPosition(pos, startRow);
        // format
        let newFocus = focus;
        const completed = completeTable(table, options);
        // @ts-expect-error TODO
        if (completed.delimiterInserted && newFocus.row > 0) {
          // @ts-expect-error TODO
          newFocus = newFocus.setRow(newFocus.row + 1);
        }
        const formatted = formatTable(completed.table, options);
        // @ts-expect-error TODO
        newFocus = newFocus.setOffset(
          // @ts-expect-error TODO
          _computeNewOffset(newFocus, completed.table, formatted, false),
        );
        // apply
        const newLines = formatted.table.toLines();
        this._updateLines(range.start.row, range.end.row + 1, newLines, lines);
        // @ts-expect-error TODO
        pos = formatted.table.positionOfFocus(newFocus, startRow);
      }
      this._textEditor.setCursorPosition(pos);
    });
  }

  /**
   * Exports the table as a two dimensional string array
   */
  public exportTable(
    withtHeaders: boolean,
    options: Options,
  ): string[][] | undefined {
    return this.withCompletedTable(
      options,
      ({ range, lines, formulaLines, table, focus }: TableInfo) => {
        const bodyRows = table.getRows();
        if (bodyRows.length > 0 && !withtHeaders) {
          bodyRows.splice(0, 2);
        }
        // else if(bodyRows.length > 1) bodyRows.splice(1, 1);
        return bodyRows.map((row) =>
          row.getCells().map((cell) => cell.content),
        );
      },
    );
  }

  /**
   * Exports the table as a two dimensional string array
   */
  public exportCSV(
    withtHeaders: boolean,
    options: Options,
  ): string | undefined {
    const r = this.exportTable(withtHeaders, options);
    return !r ? undefined : r.map((row) => row.join('\t')).join('\n');
  }

  /**
   * Finds a table, completes it, then does an operation with it.
   *
   * @param func - A function that does some operation on table information obtained by
   * {@link TableEditor#_findTable}.
   */
  private withCompletedTable<T>(
    options: Options,
    func: (tableInfo: TableInfo) => T,
  ): T | undefined {
    return this._withTable(options, (tableInfo: TableInfo): T => {
      let newFocus = tableInfo.focus;
      // complete
      const completed = completeTable(tableInfo.table, options);
      if (completed.delimiterInserted && newFocus.row > 0) {
        newFocus = newFocus.setRow(newFocus.row + 1);
      }
      // format
      const formatted = formatTable(completed.table, options);
      newFocus = newFocus.setOffset(
        _computeNewOffset(newFocus, completed.table, formatted, false),
      );

      tableInfo.table = formatted.table;
      tableInfo.focus = newFocus;
      return func(tableInfo);
    });
  }

  /**
   * Formats the table and applies any changes based on the difference between
   * originalLines and the newTable. Should generally be the last function call
   * in a TableEditor function.
   */
  private formatAndApply(
    options: Options,
    range: Range,
    originalLines: string[],
    formulaLines: string[],
    newTable: Table,
    newFocus: Focus,
    moved = false,
  ): TableInfo {
    // format
    const formatted = formatTable(newTable, options);
    newFocus = newFocus.setOffset(
      _computeNewOffset(newFocus, newTable, formatted, moved),
    );
    // apply
    this._textEditor.transact(() => {
      this._updateLines(
        range.start.row,
        range.end.row + 1,
        formatted.table.toLines(),
        originalLines,
      );
      if (moved) {
        this._selectFocus(range.start.row, formatted.table, newFocus);
      } else {
        this._moveToFocus(range.start.row, formatted.table, newFocus);
      }
    });
    this.resetSmartCursor();
    return {
      range,
      lines: originalLines,
      formulaLines,
      table: formatted.table,
      focus: newFocus,
    };
  }
}
