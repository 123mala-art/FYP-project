import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Components
import Toolbar from "./components/Toolbar";
import EditorPanel from "./components/EditorPanel";
import OutputPanel from "./components/OutputPanel";
import InputDialog from "./components/InputDialog";
import AIPanel from "./components/AIPanel";
import HistoryModal from "./components/HistoryModal";
import ChatButton from "./components/ChatButton";
import SettingsModal from "./components/SettingsModal";

// Constants
const DEFAULT_CODES = {
  javascript: '// JavaScript Code\nconsole.log("Hello from DevStudio!");\nlet name = "Developer";\nconsole.log("Welcome " + name);',
  python: '# Python Code\nprint("Hello from DevStudio!")\nname = input("Enter your name: ")\nage = input("Enter your age: ")\nprint(f"Hello {name}, you are {age} years old!")',
  cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    int age;\n    \n    cout << "Enter your name: ";\n    cin >> name;\n    \n    cout << "Enter your age: ";\n    cin >> age;\n    \n    cout << "Hello " << name << ", you are " << age << " years old!" << endl;\n    \n    return 0;\n}',
  html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>DevStudio</title>\n</head>\n<body>\n    <h1>Hello from DevStudio!</h1>\n    <p>Professional Code Editor</p>\n</body>\n</html>',
  css: '/* CSS Code */\nbody {\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    font-family: Arial, sans-serif;\n    text-align: center;\n    padding: 50px;\n}\n\nh1 {\n    font-size: 3em;\n    animation: fadeIn 1s;\n}\n\n@keyframes fadeIn {\n    from { opacity: 0; }\n    to { opacity: 1; }\n}',
};

