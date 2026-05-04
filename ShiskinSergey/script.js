const ROWS = 10;
const COLS = 10;
const MINES_COUNT = 5;
const GAME_STATUS = {
  READY: 'ready',
  RUNNING: 'running',
  WON: 'won',
  LOST: 'lost',
};

/** @typedef {{ index:number, row:number, col:number, isMine:boolean, isOpen:boolean, isFlagged:boolean, adjacentMines:number }} Cell */

const timerEl = document.getElementById('timer');
const flagsEl = document.getElementById('flags-count');
const newGameButtonEl = document.getElementById('new-game');
const startRestartButtonEl = document.getElementById('start-restart');
const buttonEls = [newGameButtonEl, startRestartButtonEl].filter(Boolean);
const gridEl = document.getElementById('grid');
const messageEl = document.getElementById('message');

/** @type {Cell[]} */
const gameState = {
  board: [],
  status: GAME_STATUS.READY,
  flagsAvailable: MINES_COUNT,
  openedSafeCount: 0,
  timerId: null,
  seconds: 0,
};

function setMessage(text, kind) {
  if (!text) {
    messageEl.textContent = '';
    messageEl.className = 'message message--hidden';
    return;
  }
  messageEl.textContent = text;
  messageEl.className = `message message--${kind ?? 'info'}`;
}

function updateHud() {
  timerEl.textContent = String(gameState.seconds);
  flagsEl.textContent = String(gameState.flagsAvailable);
  if (buttonEls.length) {
    const label = gameState.status === GAME_STATUS.RUNNING ? 'Рестарт' : 'Старт';
    buttonEls.forEach((btn) => {
      btn.textContent = label;
    });
  }
}

