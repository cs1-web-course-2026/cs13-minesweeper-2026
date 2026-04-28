const CELL_CONTENT = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_TYPE = CELL_CONTENT;

const CELL_STATE = {
  CLOSED: 'closed',
  OPEN: 'open',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const NEIGHBOR_DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function createCell() {
  return {
    type: CELL_CONTENT.EMPTY,
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
    status: GAME_STATUS.IDLE,
    gameTime: 0,
    timerId: null,
  };
}


function isInBounds(field, row, col) {
  if (!Array.isArray(field) || field.length === 0) {
    return false;
  }

  if (!Array.isArray(field[0]) || field[0].length === 0) {
    return false;
  }

  return row >= 0 && col >= 0 && row < field.length && col < field[0].length;
}


function forEachCell(field, callback) {
  if (!Array.isArray(field) || field.length === 0) {
    return;
  }

  if (!Array.isArray(field[0]) || field[0].length === 0) {
    return;
  }

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
  if (!Array.isArray(field) || field.length === 0) {
    return;
  }

  if (!Array.isArray(field[0]) || field[0].length === 0) {
    return;
  }

  if (minesCount <= 0) {
    return;
  }

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
    field[row][col].type = CELL_CONTENT.MINE;
  }
}


function countNeighborMines(field) {
  forEachCell(field, (cell, row, col) => {
    if (cell.type !== CELL_CONTENT.EMPTY) {
      cell.neighborMines = 0;

      return;
    }

    let neighborMineCount = 0;

    for (const [directionalRow, directionalCol] of NEIGHBOR_DIRECTIONS) {
      const neighborRow = row + directionalRow;
      const neighborCol = col + directionalCol;

      if (!isInBounds(field, neighborRow, neighborCol)) {
        continue;
      }

      if (field[neighborRow][neighborCol].type === CELL_CONTENT.MINE) {
        neighborMineCount++;
      }
    }

    cell.neighborMines = neighborMineCount;
  });
}


function generateField(rows, cols, minesCount) {
  const safeRows = Math.max(0, rows);
  const safeCols = Math.max(0, cols);
  const field = generateEmptyField(safeRows, safeCols);

  placeMines(field, Math.max(0, minesCount));
  countNeighborMines(field);

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
    const neighborRow = row + directionalRow;
    const neighborCol = col + directionalCol;

    if (!isInBounds(field, neighborRow, neighborCol)) {
      continue;
    }

    coordinates.push([neighborRow, neighborCol]);
  }

  return coordinates;
}


function checkWinCondition(gameState, field) {
  if (gameState.status !== GAME_STATUS.PLAYING) {
    return false;
  }

  let unopenedSafeCells = 0;

  forEachCell(field, (cell) => {
    if (cell.type === CELL_CONTENT.EMPTY && cell.state !== CELL_STATE.OPEN) {
      unopenedSafeCells++;
    }
  });

  if (unopenedSafeCells === 0) {
    gameState.status = GAME_STATUS.WON;
    stopTimer(gameState);

    return true;
  }

  return false;
}


function revealAllMines(field) {
  forEachCell(field, (cell) => {
    if (cell.type === CELL_CONTENT.MINE) {
      cell.state = CELL_STATE.OPEN;
    }
  });
}


function openCell(gameState, field, row, col) {
  if (gameState.status === GAME_STATUS.WON || gameState.status === GAME_STATUS.LOST) {
    return;
  }

  if (!isInBounds(field, row, col)) {
    return;
  }

  const startCell = field[row][col];

  if (startCell.state === CELL_STATE.OPEN || startCell.state === CELL_STATE.FLAGGED) {
    return;
  }

  if (gameState.status === GAME_STATUS.IDLE) {
    gameState.status = GAME_STATUS.PLAYING;
    startTimer(gameState);
  }

  if (startCell.type === CELL_CONTENT.MINE) {
    startCell.state = CELL_STATE.OPEN;
    gameState.status = GAME_STATUS.LOST;
    revealAllMines(field);
    stopTimer(gameState);

    return;
  }

  const stack = [[row, col]];

  while (stack.length > 0) {
    const [currentRow, currentCol] = stack.pop();
    const currentCell = field[currentRow][currentCol];

    if (currentCell.state === CELL_STATE.OPEN || currentCell.state === CELL_STATE.FLAGGED) {
      continue;
    }

    if (currentCell.type === CELL_CONTENT.MINE) {
      continue;
    }

    currentCell.state = CELL_STATE.OPEN;

    if (currentCell.neighborMines !== 0) {
      continue;
    }

    for (const [neighborRow, neighborCol] of getNeighborCoordinates(field, currentRow, currentCol)) {
      const neighborCell = field[neighborRow][neighborCol];

      if (neighborCell.state !== CELL_STATE.CLOSED) {
        continue;
      }

      if (neighborCell.type === CELL_CONTENT.MINE) {
        continue;
      }

      stack.push([neighborRow, neighborCol]);
    }
  }

  checkWinCondition(gameState, field);
}


function toggleFlag(gameState, field, row, col) {
  if (gameState.status === GAME_STATUS.WON || gameState.status === GAME_STATUS.LOST) {
    return;
  }

  if (!isInBounds(field, row, col)) {
    return;
  }

  const cell = field[row][col];

  if (cell.state === CELL_STATE.OPEN) {
    return;
  }

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
  gameState.status = GAME_STATUS.IDLE;
  gameState.gameTime = 0;
  gameState.timerId = null;

  return generateField(gameState.rows, gameState.cols, gameState.minesCount);
}

const MINESWEEPER_LOGIC_EXPORT = {
  CELL_CONTENT,
  CELL_TYPE,
  CELL_STATE,
  GAME_STATUS,
  createGameState,
  generateField,
  countNeighborMines,
  openCell,
  toggleFlag,
  startTimer,
  stopTimer,
  checkWinCondition,
  resetGame,
};

if (typeof window !== 'undefined') {
  window.MinesweeperLogic = MINESWEEPER_LOGIC_EXPORT;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MINESWEEPER_LOGIC_EXPORT;
}
