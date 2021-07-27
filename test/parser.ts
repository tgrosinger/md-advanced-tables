import { optionsWithDefaults } from '../src/options';
import {
  _marginRegex,
  _readRow,
  _splitCells,
  marginRegexSrc,
  readTable,
} from '../src/parser';
import { Table } from '../src/table';
import { TableRow } from '../src/table-row';
import { expect } from 'chai';

/**
 * @test {_splitCells}
 */
describe('_splitCells(text)', () => {
  it('should split a text into cells', () => {
    expect(_splitCells('')).to.deep.equal(['']);
    expect(_splitCells(' | A | B | C | ')).to.deep.equal([
      ' ',
      ' A ',
      ' B ',
      ' C ',
      ' ',
    ]);
    expect(_splitCells(' | \\A | B | ')).to.deep.equal([
      ' ',
      ' \\A ',
      ' B ',
      ' ',
    ]);
    expect(_splitCells(' | A \\| B | ')).to.deep.equal([' ', ' A \\| B ', ' ']);
    expect(_splitCells(' | A | B | \\')).to.deep.equal([
      ' ',
      ' A ',
      ' B ',
      ' \\',
    ]);
    expect(_splitCells(' | A `|` B | ')).to.deep.equal([' ', ' A `|` B ', ' ']);
    expect(_splitCells(' | A ``|`` B | ')).to.deep.equal([
      ' ',
      ' A ``|`` B ',
      ' ',
    ]);
    expect(_splitCells(' | A ``|` B | ')).to.deep.equal([
      ' ',
      ' A ``|` B ',
      ' ',
    ]);
    expect(_splitCells(' | A `|`` B | ')).to.deep.equal([
      ' ',
      ' A `',
      '`` B ',
      ' ',
    ]);
    expect(_splitCells(' | A `` `|` `` B | ')).to.deep.equal([
      ' ',
      ' A `` `|` `` B ',
      ' ',
    ]);
    expect(_splitCells(' | A ` ``|`` ` B | ')).to.deep.equal([
      ' ',
      ' A ` ``|`` ` B ',
      ' ',
    ]);
    expect(_splitCells(' | A `` ``|`` `` B | ')).to.deep.equal([
      ' ',
      ' A `` ``',
      '`` `` B ',
      ' ',
    ]);
    expect(_splitCells(' | `\\` | B | ')).to.deep.equal([
      ' ',
      ' `\\` ',
      ' B ',
      ' ',
    ]);
    expect(_splitCells(' | A `\\|` B | ')).to.deep.equal([
      ' ',
      ' A `\\|` B ',
      ' ',
    ]);
    expect(_splitCells(' | A \\`|` B | ')).to.deep.equal([
      ' ',
      ' A \\`',
      '` B ',
      ' ',
    ]);
    expect(_splitCells(' | [[link]] | Something | ')).to.deep.equal([
      ' ',
      ' [[link]] ',
      ' Something ',
      ' ',
    ]);
    expect(_splitCells(' | [[link\\|renamed]] | Something | ')).to.deep.equal([
      ' ',
      ' [[link\\|renamed]] ',
      ' Something ',
      ' ',
    ]);
    expect(_splitCells(' | [[link|renamed]] | Something | ')).to.deep.equal([
      ' ',
      ' [[link\\|renamed]] ',
      ' Something ',
      ' ',
    ]);
  });
});

/**
 * @test {_readRow}
 */
