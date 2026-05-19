const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
};

let gameBoard = [];

function generateField(rows, cols, minesCount) {
  for (let i = 0; i < rows; i++) {
    let row = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        type: 'empty',
        state: 'closed',
        neighborMines: 0,
      });
    }
    gameBoard.push(row);
  }

  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    let i = Math.floor(Math.random() * rows);
    let j = Math.floor(Math.random() * cols);

    if (gameBoard[i][j].type !== 'mine') {
      gameBoard[i][j].type = 'mine';
      minesPlaced++;
    }
  }
  countNeighbourMines();
}

function countNeighbourMines() {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameBoard[r][c].type === 'mine') continue;

      let minesCount = 0;
      for (let [dr, dc] of directions) {
        let nr = r + dr;
        let nc = c + dc;

        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          if (gameBoard[nr][nc].type === 'mine') {
            minesCount++;
          }
        }
      }
      gameBoard[r][c].neighborMines = minesCount;
    }
  }
}

function openCell(row, col) {
  if (
    row < 0 ||
    row >= gameState.rows ||
    col < 0 ||
    col >= gameState.cols ||
    gameState.status !== 'process'
  ) {
    return;
  }

  let cell = gameBoard[row][col];

  if (cell.state === 'opened' || cell.state === 'flagged') {
    return;
  }

  cell.state = 'opened';

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    stopTimer();
    return;
  }

  checkWinCondition();

  if (cell.neighborMines === 0) {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (let [dr, dc] of directions) {
      openCell(row + dr, col + dc);
    }
  }
}

function checkWinCondition() {
  let openedCells = 0;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameBoard[r][c].state === 'opened') {
        openedCells++;
      }
    }
  }

  const totalSafeCells = gameState.rows * gameState.cols - gameState.minesCount;
  if (openedCells === totalSafeCells) {
    gameState.status = 'win';
    stopTimer();
  }
}

function toggleFlag(row, col) {
  if (gameState.status !== 'process') return;

  let cell = gameBoard[row][col];

  if (cell.state === 'opened') {
    return;
  }

  if (cell.state === 'closed') {
    cell.state = 'flagged';
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
  }
}

function startTimer() {
  if (gameState.timerId !== null) return;

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function initGame() {
  gameState.status = 'process';
  gameState.gameTime = 0;
  stopTimer();
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  startTimer();
}

initGame();
console.log(gameBoard);
