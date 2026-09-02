# Crossword Solver

A dependency-free Node.js solver for Zone01's encoded crossword puzzles. It
validates the puzzle structure, searches for a unique word placement with
backtracking, and prints either the completed board or a specific error.

## Highlights

- Validates argument types, rectangular grids, word counts, duplicate words,
  start markers, and uncovered cells before searching.
- Models horizontal and vertical word slots independently.
- Detects unsolvable and ambiguous puzzles instead of returning an arbitrary
  board.
- Reuses one board during backtracking and chooses the rarest remaining slot
  length first to reduce search work.
- Uses only the Node.js standard library.

## How it works

The solver first converts each `1` or `2` marker into one or two directional
slots. During search it selects the remaining slot with the fewest
same-length candidates, tries compatible unused words, and undoes only the
letters written by that attempt. It stops after finding a second solution
because the project contract requires exactly one.

```text
encoded puzzle -> validation -> slot discovery -> constrained backtracking
                                                    |
                                                    v
                                  unique board or detailed error
```

## Requirements

- Node.js 18 or newer

No third-party packages are required.

## Use

Import `crosswordSolver` and pass the encoded puzzle plus its word list:

```js
const { crosswordSolver } = require("./crosswordSolver");

const puzzle = "2001\n0..0\n1000\n0..0";
const words = ["casa", "alan", "ciao", "anta"];

crosswordSolver(puzzle, words);
```

Output:

```text
casa
i..l
anta
o..n
```

In the encoding, `.` marks a blocked cell, `0` an open continuation cell,
and `1` or `2` the number of words starting at that cell.

## Test and benchmark

Run the validation, helper, integration, and official audit cases:

```bash
npm test
```

Run the small timing harness:

```bash
npm run benchmark
```

The benchmark is a development aid rather than a cross-machine score. See
[OPTIMIZATIONS.md](OPTIMIZATIONS.md) for the measured alternatives, retention
threshold, and results behind the current search strategy.

## Project structure

- `crosswordSolver.js` — validation, slot modeling, backtracking, and exports.
- `test/crosswordSolver.test.js` — unit, integration, and Zone01 audit cases.
- `timer.js` — repeatable local timing harness.
- `OPTIMIZATIONS.md` — performance experiments and decisions.

## Team and contributions

- `gelafros` developed the initial input-validation implementation.
- `skamprogiannis` completed and refactored validation, implemented the solver,
  built the test suite, and measured and documented the retained optimizations.

The Git history preserves the original authorship for both contributors.

## Status

The solver satisfies the current Zone01 audit cases and is ready for use as a
library-style exercise. It writes results to standard output because that is
the required project interface; it does not provide a separate CLI parser or
graphical interface.
