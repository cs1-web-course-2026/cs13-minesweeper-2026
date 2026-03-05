class Minesweeper {
    static STATUS = { PROCESS: 'process', WIN: 'win', LOSE: 'lose' };
    static CELL_TYPE = { EMPTY: 'empty', MINE: 'mine' };
    static CELL_STATE = { CLOSED: 'closed', OPENED: 'open', FLAGGED: 'flagged' };

    constructor(rows = 10, cols = 10, minesCount = 15) {
        this.rows = rows;
        this.cols = cols;
        // Клемпінг кількості мін (не більше ніж клітинок на полі - 1)
        this.minesCount = Math.min(minesCount, rows * cols - 1);

        this.boardElement = document.getElementById('game-board');
        this.timerElement = document.getElementById('timer');
        this.mineCountElement = document.getElementById('mine-count');
        this.resetBtn = document.getElementById('reset-btn');

        this._setupEvents();
        this.reset();
    }

    reset() {
        this.status = Minesweeper.STATUS.PROCESS;
        this.gameTime = 0;
        if (this.timerId) {
            clearInterval(this.timerId);
        }

        this.field = this._generateField();
        this._countAllNeighbors();

        // Динамічне налаштування сітки через inline-стилі (фікс зауваження Copilot)
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size, 30px))`;
        this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, var(--cell-size, 30px))`;

        this._startTimer();
        this.render();
        this.updateUI();
    }

    _generateField() {
        const field = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => ({
                type: Minesweeper.CELL_TYPE.EMPTY,
                state: Minesweeper.CELL_STATE.CLOSED,
                neighborMines: 0
            }))
        );

        let plantedMinesCount = 0;
        while (plantedMinesCount < this.minesCount) {
            const rowIndex = Math.floor(Math.random() * this.rows);
            const colIndex = Math.floor(Math.random() * this.cols);

            if (field[rowIndex][colIndex].type !== Minesweeper.CELL_TYPE.MINE) {
                field[rowIndex][colIndex].type = Minesweeper.CELL_TYPE.MINE;
                plantedMinesCount++;
            }
        }

        return field;
    }

    _countAllNeighbors() {
        this._forEachCell((row, col) => {
            if (this.field[row][col].type === Minesweeper.CELL_TYPE.MINE) {
                return;
            }

            const neighbors = this._getNeighbors(row, col);
            this.field[row][col].neighborMines = neighbors.filter(([nRow, nCol]) =>
                this.field[nRow][nCol].type === Minesweeper.CELL_TYPE.MINE
            ).length;
        });
    }

    _getNeighbors(row, col) {
        const neighbors = [];
        for (let dRow = -1; dRow <= 1; dRow++) {
            for (let dCol = -1; dCol <= 1; dCol++) {
                if (dRow === 0 && dCol === 0) {
                    continue;
                }

                const neighbourRow = row + dRow;
                const neighbourCol = col + dCol;

                if (neighbourRow >= 0 && neighbourRow < this.rows && neighbourCol >= 0 && neighbourCol < this.cols) {
                    neighbors.push([neighbourRow, neighbourCol]);
                }
            }
        }

        return neighbors;
    }

    _forEachCell(callback) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                callback(row, col);
            }
        }
    }

    render() {
        this.boardElement.innerHTML = '';

        this._forEachCell((row, col) => {
            const data = this.field[row][col];
            const cell = document.createElement('button'); // Accessibility fix
            cell.classList.add('cell');
            cell.type = 'button';
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (data.state === Minesweeper.CELL_STATE.OPENED) {
                cell.classList.add('open');
                if (data.type === Minesweeper.CELL_TYPE.MINE) {
                    cell.classList.add('mine');
                    if (this.status === Minesweeper.STATUS.LOSE) {
                        cell.classList.add('exploded');
                    }
                } else if (data.neighborMines > 0) {
                    cell.textContent = data.neighborMines;
                    cell.classList.add(`num-${data.neighborMines}`);
                }
            } else if (data.state === Minesweeper.CELL_STATE.FLAGGED) {
                cell.classList.add('flag');
            }

            this.boardElement.appendChild(cell);
        });
    }

    updateUI() {
        const format = (n) => String(Math.max(0, n)).padStart(3, '0');
        this.timerElement.textContent = format(this.gameTime);

        const flagsCount = this.field.flat().filter(c => c.state === Minesweeper.CELL_STATE.FLAGGED).length;
        this.mineCountElement.textContent = format(this.minesCount - flagsCount);

        if (this.status === Minesweeper.STATUS.WIN) {
            this.resetBtn.textContent = '😎';
        } else if (this.status === Minesweeper.STATUS.LOSE) {
            this.resetBtn.textContent = '😵';
        } else {
            this.resetBtn.textContent = '🙂';
        }
    }

    openCell(row, col) {
        if (this.status !== Minesweeper.STATUS.PROCESS) return;
        const cell = this.field[row][col];
        if (cell.state !== Minesweeper.CELL_STATE.CLOSED) return;

        if (cell.type === Minesweeper.CELL_TYPE.MINE) {
            this._terminate(Minesweeper.STATUS.LOSE);
            return;
        }

        cell.state = Minesweeper.CELL_STATE.OPENED;
        if (cell.neighborMines === 0) {
            this._getNeighbors(row, col).forEach(([nRow, nCol]) => this.openCell(nRow, nCol));
        }

        this._checkWin();
    }

    toggleFlag(row, col) {
        if (this.status !== Minesweeper.STATUS.PROCESS) return;
        const cell = this.field[row][col];
        if (cell.state === Minesweeper.CELL_STATE.OPENED) return;

        cell.state = cell.state === Minesweeper.CELL_STATE.FLAGGED ?
            Minesweeper.CELL_STATE.CLOSED : Minesweeper.CELL_STATE.FLAGGED;
    }

    _startTimer() {
        this.timerId = setInterval(() => {
            if (this.status === Minesweeper.STATUS.PROCESS) {
                this.gameTime++;
                this.updateUI();
            }
        }, 1000);
    }

    _checkWin() {
        const isWon = this.field.flat().every(c =>
            (c.type === Minesweeper.CELL_TYPE.MINE && c.state !== Minesweeper.CELL_STATE.OPENED) ||
            (c.type === Minesweeper.CELL_TYPE.EMPTY && c.state === Minesweeper.CELL_STATE.OPENED)
        );
        if (isWon) {
            this._terminate(Minesweeper.STATUS.WIN);
        }
    }

    _terminate(status) {
        this.status = status;
        clearInterval(this.timerId);
        if (status === Minesweeper.STATUS.LOSE) {
            this.field.flat().forEach(c => {
                if (c.type === Minesweeper.CELL_TYPE.MINE) c.state = Minesweeper.CELL_STATE.OPENED;
            });
        }
        this.render();
        this.updateUI();
    }

    _setupEvents() {
        this.boardElement.addEventListener('click', (e) => {
            const el = e.target.closest('.cell');
            if (el && this.status === Minesweeper.STATUS.PROCESS) {
                this.openCell(Number(el.dataset.row), Number(el.dataset.col));
                // Рендеримо тільки якщо гра не закінчилася в _terminate
                if (this.status === Minesweeper.STATUS.PROCESS) {
                    this.render();
                    this.updateUI();
                }
            }
        });

        this.boardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const el = e.target.closest('.cell');
            if (el && this.status === Minesweeper.STATUS.PROCESS) {
                this.toggleFlag(Number(el.dataset.row), Number(el.dataset.col));
                this.render();
                this.updateUI();
            }
        });

        this.resetBtn.addEventListener('click', () => this.reset());
    }
}

const game = new Minesweeper(10, 10, 15);