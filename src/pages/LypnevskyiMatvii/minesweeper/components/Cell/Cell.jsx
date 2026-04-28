import styles from './styles.module.css';

function getCellAriaLabel(cell, row, col) {
  const rowHuman = row + 1;
  const colHuman = col + 1;

  if (cell.state === 'flagged') {
    return `Рядок ${rowHuman}, стовпчик ${colHuman}, клітинка з прапорцем`;
  }

  if (cell.state === 'closed') {
    return `Рядок ${rowHuman}, стовпчик ${colHuman}, закрита клітинка`;
  }

  if (cell.content === 'mine') {
    return `Рядок ${rowHuman}, стовпчик ${colHuman}, міна`;
  }

  if (cell.neighborMines > 0) {
    return `Рядок ${rowHuman}, стовпчик ${colHuman}, сусідніх мін: ${cell.neighborMines}`;
  }

  return `Рядок ${rowHuman}, стовпчик ${colHuman}, порожня клітинка`;
}

export function Cell({ cell, row, col, isHit, isInteractive, onOpen, onToggleFlag }) {
  const isClosed = cell.state === 'closed';
  const isFlagged = cell.state === 'flagged';
  const isOpen = cell.state === 'open';
  const isMine = cell.content === 'mine';
  const showNumber = isOpen && !isMine && cell.neighborMines > 0;

  let className = styles.cell;

  if (isClosed) {
    className = `${className} ${styles.cellClosed}`;
  } else if (isFlagged) {
    className = `${className} ${styles.cellFlag}`;
  } else {
    className = `${className} ${styles.cellOpen}`;

    if (isMine) {
      className = `${className} ${isHit ? styles.cellMineHit : styles.cellMine}`;
    } else if (cell.neighborMines > 0) {
      className = `${className} ${styles[`cellN${Math.min(8, cell.neighborMines)}`]}`;
    }
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={getCellAriaLabel(cell, row, col)}
      disabled={!isInteractive && !isOpen}
      onClick={isInteractive ? onOpen : undefined}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!isInteractive) return;
        onToggleFlag();
      }}
      onMouseDown={(e) => {
        if (!isInteractive) return;
        if (e.button === 2) {
          e.preventDefault();
          onToggleFlag();
        }
      }}
    >
      {showNumber ? String(cell.neighborMines) : null}
    </button>
  );
}

