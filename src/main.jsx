import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { ChapterProvider } from './context/ChapterContext.jsx';
import { TimerProvider } from './context/TimerContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppDataProvider>
        <TimerProvider>
          <ChapterProvider>
            <App />
          </ChapterProvider>
        </TimerProvider>
      </AppDataProvider>
    </AuthProvider>
  </React.StrictMode>
);

