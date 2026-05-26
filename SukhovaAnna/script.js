const CELL_TYPES = {
    EMPTY: "empty",
    MINE: "mine"
};

const CELL_STATES = {
    CLOSED: "closed",
    OPENED: "opened",
    FLAGGED: "flagged"
};

const GAME_STATUSES = {
    PROCESS: "process",
    WIN: "win",
    LOSE: "lose"
};

const messageElement = document.querySelector(".message");
const fieldElement = document.querySelector(".field");
const counterElement = document.querySelector(".counter");
const timerElement = document.querySelector(".timer");
const restartButton = document.querySelector(".restart");

const gameState = {
    rows: 9,
    cols: 9,
    minesCount: 10,
    status: GAME_STATUSES.PROCESS,
    gameTime: 0,
    timerId: null,
    firstClick: true
};

function generateField(rows, cols, minesCount, safeRow, safeCol) {
    const newField = [];

    for (let row = 0; row < rows; row++) {
        const rowArray = [];

        for (let col = 0; col < cols; col++) {
            rowArray.push({
                type: "empty",
                neighborMines: 0,
                state: CELL_STATES.CLOSED
            });
        }

        newField.push(rowArray);
    }

    let placedMines = 0;

    while (placedMines < minesCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);

        const isSafeCell = row === safeRow && col === safeCol;

        if (
            newField[row][col].type !== CELL_TYPES.MINE &&
            !isSafeCell
        ) {
            newField[row][col].type = CELL_TYPES.MINE;
            placedMines++;
        }
    }

    return newField;
}

function countNeighbourMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].type === CELL_TYPES.MINE) {
                continue;
            }

            const neighbours = getNeighbours(row, col);
            let mines = 0;

            for (const neighbour of neighbours) {
                const nRow = neighbour.row;
                const nCol = neighbour.col;

                if (field[nRow][nCol].type === CELL_TYPES.MINE) {
                    mines++;
                }
            }

            field[row][col].neighborMines = mines;
        }
    }
}

function getNeighbours(row, col) {
    const neighbours = [];

    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            const isCurrentCell = r === row && c === col;
            const isInsideField =
                r >= 0 &&
                r < gameState.rows &&
                c >= 0 &&
                c < gameState.cols;

            if (!isCurrentCell && isInsideField) {
                neighbours.push({ row: r, col: c });
            }
        }
    }

    return neighbours;
}

function openCell(row, col) {
    if (gameState.status !== GAME_STATUSES.PROCESS) {
        return;
    }

    startTimer();

    if (gameState.firstClick) {
        field = generateField(
            gameState.rows,
            gameState.cols,
            gameState.minesCount,
            row,
            col
        );

        countNeighbourMines();

        gameState.firstClick = false;
    }

    const cell = field[row][col];

    if (cell.state === CELL_STATES.OPENED || cell.state === CELL_STATES.FLAGGED) {
        return;
    }

    cell.state = CELL_STATES.OPENED;

    if (cell.type === CELL_TYPES.MINE) {
        gameState.status = GAME_STATUSES.LOSE;
        stopTimer();
        openAllMines();
        restartButton.textContent = "😵";
        messageElement.style.display = "block";
        messageElement.textContent = "Гру закінчено! Ви натрапили на міну.";
        renderField();
        return;
    }

    if (cell.neighborMines === 0) {
        const neighbours = getNeighbours(row, col);

        for (const neighbour of neighbours) {
            openCell(neighbour.row, neighbour.col);
        }
    }

    checkWin();
    renderField();
}

function toggleFlag(row, col) {
    if (gameState.firstClick) {
        return;
    }
    if (gameState.status !== GAME_STATUSES.PROCESS) {
        return;
    }

    const cell = field[row][col];

    if (cell.state === CELL_STATES.OPENED) {
        return;
    }

    startTimer();

    if (cell.state === CELL_STATES.CLOSED) {
        cell.state = CELL_STATES.FLAGGED;
    } else if (cell.state === CELL_STATES.FLAGGED) {
        cell.state = CELL_STATES.CLOSED;
    }

    updateCounter();
    renderField();
}

function checkWin() {
    let openedCells = 0;
    const safeCells = gameState.rows * gameState.cols - gameState.minesCount;

    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].state === CELL_STATES.OPENED) {
                openedCells++;
            }
        }
    }

    if (openedCells === safeCells) {
        gameState.status = GAME_STATUSES.WIN;
        stopTimer();
        restartButton.textContent = "😎";
        messageElement.style.display = "block";
        messageElement.textContent = "Вітаю! Ви перемогли.";
    }
}

function openAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].type === CELL_TYPES.MINE) {
                field[row][col].state = CELL_STATES.OPENED;
            }
        }
    }
}

function startTimer() {
    if (gameState.timerId !== null) {
        return;
    }

    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        updateTimer();
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

function updateTimer() {
    timerElement.textContent = `⏱ ${String(gameState.gameTime).padStart(3, "0")}`;
}

function updateCounter() {
    let flagsCount = 0;

    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].state === CELL_STATES.FLAGGED) {
                flagsCount++;
            }
        }
    }

    counterElement.textContent = `🌸 ${gameState.minesCount - flagsCount}`;
}

function renderField() {
    fieldElement.innerHTML = "";

    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = field[row][col];
            const cellElement = document.createElement("button");
            cellElement.type = "button";
            cellElement.setAttribute(
                "aria-label",
                `Row ${row + 1}, column ${col + 1}, ${cell.state}`
            );
            cellElement.classList.add("cell");

            if (cell.state === CELL_STATES.CLOSED) {
                cellElement.classList.add(CELL_STATES.CLOSED);
            }

            if (cell.state === CELL_STATES.FLAGGED) {
                cellElement.classList.add(CELL_STATES.CLOSED);
                cellElement.textContent = "🌸";
            }

            if (cell.state === CELL_STATES.OPENED) {
                cellElement.classList.add(CELL_STATES.OPENED);

                if (cell.type === CELL_TYPES.MINE) {
                    cellElement.textContent = "🐰";
                } else if (cell.neighborMines > 0) {
                    cellElement.textContent = cell.neighborMines;
                }
            }

            cellElement.addEventListener("click", () => {
                openCell(row, col);
            });

            cellElement.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                toggleFlag(row, col);
            });

            fieldElement.appendChild(cellElement);
        }
    }
}

function restartGame() {
    stopTimer();

    gameState.status = GAME_STATUSES.PROCESS;
    gameState.gameTime = 0;
    gameState.firstClick = true;

    restartButton.textContent = "😝";

    messageElement.textContent = "";
    messageElement.style.display = "none";

    field = generateField(
        gameState.rows,
        gameState.cols,
        0,
        -1,
        -1
    );

    updateTimer();
    updateCounter();
    renderField();
}

restartButton.addEventListener("click", restartGame);

restartGame();