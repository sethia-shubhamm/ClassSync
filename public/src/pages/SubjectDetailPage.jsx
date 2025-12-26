import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_URL } from '../config/api';

const SubjectDetailPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassDate, setNewClassDate] = useState('');

  useEffect(() => {
    fetchSubjectDetails();
  }, [subjectId]);

  const fetchSubjectDetails = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/attendance/subjects/${subjectId}/attendance`,
        { withCredentials: true }
      );
      setSubject(response.data.subject);
      setAttendance(response.data.attendance);
      
      const timetable = await axios.get(
        `${API_URL}/api/timetable`,
        { withCredentials: true }
      );
      setAllSubjects(timetable.data.subjects);
    } catch (err) {
      setError('Failed to load subject details');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (recordId, status) => {
    try {
      await axios.put(
        `${API_URL}/api/attendance/${recordId}`,
        { status },
        { withCredentials: true }
      );
      setAttendance(attendance.map(a => a._id === recordId ? { ...a, status } : a));
    } catch (err) {
      setError('Failed to update attendance');
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/api/attendance/${subjectId}/add-class`,
        { date: newClassDate, isRescheduled: true },
        { withCredentials: true }
      );
      setNewClassDate('');
      setShowAddClass(false);
      fetchSubjectDetails();
    } catch (err) {
      setError('Failed to add class');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalClasses = attendance.filter(a => a.status !== 'cancelled').length;
  const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

  const getAttendanceColor = (percentage) => {
    if (percentage < 75) return 'text-red-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Navbar 
        subjects={allSubjects}
        onMenuOpen={() => {}} 
        onProfileClick={() => navigate('/profile')}
      />
      
      <div className="max-w-2xl mx-auto p-4 sm:p-8 pt-28 sm:pt-32">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-purple-300 hover:text-white transition"
        >
          ← Back to Dashboard
        </button>

        {/* Subject Header */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">{subject?.name}</h1>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Classes Attended</p>
              <p className="text-2xl font-bold text-white">{presentCount}/{totalClasses}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Attendance</p>
              <p className={`text-2xl font-bold ${getAttendanceColor(attendancePercentage)}`}>
                {attendancePercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Add Class Button */}
        <button
          onClick={() => setShowAddClass(!showAddClass)}
          className="w-full mb-6 py-3 px-4 bg-purple-500/20 border border-purple-400/50 text-purple-300 rounded-lg hover:bg-purple-500/30 transition font-medium"
        >
          + Add Rescheduled Class
        </button>

        {/* Add Class Form */}
        {showAddClass && (
          <form onSubmit={handleAddClass} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Class Date
              </label>
              <input
                type="date"
                value={newClassDate}
                onChange={(e) => setNewClassDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white"
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-green-500/20 border border-green-400/50 text-green-300 rounded-lg hover:bg-green-500/30 transition"
              >
                Add Class
              </button>
              <button
                type="button"
                onClick={() => setShowAddClass(false)}
                className="flex-1 py-2 px-4 bg-gray-500/20 border border-gray-400/50 text-gray-300 rounded-lg hover:bg-gray-500/30 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Attendance History */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white mb-4">Attendance History</h2>
          {attendance.map((record) => (
            <div
              key={record._id}
              className={`p-4 rounded-lg border transition ${
                record.isRescheduled
                  ? 'bg-blue-500/10 border-blue-400/30'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">
                    {new Date(record.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {record.isRescheduled && (
                    <p className="text-blue-300 text-sm">📅 Rescheduled Class</p>
                  )}
                </div>
                <select
                  value={record.status}
                  onChange={(e) => handleAttendanceChange(record._id, e.target.value)}
                  disabled={record.status === 'cancelled'}
                  className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer appearance-none bg-clip-padding ${
                    record.status === 'present'
                      ? 'bg-green-500/30 text-green-200 border border-green-400/60 focus:border-green-300 focus:ring-2 focus:ring-green-500/30'
                      : record.status === 'absent'
                      ? 'bg-red-500/30 text-red-200 border border-red-400/60 focus:border-red-300 focus:ring-2 focus:ring-red-500/30'
                      : 'bg-gray-500/30 text-gray-200 border border-gray-400/60 focus:border-gray-300 focus:ring-2 focus:ring-gray-500/30'
                  }`}
                >
                  <option value="present" className="bg-gray-900 text-white">Present</option>
                  <option value="absent" className="bg-gray-900 text-white">Absent</option>
                  <option value="cancelled" className="bg-gray-900 text-white">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailPage;
