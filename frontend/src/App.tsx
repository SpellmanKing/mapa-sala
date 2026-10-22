import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AppProvider } from './context/AppContext';

const PainelPage = lazy(() => import('./pages/PainelPage').then(module => ({ default: module.PainelPage })));
const CalculadoraPage = lazy(() => import('./pages/CalculadoraPage').then(module => ({ default: module.CalculadoraPage })));
const ManageSystemPage = lazy(() => import('./pages/ManageSystemPage').then(module => ({ default: module.ManageSystemPage })));

function App() {
  return (
    <Router>
      <AppProvider>
          <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center text-sm font-bold text-text-muted">Carregando...</div>}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/painel" replace />} />
                <Route path="painel" element={<PainelPage />} />
                <Route path="calculadora" element={<CalculadoraPage />} />
                <Route path="manage" element={<ManageSystemPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
      </AppProvider>
    </Router>
  );
}

export default App;
