import React from 'react';
import { createRoot } from 'react-dom/client';

import { PrimeReactProvider } from 'primereact/api';



import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider>
        <App />
    </PrimeReactProvider>
  </React.StrictMode>,
)
