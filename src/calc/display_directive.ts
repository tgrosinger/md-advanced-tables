import { checkChildLength, checkType } from './ast_utils';
import { IToken } from 'ebnf';

export interface Formatter {
  format(num: number | string): string;
}

export class DefaultFormatter {
  public format = (num: number | string): string => {
    if (typeof num === 'string') {
      return num;
    }
    return num.toString();
  };
}

export class DisplayDirective {
  private readonly decimalLength: number;
  private readonly displayAsDatetime: boolean;

  constructor(ast: IToken) {
    let typeError = checkType(ast, 'display_directive');
    if (typeError) {
      throw typeError;
    }

    let lengthError = checkChildLength(ast, 1);
    if (lengthError) {
      throw lengthError;
    }

    const displayDirectiveOption = ast.children[0];

    typeError = checkType(displayDirectiveOption, 'display_directive_option');
    if (typeError) {
      throw typeError;
    }

    lengthError = checkChildLength(displayDirectiveOption, 1);
    if (lengthError) {
      throw lengthError;
    }

    const formattingDirective = displayDirectiveOption.children[0];

    typeError = checkType(
      formattingDirective,
      'formatting_directive',
      'datetime_directive',
    );
    if (typeError) {
      throw typeError;
    }

    this.displayAsDatetime = formattingDirective.type === 'datetime_directive';
    if (this.displayAsDatetime) {
      this.decimalLength = -1;
      return;
    }

    lengthError = checkChildLength(formattingDirective, 1);
    if (lengthError) {
      throw lengthError;
    }

    const formattingDirectiveLength = formattingDirective.children[0];

    typeError = checkType(formattingDirectiveLength, 'int');
    if (typeError) {
      throw typeError;
    }

    this.decimalLength = parseInt(formattingDirectiveLength.text);
  }

  public format = (num: number | string): string => {
    const parsed = typeof num === 'string' ? parseFloat(num) : num;

    if (this.displayAsDatetime) {
      // Seriously, there's no date formatting functionality in Javascript?
      const date = new Date(parsed);
      const pad = (v: number): string => `0${v}`.slice(-2);
      const y = date.getFullYear();
      const mo = pad(date.getMonth() + 1);
      const d = pad(date.getDate());
      const h = pad(date.getHours());
      const min = pad(date.getMinutes());
      return `${y}-${mo}-${d} ${h}:${min}`;
    }

    return parsed.toFixed(this.decimalLength);
  };
}
