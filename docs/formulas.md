# Formulas in Markdown Tables

One of the most exciting features this library adds (in my opinion) are
formulas. The format for these formulas is very similar to that used in
[org-mode](https://orgmode.org/), though not quite as powerful.

A brief overview of the features:

- Copy values from one cell, row, column, or range to another
- Sum values from a column or range
- Average (mean) values from a column or range
- Value comparisons
- Algebraic operations

## The Formula Structure - An Overview

Let's write an example formula, and become familiar with the structure before
learning the details of any specific feature.

```md
| Item              | Grams |
| ----------------- | ----- |
| Whole Wheat Flour | 110   |
| Bread Flour       | 748   |
| Warm Water        | 691   |
| Salt              | 18    |
| Starter           | 40    |
| **Total Grams**   |       |
<!-- TBLFM: @>$2=sum(@I..@-1) -->
```

Formulas are added to tables as an HTML comment directly following the table.
The format is `<!-- ` to start the comment, and ` -->` to finish. Note that
there is a space between the dashes and the internals of the formula.

Next, we signify that this comment contains a formula with `TBLFM: `. Again
note the trailing space. The components thus far will exist unchanged for
every formula you write.

### Source and Destination

Now we get into the dynamic part of the formula. You can break any formula
down into two halves: where to retrieve data, and where to store the result.

```md
<!-- TBLFM: DESTINATION=SOURCE -->
```

So in this formula, we are retrieving data from `sum(@I..@-1)` and
storing it in `@>$2`.

### Rows and Columns

Just like in org-mode, formulas use symbols to denote rows and columns. In
the above formula, the destination for our calculated value is `@>$2`. We can
break this down into `@>` and `$2`, meaning "last row" and "column 2". We'll
dive into what "last row" means in a minute.

Let's look at the source: `sum(@I..@-1)`. Again, if we ignore some of
the concepts we haven't learned yet, we can identify a few rows here: `@I`
and `@-1` are both rows

In addition to using number to refer to specific rows and columns (referred
to as absolute rows, or absolute columns), symbols can be used to dynamically
refer to parts of the table.

- `@<` and `$<` mean the first row and first column, respectively.
- `@>` and `$>` mean the last row and last column, respectively.
- `@I` refers to the line separating the table header from the table body.

Rows and columns can also be referenced in relation to the current cell being
filled. For example, `@-1` means "the same column, one row above", and `$+2`
would mean "the same row, two columns right".

When writing a cell reference, if the row or column portion is omitted, it means "in the current row" or "in the current column". In our example, `@I` and `@-1` have both omitted the column, so these references are for the same column as the destination cell.

You can combine first and last arguments with a cell reference. `@>-1` and `$>-2` references the 2nd to last row and 3rd to last column, respectively. This is useful for referencing fixed points near the bottom of an expanding table. You can also reference 2nd to first row/columns with `@<+1` and `$<+1`, respectively.

### Ranges

When writing `@2` by itself it means literally "row 2", as in, the entire
row. Similarly, `@2$4` means the single cell in row 2, column 4. However what
if you want to reference only a few cells in one column, or perhaps, a few
cells in several consecutive columns?

Ranges allow for doing just that. A range is denoted by two periods in a row
between two row and/or columns.

```md
@I..@-1
```

Our example from the top says "From the row after the header in the current
column, to the row above this in the last column."

### Functions

The last piece to our example is the function call.

```md
<!-- TBLFM: @>$2=sum(@I..@-1) -->
```

In this example we are using the `sum` function, and passing it the range
described above as the input data. The details of how `sum` operates will be
discussed later in this document, but for now we can say it sums the provided
input data, providing a single cell as the output.

### The result

With that we understand all the components of the example formula. It adds
the numbers from the second column, excluding the header and the final row,
and places the result in the final row.

## Formula Components

This section will go into further detail about the different components which
can be used in a formula. Some details will be repeats from the overview
section above.

### Cell and Row References

Rows are always denoted by `@` and columns by `$`. Rows and columns can be
specified as absolute values, or relative.

- `@1` means the first row, and `@5` means the 5th row from the top.
- `$1` means the first column, and `$5` means the 5th column from the left.
- `@<` and `$<` mean the first row and first column, respectively.
- `@>` and `$>` mean the last row and last column, respectively.
- `@I` refers to the first row of content below the header.
- `@-1` means the the row above the cell being filled.
- `$+2` means the column two right of the cell being filled.

A row or column can be specified by themselves, or together in a combination.
For example, `@5` means the 5th row in the current column. Similarly, `$5`
means the 5th column in the current row. When used together, they indicate a
single cell.

When used together, the row should always preceed the column.

### Ranges

With just rows and columns, the formula is limited to selecting single cells,
or full rows and columns. Using a range, a formula can select partial
rows/columns, as well as multiple rows/columns.

Ranges are created with a row and/or column, two dots, and another row and/or
column. For example `@1..@3`. Note however, that the components on both sides
must match. A range can not be from a row to a column, or a cell to a row.

- `@2..$4` - Invalid, can not range from a row to a column.
- `@2$3..@5` - Valid, if column exists on first term and not second, it is carried to the second.
- `@2$3..@5$5` - Valid, from one cell to another cell.
- `$4..$6` - Valid, from one column to another column.

Ranges can be used to select portions of a row or column.

- `@2$>..@5$>` - The last column, from row 2 to row 5. Arity `4x1`
- `@3$<..@3$5` - The third row, from the first column to the 5th. Arity `1x5`

Ranges can also be used to select more than a row or column.

- `@<..@>` - The entire row from the first row, to the last (the whole table).
- `@3$1..@4$3` - From row 3 to row 4, from column 1 to 3. Arity `2x3`

### Algebraic Operations

Formulas can be used to add, subtract, multiply, and divide values in a
table. All algebraic operations must be contained in parenthesis.

#### Add

When adding, at least one of the specified values must be a single cell. A
formula may not add one range to another range.

- `(@2$3+@3$4)` - Valid, adding two cells.
- `(@2+@3$4)` - Valid, add the value in row two of the current cell, to the cell @3$4.
- `(@2$3+$4)` - Valid, add the value in @2$3 to the value in the current row, column $4.
- `(@2+@3)` - Valid, add the value in the current column of row 2 to the current column of row 3.
- `@2$3+$4` - Invalid, missing parenthesis.

##### Add Example

In this table, the right column started out looking just like the left, with
only the first two values filled. The formula fills the last column from row
4 to the last row. For each row, it adds the value of the previous two rows.
You may recognize this as the [Fibonacci
Sequence](https://en.wikipedia.org/wiki/Fibonacci_number)

```md
| Start | Fibonacci |
|-------+-----------|
|     1 |         1 |
|     1 |         1 |
|       |         2 |
|       |         3 |
|       |         5 |
|       |         8 |
|       |        13 |
|       |        21 |
<!-- TBLFM: @4$>..@>$>=(@-1+@-2) -->
```

#### Subtract

Subtraction requires that the second operand be a single cell. The first
operand may be a range or cell.

- `(@2$3-@3$4)` - Valid, subtract two cells.
- `(@2-@3$4)` - Valid, subtract a single cell from each value in the row.
- `(@3$4-@2)` - Valid, the value in row two of the current column from @3$4.
- `@2-@3$4` - Invalid, missing parenthesis.

##### Subtract Example

In this example, we are subtracting the value in row three (4, 5, 6) from the
value in @2$3 (3). Notice how each result (-1, -2, -3) subtracted the value in
the corresponding cell of row three.

```md
| One | Two | Three |
|-----+-----+-------|
|   1 |   2 |     3 |
|   4 |   5 |     6 |
|  -1 |  -2 |    -3 |
<!-- TBLFM: @>=(@2$3-@3) -->
```

#### Multiply

Multiplication requires at least one value be a single cell. A formula may
not multiply one range with another range.

- `(@2$3*@3$4)` - Valid, multiplying two cells.
- `(@2*@3$4)` - Valid, multiply a single cell with the current column in row 2.
- `(@2$3*$4)` - Valid, multiply a single cell with the current row in column 4.
- `(@2*@3)` - Valid, multiply the current column in row 2 with the current column in row 3.
- `(@2..@3*@2$4..@4$4)` - Invalid, both operands are ranges.
- `@2$3*$4` - Invalid, missing parenthesis.

#### Divide

Division requires that the second operand be a single cell. The first operand
may be a range or a cell.

- `(@2$3/@3$4)` - Valid, divide two cells.
- `(@2/@3$4)` - Valid, divide each value in the row by s single cell.
- `(@3$4/@2)` - Valid, divide a single cell by the current column in row 2.
- `(@3$4/@2..@3)` - Invalid, may not divide a single cell by a range.
- `@2/@3$4` - Invalid, missing parenthesis.

### Conditional Operations

Conditionals allow choosing a value based on the comparison of two inputs.
For example:

```md
if(@3$4<@4$5, @2, @3)
```

In this example, we are comparing the values located in cell `@3$4` against
cell `@4$5`. If the first is less than (`<`) the second, then the result will
be the first parameter (`@2`), otherwise the result will be the second
parameter (`@3`).

Comparisons can only be made between cells, not ranges.

#### Comparison Operators

- `<` - Less than
- `>` - Greater than
- `<=` - Less than or equal to
- `>=` - Greater than or equal to
- `==` - Equal
- `!=` - Not equal

#### Conditional Example

This conditional operation sets the values in the last column (except the
header). For each row, it checks if the first column is greater than three.
If it is, that value is put in the last column, otherwise the value of three
is put in the last column.

In other words, this function sets the last column to the greater of the
first column and three.

```md
| One | Two | Three |
|-----+-----+-------|
|   1 |   2 |     3 |
|   4 |   5 |     4 |
|  -1 |  -2 |     3 |
#+TBLFM: $>=if($1>3, $1, 3)
```

### Functions

Functions look very similar to conditional operations. A keyword followed by
parenthesis with values inside. For example, `mean(@3$<..@3$4)`. A function
call passes in the data from the provided range, cell, row, or column, then
performs a caculation and provides back the result.

There are two functions that can be used:

#### sum

`sum` is very similar to the addition algebraic operation above, but it will
add all the cells in the provided range, row, or column together and output a
single cell result.

```md
|       One | Two | Three |
|-----------+-----+-------|
|         1 |   2 |       |
|         4 |   5 |       |
| **Total** |     |    12 |
<!-- TBLFM: @>$>=sum(@2$<..@3$2) -->
```

#### mean

`mean` calculates the average of the provided range, row, or column. Like
`sum` it will output a single cell result.

## Nesting

The different building blocks of a function can be nested, as long as their
arity matches. For example, the output from `sum` can be used as an input for
a conditional operation. Here are a few examples of valid nesting:

- `<!-- TBLFM: @>=sum(@3..@4)+@3$1 -->` - Add `@3$1` to each column output by `sum`
- `<!-- TBLFM: @3$3=if(@2$4+@2$5==@2$6, @3$3, @4$3) -->` - Add two cells in the comparison

## Chaining and Multiple Formulas

A table may have multiple formulas defined. This can be done in two ways. In
a single formula line, multiple formulas may be "chained" together, separated
by `::`. For example:

```md
<!-- TBLFM: @2=@4::$1=$2 -->
```

When chained, formulas will be evaluated from left to right. The resulting
table after applying the first formula, will be used as the input for the
second formula. This means that the second formula may operated on calculated
values from the first formula.

The second method is with multiple formula lines.

```md
<!-- TBLFM: @2=@4 -->
<!-- TBLFM: $1=$2 -->
```

This method is equivalent to chaining. Formula lines will be evaluated from
the top to the bottom. Just like when chaining, the output table after one
formula, is passed as the input to the next.

These methods can be mixed.

```md
<!-- TBLFM: @2=@4::$1=$2 -->
<!-- TBLFM: @5$3=sum(@2) -->
```

## Formatting Options

You can optionally request the result be output with a certain number of
decimal points by using a formatting directive. For example:

```md
| A   | B   | C   | D   |
| --- | --- | --- | --- |
| 1   | 2   | 5   | 6   |
| 3   | 4   | 7   | 8   |
|     |     |     |     |

<!-- TBLFM: @>=(@I / @3$4);%.2f -->
```

In this example, the formatting directive is the `;%.2f` at the end. Without
that, the results would be values such as `0.14285714285714285`, but because
we have requested `2` decimal points, the results will instead be `0.14`.

You may also output the result as a datetime with the `;dt` formatting
directive or as hours and minutes with the `;hm` formatting directive. In this
example, we take a datetime and add 600000 milliseconds, then output the result
as a datetime.

```
| Start            | Ms     | End              |
| ---------------- | ------ | ---------------- |
| 2023-07-12 10:00 | 600000 | 2023-07-12 10:10 |
<!-- TBLFM: $>=($1 + $2);dt -->
```

## Times and Durations

There is very basic support for operating on times in tables.

Times are represented as either a datetime string (2022-12-31 23:59), or
as milliseconds since the epoch (1672559940000). Durations may be expressed
either as hours and minutes (23:59) or in milliseconds.

For example, we can subtract an end time from a start time and view the
duration in milliseconds or as hours and minutes:

```
| Start            | End              | Ms      | Mins | Duration |
| ---------------- | ---------------- | ------- | ---- | -------- |
| 2023-07-12 10:00 | 2023-07-12 12:10 | 7800000 | 130  | 02:10    |
<!-- TBLFM: $3=($2 - $1) -->
<!-- TBLFM: $4=(($2 - $1) / 60000) -->
<!-- TBLFM: $5=($2 - $1);hm -->
```

Durations formatted as hours and minutes may also be used to represent a time
of day.

This next example shows a table someone might use to track time they spend on
tasks. They fill in each task name along with task start and end times,
optionally omitting a start time if it is the same as the previous tasks' end
time. The formulas calculate the duration of each task, along with the total
time spent on all tasks.

```
| Task        | Start |   End | Duration |
| ----------- | ----- | -----:| --------:|
| Plan day    | 09:00 | 09:15 |    00:15 |
| Fix Bug#1   | 09:27 | 11:33 |    02:06 |
| Fix Bug#2   |       | 12:22 |    00:49 |
| Triage bugs | 13:00 | 17:00 |    04:00 |
| Clean desk  |       | 17:30 |    00:30 |
| **Total**   |       |       |    07:40 |
<!-- TBLFM: $>=($3 - if($2>0, $2, @-1$3));hm -->
<!-- TBLFM: @>$>=sum(@I..@-1);hm -->
```

## Conclusion

This documentation is a work in progress. Please help improve this
documentation by sending your questions or suggestions to
<https://github.com/tgrosinger/md-advanced-tables/issues>.
