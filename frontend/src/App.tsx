import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Positions from './components/Positions';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const PositionPage = lazy(() => import('./pages/PositionPage'));

function App() {
  return (
    <Suspense fallback={<div className="text-center py-5">Cargando...</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/positions" replace />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/positions/:id" element={<PositionPage />} />
        <Route path="*" element={<Navigate to="/positions" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
