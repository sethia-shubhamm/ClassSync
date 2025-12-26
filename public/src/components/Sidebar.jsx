import React from 'react';

const Sidebar = ({ isOpen, subjects, onSubjectClick }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={() => {}}
        />
      )}

      {/* Mobile Sidebar Only */}
      <div
        className={`fixed left-0 top-16 w-64 h-screen bg-white/10 backdrop-blur-md border-r border-white/20 z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:hidden`}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Subjects</h2>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <button
                key={subject._id}
                onClick={() => onSubjectClick(subject._id)}
                className="w-full text-left px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:text-white hover:border-white/50 transition"
              >
                {subject.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
