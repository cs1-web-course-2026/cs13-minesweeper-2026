const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
  field: [],
  flagsUsed: 0
};

function generateField(rows, cols, minesCount) {
  gameState.field = [];
  for (let r = 0; r < rows; r++) {
    let row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        state: 'closed',
        neighborMines: 0
      });
    }
    gameState.field.push(row);
  }

  let plantedMines = 0;
  while (plantedMines < minesCount) {
    let r = Math.floor(Math.random() * rows);
    let c = Math.floor(Math.random() * cols);
    if (gameState.field[r][c].type !== 'mine') {
      gameState.field[r][c].type = 'mine';
      plantedMines++;
    }
  }
  countNeighbourMines();
}

function countNeighbourMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === 'mine') continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          let nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
            if (gameState.field[nr][nc].type === 'mine') count++;
          }
        }
      }
      gameState.field[r][c].neighborMines = count;
    }
  }
}

function renderGrid() {
  const grid = document.getElementById('game-grid');
  if (!grid) return;
  
  grid.style.gridTemplateColumns = `repeat(${gameState.cols}, 40px)`;
  grid.innerHTML = '';

  gameState.field.forEach((row, r) => {
    row.forEach((cell, c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cell closed';
      btn.setAttribute('data-row', r);
      btn.setAttribute('data-col', c);

      btn.onclick = () => { 
        openCell(r, c); 
        syncUI(); 
      };

      btn.oncontextmenu = (e) => {
        e.preventDefault();
        toggleFlag(r, c);
        syncUI();
      };

      grid.appendChild(btn);
    });
  });
}
function syncUI() {
  const flagsCountElem = document.getElementById('flags-count');
  if (flagsCountElem) {
    flagsCountElem.innerText = gameState.minesCount - gameState.flagsUsed;
  }
  gameState.field.forEach((row, r) => {
    row.forEach((cell, c) => {
      const btn = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (!btn) return;

      let label = `Клітинка ${r + 1}, ${c + 1}. `;

      if (cell.state === 'opened') {
        btn.className = 'cell open';
        btn.disabled = true;

        if (cell.type === 'mine') {
          btn.classList.add('bomb-red');
          btn.innerText = '💥';
          label += 'Міна. Вибух.';
        } else if (cell.neighborMines > 0) {
          btn.innerText = cell.neighborMines;
          btn.classList.add(`count-${cell.neighborMines}`); // Клас для стилізації кольору цифри
          label += `Кількість мін поруч: ${cell.neighborMines}`;
        } else {
          btn.innerText = '';
          label += 'Порожня відкрита клітинка';
        }
      } else if (cell.state === 'flagged') {
        btn.innerText = '🚩';
        label += 'Позначено прапорцем';
      } else {
        btn.innerText = '';
        btn.className = 'cell closed';
        btn.disabled = (gameState.status !== 'process');
        label += 'Закрито';
      }

      btn.setAttribute('aria-label', label);
    });
  });
}

function openCell(r, c) {
  const cell = gameState.field[r][c];
  if (cell.state !== 'closed' || gameState.status !== 'process') return;

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    revealAllMines();
    stopTimer();
    const msg = document.getElementById('game-message');
    if (msg) msg.textContent = '💥 Бум! Ви програли.';
    return;
  }

  cell.state = 'opened';

  // Рекурсивне відкриття сусідніх порожніх клітинок
  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        let nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          openCell(nr, nc);
        }
      }
    }
  }
  checkWin();
}

function toggleFlag(r, c) {
  const cell = gameState.field[r][c];
  if (cell.state === 'opened' || gameState.status !== 'process') return;

  if (cell.state === 'closed') {
    cell.state = 'flagged';
    gameState.flagsUsed++;
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
    gameState.flagsUsed--;
  }
}

function checkWin() {
  let win = true;
  gameState.field.forEach(row => row.forEach(cell => {
    if (cell.type === 'empty' && cell.state !== 'opened') win = false;
  }));

  if (win) {
    gameState.status = 'win';
    stopTimer();
    const messageElement = document.getElementById('game-message');
    if (messageElement) {
      messageElement.textContent = '🎉 Вітаємо! Ви перемогли!';
    }
    disableAllCells();
  }
}

function revealAllMines() {
  gameState.field.forEach(row => row.forEach(cell => {
    if (cell.type === 'mine') cell.state = 'opened';
  }));
}

function disableAllCells() {
  gameState.field.forEach(row => row.forEach(cell => {
    if (cell.state === 'closed') cell.state = 'disabled';
  }));
}

function startTimer() {
  stopTimer();
  gameState.gameTime = 0;
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    const mins = Math.floor(gameState.gameTime / 60).toString().padStart(2, '0');
    const secs = (gameState.gameTime % 60).toString().padStart(2, '0');
    const timerElem = document.getElementById('timer');
    if (timerElem) timerElem.innerText = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId) clearInterval(gameState.timerId);
}

function initGame() {
  stopTimer();
  gameState.gameTime = 0;
  gameState.flagsUsed = 0;
  gameState.status = 'process';
  
  const msg = document.getElementById('game-message');
  if (msg) msg.textContent = '';
  
  const timerElem = document.getElementById('timer');
  if (timerElem) timerElem.innerText = "00:00";
  
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  renderGrid();
  syncUI();
  startTimer();
}

window.onload = initGame;