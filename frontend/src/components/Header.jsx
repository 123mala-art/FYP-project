import React from "react";
import { LogOut, User, LogIn, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = ({ user, isGuest, setDarkMode, darkMode, handleLogout, page = 'editor' }) => {
  const navigate = useNavigate();

  return (
    <header className={`h-[60px] p-2 sm:p-4 flex justify-between items-center shadow-lg border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm sm:text-lg">D</span>
        </div>
        <h1 className={`font-bold text-lg sm:text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>DevStudio</h1>
        <span className={`text-xs sm:text-sm hidden sm:block ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {page === 'editor' ? 'Professional IDE' : 'Code with Intelligence'}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {page === 'editor' && (
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg hover:bg-gray-200 transition ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            title={darkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {page === 'home' && !isGuest && (
          <button
            onClick={() => navigate('/editor')}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-sm sm:text-base"
          >
            Open Editor
          </button>
        )}

        <div className={`flex items-center gap-2 sm:gap-3 rounded-lg px-2 py-2 sm:px-4 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
          <User className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {isGuest ? "Guest User" : `${user.username || user.name || "User"}`}
          </span>
        </div>

        {isGuest ? (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
