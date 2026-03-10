
// Моделювання даних 
let gameState = {
    rows: 8,
    cols: 8,
    minesCount: 10,
    status: 'process', // 'process', 'win', 'lose'
    gameTime: 0,
    timerId: null
};

let gameField = [];

// Константа для перевірки 8 сусідів 
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
];

// Генерація поля та мін

function generateField(rows, cols, minesCount) {
    // Оновлюємо стан гри
    gameState.rows = rows;
    gameState.cols = cols;
    gameState.minesCount = minesCount;
    gameState.status = 'process';
    gameState.gameTime = 0;
    
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
    }

    // Ініціалізація порожньої сітки
    gameField = [];
    for (let row = 0; row < rows; row++) {
        let currentRow = [];
        for (let col = 0; col < cols; col++) {
            currentRow.push({
                type: 'empty',
                neighborMines: 0,
                state: 'closed'
            });
        }
        gameField.push(currentRow);
    }

    // Розстановка мін випадковим чином
    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
        let randRow = Math.floor(Math.random() * rows);
        let randCol = Math.floor(Math.random() * cols);

        // Перевірка, щоб дві міни не потрапили в одну клітинку
        if (gameField[randRow][randCol].type !== 'mine') {
            gameField[randRow][randCol].type = 'mine';
            minesPlaced++;
        }
    }

    // Одразу рахуємо сусідів для згенерованого поля
    countNeighbourMines();
}

// Алгоритмічна частина 

function countNeighbourMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            // Проходимо лише по клітинках з типом 'empty'
            if (gameField[row][col].type === 'mine') continue;

            let count = 0;
            // Перевіряємо всі 8 сусідніх позицій
            for (let [dRow, dCol] of DIRECTIONS) {
                let newRow = row + dRow;
                let newCol = col + dCol;

                // Перевірка меж поля
                if (newRow >= 0 && newRow < gameState.rows && newCol >= 0 && newCol < gameState.cols) {
                    if (gameField[newRow][newCol].type === 'mine') {
                        count++;
                    }
                }
            }
            gameField[row][col].neighborMines = count;
        }
    }
}

function openCell(row, col) {
    // Перевірки: чи гра триває та чи не виходимо за межі
    if (gameState.status !== 'process') return;
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;
    
    let cell = gameField[row][col];
    
    // Якщо клітинка вже відкрита або з прапорцем — нічого не робити
    if (cell.state === 'opened' || cell.state === 'flagged') return;

    // Відкриваємо клітинку
    cell.state = 'opened';

    // Якщо міна — поразка
    if (cell.type === 'mine') {
        gameState.status = 'lose';
        clearInterval(gameState.timerId);
        console.log("Game Over: You hit a mine!");
        return;
    }

    // Рекурсія: якщо порожня (0 мін навколо), відкриваємо всіх сусідів
    if (cell.neighborMines === 0) {
        for (let [dRow, dCol] of DIRECTIONS) {
            openCell(row + dRow, col + dCol); // Рекурсивний виклик
        }
    }
    
    // Після кожного успішного відкриття перевіряємо, чи не виграли ми
    checkWinCondition();
}

// Інтерактив та таймер

function toggleFlag(row, col) {
    if (gameState.status !== 'process') return;
    
    let cell = gameField[row][col];
    
    // Якщо клітинка відкрита, ставити прапорець не можна
    if (cell.state === 'opened') return;

    // Змінюємо стан на протилежний
    if (cell.state === 'closed') {
        cell.state = 'flagged';
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
    }
}

function startTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
    }
    
    // Додаємо 1 щосекунди
    gameState.timerId = setInterval(() => {
        if (gameState.status === 'process') {
            gameState.gameTime++;
        }
    }, 1000);
}

// Допоміжна функція для перевірки перемоги
function checkWinCondition() {
    let unrevealedSafeCells = 0;
    
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            // Шукаємо клітинки без мін, які ще не відкриті
            if (gameField[row][col].type === 'empty' && gameField[row][col].state !== 'opened') {
                unrevealedSafeCells++;
            }
        }
    }
    
    // Якщо всі безпечні клітинки відкриті — перемога
    if (unrevealedSafeCells === 0) {
        gameState.status = 'win';
        clearInterval(gameState.timerId);
        console.log("Win! All safe cells are opened.");
    }
}