import { useCallback, useEffect, useMemo, useState } from 'react';

import { Board } from './components/Board/Board.jsx';
import { Header } from './components/Header/Header.jsx';
import { StatusBanner } from './components/StatusBanner/StatusBanner.jsx';

import styles from './styles.module.css';

const CELL_CONTENT = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPEN: 'open',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const NEIGHBOR_DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function createCell() {
  return {
    content: CELL_CONTENT.EMPTY,
    neighborMines: 0,
    state: CELL_STATE.CLOSED,
  };
}

function createEmptyField(rows, cols) {
  const field = [];

  for (let row = 0; row < rows; row++) {
    const rowCells = [];

    for (let col = 0; col < cols; col++) {
      rowCells.push(createCell());
    }

    field.push(rowCells);
  }

  return field;
}

function isInBounds(field, row, col) {
  return row >= 0 && col >= 0 && row < field.length && col < field[0].length;
}

function getNeighborCoordinates(field, row, col) {
  const coordinates = [];

  for (const [directionalRow, directionalCol] of NEIGHBOR_DIRECTIONS) {
    const neighborRow = row + directionalRow;
    const neighborCol = col + directionalCol;

    if (!isInBounds(field, neighborRow, neighborCol)) {
      continue;
    }

    coordinates.push([neighborRow, neighborCol]);
  }

  return coordinates;
}

function placeMines(field, minesCount, safeRow, safeCol) {
  const rows = field.length;
  const cols = field[0].length;
  const maxCells = rows * cols;
  const minesToPlace = Math.min(minesCount, maxCells - 1);
  const minePositions = new Set();
  const safeIndex = safeRow * cols + safeCol;

  while (minePositions.size < minesToPlace) {
    const randomIndex = Math.floor(Math.random() * maxCells);

    if (randomIndex === safeIndex) {
      continue;
    }

    minePositions.add(randomIndex);
  }

  for (const positionIndex of minePositions) {
    const row = Math.floor(positionIndex / cols);
    const col = positionIndex % cols;
    field[row][col].content = CELL_CONTENT.MINE;
  }
}

function countNeighborMines(field) {
  for (let row = 0; row < field.length; row++) {
    for (let col = 0; col < field[0].length; col++) {
      const cell = field[row][col];

      if (cell.content !== CELL_CONTENT.EMPTY) {
        cell.neighborMines = 0;
        continue;
      }

      let neighborMineCount = 0;

      for (const [neighborRow, neighborCol] of getNeighborCoordinates(field, row, col)) {
        if (field[neighborRow][neighborCol].content === CELL_CONTENT.MINE) {
          neighborMineCount++;
        }
      }

      cell.neighborMines = neighborMineCount;
    }
  }
}

function createField(rows, cols, minesCount, safeRow, safeCol) {
  const safeRows = Math.max(1, rows);
  const safeCols = Math.max(1, cols);
  const field = createEmptyField(safeRows, safeCols);

  placeMines(field, Math.max(0, minesCount), safeRow, safeCol);
  countNeighborMines(field);

  return field;
}

function cloneField(field) {
  return field.map((row) => row.map((cell) => ({ ...cell })));
}

function countFlagsPlaced(field) {
  let flags = 0;

  for (let row = 0; row < field.length; row++) {
    for (let col = 0; col < field[0].length; col++) {
      if (field[row][col].state === CELL_STATE.FLAGGED) {
        flags++;
      }
    }
  }

  return flags;
}

function checkWin(field) {
  for (let row = 0; row < field.length; row++) {
    for (let col = 0; col < field[0].length; col++) {
      const cell = field[row][col];

      if (cell.content === CELL_CONTENT.EMPTY && cell.state !== CELL_STATE.OPEN) {
        return false;
      }
    }
  }

  return true;
}

function revealAllMines(field) {
  for (let row = 0; row < field.length; row++) {
    for (let col = 0; col < field[0].length; col++) {
      const cell = field[row][col];

      if (cell.content === CELL_CONTENT.MINE) {
        cell.state = CELL_STATE.OPEN;
      }
    }
  }
}

