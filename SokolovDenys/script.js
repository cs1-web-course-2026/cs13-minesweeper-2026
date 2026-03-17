const gameState = {
    rows: 5,
    cols: 5,
    minesCount: 5,
    status: 'process',
    gameTime: 0,
    timerId: null,
    field: []
};

// 1. Генерація поля
function generateField(rows, cols, minesCount) {
    gameState.field = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
            type: 'empty',
            neighborMines: 0,
            state: 'closed'
        }))
    );

    let placedMines = 0;
    while (placedMines < minesCount) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);

        if (gameState.field[r][c].type !== 'mine') {
            gameState.field[r][c].type = 'mine';
            placedMines++;
        }
    }
    countAllNeighbours();
}

// 2. Підрахунок сусідів
function countAllNeighbours() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'mine') continue;

            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr;
                    let nc = c + dc;
                    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                        if (gameState.field[nr][nc].type === 'mine') count++;
                    }
                }
            }
            gameState.field[r][c].neighborMines = count;
        }
    }
}

// 3. Логіка відкриття
function openCell(r, c) {
    const cell = gameState.field[r][c];

    if (gameState.status !== 'process' || cell.state !== 'closed') return;

    if (cell.type === 'mine') {
        cell.state = 'opened';
        endGame('lose');
        return;
    }

    cell.state = 'opened';

    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                let nr = r + dr;
                let nc = c + dc;
                if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                    openCell(nr, nc);
                }
            }
        }
    }
    checkWin();
}

// 4. Керування прапорцями
function toggleFlag(r, c) {
    const cell = gameState.field[r][c];
    if (gameState.status !== 'process' || cell.state === 'opened') return;

    cell.state = (cell.state === 'flagged') ? 'closed' : 'flagged';
}

// 5. Таймер та інтерфейс
function startTimer() {
    if (gameState.timerId) return;
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        // Змінюємо id на game-timer
        const timerElement = document.getElementById('game-timer');
        if (timerElement) timerElement.textContent = gameState.gameTime;
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

function endGame(result) {
    gameState.status = result;
    stopTimer();
    renderBoard();

    const modal = document.getElementById('game-modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');

    if (result === 'win') {
        title.textContent = '🎉 ПЕРЕМОГА!';
        title.className = 'status-win';
        message.textContent = `Твій час: ${gameState.gameTime} сек.`;
    } else {
        title.textContent = '💥';
        title.className = 'status-lose';
        message.textContent = 'Ти натрапив на міну. Спробуй ще раз!';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('game-modal').style.display = 'none';
}

function checkWin() {
    const hasWon = gameState.field.every(row =>
        row.every(cell => cell.type === 'mine' || cell.state === 'opened')
    );
    if (hasWon) endGame('win');
}

// 6. Малювання поля в HTML
function renderBoard() {
    const boardElement = document.querySelector('.game-board');
    if (!boardElement) return;

    // Оновлюємо лічильник прапорців на екрані
    const flagsCount = gameState.field.flat().filter(cell => cell.state === 'flagged').length;
    const flagsElement = document.getElementById('flags-count');
    if (flagsElement) flagsElement.textContent = flagsCount;

    boardElement.innerHTML = '';

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cellData = gameState.field[r][c];
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');

            if (cellData.state === 'opened') {
                cellElement.classList.add('revealed');
                if (cellData.type === 'mine') {
                    cellElement.classList.add('exploded');
                    cellElement.textContent = '💣';
                } else if (cellData.neighborMines > 0) {
                    cellElement.textContent = cellData.neighborMines;
                    cellElement.classList.add(`number-${cellData.neighborMines}`);
                }
            } else if (cellData.state === 'flagged') {
                cellElement.classList.add('flag');
                cellElement.textContent = '🚩';
            }

            cellElement.addEventListener('click', () => {
                if (gameState.status === 'process') {
                    if (gameState.gameTime === 0 && !gameState.timerId) startTimer();
                    openCell(r, c);
                    renderBoard();
                }
            });

            cellElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (gameState.status === 'process') {
                    toggleFlag(r, c);
                    renderBoard();
                }
            });

            boardElement.appendChild(cellElement);
        }
    }
}

// 7. Скидання гри
function resetGame() {
    stopTimer();
    gameState.status = 'process';
    gameState.gameTime = 0;
    
    // Виправляємо ID тут
    const timerElement = document.getElementById('game-timer');
    if (timerElement) timerElement.textContent = '0';
    
    generateField(gameState.rows, gameState.cols, gameState.minesCount);
    renderBoard();
}

window.onload = () => {
    const resetBtn = document.querySelector('.reset-button');
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    
    resetGame();
};