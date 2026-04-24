import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeModeProvider } from './context/ThemeContext';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
