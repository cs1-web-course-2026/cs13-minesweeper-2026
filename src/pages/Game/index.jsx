import { Link } from 'react-router-dom';

import styles from './styles.module.css';

export const implementations = [
  {
    id: 'lypnevskyi-matvii',
    title: 'Lypnevskyi Matvii (KS-13)',
    path: '/lypnevskyi-matvii',
  },
];

export function GamePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Play Game</h1>
        <p className={styles.subtitle}>Оберіть імплементацію Minesweeper.</p>
      </header>

      <section className={styles.list} aria-label="Список ігор">
        {implementations.map((implementation) => (
          <Link key={implementation.id} to={implementation.path} className={styles.card}>
            <div className={styles.cardTitle}>{implementation.title}</div>
            <div className={styles.cardPath}>{implementation.path}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}

