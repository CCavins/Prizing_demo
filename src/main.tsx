import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Home from './views/Home';
import Admin from './views/Admin';
import Sim from './views/Sim';
import Play from './views/Play';
import Board from './views/Board';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/sim" element={<Sim />} />
        <Route path="/play" element={<Play />} />
        <Route path="/board" element={<Board />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
