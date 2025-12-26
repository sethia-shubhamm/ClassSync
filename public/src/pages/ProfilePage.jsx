import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { API_URL } from '../config/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '' });
  const [subjects, setSubjects] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [editName, setEditName] = useState('');

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const dashboardResponse = await axios.get(
        `${API_URL}/api/attendance/dashboard`,
        { withCredentials: true }
      );
      setUser({
        name: dashboardResponse.data.user.name,
        email: dashboardResponse.data.user.email,
      });
      setEditName(dashboardResponse.data.user.name);
      setSubjects(dashboardResponse.data.allSubjects || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        // Not authenticated, redirect to login
        navigate('/login');
      } else {
        setError('Failed to load user data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    setEditName(e.target.value);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!editName.trim()) {
      setError('Name cannot be empty');
      setSaving(false);
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/user/profile`,
        { name: editName },
        { withCredentials: true }
      );
      setUser(prev => ({ ...prev, name: editName }));
      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      setSaving(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setSaving(false);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      setSaving(false);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/auth/change-password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        { withCredentials: true }
      );
      setSuccess('Password changed successfully');
      setShowPasswordChange(false);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTimetable = () => {
    navigate('/setup-timetable');
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (err) {
      // Logout error handling
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Navbar */}
      <Navbar 
        user={user}
        subjects={subjects}
        onMenuOpen={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => navigate('/profile')}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        subjects={subjects}
        onSubjectClick={(subjectId) => {
          navigate(`/subject/${subjectId}`);
          setSidebarOpen(false);
        }}
      />

      <div className="pt-28 sm:pt-32 p-4 sm:p-8 max-w-2xl mx-auto">
        {/* Error & Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
            {success}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              <p className="text-gray-300">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="space-y-6">
          {/* Edit Name */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Personal Information</h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition"
              >
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={handleNameChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 px-4 bg-green-500/20 border border-green-400/50 text-green-300 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div>
                <p className="text-gray-300 mb-2">Name</p>
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-gray-300 mt-4 mb-2">Email</p>
                <p className="text-white font-medium">{user.email}</p>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Security</h2>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordChange && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 px-4 bg-white text-black rounded-lg hover:bg-gray-200 transition disabled:opacity-50 font-medium"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Edit Timetable */}
          <button
            onClick={handleEditTimetable}
            className="w-full p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:border-white/50 transition text-left"
          >
            <h2 className="text-xl font-bold mb-2">📚 Manage Timetable</h2>
            <p className="text-gray-300">Add, remove, or edit your subjects and schedule</p>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-red-500/20 border border-red-400/50 text-red-300 rounded-lg hover:bg-red-500/30 transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
