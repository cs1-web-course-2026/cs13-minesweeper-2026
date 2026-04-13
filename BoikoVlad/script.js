const gameState = {
  rows: 9,
  cols: 9,
  minesCount: 10,
  status: 'process',
  gameTime: 0,
  timerId: null,
  field: []
};

/* -------------------- ГЕНЕРАЦІЯ ПОЛЯ -------------------- */

function generateField(rows, cols, minesCount) {
  const field = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty',
        neighborMines: 0,
        state: 'closed'
      });
    }
    field.push(row);
  }

  let placed = 0;

  while (placed < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (field[r][c].type !== 'mine') {
      field[r][c].type = 'mine';
      placed++;
    }
  }

  return field;
}

/* -------------------- ПІДРАХУНОК МІН -------------------- */

function countNeighbourMines(field) {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {

      if (field[r][c].type === 'mine') continue;

      let count = 0;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {

          const nr = r + dr;
          const nc = c + dc;

          if (
            nr >= 0 && nr < gameState.rows &&
            nc >= 0 && nc < gameState.cols &&
            field[nr][nc].type === 'mine'
          ) {
            count++;
          }
        }
      }

      field[r][c].neighborMines = count;
    }
  }
}

/* -------------------- ВІДКРИТТЯ КЛІТИНКИ -------------------- */

function openCell(field, r, c) {
  const cell = field[r][c];

  if (cell.state === 'opened' || cell.state === 'flagged') return;

  cell.state = 'opened';

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    stopTimer();
    alert("Game Over");
    return;
  }

  if (cell.neighborMines > 0) return;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {

      const nr = r + dr;
      const nc = c + dc;

      if (
        nr >= 0 && nr < gameState.rows &&
        nc >= 0 && nc < gameState.cols
      ) {
        openCell(field, nr, nc);
      }
    }
  }
}

/* -------------------- ПРАПОР -------------------- */

function toggleFlag(field, r, c) {
  const cell = field[r][c];

  if (cell.state === 'opened') return;

  cell.state = cell.state === 'flagged'
    ? 'closed'
    : 'flagged';
}

/* -------------------- ТАЙМЕР -------------------- */

function startTimer() {
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    document.getElementById("timer").textContent = gameState.gameTime;
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
}

/* -------------------- РЕНДЕР ПОЛЯ -------------------- */

function renderField() {
  const fieldEl = document.getElementById("field");
  fieldEl.innerHTML = "";

  const flaggedCount = gameState.field.flat().filter(cell => cell.state === 'flagged').length;
  document.getElementById("flags").textContent = gameState.minesCount - flaggedCount;

  gameState.field.forEach((row, r) => {
    row.forEach((cell, c) => {

      const div = document.createElement("div");
      div.classList.add("cell", cell.state);

      if (cell.state === "opened" && cell.type === "mine") {
        div.classList.add("mine");
      }

      if (cell.state === "flagged") {
        div.classList.add("flag");
      }

      // ЛКМ
      div.addEventListener("click", () => {
        if (gameState.status !== 'process') return;
        openCell(gameState.field, r, c);
        renderField();
      });

      // ПКМ
      div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (gameState.status !== 'process') return;
        toggleFlag(gameState.field, r, c);
        renderField();
      });

      fieldEl.appendChild(div);

    });
  });
}

/* -------------------- СТАРТ -------------------- */

function initGame() {
  gameState.field = generateField(
    gameState.rows,
    gameState.cols,
    gameState.minesCount
  );

  countNeighbourMines(gameState.field);

  gameState.gameTime = 0;
  gameState.status = 'process';

  renderField();
  startTimer();
}

/* кнопка рестарта */
document.getElementById("restart").addEventListener("click", () => {
  stopTimer();
  initGame();
});

/* запуск */
initGame();