function stopTimer() {
  if (gameState.timerId) window.clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function startTimer() {
  stopTimer();
  gameState.timerId = window.setInterval(() => {
    gameState.seconds += 1;
    timerEl.textContent = String(gameState.seconds);
  }, 1000);
}

function indexToRowCol(index) {
  return { row: Math.floor(index / COLS), col: index % COLS };
}

function rowColToIndex(row, col) {
  return row * COLS + col;
}

function neighborsOf(index) {
  const { row, col } = indexToRowCol(index);
  const result = [];
  for (let dRow = -1; dRow <= 1; dRow += 1) {
    for (let dCol = -1; dCol <= 1; dCol += 1) {
      if (dRow === 0 && dCol === 0) continue;
      const neighborRow = row + dRow;
      const neighborCol = col + dCol;
      if (neighborRow < 0 || neighborRow >= ROWS || neighborCol < 0 || neighborCol >= COLS) continue;
      result.push(rowColToIndex(neighborRow, neighborCol));
    }
  }
  return result;
}

function shuffledIndices(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createBoard() {
  const total = ROWS * COLS;
  const mineSet = new Set(shuffledIndices(total).slice(0, MINES_COUNT));

  gameState.board = Array.from({ length: total }, (_, index) => {
    const { row, col } = indexToRowCol(index);
    return {
      index,
      row,
      col,
      isMine: mineSet.has(index),
      isOpen: false,
      isFlagged: false,
      adjacentMines: 0,
    };
  });

  gameState.board.forEach((cell) => {
    if (cell.isMine) return;
    const minesAround = neighborsOf(cell.index).reduce((acc, ni) => acc + (gameState.board[ni].isMine ? 1 : 0), 0);
    cell.adjacentMines = minesAround;
  });
}

function renderGridFromBoard() {
  gridEl.style.setProperty('--cols', String(COLS));
  gridEl.innerHTML = '';

  const frag = document.createDocumentFragment();
  gameState.board.forEach((cell) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell cell--closed';
    btn.dataset.index = String(cell.index);
    btn.setAttribute('aria-label', getCellAriaLabel(cell));
    frag.appendChild(btn);
  });
  gridEl.appendChild(frag);
}

function getCellEl(index) {
  return gridEl.querySelector(`.cell[data-index="${index}"]`);
}

function getCellAriaLabel(cell) {
  const rowHuman = cell.row + 1;
  const colHuman = cell.col + 1;

  if (!cell.isOpen && cell.isFlagged) {
    return `Клітинка ${rowHuman},${colHuman}, позначена прапорцем`;
  }
  if (!cell.isOpen) {
    return `Клітинка ${rowHuman},${colHuman}, закрита`;
  }
  if (cell.isMine) {
    return `Клітинка ${rowHuman},${colHuman}, міна`;
  }
  if (cell.adjacentMines > 0) {
    return `Клітинка ${rowHuman},${colHuman}, відкрита, мін поруч: ${cell.adjacentMines}`;
  }
  return `Клітинка ${rowHuman},${colHuman}, відкрита, порожня`;
}

function applyCellToDom(cell) {
  const el = getCellEl(cell.index);
  if (!el) return;

  el.textContent = '';

  if (cell.isOpen) {
    el.className = 'cell cell--open';
    if (cell.isMine) {
      el.className = 'cell cell--mine';
      el.setAttribute('aria-label', getCellAriaLabel(cell));
      return;
    }
    if (cell.adjacentMines > 0) {
      el.textContent = String(cell.adjacentMines);
    }
    el.setAttribute('aria-label', getCellAriaLabel(cell));
    return;
  }

  if (cell.isFlagged) {
    el.className = 'cell cell--flag';
    el.setAttribute('aria-label', getCellAriaLabel(cell));
    return;
  }

  el.className = 'cell cell--closed';
  el.setAttribute('aria-label', getCellAriaLabel(cell));
}

function applyAllToDom() {
  gameState.board.forEach(applyCellToDom);
}

function endGame(newStatus) {
  gameState.status = newStatus;
  stopTimer();
  updateHud();
}

function revealMines(hitIndex) {
  gameState.board.forEach((cell) => {
    if (!cell.isMine) return;
    cell.isOpen = true;
  });
  applyAllToDom();

  const hitEl = getCellEl(hitIndex);
  if (hitEl) hitEl.className = 'cell cell--mine-hit';
}

function openCellRecursive(startIndex) {
  const queue = [startIndex];
  const visited = new Set();

  while (queue.length) {
    const idx = queue.shift();
    if (idx == null) break;
    if (visited.has(idx)) continue;
    visited.add(idx);

    const cell = gameState.board[idx];
    if (cell.isOpen || cell.isFlagged) continue;
    if (cell.isMine) continue;

    cell.isOpen = true;
    gameState.openedSafeCount += 1;
    applyCellToDom(cell);

    if (cell.adjacentMines === 0) {
      neighborsOf(idx).forEach((n) => {
        if (!visited.has(n)) queue.push(n);
      });
    }
  }
}

function checkWin() {
  const safeCells = ROWS * COLS - MINES_COUNT;
  return gameState.openedSafeCount === safeCells;
}

function startNewGame() {
  stopTimer();
  gameState.seconds = 0;
  gameState.status = GAME_STATUS.READY;
  gameState.flagsAvailable = MINES_COUNT;
  gameState.openedSafeCount = 0;
  setMessage('', 'info');

  createBoard();
  renderGridFromBoard();
  applyAllToDom();
  updateHud();
}

function ensureRunning() {
  if (gameState.status === GAME_STATUS.READY) {
    gameState.status = GAME_STATUS.RUNNING;
    startTimer();
    updateHud();
  }
}

gridEl.addEventListener('click', (e) => {
  const el = e.target.closest('.cell');
  if (!el) return;
  const index = Number(el.dataset.index);
  if (!Number.isFinite(index)) return;

  if (gameState.status === GAME_STATUS.WON || gameState.status === GAME_STATUS.LOST) return;
  ensureRunning();

  const cell = gameState.board[index];
  if (cell.isOpen || cell.isFlagged) return;

  if (cell.isMine) {
    revealMines(index);
    setMessage('Поразка: ви натрапили на міну.', 'lose');
    endGame(GAME_STATUS.LOST);
    return;
  }

  openCellRecursive(index);

  if (checkWin()) {
    setMessage('Перемога: всі безпечні клітинки відкриті!', 'win');
    endGame(GAME_STATUS.WON);
  }
});

gridEl.addEventListener('contextmenu', (e) => {
  const el = e.target.closest('.cell');
  if (!el) return;
  e.preventDefault();

  const index = Number(el.dataset.index);
  if (!Number.isFinite(index)) return;

  if (gameState.status === GAME_STATUS.WON || gameState.status === GAME_STATUS.LOST) return;
  ensureRunning();

  const cell = gameState.board[index];
  if (cell.isOpen) return;

  if (cell.isFlagged) {
    cell.isFlagged = false;
    gameState.flagsAvailable += 1;
    applyCellToDom(cell);
    updateHud();
    return;
  }

  if (gameState.flagsAvailable <= 0) return;
  cell.isFlagged = true;
  gameState.flagsAvailable -= 1;
  applyCellToDom(cell);
  updateHud();
});

buttonEls.forEach((btn) => {
  btn.addEventListener('click', () => {
    startNewGame();
  });
});

startNewGame();

