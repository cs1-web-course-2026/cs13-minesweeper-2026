const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: "process",
  gameTime: 0,
  timerId: null
};

const MIN_BOARD_SIZE = 5;
const MAX_BOARD_SIZE = 18;

const i18n = {
  uk: {
    appTitle: "Minesweeper",
    timerLabel: "Час",
    flagsLabel: "Прапорці",
    languageLabel: "Мова",
    startButtonAria: "Почати нову гру",
    boardAria: "Ігрове поле сапера",
    rowsLabel: "Рядки",
    colsLabel: "Колонки",
    minesLabel: "Міни",
    applyDifficultyButton: "Застосувати",
    startButtonText: "Старт",
    restartButtonText: "Рестарт",
    difficultyHintDefault: "Розмір поля: від 5x5 до 18x18.",
    difficultyHintApplied: "Параметри застосовано.",
    difficultyHintInvalid: "Перевір параметри. Рядки/колонки: 5-18, міни: 1..максимум.",
    gameWinMessage: "Перемога! Усі безпечні клітинки відкриті.",
    gameLoseMessage: "Поразка! Ти натрапив на міну.",
    gameProcessMessage: "",
    closedCell: "Закрита клітинка",
    openCell: "Відкрита клітинка",
    flaggedCell: "Клітинка з прапорцем",
    mineCell: "Клітинка з міною",
    triggeredMineCell: "Підірвана міна",
    loseFace: "x(",
    winFace: "B)"
  },
  en: {
    appTitle: "Minesweeper",
    timerLabel: "Time",
    flagsLabel: "Flags",
    languageLabel: "Language",
    startButtonAria: "Start new game",
    boardAria: "Minesweeper board",
    rowsLabel: "Rows",
    colsLabel: "Cols",
    minesLabel: "Mines",
    applyDifficultyButton: "Apply",
    startButtonText: "Start",
    restartButtonText: "Restart",
    difficultyHintDefault: "Board size range: 5x5 to 18x18.",
    difficultyHintApplied: "Settings applied.",
    difficultyHintInvalid: "Invalid settings. Rows/cols: 5-18, mines: 1..max.",
    gameWinMessage: "You win! All safe cells are opened.",
    gameLoseMessage: "You lose! You hit a mine.",
    gameProcessMessage: "",
    closedCell: "Closed cell",
    openCell: "Opened cell",
    flaggedCell: "Cell with flag",
    mineCell: "Cell with mine",
    triggeredMineCell: "Triggered mine",
    loseFace: "x(",
    winFace: "B)"
  }
};

const boardEl = document.querySelector("#board");
const timerEl = document.querySelector("#timer");
const flagsEl = document.querySelector("#flags");
const startBtnEl = document.querySelector("#startBtn");
const languageSelectEl = document.querySelector("#languageSelect");
const rowsInputEl = document.querySelector("#rowsInput");
const colsInputEl = document.querySelector("#colsInput");
const minesInputEl = document.querySelector("#minesInput");
const applyDifficultyBtnEl = document.querySelector("#applyDifficultyBtn");
const difficultyHintEl = document.querySelector("#difficultyHint");
const gameMessageEl = document.querySelector("#gameMessage");

let currentLanguage = localStorage.getItem("mswp-lang") || "uk";
let field = [];
let openedCount = 0;
let flaggedCount = 0;

function getT(lang, key) {
  return i18n[lang]?.[key] || i18n.en[key] || key;
}

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
      if (isInBounds(nRow, nCol)) {
        neighbours.push([nRow, nCol]);
      }
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
      const neighbours = getNeighbours(row, col);
      let minesAround = 0;
      for (const [nRow, nCol] of neighbours) {
        if (field[nRow][nCol].type === "mine") {
          minesAround += 1;
        }
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
      if (row === triggeredRow && col === triggeredCol) {
        cell.state = "triggeredMine";
      } else {
        cell.state = "mine";
      }
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
  if (gameState.status !== "process") return;

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

  if (cell.neighborMines !== 0) {
    checkWin();
    return;
  }

  const neighbours = getNeighbours(row, col);
  for (const [nRow, nCol] of neighbours) {
    const neighbour = field[nRow][nCol];
    if (neighbour.state === "closed" && neighbour.type !== "mine") {
      openCell(nRow, nCol);
    }
  }

  checkWin();
}

