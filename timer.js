const { performance } = require("node:perf_hooks");
const { crosswordSolver } = require("./crosswordSolver");

const ITERATIONS = 100;
const puzzle = "2001\n0..0\n1000\n0..0";
const words = ["casa", "alan", "ciao", "anta"];

function measure(puzzle, words, iterations) {
  const originalLog = console.log;
  console.log = () => {};

  try {
    const start = performance.now();

    for (let run = 0; run < iterations; run++) {
      crosswordSolver(puzzle, words);
    }

    return (performance.now() - start) / iterations;
  } finally {
    console.log = originalLog;
  }
}

const averageMs = measure(puzzle, words, ITERATIONS);
console.log(`Average time: ${averageMs.toFixed(3)}ms`);
