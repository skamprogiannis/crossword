const assert = require("node:assert/strict");
const test = require("node:test");
const {
  parseAndValidateInput,
  getSlotLength,
  getSlotPosition,
  findUncoveredOpenCell,
  createSlots,
  createBoard,
  placeWord,
  solve,
  crosswordSolver,
} = require("../crosswordSolver");

const smallPuzzle = "2001\n0..0\n1000\n0..0";
const smallWords = ["casa", "alan", "ciao", "anta"];
const smallBoard = [
  ["c", "a", "s", "a"],
  ["i", ".", ".", "l"],
  ["a", "n", "t", "a"],
  ["o", ".", ".", "n"],
];

function getValidRows() {
  const parsedInput = parseAndValidateInput(smallPuzzle, smallWords);
  assert.ok("value" in parsedInput);
  return parsedInput.value;
}

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
  const slotBuild = createSlots(getValidRows());
  assert.ok("value" in slotBuild);
  assert.deepEqual(slotBuild.value, [
    { x: 0, y: 0, direction: "across", length: 4 },
    { x: 0, y: 0, direction: "down", length: 4 },
    { x: 3, y: 0, direction: "down", length: 4 },
    { x: 0, y: 2, direction: "across", length: 4 },
  ]);
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
    placeWord(
      { x: 0, y: 0, direction: "down", length: 2 },
      "ab",
      downBoard,
    ),
    [
      ["a", "."],
      ["b", "."],
    ],
  );
});

test("solve returns the unique board or a detailed error", () => {
  const rows = getValidRows();
  const slotBuild = createSlots(rows);
  assert.ok("value" in slotBuild);

  assert.deepEqual(solve(slotBuild.value, smallWords, createBoard(rows)), {
    value: smallBoard,
  });
  assert.deepEqual(
    solve(slotBuild.value, ["aaab", "aaac", "aaad", "aaae"], createBoard(rows)),
    { error: "puzzle is not solvable" },
  );

  const ambiguousRows = ["2000", "0...", "0...", "0..."];
  const ambiguousSlots = createSlots(ambiguousRows);
  assert.ok("value" in ambiguousSlots);
  assert.deepEqual(
    solve(
      ambiguousSlots.value,
      ["abba", "assa"],
      createBoard(ambiguousRows),
    ),
    { error: "puzzle has more than 1 solution" },
  );
});

test("crosswordSolver prints solved boards and errors", () => {
  assert.equal(
    captureOutput(() => crosswordSolver(smallPuzzle, smallWords)),
    "casa\ni..l\nanta\no..n",
  );
  assert.equal(
    captureOutput(() => crosswordSolver(smallPuzzle, ["casa", "casa"])),
    "Error: words array must not contain duplicates",
  );
});
