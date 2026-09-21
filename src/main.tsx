import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Admin from './Admin';
import './styles.css';

const isAdminPath = window.location.pathname.startsWith('/admin');
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isAdminPath ? <Admin/> : <App/>}</React.StrictMode>
);