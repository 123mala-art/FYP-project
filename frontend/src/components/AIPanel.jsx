import React from "react";

const AIPanel = ({
  showAI,
  setShowAI,
  aiResponses,
  aiLoading,
  aiQuery,
  setAiQuery,
  handleAISubmit,
  aiMode,
  setAiMode,
  handleDeleteAIMessage,
}) => {
  if (!showAI) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col border border-purple-500">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="font-bold text-lg">🤖 AI Assistant (Powered by Groq)</h3>
          <button
            onClick={() => setShowAI(false)}
            className="text-white hover:text-red-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex gap-2 p-3 border-b border-purple-500">
          <button
            onClick={() => setAiMode("code")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              aiMode === "code"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            💻 Code Analysis
          </button>
          <button
            onClick={() => setAiMode("chat")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              aiMode === "chat"
                ? "bg-pink-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            💬 Simple Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {aiResponses.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-gray-400 mb-4">🤖 AI Assistant (Powered by Groq)</p>
              {aiMode === "code" ? (
                <>
                  <p className="text-sm text-gray-500 mb-2">💻 Code Analysis Mode</p>
                  <p className="text-xs text-gray-600">Ask questions about your code - it will be automatically analyzed</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-2">💬 Simple Chat Mode</p>
                  <p className="text-xs text-gray-600">Ask any question or have a general conversation</p>
                </>
              )}
            </div>
          ) : (
            aiResponses.map((msg, i) => (
              <div key={i} className="space-y-2 group">
                <div className="bg-purple-600 bg-opacity-30 text-purple-100 p-3 rounded-lg flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <strong>You:</strong> {msg.q}
                  </div>
                  <button
                    onClick={() => handleDeleteAIMessage(i)}
                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition font-bold text-lg flex-shrink-0"
                    title="Delete message"
                  >
                    ×
                  </button>
                </div>
                <div className="bg-gray-700 bg-opacity-50 text-gray-100 p-3 rounded-lg whitespace-pre-wrap">
                  <strong>AI:</strong> {msg.a}
                </div>
              </div>
            ))
          )}
          {aiLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              AI is thinking...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-purple-500">
          <div className="flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !aiLoading && handleAISubmit()}
              placeholder="Ask AI something..."
              disabled={aiLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            />
            <button
              onClick={handleAISubmit}
              disabled={aiLoading || !aiQuery.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
