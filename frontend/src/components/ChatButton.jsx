import React from "react";
import { Bot } from "lucide-react";

const ChatButton = ({ onClick, darkMode = false }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 ${
        darkMode
          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
      }`}
      title="Open Assistant"
    >
      <Bot className="w-6 h-6 mx-auto" />
    </button>
  );
};

export default ChatButton;