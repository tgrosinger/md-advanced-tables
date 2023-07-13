import Decimal from 'decimal.js';
import { ok, Result } from '../neverthrow/neverthrow';
import { Table } from '../table';
import { Cell, checkChildLength, checkType, ValueProvider } from './ast_utils';
import { Source } from './calc';
import { FloatOrSeconds, Value } from './results';
import { IToken } from 'ebnf';

export class SingleParamFunctionCall implements ValueProvider {
  private readonly param: Source;
  private readonly op;

  constructor(ast: IToken, table: Table) {
    const typeError = checkType(ast, 'single_param_function_call');
    if (typeError) {
      throw typeError;
    }

    const lengthError = checkChildLength(ast, 2);
    if (lengthError) {
      throw lengthError;
    }

    const childTypeError = checkType(ast.children[0], 'single_param_function');
    if (childTypeError) {
      throw childTypeError;
    }

    const functionName = ast.children[0].text;
    switch (functionName) {
      case 'sum':
        this.op = sum;
        break;
      case 'mean':
        this.op = mean;
        break;
      default:
        throw Error('Unknown single param function call: ' + functionName);
    }

    this.param = new Source(ast.children[1], table);
  }

  public getValue = (table: Table, cell: Cell): Result<Value, Error> =>
    this.param.getValue(table, cell).andThen((sourceData) =>
      // The operation functions do not throw errors because data arity has
      // already been validated.
      ok(this.op(sourceData)),
    );
}

/**
 * Sum all the cells in the input value, producing a single cell output.
 */
const sum = (value: Value): Value => {
  const total = value.val.reduce(
    (runningTotal, currentRow): Decimal =>
      currentRow.reduce((rowTotal, currentCell): Decimal => {
        const currentCellValue = FloatOrSeconds(currentCell);
        return currentCellValue.add(rowTotal);
      }, runningTotal),
    new Decimal(0),
  );

  return new Value([[total.toString()]]);
};

interface Counter {
  total: number;
  count: number;
}

/**
 * Mean of all the cells in the input value, producing a single cell output.
 */
const mean = (value: Value): Value => {
  const { total, count } = value.val.reduce(
    ({ total: runningTotal1, count: currentCount1 }, currentRow): Counter =>
      currentRow.reduce(
        (
          { total: runningTotal2, count: currentCount2 },
          currentCell,
        ): Counter => ({
          total: runningTotal2 + +currentCell,
          count: currentCount2 + 1,
        }),
        { total: runningTotal1, count: currentCount1 },
      ),
    { total: 0, count: 0 },
  );

  return new Value([[(total / count).toString()]]);
};
