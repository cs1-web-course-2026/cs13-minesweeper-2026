import { Cell } from '../Cell/Cell.jsx';

import styles from './styles.module.css';

export function Board({ field, hitCellKey, isInteractive, onCellOpen, onCellToggleFlag }) {
  const rows = field.length;
  const cols = field[0]?.length ?? 0;

  return (
    <div
      className={styles.board}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      aria-label="Ігрова сітка"
    >
      {field.flatMap((rowCells, row) =>
        rowCells.map((cell, col) => (
          <Cell
            key={`${row}:${col}`}
            cell={cell}
            row={row}
            col={col}
            isHit={hitCellKey === `${row}:${col}`}
            isInteractive={isInteractive}
            onOpen={() => onCellOpen(row, col)}
            onToggleFlag={() => onCellToggleFlag(row, col)}
          />
        ))
      )}
    </div>
  );
}

