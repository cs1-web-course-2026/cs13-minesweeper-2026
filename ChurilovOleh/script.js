const GAME_STATUS = { PROCESS: 'process', WIN: 'win', LOSE: 'lose' };
const CELL_STATE = { CLOSED: 'closed', OPENED: 'opened', FLAGGED: 'flagged' };
const CELL_TYPE = { EMPTY: 'empty', MINE: 'mine' };

let currentGameState = null;
let timerIntervalId = null;

const domElements = {
    board: document.getElementById('game-board'),
    timer: document.getElementById('timer-display'),
    mines: document.getElementById('mines-display'),
    resetBtn: document.getElementById('reset-btn'),
    statusScreen: document.getElementById('game-message')
};

function createInitialState(rows = 10, cols = 10, minesCount = 15) {
    return {
        rows,
        cols,
        minesCount,
        status: GAME_STATUS.PROCESS,
        gameTime: 0,
        board: [],
        isFirstClick: true
    };
}

function generateField(rows, cols, minesCount) {
    const newState = createInitialState(rows, cols, minesCount);
    const board = [];

    for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        let row = [];
        for (let colIdx = 0; colIdx < cols; colIdx++) {
            row.push({
                type: CELL_TYPE.EMPTY,
                state: CELL_STATE.CLOSED,
                neighborMines: 0,
                row: rowIdx,
                col: colIdx
            });
        }
        board.push(row);
    }

    let minesPlanted = 0;
    while (minesPlanted < minesCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (board[randomRow][randomCol].type !== CELL_TYPE.MINE) {
            board[randomRow][randomCol].type = CELL_TYPE.MINE;
            minesPlanted++;
        }
    }

    newState.board = board;
    return calculateAllNeighbors(newState);
}

function getNeighbours(board, r, c, rows, cols) {
    const neighbours = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
            if (rowOffset === 0 && colOffset === 0) continue;
            const newRow = r + rowOffset;
            const newCol = c + colOffset;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                neighbours.push(board[newRow][newCol]);
            }
        }
    }
    return neighbours;
}

function calculateAllNeighbors(state) {
    const nextState = JSON.parse(JSON.stringify(state));
    for (let rowIdx = 0; rowIdx < nextState.rows; rowIdx++) {
        for (let colIdx = 0; colIdx < nextState.cols; colIdx++) {
            if (nextState.board[rowIdx][colIdx].type === CELL_TYPE.EMPTY) {
                nextState.board[rowIdx][colIdx].neighborMines = countNeighbourMines(nextState.board, rowIdx, colIdx, nextState.rows, nextState.cols);
            }
        }
    }
    return nextState;
}

function countNeighbourMines(board, r, c, rows, cols) {
    const neighbours = getNeighbours(board, r, c, rows, cols);
    return neighbours.filter(cell => cell.type === CELL_TYPE.MINE).length;
}

function openCell(state, r, c) {
    if (state.status !== GAME_STATUS.PROCESS) return state;

    let nextState = JSON.parse(JSON.stringify(state));
    let cell = nextState.board[r][c];

    if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return state;

    if (nextState.isFirstClick) {
        nextState.isFirstClick = false;
    }

    if (cell.type === CELL_TYPE.MINE) {
        cell.state = CELL_STATE.OPENED;
        nextState.status = GAME_STATUS.LOSE;
        return revealMines(nextState, r, c);
    }

    cell.state = CELL_STATE.OPENED;

    if (cell.neighborMines === 0) {
        const neighbours = getNeighbours(nextState.board, r, c, nextState.rows, nextState.cols);
        neighbours.forEach(neighbour => {
            if (neighbour.state === CELL_STATE.CLOSED) {
                nextState = openCell(nextState, neighbour.row, neighbour.col);
            }
        });
    }

    return checkWinCondition(nextState);
}

function checkWinCondition(state) {
    for (let rowIdx = 0; rowIdx < state.rows; rowIdx++) {
        for (let colIdx = 0; colIdx < state.cols; colIdx++) {
            if (state.board[rowIdx][colIdx].type === CELL_TYPE.EMPTY && state.board[rowIdx][colIdx].state !== CELL_STATE.OPENED) {
                return state;
            }
        }
    }
    state.status = GAME_STATUS.WIN;
    return state;
}

function revealMines(state, explodedRow, explodedCol) {
    state.board.forEach(row => {
        row.forEach(cell => {
            if (cell.type === CELL_TYPE.MINE) {
                cell.state = CELL_STATE.OPENED;
                if (cell.row === explodedRow && cell.col === explodedCol) {
                    cell.isExploded = true;
                }
            }
        });
    });
    return state;
}

