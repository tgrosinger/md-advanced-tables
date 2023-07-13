import { ok, Result } from '../neverthrow/neverthrow';
import { Table } from '../table';
import { Cell, checkType, errIndex0 } from './ast_utils';
import { Column, newColumn } from './column';
import { Value } from './results';
import { newRow, Row } from './row';
import { IToken } from 'ebnf';

export class Reference {
  public readonly row: Row | undefined;
  public readonly column: Column | undefined;

  constructor(ast: IToken, table: Table) {
    const typeErr = checkType(
      ast,
      'source_reference',
      'absolute_reference',
      'relative_reference',
    );
    if (typeErr) {
      throw typeErr;
    }

    for (let i = 0; i < ast.children.length; i++) {
      const child = ast.children[i];
      switch (child.type) {
        case 'relative_row':
        case 'absolute_row':
          if (this.row !== undefined) {
            throw Error(
              'Reference may only have at most 1 row, more than 1 provided',
            );
          }
          const createdRow = newRow(child, table);
          if (createdRow.isErr()) {
            if (createdRow.error === errIndex0) {
              // not actually an error, just indicates using current index
              break;
            }
            throw createdRow.error;
          }
          this.row = createdRow.value;
          break;
        case 'relative_column':
        case 'absolute_column':
          if (this.column !== undefined) {
            throw Error(
              'Reference may only have at most 1 column, more than 1 provided',
            );
          }
          const createdCol = newColumn(child, table);
          if (createdCol.isErr()) {
            if (createdCol.error === errIndex0) {
              // not actually an error, just indicates using current index
              break;
            }
            throw createdCol.error;
          }
          this.column = createdCol.value;
          break;
      }
    }
  }

  public getValue = (table: Table, currentCell: Cell): Result<Value, Error> => {
    const cell = {
      row: this.row ? this.row.getIndex(currentCell) : currentCell.row,
      column: this.column
        ? this.column.getIndex(currentCell)
        : currentCell.column,
    };

    const val = table.getCellAt(cell.row, cell.column)?.toText() || '';
    return ok(new Value([[val]]));
  };
}
