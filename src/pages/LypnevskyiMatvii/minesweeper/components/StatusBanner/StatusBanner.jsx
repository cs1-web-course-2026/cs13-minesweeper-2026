import styles from './styles.module.css';

export function StatusBanner({ status }) {
  let text = '';
  let variant = 'idle';

  if (status === 'won') {
    text = 'Перемога. Всі безпечні клітинки відкриті.';
    variant = 'win';
  } else if (status === 'lost') {
    text = 'Поразка. Ви підірвалися на міні.';
    variant = 'lose';
  } else if (status === 'idle') {
    text = 'Перший клік завжди безпечний.';
    variant = 'idle';
  } else {
    text = '';
    variant = 'play';
  }

  if (!text) {
    return <div className={styles.bannerSpacer} aria-hidden="true" />;
  }

  return (
    <div className={`${styles.banner} ${styles[`banner--${variant}`]}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}

