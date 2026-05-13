import React, { useState, useEffect } from "react";
import { 
  History, 
  Download, 
  Settings,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Sun,
  Moon,
  LogIn,
  Share2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Toolbar = ({ 
  handleRun, 
  handleLoad, 
  handleDownload, 
  handleShare,
  handleViewHistory,
  handleFormat,
  handleFind,
  handleReplace,
  handleGoToLine,
  handleNewFile,
  handleOpenFile,
  handleSettings,
  isRunning,
  isAuthenticated = false,
  darkMode = false,
  user,
  isGuest,
  handleLogout,
  setDarkMode,
  forceCollapse = false
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (forceCollapse) {
      setIsCollapsed(true);
    }
  }, [forceCollapse]);

  return (
    <>
      <div className={`lg:flex lg:flex-col lg:gap-1 lg:p-2 lg:border-r lg:h-screen lg:transition-all lg:duration-300 hidden ${isCollapsed ? 'lg:w-12 lg:items-center' : 'lg:w-34 lg:items-start'} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        {/* Top Section - Main Controls */}
        <div className="flex flex-col gap-1 flex-1">
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className={`flex items-center justify-start w-full h-8 rounded hover:bg-gray-200 transition-colors ${isCollapsed ? 'text-blue-600 hover:text-blue-700' : 'gap-2 px-2 text-gray-600 hover:text-gray-700'}`}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span className="text-xs text-gray-600">Collapse</span>}
          </button>

          {/* File Operations */}
          <button
            onClick={handleNewFile}
            title="New File (Ctrl+N)"
            className={`flex items-center justify-start w-full h-8 rounded text-blue-600 hover:bg-gray-200 hover:text-blue-700 transition-colors ${isCollapsed ? '' : 'gap-2 px-2'}`}
          >
            <FileText className="w-4 h-4" />
            {!isCollapsed && <span className="text-xs text-gray-600">New</span>}
          </button>

          {/* Load */}
          <button
            onClick={handleLoad}
            title="Load Code"
            className={`flex items-center justify-start w-full h-8 rounded text-purple-600 hover:bg-gray-200 hover:text-purple-700 transition-colors ${isCollapsed ? '' : 'gap-2 px-2'}`}
          >
            <Upload className="w-4 h-4" />
            {!isCollapsed && <span className="text-xs text-gray-600">Load</span>}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            title="Share Code"
            className={`flex items-center justify-start w-full h-8 rounded text-green-600 hover:bg-gray-200 hover:text-green-700 transition-colors ${isCollapsed ? '' : 'gap-2 px-2'}`}
          >
            <Share2 className="w-4 h-4" />
            {!isCollapsed && <span className="text-xs text-gray-600">Share</span>}
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={handleViewHistory}
                title="View History"
                className={`flex items-center justify-start w-full h-8 rounded text-teal-600 hover:bg-gray-200 hover:text-teal-700 transition-colors ${isCollapsed ? '' : 'gap-2 px-2'}`}
              >
                <History className="w-4 h-4" />
                {!isCollapsed && <span className="text-xs text-gray-600">History</span>}
              </button>
            </>
          )}

          {/* Settings */}
          <button
            onClick={handleSettings}
            title="Settings"
            className={`flex items-center justify-start w-full h-8 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-700 transition-colors ${isCollapsed ? '' : 'gap-2 px-2'}`}
          >
            <Settings className="w-4 h-4" />
            {!isCollapsed && <span className="text-xs text-gray-600">Settings</span>}
          </button>
        </div>

        {/* Bottom Section - User Controls */}
        <div className={`w-full border-t pt-4 mt-4 ${isCollapsed ? 'px-1' : 'px-2'} space-y-2 flex flex-col items-center`}>
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-200 transition ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            title={darkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!isCollapsed && <span className="text-xs">{darkMode ? "Light" : "Dark"}</span>}
          </button>

          {/* User Info */}
          <div 
            className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} ${isCollapsed ? '' : 'w-full'} text-center`}
            title={isGuest ? "Guest User - Limited features available" : `User: ${user?.username || user?.name || "User"}\nEmail: ${user?.email || "Not provided"}\nStatus: ${user?.isVerified ? "Verified" : "Unverified"}`}
          >
            <User className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            {!isCollapsed && (
              <span className={`text-xs font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isGuest ? "Guest User" : `${user?.username || user?.name || "User"}`}
              </span>
            )}
          </div>

          {/* Auth Button */}
          {isGuest ? (
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-xs"
              title="Login"
            >
              <LogIn className="w-3 h-3" />
              {!isCollapsed && "Login"}
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-xs"
              title="Logout"
            >
              <LogOut className="w-3 h-3" />
              {!isCollapsed && "Logout"}
            </button>
          )}
        </div>
      </div>

    {/* Mobile bottom toolbar */}
    <div className={`lg:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center p-2 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} z-10`}>
      <button
        onClick={handleNewFile}
        title="New File"
        className="flex flex-col items-center justify-center p-2 rounded-lg text-blue-600 hover:bg-gray-200 transition-colors"
      >
        <FileText className="w-5 h-5" />
        <span className="text-xs mt-1">New</span>
      </button>

      <button
        onClick={handleDownload}
        title="Download"
        className="flex flex-col items-center justify-center p-2 rounded-lg text-blue-600 hover:bg-gray-200 transition-colors"
      >
        <Download className="w-5 h-5" />
        <span className="text-xs mt-1">Download</span>
      </button>

      <button
        onClick={handleShare}
        title="Share Code"
        className="flex flex-col items-center justify-center p-2 rounded-lg text-green-600 hover:bg-gray-200 transition-colors"
      >
        <Share2 className="w-5 h-5" />
        <span className="text-xs mt-1">Share</span>
      </button>

      <button
        onClick={handleSettings}
        title="Settings"
        className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <Settings className="w-5 h-5" />
        <span className="text-xs mt-1">Settings</span>
      </button>
    </div>
    </>
  );
};

export default Toolbar;
