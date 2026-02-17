import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import DailyTasks from './pages/DailyTasks';
import Vision from './pages/Vision';
import Routine from './pages/Routine';
import RandomGoals from './pages/RandomGoals';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="daily" element={<DailyTasks />} />
        <Route path="vision" element={<Vision />} />
        <Route path="routine" element={<Routine />} />
        <Route path="random-goals" element={<RandomGoals />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
