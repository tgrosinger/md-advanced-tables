import { Alignment, DefaultAlignment } from '../src/alignment';
import { Focus } from '../src/focus';
import { completeTable, formatTable } from '../src/formatter';
import { defaultOptions, Options, optionsWithDefaults } from '../src/options';
import { readTable } from '../src/parser';
import { Point } from '../src/point';
import { Range } from '../src/range';
import { Table } from '../src/table';
import {
  _computeNewOffset,
  _createIsTableRowRegex,
  TableEditor,
  SortOrder,
  _createIsTableFormulaRegex,
} from '../src/table-editor';
import { TextEditor } from './text-editor-mock';
import { assert, expect } from 'chai';

/**
 * @test {_createIsTableRowRegex}
 */
describe('_createIsTableRowRegex(leftMarginChars)', () => {
  it('should return a regular expression object that matches a table row', () => {
    {
      const re = _createIsTableRowRegex(new Set());
      expect(re.test('|')).to.be.true;
      expect(re.test('|foo')).to.be.true;
      expect(re.test(' \t|')).to.be.true;
      expect(re.test(' \t|foo')).to.be.true;
      expect(re.test('')).to.be.false;
      expect(re.test('foo')).to.be.false;
      expect(re.test(' \t')).to.be.false;
      expect(re.test(' \tfoo')).to.be.false;
      expect(re.test(' * |foo')).to.be.false;
    }
    {
      const re = _createIsTableRowRegex(new Set('*'));
      expect(re.test('|')).to.be.true;
      expect(re.test('|foo')).to.be.true;
      expect(re.test(' \t|')).to.be.true;
      expect(re.test(' \t|foo')).to.be.true;
      expect(re.test('')).to.be.false;
      expect(re.test('foo')).to.be.false;
      expect(re.test(' \t')).to.be.false;
      expect(re.test(' \tfoo')).to.be.false;
      expect(re.test(' * |foo')).to.be.true;
    }
  });

  it('should ignore a pipe, a backslash, and a backquote', () => {
    const re = _createIsTableRowRegex(new Set('*|\\`'));
    expect(re.test('|')).to.be.true;
    expect(re.test('|foo')).to.be.true;
    expect(re.test(' \t|')).to.be.true;
    expect(re.test(' \t|foo')).to.be.true;
    expect(re.test('')).to.be.false;
    expect(re.test('foo')).to.be.false;
    expect(re.test(' \t')).to.be.false;
    expect(re.test(' \tfoo')).to.be.false;
    expect(re.test(' * |foo')).to.be.true;
    expect(re.test(' \\|foo')).to.be.false;
    expect(re.test(' ` |foo')).to.be.false;
  });
});

/**
 * @test {_createIsTableFormulaRegex}
 */
describe('_createIsTableFormulaRegex(leftMarginChars)', () => {
  it('should return a regular expression object that matches a table formula', () => {
    {
      const re = _createIsTableFormulaRegex(new Set());
      expect(re.test('|')).to.be.false;
      expect(re.test('|foo')).to.be.false;
      expect(re.test('<!-- TBFM: @2$4=vmean($2..$3) -->')).to.be.true;
      expect(re.test('<!-- TBFM: $4=vmean($2..$3) -->')).to.be.true;
      expect(re.test('<!--TBFM: $4=vmean($2..$3)-->')).to.be.true;
      expect(re.test(' \t<!-- TBFM: @2$4=vmean($2..$3) -->')).to.be.true;
      expect(re.test('')).to.be.false;
      expect(re.test(' \t')).to.be.false;
      expect(re.test('TBFM: @2$4=vmean($2..$3)')).to.be.false;
      expect(re.test('\tTBFM: @2$4=vmean($2..$3)')).to.be.false;
      expect(re.test(' * <!--TBFM: $4=vmean($2..$3)-->')).to.be.false;
    }
    {
      const re = _createIsTableFormulaRegex(new Set('*'));
      expect(re.test('|')).to.be.false;
      expect(re.test('|foo')).to.be.false;
      expect(re.test('<!-- TBFM: @2$4=vmean($2..$3) -->')).to.be.true;
      expect(re.test('<!-- TBFM: $4=vmean($2..$3) -->')).to.be.true;
      expect(re.test('<!--TBFM: $4=vmean($2..$3)-->')).to.be.true;
      expect(re.test(' \t<!-- TBFM: @2$4=vmean($2..$3) -->')).to.be.true;
      expect(re.test('')).to.be.false;
      expect(re.test(' \t')).to.be.false;
      expect(re.test('TBFM: @2$4=vmean($2..$3)')).to.be.false;
      expect(re.test('\tTBFM: @2$4=vmean($2..$3)')).to.be.false;
      expect(re.test(' * <!--TBFM: $4=vmean($2..$3)-->')).to.be.true;
    }
  });
});

/**
 * @test {_computeNewOffset}
 */
