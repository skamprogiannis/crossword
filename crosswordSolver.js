/**
 * Validates the puzzle encoding and word list before solving.
 *
 * @param {unknown} emptyPuzzle The encoded crossword grid.
 * @param {unknown} words The words that must fill the crossword.
 * @returns {{rows: string[]} | {error: string}} Validated rows or an error.
 */
function parseAndValidateInput(emptyPuzzle, words) {
  if (typeof emptyPuzzle !== "string" || !Array.isArray(words)) {
    return {
      error: "expected arguments: puzzle === string, words === array",
    };
  }

  if (emptyPuzzle.length === 0 || words.length === 0) {
    return {
      error: "puzzle and words must not be empty",
    };
  }

  if (!words.every((word) => typeof word === "string" && word.length > 0)) {
    return {
      error: "words array must contain non-empty strings",
    };
  }

  const invalidPuzzleChars = /[^.012\n]/;
  if (invalidPuzzleChars.test(emptyPuzzle)) {
    return {
      error: "puzzle must contain only 0, 1, 2, dots, and newlines",
    };
  }

  const uniqueWords = new Set(words);
  if (uniqueWords.size !== words.length) {
    return {
      error: "words array must not contain duplicates",
    };
  }

  const rows = emptyPuzzle.split("\n");
  const isRectangular = rows.every((row) => row.length === rows[0].length);
  if (!isRectangular) {
    return {
      error: "all puzzle rows must have the same length",
    };
  }

  const startDigits = emptyPuzzle.match(/[12]/g);
  if (!startDigits) {
    return {
      error: "puzzle must contain digits marking word starts",
    };
  }

  const expectedWords = startDigits.reduce(
    (total, current) => total + Number(current),
    0,
  );
  if (expectedWords !== words.length) {
    return {
      error: `puzzle expects ${expectedWords} words but received ${words.length}`,
    };
  }

  return { rows };
}

/**
 * @typedef {"across" | "down"} Direction
 */

/**
 * @typedef {Object} Slot
 * @property {number} x The zero-based starting column.
 * @property {number} y The zero-based starting row.
 * @property {Direction} direction The direction in which the word runs.
 * @property {number} length The number of cells occupied by the word.
 */

/**
 * Counts the contiguous open cells from a word start in one direction.
 *
 * @param {string[]} rows The immutable encoded puzzle rows.
 * @param {number} x The slot's starting column.
 * @param {number} y The slot's starting row.
 * @param {Direction} direction The direction to scan.
 * @returns {number} The slot length.
 */
function getSlotLength(rows, x, y, direction) {
  const dx = direction === "across" ? 1 : 0;
  const dy = direction === "down" ? 1 : 0;
  let length = 0;

  while (
    y + dy * length < rows.length &&
    x + dx * length < rows[0].length &&
    rows[y + dy * length][x + dx * length] !== "."
  ) {
    length++;
  }

  return length;
}

/**
 * Returns a board coordinate at a given offset within a word slot.
 *
 * @param {Slot} slot The word slot.
 * @param {number} offset The zero-based character index within the word.
 * @returns {{x: number, y: number}} The matching board coordinate.
 */
function getSlotPosition(slot, offset) {
  return {
    x: slot.x + (slot.direction === "across" ? offset : 0),
    y: slot.y + (slot.direction === "down" ? offset : 0),
  };
}

/**
 * Finds the first non-blocked cell that is not covered by a word slot.
 *
 * @param {string[]} rows The immutable encoded puzzle rows.
 * @param {Set<string>} coveredCells Coordinates covered by generated slots.
 * @returns {{x: number, y: number} | null} The uncovered coordinate, or null.
 */
function findUncoveredOpenCell(rows, coveredCells) {
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] !== "." && !coveredCells.has(`${x},${y}`)) {
        return { x, y };
      }
    }
  }
  return null;
}

/**
 * Builds word slots and rejects grid cells that cannot form valid words.
 *
 * @param {string[]} rows The immutable encoded puzzle rows.
 * @returns {{slots: Slot[]} | {error: string}} The slots or a structural error.
 */
function createSlots(rows) {
  const slots = [];
  const coveredCells = new Set();

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const startCount = Number(rows[y][x]);
      if (startCount === 0 || Number.isNaN(startCount)) {
        continue;
      }

      const directions = [];
      if (
        (x === 0 || rows[y][x - 1] === ".") &&
        rows[y][x + 1] !== undefined &&
        rows[y][x + 1] !== "."
      ) {
        directions.push("across");
      }
      if (
        (y === 0 || rows[y - 1][x] === ".") &&
        rows[y + 1] !== undefined &&
        rows[y + 1][x] !== "."
      ) {
        directions.push("down");
      }

      if (directions.length !== startCount) {
        return {
          error: `word-start count at (${x}, ${y}) does not match its directions`,
        };
      }

      for (const direction of directions) {
        const slot = {
          x,
          y,
          direction,
          length: getSlotLength(rows, x, y, direction),
        };
        slots.push(slot);

        for (let offset = 0; offset < slot.length; offset++) {
          const position = getSlotPosition(slot, offset);
          coveredCells.add(`${position.x},${position.y}`);
        }
      }
    }
  }

  const uncoveredCell = findUncoveredOpenCell(rows, coveredCells);
  if (uncoveredCell) {
    const position = `(${uncoveredCell.x}, ${uncoveredCell.y})`;
    return { error: `open cell at ${position} is not part of a word` };
  }

  return { slots };
}

/**
 * Creates the mutable letter board shared throughout the search.
 *
 * @param {string[]} rows The immutable encoded puzzle rows.
 * @returns {(string | null)[][]} A board with dots and empty open cells.
 */
