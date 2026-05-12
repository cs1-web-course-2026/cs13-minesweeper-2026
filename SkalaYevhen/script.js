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

const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const gameState = {
  rows: 15,
  cols: 15,
  minesCount: 30,
  flagsPlaced: 0,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: [],
  isFirstClick: true // Відстежуємо перший хід
};

let boardElement, timerDisplay, minesDisplay, startBtn;

document.addEventListener('DOMContentLoaded', () => {
  boardElement = document.getElementById('game-board');
  const displays = document.querySelectorAll('.digital-display');
  minesDisplay = displays[0];
  timerDisplay = displays[1];
  startBtn = document.querySelector('.start-btn');

  startBtn.addEventListener('click', initGame);

  // Патерн Делегування подій: один слухач на все поле
  boardElement.addEventListener('click', (e) => {
    if (gameState.status !== GAME_STATUS.PROCESS) return;
    const cellBtn = e.target.closest('.cell');
    if (!cellBtn) return;

    const row = parseInt(cellBtn.dataset.row, 10);
    const col = parseInt(cellBtn.dataset.col, 10);
    handleLeftClick(row, col);
  });

  boardElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameState.status !== GAME_STATUS.PROCESS) return;
    const cellBtn = e.target.closest('.cell');
    if (!cellBtn) return;

    const row = parseInt(cellBtn.dataset.row, 10);
    const col = parseInt(cellBtn.dataset.col, 10);
    toggleFlag(row, col);
  });

  initGame();
});

function initGame() {
  clearInterval(gameState.timerId);
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.timerId = null;
  gameState.isFirstClick = true;
  gameState.flagsPlaced = 0;

  if (timerDisplay) timerDisplay.textContent = '000';
  updateMinesDisplay();

  const messageEl = document.getElementById('game-message');
  if (messageEl) {
    messageEl.textContent = '';
    messageEl.classList.remove('show'); 
  }

  // Створюємо порожнє логічне поле (без мін)
  gameState.field = [];
  for (let row = 0; row < gameState.rows; row++) {
    const rowArray = [];
    for (let col = 0; col < gameState.cols; col++) {
      rowArray.push({ type: CELL_TYPE.EMPTY, neighborMines: 0, state: CELL_STATE.CLOSED });
    }
    gameState.field.push(rowArray);
  }

  renderInitialBoard();
}

