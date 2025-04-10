import { defaultOptions } from '../src/options';
import { Point } from '../src/point';
import {
  _computeNewOffset,
  _createIsTableRowRegex,
  TableEditor,
  _createIsTableFormulaRegex,
} from '../src/table-editor';
import { TextEditor } from './text-editor-mock';
import { assert, expect } from 'chai';

/**
 * @test Formulas
 */
describe('Formulas', () => {
  /**
   * @test {TableEditor#evaluateFormulas}
   */
  describe('#evaluateFormulas(options)', () => {
    it('should understand absolute cell replacements', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=@3 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     | 4   |',
          '<!-- TBLFM: @>$>=@3 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>=@3 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 3   | 4   |',
          '<!-- TBLFM: @>=@3 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>=@-1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 5   | 6   |',
          '<!-- TBLFM: @>=@-1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @2=@+2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 5   | 6   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @2=@+2 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @3=@-1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 1   | 2   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @3=@-1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $>=$-2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 1   |',
          '| 3   | 4   | 3   |',
          '| 5   | 6   | 5   |',
          '|     |     | 0   |',
          '<!-- TBLFM: $>=$-2 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $2=$1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 1   |     |',
          '| 3   | 3   |     |',
          '| 5   | 5   |     |',
          '|     | 0   |     |',
          '<!-- TBLFM: $2=$1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $>-1=$1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 1   |     |',
          '| 3   | 3   |     |',
          '| 5   | 5   |     |',
          '|     | 0   |     |',
          '<!-- TBLFM: $>-1=$1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $3=$>-1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 2   |',
          '| 3   | 4   | 4   |',
          '| 5   | 6   | 6   |',
          '|     |     | 0   |',
          '<!-- TBLFM: $3=$>-1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $3=$>+1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 0   |',
          '| 3   | 4   | 0   |',
          '| 5   | 6   | 0   |',
          '|     |     | 0   |',
          '<!-- TBLFM: $3=$>+1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @>$2=@2$1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     | 1   |     |',
          '<!-- TBLFM: @>$2=@2$1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @>$3=@-1$< -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     | 5   |',
          '<!-- TBLFM: @>$3=@-1$< -->',
        ]);
      }
    });

    it('should understand 0 as the current row or cell', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=@0$1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 1   |',
          '| 3   | 4   | 3   |',
          '| 5   | 6   | 5   |',
          '<!-- TBLFM: $3=@0$1 -->',
        ]);
      }
    });

    it('should perform simple arithmetic with constants', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=(@0$1+2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 3   |',
          '| 3   | 4   | 5   |',
          '| 5   | 6   | 7   |',
          '<!-- TBLFM: $3=(@0$1+2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=(@0$1-2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | -1  |',
          '| 3   | 4   | 1   |',
          '| 5   | 6   | 3   |',
          '<!-- TBLFM: $3=(@0$1-2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=(@0$1*2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 2   |',
          '| 3   | 4   | 6   |',
          '| 5   | 6   | 10  |',
          '<!-- TBLFM: $3=(@0$1*2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=(@0$>-2*3) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 3   |',
          '| 3   | 4   | 9   |',
          '| 5   | 6   | 15  |',
          '<!-- TBLFM: $3=(@0$>-2*3) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=($2*4.5) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 9   |',
          '| 3   | 4   | 18  |',
          '| 5   | 6   | 27  |',
          '<!-- TBLFM: $3=($2*4.5) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=(@0$2/2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 1   |',
          '| 3   | 4   | 2   |',
          '| 5   | 6   | 3   |',
          '<!-- TBLFM: $3=(@0$2/2) -->',
        ]);
      }
    });

    it('should perform simple arithmetic with dates', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A                  | B         | C   |',
          '| ------------------ | --------- | --- |',
          '| 2023-07-12 05:15   | 300000    |     |',
          '| 2022-05-15 15:55   | 600000    |     |',
          '| 2021-10-31 23:00   | 1200000   |     |',
          '<!-- TBLFM: $3=(@0$1+@0$2);dt -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A                | B       | C                |',
          '| ---------------- | ------- | ---------------- |',
          '| 2023-07-12 05:15 | 300000  | 2023-07-12 05:20 |',
          '| 2022-05-15 15:55 | 600000  | 2022-05-15 16:05 |',
          '| 2021-10-31 23:00 | 1200000 | 2021-10-31 23:20 |',
          '<!-- TBLFM: $3=(@0$1+@0$2);dt -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A                 | B                | C   |',
          '| ----------------- | ---------------- | --- |',
          '| 2023-07-12 05:20  | 2023-07-12 05:15 |     |',
          '| 2022-05-15 16:05  | 2022-05-15 15:55 |     |',
          '| 2021-10-31 23:20  | 2021-10-31 23:00 |     |',
          '<!-- TBLFM: $3=(@0$1-@0$2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A                | B                | C       |',
          '| ---------------- | ---------------- | ------- |',
          '| 2023-07-12 05:20 | 2023-07-12 05:15 | 300000  |',
          '| 2022-05-15 16:05 | 2022-05-15 15:55 | 600000  |',
          '| 2021-10-31 23:20 | 2021-10-31 23:00 | 1200000 |',
          '<!-- TBLFM: $3=(@0$1-@0$2) -->',
        ]);
      }
    });

    it('should convert hours and minutes to milliseconds', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A      | B    |',
          '| ------ | ---- |',
          '| 05:20  |      |',
          '| 16:05  |      |',
          '| 23:20  |      |',
          '| 00:01  |      |',
          '| 29:59  |      |',
          '<!-- TBLFM: $2=($1+0) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A     | B         |',
          '| ----- | --------- |',
          '| 05:20 | 19200000  |',
          '| 16:05 | 57900000  |',
          '| 23:20 | 84000000  |',
          '| 00:01 | 60000     |',
          '| 29:59 | 107940000 |',
          '<!-- TBLFM: $2=($1+0) -->',
        ]);
      }
    });

    it('should perform simple arithmetic with hours and minutes', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A       | B         | C   |',
          '| ------- | --------- | --- |',
          '| 05:15   | 300000    |     |',
          '| 15:55   | 600000    |     |',
          '| 23:00   | 1200000   |     |',
          '| 05:15   | 00:05     |     |',
          '| 15:55   | 00:10     |     |',
          '| 15:55   | 0:10      |     |',
          '| 23:00   | 00:20     |     |',
          '| 23:00   | -00:20    |     |',
          '<!-- TBLFM: $3=(@0$1+@0$2);hm -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A     | B       | C     |',
          '| ----- | ------- | ----- |',
          '| 05:15 | 300000  | 05:20 |',
          '| 15:55 | 600000  | 16:05 |',
          '| 23:00 | 1200000 | 23:20 |',
          '| 05:15 | 00:05   | 05:20 |',
          '| 15:55 | 00:10   | 16:05 |',
          '| 15:55 | 0:10    | 16:05 |',
          '| 23:00 | 00:20   | 23:20 |',
          '| 23:00 | -00:20  | 22:40 |',
          '<!-- TBLFM: $3=(@0$1+@0$2);hm -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A      | B     | C   |',
          '| ------ | ----- | --- |',
          '| 05:20  | 05:15 |     |',
          '| 16:05  | 15:55 |     |',
          '| 23:20  | 23:00 |     |',
          '| 10:20  | 20:00 |     |',
          '<!-- TBLFM: $3=(@0$1-@0$2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A     | B     | C         |',
          '| ----- | ----- | --------- |',
          '| 05:20 | 05:15 | 300000    |',
          '| 16:05 | 15:55 | 600000    |',
          '| 23:20 | 23:00 | 1200000   |',
          '| 10:20 | 20:00 | -34800000 |',
          '<!-- TBLFM: $3=(@0$1-@0$2) -->',
        ]);
      }
    });

    it('should not have floating point arithmetic errors', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   |',
          '| --- |',
          '| 0.1 |',
          '| 0.2 |',
          '|     |',
          '<!-- TBLFM: @>$1=sum(@I..@-1) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   |',
          '| --- |',
          '| 0.1 |',
          '| 0.2 |',
          '| 0.3 |',
          '<!-- TBLFM: @>$1=sum(@I..@-1) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   |',
          '| --- |',
          '| 0.1 |',
          '| 0.2 |',
          '|     |',
          '<!-- TBLFM: @>$1=(@2$1+@3$1) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   |',
          '| --- |',
          '| 0.1 |',
          '| 0.2 |',
          '| 0.3 |',
          '<!-- TBLFM: @>$1=(@2$1+@3$1) -->',
        ]);
      }
    });

    it('should perform simple arithmetic with other cells', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=($1+$2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 3   |',
          '| 3   | 4   | 7   |',
          '| 5   | 6   | 11  |',
          '<!-- TBLFM: $3=($1+$2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=($2-$1) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 1   |',
          '| 3   | 4   | 1   |',
          '| 5   | 6   | 1   |',
          '<!-- TBLFM: $3=($2-$1) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '| 5   | 6   |     |',
          '<!-- TBLFM: $3=($2*$1) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 2   |',
          '| 3   | 4   | 12  |',
          '| 5   | 6   | 30  |',
          '<!-- TBLFM: $3=($2*$1) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@-1+@2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 6   | 8   |',
          '<!-- TBLFM: @5=(@-1+@2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@I+@3..@4) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A      | B      |',
          '| ------ | ------ |',
          '| 1      | 2      |',
          '| 3      | 4      |',
          '| 5      | 6      |',
          '| [4, 6] | [6, 8] |',
          '<!-- TBLFM: @5=(@I+@3..@4) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@3..@4+@I) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A      | B      |',
          '| ------ | ------ |',
          '| 1      | 2      |',
          '| 3      | 4      |',
          '| 5      | 6      |',
          '| [4, 6] | [6, 8] |',
          '<!-- TBLFM: @5=(@3..@4+@I) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@3..@4 / @I) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A      | B      |',
          '| ------ | ------ |',
          '| 1      | 2      |',
          '| 3      | 4      |',
          '| 5      | 6      |',
          '| [3, 5] | [2, 3] |',
          '<!-- TBLFM: @5=(@3..@4 / @I) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@I / @3..@4) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Right operand in algebraic "divide" must be a single cell.`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@I / @3..@4) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 9   | 9   |',
          '| 3   | 4   |',
          '| 5   | 2   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@I-@3..@4) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A      | B      |',
          '| ------ | ------ |',
          '| 9      | 9      |',
          '| 3      | 4      |',
          '| 5      | 2      |',
          '| [6, 4] | [5, 7] |',
          '<!-- TBLFM: @5=(@I-@3..@4) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@3..@4-@I) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A      | B      |',
          '| ------ | ------ |',
          '| 1      | 2      |',
          '| 3      | 4      |',
          '| 5      | 6      |',
          '| [2, 4] | [2, 4] |',
          '<!-- TBLFM: @5=(@3..@4-@I) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@3..@4+@I..@3) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `At least one operand in algebraic "add" must be a single cell.`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @5=(@3..@4+@I..@3) -->',
        ]);
      }
    });

    it('should understand relative row and column symbols', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=@I -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     | 2   |',
          '<!-- TBLFM: @>$>=@I -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=@< -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     | B   |',
          '<!-- TBLFM: @>$>=@< -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=@I$< -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     | 1   |',
          '<!-- TBLFM: @>$>=@I$< -->',
        ]);
      }
    });

    it('should be able to set values in ranges', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @>$2..@>$3=@3 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '|     | 4   | 0   |',
          '<!-- TBLFM: @>$2..@>$3=@3 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @>$2..@>$3=(@3+@I$<) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '|     | 5   | 1   |',
          '<!-- TBLFM: @>$2..@>$3=(@3+@I$<) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @3$2..@>$3=@I -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 2   | 0   |',
          '|     | 2   | 0   |',
          '<!-- TBLFM: @3$2..@>$3=@I -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 4   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @3$2..@>$3=$1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 3   | 3   | 3   |',
          '|     | 0   | 0   |',
          '<!-- TBLFM: @3$2..@>$3=$1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>-1=@3 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 3   | 4   |',
          '|     |     |',
          '<!-- TBLFM: @>-1=@3 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>-2=@3 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>-2=@3 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @<+2=@5 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 0   | 0   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @<+2=@5 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>-1=@2$1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 1   |     |',
          '<!-- TBLFM: @>$>-1=@2$1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>=@>-1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 5   | 6   |',
          '<!-- TBLFM: @>=@>-1 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>-1$<+1=@<+1$>-1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 1   |',
          '|     |     |',
          '<!-- TBLFM: @>-1$<+1=@<+1$>-1 -->',
        ]);
      }
    });

    it('should handle conditional functions', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @4$3=if($1>$2, @3$1, @3$2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   | 3   |',
          '|     |     |     |',
          '<!-- TBLFM: @4$3=if($1>$2, @3$1, @3$2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $3=if($1>$2, $1, $2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 2   |',
          '| 4   | 3   | 4   |',
          '| 5   | 6   | 6   |',
          '|     |     | 0   |',
          '<!-- TBLFM: $3=if($1>$2, $1, $2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=if($1>$2, $1, $2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 2   |',
          '| 4   | 3   | 4   |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=if($1>$2, $1, $2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=if($1>$1..$2, $1, $2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Formula '<!-- TBLFM: @2$3..@3$3=if($1>$1..$2, $1, $2) -->' could not be parsed`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=if($1>$1..$2, $1, $2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=if($1..$2>$2, $1, $2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Formula '<!-- TBLFM: @2$3..@3$3=if($1..$2>$2, $1, $2) -->' could not be parsed`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=if($1..$2>$2, $1, $2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@4$3=if($1==$2, 1, 0) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 0   |',
          '| 4   | 4   | 1   |',
          '| 5   | 6   | 0   |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@4$3=if($1==$2, 1, 0) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 4   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@4$3=if($1>2, 1, 0) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 0   |',
          '| 4   | 4   | 1   |',
          '| 5   | 6   | 1   |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@4$3=if($1>2, 1, 0) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $3=if($1>$2, $1, 9) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 9   |',
          '| 4   | 3   | 4   |',
          '| 5   | 6   | 9   |',
          '|     |     | 9   |',
          '<!-- TBLFM: $3=if($1>$2, $1, 9) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $3=if($1>4, $1, 9) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 9   |',
          '| 4   | 3   | 9   |',
          '| 5   | 6   | 5   |',
          '|     |     | 9   |',
          '<!-- TBLFM: $3=if($1>4, $1, 9) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $3=if(4<$2, $1, 7) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 7   |',
          '| 4   | 3   | 7   |',
          '| 5   | 6   | 5   |',
          '|     |     | 7   |',
          '<!-- TBLFM: $3=if(4<$2, $1, 7) -->',
        ]);
      }
    });

    it('should handle assigning a range to a single cell', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=$1..$2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C      |',
          '| --- | --- | ------ |',
          '| 1   | 2   | [1, 2] |',
          '| 4   | 3   | [4, 3] |',
          '| 5   | 6   |        |',
          '|     |     |        |',
          '<!-- TBLFM: @2$3..@3$3=$1..$2 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $3=$1..$2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C      |',
          '| --- | --- | ------ |',
          '| 1   | 2   | [1, 2] |',
          '| 4   | 3   | [4, 3] |',
          '| 5   | 6   | [5, 6] |',
          '|     |     | []     |',
          '<!-- TBLFM: $3=$1..$2 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @I$3..@3$3=@3$1..@4$2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C            |',
          '| --- | --- | ------------ |',
          '| 1   | 2   | [4, 3, 5, 6] |',
          '| 4   | 3   | [4, 3, 5, 6] |',
          '| 5   | 6   |              |',
          '|     |     |              |',
          '<!-- TBLFM: @I$3..@3$3=@3$1..@4$2 -->',
        ]);
      }
    });

    it('should handle single parameter function calls', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 4   | 3   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=sum(@2..@-1) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 4   | 3   |',
          '| 5   | 6   |',
          '|     | 11  |',
          '<!-- TBLFM: @>$>=sum(@2..@-1) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 4   | 3   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>=sum(@2..@-1) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 4   | 3   |',
          '| 5   | 6   |',
          '| 10  | 11  |',
          '<!-- TBLFM: @>=sum(@2..@-1) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 4   | 3   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>=sum(@2$1..@-1$2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 4   | 3   |',
          '| 5   | 6   |',
          '| 21  | 21  |',
          '<!-- TBLFM: @>=sum(@2$1..@-1$2) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=sum($1..$2) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 3   |',
          '| 4   | 3   | 7   |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @2$3..@3$3=sum($1..$2) -->',
        ]);
      }
    });

    it('should handle nested operations', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 7   |',
          '| 5   | 4   | 3   |',
          '| 4   | 5   | 6   |',
          '|     |     |     |',
          '<!-- TBLFM: @5=if(@I>@-1, (@I + 1), (@-1 - 1)) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 7   |',
          '| 5   | 4   | 3   |',
          '| 4   | 5   | 6   |',
          '| 3   | 4   | 8   |',
          '<!-- TBLFM: @5=if(@I>@-1, (@I + 1), (@-1 - 1)) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 7   |',
          '| 5   | 4   | 3   |',
          '| 4   | 5   | 6   |',
          '|     |     |     |',
          '<!-- TBLFM: @5=(if(@I>@-1, @I, @-1) + 4) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   | 7   |',
          '| 5   | 4   | 3   |',
          '| 4   | 5   | 6   |',
          '| 8   | 9   | 11  |',
          '<!-- TBLFM: @5=(if(@I>@-1, @I, @-1) + 4) -->',
        ]);
      }
    });

    it('should handle single parameter function calls', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @-1=@2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Formula '<!-- TBLFM: @-1=@2 -->' could not be parsed`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @-1=@2 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @<-1=@2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Index 0 may not be used in a destination`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @<-1=@2 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @+1=@2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Formula '<!-- TBLFM: @+1=@2 -->' could not be parsed`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: @+1=@2 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $-1=$2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Formula '<!-- TBLFM: $-1=$2 -->' could not be parsed`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $-1=$2 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $+1=$2 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Formula '<!-- TBLFM: $+1=$2 -->' could not be parsed`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   |',
          '| --- | --- | --- |',
          '| 1   | 2   |     |',
          '| 4   | 3   |     |',
          '| 5   | 6   |     |',
          '|     |     |     |',
          '<!-- TBLFM: $+1=$2 -->',
        ]);
      }
    });

    it('should follow provided formatting descriptors', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B | C | D |',
          '| - | - | - | - |',
          '| 1 | 2 | 5 | 6 |',
          '| 3 | 4 | 7 | 8 |',
          '|   |   |   |   |',
          '<!-- TBLFM: @>=(@I / @3$3) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A                      | B                      | C                      | D                      |',
          '| ---------------------- | ---------------------- | ---------------------- | ---------------------- |',
          '| 1                      | 2                      | 5                      | 6                      |',
          '| 3                      | 4                      | 7                      | 8                      |',
          '| 0.14285714285714285714 | 0.28571428571428571429 | 0.71428571428571428571 | 0.85714285714285714286 |',
          '<!-- TBLFM: @>=(@I / @3$3) -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B | C | D |',
          '| - | - | - | - |',
          '| 1 | 2 | 5 | 6 |',
          '| 3 | 4 | 7 | 8 |',
          '|   |   |   |   |',
          '<!-- TBLFM: @>=(@I / @3$3);%.2f -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A    | B    | C    | D    |',
          '| ---- | ---- | ---- | ---- |',
          '| 1    | 2    | 5    | 6    |',
          '| 3    | 4    | 7    | 8    |',
          '| 0.14 | 0.29 | 0.71 | 0.86 |',
          '<!-- TBLFM: @>=(@I / @3$3);%.2f -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B | C | D |',
          '| - | - | - | - |',
          '| 1 | 2 | 5 | 6 |',
          '| 3 | 4 | 7 | 8 |',
          '|   |   |   |   |',
          '<!-- TBLFM: @>=(@I / @3$3);%.3f -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A     | B     | C     | D     |',
          '| ----- | ----- | ----- | ----- |',
          '| 1     | 2     | 5     | 6     |',
          '| 3     | 4     | 7     | 8     |',
          '| 0.143 | 0.286 | 0.714 | 0.857 |',
          '<!-- TBLFM: @>=(@I / @3$3);%.3f -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B | C | D |',
          '| - | - | - | - |',
          '| 1 | 2 | 5 | 6 |',
          '| 3 | 4 | 7 | 8 |',
          '|   |   |   |   |',
          '<!-- TBLFM: @>=(@I / @3$3);%.0f -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   | C   | D   |',
          '| --- | --- | --- | --- |',
          '| 1   | 2   | 5   | 6   |',
          '| 3   | 4   | 7   | 8   |',
          '| 0   | 0   | 1   | 1   |',
          '<!-- TBLFM: @>=(@I / @3$3);%.0f -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A                | B      | C |',
          '| ---------------- | ------ | - |',
          '| 2023-07-12 10:00 | 600000 |   |',
          '<!-- TBLFM: $>=($1 + $2);dt -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A                | B      | C                |',
          '| ---------------- | ------ | ---------------- |',
          '| 2023-07-12 10:00 | 600000 | 2023-07-12 10:10 |',
          '<!-- TBLFM: $>=($1 + $2);dt -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| Start            | End              | Ms     | Min |',
          '| ---------------- | ---------------- | ------ | --- |',
          '| 2023-07-12 10:00 | 2023-07-12 10:10 | | |',
          '<!-- TBLFM: $3=($2 - $1) -->',
          '<!-- TBLFM: $4=($3 / 60000) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| Start            | End              | Ms     | Min |',
          '| ---------------- | ---------------- | ------ | --- |',
          '| 2023-07-12 10:00 | 2023-07-12 10:10 | 600000 | 10  |',
          '<!-- TBLFM: $3=($2 - $1) -->',
          '<!-- TBLFM: $4=($3 / 60000) -->',
        ]);
      }
    });

    it('should return an error if the formula is invalid', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A | B | C | D |',
          '| - | - | - | - |',
          '| 1 | 2 | 5 | 6 |',
          '| 3 | 4 | 7 | 8 |',
          '| 5 | 6 | 9 | 0 |',
          '<!-- TBLFM: @>$>..@>-1$>-1=@I+2$<..@I+1$I+1 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        if (!err) {
          assert.fail();
        }
        expect(err.message).to.equal(
          `Formula '<!-- TBLFM: @>$>..@>-1$>-1=@I+2$<..@I+1$I+1 -->' could not be parsed`,
        );
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A | B | C | D |',
          '| - | - | - | - |',
          '| 1 | 2 | 5 | 6 |',
          '| 3 | 4 | 7 | 8 |',
          '| 5 | 6 | 9 | 0 |',
          '<!-- TBLFM: @>$>..@>-1$>-1=@I+2$<..@I+1$I+1 -->',
        ]);
      }
    });

    it('should parse multiple formulas on the same line', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=@3::@>$1=@4::@2$1=5 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 5   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 5   | 4   |',
          '<!-- TBLFM: @>$>=@3::@>$1=@4::@2$1=5 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=@3::@>$1=@4 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 5   | 4   |',
          '<!-- TBLFM: @>$>=@3::@>$1=@4 -->',
        ]);
      }
    });

    it('should apply multiple formula lines sequentially', () => {
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=@3 -->',
          '<!-- TBLFM: @>$1=@4 -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 5   | 4   |',
          '<!-- TBLFM: @>$>=@3 -->',
          '<!-- TBLFM: @>$1=@4 -->',
        ]);
      }
      {
        const textEditor = new TextEditor([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '|     |     |',
          '<!-- TBLFM: @>$>=@3 -->',
          '<!-- TBLFM: @>$1=(@>$2+3) -->',
        ]);
        textEditor.setCursorPosition(new Point(1, 0));
        const tableEditor = new TableEditor(textEditor);
        const err = tableEditor.evaluateFormulas(defaultOptions);
        const pos = textEditor.getCursorPosition();
        expect(err).to.be.undefined;
        expect(pos.row).to.equal(1);
        expect(pos.column).to.equal(0);
        expect(textEditor.getSelectionRange()).to.be.undefined;
        expect(textEditor.getLines()).to.deep.equal([
          'foo',
          '| A   | B   |',
          '| --- | --- |',
          '| 1   | 2   |',
          '| 3   | 4   |',
          '| 5   | 6   |',
          '| 7   | 4   |',
          '<!-- TBLFM: @>$>=@3 -->',
          '<!-- TBLFM: @>$1=(@>$2+3) -->',
        ]);
      }
    });
  });

  it('should correctly handle time examples in the documentation', () => {
    {
      const textEditor = new TextEditor([
        'foo',
        '| Start            | Duration | End |',
        '| ---------------- | -------- | --- |',
        '| 2023-07-12 10:00 | 0:10     |     |',
        '<!-- TBLFM: $>=($1 + $2);dt -->',
      ]);
      textEditor.setCursorPosition(new Point(1, 0));
      const tableEditor = new TableEditor(textEditor);
      const err = tableEditor.evaluateFormulas(defaultOptions);
      const pos = textEditor.getCursorPosition();
      expect(err).to.be.undefined;
      expect(pos.row).to.equal(1);
      expect(pos.column).to.equal(0);
      expect(textEditor.getSelectionRange()).to.be.undefined;
      expect(textEditor.getLines()).to.deep.equal([
        'foo',
        '| Start            | Duration | End              |',
        '| ---------------- | -------- | ---------------- |',
        '| 2023-07-12 10:00 | 0:10     | 2023-07-12 10:10 |',
        '<!-- TBLFM: $>=($1 + $2);dt -->',
      ]);
    }
    {
      const textEditor = new TextEditor([
        'foo',
        '| Start            | End              | Ms | Mins | Duration |',
        '| ---------------- | ---------------- | -- | ---- | -------- |',
        '| 2023-07-12 10:00 | 2023-07-12 12:10 |    |      |          |',
        '<!-- TBLFM: $3=($2 - $1) -->',
        '<!-- TBLFM: $4=(($2 - $1) / 60000) -->',
        '<!-- TBLFM: $5=($2 - $1);hm -->',
      ]);
      textEditor.setCursorPosition(new Point(1, 0));
      const tableEditor = new TableEditor(textEditor);
      const err = tableEditor.evaluateFormulas(defaultOptions);
      const pos = textEditor.getCursorPosition();
      expect(err).to.be.undefined;
      expect(pos.row).to.equal(1);
      expect(pos.column).to.equal(0);
      expect(textEditor.getSelectionRange()).to.be.undefined;
      expect(textEditor.getLines()).to.deep.equal([
        'foo',
        '| Start            | End              | Ms      | Mins | Duration |',
        '| ---------------- | ---------------- | ------- | ---- | -------- |',
        '| 2023-07-12 10:00 | 2023-07-12 12:10 | 7800000 | 130  | 02:10    |',
        '<!-- TBLFM: $3=($2 - $1) -->',
        '<!-- TBLFM: $4=(($2 - $1) / 60000) -->',
        '<!-- TBLFM: $5=($2 - $1);hm -->',
      ]);
    }
  });

  it('should correctly process a larger example', () => {
    {
      const textEditor = new TextEditor([
        'foo',
        '| Task             | Start |   End | Duration |',
        '| ---------------- | ----- | -----:| --------:|',
        '| Plan day         | 09:00 | 09:15 |          |',
        '| Fix Bug#1        | 09:27 | 11:33 |          |',
        '| Fix Bug#2        |       | 12:22 |          |',
        '| Triage bugs      | 13:00 | 17:00 |          |',
        '| Clean desk       |       | 17:30 |          |',
        '| **Total**        |       |       |          |',
        '<!-- TBLFM: $>=($3 - if($2>0, $2, @-1$3));hm -->',
        '<!-- TBLFM: @>$>=sum(@I..@-1);hm -->',
      ]);
      textEditor.setCursorPosition(new Point(1, 0));
      const tableEditor = new TableEditor(textEditor);
      const err = tableEditor.evaluateFormulas(defaultOptions);
      const pos = textEditor.getCursorPosition();
      expect(err).to.be.undefined;
      expect(pos.row).to.equal(1);
      expect(pos.column).to.equal(0);
      expect(textEditor.getSelectionRange()).to.be.undefined;
      expect(textEditor.getLines()).to.deep.equal([
        'foo',
        '| Task        | Start |   End | Duration |',
        '| ----------- | ----- | -----:| --------:|',
        '| Plan day    | 09:00 | 09:15 |    00:15 |',
        '| Fix Bug#1   | 09:27 | 11:33 |    02:06 |',
        '| Fix Bug#2   |       | 12:22 |    00:49 |',
        '| Triage bugs | 13:00 | 17:00 |    04:00 |',
        '| Clean desk  |       | 17:30 |    00:30 |',
        '| **Total**   |       |       |    07:40 |',
        '<!-- TBLFM: $>=($3 - if($2>0, $2, @-1$3));hm -->',
        '<!-- TBLFM: @>$>=sum(@I..@-1);hm -->',
      ]);
    }
  });
});
