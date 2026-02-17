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
}) => {
  if (!showInputDialog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-purple-500">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 rounded-t-xl flex items-center gap-3">
          <TerminalIcon className="w-6 h-6 text-white" />
          <div>
            <h3 className="font-bold text-lg text-white">Program Input Required</h3>
            <p className="text-sm text-purple-100">
              Input {currentInputIndex + 1} of {inputPrompt.length}
            </p>
          </div>
        </div>

        <div className="p-6">
          <label className="block text-white font-medium mb-2">
            {inputPrompt[currentInputIndex]}
          </label>

          <input
            ref={inputRef}
            type="text"
            value={currentInputValue}
            onChange={(e) => setCurrentInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleInputSubmit()}
            className="w-full px-4 py-3 bg-gray-700 text-pink-300 border-2 border-pink-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono placeholder-pink-400 text-lg"
            placeholder="Type your input here..."
            autoFocus
          />

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                setShowInputDialog(false);
                setOutput("⚠️ Input cancelled by user.");
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleInputSubmit}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition font-medium"
            >
              {currentInputIndex < inputPrompt.length - 1 ? "Next →" : "Run Code"}
            </button>
          </div>

          {userInputs.length > 0 && (
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Previous inputs:</p>
              {userInputs.map((input, idx) => (
                <div key={idx} className="text-green-400 font-mono text-sm">
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