// Генеруємо DOM елементи лише 1 раз
function renderInitialBoard() {
  boardElement.innerHTML = '';
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cellButton = document.createElement('button');
      cellButton.type = 'button';
      cellButton.classList.add('cell', 'closed');
      
      // Зберігаємо координати в data-атрибутах
      cellButton.dataset.row = row;
      cellButton.dataset.col = col;
      cellButton.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, closed`);
      
      boardElement.appendChild(cellButton);
    }
  }
}

// Функція-помічник для роботи з сусідніми клітинками (вимога з рев'ю)
function forEachNeighbor(row, col, callback) {
  for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
    for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
      if (directionalRow === 0 && directionalCol === 0) continue;

      const neighbourRow = row + directionalRow;
      const neighbourCol = col + directionalCol;

      if (neighbourRow >= 0 && neighbourRow < gameState.rows && neighbourCol >= 0 && neighbourCol < gameState.cols) {
        callback(neighbourRow, neighbourCol);
      }
    }
  }
}

// Міни розташовуються так, щоб не потрапити на перший клік
function placeMinesAndCalculate(firstRow, firstCol) {
  let minesPlaced = 0;
  while (minesPlaced < gameState.minesCount) {
    const row = Math.floor(Math.random() * gameState.rows);
    const col = Math.floor(Math.random() * gameState.cols);
    
    // Перевірка, щоб міна не з'явилася на першій відкритій клітинці
    if (gameState.field[row][col].type !== CELL_TYPE.MINE && !(row === firstRow && col === firstCol)) {
      gameState.field[row][col].type = CELL_TYPE.MINE;
      minesPlaced++;
    }
  }

  // Обчислення сусідніх мін
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === CELL_TYPE.MINE) continue;
      
      let count = 0;
      forEachNeighbor(row, col, (neighbourRow, neighbourCol) => {
        if (gameState.field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) {
          count++;
        }
      });
      gameState.field[row][col].neighborMines = count;
    }
  }
}

function handleLeftClick(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state !== CELL_STATE.CLOSED) return; 

  // Логіка першого кліку
  if (gameState.isFirstClick) {
    gameState.isFirstClick = false;
    placeMinesAndCalculate(row, col);
    startTimer();
  }

  openCell(row, col);
  checkWin();
}

function openCell(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state !== CELL_STATE.CLOSED) return;

  cell.state = CELL_STATE.OPENED;
  updateCellDOM(row, col); 

  if (cell.type === CELL_TYPE.MINE) {
    gameOver(GAME_STATUS.LOSE);
    return;
  }

  // Рекурсивне відкриття пустих клітинок
  if (cell.neighborMines === 0) {
    forEachNeighbor(row, col, (neighbourRow, neighbourCol) => {
      openCell(neighbourRow, neighbourCol);
    });
  }
}

function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPENED) return;

  if (cell.state === CELL_STATE.CLOSED) {
    if (gameState.flagsPlaced >= gameState.minesCount) return; 
    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsPlaced++;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsPlaced--;
  }
  
  updateCellDOM(row, col);
  updateMinesDisplay();
}

// Оновлюємо візуальний стан конкретної кнопки
function updateCellDOM(row, col) {
  const cell = gameState.field[row][col];
  const index = row * gameState.cols + col;
  const cellButton = boardElement.children[index]; 

  // Скидаємо попередні класи та контент
  cellButton.className = 'cell';
  cellButton.textContent = '';
  cellButton.removeAttribute('data-number');

  if (cell.state === CELL_STATE.CLOSED) {
    cellButton.classList.add('closed');
    cellButton.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, closed`);
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cellButton.classList.add('flagged');
    cellButton.textContent = '🚩';
    cellButton.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, flagged`);
  } else if (cell.state === CELL_STATE.OPENED) {
    cellButton.classList.add('open');
    cellButton.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, opened`);
    
    if (cell.type === CELL_TYPE.MINE) {
      cellButton.classList.add('clicked-mine');
      cellButton.textContent = '💣';
    } else if (cell.neighborMines > 0) {
      cellButton.dataset.number = cell.neighborMines;
      cellButton.textContent = cell.neighborMines;
    }
  }
}

function updateMinesDisplay() {
  if (minesDisplay) {
    minesDisplay.textContent = String(
      gameState.minesCount - gameState.flagsPlaced
    ).padStart(3, '0');
  }
}

function startTimer() {
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    if (timerDisplay) {
      timerDisplay.textContent = String(
        Math.min(gameState.gameTime, 999)
      ).padStart(3, '0');
    }
  }, 1000);
}

function checkWin() {
  if (gameState.status !== GAME_STATUS.PROCESS) return;
  let closedEmptyCells = 0;
  
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === CELL_TYPE.EMPTY && gameState.field[row][col].state !== CELL_STATE.OPENED) {
        closedEmptyCells++;
      }
    }
  }
  
  if (closedEmptyCells === 0) {
    gameOver(GAME_STATUS.WIN);
  }
}

function gameOver(status) {
  gameState.status = status;
  clearInterval(gameState.timerId);

  // Відкриваємо всі міни у разі поразки
  if (status === GAME_STATUS.LOSE) {
     for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
           const cell = gameState.field[row][col];
           if (cell.type === CELL_TYPE.MINE && cell.state !== CELL_STATE.FLAGGED) {
               cell.state = CELL_STATE.OPENED;
               updateCellDOM(row, col);
           }
        }
     }
  }

  const message = status === GAME_STATUS.WIN
    ? 'Вітаємо! Ви перемогли!'
    : 'Ви підірвалися на міні! Гра закінчена.';

  const messageEl = document.getElementById('game-message');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.classList.add('show'); 
  }
}