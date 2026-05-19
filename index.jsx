import React, { useState, useEffect } from 'react';
import styles from './Minesweeper.module.css';

// 1. ЧИСТІ ФУНКЦІЇ БІЗНЕС-ЛОГІКИ (Збережено з минулих робіт)

// Створення початкової порожньої сітки
function createInitialBoard(rows, cols) {
    const board = [];
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push({ type: 'empty', state: 'closed', neighborMines: 0, row: r, col: c });
        }
        board.push(row);
    }
    return board;
}

// Випадкова розстановка мін на полі (окрім першого кліку)
function plantMines(board, rows, cols, minesCount, excludeR, excludeC) {
    let minesPlanted = 0;
    while (minesPlanted < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if ((r === excludeR && c === excludeC) || board[r][c].type === 'mine') continue;
        board[r][c].type = 'mine';
        minesPlanted++;
    }
}

// Отримання масиву сусідніх клітинок у радіусі 1 позиції
function getNeighbours(board, r, c, rows, cols) {
    const neighbours = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) neighbours.push(board[nr][nc]);
        }
    }
    return neighbours;
}

// Розрахунок кількості мін-сусідів для всього поля
function calculateNeighbors(board, rows, cols) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].type === 'empty') {
                const ns = getNeighbours(board, r, c, rows, cols);
                board[r][c].neighborMines = ns.filter(cell => cell.type === 'mine').length;
            }
        }
    }
}

// Рекурсивний обхід та автоматичне відкриття порожніх зон
function openCellRecursive(board, r, c, rows, cols) {
    let cell = board[r][c];
    if (cell.state !== 'closed') return;
    cell.state = 'opened';
    if (cell.neighborMines === 0 && cell.type === 'empty') {
        const ns = getNeighbours(board, r, c, rows, cols);
        ns.forEach(n => { if (n.state === 'closed') openCellRecursive(board, n.row, n.col, rows, cols); });
    }
}

// ===================================================
// 2. ДЕКОМПОЗИЦІЯ ІНТЕРФЕЙСУ (Внутрішні React-компоненти)
// ===================================================

// Компонент індивідуальної клітинки
function Cell({ data, onClick, onContextMenu }) {
    let cellClass = styles.cell;
    let content = '';

    if (data.state === 'opened') {
        cellClass += ` ${styles.cellOpened}`;
        if (data.type === 'mine') {
            cellClass += data.isExploded ? ` ${styles.cellMineExploded}` : ` ${styles.cellMine}`;
        } else if (data.neighborMines > 0) {
            content = data.neighborMines;
            cellClass += ` ${styles[`text${data.neighborMines}`]}`;
        }
    } else if (data.state === 'flagged') {
        cellClass += ` ${styles.cellFlagged}`;
    }

    return (
        <button className={cellClass} onClick={onClick} onContextMenu={onContextMenu}>
            {content}
        </button>
    );
}

// Компонент ігрової сітки
function Board({ board, onCellClick, onCellRightClick }) {
    return (
        <main className={styles.board}>
            {board.map((row, rIdx) => 
                row.map((cell, cIdx) => (
                    <Cell 
                        key={`${rIdx}-${cIdx}`} 
                        data={cell} 
                        onClick={() => onCellClick(rIdx, cIdx)}
                        onContextMenu={(e) => onCellRightClick(e, rIdx, cIdx)}
                    />
                ))
            )}
        </main>
    );
}

// Компонент цифрового табло таймера
function Timer({ time }) {
    return <div className={styles.displayBox}>{String(time).padStart(3, '0')}</div>;
}

// Компонент лічильника залишку мін та прапорців
function GameStatus({ board, minesCount }) {
    let flaggedCount = 0;
    board.forEach(row => row.forEach(c => { if (c.state === 'flagged') flaggedCount++; }));
    const minesLeft = Math.max(0, minesCount - flaggedCount);
    return <div className={styles.displayBox}>{String(minesLeft).padStart(3, '0')}</div>;
}

// Кнопка перезапуску гри зі змінюваними емодзі
function RestartButton({ status, onClick }) {
    const getEmoji = () => {
        if (status === 'win') return '😎';
        if (status === 'lose') return '😵';
        return '🙂';
    };
    return <button className={styles.resetButton} onClick={onClick}>{getEmoji()}</button>;
}

// ===================================================
// 3. ГОЛОВНИЙ КЕРУЮЧИЙ КОМПОНЕНТ ГРИ (Менеджмент Станy)
// ===================================================
export default function Minesweeper() {
    const [rows] = useState(10);
    const [cols] = useState(10);
    const [minesCount] = useState(15);
    
    // Ініціалізація реактивних станів
    const [board, setBoard] = useState(() => createInitialBoard(10, 10));
    const [status, setStatus] = useState('process'); // 'process' | 'win' | 'lose'
    const [gameTime, setGameTime] = useState(0);
    const [isFirstClick, setIsFirstClick] = useState(true);

    // Хук ефектів для контролю та очищення асинхронного таймера
    useEffect(() => {
        if (status !== 'process' || isFirstClick) return;
        const interval = setInterval(() => {
            setGameTime(prev => (prev < 999 ? prev + 1 : prev));
        }, 1000);
        return () => clearInterval(interval);
    }, [status, isFirstClick]);

    // Обробник лівого кліку миші (Відкриття клітинки)
    const handleCellClick = (r, c) => {
        if (status !== 'process' || board[r][c].state === 'opened' || board[r][c].state === 'flagged') return;
        const nextBoard = JSON.parse(JSON.stringify(board)); // Створення копії стану
        
        // Логіка безпечного першого ходу
        if (isFirstClick) {
            setIsFirstClick(false);
            plantMines(nextBoard, rows, cols, minesCount, r, c);
            calculateNeighbors(nextBoard, rows, cols);
        }

        // Хід на міну (Поразка)
        if (nextBoard[r][c].type === 'mine') {
            nextBoard[r][c].state = 'opened';
            nextBoard[r][c].isExploded = true;
            nextBoard.forEach(row => row.forEach(cell => { if (cell.type === 'mine') cell.state = 'opened'; }));
            setBoard(nextBoard);
            setStatus('lose');
            return;
        }

        openCellRecursive(nextBoard, r, c, rows, cols);

        // Перевірка умов перемоги
        let win = true;
        nextBoard.forEach(row => row.forEach(cell => {
            if (cell.type === 'empty' && cell.state !== 'opened') win = false;
        }));

        setBoard(nextBoard);
        if (win) setStatus('win');
    };

    // Обробник правого кліку миші (Встановлення/зняття прапорця)
    const handleCellRightClick = (e, r, c) => {
        e.preventDefault(); // Блокування системного меню браузера
        if (status !== 'process' || board[r][c].state === 'opened') return;
        
        const nextBoard = JSON.parse(JSON.stringify(board));
        const cell = nextBoard[r][c];
        cell.state = cell.state === 'closed' ? 'flagged' : 'closed';
        setBoard(nextBoard);
    };

    // Скидання гри до початкових параметрів
    const handleRestart = () => {
        setBoard(createInitialBoard(rows, cols));
        setStatus('process');
        setGameTime(0);
        setIsFirstClick(true);
    };

    return (
        <div className={styles.gameContainer}>
            <header className={styles.gameHeader}>
                <GameStatus board={board} minesCount={minesCount} />
                <RestartButton status={status} onClick={handleRestart} />
                <Timer time={gameTime} />
            </header>
            <Board board={board} onCellClick={handleCellClick} onCellRightClick={handleCellRightClick} />
        </div>
    );
}
