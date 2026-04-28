import { Navigate, Route, Routes } from 'react-router-dom';

import { GamePage } from './pages/Game/index.jsx';
import { LypnevskyiMatviiPage } from './pages/LypnevskyiMatvii/index.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/game" replace />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/lypnevskyi-matvii" element={<LypnevskyiMatviiPage />} />
      <Route path="*" element={<Navigate to="/game" replace />} />
    </Routes>
  );
}

