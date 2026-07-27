import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ChapterProvider } from './context/ChapterContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ChapterProvider>
        <App />
      </ChapterProvider>
    </AuthProvider>
  </React.StrictMode>
);

