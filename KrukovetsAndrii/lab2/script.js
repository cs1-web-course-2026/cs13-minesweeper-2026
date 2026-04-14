const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: "process",
  gameTime: 0,
  timerId: null
};

let field = [];
let openedCount = 0;
let flaggedCount = 0;
const boardEl = document.querySelector("#board");
const timerEl = document.querySelector("#timer");
const flagsEl = document.querySelector("#flags");
const startBtnEl = document.querySelector("#startBtn");

function formatCounter(value) {
  return String(value).padStart(3, "0");
}

function isInBounds(row, col) {
  return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

function getNeighbours(row, col) {
  const neighbours = [];
  for (let dRow = -1; dRow <= 1; dRow += 1) {
    for (let dCol = -1; dCol <= 1; dCol += 1) {
      if (dRow === 0 && dCol === 0) continue;
      const nRow = row + dRow;
      const nCol = col + dCol;
      if (isInBounds(nRow, nCol)) neighbours.push([nRow, nCol]);
    }
  }
  return neighbours;
}

function generateField(rows, cols, minesCount) {
  const nextField = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: "empty",
      neighborMines: 0,
      state: "closed"
    }))
  );

  let minesPlaced = 0;
  while (minesPlaced < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (nextField[row][col].type === "mine") continue;
    nextField[row][col].type = "mine";
    minesPlaced += 1;
  }
  return nextField;
}

function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      if (field[row][col].type === "mine") continue;
      let minesAround = 0;
      for (const [nRow, nCol] of getNeighbours(row, col)) {
        if (field[nRow][nCol].type === "mine") minesAround += 1;
      }
      field[row][col].neighborMines = minesAround;
    }
  }
}

function startTimer() {
  if (gameState.timerId !== null) return;
  gameState.timerId = setInterval(() => {
    gameState.gameTime += 1;
    renderCounters();
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId === null) return;
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function revealAllMines(triggeredRow, triggeredCol) {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = field[row][col];
      if (cell.type !== "mine") continue;
      cell.state = row === triggeredRow && col === triggeredCol ? "triggeredMine" : "mine";
    }
  }
}

function checkWin() {
  const totalSafeCells = gameState.rows * gameState.cols - gameState.minesCount;
  if (openedCount === totalSafeCells && gameState.status === "process") {
    gameState.status = "win";
    stopTimer();
  }
}

function openCell(row, col) {
  if (gameState.status !== "process" || !isInBounds(row, col)) return;
  const cell = field[row][col];
  if (cell.state === "opened" || cell.state === "flagged") return;

  startTimer();

  if (cell.type === "mine") {
    gameState.status = "lose";
    revealAllMines(row, col);
    stopTimer();
    return;
  }

  cell.state = "opened";
  openedCount += 1;

  if (cell.neighborMines === 0) {
    for (const [nRow, nCol] of getNeighbours(row, col)) {
      const neighbour = field[nRow][nCol];
      if (neighbour.state === "closed" && neighbour.type !== "mine") {
        openCell(nRow, nCol);
      }
    }
  }

  checkWin();
}

function toggleFlag(row, col) {
  if (gameState.status !== "process" || !isInBounds(row, col)) return;
  const cell = field[row][col];
  if (cell.state === "opened") return;

  startTimer();

  if (cell.state === "closed") {
    if (flaggedCount >= gameState.minesCount) return;
    cell.state = "flagged";
    flaggedCount += 1;
  } else if (cell.state === "flagged") {
    cell.state = "closed";
    flaggedCount -= 1;
  }
}

function getVisualState(cell) {
  if (cell.state === "opened") return "open";
  if (cell.state === "flagged") return "flagged";
  if (cell.state === "mine") return "mine";
  if (cell.state === "triggeredMine") return "triggeredMine";
  return "closed";
}

function renderCounters() {
  if (timerEl) timerEl.textContent = formatCounter(gameState.gameTime);
  if (flagsEl) {
    const remaining = Math.max(0, gameState.minesCount - flaggedCount);
    flagsEl.textContent = formatCounter(remaining);
  }
}

function renderFace() {
  if (!startBtnEl) return;
  if (gameState.status === "lose") {
    startBtnEl.textContent = "x(";
    return;
  }
  if (gameState.status === "win") {
    startBtnEl.textContent = "B)";
    return;
  }
  startBtnEl.textContent = ":)";
}

function renderBoard() {
  if (!boardEl) return;
  boardEl.style.setProperty("--board-rows", String(gameState.rows));
  boardEl.style.setProperty("--board-cols", String(gameState.cols));
  boardEl.replaceChildren();

  const fragment = document.createDocumentFragment();
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const data = field[row][col];
      const cellEl = document.createElement("button");
      cellEl.type = "button";
      cellEl.className = "cell";
      cellEl.dataset.row = String(row);
      cellEl.dataset.col = String(col);
      cellEl.dataset.state = getVisualState(data);
      cellEl.setAttribute("role", "gridcell");

      if (data.state === "opened" && data.neighborMines > 0) {
        cellEl.textContent = String(data.neighborMines);
        cellEl.classList.add(`num-${data.neighborMines}`);
      } else if (data.state === "flagged") {
        cellEl.textContent = "⚑";
      } else if (data.state === "mine" || data.state === "triggeredMine") {
        cellEl.textContent = "●";
      }
      fragment.append(cellEl);
    }
  }
  boardEl.append(fragment);
}

function refreshUI() {
  renderCounters();
  renderFace();
  renderBoard();
}

function startNewGame() {
  stopTimer();
  gameState.status = "process";
  gameState.gameTime = 0;
  openedCount = 0;
  flaggedCount = 0;
  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines();
  refreshUI();
}

function onBoardClick(event) {
  const target = event.target.closest(".cell");
  if (!target) return;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  openCell(row, col);
  refreshUI();
}

function onBoardRightClick(event) {
  const target = event.target.closest(".cell");
  if (!target) return;
  event.preventDefault();
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  toggleFlag(row, col);
  refreshUI();
}

function init() {
  startNewGame();
  boardEl?.addEventListener("click", onBoardClick);
  boardEl?.addEventListener("contextmenu", onBoardRightClick);
  startBtnEl?.addEventListener("click", startNewGame);
}

init();
