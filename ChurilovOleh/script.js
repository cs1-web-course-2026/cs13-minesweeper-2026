// ==========================================
// 1. СТРУКТУРА ДАНИХ (Збережено з Лаби 2)
// ==========================================
let currentGameState = null;

function createInitialState(rows = 10, cols = 10, minesCount = 15) {
    return {
        rows,
        cols,
        minesCount,
        status: 'process', // 'process' | 'win' | 'lose'
        gameTime: 0,
        board: [],
        isFirstClick: true
    };
}

function generateField(rows, cols, minesCount) {
    const newState = createInitialState(rows, cols, minesCount);
    const board = [];

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty',
                state: 'closed',
                neighborMines: 0,
                row: r,
                col: c
            });
        }
        board.push(row);
    }

    let minesPlanted = 0;
    while (minesPlanted < minesCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (board[randomRow][randomCol].type !== 'mine') {
            board[randomRow][randomCol].type = 'mine';
            minesPlanted++;
        }
    }

    newState.board = board;
    return calculateAllNeighbors(newState);
}

function getNeighbours(board, r, c, rows, cols) {
    const neighbours = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = r + dr;
            const newCol = c + dc;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                neighbours.push(board[newRow][newCol]);
            }
        }
    }
    return neighbours;
}

function calculateAllNeighbors(state) {
    const nextState = JSON.parse(JSON.stringify(state));
    for (let r = 0; r < nextState.rows; r++) {
        for (let c = 0; c < nextState.cols; c++) {
            if (nextState.board[r][c].type === 'empty') {
                nextState.board[r][c].neighborMines = countNeighbourMines(nextState.board, r, c, nextState.rows, nextState.cols);
            }
        }
    }
    return nextState;
}

function countNeighbourMines(board, r, c, rows, cols) {
    const neighbours = getNeighbours(board, r, c, rows, cols);
    return neighbours.filter(cell => cell.type === 'mine').length;
}

function openCell(state, r, c) {
    if (state.status !== 'process') return state;

    let nextState = JSON.parse(JSON.stringify(state));
    let cell = nextState.board[r][c];

    if (cell.state === 'opened' || cell.state === 'flagged') return state;

    if (nextState.isFirstClick) {
        nextState.isFirstClick = false;
    }

    if (cell.type === 'mine') {
        cell.state = 'opened';
        nextState.status = 'lose';
        return revealMines(nextState, r, c);
    }

    cell.state = 'opened';

    if (cell.neighborMines === 0) {
        const neighbours = getNeighbours(nextState.board, r, c, nextState.rows, nextState.cols);
        neighbours.forEach(neighbour => {
            if (neighbour.state === 'closed') {
                nextState = openCell(nextState, neighbour.row, neighbour.col);
            }
        });
    }

    return checkWinCondition(nextState);
}

function checkWinCondition(state) {
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            if (state.board[r][c].type === 'empty' && state.board[r][c].state !== 'opened') {
                return state;
            }
        }
    }
    state.status = 'win';
    return state;
}

function revealMines(state, explodedRow, explodedCol) {
    state.board.forEach(row => {
        row.forEach(cell => {
            if (cell.type === 'mine') {
                cell.state = 'opened';
                if (cell.row === explodedRow && cell.col === explodedCol) {
                    cell.isExploded = true; // Маркер вибуху саме цієї клітинки
                }
            }
        });
    });
    return state;
}

function toggleFlag(state, row, col) {
    if (state.status !== 'process') return state;

    const nextState = JSON.parse(JSON.stringify(state));
    let cell = nextState.board[row][col];
    
    if (cell.state === 'opened') return state;

    if (cell.state === 'closed') {
        cell.state = 'flagged';
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
    }

    return nextState;
}

// ===================================================
// 2. ІНТЕГРАЦІЯ З DOM ТА ОБРОБКА ПОДІЙ (Лаба 3)
// ===================================================

let timerIntervalId = null;

/**
 * Рендеринг ігрового поля на основі об'єкта стану
 */
function renderBoard(state) {
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = ''; // Очищення перед перемальовкою

    // Оновлення хедера (Таймер та Лічильник прапорців)
    document.getElementById('timer-display').textContent = String(state.gameTime).padStart(3, '0');
    
    // Рахуємо прапорці
    let flaggedCount = 0;
    state.board.forEach(row => row.forEach(c => { if (c.state === 'flagged') flaggedCount++; }));
    const minesLeft = Math.max(0, state.minesCount - flaggedCount);
    document.getElementById('mines-display').textContent = String(minesLeft).padStart(3, '0');

    // Зміна емодзі на кнопці рестарту залежно від стану гри
    const resetBtn = document.getElementById('reset-btn');
    if (state.status === 'win') resetBtn.textContent = '😎';
    else if (state.status === 'lose') resetBtn.textContent = '😵';
    else resetBtn.textContent = '🙂';

    // Генерація DOM-елементів клітинок
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const cellData = state.board[r][c];
            const cellElement = document.createElement('button');
            cellElement.classList.add('cell');
            
            // Застосування стилей станів клітинок
            if (cellData.state === 'opened') {
                cellElement.classList.add('opened');
                if (cellData.type === 'mine') {
                    if (cellData.isExploded) {
                        cellElement.classList.add('mine-exploded');
                    } else {
                        cellElement.classList.add('mine');
                    }
                } else if (cellData.neighborMines > 0) {
                    cellElement.textContent = cellData.neighborMines;
                    cellElement.classList.add(`text-${cellData.neighborMines}`);
                }
            } else if (cellData.state === 'flagged') {
                cellElement.classList.add('flagged');
            }

            // Додаємо слухачі подій миші (Mouse Events)
            cellElement.addEventListener('click', () => handleCellLeftClick(r, c));
            cellElement.addEventListener('contextmenu', (e) => handleCellRightClick(e, r, c));

            boardElement.appendChild(cellElement);
        }
    }
}

/**
 * Обробка лівого кліку миші (відкриття клітинки)
 */
function handleCellLeftClick(r, c) {
    if (currentGameState.status !== 'process') return;

    // Запуск таймера при першому успішному кліку
    if (currentGameState.isFirstClick) {
        startDOMTimer();
    }

    currentGameState = openCell(currentGameState, r, c);
    renderBoard(currentGameState);

    if (currentGameState.status !== 'process') {
        stopDOMTimer();
    }
}

/**
 * Обробка правого кліку миші (встановлення прапорця)
 */
function handleCellRightClick(event, r, c) {
    event.preventDefault(); // Блокування стандартного контекстного меню браузера
    
    if (currentGameState.status !== 'process') return;

    currentGameState = toggleFlag(currentGameState, r, c);
    renderBoard(currentGameState);
}

/**
 * Логіка управління таймером застосунку
 */
function startDOMTimer() {
    if (timerIntervalId) return;
    timerIntervalId = setInterval(() => {
        if (currentGameState.status === 'process' && currentGameState.gameTime < 999) {
            currentGameState.gameTime++;
            document.getElementById('timer-display').textContent = String(currentGameState.gameTime).padStart(3, '0');
        } else {
            stopDOMTimer();
        }
    }, 1000);
}

function stopDOMTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

/**
 * Функція перезапуску гри (Кнопка Старт/Рестарт)
 */
function startNewGame() {
    stopDOMTimer();
    currentGameState = generateField(10, 10, 15);
    renderBoard(currentGameState);
}

// Ініціалізація та прив'язка кнопки рестарту при завантаженні
document.getElementById('reset-btn').addEventListener('click', startNewGame);

// Запуск першої гри
startNewGame();
