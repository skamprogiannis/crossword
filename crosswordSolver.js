/**
 * Validates the puzzle encoding and word list before solving.
 *
 * @param {unknown} emptyPuzzle The encoded crossword grid.
 * @param {unknown} words The words that must fill the crossword.
 * @returns {{rows?: string[], error?: string}} Validated rows or an error.
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
 * @returns {{slots?: Slot[], error?: string}} The slots or a structural error.
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
 * Creates the mutable letter board used by each search branch.
 *
 * @param {string[]} rows The immutable encoded puzzle rows.
 * @returns {(string | null)[][]} A board with dots and empty open cells.
 */
function createBoard(rows) {
  return rows.map((row) => [...row].map((cell) => (cell === "." ? "." : null)));
}

function placeWord(slot, word, board) {
  // TODO: return a copied board with word written into slot.
}

/**
 * Finds the only valid filling for every slot, if one exists.
 *
 * @param {Slot[]} slots The unchanging word positions.
 * @param {string[]} words The input words to place once each.
 * @param {(string | null)[][]} board The initial empty letter board.
 * @returns {(string | null)[][] | null} The unique solution, or null.
 */
function solve(slots, words, board) {
  const solutions = [];

  /**
   * Explores every compatible remaining word for the next slot.
   *
   * @param {Slot[]} remainingSlots Slots that still require a word.
   * @param {string[]} remainingWords Words that have not been placed.
   * @param {(string | null)[][]} currentBoard The board for this branch.
   * @returns {void}
   */
  function search(remainingSlots, remainingWords, currentBoard) {
    if (solutions.length > 1) {
      return;
    }

    if (remainingSlots.length === 0) {
      solutions.push(currentBoard);
      return;
    }

    const [slot, ...nextSlots] = remainingSlots;

    for (let wordIndex = 0; wordIndex < remainingWords.length; wordIndex++) {
      const word = remainingWords[wordIndex];
      if (word.length !== slot.length) {
        continue;
      }

      let hasCompatibleCrossings = true;
      for (let offset = 0; offset < word.length; offset++) {
        const { x, y } = getSlotPosition(slot, offset);
        const currentCell = currentBoard[y][x];

        if (
          currentCell === "." ||
          (currentCell !== null && currentCell !== word[offset])
        ) {
          hasCompatibleCrossings = false;
          break;
        }
      }

      if (!hasCompatibleCrossings) {
        continue;
      }

      const nextWords = remainingWords.filter(
        (_, index) => index !== wordIndex,
      );
      const nextBoard = placeWord(slot, word, currentBoard);
      search(nextSlots, nextWords, nextBoard);
    }
  }

  search(slots, words, board);
  return solutions.length === 1 ? solutions[0] : null;
}

/**
 * Solves an encoded crossword and prints its unique filled-in board.
 *
 * @param {string} emptyPuzzle The encoded crossword grid.
 * @param {string[]} words The words that must fill the crossword.
 * @returns {void}
 */
function crosswordSolver(emptyPuzzle, words) {
  const validation = parseAndValidateInput(emptyPuzzle, words);
  if (validation.error) {
    console.log("Error: " + validation.error);
    return;
  }

  const slotsResult = createSlots(validation.rows);
  if (slotsResult.error) {
    console.log("Error: " + slotsResult.error);
    return;
  }

  const board = createBoard(validation.rows);
  const solvedBoard = solve(slotsResult.slots, words, board);
  if (!solvedBoard) {
    console.log("Error: no unique solution found");
    return;
  }

  console.log(solvedBoard.map((row) => row.join("")).join("\n"));
}

module.exports = { crosswordSolver };
