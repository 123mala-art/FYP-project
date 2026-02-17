import React, { useState, useEffect } from "react";
import { X, Trash2, Copy } from "lucide-react";

const HistoryModal = ({ isOpen, onClose, onSelectCode, isAuthenticated }) => {
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
      
      const res = await fetch("http://localhost:5000/code/history", {
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
        console.warn("📖 No history returned:", data);
        setHistory([]);
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
    alert("✅ Code copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
          <h2 className="text-2xl font-bold text-white">📂 Your Code History</h2>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center text-gray-400 py-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading your history...
          </div>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-lg">📭 No saved code history yet!</p>
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
                    ? "bg-purple-900 border-purple-500"
                    : "bg-gray-700 border-transparent hover:border-purple-400"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold text-sm bg-purple-900 px-2 py-1 rounded">
                        {item.language.toUpperCase()}
                      </span>
                      <span className="text-gray-300 text-sm">
                        {new Date(item.savedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300 mt-2 text-sm line-clamp-2 font-mono">
                      {item.code.substring(0, 100)}
                      {item.code.length > 100 ? "..." : ""}
                    </p>
                  </div>
                </div>

                {/* Actions - Show on selection */}
                {selectedId === idx && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-600">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCode(item);
                      }}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded font-medium transition text-sm"
                    >
                      ✅ Load This Code
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
        <div className="mt-4 pt-3 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
