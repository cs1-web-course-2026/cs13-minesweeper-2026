import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GamePage from './pages/Game';
import ShyshkinSerhiiMinesweeper from './pages/ShyshkinSerhii/Minesweeper';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GamePage />} />
        <Route path="/shyshkin-serhii" element={<ShyshkinSerhiiMinesweeper />} />
        {/* Якщо користувач ввів щось не те — повертаємо його на головну */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;