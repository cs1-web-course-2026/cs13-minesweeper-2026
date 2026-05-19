const board = document.querySelector('.board');
const timer = document.querySelector('.timer');
const flagCounter = document.querySelector('.flag-counter');
const startBtn = document.querySelector('.start-btn');

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
  gameBoard = [];

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

function renderBoard() {
  // КРОК 1: Повністю видаляємо абсолютно всі старі кнопки з поля перед новим рендером
  while (board.firstChild) {
    board.removeChild(board.firstChild);
  }

  // Налаштовуємо CSS Grid під розмір поля
  board.style.gridTemplateColumns = `repeat(${gameState.cols}, 30px)`;
  board.style.gridTemplateRows = `repeat(${gameState.rows}, 30px)`;

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cellData = gameBoard[r][c];
      const cellElement = document.createElement('button');

      // Очищаємо класи та текст, щоб нічого не лишалося з минулої гри
      cellElement.className = 'cell';
      cellElement.textContent = '';

      cellElement.dataset.row = r;
      cellElement.dataset.col = c;

      // Відображення візуального стану клітинки на основі Data Layer
      if (cellData.state === 'opened') {
        cellElement.classList.add('opened');
        if (cellData.type === 'mine') {
          cellElement.classList.add('mine');
          cellElement.textContent = '💣';
        } else if (cellData.neighborMines > 0) {
          cellElement.dataset.value = cellData.neighborMines;
          cellElement.textContent = cellData.neighborMines;
        }
      } else if (cellData.state === 'flagged') {
        cellElement.classList.add('flag');
        cellElement.textContent = '🚩';
      }

      cellElement.addEventListener('click', handleCellLeftClick);
      cellElement.addEventListener('contextmenu', handleCellRightClick);

      board.appendChild(cellElement);
    }
  }

  updateCounters();
}

function updateCounters() {
  timer.textContent = String(gameState.gameTime).padStart(3, '0');

  let usedFlags = 0;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameBoard[r][c].state === 'flagged') usedFlags++;
    }
  }
  const flagsLeft = gameState.minesCount - usedFlags;
  flagCounter.textContent = String(flagsLeft).padStart(3, '0');

  if (gameState.status === 'win') startBtn.textContent = '✅';
  else if (gameState.status === 'lose') startBtn.textContent = '❌';
  else startBtn.textContent = '▶';
}

function handleCellLeftClick(event) {
  if (gameState.status !== 'process') return;

  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  openCell(row, col);
  renderBoard();
}

function handleCellRightClick(event) {
  event.preventDefault();
  if (gameState.status !== 'process') return;

  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  toggleFlag(row, col);
  renderBoard();
}

startBtn.addEventListener('click', initGame);

function openCell(row, col) {
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols)
    return;

  let cell = gameBoard[row][col];
  if (cell.state === 'opened' || cell.state === 'flagged') return;

  cell.state = 'opened';

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    revealAllMines();
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

function toggleFlag(row, col) {
  let cell = gameBoard[row][col];
  if (cell.state === 'opened') return;

  cell.state = cell.state === 'closed' ? 'flagged' : 'closed';
}

function revealAllMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameBoard[r][c].type === 'mine') {
        gameBoard[r][c].state = 'opened';
      }
    }
  }
}

function checkWinCondition() {
  let openedCells = 0;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameBoard[r][c].state === 'opened') openedCells++;
    }
  }
  const totalSafeCells = gameState.rows * gameState.cols - gameState.minesCount;
  if (openedCells === totalSafeCells) {
    gameState.status = 'win';
    stopTimer();
  }
}

function startTimer() {
  if (gameState.timerId !== null) return;
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateCounters();
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
  renderBoard(); // Створюємо візуальне поле на старті гри [cite: 106]
}

initGame();
// console.log(gameBoard);