const App = () => {
  // ===== STATE MANAGEMENT =====
  const navigate = useNavigate();
  const [language, setLanguage] = useState("javascript");
  const backendUrl = process.env.REACT_APP_BACKEND_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
  const [codes, setCodes] = useState(DEFAULT_CODES);
  const [output, setOutput] = useState("");
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [dividerPosition, setDividerPosition] = useState(50);

  // Enhanced Editor Settings
  const [showMinimap, setShowMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(2);
  const [insertSpaces, setInsertSpaces] = useState(true);

  // Additional Settings
  const [autoClearOutput, setAutoClearOutput] = useState(true);
  const [showExecutionStats, setShowExecutionStats] = useState(true);
  const [autoScrollOutput, setAutoScrollOutput] = useState(true);
  const [autoSubmitInput, setAutoSubmitInput] = useState(true);
  const [executionTimeout, setExecutionTimeout] = useState(30);

  // Enhanced Output Panel Settings
  const [executionTime, setExecutionTime] = useState(null);
  const [memoryUsage, setMemoryUsage] = useState(null);
  const [cpuUsage, setCpuUsage] = useState(null);

  // AI Chat State
  const [showAI, setShowAI] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const location = useLocation();

  // load shared code if navigated with state
  useEffect(() => {
    if (location.state?.shared) {
      const { language: lang, code } = location.state.shared;
      setLanguage(lang);
      setCodes((prev) => ({ ...prev, [lang]: code }));
      setOutput("Shared code loaded!");

      // clear state so reloading doesn't repeat
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const [aiResponses, setAiResponses] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Input Dialog State
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [userInputs, setUserInputs] = useState([]);
  const [currentInputIndex, setCurrentInputIndex] = useState(0);
  const [currentInputValue, setCurrentInputValue] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);  // Refs
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const inputRef = useRef(null);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // User Data
  const user = JSON.parse(localStorage.getItem("devstudio_user") || "{}");
  const isGuest = localStorage.getItem("devstudio_demo") === "true";

  // ===== EFFECTS =====
  // Resize divider
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 20 && newWidth < 80) setDividerPosition(newWidth);
    };
    const stopDragging = () => {
      isDragging.current = false;
      document.body.style.cursor = "default";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (showInputDialog && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInputDialog]);

  // Log auth state on mount
  useEffect(() => {
    const token = localStorage.getItem("devstudio_token");
    const userStr = localStorage.getItem("devstudio_user");
    const demoMode = localStorage.getItem("devstudio_demo") === "true";
    
    console.log("Auth Status:");
    console.log("   Token:", token ? "Present" : "Missing");
    console.log("   User:", userStr ? "Present" : "Missing");
    console.log("   Demo Mode:", demoMode ? "Yes (Guest)" : "No (Registered)");
    console.log("   isGuest:", isGuest);
    console.log("   user:", user);
  }, []);

  // ===== HELPER FUNCTIONS =====
  const startDragging = () => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value) => {
    setCodes((prev) => ({ ...prev, [language]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("devstudio_token");
    localStorage.removeItem("devstudio_user");
    localStorage.removeItem("devstudio_demo");
    navigate("/");
  };

  // Enhanced Editor Handlers
  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const handleFind = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.find').run();
    }
  };

  const handleReplace = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.startFindReplaceAction').run();
    }
  };

  const handleGoToLine = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.gotoLine').run();
    }
  };

  const handleToggleMinimap = (enabled) => {
    setShowMinimap(enabled);
  };

  const handleToggleWordWrap = (enabled) => {
    setWordWrap(enabled);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
  };

  const handleTabSizeChange = (size) => {
    setTabSize(size);
  };

  const handleInsertSpacesChange = (enabled) => {
    setInsertSpaces(enabled);
  };

  // Additional Settings Handlers
  const handleToggleAutoClearOutput = (enabled) => {
    setAutoClearOutput(enabled);
  };

  const handleToggleExecutionStats = (enabled) => {
    setShowExecutionStats(enabled);
  };

  const handleToggleAutoScrollOutput = (enabled) => {
    setAutoScrollOutput(enabled);
  };

  const handleToggleAutoSubmitInput = (enabled) => {
    setAutoSubmitInput(enabled);
  };

  const handleExecutionTimeoutChange = (timeout) => {
    setExecutionTimeout(timeout);
  };

  // Detect input requirements in code
  const analyzeInputNeeds = (code, lang) => {
    const inputs = [];

    if (lang === "python") {
      const inputMatches = code.matchAll(/input\s*\(\s*["']([^"']*)["']\s*\)/g);
      for (const match of inputMatches) {
        inputs.push(match[1] || "Enter value");
      }
    } else if (lang === "cpp") {
      const cinMatches = code.matchAll(/cin\s*>>\s*(\w+)/g);
      for (const match of cinMatches) {
        inputs.push(`Enter ${match[1]}`);
      }
      const scanfMatches = code.matchAll(/scanf\s*\([^,]+,\s*&(\w+)\)/g);
      for (const match of scanfMatches) {
        inputs.push(`Enter ${match[1]}`);
      }
    }

    return inputs;
  };

  // Handle input submission
  const handleInputSubmit = () => {
    const newInputs = [...userInputs, currentInputValue];
    setUserInputs(newInputs);

    if (currentInputIndex < inputPrompt.length - 1) {
      setCurrentInputIndex(currentInputIndex + 1);
      setCurrentInputValue("");
      inputRef.current?.focus();
    } else {
      setShowInputDialog(false);
      executeCodeWithInputs(newInputs.join("\n"));
    }
  };

  // Execute code with collected inputs
  const executeCodeWithInputs = async (inputString) => {
    const code = codes[language];
    setIsRunning(true);
    if (!autoClearOutput) {
      setOutput("Running your code...\n");
    }

    try {
      const res = await fetch(`${backendUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          input: inputString,
          timeout: executionTimeout,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOutput(data.output || "Executed successfully!");
      } else {
        setOutput(`Error: ${data.output || data.error || "Execution failed"}`);
      }
    } catch (error) {
      console.error("Execution error:", error);
      setOutput(
        `Connection Error: ${error.message}\n\nMake sure backend is running on port 5000.`
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Main run function
  const handleRun = async () => {
    const code = codes[language];
    if (!code) return;

    // Auto clear output if enabled
    if (autoClearOutput) {
      setOutput("");
    }

    // HTML/CSS preview
    if (language === "html" || language === "css") {
      const finalHtml = `<html>
        <head><style>${codes.css}</style></head>
        <body>${codes.html}</body>
      </html>`;
      setOutput(finalHtml);
      return;
    }

    // JavaScript runs in browser
    if (language === "javascript") {
      setIsRunning(true);
      if (!autoClearOutput) {
        setOutput("Running JavaScript...\n");
      } else {
        setOutput("Running JavaScript...\n");
      }

      try {
        let logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        new Function(code)();

        console.log = originalLog;
        setOutput(logs.join("\n") || "Executed successfully!");
      } catch (err) {
        setOutput(`JavaScript Error:\n${err.message}`);
      } finally {
        setIsRunning(false);
      }
      return;
    }

    // Check if code needs input (Python/C++)
    const inputNeeds = analyzeInputNeeds(code, language);

    if (inputNeeds.length > 0) {
      setInputPrompt(inputNeeds);
      setUserInputs([]);
      setCurrentInputIndex(0);
      setCurrentInputValue("");
      setShowInputDialog(true);
      return;
    }

    // Execute without input
    executeCodeWithInputs("");
  };

  // ===== TOOLBAR FUNCTIONS =====
  const handleLoad = () => {
    // Load from LOCAL STORAGE only (quick access for both guest and registered users)
    try {
      const saved = localStorage.getItem("savedCodes");
      if (saved) {
        setCodes(JSON.parse(saved));
        setOutput("Code loaded from local storage! (Recently saved codes)");
      } else {
        setOutput("No local saved codes found. Start typing to create a new file.");
      }
    } catch (error) {
      console.error("Load error:", error);
      setOutput("Failed to load code: " + error.message);
    }
  };

  const handleDownload = () => {
    try {
      const extMap = {
        python: "py",
        cpp: "cpp",
        html: "html",
        css: "css",
        javascript: "js",
      };
      const blob = new Blob([codes[language]], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `code.${extMap[language]}`;
      link.click();
      setOutput("Code downloaded!");
    } catch (error) {
      setOutput("Failed to download: " + error.message);
    }
  };

  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  const handleSelectCodeFromHistory = (item) => {
    setCodes((prev) => ({ ...prev, [item.language]: item.code }));
    setLanguage(item.language);
    setOutput(`Loaded ${item.language} code from ${new Date(item.savedAt).toLocaleDateString()}`);
  };

  // Enhanced Toolbar Handlers
  const handleNewFile = () => {
    setCodes((prev) => ({ ...prev, [language]: "" }));
    setOutput("New file created!");
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.py,.cpp,.html,.css,.json,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          setCodes((prev) => ({ ...prev, [language]: content }));
          setOutput(`File "${file.name}" loaded!`);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleShare = async () => {
    try {
      if (!codes[language] || codes[language].trim() === "") {
        setOutput("❌ Cannot share empty code!");
        return;
      }

      setOutput("⏳ Sharing code...");

      const res = await fetch(`${backendUrl}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          language: language, 
          code: codes[language] 
        }),
      });

      const data = await res.json();
      
      if (data.success && data.shareId) {
        // Generate frontend URL instead of using backend URL
        const frontendUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3000}`;
        const shareLink = `${frontendUrl}/share/${data.shareId}`;
        
        // Copy to clipboard
        try {
          await navigator.clipboard.writeText(shareLink);
          setOutput(`✅ Code shared! Link copied to clipboard:\n\n📎 ${shareLink}`);
        } catch (clipboardError) {
          console.error("Clipboard error:", clipboardError);
          setOutput(`✅ Code shared! Link:\n\n📎 ${shareLink}\n\n(Copy the link manually)`);
        }
      } else if (data.error) {
        setOutput(`❌ Failed to share: ${data.error}`);
      } else {
        setOutput(`❌ Failed to share code. Try again.`);
      }
    } catch (error) {
      console.error("Share error:", error);
      setOutput(`❌ Share error: ${error.message}`);
    }
  };

  const handleSettings = () => {
    // Open settings modal
    setShowSettingsModal(true);
  };


  // Enhanced Output Panel Handlers
  const handleStopExecution = () => {
    // Stop execution (placeholder for now)
    setOutput("Execution stopped by user");
  };

  const handleClearOutput = () => {
    setOutput("");
  };

  const handleDownloadOutput = () => {
    // Download functionality is handled in OutputPanel
  };

  // ===== Assistant Functions =====
  const handleAISubmit = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);

    try {
      let query = aiQuery;
      
      // Auto-include current code context with the prompt
      const currentCode = codes[language];
      if (currentCode.trim()) {
        query = `[${language.toUpperCase()} Code]\n${currentCode}\n\n[Question]\n${aiQuery}`;
      }
      
      const res = await fetch(`${backendUrl}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (data.answer) {
        setAiResponses((prev) => [...prev, { q: aiQuery, a: data.answer }]);
      } else {
        setAiResponses((prev) => [
          ...prev,
          { q: aiQuery, a: "No response received" },
        ]);
      }
    } catch (error) {
      console.error("Assistant request failed:", error);
      setAiResponses((prev) => [
        ...prev,
        { q: aiQuery, a: `Error: ${error.message}` },
      ]);
    } finally {
      setAiLoading(false);
      setAiQuery("");
    }
  };

  const handleDeleteAIMessage = (index) => {
    setAiResponses((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== RENDER =====
  const pageBg = darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900";

  return (
    <div className={`h-screen overflow-hidden ${pageBg} ${darkMode ? "bg-slate-900" : "bg-slate-50"}`}>
      {/* Remove header for editor page */}
      
      {/* Main Layout */}
      <div className="flex flex-row h-screen">
        <Toolbar
          handleRun={handleRun}
          handleLoad={handleLoad}
          handleDownload={handleDownload}
          handleShare={handleShare}
          handleViewHistory={handleViewHistory}
          handleFormat={handleFormat}
          handleFind={handleFind}
          handleReplace={handleReplace}
          handleGoToLine={handleGoToLine}
          handleNewFile={handleNewFile}
          handleOpenFile={handleOpenFile}
          handleSettings={handleSettings}
          isRunning={isRunning}
          isAuthenticated={!isGuest && !!user.email}
          darkMode={darkMode}
          user={user}
          isGuest={isGuest}
          handleLogout={handleLogout}
          setDarkMode={setDarkMode}
          forceCollapse={showAI}
        />

        {/* Editor + Output Container */}
        <div
          ref={containerRef}
          className={`flex flex-1 px-0 gap-0 transition-all duration-300 flex-row h-full overflow-hidden ${showAI ? 'lg:mr-80' : ''}`}
        >
          <EditorPanel
            language={language}
            code={codes[language]}
            onCodeChange={handleCodeChange}
            onEditorMount={handleEditorMount}
            onErrorsChange={setSyntaxErrors}
            darkMode={darkMode}
            dividerPosition={dividerPosition}
            onRun={handleRun}
            isRunning={isRunning}
            setLanguage={setLanguage}
            verticalLayout={false}
            onFormat={handleFormat}
            onFind={handleFind}
            onReplace={handleReplace}
            onGoToLine={handleGoToLine}
            onDownload={handleDownload}
            onToggleMinimap={handleToggleMinimap}
            onToggleWordWrap={handleToggleWordWrap}
            showMinimap={showMinimap}
            wordWrap={wordWrap}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            tabSize={tabSize}
            onTabSizeChange={handleTabSizeChange}
            insertSpaces={insertSpaces}
            onInsertSpacesChange={handleInsertSpacesChange}
          />

          <OutputPanel
            language={language}
            output={output}
            errors={syntaxErrors}
            dividerPosition={dividerPosition}
            startDragging={startDragging}
            darkMode={darkMode}
            verticalLayout={false}
            isRunning={isRunning}
            onStopExecution={handleStopExecution}
            onClearOutput={handleClearOutput}
            onDownloadOutput={handleDownloadOutput}
            onSelectOutput={setOutput}
            executionTime={executionTime}
            memoryUsage={memoryUsage}
            cpuUsage={cpuUsage}
            showExecutionStats={showExecutionStats}
            autoScrollOutput={autoScrollOutput}
          />
        </div>

        {/* AI Panel - Professional VS Code style right sidebar */}
        <AIPanel
          showAI={showAI}
          setShowAI={setShowAI}
          aiResponses={aiResponses}
          aiLoading={aiLoading}
          aiQuery={aiQuery}
          setAiQuery={setAiQuery}
          handleAISubmit={handleAISubmit}
          handleDeleteAIMessage={handleDeleteAIMessage}
          darkMode={darkMode}
        />
      </div>

      {showAI ? null : (
        <ChatButton
          onClick={() => setShowAI(!showAI)}
          darkMode={darkMode}
        />
      )}

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectCode={handleSelectCodeFromHistory}
        isAuthenticated={!isGuest && !!user.email}
        darkMode={darkMode}
      />

      <InputDialog
        showInputDialog={showInputDialog}
        currentInputIndex={currentInputIndex}
        inputPrompt={inputPrompt}
        currentInputValue={currentInputValue}
        setCurrentInputValue={setCurrentInputValue}
        userInputs={userInputs}
        handleInputSubmit={handleInputSubmit}
        setShowInputDialog={setShowInputDialog}
        setOutput={setOutput}
        inputRef={inputRef}
        darkMode={darkMode}
        autoSubmitInput={autoSubmitInput}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        darkMode={darkMode}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        tabSize={tabSize}
        onTabSizeChange={handleTabSizeChange}
        insertSpaces={insertSpaces}
        onInsertSpacesChange={handleInsertSpacesChange}
        showMinimap={showMinimap}
        onToggleMinimap={handleToggleMinimap}
        wordWrap={wordWrap}
        onToggleWordWrap={handleToggleWordWrap}
        autoClearOutput={autoClearOutput}
        onToggleAutoClearOutput={handleToggleAutoClearOutput}
        showExecutionStats={showExecutionStats}
        onToggleExecutionStats={handleToggleExecutionStats}
        autoScrollOutput={autoScrollOutput}
        onToggleAutoScrollOutput={handleToggleAutoScrollOutput}
        autoSubmitInput={autoSubmitInput}
        onToggleAutoSubmitInput={handleToggleAutoSubmitInput}
        executionTimeout={executionTimeout}
        onExecutionTimeoutChange={handleExecutionTimeoutChange}
      />
    </div>
  );
};

export default App;
