const gameState = {
    rows: 8,
    cols: 8,
    mineCount: 10,
    status: 'process',
    time: 0,
    board: [],
    intervalId: null,
};

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('gameStatus');
const timerElement = document.getElementById('timer');
const mineCountElement = document.getElementById('mineCount');
const restartBtn = document.getElementById('restartBtn');
const difficultySelect = document.getElementById('difficulty');

function createEmptyBoard(rows, cols) {
    const board = [];
    for (let row = 0; row < rows; row++) {
        const rowCells = [];
        for (let col = 0; col < cols; col++) {
            rowCells.push({
                type: 'empty',
                state: 'closed',
                neighborMines: 0,
            });
        }
        board.push(rowCells);
    }
    return board;
}

function placeMines(board, mineCount) {
    const rows = board.length;
    const cols = board[0].length;
    let placed = 0;

    while (placed < mineCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        if (board[row][col].type !== 'mine') {
            board[row][col].type = 'mine';
            placed += 1;
        }
    }
}

function countNeighbourMines(board) {
    const rows = board.length;
    const cols = board[0].length;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col].type === 'mine') {
                board[row][col].neighborMines = 0;
                continue;
            }
            let count = 0;
            for (let y = Math.max(0, row - 1); y <= Math.min(rows - 1, row + 1); y++) {
                for (let x = Math.max(0, col - 1); x <= Math.min(cols - 1, col + 1); x++) {
                    if (y === row && x === col) continue;
                    if (board[y][x].type === 'mine') count += 1;
                }
            }
            board[row][col].neighborMines = count;
        }
    }
}

function renderBoard() {
    boardElement.style.gridTemplateRows = `repeat(${gameState.rows}, 1fr)`;
    boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;
    boardElement.innerHTML = '';

    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = gameState.board[row][col];
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.row = row;
            cellElement.dataset.col = col;

            if (cell.state === 'closed') {
                cellElement.classList.add('closed');
                cellElement.textContent = '';
            } else if (cell.state === 'flagged') {
                cellElement.classList.add('flagged');
                cellElement.textContent = '🚩';
            } else if (cell.state === 'opened') {
                cellElement.classList.add('opened');
                if (cell.type === 'mine') {
                    cellElement.classList.add('mine');
                    cellElement.textContent = '💣';
                } else if (cell.neighborMines > 0) {
                    cellElement.dataset.value = cell.neighborMines;
                    cellElement.textContent = cell.neighborMines;
                }
            }

            cellElement.addEventListener('click', () => handleCellClick(row, col));
            cellElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                handleCellRightClick(row, col);
            });

            boardElement.appendChild(cellElement);
        }
    }
}

function handleCellClick(row, col) {
    if (gameState.status !== 'process') return;
    openCell(row, col);
    refreshUI();
}

function handleCellRightClick(row, col) {
    if (gameState.status !== 'process') return;
    toggleFlag(row, col);
    refreshUI();
}

function openCell(row, col) {
    const cell = gameState.board[row][col];
    if (cell.state === 'opened' || cell.state === 'flagged') return;

    if (cell.type === 'mine') {
        cell.state = 'opened';
        gameState.status = 'lose';
        stopTimer();
        revealMines();
        return;
    }

    cell.state = 'opened';

    if (cell.neighborMines === 0) {
        for (let y = Math.max(0, row - 1); y <= Math.min(gameState.rows - 1, row + 1); y++) {
            for (let x = Math.max(0, col - 1); x <= Math.min(gameState.cols - 1, col + 1); x++) {
                if (y === row && x === col) continue;
                openCell(y, x);
            }
        }
    }

    checkWinCondition();
}

function toggleFlag(row, col) {
    const cell = gameState.board[row][col];
    if (cell.state === 'opened') return;

    cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
}

function revealMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = gameState.board[row][col];
            if (cell.type === 'mine') {
                cell.state = 'opened';
            }
        }
    }
}

function checkWinCondition() {
    let allSafeOpened = true;
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = gameState.board[row][col];
            if (cell.type === 'empty' && cell.state !== 'opened') {
                allSafeOpened = false;
            }
        }
    }

    if (allSafeOpened && gameState.status === 'process') {
        gameState.status = 'win';
        stopTimer();
    }
}

function startTimer() {
    stopTimer();
    gameState.intervalId = setInterval(() => {
        if (gameState.status !== 'process') return;
        gameState.time += 1;
        timerElement.textContent = gameState.time;
    }, 1000);
}

function stopTimer() {
    if (gameState.intervalId !== null) {
        clearInterval(gameState.intervalId);
        gameState.intervalId = null;
    }
}

function refreshUI() {
    statusElement.textContent = gameState.status;
    statusElement.className = '';
    if (gameState.status === 'win') statusElement.classList.add('status-win');
    if (gameState.status === 'lose') statusElement.classList.add('status-lose');
    timerElement.textContent = gameState.time;
    mineCountElement.textContent = gameState.mineCount;
    renderBoard();
}

function setDifficulty(value) {
    switch (value) {
        case 'easy':
            gameState.rows = 8;
            gameState.cols = 8;
            gameState.mineCount = 10;
            break;
        case 'medium':
            gameState.rows = 12;
            gameState.cols = 12;
            gameState.mineCount = 20;
            break;
        case 'hard':
            gameState.rows = 16;
            gameState.cols = 16;
            gameState.mineCount = 40;
            break;
    }
}

function initGame() {
    gameState.status = 'process';
    gameState.time = 0;
    setDifficulty(difficultySelect.value);
    gameState.board = createEmptyBoard(gameState.rows, gameState.cols);
    placeMines(gameState.board, gameState.mineCount);
    countNeighbourMines(gameState.board);
    startTimer();
    refreshUI();
}

restartBtn.addEventListener('click', initGame);
difficultySelect.addEventListener('change', initGame);

window.addEventListener('load', () => {
    setDifficulty(difficultySelect.value);
    initGame();
});
