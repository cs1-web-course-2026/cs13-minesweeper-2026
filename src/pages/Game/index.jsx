import React from 'react';
import { Link } from 'react-router-dom';

const implementations = [
  {
    name: 'Гра: Shyshkin Serhii',
    path: '/shyshkin-serhii',
  },
];

const GamePage = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#443322' }}>Minesweeper Implementations</h1>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
        {implementations.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            style={{
              padding: '15px 30px',
              backgroundColor: '#fff',
              border: '2px solid #ddc3a5',
              borderRadius: '12px',
              textDecoration: 'none',
              color: '#7f5539',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
          >
            {game.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GamePage;