import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ManageSystemPage } from './pages/ManageSystemPage';
import { PainelPage } from './pages/PainelPage';
import { CalculadoraPage } from './pages/CalculadoraPage';
import { Layout } from './components/Layout';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/painel" replace />} />
            <Route path="painel" element={<PainelPage />} />
            <Route path="calculadora" element={<CalculadoraPage />} />
            <Route path="manage" element={<ManageSystemPage />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
