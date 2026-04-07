const gameState = {
    rows: 15,
    cols: 15,
    minesCount: 30,
    status: 'process',
    gameTime: 0,
    timerId: null,
    field: [] 
};
function initGame() {
    clearInterval(gameState.timerId);
    gameState.status = 'process';
    gameState.gameTime = 0;
    gameState.timerId = null;
    gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
    calculateAllNeighbors();
    startTimer();
    console.log("Гра розпочата", gameState.field);
}

function generateField(rows, cols, minesCount) {
    const field = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty',
                neighborMines: 0,
                state: 'closed'
            });
        }
        field.push(row);
    }
    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (field[r][c].type !== 'mine') {
            field[r][c].type = 'mine';
            minesPlaced++;
        }
    }
    return field;
}