import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Minesweeper from './pages/ShyshkinSerhii/Minesweeper';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/shyshkin-serhii" element={<Minesweeper />} />
        <Route path="/" element={<Navigate to="/shyshkin-serhii" />} />
      </Routes>
    </Router>
  );
}

export default App;