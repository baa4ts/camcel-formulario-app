import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('No existe el elemento #root en index.html');
createRoot(root).render(
  <React.StrictMode>
    <HashRouter><App /></HashRouter>
  </React.StrictMode>
);
