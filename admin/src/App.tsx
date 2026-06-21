import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AlertManagement from './pages/AlertManagement';
import UserManagement from './pages/UserManagement';
import ChatMonitor from './pages/ChatMonitor';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="alerts" element={<AlertManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="monitor" element={<ChatMonitor />} />
      </Route>
    </Routes>
  );
}
