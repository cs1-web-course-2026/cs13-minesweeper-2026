import React from 'react';
import ShyshkinSerhiiGame from '../ShyshkinSerhii/Minesweeper';

export const implementations = [
  {
    name: 'Shyshkin Serhii',
    path: 'shyshkin-serhii',
    component: ShyshkinSerhiiGame,
  },
];

const GamePage = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Minesweeper Implementations</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        {implementations.map((game) => (
          <a 
            key={game.path} 
            href={`/${game.path}`} 
            style={{ padding: '10px 20px', border: '1px solid #ccc', borderRadius: '5px', textDecoration: 'none', color: '#333' }}
          >
            Гра: {game.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default GamePage;