function toggleFlag(state, row, col) {
    if (state.status !== GAME_STATUS.PROCESS) return state;

    const nextState = JSON.parse(JSON.stringify(state));
    let cell = nextState.board[row][col];
    
    if (cell.state === CELL_STATE.OPENED) return state;

    cell.state = cell.state === CELL_STATE.CLOSED ? CELL_STATE.FLAGGED : CELL_STATE.CLOSED;
    return nextState;
}

function renderBoard(state) {
    if (!domElements.board) return;
    domElements.board.innerHTML = ''; 

    domElements.timer.textContent = String(state.gameTime).padStart(3, '0');
    
    let flaggedCount = 0;
    state.board.forEach(row => row.forEach(c => { if (c.state === CELL_STATE.FLAGGED) flaggedCount++; }));
    const minesLeft = Math.max(0, state.minesCount - flaggedCount);
    domElements.mines.textContent = String(minesLeft).padStart(3, '0');

    if (state.status === GAME_STATUS.WIN) {
        domElements.resetBtn.textContent = '😎';
        if (domElements.statusScreen) domElements.statusScreen.textContent = "Гра завершена. Ви перемогли!";
    } else if (state.status === GAME_STATUS.LOSE) {
        domElements.resetBtn.textContent = '😵';
        if (domElements.statusScreen) domElements.statusScreen.textContent = "Гра завершена. Ви підірвалися на міні.";
    } else {
        domElements.resetBtn.textContent = '🙂';
        if (domElements.statusScreen) domElements.statusScreen.textContent = "Гра триває.";
    }

    for (let rowIdx = 0; rowIdx < state.rows; rowIdx++) {
        for (let colIdx = 0; colIdx < state.cols; colIdx++) {
            const cellData = state.board[rowIdx][colIdx];
            const cellElement = document.createElement('button');
            cellElement.classList.add('cell');
            
            cellElement.setAttribute('aria-label', `Клітинка: рядок ${rowIdx + 1}, стовпець ${colIdx + 1}. Стан: закрита.`);
            
            if (cellData.state === CELL_STATE.OPENED) {
                cellElement.classList.add('opened');
                if (cellData.type === CELL_TYPE.MINE) {
                    if (cellData.isExploded) {
                        cellElement.classList.add('mine-exploded');
                        cellElement.setAttribute('aria-label', `Рядок ${rowIdx + 1}, стовпець ${colIdx + 1}. Вибух міни!`);
                    } else {
                        cellElement.classList.add('mine');
                        cellElement.setAttribute('aria-label', `Рядок ${rowIdx + 1}, стовпець ${colIdx + 1}. Міна.`);
                    }
                } else if (cellData.neighborMines > 0) {
                    cellElement.textContent = cellData.neighborMines;
                    cellElement.classList.add(`text-${cellData.neighborMines}`);
                    cellElement.setAttribute('aria-label', `Рядок ${rowIdx + 1}, стовпець ${colIdx + 1}. Відкрито, мін навколо: ${cellData.neighborMines}.`);
                } else {
                    cellElement.setAttribute('aria-label', `Рядок ${rowIdx + 1}, стовпець ${colIdx + 1}. Відкрито, порожня клітинка.`);
                }
            } else if (cellData.state === CELL_STATE.FLAGGED) {
                cellElement.classList.add('flagged');
                cellElement.setAttribute('aria-label', `Рядок ${rowIdx + 1}, стовпець ${colIdx + 1}. Встановлено прапорець.`);
            }

            cellElement.addEventListener('click', () => handleCellLeftClick(rowIdx, colIdx));
            cellElement.addEventListener('contextmenu', (e) => handleCellRightClick(e, rowIdx, colIdx));

            domElements.board.appendChild(cellElement);
        }
    }
}

function handleCellLeftClick(r, c) {
    if (currentGameState.status !== GAME_STATUS.PROCESS) return;

    if (currentGameState.isFirstClick) {
        currentGameState.isFirstClick = false;
        startDOMTimer();
    }

    currentGameState = openCell(currentGameState, r, c);
    renderBoard(currentGameState);

    if (currentGameState.status !== GAME_STATUS.PROCESS) {
        stopDOMTimer();
    }
}

function handleCellRightClick(event, r, c) {
    event.preventDefault();
    if (currentGameState.status !== GAME_STATUS.PROCESS) return;

    currentGameState = toggleFlag(currentGameState, r, c);
    renderBoard(currentGameState);
}

function startDOMTimer() {
    if (timerIntervalId) return;
    timerIntervalId = setInterval(() => {
        if (currentGameState.status === GAME_STATUS.PROCESS && currentGameState.gameTime < 999) {
            currentGameState.gameTime++;
            domElements.timer.textContent = String(currentGameState.gameTime).padStart(3, '0');
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

function startNewGame() {
    stopDOMTimer();
    currentGameState = generateField(10, 10, 15);
    renderBoard(currentGameState);
}

if (domElements.resetBtn) {
    domElements.resetBtn.addEventListener('click', startNewGame);
}

startNewGame();
