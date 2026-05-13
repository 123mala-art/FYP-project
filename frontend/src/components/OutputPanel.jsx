import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Download,
  Settings,
  BarChart3,
  Clock,
  Zap,
  Bug
} from "lucide-react";

const OutputPanel = ({
  language,
  output,
  errors = [],
  dividerPosition,
  startDragging,
  darkMode = false,
  verticalLayout = false,
  isRunning = false,
  onStopExecution,
  onClearOutput,
  onDownloadOutput,
  onSelectOutput,
  executionTime,
  memoryUsage,
  cpuUsage,
  showExecutionStats = true,
  autoScrollOutput = true
}) => {
  const [activeTab, setActiveTab] = useState('output');
  const [outputHistory, setOutputHistory] = useState([]);
  const [selectedOutputId, setSelectedOutputId] = useState(null);
  const skipHistoryUpdateRef = useRef(false);
  const outputRef = useRef(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (autoScrollOutput && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, autoScrollOutput]);

  // Save output to history when it changes
  useEffect(() => {
    if (skipHistoryUpdateRef.current) {
      skipHistoryUpdateRef.current = false;
      return;
    }

    if (output && output.trim()) {
      setOutputHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1].content === output) {
          return prev;
        }

        const newHistory = [...prev, {
          id: Date.now(),
          content: output,
          timestamp: new Date(),
          language,
          hasErrors: errors.length > 0
        }];
        return newHistory.slice(-10); // Keep last 10 outputs
      });
    }
  }, [output, language, errors.length]);

  const tabs = [
    { id: 'output', label: 'Output', icon: Terminal, count: outputHistory.length },
    { id: 'errors', label: 'Errors', icon: AlertTriangle, count: errors.length },
    { id: 'performance', label: 'Performance', icon: BarChart3 }
  ];

  const clearOutput = () => {
    onClearOutput?.();
    setOutputHistory([]);
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output-${language}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {!verticalLayout && (
        <div
          onMouseDown={startDragging}
          className="w-2 bg-blue-500 cursor-col-resize hover:w-3 transition-all"
          title="Drag to resize"
        ></div>
      )}

      {verticalLayout && (
        <div
          onMouseDown={startDragging}
          className="h-2 bg-blue-500 cursor-row-resize hover:h-3 transition-all"
          title="Drag to resize"
        ></div>
      )}

      <div
        style={verticalLayout ? { height: `${100 - dividerPosition}%` } : { width: `${100 - dividerPosition}%` }}
        className={`min-h-0 flex flex-col overflow-hidden shadow-inner ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
      >
        {/* Enhanced Header */}
        <div className={`flex items-center justify-between px-4 py-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center gap-2">
            {/* Tab Navigation */}
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
                      : (darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200')
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      tab.id === 'errors'
                        ? 'bg-red-500 text-white'
                        : (darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-700')
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {isRunning && (
              <button
                onClick={onStopExecution}
                title="Stop Execution"
                className="flex items-center justify-center w-8 h-8 rounded text-red-600 hover:bg-gray-200 transition-colors"
              >
                <Square className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={clearOutput}
              title="Clear Output"
              className="flex items-center justify-center w-8 h-8 rounded text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={downloadOutput}
              title="Download Output"
              className="flex items-center justify-center w-8 h-8 rounded text-blue-600 hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div ref={outputRef} className="flex-1 overflow-auto">
          {activeTab === 'output' && (
            <div className="p-4">
              {/* Execution Info */}
              {showExecutionStats && (executionTime || memoryUsage || cpuUsage) && (
                <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-4 text-sm">
                    {executionTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{executionTime}ms</span>
                      </div>
                    )}
                    {memoryUsage && (
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>{memoryUsage}MB</span>
                      </div>
                    )}
                    {cpuUsage && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>{cpuUsage}% CPU</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Output Content */}
              {language === "html" || language === "css" ? (
                <iframe
                  title="preview"
                  style={{
                    width: "100%",
                    height: "400px",
                    border: "none",
                    background: "white",
                    borderRadius: "8px",
                  }}
                  srcDoc={output}
                />
              ) : (
                <pre className={`whitespace-pre-wrap break-words text-sm leading-relaxed font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {output ||
                    `// Output Terminal\n// Click 'Run' to execute your ${language} code\n// DevStudio Professional IDE v2.0`}
                </pre>
              )}

              {/* Output History */}
              {outputHistory.length > 1 && (
                <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recent Outputs ({outputHistory.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {outputHistory.slice(-3).reverse().map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedOutputId(item.id);
                          skipHistoryUpdateRef.current = true;
                          onSelectOutput?.(item.content);
                        }}
                        className={`w-full text-left p-2 rounded text-xs transition-colors ${
                          item.id === selectedOutputId
                            ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900')
                            : (darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600')
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{item.language} - {item.timestamp.toLocaleTimeString()}</span>
                          {item.hasErrors && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="p-4">
              {errors.length > 0 ? (
                <div className="space-y-3">
                  {errors.map((err, idx) => (
                    <div key={idx} className={`rounded-lg p-3 text-sm ${darkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'} border`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">Line {err.line}: {err.message}</div>
                          <pre className={`mt-2 whitespace-pre-wrap break-words rounded p-2 text-xs border ${darkMode ? 'bg-gray-700 border-red-600 text-red-100' : 'bg-white border-red-100'}`}>
                            {err.code}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No syntax errors detected!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Execution Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Execution Time</span>
                      <span className="text-sm font-mono">{executionTime || '0'}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm font-mono">{memoryUsage || '0'}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm font-mono">{cpuUsage || '0'}%</span>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Code Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Language</span>
                      <span className="text-sm font-mono">{language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Lines</span>
                      <span className="text-sm font-mono">{output.split('\n').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Characters</span>
                      <span className="text-sm font-mono">{output.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default OutputPanel;
