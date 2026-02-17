import React from "react";
import { LogOut, User, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = ({ user, isGuest, language, setLanguage, setDarkMode, darkMode, setShowAI, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <header
      className="p-4 flex justify-between items-center shadow-lg"
      style={{
        background: "linear-gradient(90deg,#5b21b6 0%,#8b5cf6 50%,#ec4899 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-2xl text-white">💻 DevStudio</h1>
        <span className="text-sm text-purple-200">Professional IDE</span>
      </div>

      <div className="flex items-center gap-3">
        <select
          className="rounded-lg px-3 py-2 text-gray-900 font-medium"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

        <button
          onClick={() => setShowAI(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🤖 AI
        </button>

        <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
          <User className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">
            {isGuest ? "👤 Guest" : `✅ ${user.username || user.name || "User"}`}
          </span>
        </div>

        {isGuest ? (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
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
