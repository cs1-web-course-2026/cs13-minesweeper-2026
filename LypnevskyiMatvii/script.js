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
