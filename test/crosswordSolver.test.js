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
  undoWordPlacement,
  findRarestLengthSlotIndex,
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
const beachPuzzle = [
  "...1...........",
  "..1000001000...",
  "...0....0......",
  ".1......0...1..",
  ".0....100000000",
  "100000..0...0..",
  ".0.....1001000.",
  ".0.1....0.0....",
  ".10000000.0....",
  ".0.0......0....",
  ".0.0.....100...",
  "...0......0....",
  "..........0....",
].join("\n");
const beachWords = [
  "sun",
  "sunglasses",
  "suncream",
  "swimming",
  "bikini",
  "beach",
  "icecream",
  "tan",
  "deckchair",
  "sand",
  "seaside",
  "sandals",
];
const beachSolution = [
  "...s...........",
  "..sunglasses...",
  "...n....u......",
  ".s......n...s..",
  ".w....deckchair",
  "bikini..r...n..",
  ".m.....seaside.",
  ".m.b....a.a....",
  ".icecream.n....",
  ".n.a......d....",
  ".g.c.....tan...",
  "...h......l....",
  "..........s....",
].join("\n");
const foodPuzzle = [
  "..1.1..1...",
  "10000..1000",
  "..0.0..0...",
  "..1000000..",
  "..0.0..0...",
  "1000..10000",
  "..0.1..0...",
  "....0..0...",
  "..100000...",
  "....0..0...",
  "....0......",
].join("\n");
const foodWords = [
  "popcorn",
  "fruit",
  "flour",
  "chicken",
  "eggs",
  "vegetables",
  "pasta",
  "pork",
  "steak",
  "cheese",
];
const foodSolution = [
  "..p.f..v...",
  "flour..eggs",
  "..p.u..g...",
  "..chicken..",
  "..o.t..t...",
  "pork..pasta",
  "..n.s..b...",
  "....t..l...",
  "..cheese...",
  "....a..s...",
  "....k......",
].join("\n");

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
    rows: ["2001", "0..0", "1000", "0..0"],
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
  assert.ok("slots" in slotBuild);
  assert.deepEqual(slotBuild.slots, smallSlots);
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

test("placeWord records mutable placements for across and down slots", () => {
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
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ]);
  assert.deepEqual(acrossBoard, [
    ["a", "b"],
    [null, "."],
  ]);
  undoWordPlacement(acrossBoard, placedAcross);
  assert.deepEqual(acrossBoard, [
    [null, null],
    [null, "."],
  ]);

  const downBoard = [
    ["a", "."],
    [null, "."],
  ];
  const placedDown = placeWord(
    { x: 0, y: 0, direction: "down", length: 2 },
    "ab",
    downBoard,
  );
  assert.deepEqual(placedDown, [{ x: 0, y: 1 }]);
  assert.deepEqual(downBoard, [
    ["a", "."],
    ["b", "."],
  ]);
  undoWordPlacement(downBoard, placedDown);
  assert.deepEqual(downBoard, [
    ["a", "."],
    [null, "."],
  ]);
});

test("findRarestLengthSlotIndex chooses the first rarest length", () => {
  const slots = [
    { x: 0, y: 0, direction: "across", length: 4 },
    { x: 0, y: 1, direction: "across", length: 3 },
    { x: 0, y: 2, direction: "across", length: 5 },
    { x: 0, y: 3, direction: "across", length: 3 },
  ];
  const wordCountsByLength = [];
  wordCountsByLength[3] = 2;
  wordCountsByLength[4] = 3;
  wordCountsByLength[5] = 1;

  assert.equal(findRarestLengthSlotIndex(slots, wordCountsByLength), 2);

  wordCountsByLength[3] = 1;
  assert.equal(findRarestLengthSlotIndex(slots, wordCountsByLength), 1);
});

test("solve returns the unique board or a detailed error", () => {
  assert.deepEqual(solve(smallSlots, smallWords, emptySmallBoard), {
    solution: smallBoard,
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

test("crosswordSolver solves the official large audit puzzles", () => {
  assert.equal(
    captureOutput(() => crosswordSolver(beachPuzzle, beachWords)),
    beachSolution,
  );
  assert.equal(
    captureOutput(() => crosswordSolver(beachPuzzle, [...beachWords].reverse())),
    beachSolution,
  );
  assert.equal(
    captureOutput(() => crosswordSolver(foodPuzzle, foodWords)),
    foodSolution,
  );
});

test("crosswordSolver rejects the official invalid audit cases", () => {
  const invalidInputs = [
    ["2001\n0..0\n2000\n0..0", smallWords],
    ["0001\n0..0\n3000\n0..0", smallWords],
    [smallPuzzle, ["casa", "casa", "ciao", "anta"]],
    ["", smallWords],
    [123, smallWords],
    ["", 123],
    ["2000\n0...\n0...\n0...", ["abba", "assa"]],
    [smallPuzzle, ["aaab", "aaac", "aaad", "aaae"]],
  ];

  for (const [puzzle, words] of invalidInputs) {
    assert.match(captureOutput(() => crosswordSolver(puzzle, words)), /^Error:/);
  }
});
