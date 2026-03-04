class Minesweeper {
    static STATUS = { PROCESS: 'process', WIN: 'win', LOSE: 'lose' };
    static CELL_TYPE = { EMPTY: 'empty', MINE: 'mine' };
    static CELL_STATE = { CLOSED: 'closed', OPENED: 'opened', FLAGGED: 'flagged' };

    constructor(rows = 10, cols = 10, minesCount = 15) {
        this.rows = rows;
        this.cols = cols;
        this.minesCount = minesCount;

        // Пошук елементів DOM
        this.boardElement = document.getElementById('game-board');
        this.timerElement = document.getElementById('timer');
        this.mineCountElement = document.getElementById('mine-count');
        this.resetBtn = document.getElementById('reset-btn');

        this._setupEvents();
        this.reset();
    }

    /**
     * Скидання стану та створення нової гри
     */
    reset() {
        this.status = Minesweeper.STATUS.PROCESS;
        this.gameTime = 0;
        if (this.timerId) clearInterval(this.timerId);

        this.field = this._generateField();
        this._countAllNeighbors();
        this._startTimer();

        this.render(); // Первинний рендеринг сітки
        this.updateUI(); // Оновлення інтерфейсу
    }

    _generateField() {
        const field = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => ({
                type: Minesweeper.CELL_TYPE.EMPTY,
                state: Minesweeper.CELL_STATE.CLOSED,
                neighborMines: 0
            }))
        );

        let planted = 0;
        while (planted < this.minesCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            if (field[r][c].type !== Minesweeper.CELL_TYPE.MINE) {
                field[r][c].type = Minesweeper.CELL_TYPE.MINE;
                planted++;
            }
        }
        return field;
    }

    _countAllNeighbors() {
        this._forEachCell((r, c) => {
            if (this.field[r][c].type === Minesweeper.CELL_TYPE.MINE) return;
            this.field[r][c].neighborMines = this._getNeighbors(r, c)
                .filter(([nr, nc]) => this.field[nr][nc].type === Minesweeper.CELL_TYPE.MINE).length;
        });
    }

    _getNeighbors(r, c) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) neighbors.push([nr, nc]);
            }
        }
        return neighbors;
    }

    _forEachCell(callback) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) callback(r, c);
        }
    }

    /**
     * Рендеринг ігрового поля: динамічне створення HTML-структури
     */
    render() {
        this.boardElement.innerHTML = ''; // Очищення перед рендерингом

        this._forEachCell((r, c) => {
            const data = this.field[r][c];
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;

            // Налаштування класів згідно з твоїм CSS
            if (data.state === Minesweeper.CELL_STATE.OPENED) {
                cell.classList.add('open');
                if (data.type === Minesweeper.CELL_TYPE.MINE) {
                    cell.classList.add('mine');
                    if (this.status === Minesweeper.STATUS.LOSE) cell.classList.add('exploded');
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

    /**
     * Оновлення динамічних елементів: Таймер та Лічильник
     */
    updateUI() {
        const format = (n) => String(Math.max(0, n)).padStart(3, '0');
        this.timerElement.textContent = format(this.gameTime);

        const flags = this.field.flat().filter(c => c.state === Minesweeper.CELL_STATE.FLAGGED).length;
        this.mineCountElement.textContent = format(this.minesCount - flags);

        // Візуальне сповіщення через кнопку
        if (this.status === Minesweeper.STATUS.WIN) this.resetBtn.textContent = '😎';
        else if (this.status === Minesweeper.STATUS.LOSE) this.resetBtn.textContent = '😵';
        else this.resetBtn.textContent = '🙂';
    }

    openCell(r, c) {
        if (this.status !== Minesweeper.STATUS.PROCESS) return;
        const cell = this.field[r][c];
        if (cell.state !== Minesweeper.CELL_STATE.CLOSED) return;

        if (cell.type === Minesweeper.CELL_TYPE.MINE) {
            this._terminate(Minesweeper.STATUS.LOSE);
            return;
        }

        cell.state = Minesweeper.CELL_STATE.OPENED;
        if (cell.neighborMines === 0) {
            this._getNeighbors(r, c).forEach(([nr, nc]) => this.openCell(nr, nc));
        }
        this._checkWin();
    }

    toggleFlag(r, c) {
        if (this.status !== Minesweeper.STATUS.PROCESS) return;
        const cell = this.field[r][c];
        if (cell.state === Minesweeper.CELL_STATE.OPENED) return;
        cell.state = cell.state === Minesweeper.CELL_STATE.FLAGGED ?
            Minesweeper.CELL_STATE.CLOSED : Minesweeper.CELL_STATE.FLAGGED;
    }

    _startTimer() {
        this.timerId = setInterval(() => {
            if (this.status === Minesweeper.STATUS.PROCESS) {
                this.gameTime++;
                this.updateUI(); // Оновлення таймера в реальному часі
            }
        }, 1000);
    }

    _checkWin() {
        const win = this.field.flat().every(c =>
            (c.type === Minesweeper.CELL_TYPE.MINE && c.state !== Minesweeper.CELL_STATE.OPENED) ||
            (c.type === Minesweeper.CELL_TYPE.EMPTY && c.state === Minesweeper.CELL_STATE.OPENED)
        );
        if (win) this._terminate(Minesweeper.STATUS.WIN);
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

    /**
     * Обробка подій користувача (Event Handling)
     */
    _setupEvents() {
        // Лівий клік: Відкриття клітинки
        this.boardElement.addEventListener('click', (e) => {
            const el = e.target.closest('.cell');
            if (el) {
                this.openCell(Number(el.dataset.row), Number(el.dataset.col));
                this.render();
                this.updateUI();
            }
        });

        // Правий клік: Встановлення прапорця та блокування меню
        this.boardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const el = e.target.closest('.cell');
            if (el) {
                this.toggleFlag(Number(el.dataset.row), Number(el.dataset.col));
                this.render();
                this.updateUI();
            }
        });

        // Кнопка Рестарт
        this.resetBtn.addEventListener('click', () => this.reset());
    }
}

const game = new Minesweeper(10, 10, 15);