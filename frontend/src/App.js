import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Components
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import EditorPanel from "./components/EditorPanel";
import OutputPanel from "./components/OutputPanel";
import InputDialog from "./components/InputDialog";
import AIPanel from "./components/AIPanel";
import HistoryModal from "./components/HistoryModal";

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
  const [codes, setCodes] = useState(DEFAULT_CODES);
  const [output, setOutput] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [dividerPosition, setDividerPosition] = useState(50);

  // AI Chat State
  const [showAI, setShowAI] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponses, setAiResponses] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState("code");  // "code" or "chat"

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
    
    console.log("🔐 Auth Status:");
    console.log("   Token:", token ? "✅ Present" : "❌ Missing");
    console.log("   User:", userStr ? "✅ Present" : "❌ Missing");
    console.log("   Demo Mode:", demoMode ? "✅ Yes (Guest)" : "❌ No (Registered)");
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
    setOutput("⏳ Running your code...\n");

    try {
      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          input: inputString,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOutput(data.output || "✅ Executed successfully!");
      } else {
        setOutput(`❌ Error: ${data.output || data.error || "Execution failed"}`);
      }
    } catch (error) {
      console.error("Execution error:", error);
      setOutput(
        `❌ Connection Error: ${error.message}\n\nMake sure backend is running on port 5000.`
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Main run function
  const handleRun = async () => {
    const code = codes[language];
    if (!code) return;

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
      setOutput("⏳ Running JavaScript...\n");

      try {
        let logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));

        new Function(code)();

        console.log = originalLog;
        setOutput(logs.join("\n") || "✅ Executed successfully!");
      } catch (err) {
        setOutput(`❌ JavaScript Error:\n${err.message}`);
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
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("devstudio_token");
      
      // If authenticated user, save to database
      if (token && !isGuest) {
        console.log("💾 Saving code to account...");
        console.log("Token:", token ? "✅ Present" : "❌ Missing");
        console.log("Language:", language);
        console.log("Code length:", codes[language].length);
        
        const res = await fetch("http://localhost:5000/code/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            language,
            code: codes[language]
          })
        });

        console.log("📖 Save response status:", res.status);
        const data = await res.json();
        console.log("📖 Save response:", data);
        
        if (res.ok) {
          setOutput("💾 Code saved to your account!");
        } else {
          setOutput(`❌ Failed to save: ${data.message}`);
        }
      } else {
        // Guest users: save to local storage only
        localStorage.setItem("savedCodes", JSON.stringify(codes));
        setOutput("💾 Code saved locally! (Login to save to account)");
      }
    } catch (error) {
      console.error("❌ Save error:", error);
      setOutput("❌ Failed to save code: " + error.message);
    }
  };

  const handleLoad = () => {
    // Load from LOCAL STORAGE only (quick access for both guest and registered users)
    try {
      const saved = localStorage.getItem("savedCodes");
      if (saved) {
        setCodes(JSON.parse(saved));
        setOutput("📂 Code loaded from local storage! (Recently saved codes)");
      } else {
        setOutput("⚠️ No local codes saved yet!\n\nTip: Click 'Save' to save your current code to local storage for quick access.");
      }
    } catch (error) {
      console.error("❌ Load error:", error);
      setOutput("❌ Failed to load code: " + error.message);
    }
  };

  const handleClear = () => {
    setCodes((prev) => ({ ...prev, [language]: "" }));
    setOutput("🧹 Editor cleared!");
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
      setOutput("⬇️ Code downloaded!");
    } catch (error) {
      setOutput("❌ Failed to download: " + error.message);
    }
  };

  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  const handleSelectCodeFromHistory = (item) => {
    setCodes((prev) => ({ ...prev, [item.language]: item.code }));
    setLanguage(item.language);
    setOutput(`✅ Loaded ${item.language} code from ${new Date(item.savedAt).toLocaleDateString()}`);
  };

  const handleShare = async () => {
    const code = codes[language];
    try {
      const res = await fetch("http://localhost:5000/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await res.json();
      if (data.shareId) {
        navigator.clipboard.writeText(
          `http://localhost:3000/share/${data.shareId}`
        );
        setOutput(
          `🔗 Share link copied!\nLink: http://localhost:3000/share/${data.shareId}`
        );
      } else {
        setOutput("⚠️ Failed to create share link.");
      }
    } catch (error) {
      setOutput("❌ Backend not responding: " + error.message);
    }
  };

  // ===== AI FUNCTIONS =====
  const handleAISubmit = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);

    try {
      let query = aiQuery;
      
      // If in code mode, include the current code
      if (aiMode === "code") {
        const currentCode = codes[language];
        query = `[${language.toUpperCase()} Code]\n${currentCode}\n\n[Question]\n${aiQuery}`;
      }
      // If in chat mode, just send the question as-is
      
      const res = await fetch("http://localhost:5000/ai", {
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
          { q: aiQuery, a: "❌ No response received" },
        ]);
      }
    } catch (error) {
      console.error("AI request failed:", error);
      setAiResponses((prev) => [
        ...prev,
        { q: aiQuery, a: `❌ Error: ${error.message}` },
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
  const pageBg = darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black";

  return (
    <div className={`min-h-screen ${pageBg} bg-gradient-to-br from-purple-900 via-gray-900 to-black`}>
      <Header
        user={user}
        isGuest={isGuest}
        language={language}
        setLanguage={setLanguage}
        setDarkMode={setDarkMode}
        darkMode={darkMode}
        setShowAI={setShowAI}
        handleLogout={handleLogout}
      />

      <Toolbar
        handleRun={handleRun}
        handleSave={handleSave}
        handleLoad={handleLoad}
        handleClear={handleClear}
        handleDownload={handleDownload}
        handleShare={handleShare}
        handleViewHistory={handleViewHistory}
        isRunning={isRunning}
        isAuthenticated={!isGuest && !!user.email}
      />

      {/* Editor + Output */}
      <div
        ref={containerRef}
        className="flex px-3 gap-0"
        style={{ height: "calc(100vh - 180px)" }}
      >
        <EditorPanel
          language={language}
          code={codes[language]}
          onCodeChange={handleCodeChange}
          onEditorMount={handleEditorMount}
          darkMode={darkMode}
          dividerPosition={dividerPosition}
        />

        <OutputPanel
          language={language}
          output={output}
          dividerPosition={dividerPosition}
          startDragging={startDragging}
        />
      </div>

      {/* Modals */}
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
      />

      <AIPanel
        showAI={showAI}
        setShowAI={setShowAI}
        aiResponses={aiResponses}
        aiLoading={aiLoading}
        aiQuery={aiQuery}
        setAiQuery={setAiQuery}
        handleAISubmit={handleAISubmit}
        aiMode={aiMode}
        setAiMode={setAiMode}
        handleDeleteAIMessage={handleDeleteAIMessage}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectCode={handleSelectCodeFromHistory}
        isAuthenticated={!isGuest && !!user.email}
      />
    </div>
  );
};

export default App;
