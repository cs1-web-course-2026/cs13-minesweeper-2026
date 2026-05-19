function createInitialState(rows = 10, cols = 10, minesCount = 15) {
    return {
        rows,
        cols,
        minesCount,
        status: 'process', // 'process' | 'win' | 'lose'
        gameTime: 0,
        board: [],
        isFirstClick: true
    };
}

function generateField(rows, cols, minesCount) {
    const newState = createInitialState(rows, cols, minesCount);
    const board = [];

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty',   // 'empty' | 'mine'
                state: 'closed',  // 'closed' | 'opened' | 'flagged'
                neighborMines: 0,
                row: r,
                col: c
            });
        }
        board.push(row);
    }

    let minesPlanted = 0;
    while (minesPlanted < minesCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (board[randomRow][randomCol].type !== 'mine') {
            board[randomRow][randomCol].type = 'mine';
            minesPlanted++;
        }
    }

    newState.board = board;
    return calculateAllNeighbors(newState);
}

function getNeighbours(board, r, c, rows, cols) {
    const neighbours = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = r + dr;
            const newCol = c + dc;

            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                neighbours.push(board[newRow][newCol]);
            }
        }
    }
    return neighbours;
}

function calculateAllNeighbors(state) {
    const nextState = JSON.parse(JSON.stringify(state));
    
    for (let r = 0; r < nextState.rows; r++) {
        for (let c = 0; c < nextState.cols; c++) {
            if (nextState.board[r][c].type === 'empty') {
                nextState.board[r][c].neighborMines = countNeighbourMines(nextState.board, r, c, nextState.rows, nextState.cols);
            }
        }
    }
    return nextState;
}

function countNeighbourMines(board, r, c, rows, cols) {
    const neighbours = getNeighbours(board, r, c, rows, cols);
    return neighbours.filter(cell => cell.type === 'mine').length;
}

function openCell(state, r, c) {
    if (state.status !== 'process') return state;

    let nextState = JSON.parse(JSON.stringify(state));
    let cell = nextState.board[r][c];

    if (cell.state === 'opened' || cell.state === 'flagged') return state;

    if (nextState.isFirstClick) {
        nextState.isFirstClick = false;
    }

    if (cell.type === 'mine') {
        cell.state = 'opened';
        nextState.status = 'lose';
        return revealMines(nextState);
    }

    cell.state = 'opened';

    if (cell.neighborMines === 0) {
        const neighbours = getNeighbours(nextState.board, r, c, nextState.rows, nextState.cols);
        neighbours.forEach(neighbour => {
            if (neighbour.state === 'closed') {
                nextState = openCell(nextState, neighbour.row, neighbour.col);
            }
        });
    }

    return checkWinCondition(nextState);
}

function checkWinCondition(state) {
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            if (state.board[r][c].type === 'empty' && state.board[r][c].state !== 'opened') {
                return state;
            }
        }
    }
    state.status = 'win';
    return state;
}

function revealMines(state) {
    state.board.forEach(row => {
        row.forEach(cell => {
            if (cell.type === 'mine') cell.state = 'opened';
        });
    });
    return state;
}

function toggleFlag(state, row, col) {
    if (state.status !== 'process') return state;

    const nextState = JSON.parse(JSON.stringify(state));
    let cell = nextState.board[row][col];
    
    if (cell.state === 'opened') return state;

    if (cell.state === 'closed') {
        cell.state = 'flagged';
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
    }

    return nextState;
}

function incrementGameTime(state) {
    if (state.status !== 'process' || state.isFirstClick) return state;
    
    const nextState = JSON.parse(JSON.stringify(state));
    if (nextState.gameTime < 999) {
        nextState.gameTime++;
    }
    return nextState;
}

