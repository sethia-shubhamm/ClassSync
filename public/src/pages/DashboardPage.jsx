import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { API_URL } from '../config/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [todaySubjects, setTodaySubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/attendance/dashboard`,
        { withCredentials: true }
      );
      setUser(response.data.user);
      setTodaySubjects(response.data.todaySubjects);
      setAllSubjects(response.data.allSubjects);
      setAttendance(response.data.attendance);
    } catch (err) {
      if (err.response?.status === 404) {
        // Timetable not found, redirect to setup
        navigate('/setup-timetable');
      } else if (err.response?.status === 401) {
        // Unauthorized, redirect to login
        navigate('/login');
      } else {
        setError('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (subjectId, status) => {
    try {
      await axios.post(
        `${API_URL}/api/attendance/${subjectId}/mark`,
        { status, date: new Date().toISOString().split('T')[0] },
        { withCredentials: true }
      );
      setAttendance({ ...attendance, [subjectId]: status });
    } catch (err) {
      setError('Failed to mark attendance');
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage < 75) return 'bg-red-500/20 border-red-400/50';
    if (percentage < 80) return 'bg-yellow-500/20 border-yellow-400/50';
    return 'bg-green-500/20 border-green-400/50';
  };

  const getAttendanceTextColor = (percentage) => {
    if (percentage < 75) return 'text-red-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Navbar */}
      <Navbar 
        user={user} 
        subjects={allSubjects}
        onMenuOpen={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => navigate('/profile')}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        subjects={allSubjects}
        onSubjectClick={(subjectId) => {
          navigate(`/subject/${subjectId}`);
          setSidebarOpen(false);
        }}
      />

      {/* Main Content */}
      <div className="pt-28 sm:pt-32 p-4 sm:p-8 max-w-5xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Today's Classes Section */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}'s Classes
          </h2>

          {todaySubjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {todaySubjects.map((subject) => (
                <div
                  key={subject._id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:border-white/50 transition"
                >
                  <h3 className="text-lg font-bold text-white mb-4">{subject.name}</h3>
                  <div className="relative">
                    <select
                      value={attendance[subject._id] || 'present'}
                      onChange={(e) => handleAttendanceChange(subject._id, e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-medium focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 cursor-pointer appearance-none"
                    >
                      <option value="present" className="bg-gray-900 text-white">✓ Present</option>
                      <option value="absent" className="bg-gray-900 text-white">✗ Absent</option>
                      <option value="cancelled" className="bg-gray-900 text-white">⊗ Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 text-center">
              <p className="text-gray-300 text-lg">No classes scheduled for today</p>
            </div>
          )}
        </div>

        {/* Overall Attendance Section */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Attendance Overview</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allSubjects.map((subject) => {
              const subjectAttendance = attendance[subject._id] || {};
              const percentage = subjectAttendance.percentage || 0;

              return (
                <button
                  key={subject._id}
                  onClick={() => navigate(`/subject/${subject._id}`)}
                  className={`p-6 rounded-lg border transition transform hover:scale-105 cursor-pointer ${getAttendanceColor(percentage)}`}
                >
                  <h3 className="text-white font-bold text-lg mb-3 text-left">{subject.name}</h3>
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <p className="text-gray-300 text-sm">Attendance</p>
                      <p className={`text-2xl font-bold ${getAttendanceTextColor(percentage)}`}>
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-300 text-sm">Classes</p>
                      <p className="text-xl font-bold text-white">
                        {subjectAttendance.present || 0}/{subjectAttendance.total || 0}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
