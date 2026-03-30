// Стан гри
const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process', // 'process' | 'win' | 'lose'
  gameTime: 0,
  timerId: null,
};

let field = [];

// Генерація поля 
function generateField(rows, cols, minesCount) {
  if (minesCount < 0 || minesCount >= rows * cols) {
    throw new Error(`minesCount (${minesCount}) must be between 0 and ${rows * cols - 1}`);
  }

  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: 'empty',
      neighborMines: 0,
      state: 'closed',
    }))
  );

  // Розстановка мін без дублікатів
  let placed = 0;
  while (placed < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (grid[r][c].type !== 'mine') {
      grid[r][c].type = 'mine';
      placed++;
    }
  }

  return grid;
}

// Допоміжна: отримати список сусідів 
function getNeighbors(grid, row, col) {
  if (grid.length === 0) return [];

  const rows = grid.length;
  const cols = grid[0].length;
  const neighbors = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push({ cell: grid[nr][nc], row: nr, col: nc });
      }
    }
  }

  return neighbors;
}

// Підрахунок мін-сусідів 
function countNeighbourMines(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c].type === 'mine') continue;
      grid[r][c].neighborMines = getNeighbors(grid, r, c)
        .filter(({ cell }) => cell.type === 'mine')
        .length;
    }
  }
}

// Перевірка умови перемоги 
function checkWin(grid) {
  return grid.every(row =>
    row.every(cell =>
      cell.type === 'mine'
        ? cell.state !== 'opened'
        : cell.state === 'opened'
    )
  );
}

// Відкриття клітинки (з рекурсією для порожніх зон) 
function openCell(grid, row, col, isRecursive = false) {
  if (gameState.status !== 'process') return;
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return;

  const cell = grid[row][col];
  if (cell.state === 'opened' || cell.state === 'flagged') return;

  cell.state = 'opened';

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    stopTimer();
    return;
  }

  // Рекурсивне розкриття для клітинок без сусідніх мін
  if (cell.neighborMines === 0) {
    getNeighbors(grid, row, col).forEach(({ row: nr, col: nc }) => {
      openCell(grid, nr, nc, true);
    });
  }

  // Перевіряємо перемогу лише після завершення всього рекурсивного дерева
  if (!isRecursive && checkWin(grid)) {
    gameState.status = 'win';
    stopTimer();
  }
}

// Прапорці 
function toggleFlag(row, col) {
  if (gameState.status !== 'process') return;
  if (row < 0 || row >= field.length || col < 0 || col >= field[0].length) return;
  const cell = field[row][col];
  if (cell.state === 'opened') return;
  cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
}

// Таймер 
function startTimer() {
  stopTimer();
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

// Ініціалізація / рестарт гри 

function initGame() {
  stopTimer();
  gameState.status = 'process';
  gameState.gameTime = 0;
  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(field);
  startTimer();
}