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

  const invalidPuzzleChars = /[^\.\d\n]/;
  if (invalidPuzzleChars.test(emptyPuzzle)) {
    return {
      error: "puzzle must contain only digits, dots, and newlines",
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

  const startDigits = emptyPuzzle.match(/\d/g);
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

function getSlotLength(rows, x, y, direction) {
  if (direction === "across") {
    let nextCell = rows[x][y + 1];
    let length = 1;
    while (nextCell) {
      nextCell = rows[x][y + 1];
      length++;
    }
    return length;
  }

  let nextCell = rows[x + 1][y];
  let length = 1;
  while (nextCell) {
    nextCell = rows[x + 1][y];
    length++;
  }
  return length;
}

function createSlots(rows) {
  const slots = [];

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const cell = rows[x][y];

      if (cell === "2") {
        slots.push({
          x,
          y,
          direction: "across",
          length: getSlotLength(rows, x, y, direction),
        });

        slots.push({
          x,
          y,
          direction: "down",
          length: getSlotLength(rows, x, y, direction),
        });
      } else if (cell === "1") {
        slots.push({
          x,
          y,
          direction: rows[x][y + 1] !== "." ? "across" : "down",
          length: getSlotLength(rows, x, y, direction),
        });
      }
    }
    return slots;
  }
}

function wordFits(slot, word, board) {
  //TODO
}

function placeWord(slot, word, board) {
  //TODO
}

function solve(slots, words, board) {
  if (!slots) {
    return board;
  }

  for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const slot = slots[slotIndex];
      const word = words[wordIndex];

      if (!wordFits(slot, word, board)) {
        continue;
      }

      if (solve(slots.splice(slotIndex, 1), words.splice(wordIndex, 1))) {
        return board;
      }

      words.push(word);
      slots.push(slot);
    }
  }
  return null;
}

function solve(slots, words, board) {
  if (slots.length === 0) {
    return board;
  }

  const [slot, ...remainingSlots] = slots;

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];

    if (!wordFits(slot, word, board)) {
      continue;
    }

    const remainingWords = words.filter((_, index) => index !== wordIndex);
    const nextBoard = placeWord(slot, word, board);

    if (solve(remainingSlots, remainingWords, nextBoard)) {
      return board;
    }
  }

  return null;
}

function printSolution(solvedBoard) {
  // TODO
}

function crosswordSolver(emptyPuzzle, words) {
  const validation = parseAndValidateInput(emptyPuzzle, words);
  if (validation.error) {
    console.log("Error: " + validation.error);
    return;
  }

  const grid = validation.rows;
  const slots = createSlots(grid);

  const solvedBoard = solve(slots, words, grid);
  if (!solvedBoard) {
    console.log("Error: no unique solution found)");
  }

  printSolution(solvedBoard);
}
