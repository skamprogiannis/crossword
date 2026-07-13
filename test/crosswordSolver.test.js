const assert = require("node:assert/strict");
const test = require("node:test");
const {
  parseAndValidateInput,
  getSlotLength,
  getSlotPosition,
  findUncoveredOpenCell,
  createSlots,
  createBoard,
  canPlaceWord,
  placeWord,
  solve,
  crosswordSolver,
} = require("../crosswordSolver");

const smallPuzzle = "2001\n0..0\n1000\n0..0";
const smallWords = ["casa", "alan", "ciao", "anta"];
const smallRows = ["2001", "0..0", "1000", "0..0"];
const smallSlots = [
  { x: 0, y: 0, direction: "across", length: 4 },
  { x: 0, y: 0, direction: "down", length: 4 },
  { x: 3, y: 0, direction: "down", length: 4 },
  { x: 0, y: 2, direction: "across", length: 4 },
];
const emptySmallBoard = [
  [null, null, null, null],
  [null, ".", ".", null],
  [null, null, null, null],
  [null, ".", ".", null],
];
const smallBoard = [
  ["c", "a", "s", "a"],
  ["i", ".", ".", "l"],
  ["a", "n", "t", "a"],
  ["o", ".", ".", "n"],
];

function captureOutput(callback) {
  const output = [];
  const originalLog = console.log;
  console.log = (value) => output.push(String(value));

  try {
    callback();
  } finally {
    console.log = originalLog;
  }

  return output.join("\n");
}

test("parseAndValidateInput returns rows for valid input", () => {
  assert.deepEqual(parseAndValidateInput(smallPuzzle, smallWords), {
    value: ["2001", "0..0", "1000", "0..0"],
  });
});

test("parseAndValidateInput rejects invalid input", () => {
  assert.deepEqual(parseAndValidateInput(123, smallWords), {
    error: "expected arguments: puzzle === string, words === array",
  });
  assert.deepEqual(parseAndValidateInput(smallPuzzle, ["casa", "casa"]), {
    error: "words array must not contain duplicates",
  });
  assert.deepEqual(parseAndValidateInput("3000", ["word", "test", "more"]), {
    error: "puzzle must contain only 0, 1, 2, dots, and newlines",
  });
});

test("getSlotLength counts across and down slots", () => {
  const rows = ["100", "0..", "0.."];

  assert.equal(getSlotLength(rows, 0, 0, "across"), 3);
  assert.equal(getSlotLength(rows, 0, 0, "down"), 3);
});

test("getSlotPosition returns coordinates in both directions", () => {
  assert.deepEqual(
    getSlotPosition({ x: 1, y: 2, direction: "across", length: 3 }, 2),
    { x: 3, y: 2 },
  );
  assert.deepEqual(
    getSlotPosition({ x: 1, y: 2, direction: "down", length: 3 }, 2),
    { x: 1, y: 4 },
  );
});

test("findUncoveredOpenCell finds the first uncovered cell", () => {
  const rows = ["00", ".."];

  assert.deepEqual(findUncoveredOpenCell(rows, new Set(["0,0"])), {
    x: 1,
    y: 0,
  });
  assert.equal(findUncoveredOpenCell(rows, new Set(["0,0", "1,0"])), null);
});

test("createSlots builds the expected word positions", () => {
  const slotBuild = createSlots(smallRows);
  assert.ok("value" in slotBuild);
  assert.deepEqual(slotBuild.value, smallSlots);
});

test("createSlots rejects invalid puzzle geometry", () => {
  assert.deepEqual(createSlots(["100", "...", "0.."]), {
    error: "open cell at (0, 2) is not part of a word",
  });
  assert.deepEqual(createSlots(["1.", ".."]), {
    error: "word-start count at (0, 0) does not match its directions",
  });
});

test("createBoard converts digits to empty cells and preserves blocks", () => {
  assert.deepEqual(createBoard(["0.", ".1"]), [
    [null, "."],
    [".", null],
  ]);
});

test("canPlaceWord checks length, blocks, and crossing letters", () => {
  const slot = { x: 0, y: 0, direction: "across", length: 2 };

  assert.equal(canPlaceWord(slot, "ab", [[null, "b"]]), true);
  assert.equal(canPlaceWord(slot, "abc", [[null, null]]), false);
  assert.equal(canPlaceWord(slot, "ac", [[null, "b"]]), false);
  assert.equal(canPlaceWord(slot, "ab", [[null, "."]]), false);
});

test("placeWord copies the board for across and down slots", () => {
  const acrossBoard = [
    [null, null],
    [null, "."],
  ];
  const placedAcross = placeWord(
    { x: 0, y: 0, direction: "across", length: 2 },
    "ab",
    acrossBoard,
  );
  assert.deepEqual(placedAcross, [
    ["a", "b"],
    [null, "."],
  ]);
  assert.deepEqual(acrossBoard, [
    [null, null],
    [null, "."],
  ]);

  const downBoard = [
    [null, "."],
    [null, "."],
  ];
  assert.deepEqual(
    placeWord({ x: 0, y: 0, direction: "down", length: 2 }, "ab", downBoard),
    [
      ["a", "."],
      ["b", "."],
    ],
  );
});

test("solve returns the unique board or a detailed error", () => {
  assert.deepEqual(solve(smallSlots, smallWords, emptySmallBoard), {
    value: smallBoard,
  });
  assert.deepEqual(
    solve(smallSlots, ["aaab", "aaac", "aaad", "aaae"], emptySmallBoard),
    { error: "puzzle is not solvable" },
  );

  const ambiguousSlots = [
    { x: 0, y: 0, direction: "across", length: 4 },
    { x: 0, y: 0, direction: "down", length: 4 },
  ];
  const emptyAmbiguousBoard = [
    [null, null, null, null],
    [null, ".", ".", "."],
    [null, ".", ".", "."],
    [null, ".", ".", "."],
  ];
  assert.deepEqual(
    solve(ambiguousSlots, ["abba", "assa"], emptyAmbiguousBoard),
    { error: "puzzle has more than 1 solution" },
  );
});

test("crosswordSolver integrates solving and printing", () => {
  assert.equal(
    captureOutput(() => crosswordSolver(smallPuzzle, smallWords)),
    "casa\ni..l\nanta\no..n",
  );
  assert.equal(
    captureOutput(() => crosswordSolver(smallPuzzle, ["casa", "casa"])),
    "Error: words array must not contain duplicates",
  );
});
