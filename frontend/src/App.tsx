import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const PainelPage = lazy(() => import('./pages/PainelPage').then(module => ({ default: module.PainelPage })));
const CalculadoraPage = lazy(() => import('./pages/CalculadoraPage').then(module => ({ default: module.CalculadoraPage })));
const ManageSystemPage = lazy(() => import('./pages/ManageSystemPage').then(module => ({ default: module.ManageSystemPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
        <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center text-sm font-bold text-text-muted">Carregando...</div>}>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/painel" replace />} />
              <Route path="painel" element={<PainelPage />} />
              <Route path="calculadora" element={<CalculadoraPage />} />
              <Route element={<ProtectedRoute permission="MANAGE" />}>
                <Route path="manage" element={<ManageSystemPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
