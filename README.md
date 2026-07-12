# Crossword Solver

A Node.js crossword solver that fills a numbered puzzle with a list of words.
It prints the solved board or a detailed `Error:` message when the input does
not produce exactly one solution.

## Requirements

Node.js 18 or newer.

## Use

```js
const { crosswordSolver } = require("./crosswordSolver");

const puzzle = "2001\n0..0\n1000\n0..0";
const words = ["casa", "alan", "ciao", "anta"];

crosswordSolver(puzzle, words);
```

Run the example from a Node REPL or another JavaScript file in this directory.

## Timer

Run the default timing scenario with:

```bash
node timer.js
```

Edit `puzzle`, `words`, and `ITERATIONS` in `timer.js` to measure another
scenario. See `OPTIMIZATIONS.md` before changing the solver for performance.

## Tests

Run the complete test suite with Node's built-in test runner:

```bash
node --test test/crosswordSolver.test.js
```

To print each test name directly, run:

```bash
node test/crosswordSolver.test.js
```
