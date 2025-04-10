import { err, ok, Result } from '../neverthrow/neverthrow';
import { Table } from '../table';
import {
  Cell,
  checkChildLength,
  checkType,
  errIndex0,
  errRelativeReferenceIndex,
  ValueProvider,
} from './ast_utils';
import { Value } from './results';
import { IToken } from 'ebnf';

export const newColumn = (ast: IToken, table: Table): Result<Column, Error> => {
  try {
    switch (ast.type) {
      case 'relative_column':
        return ok(new RelativeColumn(ast, table));
      case 'absolute_column':
        return ok(new AbsoluteColumn(ast, table));
      default:
        return err(
          new Error(
            `Formula element '${ast.text}' is a ${ast.type} but expected an ` +
              'relatve_column or absolute_column in this position.',
          ),
        );
    }
  } catch (error) {
    return err(error as Error);
  }
};

export abstract class Column implements ValueProvider {
  public getValue = (table: Table, currentCell: Cell): Result<Value, Error> => {
    const val =
      table.getCellAt(currentCell.row, this.getIndex(currentCell))?.toText() ||
      '';
    return ok(new Value([[val]]));
  };

  abstract getIndex(currentCell: Cell): number;

  abstract getAbsoluteIndex(): Result<number, Error>;
}

class RelativeColumn extends Column {
  private readonly offset: number;

  constructor(ast: IToken, table: Table) {
    super();

    const typeError = checkType(ast, 'relative_column');
    if (typeError) {
      throw typeError;
    }

    const lengthError = checkChildLength(ast, 1);
    if (lengthError) {
      throw lengthError;
    }

    const multiplier = ast.text[1] === '-' ? -1 : 1;
    this.offset = multiplier * parseInt(ast.children[0].text);
  }

  public getIndex = (currentCell: Cell): number => currentCell.column + this.offset;

  public getAbsoluteIndex = (): Result<number, Error> =>
    err(errRelativeReferenceIndex);
}

export class AbsoluteColumn extends Column {
  public index: number;

  constructor(ast: IToken, table: Table) {
    super();

    let index = 0;
    let symbol = '';

    switch (ast.children.length) {
      case 0:
        symbol = ast.text[1];
        break;
      case 1:
        const typeError = checkType(ast.children[0], 'int');
        if (typeError) {
          throw err(typeError);
        }
        index = parseInt(ast.children[0].text);
        // In the case of relative to first/last index ex: @>-3 
        if (ast.text[1] === ">" || ast.text[1] === "<") {
          symbol = ast.text[1];
          if (ast.text[2] && ast.text[2] === "-") {
            index *= -1;
          }
        }
        break;
      default:
        throw new Error(
          `Formula element '${ast.text}' is a ${ast.type} but expected ` +
            'a \'absolute_column\' in this position.',
        );
    }

    switch (symbol) {
      case '':
        break;
      case '<':
        index += 1;
        break;
      case '>':
        index += table.getWidth();
        break;
      default:
        throw new Error(`Invalid column symbol '${symbol}'`);
    }

    if (index === 0) {
      throw errIndex0;
    }

    this.index = index - 1; // -1 for being zero indexed
  }

  public getIndex = (currentCell: Cell): number => this.index;

  public getAbsoluteIndex = (): Result<number, Error> => ok(this.index);
}