function openCellFlood(field, startRow, startCol) {
  const nextField = cloneField(field);
  const stack = [[startRow, startCol]];

  while (stack.length > 0) {
    const [row, col] = stack.pop();
    const cell = nextField[row][col];

    if (cell.state === CELL_STATE.OPEN || cell.state === CELL_STATE.FLAGGED) {
      continue;
    }

    if (cell.content === CELL_CONTENT.MINE) {
      continue;
    }

    cell.state = CELL_STATE.OPEN;

    if (cell.neighborMines !== 0) {
      continue;
    }

    for (const [neighborRow, neighborCol] of getNeighborCoordinates(nextField, row, col)) {
      const neighborCell = nextField[neighborRow][neighborCol];

      if (neighborCell.state !== CELL_STATE.CLOSED) {
        continue;
      }

      if (neighborCell.content === CELL_CONTENT.MINE) {
        continue;
      }

      stack.push([neighborRow, neighborCol]);
    }
  }

  return nextField;
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function Minesweeper() {
  const rows = 9;
  const cols = 9;
  const minesCount = 10;

  const [gameStatus, setGameStatus] = useState(GAME_STATUS.IDLE);
  const [field, setField] = useState(() => createEmptyField(rows, cols));
  const [seconds, setSeconds] = useState(0);
  const [hitCellKey, setHitCellKey] = useState(null);

  const handleTick = useCallback(() => {
    setSeconds((prev) => prev + 1);
  }, []);

  const flagsLeft = useMemo(() => {
    const flagsPlaced = countFlagsPlaced(field);

    return Math.max(0, minesCount - flagsPlaced);
  }, [field, minesCount]);

  function restart() {
    setGameStatus(GAME_STATUS.IDLE);
    setField(createEmptyField(rows, cols));
    setSeconds(0);
    setHitCellKey(null);
  }

  function openCell(row, col) {
    if (gameStatus === GAME_STATUS.WON || gameStatus === GAME_STATUS.LOST) {
      return;
    }

    if (!isInBounds(field, row, col)) {
      return;
    }

    setField((currentField) => {
      const workingField =
        gameStatus === GAME_STATUS.IDLE ? createField(rows, cols, minesCount, row, col) : currentField;

      if (gameStatus === GAME_STATUS.IDLE) {
        setGameStatus(GAME_STATUS.PLAYING);
        setSeconds(0);
      }

      const currentCell = workingField[row][col];

      if (currentCell.state === CELL_STATE.OPEN || currentCell.state === CELL_STATE.FLAGGED) {
        return workingField;
      }

      if (currentCell.content === CELL_CONTENT.MINE) {
        const nextField = cloneField(workingField);
        nextField[row][col].state = CELL_STATE.OPEN;
        revealAllMines(nextField);
        setGameStatus(GAME_STATUS.LOST);
        setHitCellKey(`${row}:${col}`);

        return nextField;
      }

      const nextField = openCellFlood(workingField, row, col);

      if (checkWin(nextField)) {
        setGameStatus(GAME_STATUS.WON);
      }

      return nextField;
    });
  }

  function toggleFlag(row, col) {
    if (gameStatus === GAME_STATUS.WON || gameStatus === GAME_STATUS.LOST) {
      return;
    }

    if (!isInBounds(field, row, col)) {
      return;
    }

    setField((currentField) => {
      const cell = currentField[row][col];

      if (cell.state === CELL_STATE.OPEN) {
        return currentField;
      }

      if (cell.state === CELL_STATE.CLOSED) {
        const flagsPlaced = countFlagsPlaced(currentField);

        if (flagsPlaced >= minesCount) {
          return currentField;
        }

        const nextField = cloneField(currentField);
        nextField[row][col].state = CELL_STATE.FLAGGED;

        return nextField;
      }

      const nextField = cloneField(currentField);
      nextField[row][col].state = CELL_STATE.CLOSED;

      return nextField;
    });
  }

  return (
    <main className={styles.page}>
      <Header
        timeText={formatTime(gameStatus === GAME_STATUS.IDLE ? 0 : seconds)}
        flagsLeft={flagsLeft}
        onRestart={restart}
      />

      <StatusBanner status={gameStatus} />

      <section className={styles.boardWrap} aria-label="Ігрове поле Сапера">
        <Board
          field={field}
          hitCellKey={hitCellKey}
          isInteractive={gameStatus !== GAME_STATUS.WON && gameStatus !== GAME_STATUS.LOST}
          onCellOpen={openCell}
          onCellToggleFlag={toggleFlag}
        />
      </section>

      {gameStatus === GAME_STATUS.PLAYING && <TickRunner onTick={handleTick} />}
    </main>
  );
}

function TickRunner({ onTick }) {
  useEffect(() => {
    const timerId = setInterval(() => {
      onTick();
    }, 1000);

    return () => clearInterval(timerId);
  }, [onTick]);

  return null;
}