describe('_readRow(text, leftMarginRegex = /^\\s*$/)', () => {
  it('should read a table row', () => {
    {
      const row = _readRow('');
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal('');
      expect(row.marginRight).to.equal('');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(0);
    }
    {
      const row = _readRow(' ');
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal(' ');
      expect(row.marginRight).to.equal('');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(0);
    }
    {
      const row = _readRow(' |  ');
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal(' ');
      expect(row.marginRight).to.equal('');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(1);
      expect(cells[0].rawContent).to.equal('  ');
    }
    {
      const row = _readRow('| A | B | C |');
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal('');
      expect(row.marginRight).to.equal('');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(3);
      expect(cells[0].rawContent).to.equal(' A ');
      expect(cells[1].rawContent).to.equal(' B ');
      expect(cells[2].rawContent).to.equal(' C ');
    }
    {
      const row = _readRow(' | A | B | C |  ');
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal(' ');
      expect(row.marginRight).to.equal('  ');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(3);
      expect(cells[0].rawContent).to.equal(' A ');
      expect(cells[1].rawContent).to.equal(' B ');
      expect(cells[2].rawContent).to.equal(' C ');
    }
    {
      const row = _readRow(' A | B | C ');
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal('');
      expect(row.marginRight).to.equal('');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(3);
      expect(cells[0].rawContent).to.equal(' A ');
      expect(cells[1].rawContent).to.equal(' B ');
      expect(cells[2].rawContent).to.equal(' C ');
    }
    {
      const row = _readRow('| `\\` \\| B `|` C |');
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal('');
      expect(row.marginRight).to.equal('');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(1);
      expect(cells[0].rawContent).to.equal(' `\\` \\| B `|` C ');
    }
    {
      const row = _readRow(' * | A | B | C |');
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal('');
      expect(row.marginRight).to.equal('');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(4);
      expect(cells[0].rawContent).to.equal(' * ');
      expect(cells[1].rawContent).to.equal(' A ');
      expect(cells[2].rawContent).to.equal(' B ');
      expect(cells[3].rawContent).to.equal(' C ');
    }
    {
      const row = _readRow(' * | A | B | C |', /^[\s*]*$/);
      expect(row).to.be.an.instanceOf(TableRow);
      expect(row.marginLeft).to.equal(' * ');
      expect(row.marginRight).to.equal('');
      const cells = row.getCells();
      expect(cells).to.be.an('array').of.length(3);
      expect(cells[0].rawContent).to.equal(' A ');
      expect(cells[1].rawContent).to.equal(' B ');
      expect(cells[2].rawContent).to.equal(' C ');
    }
  });
});

/**
 * @test {marginRegexSrc}
 */
describe('marginRegexSrc(chars)', () => {
  it('should create a regex source string of margin character class', () => {
    {
      const s = marginRegexSrc(new Set());
      expect(s).to.equal('[\\s]*');
    }
    {
      const s = marginRegexSrc(new Set('*'));
      expect(s).to.equal('[\\s\\u{2a}]*');
    }
    {
      const s = marginRegexSrc(new Set('\u{1F363}'));
      expect(s).to.equal('[\\s\\u{1f363}]*');
    }
  });

  it('should ignore a pipe, a backslash, and a backquote in the argument', () => {
    const s = marginRegexSrc(new Set('*|\\`'));
    expect(s).to.equal('[\\s\\u{2a}]*');
  });
});

/**
 * @test {_marginRegex}
 */
describe('_marginRegex(chars)', () => {
  it('should create a regular expression object that matches whitespaces or specified characters', () => {
    {
      const re = _marginRegex(new Set());
      expect(re.test('')).to.be.true;
      expect(re.test(' \t')).to.be.true;
      expect(re.test(' ABC ')).to.be.false;
    }
    {
      const re = _marginRegex(new Set('*-'));
      expect(re.test('')).to.be.true;
      expect(re.test(' \t')).to.be.true;
      expect(re.test(' ABC ')).to.be.false;
      expect(re.test(' * ')).to.be.true;
      expect(re.test(' -- ')).to.be.true;
      expect(re.test(' *- ')).to.be.true;
      expect(re.test(' A * B - C ')).to.be.false;
    }
    {
      const re = _marginRegex(new Set('\u{1F363}'));
      expect(re.test('')).to.be.true;
      expect(re.test(' \t')).to.be.true;
      expect(re.test(' ABC ')).to.be.false;
      expect(re.test('\u{1F363}')).to.be.true;
      expect(re.test('\uD83C')).to.be.false; // "\u{1F363}" === "\uD83C\uDF63"
    }
  });

  it('should ignore a pipe, a backslash, and a backquote in the argument', () => {
    const re = _marginRegex(new Set('*|\\`'));
    expect(re.test('')).to.be.true;
    expect(re.test(' \t')).to.be.true;
    expect(re.test(' ABC ')).to.be.false;
    expect(re.test(' * ')).to.be.true;
    expect(re.test(' | ')).to.be.false;
    expect(re.test(' \\ ')).to.be.false;
    expect(re.test(' ` ')).to.be.false;
  });
});