function createBoard(rows) {
  return rows.map((row) => [...row].map((cell) => (cell === "." ? "." : null)));
}

/**
 * Returns whether a word has the slot's length and matches existing letters.
 *
 * @param {Slot} slot The slot to check.
 * @param {string} word The word to test.
 * @param {(string | null)[][]} board The current board.
 * @returns {boolean} Whether the word can be placed without a conflict.
 */
function canPlaceWord(slot, word, board) {
  if (word.length !== slot.length) {
    return false;
  }

  for (let offset = 0; offset < word.length; offset++) {
    const { x, y } = getSlotPosition(slot, offset);
    const currentCell = board[y][x];

    if (
      currentCell === "." ||
      (currentCell !== null && currentCell !== word[offset])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Writes a word into the board and records the newly filled cells.
 *
 * @param {Slot} slot The slot to fill.
 * @param {string} word The word to place.
 * @param {(string | null)[][]} board The current board.
 * @returns {{x: number, y: number}[]} The cells changed from null to a letter.
 */
function placeWord(slot, word, board) {
  const placedCells = [];

  for (let wordIndex = 0; wordIndex < word.length; wordIndex++) {
    const { x, y } = getSlotPosition(slot, wordIndex);
    if (board[y][x] === null) {
      board[y][x] = word[wordIndex];
      placedCells.push({ x, y });
    }
  }

  return placedCells;
}

/**
 * Clears only the cells filled by the most recent word placement.
 *
 * @param {(string | null)[][]} board The shared search board.
 * @param {{x: number, y: number}[]} placedCells The cells to restore.
 * @returns {void}
 */
function undoWordPlacement(board, placedCells) {
  for (const { x, y } of placedCells) {
    board[y][x] = null;
  }
}

/**
 * Finds the first slot whose length has the fewest remaining words.
 *
 * @param {Slot[]} slots The remaining unfilled slots.
 * @param {number[]} remainingWordCountsByLength Available words by length.
 * @returns {number} The index of the rarest-length slot.
 */
function findRarestLengthSlotIndex(slots, remainingWordCountsByLength) {
  let rarestSlotIndex = 0;
  let fewestRemainingWords = Infinity;

  for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
    const slotLength = slots[slotIndex].length;
    const wordCount = remainingWordCountsByLength[slotLength] ?? 0;
    if (wordCount < fewestRemainingWords) {
      rarestSlotIndex = slotIndex;
      fewestRemainingWords = wordCount;
    }

    if (fewestRemainingWords === 0) {
      break;
    }
  }

  return rarestSlotIndex;
}

/**
 * Finds the only valid filling for every slot, if one exists.
 *
 * @param {Slot[]} slots The unchanging word positions.
 * @param {string[]} words The input words to place once each.
 * @param {(string | null)[][]} board The initial empty letter board.
 * @returns {{solution: (string | null)[][]} | {error: string}} The solution or error.
 */
function solve(slots, words, board) {
  const solutions = [];
  const remainingWordCountsByLength = [];

  for (const word of words) {
    remainingWordCountsByLength[word.length] =
      (remainingWordCountsByLength[word.length] ?? 0) + 1;
  }

  // Try every unused compatible word in the rarest-length unfilled slot.
  function search(remainingSlots, remainingWords) {
    if (solutions.length > 1) {
      return;
    }

    if (remainingSlots.length === 0) {
      solutions.push(board.map((row) => [...row]));
      return;
    }

    const slotIndex = findRarestLengthSlotIndex(
      remainingSlots,
      remainingWordCountsByLength,
    );
    const slot = remainingSlots[slotIndex];
    const nextSlots = remainingSlots.filter((_, index) => index !== slotIndex);

    for (let wordIndex = 0; wordIndex < remainingWords.length; wordIndex++) {
      const word = remainingWords[wordIndex];

      if (!canPlaceWord(slot, word, board)) {
        continue;
      }

      const nextWords = remainingWords.filter(
        (_, index) => index !== wordIndex,
      );
      const placedCells = placeWord(slot, word, board);
      remainingWordCountsByLength[word.length]--;
      search(nextSlots, nextWords);
      remainingWordCountsByLength[word.length]++;
      undoWordPlacement(board, placedCells);
    }
  }

  search(slots, words);
  switch (solutions.length) {
    case 2:
      return { error: "puzzle has more than 1 solution" };
    case 0:
      return { error: "puzzle is not solvable" };
    default:
      return { solution: solutions[0] };
  }
}

/**
 * Solves an encoded crossword and prints its unique filled-in board.
 *
 * @param {string} emptyPuzzle The encoded crossword grid.
 * @param {string[]} words The words that must fill the crossword.
 * @returns {void}
 */
function crosswordSolver(emptyPuzzle, words) {
  const parsedInput = parseAndValidateInput(emptyPuzzle, words);
  if ("error" in parsedInput) {
    console.log("Error: " + parsedInput.error);
    return;
  }

  const rows = parsedInput.rows;
  const slotBuild = createSlots(rows);
  if ("error" in slotBuild) {
    console.log("Error: " + slotBuild.error);
    return;
  }

  const slots = slotBuild.slots;
  const board = createBoard(rows);
  const solvedPuzzle = solve(slots, words, board);
  if ("error" in solvedPuzzle) {
    console.log("Error: " + solvedPuzzle.error);
    return;
  }

  const solvedBoard = solvedPuzzle.solution;
  console.log(solvedBoard.map((row) => row.join("")).join("\n"));
}

module.exports = {
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
};
