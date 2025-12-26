import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import apiClient, { API_URL } from '../config/api';

const TimetableSetupPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [hasExistingTimetable, setHasExistingTimetable] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch existing timetable on component mount
  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await apiClient.get('/api/timetable', {
        validateStatus: (status) => status < 500,
      });
      
      if (response.status === 200 && response.data && response.data.subjects) {
        setSubjects(response.data.subjects);
        setHasExistingTimetable(true);
        setHasScanned(response.data.hasScanned || false);
      } else {
        // New user or no timetable, start with empty subject
        setSubjects([{ name: '', days: [] }]);
        setHasExistingTimetable(false);
        setHasScanned(false);
      }
    } catch (err) {
      // Only catch actual errors (not 404)
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setSubjects([{ name: '', days: [] }]);
        setHasExistingTimetable(false);        setHasScanned(false);      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanTimetable = async (file) => {
    if (!file) return;

    setScanning(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('timetableImage', file);

      const response = await apiClient.post(
        '/api/timetable/scan',
        formData
      );

      if (response.data.subjects && Array.isArray(response.data.subjects)) {
        // Remove duplicates and deduplicate days for same subjects
        const uniqueSubjects = {};
        response.data.subjects.forEach(subject => {
          if (uniqueSubjects[subject.name]) {
            // Merge days for duplicate subjects
            const existingDays = new Set(uniqueSubjects[subject.name].days);
            subject.days.forEach(day => existingDays.add(day));
            uniqueSubjects[subject.name].days = Array.from(existingDays);
          } else {
            uniqueSubjects[subject.name] = {
              name: subject.name,
              days: [...new Set(subject.days)] // Remove duplicate days
            };
          }
        });
        
        const deduplicatedSubjects = Object.values(uniqueSubjects);
        setSubjects(deduplicatedSubjects);
        setHasScanned(true);
        setSuccess(`✅ Timetable scanned successfully! Found ${deduplicatedSubjects.length} subjects. Review and save.`);
      } else {
        setError('Could not extract timetable information from the image.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan timetable. Please try again or enter manually.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const handleDayToggle = (subjectIndex, day) => {
    const newSubjects = [...subjects];
    if (newSubjects[subjectIndex].days.includes(day)) {
      newSubjects[subjectIndex].days = newSubjects[subjectIndex].days.filter(d => d !== day);
    } else {
      newSubjects[subjectIndex].days.push(day);
    }
    setSubjects(newSubjects);
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, { name: '', days: [] }]);
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    // Validation
    const validSubjects = subjects.filter(s => s.name.trim() !== '');
    
    if (validSubjects.length === 0) {
      setError('Please add at least one subject');
      setSaving(false);
      return;
    }

    if (validSubjects.some(s => s.days.length === 0)) {
      setError('All subjects must have at least one day selected');
      setSaving(false);
      return;
    }

    try {
      const endpoint = hasExistingTimetable 
        ? '/api/timetable'
        : '/api/timetable/setup';
      
      const method = hasExistingTimetable ? 'put' : 'post';
      
      await apiClient[method](endpoint, 
        { timetable: validSubjects }
      );
      
      setSuccess('Timetable updated successfully!');
      setHasExistingTimetable(true); // Now they have a timetable
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save timetable');
    } finally {
      setSaving(false);
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
        subjects={subjects.map(s => ({ _id: s.name, name: s.name }))}
        onMenuOpen={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => navigate('/profile')}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        subjects={subjects.map(s => ({ _id: s.name, name: s.name }))}
        onSubjectClick={(subjectId) => {
          navigate(`/subject/${subjectId}`);
          setSidebarOpen(false);
        }}
      />

      {/* Main Content */}
      <div className="pt-28 sm:pt-32 p-4 sm:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Manage Timetable</h1>
          <p className="text-gray-300">Edit your subjects and schedule</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
            {success}
          </div>
        )}

        {/* Image Upload Section */}
        <div className="mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Setup: Scan Timetable</h2>
          <p className="text-gray-300 text-sm mb-4">Upload an image of your timetable, and AI will automatically extract your classes and days.</p>
          {hasScanned && (
            <p className="text-yellow-300 text-sm mb-4">⚠️ You have already used your timetable uploads. Please edit manually if needed.</p>
          )}
          
          <label className={`flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-white/30 rounded-lg transition bg-white/5 ${!hasScanned ? 'hover:border-white/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
            <div className="flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <p className="text-white font-medium">
                {scanning ? 'Scanning image...' : hasScanned ? '❌ Upload limit reached (2/2)' : 'Click to upload timetable image'}
              </p>
              <p className="text-gray-400 text-sm">PNG, JPG or GIF</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleScanTimetable(file);
                }
              }}
              disabled={scanning || hasScanned}
            />
          </label>
        </div>

        {/* Subjects List */}
        <div className="space-y-6 mb-8">
          {subjects.map((subject, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-4">
              {/* Subject Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject Name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={subject.name}
                    onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                    placeholder="e.g., Mathematics"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
                  />
                  {subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      className="px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Days Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Classes on:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(index, day)}
                      className={`p-2 rounded-lg transition-all text-sm font-medium ${
                        subject.days.includes(day)
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {subject.days.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Selected: {subject.days.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Subject Button */}
        <button
          type="button"
          onClick={handleAddSubject}
          className="w-full py-3 px-4 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition font-medium mb-6"
        >
          + Add Another Subject
        </button>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-white/90 hover:bg-white disabled:opacity-50 text-black font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {saving ? 'Saving...' : 'Save Timetable'}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimetableSetupPage;
