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
  const rows = field.length;
  const cols = field[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {

      if (field[r][c].type === 'mine') continue;

      let count = 0;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {

          const nr = r + dr;
          const nc = c + dc;

          if (
            nr >= 0 && nr < rows &&
            nc >= 0 && nc < cols &&
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

    document.getElementById("status").textContent = "Game Over";
   
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

function checkWin() {
  let openedCells = 0;

  gameState.field.forEach(row => {
    row.forEach(cell => {
      if (cell.state === "opened") {
        openedCells++;
      }
    });
  });

  const totalSafeCells =
    gameState.rows * gameState.cols - gameState.minesCount;

  if (openedCells === totalSafeCells) {
    gameState.status = "win";
    stopTimer();
    document.getElementById("status").textContent = "You Win!";
  }
}

function renderField() {
  const fieldEl = document.getElementById("field");
  fieldEl.innerHTML = "";

  const flaggedCount = gameState.field
    .flat()
    .filter(cell => cell.state === "flagged").length;

  document.getElementById("flags").textContent =
    gameState.minesCount - flaggedCount;

  gameState.field.forEach((row, r) => {
    row.forEach((cell, c) => {
      const button = document.createElement("button");

      button.type = "button";
      button.classList.add("cell", cell.state);

      button.setAttribute(
        "aria-label",
        `Cell ${r + 1}-${c + 1}`
      );

      if (cell.state === "opened" && cell.type === "mine") {
        button.classList.add("mine");
      }

      if (cell.state === "flagged") {
        button.classList.add("flag");
      }

      if (
        cell.state === "opened" &&
        cell.type !== "mine" &&
        cell.neighborMines > 0
      ) {
        button.textContent = cell.neighborMines;

        button.classList.add(
          `number-${cell.neighborMines}`
        );
      }

      button.addEventListener("click", () => {
        if (gameState.status !== "process") return;

        openCell(gameState.field, r, c);
        checkWin();
        renderField();
      });

      button.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        if (gameState.status !== "process") return;

        toggleFlag(gameState.field, r, c);
        renderField();
      });

      fieldEl.appendChild(button);
    });
  });
}

/* -------------------- СТАРТ -------------------- */

function initGame() {
  stopTimer();

  gameState.field = generateField(
    gameState.rows,
    gameState.cols,
    gameState.minesCount
  );

  countNeighbourMines(gameState.field);

  gameState.gameTime = 0;
  gameState.status = 'process';

  document.getElementById("timer").textContent = 0;
  document.getElementById("status").textContent = "";

  renderField();
  startTimer();
}

/* запуск */
document.getElementById("restart").addEventListener("click", () => {
  initGame();
});

initGame();