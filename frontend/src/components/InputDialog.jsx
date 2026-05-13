import React from "react";
import { Terminal as TerminalIcon } from "lucide-react";

const InputDialog = ({
  showInputDialog,
  currentInputIndex,
  inputPrompt,
  currentInputValue,
  setCurrentInputValue,
  userInputs,
  handleInputSubmit,
  setShowInputDialog,
  setOutput,
  inputRef,
  darkMode = false,
  autoSubmitInput = true
}) => {
  if (!showInputDialog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="bg-blue-600 p-4 rounded-t-xl flex items-center gap-3">
          <TerminalIcon className="w-6 h-6 text-white" />
          <div>
            <h3 className="font-bold text-lg text-white">Program Input Required</h3>
            <p className="text-sm text-blue-100">
              Input {currentInputIndex + 1} of {inputPrompt.length}
            </p>
          </div>
        </div>

        <div className="p-6">
          <label className={`block font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {inputPrompt[currentInputIndex]}
          </label>

          <input
            ref={inputRef}
            type="text"
            value={currentInputValue}
            onChange={(e) => setCurrentInputValue(e.target.value)}
            onKeyPress={autoSubmitInput ? (e) => e.key === "Enter" && handleInputSubmit() : undefined}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono placeholder-gray-500 text-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
            placeholder="Type your input here..."
            autoFocus
          />

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                setShowInputDialog(false);
                setOutput("⚠️ Input cancelled by user.");
              }}
              className={`px-4 py-2 rounded-lg transition ${darkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
            >
              Cancel
            </button>

            <button
              onClick={handleInputSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {currentInputIndex < inputPrompt.length - 1 ? "Next →" : "Run Code"}
            </button>
          </div>

          {userInputs.length > 0 && (
            <div className={`mt-4 p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Previous inputs:</p>
              {userInputs.map((input, idx) => (
                <div key={idx} className={`font-mono text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {idx + 1}. {input}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputDialog;
