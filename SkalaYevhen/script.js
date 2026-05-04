const gameState = {
  rows: 15,
  cols: 15,
  minesCount: 30,
  flagsPlaced: 0,
  status: 'process',
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
    if (gameState.status !== 'process') return;
    const cellBtn = e.target.closest('.cell');
    if (!cellBtn) return;

    const r = parseInt(cellBtn.dataset.r, 10);
    const c = parseInt(cellBtn.dataset.c, 10);
    handleLeftClick(r, c);
  });

  boardElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameState.status !== 'process') return;
    const cellBtn = e.target.closest('.cell');
    if (!cellBtn) return;

    const r = parseInt(cellBtn.dataset.r, 10);
    const c = parseInt(cellBtn.dataset.c, 10);
    toggleFlag(r, c);
  });

  initGame();
});

function initGame() {
  clearInterval(gameState.timerId);
  gameState.status = 'process';
  gameState.gameTime = 0;
  gameState.timerId = null;
  gameState.isFirstClick = true;
  gameState.flagsPlaced = 0;

  if (timerDisplay) timerDisplay.textContent = '000';
  updateMinesDisplay();

  const messageEl = document.getElementById('game-message');
  if (messageEl) messageEl.textContent = '';

  // Створюємо порожнє логічне поле (без мін)
  gameState.field = [];
  for (let r = 0; r < gameState.rows; r++) {
    const row = [];
    for (let c = 0; c < gameState.cols; c++) {
      row.push({ type: 'empty', neighborMines: 0, state: 'closed' });
    }
    gameState.field.push(row);
  }

  renderInitialBoard();
}

// Генеруємо DOM елементи лише 1 раз
function renderInitialBoard() {
  boardElement.innerHTML = '';
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cellButton = document.createElement('button');
      cellButton.type = 'button';
      cellButton.classList.add('cell', 'closed');
      
      // Зберігаємо координати в data-атрибутах
      cellButton.dataset.r = r;
      cellButton.dataset.c = c;
      cellButton.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, closed`);
      
      boardElement.appendChild(cellButton);
    }
  }
}

// Міни розташовуються так, щоб не потрапити на перший клік
function placeMinesAndCalculate(firstRow, firstCol) {
  let minesPlaced = 0;
  while (minesPlaced < gameState.minesCount) {
    const r = Math.floor(Math.random() * gameState.rows);
    const c = Math.floor(Math.random() * gameState.cols);
    
    // Перевірка, щоб міна не з'явилася на першій відкритій клітинці
    if (gameState.field[r][c].type !== 'mine' && !(r === firstRow && c === firstCol)) {
      gameState.field[r][c].type = 'mine';
      minesPlaced++;
    }
  }

  // Обчислення сусідніх мін
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === 'mine') continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
            if (gameState.field[nr][nc].type === 'mine') count++;
          }
        }
      }
      gameState.field[r][c].neighborMines = count;
    }
  }
}

function handleLeftClick(r, c) {
  const cell = gameState.field[r][c];
  if (cell.state !== 'closed') return; // Ігноруємо відкриті або з прапорцем

  // Логіка першого кліку
  if (gameState.isFirstClick) {
    gameState.isFirstClick = false;
    placeMinesAndCalculate(r, c);
    startTimer();
  }

  openCell(r, c);
  checkWin();
}

function openCell(r, c) {
  const cell = gameState.field[r][c];
  if (cell.state !== 'closed') return;

  cell.state = 'opened';
  updateCellDOM(r, c); // Точкове оновлення замість повного перемальовування

  if (cell.type === 'mine') {
    gameOver('lose');
    return;
  }

  // Рекурсивне відкриття пустих клітинок
  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          openCell(nr, nc);
        }
      }
    }
  }
}

function toggleFlag(r, c) {
  const cell = gameState.field[r][c];
  if (cell.state === 'opened') return;

  if (cell.state === 'closed') {
    if (gameState.flagsPlaced >= gameState.minesCount) return; // Захист від перевищення ліміту прапорців
    cell.state = 'flagged';
    gameState.flagsPlaced++;
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
    gameState.flagsPlaced--;
  }
  
  updateCellDOM(r, c);
  updateMinesDisplay();
}

// Оновлюємо візуальний стан конкретної кнопки
function updateCellDOM(r, c) {
  const cell = gameState.field[r][c];
  const index = r * gameState.cols + c;
  const cellButton = boardElement.children[index]; // Знаходимо елемент через його індекс

  // Скидаємо попередні класи та контент
  cellButton.className = 'cell';
  cellButton.textContent = '';
  cellButton.removeAttribute('data-number');

  if (cell.state === 'closed') {
    cellButton.classList.add('closed');
    cellButton.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, closed`);
  } else if (cell.state === 'flagged') {
    cellButton.classList.add('flagged');
    cellButton.textContent = '🚩';
    cellButton.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, flagged`);
  } else if (cell.state === 'opened') {
    cellButton.classList.add('open');
    cellButton.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, opened`);
    
    if (cell.type === 'mine') {
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
  if (gameState.status !== 'process') return;
  let closedEmptyCells = 0;
  
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === 'empty' && gameState.field[r][c].state !== 'opened') {
        closedEmptyCells++;
      }
    }
  }
  
  if (closedEmptyCells === 0) {
    gameOver('win');
  }
}

function gameOver(status) {
  gameState.status = status;
  clearInterval(gameState.timerId);

  // Відкриваємо всі міни у разі поразки
  if (status === 'lose') {
     for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
           const cell = gameState.field[r][c];
           if (cell.type === 'mine' && cell.state !== 'flagged') {
               cell.state = 'opened';
               updateCellDOM(r, c);
           }
        }
     }
  }

  const message = status === 'win'
    ? 'Вітаємо! Ви перемогли!'
    : 'Ви підірвалися на міні! Гра закінчена.';

  const messageEl = document.getElementById('game-message');
  if (messageEl) {
    messageEl.textContent = message;
  }
}