function toggleFlag(row, col) {
  if (gameState.status !== "process") return;

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

function getCellAriaLabel(cell) {
  if (cell.state === "opened") return getT(currentLanguage, "openCell");
  if (cell.state === "flagged") return getT(currentLanguage, "flaggedCell");
  if (cell.state === "mine") return getT(currentLanguage, "mineCell");
  if (cell.state === "triggeredMine") return getT(currentLanguage, "triggeredMineCell");
  return getT(currentLanguage, "closedCell");
}

function renderCounters() {
  if (timerEl) timerEl.textContent = formatCounter(gameState.gameTime);
  if (flagsEl) {
    const remaining = Math.max(0, gameState.minesCount - flaggedCount);
    flagsEl.textContent = formatCounter(remaining);
  }
}

function updateDifficultyInputs() {
  if (rowsInputEl) rowsInputEl.value = String(gameState.rows);
  if (colsInputEl) colsInputEl.value = String(gameState.cols);
  if (minesInputEl) minesInputEl.value = String(gameState.minesCount);
}

function setDifficultyHint(key) {
  if (!difficultyHintEl) return;
  difficultyHintEl.textContent = getT(currentLanguage, key);
}

function getValidatedDifficulty() {
  const rows = Number(rowsInputEl?.value);
  const cols = Number(colsInputEl?.value);
  const mines = Number(minesInputEl?.value);

  const hasIntegerValues = Number.isInteger(rows) && Number.isInteger(cols) && Number.isInteger(mines);
  if (!hasIntegerValues) return null;
  if (rows < MIN_BOARD_SIZE || rows > MAX_BOARD_SIZE) return null;
  if (cols < MIN_BOARD_SIZE || cols > MAX_BOARD_SIZE) return null;

  const maxMines = rows * cols - 1;
  if (mines < 1 || mines > maxMines) return null;

  return { rows, cols, mines };
}

function renderFace() {
  if (!startBtnEl) return;
  if (gameState.status === "lose") {
    startBtnEl.textContent = getT(currentLanguage, "loseFace");
    return;
  }
  if (gameState.status === "win") {
    startBtnEl.textContent = getT(currentLanguage, "winFace");
    return;
  }
  startBtnEl.textContent = "RST";
}

function renderGameMessage() {
  if (!gameMessageEl) return;
  if (gameState.status === "win") {
    gameMessageEl.hidden = false;
    gameMessageEl.dataset.state = "win";
    gameMessageEl.textContent = getT(currentLanguage, "gameWinMessage");
    return;
  }
  if (gameState.status === "lose") {
    gameMessageEl.hidden = false;
    gameMessageEl.dataset.state = "lose";
    gameMessageEl.textContent = getT(currentLanguage, "gameLoseMessage");
    return;
  }
  gameMessageEl.hidden = true;
  gameMessageEl.dataset.state = "process";
  gameMessageEl.textContent = "";
}

function renderBoard() {
  if (!boardEl) return;

  boardEl.style.setProperty("--board-rows", String(gameState.rows));
  boardEl.style.setProperty("--board-cols", String(gameState.cols));
  boardEl.replaceChildren();

  const fragment = document.createDocumentFragment();
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cellData = field[row][col];
      const cellEl = document.createElement("button");

      cellEl.type = "button";
      cellEl.className = "cell";
      cellEl.dataset.row = String(row);
      cellEl.dataset.col = String(col);
      cellEl.dataset.state = getVisualState(cellData);
      cellEl.setAttribute("role", "gridcell");
      cellEl.setAttribute("aria-label", getCellAriaLabel(cellData));

      if (cellData.state === "opened" && cellData.neighborMines > 0) {
        cellEl.textContent = String(cellData.neighborMines);
        cellEl.classList.add(`num-${cellData.neighborMines}`);
      } else if (cellData.state === "flagged") {
        cellEl.textContent = "⚑";
      } else if (cellData.state === "mine" || cellData.state === "triggeredMine") {
        cellEl.textContent = "●";
      }

      fragment.append(cellEl);
    }
  }

  boardEl.append(fragment);
}

function applyLocalization(lang) {
  const selectedLang = i18n[lang] ? lang : "en";
  currentLanguage = selectedLang;
  document.documentElement.lang = selectedLang;
  localStorage.setItem("mswp-lang", selectedLang);

  document.title = getT(selectedLang, "appTitle");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = getT(selectedLang, key);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    el.setAttribute("aria-label", getT(selectedLang, key));
  });

  if (boardEl) {
    boardEl.setAttribute("aria-label", getT(selectedLang, "boardAria"));
  }
  if (languageSelectEl) {
    languageSelectEl.value = selectedLang;
    languageSelectEl.setAttribute("aria-label", getT(selectedLang, "languageLabel"));
  }
  if (rowsInputEl) rowsInputEl.setAttribute("aria-label", getT(selectedLang, "rowsLabel"));
  if (colsInputEl) colsInputEl.setAttribute("aria-label", getT(selectedLang, "colsLabel"));
  if (minesInputEl) minesInputEl.setAttribute("aria-label", getT(selectedLang, "minesLabel"));
  if (startBtnEl && gameState.status === "process") {
    startBtnEl.textContent = "RST";
  }

  if (!difficultyHintEl || !difficultyHintEl.textContent) {
    setDifficultyHint("difficultyHintDefault");
  }
}

function startNewGame() {
  stopTimer();
  gameState.status = "process";
  gameState.gameTime = 0;
  openedCount = 0;
  flaggedCount = 0;

  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines();

  updateDifficultyInputs();
  renderCounters();
  renderFace();
  renderBoard();
  renderGameMessage();
}

function applyCustomDifficulty() {
  const validated = getValidatedDifficulty();
  if (!validated) {
    setDifficultyHint("difficultyHintInvalid");
    return;
  }

  gameState.rows = validated.rows;
  gameState.cols = validated.cols;
  gameState.minesCount = validated.mines;
  setDifficultyHint("difficultyHintApplied");
  startNewGame();
}

function onBoardLeftClick(event) {
  const target = event.target.closest(".cell");
  if (!target) return;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  if (!isInBounds(row, col)) return;

  openCell(row, col);
  renderCounters();
  renderFace();
  renderBoard();
  renderGameMessage();
}

function onBoardRightClick(event) {
  const target = event.target.closest(".cell");
  if (!target) return;
  event.preventDefault();

  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  if (!isInBounds(row, col)) return;

  toggleFlag(row, col);
  renderCounters();
  renderBoard();
  renderGameMessage();
}

function init() {
  applyLocalization(currentLanguage);
  startNewGame();

  boardEl?.addEventListener("click", onBoardLeftClick);
  boardEl?.addEventListener("contextmenu", onBoardRightClick);
  startBtnEl?.addEventListener("click", startNewGame);
  applyDifficultyBtnEl?.addEventListener("click", applyCustomDifficulty);
  languageSelectEl?.addEventListener("change", (event) => {
    applyLocalization(event.target.value);
    setDifficultyHint("difficultyHintDefault");
    renderFace();
    renderBoard();
    renderGameMessage();
  });
}

init();
