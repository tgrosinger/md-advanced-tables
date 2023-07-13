import Decimal from 'decimal.js';
import { flatten } from 'lodash';

const datetimeRe = new RegExp(
  '[1-9][0-9]{3}-[01][0-9]-[0-3][0-9][T ][0-2][0-9]:[0-5][0-9]',
);

export const FloatOrMilliseconds = (value: string): Decimal => {
  const v = value.trim();
  if (v === '') {
    return new Decimal(0);
  }

  if (datetimeRe.test(v)) {
    return new Decimal(new Date(v).valueOf());
  }

  const decimalValue = new Decimal(v);
  return decimalValue.isNaN() ? new Decimal(0) : decimalValue;
};

export class Arity {
  public rows: number;
  public cols: number;

  constructor(rows: number, columns: number) {
    this.rows = rows;
    this.cols = columns;
  }

  public isRow = (): boolean => this.rows > 1 && this.cols === 1;

  public isColumn = (): boolean => this.rows === 1 && this.cols > 1;

  public isCell = (): boolean => this.rows === 1 && this.cols === 1;
}

export class Value {
  public readonly val: string[][];

  constructor(val: string[][]) {
    this.val = val;
  }

  public get = (row: number, column: number): string => this.val[row][column];

  public getAsNumber = (row: number, column: number): Decimal => {
    const value = this.get(row, column);
    return FloatOrMilliseconds(value);
  };

  /**
   * getArity returns the dimensions of the contained value, in rows and columns
   */
  public getArity = (): Arity => {
    const maxCols = this.val.reduce<number>(
      (max: number, currentRow: string[]): number =>
        Math.max(max, currentRow.length),
      0,
    );
    return new Arity(this.val.length, maxCols);
  };

  public toString = (): string => {
    if (this.getArity().isCell()) {
      return this.get(0, 0);
    }

    return `[${flatten(this.val)
      .map((val) => val.trim())
      .filter((val) => val !== '')
      .join(', ')}]`;
  };
}