describe('_computeNewOffset(focus, completed, formatted, moved)', () => {
  it('should compute new focus offset from the information of the completed and formatted tables', () => {
    const table = readTable(
      [' | A | B | ', '| --- | ---:|', '  | C | D |  '],
      optionsWithDefaults({ leftMarginChars: new Set() }),
    );
    const ops = defaultOptions;
    const completed = completeTable(table, ops);
    const formatted = formatTable(completed.table, ops);
    expect(
      _computeNewOffset(new Focus(2, 0, 0), completed.table, formatted, false),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, 0, 1), completed.table, formatted, false),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, 0, 2), completed.table, formatted, false),
    ).to.equal(2);
    expect(
      _computeNewOffset(new Focus(2, 0, 3), completed.table, formatted, false),
    ).to.equal(2);
    expect(
      _computeNewOffset(new Focus(2, 0, 0), completed.table, formatted, true),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, 0, 1), completed.table, formatted, true),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, 0, 2), completed.table, formatted, true),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, 0, 3), completed.table, formatted, true),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, 1, 0), completed.table, formatted, false),
    ).to.equal(3);
    expect(
      _computeNewOffset(new Focus(2, 1, 1), completed.table, formatted, false),
    ).to.equal(3);
    expect(
      _computeNewOffset(new Focus(2, 1, 2), completed.table, formatted, false),
    ).to.equal(4);
    expect(
      _computeNewOffset(new Focus(2, 1, 3), completed.table, formatted, false),
    ).to.equal(4);
    expect(
      _computeNewOffset(new Focus(2, 1, 0), completed.table, formatted, true),
    ).to.equal(3);
    expect(
      _computeNewOffset(new Focus(2, 1, 1), completed.table, formatted, true),
    ).to.equal(3);
    expect(
      _computeNewOffset(new Focus(2, 1, 2), completed.table, formatted, true),
    ).to.equal(3);
    expect(
      _computeNewOffset(new Focus(2, 1, 3), completed.table, formatted, true),
    ).to.equal(3);
    expect(
      _computeNewOffset(new Focus(2, -1, 0), completed.table, formatted, false),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, -1, 1), completed.table, formatted, false),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, -1, 2), completed.table, formatted, false),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, -1, 0), completed.table, formatted, true),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, -1, 1), completed.table, formatted, true),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, -1, 2), completed.table, formatted, true),
    ).to.equal(1);
    expect(
      _computeNewOffset(new Focus(2, 2, 0), completed.table, formatted, false),
    ).to.equal(0);
    expect(
      _computeNewOffset(new Focus(2, 2, 1), completed.table, formatted, false),
    ).to.equal(0);
    expect(
      _computeNewOffset(new Focus(2, 2, 2), completed.table, formatted, false),
    ).to.equal(0);
    expect(
      _computeNewOffset(new Focus(2, 2, 0), completed.table, formatted, true),
    ).to.equal(0);
    expect(
      _computeNewOffset(new Focus(2, 2, 1), completed.table, formatted, true),
    ).to.equal(0);
    expect(
      _computeNewOffset(new Focus(2, 2, 2), completed.table, formatted, true),
    ).to.equal(0);
  });
});

/**
 * @test {TableEditor}
 */
