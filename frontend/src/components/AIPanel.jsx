import React, { useEffect, useRef } from "react";
import { Bot, User, Sparkles, X } from "lucide-react";

const AIPanel = ({
  showAI,
  setShowAI,
  aiResponses,
  aiLoading,
  aiQuery,
  setAiQuery,
  handleAISubmit,
  handleDeleteAIMessage,
  darkMode = false
}) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiResponses, aiLoading]);

  return (
    <div className={`fixed right-0 top-0 h-screen w-64 sm:w-72 lg:w-80 border-l shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 z-50 ${showAI ? 'translate-x-0' : 'translate-x-full'} ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} cursor-default`}>
      {/* Professional VS Code style header */}
      <div className={`px-4 py-3 flex items-center justify-between ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assistant</span>
        </div>
        <button
          onClick={() => setShowAI(false)}
          className={`rounded p-1 transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area - VS Code style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 cursor-default">
        {aiResponses.length === 0 ? (
          <div className="text-center mt-8 px-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
              <Bot className={`w-6 h-6 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
            </div>
            <h4 className={`mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assistant</h4>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ask any question about your code</p>
          </div>
        ) : (
          aiResponses.map((msg, i) => (
            <div key={i} className="space-y-3">
              {/* User Message */}
              <div className="flex gap-3 min-w-0">
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs mb-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>You</div>
                  <div className={`rounded-lg px-3 py-2 text-sm break-words cursor-text ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {msg.q}
                  </div>
                </div>
              </div>

              {/* AI Message */}
              <div className="flex gap-3 min-w-0">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs mb-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assistant</div>
                  <div className={`border rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words cursor-text ${darkMode ? 'bg-blue-900 border-blue-700 text-white' : 'bg-blue-50 border-blue-100 text-gray-900'}`}>
                    {msg.a}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading State */}
        {aiLoading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <div className={`text-xs mb-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assistant</div>
              <div className={`border rounded-lg px-3 py-2 ${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-100'}`}>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - VS Code style */}
      <div className={`border-t p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <textarea
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !aiLoading && handleAISubmit()}
          placeholder="Ask your assistant anything..."
          className={`w-full p-3 border rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
          rows="4"
          disabled={aiLoading}
        />

        <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
