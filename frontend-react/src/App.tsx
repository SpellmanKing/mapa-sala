import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ManageSystemPage } from './pages/ManageSystemPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/manage" replace />} />
        <Route path="/manage" element={<ManageSystemPage />} />
      </Routes>
    </BrowserRouter>
  );
}

