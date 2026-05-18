let gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: 'process', // 'process' | 'win' | 'lose'
    gameTime: 0,
    timerId: null,
    board: [],
    isFirstClick: true
};

// 1. Генерація поля та випадкове розставлення мін
function generateField(rows, cols, minesCount) {
    gameState.status = 'process';
    gameState.gameTime = 0;
    gameState.isFirstClick = true;
    
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }

    // Створення порожньої сітки
    gameState.board = [];
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty',   // 'empty' або 'mine'
                state: 'closed',  // 'closed', 'opened', 'flagged'
                neighborMines: 0,
                row: r,
                col: c
            });
        }
        gameState.board.push(row);
    }

    // Розстановка мін через Math.random()
    let minesPlanted = 0;
    while (minesPlanted < minesCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (gameState.board[randomRow][randomCol].type === 'mine') {
            continue;
        }

        gameState.board[randomRow][randomCol].type = 'mine';
        minesPlanted++;
    }

    calculateAllNeighbors();
}

// Пошук сусідніх клітинок (в межах поля)
function getNeighbours(r, c) {
    const neighbours = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = r + dr;
            const newCol = c + dc;

            if (newRow >= 0 && newRow < gameState.rows && newCol >= 0 && newCol < gameState.cols) {
                neighbours.push(gameState.board[newRow][newCol]);
            }
        }
    }
    return neighbours;
}

// Запуск підрахунку мін для всього поля
function calculateAllNeighbors() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.board[r][c].type === 'empty') {
                gameState.board[r][c].neighborMines = countNeighbourMines(r, c);
            }
        }
    }
}

// 2. Підрахунок мін у 8 сусідніх позиціях
function countNeighbourMines(r, c) {
    const neighbours = getNeighbours(r, c);
    return neighbours.filter(cell => cell.type === 'mine').length;
}

// 3. Логіка відкриття клітинки та рекурсія
function openCell(r, c) {
    let cell = gameState.board[r][c];

    if (cell.state === 'opened' || cell.state === 'flagged' || gameState.status !== 'process') {
        return;
    }

    if (gameState.isFirstClick) {
        gameState.isFirstClick = false;
        startTimer();
    }

    if (cell.type === 'mine') {
        cell.state = 'opened';
        endGame('lose');
        return;
    }

    cell.state = 'opened';

    // Рекурсивне відкриття порожніх сусідів
    if (cell.neighborMines === 0) {
        const neighbours = getNeighbours(r, c);
        neighbours.forEach(neighbour => {
            if (neighbour.state === 'closed') {
                openCell(neighbour.row, neighbour.col);
            }
        });
    }

    checkWinCondition();
}

// Перевірка, чи відкриті всі порожні клітинки
function checkWinCondition() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.board[r][c].type === 'empty' && gameState.board[r][c].state !== 'opened') {
                return;
            }
        }
    }
    endGame('win');
}

// Завершення гри та зупинка таймера
function endGame(finalStatus) {
    gameState.status = finalStatus;
    clearInterval(gameState.timerId);
    
    if (finalStatus === 'win') {
        console.log("Вітаємо з перемогою! 🎉");
    } else {
        console.log("Бум! Ви програли. 💥");
        revealMines();
    }
}

// Відкриття всіх мін після програшу
function revealMines() {
    gameState.board.forEach(row => {
        row.forEach(cell => {
            if (cell.type === 'mine') cell.state = 'opened';
        });
    });
}

// 4. Інтерактив: встановлення та зняття прапорця
function toggleFlag(row, col) {
    if (gameState.status !== 'process') return;

    let cell = gameState.board[row][col];
    if (cell.state === 'opened') return;

    if (cell.state === 'closed') {
        cell.state = 'flagged';
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
    }
}

// Щосекундне оновлення лічильника часу
function startTimer() {
    if (gameState.timerId) return;
    
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        if (gameState.gameTime >= 999) {
            clearInterval(gameState.timerId);
        }
    }, 1000);
}

// Первинний запуск генерації поля 10х10 з 15 мінами
generateField(gameState.rows, gameState.cols, gameState.minesCount);
console.log("Логіку Сапера успішно ініціалізовано!", gameState);
