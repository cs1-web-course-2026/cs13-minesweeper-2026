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
      return;
  }

  cell.state = 'opened'; // 
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
  } else {
      cell.state = 'closed';
      gameState.flagsUsed--;
  }
  updateUI();
}
function updateUI() {
  document.getElementById('flags-count').innerText = gameState.minesCount - gameState.flagsUsed;
  const grid = document.getElementById('game-grid');
  grid.style.gridTemplateColumns = `repeat(${gameState.cols}, 40px)`;
  grid.innerHTML = '';

  gameState.field.forEach((row, r) => {
      row.forEach((cell, c) => {
          const div = document.createElement('div');
          div.className = 'cell ' + (cell.state === 'opened' ? 'open' : 'closed');
          
          if (cell.state === 'opened') {
              if (cell.type === 'mine') {
                  div.classList.add('bomb-red');
                  div.innerText = '💥';
              } else if (cell.neighborMines > 0) {
                  div.innerText = cell.neighborMines;
              }
          } else if (cell.state === 'flagged') {
              div.innerText = '🚩';
          }

          div.onclick = () => { openCell(r, c); updateUI(); };
          div.oncontextmenu = (e) => { e.preventDefault(); toggleFlag(r, c); updateUI(); };
          grid.appendChild(div);
      });
  });
}

function startTimer() { 
  stopTimer();
  gameState.timerId = setInterval(() => {
      gameState.gameTime++;
      const mins = Math.floor(gameState.gameTime / 60).toString().padStart(2, '0');
      const secs = (gameState.gameTime % 60).toString().padStart(2, '0');
      document.getElementById('timer').innerText = `${mins}:${secs}`;
  }, 1000);
}
function stopTimer() { clearInterval(gameState.timerId); } // [cite: 53]

function checkWin() {
  let win = true;
  gameState.field.forEach(row => row.forEach(cell => {
      if (cell.type === 'empty' && cell.state !== 'opened') win = false;
  }));
  if (win) {
      gameState.status = 'win';
      stopTimer();
      alert('Ви перемогли!');
  }
}

function revealAllMines() {
  gameState.field.forEach(row => row.forEach(cell => {
      if (cell.type === 'mine') cell.state = 'opened';
  }));
}
function initGame() {
  gameState.gameTime = 0;
  gameState.flagsUsed = 0;
  document.getElementById('timer').innerText = "00:00";
  generateField(gameState.rows, gameState.cols, gameState.minesCount);
  gameState.status = 'process';
  startTimer();
  updateUI();
}

initGame();