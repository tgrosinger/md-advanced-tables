import { err, ok, Result } from '../neverthrow/neverthrow';
import { Table } from '../table';
import { Cell, checkChildLength, checkType, errIndex0 } from './ast_utils';
import { Source } from './calc';
import { AbsoluteColumn } from './column';
import { Formatter } from './display_directive';
import { Range } from './range';
import { AbsoluteRow } from './row';
import { IToken } from 'ebnf';
import { range } from 'lodash';

export interface Destination {
  merge(source: Source, table: Table): Result<Table, Error>;
}

export const newDestination = (
  ast: IToken,
  table: Table,
  formatter: Formatter,
): Result<Destination, Error> => {
  const typeErr = checkType(ast, 'destination');
  if (typeErr) {
    return err(typeErr);
  }

  const lengthError = checkChildLength(ast, 1);
  if (lengthError) {
    return err(lengthError);
  }

  const child = ast.children[0];
  if (child.type === 'range') {
    return ok(new RangeDestination(child, table, formatter));
  }

  // must be either an absolute_reference
  try {
    switch (child.children.length) {
      case 2:
        return ok(new CellDestination(child, table, formatter));
      case 1:
        const innerChild = child.children[0];
        if (innerChild.type === 'absolute_row') {
          return ok(new RowDestination(child, table, formatter));
        } else if (innerChild.type === 'absolute_column') {
          return ok(new ColumnDestination(child, table, formatter));
        }
      default:
        return err(new Error('Unexpected destination type ' + child.type));
    }
  } catch (error) {
    if (error === errIndex0) {
      return err(new Error('Index 0 may not be used in a destination'));
    }

    return err(error as Error);
  }
};

export class RowDestination implements Destination {
  private readonly row: AbsoluteRow;
  private readonly formatter: Formatter;

  constructor(ast: IToken, table: Table, formatter: Formatter) {
    this.formatter = formatter;

    const typeErr = checkType(ast, 'absolute_reference');
    if (typeErr) {
      throw typeErr;
    }

    const lengthError = checkChildLength(ast, 1);
    if (lengthError) {
      throw lengthError;
    }
    const child = ast.children[0];

    try {
      this.row = new AbsoluteRow(child, table);
    } catch (error) {
      // In a constructor, so we must throw
      throw error;
    }
  }

  public merge = (source: Source, table: Table): Result<Table, Error> => {
    // for cell in row...
    const cells = range(0, table.getWidth()).map(
      (columnNum): Cell => ({ row: this.row.index, column: columnNum }),
    );
    return mergeForCells(source, table, cells, this.formatter);
  };
}

export class ColumnDestination implements Destination {
  private readonly column: AbsoluteColumn;
  private readonly formatter: Formatter;

  constructor(ast: IToken, table: Table, formatter: Formatter) {
    this.formatter = formatter;

    const typeErr = checkType(ast, 'absolute_reference');
    if (typeErr) {
      throw typeErr;
    }

    const lengthError = checkChildLength(ast, 1);
    if (lengthError) {
      throw lengthError;
    }
    const child = ast.children[0];

    try {
      this.column = new AbsoluteColumn(child, table);
    } catch (error) {
      // In a constructor, so we must throw
      throw error;
    }
  }

  public merge = (source: Source, table: Table): Result<Table, Error> => {
    // for cell in column (excluding header)...
    const cells = range(2, table.getHeight()).map(
      (rowNum): Cell => ({ row: rowNum, column: this.column.index }),
    );
    return mergeForCells(source, table, cells, this.formatter);
  };
}

export class CellDestination implements Destination {
  private readonly row: AbsoluteRow;
  private readonly column: AbsoluteColumn;
  private readonly formatter: Formatter;

  constructor(ast: IToken, table: Table, formatter: Formatter) {
    this.formatter = formatter;

    const typeErr = checkType(ast, 'absolute_reference');
    if (typeErr) {
      throw typeErr;
    }

    // A cell needs to have two children, a row and a column
    const lengthError = checkChildLength(ast, 2);
    if (lengthError) {
      throw lengthError;
    }

    const rowChild = ast.children[0];
    const colChild = ast.children[1];

    try {
      this.row = new AbsoluteRow(rowChild, table);
      this.column = new AbsoluteColumn(colChild, table);
    } catch (error) {
      // In a constructor, so we must throw
      throw error;
    }
  }

  public merge = (source: Source, table: Table): Result<Table, Error> => {
    const cell: Cell = { row: this.row.index, column: this.column.index };
    return mergeForCells(source, table, [cell], this.formatter);
  };
}

export class RangeDestination implements Destination {
  private readonly range: Range;
  private readonly formatter: Formatter;

  constructor(ast: IToken, table: Table, formatter: Formatter) {
    this.formatter = formatter;

    const typeErr = checkType(ast, 'range');
    if (typeErr) {
      throw typeErr;
    }

    const lengthError = checkChildLength(ast, 2);
    if (lengthError) {
      throw lengthError;
    }

    ast.children.forEach((child) => {
      let childTypeErr = checkType(child, 'source_reference');
      if (childTypeErr) {
        throw childTypeErr;
      }

      const childLengthError = checkChildLength(child, 1);
      if (childLengthError) {
        throw childLengthError;
      }

      childTypeErr = checkType(child.children[0], 'absolute_reference');
      if (childTypeErr) {
        throw childTypeErr;
      }
    });

    this.range = new Range(ast, table);
  }

  public merge = (source: Source, table: Table): Result<Table, Error> =>
    this.range
      .asCells()
      .andThen((cells) => mergeForCells(source, table, cells, this.formatter));
}

const mergeForCells = (
  source: Source,
  table: Table,
  cells: Cell[],
  formatter: Formatter,
): Result<Table, Error> =>
  cells.reduce(
    (
      currentTable: Result<Table, Error>,
      currentCell: Cell,
    ): Result<Table, Error> =>
      currentTable.andThen(
        (t: Table): Result<Table, Error> =>
          source
            .getValue(t, currentCell)
            .andThen((val): Result<string, Error> => ok(val.toString()))
            .andThen(
              (val): Result<string, Error> => ok(val.trim() === '' ? '0' : val),
            )
            .andThen(
              (val): Result<Table, Error> =>
                ok(
                  t.setCellAt(
                    currentCell.row,
                    currentCell.column,
                    formatter.format(val),
                  ),
                ),
            ),
      ),
    ok(table),
  );
