const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
};

const NEIGHBOR_DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function createCell() {
  return {
    type: CELL_TYPE.EMPTY,
    neighborMines: 0,
    state: CELL_STATE.CLOSED,
  };
}

function createGameState({
  rows = 10,
  cols = 10,
  minesCount = 15,
} = {}) {
  return {
    rows,
    cols,
    minesCount,
    status: GAME_STATUS.PROCESS,
    gameTime: 0,
    timerId: null,
  };
}

function isInBounds(field, row, col) {
  return row >= 0 && col >= 0 && row < field.length && col < field[0].length;
}

function forEachCell(field, callback) {
  for (let row = 0; row < field.length; row++) {
    for (let col = 0; col < field[0].length; col++) {
      callback(field[row][col], row, col);
    }
  }
}

function generateEmptyField(rows, cols) {
  const field = [];

  for (let row = 0; row < rows; row++) {
    const rowCells = [];

    for (let col = 0; col < cols; col++) {
      rowCells.push(createCell());
    }

    field.push(rowCells);
  }

  return field;
}

function placeMines(field, minesCount) {
  const rows = field.length;
  const cols = field[0].length;
  const maxCells = rows * cols;
  const minesToPlace = Math.min(minesCount, maxCells);
  const minePositions = new Set();

  while (minePositions.size < minesToPlace) {
    const randomIndex = Math.floor(Math.random() * maxCells);
    minePositions.add(randomIndex);
  }

  for (const positionIndex of minePositions) {
    const row = Math.floor(positionIndex / cols);
    const col = positionIndex % cols;
    field[row][col].type = CELL_TYPE.MINE;
  }
}

function countNeighbourMines(field) {
  forEachCell(field, (cell, row, col) => {
    if (cell.type !== CELL_TYPE.EMPTY) {
      cell.neighborMines = 0;
      return;
    }

    let neighborMineCount = 0;

    for (const [directionalRow, directionalCol] of NEIGHBOR_DIRECTIONS) {
      const neighbourRow = row + directionalRow;
      const neighbourCol = col + directionalCol;

      if (!isInBounds(field, neighbourRow, neighbourCol)) {
        continue;
      }

      if (field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) {
        neighborMineCount++;
      }
    }

    cell.neighborMines = neighborMineCount;
  });
}

function generateField(rows, cols, minesCount) {
  const field = generateEmptyField(rows, cols);

  placeMines(field, minesCount);
  countNeighbourMines(field);

  return field;
}

function startTimer(gameState) {
  if (gameState.timerId !== null) {
    return;
  }

  gameState.timerId = setInterval(() => {
    gameState.gameTime += 1;
  }, 1000);
}

function stopTimer(gameState) {
  if (gameState.timerId === null) {
    return;
  }

  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function getNeighborCoordinates(field, row, col) {
  const coordinates = [];

  for (const [directionalRow, directionalCol] of NEIGHBOR_DIRECTIONS) {
    const neighbourRow = row + directionalRow;
    const neighbourCol = col + directionalCol;

    if (!isInBounds(field, neighbourRow, neighbourCol)) {
      continue;
    }

    coordinates.push([neighbourRow, neighbourCol]);
  }

  return coordinates;
}

function checkWinCondition(gameState, field) {
  if (gameState.status !== GAME_STATUS.PROCESS) {
    return false;
  }

  let unopenedSafeCells = 0;

  forEachCell(field, (cell) => {
    if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) {
      unopenedSafeCells++;
    }
  });

  if (unopenedSafeCells === 0) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer(gameState);
    return true;
  }

  return false;
}

function revealAllMines(field) {
  forEachCell(field, (cell) => {
    if (cell.type === CELL_TYPE.MINE) {
      cell.state = CELL_STATE.OPENED;
    }
  });
}

function openCell(gameState, field, row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS) {
    return;
  }

  if (!isInBounds(field, row, col)) {
    return;
  }

  const startCell = field[row][col];

  if (startCell.state === CELL_STATE.OPENED || startCell.state === CELL_STATE.FLAGGED) {
    return;
  }

  startTimer(gameState);

  if (startCell.type === CELL_TYPE.MINE) {
    startCell.state = CELL_STATE.OPENED;
    gameState.status = GAME_STATUS.LOSE;
    revealAllMines(field);
    stopTimer(gameState);
    return;
  }

  const stack = [[row, col]];

  while (stack.length > 0) {
    const [currentRow, currentCol] = stack.pop();
    const currentCell = field[currentRow][currentCol];

    if (currentCell.state === CELL_STATE.OPENED || currentCell.state === CELL_STATE.FLAGGED) {
      continue;
    }

    if (currentCell.type === CELL_TYPE.MINE) {
      continue;
    }

    currentCell.state = CELL_STATE.OPENED;

    if (currentCell.neighborMines !== 0) {
      continue;
    }

    for (const [neighbourRow, neighbourCol] of getNeighborCoordinates(field, currentRow, currentCol)) {
      const neighbourCell = field[neighbourRow][neighbourCol];

      if (neighbourCell.state !== CELL_STATE.CLOSED) {
        continue;
      }

      if (neighbourCell.type === CELL_TYPE.MINE) {
        continue;
      }

      stack.push([neighbourRow, neighbourCol]);
    }
  }

  checkWinCondition(gameState, field);
}

