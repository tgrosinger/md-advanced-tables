import { err, ok, Result } from '../neverthrow/neverthrow';
import { Table } from '../table';
import { AlgebraicOperation } from './algebraic_operation';
import { Cell, checkChildLength, checkType, ValueProvider } from './ast_utils';
import { ConditionalFunctionCall } from './conditional_function';
import { Constant } from './constant';
import { Destination, newDestination } from './destination';
import {
  DefaultFormatter,
  DisplayDirective,
  Formatter,
} from './display_directive';
import { Range } from './range';
import { Reference } from './reference';
import { Value } from './results';
import { SingleParamFunctionCall } from './single_param_function';
import { Grammars, IToken } from 'ebnf';
import { concat } from 'lodash';

/**
 * W3C grammar describing a valid formula at the bottom of a table.
 *
 * The library being used to parse the formula does not suport EBNF, only BNF,
 * so W3C syntax was used in order to get access to extended features.
 *
 * The parser generates a PEG parser, whic is not able to handle ambiguity. The
 * order of constructions is significant.
 * See https://github.com/lys-lang/node-ebnf/issues/34
 */
const parserGrammar = `
tblfm_line   ::= "<!-- TBLFM: " formula_list " -->"
formula_list ::= formula ( "::" formula_list )?
formula      ::= destination "=" source display_directive?

source           ::= range | source_reference | single_param_function_call | conditional_function_call | algebraic_operation | float | real
range            ::= source_reference ".." source_reference
source_reference ::= absolute_reference | relative_reference
destination      ::= range | absolute_reference

relative_reference ::= (relative_row | absolute_row) (relative_column | absolute_column) | relative_row | relative_column
relative_row ::= "@" ( "-" | "+" ) int
relative_column ::= "$" ( "-" | "+" ) int

absolute_reference ::= absolute_row absolute_column | absolute_row | absolute_column
absolute_row ::= "@" ( "I" | ("<" | ">") (("+" | "-") int)? | int )
absolute_column ::= "$" ( ("<" | ">") (("+" | "-") int)? | int )

single_param_function_call ::= single_param_function "(" source ")" 
single_param_function      ::= "mean" | "sum"

conditional_function_call ::= "if(" predicate "," " "? source "," " "? source ")"
predicate                 ::= source_without_range conditional_operator source_without_range
source_without_range      ::= source_reference | single_param_function_call | conditional_function_call | algebraic_operation | float | real
conditional_operator      ::= ">" | "<" | ">=" | "<=" | "==" | "!="

algebraic_operation ::= "(" source " "? algebraic_operator " "? source ")"
algebraic_operator  ::= "+" | "-" | "*" | "/"

display_directive        ::= ";" display_directive_option
display_directive_option ::= formatting_directive | datetime_directive | hourminute_directive
formatting_directive     ::= "%." int "f"
datetime_directive       ::= "dt"
hourminute_directive     ::= "hm"

float ::= "-"? int "." int
real ::= "-"? int
int  ::= [0-9]+
`;

export class Formula {
  private readonly source: Source;
  private readonly destination: Destination;

  constructor(ast: IToken, table: Table) {
    let formatter: Formatter = new DefaultFormatter();
    if (ast.children.length === 3) {
      formatter = new DisplayDirective(ast.children[2]);
    }

    const destination = newDestination(ast.children[0], table, formatter);
    if (destination.isErr()) {
      throw destination.error;
    }
    this.destination = destination.value;
    this.source = new Source(ast.children[1], table);
  }

  public merge = (table: Table): Result<Table, Error> =>
    this.destination.merge(this.source, table);
}

export class Source {
  private readonly locationDescriptor: ValueProvider;

  constructor(ast: IToken, table: Table) {
    if (ast.type !== 'source' && ast.type !== 'source_without_range') {
      throw Error('Invalid AST token type of ' + ast.type);
    }
    if (ast.children.length !== 1) {
      throw Error('Unexpected children length in Source');
    }

    const paramChild = ast.children[0];
    const vp = newValueProvider(paramChild, table);
    if (vp.isErr()) {
      throw vp.error;
    }
    this.locationDescriptor = vp.value;
  }

