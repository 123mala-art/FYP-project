import React, { useState, useEffect } from "react";
import { X, Trash2, Copy } from "lucide-react";

const HistoryModal = ({ isOpen, onClose, onSelectCode, isAuthenticated, darkMode = false }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchHistory();
    }
  }, [isOpen, isAuthenticated]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("devstudio_token");
      console.log("📖 Fetching history with token:", token ? "✅ Present" : "❌ Missing");
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' 
        ? `${window.location.protocol}//${window.location.hostname}/api`
        : `${window.location.protocol}//${window.location.hostname}:5000`
      );
      const res = await fetch(`${backendUrl}/code/history`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("📖 History response status:", res.status);
      const data = await res.json();
      console.log("📖 History data:", data);

      if (res.ok && data.history) {
        // Sort by most recent first
        const sorted = [...data.history].sort((a, b) => 
          new Date(b.savedAt) - new Date(a.savedAt)
        );
        console.log("📖 Sorted history:", sorted);
        setHistory(sorted);
      } else {
        if (res.status === 401) {
          // token expired/invalid
          console.warn("📖 History fetch rejected due to expired token");
          localStorage.removeItem("devstudio_token");
          localStorage.removeItem("devstudio_user");
          setHistory([]);
        } else {
          console.warn("📖 No history returned:", data);
          setHistory([]);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching history:", error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCode = (item) => {
    onSelectCode(item);
    onClose();
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-auto shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center mb-4 border-b pb-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your Code History</h2>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading your history...
          </div>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p className="text-lg">No saved code history yet.</p>
            <p className="text-sm mt-2">Save your code to see it here.</p>
          </div>
        )}

        {/* History List */}
        {!loading && history.length > 0 && (
          <div className="space-y-2">
            {history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedId(idx)}
                className={`p-4 rounded-lg cursor-pointer transition border-2 ${
                  selectedId === idx
                    ? `${darkMode ? 'bg-blue-900 border-blue-500' : 'bg-blue-50 border-blue-500'}`
                    : `${darkMode ? 'bg-gray-700 border-transparent hover:border-blue-400' : 'bg-gray-50 border-transparent hover:border-blue-400'}`
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold text-sm bg-blue-100 px-2 py-1 rounded">
                        {item.language.toUpperCase()}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {new Date(item.savedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm line-clamp-2 font-mono ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {item.code.substring(0, 100)}
                      {item.code.length > 100 ? "..." : ""}
                    </p>
                  </div>
                </div>

                {/* Actions - Show on selection */}
                {selectedId === idx && (
                  <div className={`flex gap-2 mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCode(item);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition text-sm"
                    >
                      Load This Code
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(item.code);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Close Button */}
        <div className={`mt-4 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full py-2 rounded-lg transition ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
