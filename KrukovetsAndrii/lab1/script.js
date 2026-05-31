const BOARD_SIZE = 10;

const defaultPreviewStates = [
  "closed", "open", "flagged", "open", "mine", "triggeredMine", "closed", "closed", "open", "closed",
  "closed", "open", "closed", "flaggedMine", "closed", "open", "closed", "closed", "open", "closed"
];

const numbers = [1, 2, 3, 4, 5, 6, 7, 8];
const boardEl = document.querySelector("#board");

function buildBoard(size = BOARD_SIZE) {
  if (!boardEl) return;

  boardEl.style.setProperty("--board-size", String(size));
  boardEl.replaceChildren();

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < size * size; index += 1) {
    const cell = document.createElement("button");
    const state = defaultPreviewStates[index] || "closed";
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.state = state;
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", "Клітинка");

    if (state === "open") {
      const number = numbers[index % numbers.length];
      if (index % 2 === 0) {
        cell.textContent = String(number);
        cell.classList.add(`num-${number}`);
      }
    } else if (state === "flagged" || state === "flaggedMine") {
      cell.textContent = "⚑";
    } else if (state === "mine" || state === "triggeredMine") {
      cell.textContent = "●";
    }

    fragment.append(cell);
  }

  boardEl.append(fragment);
}

function init() {
  buildBoard();
}

init();
