import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const Navbar = ({ user, onMenuOpen, onProfileClick, subjects = [] }) => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentSubject = subjects.find(s => s._id === subjectId);
  const visibleSubjects = subjects.slice(0, 3);
  const hasHidden = subjects.length > 3;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex justify-center items-center py-6 sm:py-4 gap-4">
          {/* Logo - Left */}
          <div className="flex items-center gap-3 absolute left-4 sm:left-8 shrink-0">
            <img src="/logo.png" alt="ClassSync" className="w-15 h-20 object-contain" />
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">ClassSync</h1>
          </div>

          {/* Desktop Subjects Navigation - Center */}
          <div className="hidden sm:flex items-center gap-2 flex-1 justify-center">
            {visibleSubjects.map((subject) => (
              <button
                key={subject._id}
                onClick={() => {
                  navigate(`/subject/${subject._id}`);
                  setDropdownOpen(false);
                }}
                className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm transition ${
                  subjectId === subject._id
                    ? 'bg-white text-black font-semibold'
                    : 'bg-white/10 border border-white/20 text-gray-300 hover:text-white hover:border-white/50'
                }`}
              >
                {subject.name}
              </button>
            ))}
            
            {/* Dropdown for remaining subjects */}
            {hasHidden && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm transition ${
                    dropdownOpen
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/10 border border-white/20 text-gray-300 hover:text-white hover:border-white/50'
                  }`}
                >
                  +{subjects.length - 3} More
                </button>
                
                {dropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 min-w-max">
                    {subjects.slice(3).map((subject) => (
                      <button
                        key={subject._id}
                        onClick={() => {
                          navigate(`/subject/${subject._id}`);
                          setDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:bg-white/10 hover:text-white transition border-b border-white/10 last:border-b-0"
                      >
                        {subject.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Profile - Right */}
          <div className="absolute right-4 sm:right-8 hidden sm:flex items-center shrink-0">
            <button
              onClick={onProfileClick}
              className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-lg hover:bg-purple-600 transition"
            >
              👤
            </button>
          </div>

          {/* Mobile Hamburger - Right */}
          <button
            onClick={onMenuOpen}
            className="sm:hidden text-white text-2xl hover:text-gray-300 transition absolute right-4 shrink-0"
          >
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
