import React from "react";
import { Play, History } from "lucide-react";

const Toolbar = ({ 
  handleRun, 
  handleSave, 
  handleLoad, 
  handleClear, 
  handleDownload, 
  handleShare,
  handleViewHistory,
  isRunning,
  isAuthenticated = false
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-800">
      <button
        onClick={handleRun}
        disabled={isRunning}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition ${
          isRunning
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {isRunning ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Running...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run
          </>
        )}
      </button>

      <button
        onClick={handleSave}
        title={isAuthenticated ? "Save to your account" : "Save to local browser"}
        className={`px-4 py-2 rounded-lg text-white font-medium transition ${
          isAuthenticated 
            ? "bg-orange-500 hover:bg-orange-600" 
            : "bg-orange-700 hover:bg-orange-800"
        }`}
      >
        💾 Save {!isAuthenticated && "(Local)"}
      </button>

      <button
        onClick={handleLoad}
        title="Quick load from browser local storage"
        className={`px-4 py-2 rounded-lg text-white font-medium transition ${
          isAuthenticated 
            ? "bg-violet-500 hover:bg-violet-600" 
            : "bg-violet-700 hover:bg-violet-800"
        }`}
      >
        ⚡ Quick Load
      </button>

      <button
        onClick={handleClear}
        className="bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-lg text-white font-medium transition"
      >
        🧹 Clear
      </button>

      <button
        onClick={handleDownload}
        className="bg-fuchsia-500 hover:bg-fuchsia-600 px-4 py-2 rounded-lg text-white font-medium transition"
      >
        ⬇️ Download
      </button>

      <button
        onClick={handleShare}
        className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg text-white font-medium transition"
      >
        🔗 Share
      </button>

      {isAuthenticated && (
        <button
          onClick={handleViewHistory}
          className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-white font-medium transition flex items-center gap-2"
          title="View your previous code history"
        >
          <History className="w-4 h-4" />
          History
        </button>
      )}
    </div>
  );
};

export default Toolbar;
