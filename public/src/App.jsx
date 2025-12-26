import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegistrationPage from './pages/RegistrationPage'
import TimetableSetupPage from './pages/TimetableSetupPage'
import DashboardPage from './pages/DashboardPage'
import SubjectDetailPage from './pages/SubjectDetailPage'
import ProfilePage from './pages/ProfilePage'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/setup-timetable" element={<TimetableSetupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/subject/:subjectId" element={<SubjectDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  )
}

export default App