describe('TableEditor', () => {
  /**
   * @test {TableEditor.constructor}
   */
  describe('constructor(textEditor)', () => {
    it('should create a new TableEditor object', () => {
      const tableEditor = new TableEditor(new TextEditor([]));
      expect(tableEditor).to.be.an.instanceOf(TableEditor);
    });
  });

  /**
   * @test {TableEditor#resetSmartCursor}
   */
  describe('#resetSmartCursor()', () => {
    it('should reset the smart cursor flag', () => {
      const tableEditor = new TableEditor(new TextEditor([]));
      // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
      tableEditor._scActive = true;
      // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
      expect(tableEditor._scActive).to.be.true;
      tableEditor.resetSmartCursor();
      // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
      expect(tableEditor._scActive).to.be.false;
    });
  });

  describe('#cursorIsInTableFormula(options)', () => {
    it('should return true if the cursor of the text editor is in a formula line', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '<!-- TBLFM: @>$2=sum(@I..@-1) -->',
          'bar',
        ]);
        textEditor.acceptsTableEdit = (row) => row !== 1 && row !== 6;
        const ops = defaultOptions;
        const tableEditor = new TableEditor(textEditor);
        textEditor.setCursorPosition(new Point(0, 0));
        expect(tableEditor.cursorIsInTableFormula(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(4, 0));
        expect(tableEditor.cursorIsInTableFormula(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(4, 10));
        expect(tableEditor.cursorIsInTableFormula(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(5, 2));
        expect(tableEditor.cursorIsInTableFormula(ops)).to.be.false;
      }
    });
  });

  /**
   * @test {TableEditor#cursorIsInTable}
   */
  describe('#cursorIsInTable(options)', () => {
    it('should return true if the cursor of the text editor is in a table', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| ?   | ?   |', // not included in table for some reason
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          ' * | E   | F   |',
          '| ?   | ?   |', // not included in table for some reason
          'bar',
        ]);
        textEditor.acceptsTableEdit = (row) => row !== 1 && row !== 6;
        const ops = defaultOptions;
        const tableEditor = new TableEditor(textEditor);
        textEditor.setCursorPosition(new Point(0, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(0, 3));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(1, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(1, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(2, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(2, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(3, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(3, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(4, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(4, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(5, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(5, 16));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(6, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(6, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(7, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(7, 3));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| ?   | ?   |', // not included in table for some reason
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          ' * | E   | F   |',
          '| ?   | ?   |', // not included in table for some reason
          'bar',
        ]);
        textEditor.acceptsTableEdit = (row) => row !== 1 && row !== 6;
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        const tableEditor = new TableEditor(textEditor);
        textEditor.setCursorPosition(new Point(0, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(0, 3));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(1, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(1, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(2, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(2, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(3, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(3, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(4, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(4, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(5, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(5, 16));
        expect(tableEditor.cursorIsInTable(ops)).to.be.true;
        textEditor.setCursorPosition(new Point(6, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(6, 13));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(7, 0));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
        textEditor.setCursorPosition(new Point(7, 3));
        expect(tableEditor.cursorIsInTable(ops)).to.be.false;
      }
    });
  });

  /**
   * @test {TableEditor#_findTable}
   */
  describe('#_findTable(options)', () => {
    it('should find a table under the current cursor position and return an object that describes the table', () => {
      const textEditor = new TextEditor([
        'foo',
        '| ?   | ?   |', // not included in table for some reason
        '| A   | B   |',
        '| --- | --- |',
        '| C   | D   |',
        ' * | E   | F   |',
        '| ?   | ?   |', // not included in table for some reason
        'bar',
      ]);
      textEditor.acceptsTableEdit = (row) => row !== 1 && row !== 6;
      const tableEditor = new TableEditor(textEditor);
      textEditor.setCursorPosition(new Point(2, 0));
      {
        const ops = defaultOptions;
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(4);
        expect(info.range.end.column).to.equal(13);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(0);
        expect(info.focus.column).to.equal(-1);
        expect(info.focus.offset).to.equal(0);
      }
      textEditor.setCursorPosition(new Point(2, 2));
      {
        const ops = defaultOptions;
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(4);
        expect(info.range.end.column).to.equal(13);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(0);
        expect(info.focus.column).to.equal(0);
        expect(info.focus.offset).to.equal(1);
      }
      textEditor.setCursorPosition(new Point(2, 9));
      {
        const ops = defaultOptions;
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(4);
        expect(info.range.end.column).to.equal(13);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(0);
        expect(info.focus.column).to.equal(1);
        expect(info.focus.offset).to.equal(2);
      }
      textEditor.setCursorPosition(new Point(2, 13));
      {
        const ops = defaultOptions;
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(4);
        expect(info.range.end.column).to.equal(13);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(0);
        expect(info.focus.column).to.equal(2);
        expect(info.focus.offset).to.equal(0);
      }
      textEditor.setCursorPosition(new Point(3, 2));
      {
        const ops = defaultOptions;
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(4);
        expect(info.range.end.column).to.equal(13);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(1);
        expect(info.focus.column).to.equal(0);
        expect(info.focus.offset).to.equal(1);
      }
      textEditor.setCursorPosition(new Point(4, 2));
      {
        const ops = defaultOptions;
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(4);
        expect(info.range.end.column).to.equal(13);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(2);
        expect(info.focus.column).to.equal(0);
        expect(info.focus.offset).to.equal(1);
      }
      textEditor.setCursorPosition(new Point(2, 0));
      {
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(5);
        expect(info.range.end.column).to.equal(16);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          ' * | E   | F   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          ' * | E   | F   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(0);
        expect(info.focus.column).to.equal(-1);
        expect(info.focus.offset).to.equal(0);
      }
      textEditor.setCursorPosition(new Point(5, 0));
      {
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(5);
        expect(info.range.end.column).to.equal(16);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          ' * | E   | F   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          ' * | E   | F   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(3);
        expect(info.focus.column).to.equal(-1);
        expect(info.focus.offset).to.equal(0);
      }
      textEditor.setCursorPosition(new Point(5, 5));
      {
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(2);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(5);
        expect(info.range.end.column).to.equal(16);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          ' * | E   | F   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          ' * | E   | F   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(3);
        expect(info.focus.column).to.equal(0);
        expect(info.focus.offset).to.equal(1);
      }
    });

    it('should return the set of table formula lines', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A   | B   |',
        '| --- | --- |',
        '| C   | D   |',
        '| E   | F   |',
        '<!-- TBLFM: @2=@3 -->',
        '<!-- TBLFM: @2$3..@3$4=vmean(@3..@I-1$>-1) -->',
        'bar',
      ]);
      textEditor.acceptsTableEdit = (_) => true;
      const tableEditor = new TableEditor(textEditor);
      textEditor.setCursorPosition(new Point(4, 2));
      {
        const ops = defaultOptions;
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(1);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(4);
        expect(info.range.end.column).to.equal(13);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(3);
        expect(info.focus.column).to.equal(0);
        expect(info.focus.offset).to.equal(1);
        expect(info.formulaLines).to.be.an('array').of.length(2);
        expect(info.formulaLines[0]).to.equal('<!-- TBLFM: @2=@3 -->');
        expect(info.formulaLines[1]).to.equal(
          '<!-- TBLFM: @2$3..@3$4=vmean(@3..@I-1$>-1) -->',
        );
      }
    });

    it('should find the table if the cursor is in a formula line', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A   | B   |',
        '| --- | --- |',
        '| C   | D   |',
        '| E   | F   |',
        '<!-- TBLFM: @2=@3 -->',
        '<!-- TBLFM: @2$3..@3$4=vmean(@3..@I-1$>-1) -->',
        'bar',
      ]);
      textEditor.acceptsTableEdit = (_) => true;
      const tableEditor = new TableEditor(textEditor);
      textEditor.setCursorPosition(new Point(6, 2));
      {
        const ops = defaultOptions;
        const info = tableEditor._findTable(ops);
        if (info === undefined) {
          assert.fail();
        }
        expect(info).to.be.an('object');
        expect(info.range).to.be.an.instanceOf(Range);
        expect(info.range.start.row).to.equal(1);
        expect(info.range.start.column).to.equal(0);
        expect(info.range.end.row).to.equal(4);
        expect(info.range.end.column).to.equal(13);
        expect(info.lines).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
        ]);
        expect(info.table).to.be.an.instanceOf(Table);
        expect(info.table.toLines()).to.deep.equal([
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
        ]);
        expect(info.focus).to.be.an.instanceOf(Focus);
        expect(info.focus.row).to.equal(3);
        expect(info.focus.column).to.equal(0);
        expect(info.focus.offset).to.equal(1);
        expect(info.formulaLines).to.be.an('array').of.length(2);
        expect(info.formulaLines[0]).to.equal('<!-- TBLFM: @2=@3 -->');
        expect(info.formulaLines[1]).to.equal(
          '<!-- TBLFM: @2$3..@3$4=vmean(@3..@I-1$>-1) -->',
        );
      }
      textEditor.setCursorPosition(new Point(7, 0));
      {
        const ops = defaultOptions;
        expect(tableEditor._findTable(ops)).to.be.undefined;
      }
    });

    it('should return undefined if there is no table at the cursor position', () => {
      const textEditor = new TextEditor([
        'foo',
        '| ?   | ?   |', // not included in table for some reason
        '| A   | B   |',
        '| --- | --- |',
        '| C   | D   |',
        ' * | E   | F   |',
        '| ?   | ?   |', // not included in table for some reason
        'bar',
      ]);
      textEditor.acceptsTableEdit = (row) => row !== 1 && row !== 6;
      const tableEditor = new TableEditor(textEditor);
      {
        const ops = defaultOptions;
        textEditor.setCursorPosition(new Point(0, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(0, 3));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(1, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(1, 13));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(5, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(5, 16));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(6, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(6, 13));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(7, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(7, 3));
        expect(tableEditor._findTable(ops)).to.be.undefined;
      }
      {
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        textEditor.setCursorPosition(new Point(0, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(0, 3));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(1, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(1, 13));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(6, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(6, 13));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(7, 0));
        expect(tableEditor._findTable(ops)).to.be.undefined;
        textEditor.setCursorPosition(new Point(7, 3));
        expect(tableEditor._findTable(ops)).to.be.undefined;
      }
    });
  });

  /**
   * @test {TableEditor#_withTable}
   */
  describe('#_withTable(options, func)', () => {
    it('should call the function with table information obtained by _findTable() method', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A   | B   |',
        '| --- | --- |',
        '| C   | D   |',
        ' * | E   | F   |',
        'bar',
      ]);
      const tableEditor = new TableEditor(textEditor);
      textEditor.setCursorPosition(new Point(1, 2));
      {
        const ops = defaultOptions;
        tableEditor._withTable(ops, (info) => {
          expect(info).to.be.an('object');
          expect(info.range).to.be.an.instanceOf(Range);
          expect(info.range.start.row).to.equal(1);
          expect(info.range.start.column).to.equal(0);
          expect(info.range.end.row).to.equal(3);
          expect(info.range.end.column).to.equal(13);
          expect(info.lines).to.deep.equal([
            '| A   | B   |',
            '| --- | --- |',
            '| C   | D   |',
          ]);
          expect(info.table).to.be.an.instanceOf(Table);
          expect(info.table.toLines()).to.deep.equal([
            '| A   | B   |',
            '| --- | --- |',
            '| C   | D   |',
          ]);
          expect(info.focus).to.be.an.instanceOf(Focus);
          expect(info.focus.row).to.equal(0);
          expect(info.focus.column).to.equal(0);
          expect(info.focus.offset).to.equal(1);
        });
      }
      {
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        tableEditor._withTable(ops, (info) => {
          expect(info).to.be.an('object');
          expect(info.range).to.be.an.instanceOf(Range);
          expect(info.range.start.row).to.equal(1);
          expect(info.range.start.column).to.equal(0);
          expect(info.range.end.row).to.equal(4);
          expect(info.range.end.column).to.equal(16);
          expect(info.lines).to.deep.equal([
            '| A   | B   |',
            '| --- | --- |',
            '| C   | D   |',
            ' * | E   | F   |',
          ]);
          expect(info.table).to.be.an.instanceOf(Table);
          expect(info.table.toLines()).to.deep.equal([
            '| A   | B   |',
            '| --- | --- |',
            '| C   | D   |',
            ' * | E   | F   |',
          ]);
          expect(info.focus).to.be.an.instanceOf(Focus);
          expect(info.focus.row).to.equal(0);
          expect(info.focus.column).to.equal(0);
          expect(info.focus.offset).to.equal(1);
        });
      }
    });

    it('should not call the function if no table is found', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A   | B   |',
        '| --- | --- |',
        '| C   | D   |',
        '* | E   | F   |',
        'bar',
      ]);
      const tableEditor = new TableEditor(textEditor);
      {
        textEditor.setCursorPosition(new Point(0, 0));
        const ops = defaultOptions;
        let called = false;
        tableEditor._withTable(ops, (info) => {
          called = true;
        });
        expect(called).to.be.false;
      }
      {
        textEditor.setCursorPosition(new Point(4, 0));
        const ops = defaultOptions;
        let called = false;
        tableEditor._withTable(ops, (info) => {
          called = true;
        });
        expect(called).to.be.false;
      }
      {
        textEditor.setCursorPosition(new Point(5, 0));
        const ops = defaultOptions;
        let called = false;
        tableEditor._withTable(ops, (info) => {
          called = true;
        });
        expect(called).to.be.false;
      }
      {
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        textEditor.setCursorPosition(new Point(0, 0));
        let called = false;
        tableEditor._withTable(ops, (info) => {
          called = true;
        });
        expect(called).to.be.false;
      }
      {
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        textEditor.setCursorPosition(new Point(5, 0));
        let called = false;
        tableEditor._withTable(ops, (info) => {
          called = true;
        });
        expect(called).to.be.false;
      }
    });
  });

  /**
   * @test {TableEditor#_updateLines}
   */
  describe('#_updateLines(startRow, endRow, newLines, oldLines = undefined)', () => {
    it('should update lines in the specified range', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        const tableEditor = new TableEditor(textEditor);
        const newLines = ['| E   | F   |', '| --- | --- |', '| G   | H   |'];
        tableEditor._updateLines(1, 4, newLines);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        const tableEditor = new TableEditor(textEditor);
        const oldLines = ['| A   | B   |', '| --- | --- |', '| C   | D   |'];
        const newLines = ['| A   | B   |', '| --- | --- |', '| G   | H   |'];
        tableEditor._updateLines(1, 4, newLines, oldLines);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| G   | H   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        const tableEditor = new TableEditor(textEditor);
        const oldLines = ['| A   | B   |', '| --- | --- |', '| C   | D   |'];
        const newLines = ['| E   | F   |', '| --- | --- |', '| G   | H   |'];
        tableEditor._updateLines(1, 4, newLines, oldLines);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#_moveToFocus}
   */
  describe('#_moveToFocus(startRow, table, focus)', () => {
    it('should move the cursor position to the focused cell', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A   | B   |',
        '| --- | --- |',
        '| C   | D   |',
        'bar',
      ]);
      textEditor.setCursorPosition(new Point(1, 0));
      const tableEditor = new TableEditor(textEditor);
      const ops = defaultOptions;
      const info = tableEditor._findTable(ops);
      if (info === undefined) {
        assert.fail();
      }
      {
        const focus = new Focus(0, 1, 2);
        tableEditor._moveToFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(9);
      }
      {
        const focus = new Focus(2, 0, 1);
        tableEditor._moveToFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
      }
      {
        const focus = new Focus(0, -1, 0);
        tableEditor._moveToFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
      }
      {
        const focus = new Focus(0, 2, 0);
        tableEditor._moveToFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(13);
      }
    });

    it('should do nothing if the focused row is out of the table', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A   | B   |',
        '| --- | --- |',
        '| C   | D   |',
        'bar',
      ]);
      textEditor.setCursorPosition(new Point(1, 0));
      const tableEditor = new TableEditor(textEditor);
      const ops = defaultOptions;
      const info = tableEditor._findTable(ops);
      if (info === undefined) {
        assert.fail();
      }
      {
        const focus = new Focus(-1, 0, 0);
        tableEditor._moveToFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
      }
      {
        const focus = new Focus(3, 0, 0);
        tableEditor._moveToFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
      }
    });
  });

  /**
   * @test {TableEditor#_selectFocus}
   */
  describe('#_selectFocus(startRow, table, focus)', () => {
    it('should select the focued cell in the text editor if the cell is not empty', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A    | B   |',
        '| ---- | --- |',
        '| test |     |',
        'bar',
      ]);
      textEditor.setCursorPosition(new Point(1, 0));
      const tableEditor = new TableEditor(textEditor);
      const ops = defaultOptions;
      const info = tableEditor._findTable(ops);
      if (info === undefined) {
        assert.fail();
      }
      {
        const focus = new Focus(0, 0, 0);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
      }
      {
        const focus = new Focus(0, 0, 2);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
      }
      {
        const focus = new Focus(0, 1, 3);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(9);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(10);
      }
      {
        const focus = new Focus(2, 0, 0);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(6);
      }
    });

    it('should move the cursor position if the cell is empty', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A    | B   |',
        '| ---- | --- |',
        '| test |     |',
        'bar',
      ]);
      textEditor.setCursorPosition(new Point(1, 0));
      const tableEditor = new TableEditor(textEditor);
      const ops = defaultOptions;
      const info = tableEditor._findTable(ops);
      if (info === undefined) {
        assert.fail();
      }
      {
        const focus = new Focus(2, 1, 0);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
      }
      {
        const focus = new Focus(0, -1, 0);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
      }
      {
        const focus = new Focus(0, 2, 0);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(14);
        expect(textEditor.getSelectionRange()).to.be.undefined;
      }
    });

    it('should do nothing if the focused row is out of the table', () => {
      const textEditor = new TextEditor([
        'foo',
        '| A    | B   |',
        '| ---- | --- |',
        '| test |     |',
        'bar',
      ]);
      textEditor.setCursorPosition(new Point(1, 0));
      const tableEditor = new TableEditor(textEditor);
      const ops = defaultOptions;
      const info = tableEditor._findTable(ops);
      if (info === undefined) {
        assert.fail();
      }
      {
        const focus = new Focus(-1, 0, 0);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
      }
      {
        const focus = new Focus(3, 0, 0);
        tableEditor._selectFocus(info.range.start.row, info.table, focus);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
      }
    });
  });

  /**
   * @test {TableEditor#format}
   */
  describe('format(options)', () => {
    it('should format the table under the cursor', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({
          minDelimiterWidth: 5,
          defaultAlignment: DefaultAlignment.CENTER,
        });
        tableEditor.format(ops);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(4);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|   A   |   B   |',
          '| ----- | ----- |',
          '|   C   |   D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 1));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 5));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(3);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(3);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 7));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 11));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 8));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(2);
        expect(pos.column).to.equal(5);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.format(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   |     |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#escape}
   */
  describe('#escape(options)', () => {
    it('should format and escape from the table', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.escape(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.escape(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '',
        ]);
      }
      {
        const textEditor = new TextEditor([
          ' * foo',
          ' * | A | B |',
          ' *  | ----- | --- |',
          ' *   | C | D |',
          ' *   bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 5));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        tableEditor.escape(ops);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(5);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          ' * foo',
          ' * | A   | B   |',
          ' * | --- | --- |',
          ' * | C   | D   |',
          ' *   bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.escape(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor(['foo', '| A | B |', '  | C | D |']);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.escape(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '',
        ]);
      }
      {
        const textEditor = new TextEditor([
          ' * foo',
          ' * | A | B |',
          ' *   | C | D |',
          ' *   bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        tableEditor.escape(ops);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(5);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          ' * foo',
          ' * | A   | B   |',
          ' * | --- | --- |',
          ' * | C   | D   |',
          ' *   bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#alignColumn}
   */
  describe('#alignColumn(alignment, options)', () => {
    it('should alter alignment of a column', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.alignColumn(Alignment.RIGHT, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(4);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|   A | B   |',
          '| ---:| --- |',
          '|   C | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.alignColumn(Alignment.RIGHT, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(4);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|   A | B   |',
          '| ---:| --- |',
          '|   C | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.alignColumn(Alignment.RIGHT, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.alignColumn(Alignment.RIGHT, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#selectCell}
   */
  describe('#selectCell(options)', () => {
    it('should select the focused cell content', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.selectCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 7));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.selectCell(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   |     |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.selectCell(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.selectCell(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.selectCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.selectCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(2);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(2);
        expect(range.end.column).to.equal(5);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#moveFocus}
   */
  describe('#moveFocus(rowOffset, columnOffset, options)', () => {
    it('should move focus by the offsets', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, 0, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(-1, 0, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, -1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, 1, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, -1, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, 1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(-1, 0, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(4);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(4);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 5));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(-1, 0, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(-1, 0, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 11));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, -1, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(2);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(2);
        expect(range.end.column).to.equal(5);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, 1, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(2);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(2);
        expect(range.end.column).to.equal(11);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(-1, 0, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, -1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, 1, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(1, 0, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, -1, defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveFocus(0, 1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#nextCell}
   */
  describe('#nextCell(options)', () => {
    it('should move the focus to the next cell', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(14);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | ',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(20);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |     | ',
          '| --- | --- | --- |',
          '| C   | D   |     |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 11));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 16));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '|     |     |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
    });

    it('should treat smart cursor correctly', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 8));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
        textEditor.setCursorPosition(new Point(3, 2));
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'baz',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
        textEditor.setCursorPosition(new Point(5, 8));
        tableEditor.nextCell(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(5);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 11));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 16));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#previousCell}
   */
  describe('#previousCell(options)', () => {
    it('should move the focus to the previous cell', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 11));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 8));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 11));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 5));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.previousCell(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#nextRow}
   */
  describe('#nextRow(options)', () => {
    it('should move the focus to the next row', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 11));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(4);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(4);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 8));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(4);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(4);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(4);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(4);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '|     |     |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor(['foo', '| A | B |', 'bar']);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.nextRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '|     |     |',
          'bar',
        ]);
      }
    });

    it('should treat smart cursor correctly', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(3);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 8));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(3);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(3);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 8));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
        textEditor.setCursorPosition(new Point(1, 8));
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'baz',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
        textEditor.setCursorPosition(new Point(8, 2));
        tableEditor.nextRow(ops);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scActive' does not exist on type 'Table... Remove this comment to see the full error message
        expect(tableEditor._scActive).to.be.true;
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.row).to.equal(6);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scTablePos' does not exist on type 'Tab... Remove this comment to see the full error message
        expect(tableEditor._scTablePos.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.row).to.equal(2);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scStartFocus' does not exist on type 'T... Remove this comment to see the full error message
        expect(tableEditor._scStartFocus.offset).to.equal(1);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.row).to.equal(3);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.column).to.equal(0);
        // @ts-expect-error ts-migrate(2339) FIXME: Property '_scLastFocus' does not exist on type 'Ta... Remove this comment to see the full error message
        expect(tableEditor._scLastFocus.offset).to.equal(1);
      }

      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextRow(ops);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B | C |',
          ' | ----- | --- | --- |',
          '  | D | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({ smartCursor: true });
        tableEditor.nextCell(ops);
        tableEditor.nextRow(ops);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(8);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(9);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| D   | E   | F   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#insertRow}
   */
  describe('#insertRow(options)', () => {
    it('should insert an empty row at the focus', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '|     |     |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '|     |     |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '|     |     |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '|     |     |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 5));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '|     |     |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '|     |     |',
          '| C   | D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#deleteRow}
   */
  describe('#deleteRow(options)', () => {
    it('should delete a row at the focus', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     |     |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     |     |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     |     |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     |     |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(2);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 5));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteRow(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#moveRow}
   */
  describe('#moveRow(offset, options)', () => {
    it('should move the focused row by the specified offset', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(2);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(2);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 5));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 5));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          '   | E | F |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveRow(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#transpose}
   */
   describe('#transpose()', () => {
    it('should transpose X and Y of a table (including headers), formatted the same.', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3,1));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.transpose(defaultOptions);
        const pos = textEditor.getCursorPosition();
        // expect(pos.row).to.equal(3);
        // expect(pos.column).to.equal(2);
        // expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | 1   | 3   |',
          '| --- | --- | --- |',
          '| B   | 2   | 4   |',
          'bar',
        ]);
      }
    })

    it('should transpose a 2x2 table correctly', () => {
        const textEditor = new TextEditor([
          '| A | B |',
          '|---|---|',
          '| 1 | 2 |'
        ]);
        const tableEditor = new TableEditor(textEditor);
        tableEditor.transpose(defaultOptions);
        expect(textEditor.getLines()).to.deep.equal([
          '| A   | 1   |',
          '| --- | --- |',
          '| B   | 2   |'
        ]);
    });

    it('should handle a table with only headers', () => {
      const textEditor = new TextEditor([
        '| A | B | C |',
        '|---|---|---|'
      ]);
      const tableEditor = new TableEditor(textEditor);
      tableEditor.transpose(defaultOptions);
      expect(textEditor.getLines()).to.deep.equal([
        '| A   |',
        '| --- |',
        '| B   |',
        '| C   |'
      ]);
    });

    it('should transpose a table with empty cells', () => {
      const textEditor = new TextEditor([
        '| A | B | C |',
        '|---|---|---|',
        '| 1 |   | 3 |',
        '| 4 | 5 |   |'
      ]);
      const tableEditor = new TableEditor(textEditor);
      tableEditor.transpose(defaultOptions);
      expect(textEditor.getLines()).to.deep.equal([
        '| A   | 1   | 4   |',
        '| --- | --- | --- |',
        '| B   |     | 5   |',
        '| C   | 3   |     |'
      ]);
    });

    it('should handle a single column table', () => {
      const textEditor = new TextEditor([
        '| A |',
        '|---|',
        '| 1 |',
        '| 2 |',
        '| 3 |'
      ]);
      const tableEditor = new TableEditor(textEditor);
      tableEditor.transpose(defaultOptions);
      expect(textEditor.getLines()).to.deep.equal([
        '| A   | 1   | 2   | 3   |',
        '| --- | --- | --- | --- |'
      ]);
    });

    it('should handle a table with only one cell', () => {
      const textEditor = new TextEditor([
        '| A |',
        '|---|'
      ]);
      const tableEditor = new TableEditor(textEditor);
      tableEditor.transpose(defaultOptions);
      expect(textEditor.getLines()).to.deep.equal([
        '| A   |',
        '| --- |'
      ]);
    });
  });

  /**
   * @test {TableEditor#sortRows}
   */
  describe('#sortRows(sortOrder)', () => {
    it('should reorder rows as requested', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Ascending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Descending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Descending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| 1   | 6   |',
          '| C   | D   |',
          '| 5   | 3   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 10));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Ascending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 5   | 3   |',
          '| 1   | 6   |',
          '| C   | D   |',
          '| E   | F   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| 1   | 6   |',
          '| C   | D   |',
          '| 5   | 3   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 10));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Descending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | F   |',
          '| C   | D   |',
          '| 1   | 6   |',
          '| 5   | 3   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | 2   |',
          '| 1   | 6   |',
          '| C   | 8   |',
          '| 5   | 3   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 10));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Descending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | 8   |',
          '| 1   | 6   |',
          '| 5   | 3   |',
          '| E   | 2   |',
          'bar',
        ]);
      }
      {
        // If all cells are numbers, sort numberically not alphabetically
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | 2   |',
          '| E   | 12  |',
          '| 1   | 6   |',
          '| C   | 1   |',
          '| 5   | 3   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 10));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Descending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | 12  |',
          '| 1   | 6   |',
          '| 5   | 3   |',
          '| E   | 2   |',
          '| C   | 1   |',
          'bar',
        ]);
      }
      {
        // Empty cells should not count against sorting numberically
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | 2   |',
          '| E   | 12  |',
          '| 1   |     |',
          '| C   | 1   |',
          '| 5   | 3   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 10));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Descending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | 12  |',
          '| 5   | 3   |',
          '| E   | 2   |',
          '| C   | 1   |',
          '| 1   |     |',
          'bar',
        ]);
      }
      {
        // If all cells are numbers, sort numberically not alphabetically
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| E   | 2   |',
          '| E   | 12  |',
          '| 1   | A   |',
          '| C   | 1   |',
          '| 5   | 3   |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 10));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Descending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | A   |',
          '| 5   | 3   |',
          '| E   | 2   |',
          '| E   | 12  |',
          '| C   | 1   |',
          'bar',
        ]);
      }
      {
        // Ignore markdown formatting characters when sorting
        const textEditor = new TextEditor([
          'foo',
          '| A   | B       |',
          '| --- | ------- |',
          '| E   | Zod     |',
          '| E   | Bob     |',
          '| 1   | **Tod** |',
          '| C   | ~~Rob~~ |',
          '| 5   | Albert  |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 10));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Ascending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B       |',
          '| --- | ------- |',
          '| 5   | Albert  |',
          '| E   | Bob     |',
          '| C   | ~~Rob~~ |',
          '| 1   | **Tod** |',
          '| E   | Zod     |',
          'bar',
        ]);
      }
      {
        // Do not incorrectly parse dates as numbers
        const textEditor = new TextEditor([
          'foo',
          '| date       |     |',
          '| ---------- | --- |',
          '| 2021-07-17 |     |',
          '| 2021-09-15 |     |',
          '| 2021-09-10 |     |',
          '| 2021-07-17 |     |',
          '| 2021-09-16 |     |',
          '| 2021-09-15 |     |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(4, 10));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.sortRows(SortOrder.Ascending, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| date       |     |',
          '| ---------- | --- |',
          '| 2021-07-17 |     |',
          '| 2021-07-17 |     |',
          '| 2021-09-10 |     |',
          '| 2021-09-15 |     |',
          '| 2021-09-15 |     |',
          '| 2021-09-16 |     |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#insertColumn}
   */
  describe('#insertColumn(options)', () => {
    it('should insert an empty column at the focus', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     | A   | B   |',
          '| --- | --- | --- |',
          '|     | C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     | A   | B   |',
          '| --- | --- | --- |',
          '|     | C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   |     | B   |',
          '| --- | --- | --- |',
          '| C   |     | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(14);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |     |',
          '| --- | --- | --- |',
          '| C   | D   |     |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(14);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |     |',
          '| --- | --- | --- |',
          '| C   | D   |     |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     | A   | B   |',
          '| --- | --- | --- |',
          '|     | C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     | A   | B   |',
          '| --- | --- | --- |',
          '|     | C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.insertColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     | A   | B   |',
          '| --- | --- | --- |',
          '|     | C   | D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#deleteColumn}
   */
  describe('#deleteColumn(options)', () => {
    it('should delete a column at the current focus', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   |',
          '| --- |',
          '| D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   |',
          '| --- |',
          '| C   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   |',
          '| --- |',
          '| D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(1);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(1);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   |',
          '| --- |',
          '| D   |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   |',
          '| --- |',
          '| D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A |',
          ' | ----- |',
          '  | C |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '|     |',
          '| --- |',
          '|     |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.deleteColumn(defaultOptions);
        const range = textEditor.getSelectionRange();
        if (range === undefined) {
          assert.fail();
        }
        expect(range.start.row).to.equal(3);
        expect(range.start.column).to.equal(2);
        expect(range.end.row).to.equal(3);
        expect(range.end.column).to.equal(3);
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   |',
          '| --- |',
          '| D   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#moveColumn}
   */
  describe('#moveColumn(offset, options)', () => {
    it('should move the focused column by the specified offset', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   | A   |',
          '| --- | --- |',
          '| D   | C   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   | A   |',
          '| --- | --- |',
          '| D   | C   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   | A   |',
          '| --- | --- |',
          '| D   | C   |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 6));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(1, 9));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(13);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(2);
        expect(pos.column).to.equal(3);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(2);
        expect(pos.column).to.equal(9);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   | A   |',
          '| --- | --- |',
          '| D   | C   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(-1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          ' | ----- | --- |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(3, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   | A   |',
          '| --- | --- |',
          '| D   | C   |',
          'bar',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.moveColumn(1, defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(8);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| B   | A   |',
          '| --- | --- |',
          '| D   | C   |',
          'bar',
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#exportTable}
   */
  describe('#exportTable(withHeader, defaultOptions)', () => {
    it('should export out the grid as two dimensional array with headers', () => {
      {
        const textEditor = new TextEditor([
          '| A   | B   |',
          '| C   | D   |',
          '| E   | F   |',
        ]);
        const tableEditor = new TableEditor(textEditor);
        const result = tableEditor.exportTable(true, defaultOptions);
        expect(result).to.be.eql([
          ['A', 'B'],
          ['---', '---'],
          ['C', 'D'],
          ['E', 'F'],
        ]);
      }
    });

    it('should export out the grid as two dimensional array without headers', () => {
      {
        const textEditor = new TextEditor([
          '| A   | B   |',
          '| C   | D   |',
          '| E   | F   |',
        ]);
        const tableEditor = new TableEditor(textEditor);
        const result = tableEditor.exportTable(false, defaultOptions);
        expect(result).to.be.eql([
          ['C', 'D'],
          ['E', 'F'],
        ]);
      }
    });
  });

  /**
   * @test {TableEditor#exportCSV}
   */
  describe('#exportCSV(withHeader, defaultOptions)', () => {
    it('should export out the grid as two dimensional array with headers', () => {
      {
        const textEditor = new TextEditor([
          '| A   | B   |',
          '| C   | D   |',
          '| E   | F   |',
        ]);
        const tableEditor = new TableEditor(textEditor);
        const result = tableEditor.exportCSV(true, defaultOptions);
        expect(result).to.be.eql('A\tB\n---\t---\nC\tD\nE\tF');
      }
    });

    it('should export out the grid as two dimensional array without headers', () => {
      {
        const textEditor = new TextEditor([
          '| A   | B   |',
          '| C   | D   |',
          '| E   | F   |',
        ]);
        const tableEditor = new TableEditor(textEditor);
        const result = tableEditor.exportCSV(false, defaultOptions);
        expect(result).to.be.eql('C\tD\nE\tF');
      }
    });
  });

  /**
   * @test {TableEditor#formatAll}
   */
  describe('#formatAll(options)', () => {
    it('should format all the tables in the text editor', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
          '| E | F |',
          ' | ----- | --- |',
          '  | G | H |',
          'baz',
        ]);
        textEditor.setCursorPosition(new Point(0, 0));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.formatAll(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(0);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
          'baz',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
          '| E | F |',
          ' | ----- | --- |',
          '  | G | H |',
          'baz',
        ]);
        textEditor.setCursorPosition(new Point(2, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.formatAll(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(3);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
          'baz',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
          '| E | F |',
          ' | ----- | --- |',
          '  | G | H |',
          'baz',
        ]);
        textEditor.setCursorPosition(new Point(3, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.formatAll(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(4);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
          'baz',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
          '| E | F |',
          ' | ----- | --- |',
          '  | G | H |',
          'baz',
        ]);
        textEditor.setCursorPosition(new Point(6, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.formatAll(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(7);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
          'baz',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
          '| E | F |',
          ' | ----- | --- |',
          '  | G | H |',
          'baz',
        ]);
        textEditor.setCursorPosition(new Point(7, 3));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.formatAll(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(8);
        expect(pos.column).to.equal(3);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
          'baz',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
          '| E | F |',
          '  | G | H |',
        ]);
        textEditor.setCursorPosition(new Point(4, 2));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.formatAll(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(5);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          'bar',
          '| E | F |',
          '  | G | H |',
        ]);
        textEditor.setCursorPosition(new Point(5, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.formatAll(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(7);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          'bar',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B |',
          '  | C | D |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
          '| E | F |',
          '  | G | H |',
          '<!-- TBLFM: @2..@3=@4 -->',
        ]);
        textEditor.setCursorPosition(new Point(5, 4));
        const tableEditor = new TableEditor(textEditor);
        tableEditor.formatAll(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(6);
        expect(pos.column).to.equal(3);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '<!-- TBLFM: @2=@3 -->',
          'bar',
          '| E   | F   |',
          '| --- | --- |',
          '| G   | H   |',
          '<!-- TBLFM: @2..@3=@4 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| ? | ? |', // not included in table for some reason
          '| A | B |',
          '  | C | D |',
          '| ? | ? |', // not included in table for some reason
          'bar',
          ' * | E | F |',
          ' *  | ----- | --- |',
          ' *   | G | H |',
          'baz',
        ]);
        textEditor.acceptsTableEdit = (row) => row !== 1 && row !== 4;
        textEditor.setCursorPosition(new Point(1, 2));
        const tableEditor = new TableEditor(textEditor);
        const ops = optionsWithDefaults({
          leftMarginChars: new Set('*'),
        });
        tableEditor.formatAll(ops);
        const pos = textEditor.getCursorPosition();
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(2);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| ? | ? |',
          '| A   | B   |',
          '| --- | --- |',
          '| C   | D   |',
          '| ? | ? |',
          'bar',
          ' * | E   | F   |',
          ' * | --- | --- |',
          ' * | G   | H   |',
          'baz',
        ]);
      }
    });
  });
});
