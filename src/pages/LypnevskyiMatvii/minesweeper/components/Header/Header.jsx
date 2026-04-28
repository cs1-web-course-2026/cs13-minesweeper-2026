import { Link } from 'react-router-dom';

import styles from './styles.module.css';

export function Header({ timeText, flagsLeft, onRestart }) {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <Link to="/game" className={styles.backLink}>
          ← Назад
        </Link>
        <div className={styles.title}>Minesweeper</div>
      </div>

      <div className={styles.panel} aria-label="Панель стану гри">
        <div className={styles.counter} aria-label="Час, що минув">
          <span className={styles.counterValue}>{timeText}</span>
          <span className={styles.counterIcon} aria-hidden="true">
            ⏱
          </span>
        </div>

        <button type="button" className={styles.restartButton} onClick={onRestart} aria-label="Перезапуск">
          😀
        </button>

        <div className={styles.counter} aria-label="Залишилося прапорців">
          <span className={styles.counterIcon} aria-hidden="true">
            🚩
          </span>
          <span className={styles.counterValue}>{String(flagsLeft).padStart(2, '0')}</span>
        </div>
      </div>
    </header>
  );
}

