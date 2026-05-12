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

function openCell(r, c) {
  const cell = gameState.field[r][c];
  if (cell.state !== 'closed' || gameState.status !== 'process') return;
  if (cell.type === 'mine') {
    gameState.status = 'lose';
    revealAllMines();
    stopTimer();
    const msg = document.getElementById('game-message');
    if (msg) msg.textContent = '💥 БУМ! Ви програли.';
    return;
  }

  cell.state = 'opened';
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
  updateUI();
}

function updateUI() {
  const flagsCountElem = document.getElementById('flags-count');
  if (flagsCountElem) flagsCountElem.innerText = gameState.minesCount - gameState.flagsUsed;
  
  const grid = document.getElementById('game-grid');
  if (!grid) return;
  
  grid.style.gridTemplateColumns = `repeat(${gameState.cols}, 40px)`;
  grid.innerHTML = '';

  gameState.field.forEach((row, r) => {
    row.forEach((cell, c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cell ' + (cell.state === 'opened' ? 'open' : 'closed');
      let label = `Клітинка ${r + 1}, ${c + 1}. `;
      if (cell.state === 'opened') {
        label += cell.type === 'mine' ? 'Міна' : `Сусідів: ${cell.neighborMines}`;
      } else if (cell.state === 'flagged') {
        label += 'Прапорець';
      }
      btn.setAttribute('aria-label', label);

      if (cell.state === 'opened') {
        if (cell.type === 'mine') {
          btn.classList.add('bomb-red');
          btn.innerText = '💥';
        } else if (cell.neighborMines > 0) {
          btn.innerText = cell.neighborMines;
        }
        btn.disabled = true;
      } else if (cell.state === 'flagged') {
        btn.innerText = '🚩';
      }

      btn.onclick = () => { openCell(r, c); updateUI(); };
      btn.oncontextmenu = (e) => {
        e.preventDefault();
        toggleFlag(r, c);
        updateUI();
      };
      grid.appendChild(btn);
    });
  });
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
      messageElement.textContent = '🎉 Ви перемогли!';
    }
  }
}

function revealAllMines() {
  gameState.field.forEach(row => row.forEach(cell => {
    if (cell.type === 'mine') cell.state = 'opened';
  }));
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
  startTimer();
  updateUI();
}
window.onload = initGame;