function toggleFlag(gameState, field, row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS) {
    return;
  }

  if (!isInBounds(field, row, col)) {
    return;
  }

  const cell = field[row][col];

  if (cell.state === CELL_STATE.OPENED) {
    return;
  }

  startTimer(gameState);

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
    return;
  }

  if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }
}

function resetGame(gameState, fieldOptions) {
  stopTimer(gameState);

  gameState.rows = fieldOptions?.rows ?? gameState.rows;
  gameState.cols = fieldOptions?.cols ?? gameState.cols;
  gameState.minesCount = fieldOptions?.minesCount ?? gameState.minesCount;
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.timerId = null;

  return generateField(gameState.rows, gameState.cols, gameState.minesCount);
}

window.MinesweeperLogic = {
  CELL_TYPE,
  CELL_STATE,
  GAME_STATUS,
  createGameState,
  generateField,
  countNeighbourMines,
  openCell,
  toggleFlag,
  startTimer,
  stopTimer,
  checkWinCondition,
  resetGame,
};

(() => {
  const { CELL_TYPE: CT, CELL_STATE: CS, GAME_STATUS: GS } = window.MinesweeperLogic;

  const $timer = document.getElementById('timer');
  const $flagsLeft = document.getElementById('flags-left');
  const $restart = document.getElementById('restart');
  const $board = document.getElementById('board');
  const $banner = document.getElementById('banner');

  if (!$timer || !$flagsLeft || !$restart || !$board || !$banner) {
    return;
  }

  const gameState = window.MinesweeperLogic.createGameState({
    rows: 10,
    cols: 10,
    minesCount: 15,
  });

  gameState.field = window.MinesweeperLogic.generateField(gameState.rows, gameState.cols, gameState.minesCount);
  gameState.uiTimerId = null;
  gameState.hitKey = null;
  gameState.firstMoveDone = false;

  function cellKey(row, col) {
    return `${row}:${col}`;
  }

  function formatTime(totalSeconds) {
    const safe = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function countFlagsPlaced(currentField) {
    let count = 0;
    for (let r = 0; r < currentField.length; r++) {
      for (let c = 0; c < currentField[0].length; c++) {
        if (currentField[r][c].state === CS.FLAGGED) {
          count++;
        }
      }
    }
    return count;
  }

  function getCellAriaLabel(cell, row, col) {
    const rowHuman = row + 1;
    const colHuman = col + 1;
    let cellStateLabel = 'закрита клітинка';

    if (cell.state === CS.FLAGGED) {
      cellStateLabel = 'клітинка з прапорцем';
    } else if (cell.state === CS.OPENED) {
      if (cell.type === CT.MINE) {
        cellStateLabel = 'міна';
      } else if (cell.neighborMines > 0) {
        cellStateLabel = `відкрита клітинка, сусідніх мін: ${cell.neighborMines}`;
      } else {
        cellStateLabel = 'відкрита порожня клітинка';
      }
    }

    return `Рядок ${rowHuman}, стовпчик ${colHuman}, ${cellStateLabel}`;
  }

  function setBanner(text, variant) {
    $banner.textContent = text || '';
    $banner.classList.toggle('banner--win', variant === 'win');
    $banner.classList.toggle('banner--lose', variant === 'lose');
  }

  function updateHeader() {
    $timer.textContent = formatTime(gameState.gameTime);
    const flagsPlaced = countFlagsPlaced(gameState.field);
    const left = Math.max(0, gameState.minesCount - flagsPlaced);
    $flagsLeft.textContent = String(left);

    if (gameState.status === GS.PROCESS) {
      $restart.textContent = 'Рестарт';
    } else {
      $restart.textContent = 'Старт';
    }
  }

  function ensureUiTimer() {
    if (gameState.uiTimerId !== null) return;
    gameState.uiTimerId = setInterval(() => {
      updateHeader();
    }, 200);
  }

  function stopUiTimer() {
    if (gameState.uiTimerId === null) return;
    clearInterval(gameState.uiTimerId);
    gameState.uiTimerId = null;
  }

  function renderBoard() {
    $board.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;
    const frag = document.createDocumentFragment();

    for (let row = 0; row < gameState.rows; row++) {
      for (let col = 0; col < gameState.cols; col++) {
        const cell = gameState.field[row][col];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell';
        btn.dataset.row = String(row);
        btn.dataset.col = String(col);
        btn.setAttribute('aria-label', getCellAriaLabel(cell, row, col));

        if (cell.state === CS.CLOSED) {
          btn.classList.add('cell--closed');
        } else if (cell.state === CS.FLAGGED) {
          btn.classList.add('cell--flag');
        } else {
          btn.classList.add('cell--open');

          if (cell.type === CT.MINE) {
            btn.classList.add(cellKey(row, col) === gameState.hitKey ? 'cell--mine-hit' : 'cell--mine');
          } else if (cell.neighborMines > 0) {
            btn.textContent = String(cell.neighborMines);
            btn.classList.add(`cell--n${Math.min(8, cell.neighborMines)}`);
          } else {
            btn.textContent = '';
          }
        }

        btn.disabled = gameState.status !== GS.PROCESS && cell.state !== CS.OPENED;
        frag.appendChild(btn);
      }
    }

    $board.replaceChildren(frag);
  }

  function syncEndState() {
    if (gameState.status === GS.WIN) {
      setBanner('Перемога. Всі безпечні клітинки відкриті.', 'win');
      stopUiTimer();
      return;
    }

    if (gameState.status === GS.LOSE) {
      setBanner('Поразка. Ви підірвалися на міні.', 'lose');
      stopUiTimer();
      return;
    }

    setBanner('', null);
    ensureUiTimer();
  }

  function restart() {
    gameState.hitKey = null;
    gameState.firstMoveDone = false;
    gameState.field = window.MinesweeperLogic.resetGame(gameState, {
      rows: gameState.rows,
      cols: gameState.cols,
      minesCount: gameState.minesCount,
    });
    updateHeader();
    renderBoard();
    syncEndState();
  }

  function getCellCoordsFromEventTarget(target) {
    const el = target && target.closest ? target.closest('.cell') : null;
    if (!el) return null;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
    return { row, col };
  }

  function canPlaceMoreFlags() {
    const flagsPlaced = countFlagsPlaced(gameState.field);
    return flagsPlaced < gameState.minesCount;
  }

  function ensureSafeFirstMove(row, col) {
    if (gameState.firstMoveDone) {
      return;
    }

    const clickedCell = gameState.field[row]?.[col];

    if (!clickedCell) {
      return;
    }

    if (clickedCell.type !== CT.MINE) {
      return;
    }

    for (let attempt = 0; attempt < 50; attempt++) {
      const nextField = window.MinesweeperLogic.generateField(gameState.rows, gameState.cols, gameState.minesCount);

      if (nextField[row][col].type !== CT.MINE) {
        gameState.field = nextField;

        return;
      }
    }

    gameState.field[row][col].type = CT.EMPTY;
    window.MinesweeperLogic.countNeighbourMines(gameState.field);
  }

  $restart.addEventListener('click', () => {
    restart();
  });

  $board.addEventListener('contextmenu', (e) => {
    const coords = getCellCoordsFromEventTarget(e.target);
    if (!coords) return;
    e.preventDefault();
  });

  $board.addEventListener('mousedown', (e) => {
    const coords = getCellCoordsFromEventTarget(e.target);
    if (!coords) return;

    if (gameState.status !== GS.PROCESS) return;

    if (e.button === 0) {
      const beforeStatus = gameState.status;
      ensureSafeFirstMove(coords.row, coords.col);
      const cell = gameState.field[coords.row][coords.col];

      window.MinesweeperLogic.openCell(gameState, gameState.field, coords.row, coords.col);
      gameState.firstMoveDone = true;

      if (beforeStatus === GS.PROCESS && gameState.status === GS.LOSE && cell.type === CT.MINE) {
        gameState.hitKey = cellKey(coords.row, coords.col);
      }

      updateHeader();
      renderBoard();
      syncEndState();
      return;
    }

    if (e.button === 2) {
      const cell = gameState.field[coords.row][coords.col];
      if (cell.state === CS.CLOSED && !canPlaceMoreFlags()) return;

      window.MinesweeperLogic.toggleFlag(gameState, gameState.field, coords.row, coords.col);
      updateHeader();
      renderBoard();
      syncEndState();
    }
  });

  updateHeader();
  renderBoard();
  syncEndState();
})();