/**
 * @test {readTable}
 */
describe('readTable(lines, options)', () => {
  it('should read a table from an array of texts, each text represents a row', () => {
    {
      const lines = [
        '',
        ' |  ',
        '| A | B | C |',
        ' | A | B | C |  ',
        ' A | B | C ',
        ' * | A | B | C |',
        '| `\\` \\| B `|` C |',
      ];
      const options = optionsWithDefaults({
        leftMarginChars: new Set(),
      });
      const table = readTable(lines, options);
      expect(table).to.be.an.instanceOf(Table);
      const rows = table.getRows();
      expect(rows).to.be.an('array').of.length(7);
      {
        const row = rows[0];
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(0);
      }
      {
        const row = rows[1];
        expect(row.marginLeft).to.equal(' ');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(1);
        expect(cells[0].rawContent).to.equal('  ');
      }
      {
        const row = rows[2];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(3);
        expect(cells[0].rawContent).to.equal(' A ');
        expect(cells[1].rawContent).to.equal(' B ');
        expect(cells[2].rawContent).to.equal(' C ');
      }
      {
        const row = rows[3];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal(' ');
        expect(row.marginRight).to.equal('  ');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(3);
        expect(cells[0].rawContent).to.equal(' A ');
        expect(cells[1].rawContent).to.equal(' B ');
        expect(cells[2].rawContent).to.equal(' C ');
      }
      {
        const row = rows[4];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(3);
        expect(cells[0].rawContent).to.equal(' A ');
        expect(cells[1].rawContent).to.equal(' B ');
        expect(cells[2].rawContent).to.equal(' C ');
      }
      {
        const row = rows[5];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(4);
        expect(cells[0].rawContent).to.equal(' * ');
        expect(cells[1].rawContent).to.equal(' A ');
        expect(cells[2].rawContent).to.equal(' B ');
        expect(cells[3].rawContent).to.equal(' C ');
      }
      {
        const row = rows[6];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(1);
        expect(cells[0].rawContent).to.equal(' `\\` \\| B `|` C ');
      }
    }
    {
      const lines = [
        '',
        ' |  ',
        '| A | B | C |',
        ' | A | B | C |  ',
        ' A | B | C ',
        ' * | A | B | C |',
        '| `\\` \\| B `|` C |',
      ];
      const options = optionsWithDefaults({
        leftMarginChars: new Set('*'),
      });
      const table = readTable(lines, options);
      expect(table).to.be.an.instanceOf(Table);
      const rows = table.getRows();
      expect(rows).to.be.an('array').of.length(7);
      {
        const row = rows[0];
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(0);
      }
      {
        const row = rows[1];
        expect(row.marginLeft).to.equal(' ');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(1);
        expect(cells[0].rawContent).to.equal('  ');
      }
      {
        const row = rows[2];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(3);
        expect(cells[0].rawContent).to.equal(' A ');
        expect(cells[1].rawContent).to.equal(' B ');
        expect(cells[2].rawContent).to.equal(' C ');
      }
      {
        const row = rows[3];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal(' ');
        expect(row.marginRight).to.equal('  ');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(3);
        expect(cells[0].rawContent).to.equal(' A ');
        expect(cells[1].rawContent).to.equal(' B ');
        expect(cells[2].rawContent).to.equal(' C ');
      }
      {
        const row = rows[4];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(3);
        expect(cells[0].rawContent).to.equal(' A ');
        expect(cells[1].rawContent).to.equal(' B ');
        expect(cells[2].rawContent).to.equal(' C ');
      }
      {
        const row = rows[5];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal(' * ');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(3);
        expect(cells[0].rawContent).to.equal(' A ');
        expect(cells[1].rawContent).to.equal(' B ');
        expect(cells[2].rawContent).to.equal(' C ');
      }
      {
        const row = rows[6];
        expect(row).to.be.an.instanceOf(TableRow);
        expect(row.marginLeft).to.equal('');
        expect(row.marginRight).to.equal('');
        const cells = row.getCells();
        expect(cells).to.be.an('array').of.length(1);
        expect(cells[0].rawContent).to.equal(' `\\` \\| B `|` C ');
      }
    }
  });
});
