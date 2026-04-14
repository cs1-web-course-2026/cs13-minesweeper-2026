const gameState = {
    rows: 15,
    cols: 15,
    minesCount: 30, 
    status: 'process',
    gameTime: 0,
    timerId: null,
    field: []
};

let boardElement, timerDisplay, minesDisplay, startBtn;

document.addEventListener('DOMContentLoaded', () => {
    boardElement = document.getElementById('game-board');
    const displays = document.querySelectorAll('.digital-display');
    minesDisplay = displays[0];
    timerDisplay = displays[1];
    startBtn = document.querySelector('.start-btn');

    startBtn.addEventListener('click', initGame);

    initGame(); 
});

function initGame() {
    clearInterval(gameState.timerId);
    gameState.status = 'process';
    gameState.gameTime = 0;
    gameState.timerId = null;
    if (timerDisplay) timerDisplay.textContent = "000";
    
    gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
    calculateAllNeighbors();
    startTimer();
    render();
}

function generateField(rows, cols, minesCount) {
    const field = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({ type: 'empty', neighborMines: 0, state: 'closed' });
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

function checkWin() {
    let closedEmptyCells = 0;
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'empty' && gameState.field[r][c].state !== 'opened') {
                closedEmptyCells++;
            }
        }
    }
    if (closedEmptyCells === 0) {
        gameOver('win');
    }
}

function startTimer() {
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        if (timerDisplay) {
            timerDisplay.textContent = String(Math.min(gameState.gameTime, 999)).padStart(3, '0');
        }
    }, 1000);
}

function gameOver(status) {
    gameState.status = status;
    clearInterval(gameState.timerId);
    render(); 

    setTimeout(() => {
        if (status === 'win') {
            alert("Вітаємо! Ви перемогли!");
        } else {
            alert("Ви підірвалися на міні! Гра закінчена.");
        }
    }, 100);
}

function render() {
    boardElement.innerHTML = ''; 
    
    const flagsPlaced = gameState.field.flat().filter(c => c.state === 'flagged').length;
    if (minesDisplay) {
        minesDisplay.textContent = String(Math.max(0, gameState.minesCount - flagsPlaced)).padStart(3, '0');
    }

    gameState.field.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');

            if (cell.state === 'closed') {
                cellDiv.classList.add('closed');
            } else if (cell.state === 'flagged') {
                cellDiv.classList.add('flagged');
                cellDiv.textContent = '🚩';
            } else if (cell.state === 'opened') {
                cellDiv.classList.add('open');
                if (cell.type === 'mine') {
                    cellDiv.classList.add('clicked-mine');
                    cellDiv.textContent = '💣';
                } else if (cell.neighborMines > 0) {
                    cellDiv.dataset.number = cell.neighborMines;
                    cellDiv.textContent = cell.neighborMines;
                }
            }

            cellDiv.addEventListener('click', () => {
                if (gameState.status === 'process') {
                    openCell(r, c);
                    render();
                }
            });

            cellDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault(); 
                if (gameState.status === 'process') {
                    toggleFlag(r, c);
                    render();
                }
            });

            boardElement.appendChild(cellDiv);
        });
    });
}