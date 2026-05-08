
const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const CELL_CONTENT = {
  MINE: 'mine',
  EMPTY: 'empty',
};

const DIFFICULTY = {
  easy:   { rows: 8,  cols: 8,  mines: 10 },
  medium: { rows: 12, cols: 12, mines: 20 },
  hard:   { rows: 16, cols: 16, mines: 40 },
};

const gameState = {
  rows: 8,
  cols: 8,
  mineCount: 10,
  status: GAME_STATUS.PLAYING,
  time: 0,
  board: [],
  intervalId: null,
  firstClick: true, 
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
        type: CELL_CONTENT.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0,
      });
    }
    board.push(rowCells);
  }
  return board;
}

function placeMines(board, mineCount, safeRow, safeCol) {
  const rows = board.length;
  const cols = board[0].length;
  let placed = 0;

  while (placed < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    // гарантуємо що перша клітинка та сусіди безпечні
    if (Math.abs(row - safeRow) <= 1 && Math.abs(col - safeCol) <= 1) continue;

    if (board[row][col].type !== CELL_CONTENT.MINE) {
      board[row][col].type = CELL_CONTENT.MINE;
      placed += 1;
    }
  }
}

function countNeighbourMines(board) {
  const rows = board.length;
  const cols = board[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].type === CELL_CONTENT.MINE) {
        board[row][col].neighborMines = 0;
        continue;
      }
      let count = 0;
      for (let neighbourRow = Math.max(0, row - 1); neighbourRow <= Math.min(rows - 1, row + 1); neighbourRow++) {
        for (let neighbourCol = Math.max(0, col - 1); neighbourCol <= Math.min(cols - 1, col + 1); neighbourCol++) {
          if (neighbourRow === row && neighbourCol === col) continue;
          if (board[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE) count += 1;
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
      const cellElement = document.createElement('button');
      cellElement.type = 'button';
      cellElement.classList.add('cell');
      cellElement.dataset.row = row;
      cellElement.dataset.col = col;
      cellElement.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, ${cell.state}`);

      if (cell.state === CELL_STATE.CLOSED) {
        cellElement.classList.add('closed');
        cellElement.textContent = '';
      } else if (cell.state === CELL_STATE.FLAGGED) {
        cellElement.classList.add('flagged');
        cellElement.textContent = '🚩';
      } else if (cell.state === CELL_STATE.OPENED) {
        cellElement.classList.add('opened');
        if (cell.type === CELL_CONTENT.MINE) {
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
  if (gameState.status !== GAME_STATUS.PLAYING) return;

  // генерація мін після першого кліку
  if (gameState.firstClick) {
    placeMines(gameState.board, gameState.mineCount, row, col);
    countNeighbourMines(gameState.board);
    gameState.firstClick = false;
    startTimer();
  }

  openCell(row, col);
  refreshUI();
}

function handleCellRightClick(row, col) {
  if (gameState.status !== GAME_STATUS.PLAYING) return;
  toggleFlag(row, col);
  refreshUI();
}

function openCell(row, col) {
  const cell = gameState.board[row][col];
  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

  if (cell.type === CELL_CONTENT.MINE) {
    cell.state = CELL_STATE.OPENED;
    gameState.status = GAME_STATUS.LOST;
    stopTimer();
    revealMines();
    return;
  }

  cell.state = CELL_STATE.OPENED;

  if (cell.neighborMines === 0) {
    for (let neighbourRow = Math.max(0, row - 1); neighbourRow <= Math.min(gameState.rows - 1, row + 1); neighbourRow++) {
      for (let neighbourCol = Math.max(0, col - 1); neighbourCol <= Math.min(gameState.cols - 1, col + 1); neighbourCol++) {
        if (neighbourRow === row && neighbourCol === col) continue;
        openCell(neighbourRow, neighbourCol);
      }
    }
  }

  checkWinCondition();
}

function toggleFlag(row, col) {
  const cell = gameState.board[row][col];
  if (cell.state === CELL_STATE.OPENED) return;
  cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
}

function revealMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.board[row][col];
      if (cell.type === CELL_CONTENT.MINE) {
        cell.state = CELL_STATE.OPENED;
      }
    }
  }
}

function checkWinCondition() {
  let allSafeOpened = true;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.board[row][col];
      if (cell.type === CELL_CONTENT.EMPTY && cell.state !== CELL_STATE.OPENED) {
        allSafeOpened = false;
      }
    }
  }

  if (allSafeOpened && gameState.status === GAME_STATUS.PLAYING) {
    gameState.status = GAME_STATUS.WON;
    stopTimer();
  }
}

function startTimer() {
  stopTimer();
  gameState.intervalId = setInterval(() => {
    if (gameState.status !== GAME_STATUS.PLAYING) return;
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
  if (gameState.status === GAME_STATUS.WON) statusElement.classList.add('status-win');
  if (gameState.status === GAME_STATUS.LOST) statusElement.classList.add('status-lose');
  timerElement.textContent = gameState.time;
  mineCountElement.textContent = gameState.mineCount;
  renderBoard();
}

function setDifficulty(value) {
  const diff = DIFFICULTY[value];
  gameState.rows = diff.rows;
  gameState.cols = diff.cols;
  gameState.mineCount = diff.m
