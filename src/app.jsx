import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense } from 'react';

const Hub = lazy(() => import('./pages/Hub'));

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center p-20 text-slate-500 font-bold uppercase tracking-widest animate-pulse">Učitavanje...</div>}>
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
