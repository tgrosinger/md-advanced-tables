import { err, ok, Result } from '../neverthrow/neverthrow';
import { Table } from '../table';
import { Cell, checkChildLength, checkType, ValueProvider } from './ast_utils';
import { Source } from './calc';
import { Value } from './results';
import { IToken } from 'ebnf';

export class ConditionalFunctionCall implements ValueProvider {
  private readonly predicate: Predicate;
  private readonly leftSource: Source;
  private readonly rightSource: Source;

  constructor(ast: IToken, table: Table) {
    const typeError = checkType(ast, 'conditional_function_call');
    if (typeError) {
      throw typeError;
    }

    const lengthError = checkChildLength(ast, 3);
    if (lengthError) {
      throw lengthError;
    }

    try {
      this.predicate = new Predicate(ast.children[0], table);
      this.leftSource = new Source(ast.children[1], table);
      this.rightSource = new Source(ast.children[2], table);
    } catch (error) {
      // Still in a constructor, so nothing we can do but throw again
      throw error;
    }
  }

  public getValue = (table: Table, cell: Cell): Result<Value, Error> =>
    this.predicate
      .eval(table, cell)
      .andThen((predicateResult) =>
        predicateResult
          ? this.leftSource.getValue(table, cell)
          : this.rightSource.getValue(table, cell),
      );
}

class Predicate {
  private readonly leftSource: Source;
  private readonly rightSource: Source;
  private readonly operator: string;

  constructor(ast: IToken, table: Table) {
    const typeError = checkType(ast, 'predicate');
    if (typeError) {
      throw typeError;
    }

    const lengthError = checkChildLength(ast, 3);
    if (lengthError) {
      throw lengthError;
    }

    const childTypeError = checkType(ast.children[1], 'conditional_operator');
    if (childTypeError) {
      throw childTypeError;
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

  public eval = (table: Table, cell: Cell): Result<boolean, Error> => {
    const leftData = this.leftSource.getValue(table, cell);
    if (leftData.isErr()) {
      return err(leftData.error);
    }
    const rightData = this.rightSource.getValue(table, cell);
    if (rightData.isErr()) {
      return err(rightData.error);
    }

    const leftArity = leftData.value.getArity();
    const rightArity = rightData.value.getArity();

    if (!leftArity.isCell()) {
      return err(
        Error(
          'Can only use comparison operator on a single cell. Left side is not a cell.',
        ),
      );
    }
    if (!rightArity.isCell()) {
      return err(
        Error(
          'Can only use comparison operator on a single cell. Right side is not a cell.',
        ),
      );
    }

    const leftVal = leftData.value.getAsNumber(0, 0);
    const rightVal = rightData.value.getAsNumber(0, 0);

    switch (this.operator) {
      case '>':
        return ok(leftVal.greaterThan(rightVal));
      case '>=':
        return ok(leftVal.greaterThanOrEqualTo(rightVal));
      case '<':
        return ok(leftVal.lessThan(rightVal));
      case '<=':
        return ok(leftVal.lessThanOrEqualTo(rightVal));
      case '==':
        return ok(leftVal.equals(rightVal));
      case '!=':
        return ok(!leftVal.equals(rightVal));
      default:
        return err(Error('Invalid conditional operator: ' + this.operator));
    }
  };
}
