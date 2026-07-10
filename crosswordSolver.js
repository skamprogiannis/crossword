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

function crosswordSolver(emptyPuzzle, words) {
  const validation = parseAndValidateInput(emptyPuzzle, words);
  if (validation.error) {
    console.log("Error: " + validation.error);
    return;
  }

  const matrix = validation.rows;
  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    for (let x = 0; x < row.length; x++) {
      // do stuff
    }
  }
}

