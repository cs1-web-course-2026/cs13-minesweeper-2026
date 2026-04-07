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
function getNeighbors(row, col) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
                neighbors.push({ r, c });
            }
        }
    }
    return neighbors;
}

function calculateAllNeighbors() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'mine') continue;
            const neighbors = getNeighbors(r, c);
            const count = neighbors.reduce((acc, pos) => {
                return acc + (gameState.field[pos.r][pos.c].type === 'mine' ? 1 : 0);
            }, 0);
            gameState.field[r][c].neighborMines = count;
        }
    }
}
function openCell(row, col) {
    const cell = gameState.field[row][col];
    if (cell.state !== 'closed' || gameState.status !== 'process') return;
    if (cell.type === 'mine') {
        cell.state = 'opened';
        gameOver('lose');
        return;
    }
    cell.state = 'opened';
    if (cell.neighborMines === 0) {
        const neighbors = getNeighbors(row, col);
        neighbors.forEach(pos => openCell(pos.r, pos.c));
    }
    checkWin();
}

function toggleFlag(row, col) {
    const cell = gameState.field[row][col];
    if (gameState.status !== 'process' || cell.state === 'opened') return;
    cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
}