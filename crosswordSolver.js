function parseAndvalidateInput(emptyPuzzle,words){
    if ((typeof emptyPuzzle !== 'string') || (!Array.isArray(words))){
        console.log('Error')
        return
    }

    if (emptyPuzzle.length === 0 || words.length === 0){
        console.log('Error')
        return
    }

    const regex = /[^\.\d\n]/
    if (regex.test(emptyPuzzle)){
        console.log('Error')
        return
    }

    const seen = new Set(words)
    if (seen.size !== words.length){
        console.log('Error')
        return
    }

    const rows = emptyPuzzle.split('\n')
    const isRectangular = rows.every(row => row.length === rows[0].length);
    if (!isRectangular) {
        console.log('Error');
        return;
        }

    const singleDigits = emptyPuzzle.match((/\d/g));
    if (!singleDigits) {
        console.log('Error');
        return;
    }
    const numOfWords = singleDigits.reduce((total, curr) => total + Number(curr), 0);
    if (numOfWords !== words.length) {
        console.log('Error');
        return;
    } 

    return rows;
}

function crosswordSolver(emptyPuzzle, words) {
    const matrix = parseAndvalidateInput(emptyPuzzle, words)
    if (!matrix) return;

    for (let i = 0; i < matrix.length; i++) {
        for () {
            
        }
    }
}