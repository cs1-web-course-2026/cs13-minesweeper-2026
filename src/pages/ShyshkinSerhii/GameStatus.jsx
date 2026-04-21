import React from 'react';
import styles from './Minesweeper.module.css';

const GameStatus = ({ text, kind }) => {
  if (!text) return null;
  return (
    <div className={`${styles.message} ${styles[kind]}`}>
      {text}
    </div>
  );
};

export default GameStatus;