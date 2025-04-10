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

export const newRow = (ast: IToken, table: Table): Result<Row, Error> => {
  try {
    switch (ast.type) {
      case 'relative_row':
        return ok(new RelativeRow(ast, table));
      case 'absolute_row':
        return ok(new AbsoluteRow(ast, table));
      default:
        return err(
          new Error(
            `Formula element '${ast.text}' is a ${ast.type} but expected an ` +
              'relatve_row or absolute_row  in this position.',
          ),
        );
    }
  } catch (error) {
    return err(error as Error);
  }
};

export abstract class Row implements ValueProvider {
  public getValue = (table: Table, currentCell: Cell): Result<Value, Error> => {
    const val =
      table
        .getCellAt(this.getIndex(currentCell), currentCell.column)
        ?.toText() || '';
    return ok(new Value([[val]]));
  };

  abstract getIndex(currentCell: Cell): number;

  abstract getAbsoluteIndex(): Result<number, Error>;
}

class RelativeRow extends Row {
  private readonly offset: number;

  constructor(ast: IToken, table: Table) {
    super();

    const typeError = checkType(ast, 'relative_row');
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

  public getIndex = (currentCell: Cell): number =>
    currentCell.row + this.offset;

  public getAbsoluteIndex = (): Result<number, Error> =>
    err(errRelativeReferenceIndex);
}

export class AbsoluteRow extends Row {
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
            'a \'absolute_row\' in this position.',
        );
    }

    switch (symbol) {
      case '':
        break;
      case '<':
        index += 1;
        break;
      case '>':
        index += table.getHeight() - 1;
        break;
      case 'I':
        index = 2;
        break;
      default:
        throw new Error(`Invalid row symbol '${symbol}'`);
    }

    if (index === 0) {
      throw errIndex0;
    }

    if (index === 1) {
      this.index = 0; // account for being zero indexed
    } else {
      this.index = index; // -1 for being zero indexed, but plus 1 to skip header
    }
  }

  public getIndex = (currentCell: Cell): number => this.index;

  public getAbsoluteIndex = (): Result<number, Error> => ok(this.index);
}
