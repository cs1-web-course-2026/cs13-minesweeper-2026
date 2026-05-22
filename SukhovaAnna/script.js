const messageElement = document.querySelector(".message");
const fieldElement = document.querySelector(".field");
const counterElement = document.querySelector(".counter");
const timerElement = document.querySelector(".timer");
const restartButton = document.querySelector(".restart");

const gameState = {
    rows: 9,
    cols: 9,
    minesCount: 10,
    status: "process",
    gameTime: 0,
    timerId: null,
    firstClick: true
};

let field = [];

function generateField(rows, cols, minesCount, safeRow, safeCol) {
    const newField = [];

    for (let row = 0; row < rows; row++) {
        const rowArray = [];

        for (let col = 0; col < cols; col++) {
            rowArray.push({
                type: "empty",
                neighborMines: 0,
                state: "closed"
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
            newField[row][col].type !== "mine" &&
            !isSafeCell
        ) {
            newField[row][col].type = "mine";
            placedMines++;
        }
    }

    return newField;
}

function countNeighbourMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].type === "mine") {
                continue;
            }

            const neighbours = getNeighbours(row, col);
            let mines = 0;

            for (const neighbour of neighbours) {
                const nRow = neighbour.row;
                const nCol = neighbour.col;

                if (field[nRow][nCol].type === "mine") {
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
    if (gameState.status !== "process") {
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

    if (cell.state === "opened" || cell.state === "flagged") {
        return;
    }

    cell.state = "opened";

    if (cell.type === "mine") {
        gameState.status = "lose";
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
    if (gameState.status !== "process") {
        return;
    }

    const cell = field[row][col];

    if (cell.state === "opened") {
        return;
    }

    startTimer();

    if (cell.state === "closed") {
        cell.state = "flagged";
    } else if (cell.state === "flagged") {
        cell.state = "closed";
    }

    updateCounter();
    renderField();
}

function checkWin() {
    let openedCells = 0;
    const safeCells = gameState.rows * gameState.cols - gameState.minesCount;

    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].state === "opened") {
                openedCells++;
            }
        }
    }

    if (openedCells === safeCells) {
        gameState.status = "win";
        stopTimer();
        restartButton.textContent = "😎";
        messageElement.style.display = "block";
        messageElement.textContent = "Вітаю! Ви перемогли.";
    }
}

function openAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].type === "mine") {
                field[row][col].state = "opened";
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
            if (field[row][col].state === "flagged") {
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
            const cellElement = document.createElement("div");

            cellElement.classList.add("cell");

            if (cell.state === "closed") {
                cellElement.classList.add("closed");
            }

            if (cell.state === "flagged") {
                cellElement.classList.add("closed");
                cellElement.textContent = "🌸";
            }

            if (cell.state === "opened") {
                cellElement.classList.add("opened");

                if (cell.type === "mine") {
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

    gameState.status = "process";
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