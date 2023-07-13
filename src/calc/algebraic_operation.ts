import { Table } from '..';
import { err, ok, Result } from '../neverthrow/neverthrow';
import { Cell, checkChildLength, checkType, ValueProvider } from './ast_utils';
import { Source } from './calc';
import { Constant } from './constant';
import { Value } from './results';
import { IToken } from 'ebnf';
import { map } from 'lodash';

export class AlgebraicOperation implements ValueProvider {
  private readonly leftSource: ValueProvider;
  private readonly rightSource: ValueProvider;
  private readonly operator: string;

  constructor(ast: IToken, table: Table) {
    const typeErr = checkType(ast, 'algebraic_operation');
    if (typeErr) {
      throw typeErr;
    }

    const lengthError = checkChildLength(ast, 3);
    if (lengthError) {
      throw lengthError;
    }

    const childTypeErr = checkType(ast.children[1], 'algebraic_operator');
    if (childTypeErr) {
      throw childTypeErr;
    }
    this.operator = ast.children[1].text;

    try {
      this.leftSource = new Source(ast.children[0], table);
      this.rightSource = new Source(ast.children[2], table);
    } catch (error) {
      // Still in a constructor, so nothing we can do but throw again
      throw error;
    }
  }

  public getValue = (table: Table, cell: Cell): Result<Value, Error> => {
    switch (this.operator) {
      case '+':
        return this.add(table, cell);
      case '-':
        return this.subtract(table, cell);
      case '*':
        return this.multiply(table, cell);
      case '/':
        return this.divide(table, cell);
      default:
        return err(Error('Invalid algbraic operator: ' + this.operator));
    }
  };

  /**
   * withCellAndRange aids in performing a numeric operation on cells in a
   * table where at least one of the two operands is a single cell. Optionally,
   * the two sides of the operation can be swapped, so the single cell is
   * always on the right.
   */
  private readonly withCellAndRange = (
    table: Table,
    cell: Cell,
    name: string,
    canHaveRightRange: boolean,
    fn: (left: number, right: number) => number,
  ): Result<Value, Error> => {
    const leftValue = this.leftSource.getValue(table, cell);
    if (leftValue.isErr()) {
      return err(leftValue.error);
    }
    const rightValue = this.rightSource.getValue(table, cell);
    if (rightValue.isErr()) {
      return err(rightValue.error);
    }

    const leftArity = leftValue.value.getArity();
    const rightArity = rightValue.value.getArity();

    if (!rightArity.isCell() && !leftArity.isCell()) {
      return err(
        Error(
          `At least one operand in algebraic "${name}" must be a single cell.`,
        ),
      );
    }

    if (!rightArity.isCell() && !canHaveRightRange) {
      return err(
        Error(`Right operand in algebraic "${name}" must be a single cell.`),
      );
    }

    if (rightArity.isCell()) {
      const rightCellValue = rightValue.value.getAsFloat(0, 0);

      const result: string[][] = map(
        leftValue.value.val,
        (currentRow: string[]): string[] =>
          map(currentRow, (currentCell: string): string => {
            let leftCellValue = parseFloat(currentCell);
            if (isNaN(leftCellValue)) {
              leftCellValue = 0;
            }
            return fn(leftCellValue, rightCellValue).toString();
          }),
      );
      return ok(new Value(result));
    }
    const leftCellValue = leftValue.value.getAsFloat(0, 0);

    const result: string[][] = map(
      rightValue.value.val,
      (currentRow: string[]): string[] =>
        map(currentRow, (currentCell: string): string => {
          let rightCellValue = parseFloat(currentCell);
          if (isNaN(leftCellValue)) {
            rightCellValue = 0;
          }
          return fn(leftCellValue, rightCellValue).toString();
        }),
    );
    return ok(new Value(result));
  };

  private readonly add = (table: Table, cell: Cell): Result<Value, Error> =>
    this.withCellAndRange(
      table,
      cell,
      'add',
      true,
      (left, right): number => left + right,
    );

  private readonly subtract = (
    table: Table,
    cell: Cell,
  ): Result<Value, Error> =>
    this.withCellAndRange(
      table,
      cell,
      'subtract',
      true,
      (left, right): number => left - right,
    );

  private readonly multiply = (
    table: Table,
    cell: Cell,
  ): Result<Value, Error> =>
    this.withCellAndRange(
      table,
      cell,
      'multiply',
      true,
      (left, right): number => left * right,
    );

  private readonly divide = (table: Table, cell: Cell): Result<Value, Error> =>
    this.withCellAndRange(
      table,
      cell,
      'divide',
      false,
      (left, right): number => left / right,
    );
}
