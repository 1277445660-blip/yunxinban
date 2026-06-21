import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import EmergencyScreen from './screens/EmergencyScreen';

export default function App() {
  return (
    <div className="mobile-container flex flex-col">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/chat/:topicId?" element={<ChatScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/emergency" element={<EmergencyScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
