import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* Additional route placeholders to be added in feature phases:
          /login, /register, /donor/dashboard, /ngo/dashboard, /donations/new */}
    </Routes>
  );
}

export default App;