  /**
   * getValue returns the evaluated value for this source recursively.
   */
  public getValue = (table: Table, currentCell: Cell): Result<Value, Error> =>
    this.locationDescriptor.getValue(table, currentCell);
}

const newValueProvider = (
  ast: IToken,
  table: Table,
): Result<ValueProvider, Error> => {
  try {
    switch (ast.type) {
      case 'range':
        return ok(new Range(ast, table));
      case 'source_reference':
        const lengthError = checkChildLength(ast, 1);
        if (lengthError) {
          return err(lengthError);
        }
        return ok(new Reference(ast.children[0], table));
      case 'single_param_function_call':
        return ok(new SingleParamFunctionCall(ast, table));
      case 'conditional_function_call':
        return ok(new ConditionalFunctionCall(ast, table));
      case 'algebraic_operation':
        return ok(new AlgebraicOperation(ast, table));
      case 'real':
        return ok(new Constant(ast, table));
      case 'float':
        return ok(new Constant(ast, table));
      default:
        throw Error('Unrecognized valueProvider type ' + ast.type);
    }
  } catch (error) {
    return err(error as Error);
  }
};

export const parseAndApply = (
  formulaLines: string[],
  table: Table,
): Result<Table, Error> => {
  // Parse each formula line, flattening the resulting lists of formulas into a
  // single list, but returning an error if any formula fails to parse.
  const formulas: Result<Formula[], Error> = formulaLines.reduce(
    (
      prev: Result<Formula[], Error>,
      formulaLine: string,
    ): Result<Formula[], Error> =>
      prev.andThen((currentFormulas: Formula[]): Result<Formula[], Error> => {
        const newFormulas = parseFormula(formulaLine, table);
        if (newFormulas.isErr()) {
          return newFormulas;
        }

        return ok(concat(newFormulas.value, currentFormulas));
      }),
    ok([]),
  );

  // If there is no error,
  return formulas.andThen((innerFormulas: Formula[]) =>
    // for each formula
    innerFormulas.reduceRight<Result<Table, Error>>(
      (prevValue, formula) =>
        // If the previous formula didn't give an error
        prevValue.andThen(
          (prevTable): Result<Table, Error> =>
            // attempt to apply this formula to the table and return the result
            formula.merge(prevTable),
        ),
      // Start with the current table state
      ok(table),
    ),
  );
};

/**
 * Parse the provided line, returning any found formulas. A single line may
 * contain zero or more formulas.
 *
 * @param line A line of the form `<!-- TBFM: {FORMULA}::{FORMULA} -->`
 */
export const parseFormula = (
  line: string,
  table: Table,
): Result<Formula[], Error> => {
  const parser = new Grammars.W3C.Parser(parserGrammar);
  const ast = parser.getAST(line);

  // TODO: Determine how to return errors when a formula-like string
  //       is not actually a valid formula.

  if (!ast) {
    return err(new Error(`Formula '${line}' could not be parsed`));
  }

  const typeError = checkType(ast, 'tblfm_line');
  if (typeError) {
    return err(typeError);
  }

  const lengthError = checkChildLength(ast, 1);
  if (lengthError) {
    return err(lengthError);
  }

  let unparsedFormulas = ast.children[0].children;
  const formulas: Formula[] = [];

  try {
    do {
      formulas.push(new Formula(unparsedFormulas[0], table));

      if (
        unparsedFormulas.length > 1 &&
        unparsedFormulas[1].type === 'formula_list'
      ) {
        unparsedFormulas = unparsedFormulas[1].children;
      } else {
        unparsedFormulas = [];
      }
    } while (unparsedFormulas.length > 0);
    return ok(formulas);
  } catch (error) {
    return err(error as Error);
  }
};
