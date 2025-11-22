import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

const App = () => {
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponses, setAiResponses] = useState([]);
  const [dividerPosition, setDividerPosition] = useState(50);


  // Chat history is now in-memory only (no backend fetch)

  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const [codes, setCodes] = useState({
    javascript: '// JS code\nconsole.log("Hello World");',
    python: 'print("Hello Bestie 💖")',
    cpp: '#include <iostream>\nusing namespace std;\nint main(){ cout<<"Hello Bestie 💖"; }',
    html: '<h1>Hello Bestie 💖</h1>',
    css: 'h1 { color: hotpink; text-align: center; }',
  });

  // 🪟 Resize divider between editor & output
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

  // ---------- RUN CODE ----------
  const handleRun = async (manualInput = null) => {
    const code = codes[language];
    if (!code) return;

    // If called as an event handler (e.g. onClick={handleRun}) the click event
    // is passed as the first argument. Guard against accidentally sending
    // DOM event objects to the backend (they contain circular references).
    if (manualInput && typeof manualInput !== "string") {
      manualInput = null;
    }

    if (language === "html" || language === "css") {
      const finalHtml = `
        <html>
          <head><style>${codes.css}</style></head>
          <body>${codes.html}</body>
        </html>`;
      setOutput(finalHtml);
      return;
    }

    if (language === "javascript") {
      try {
        let logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));
        new Function(code)();
        console.log = originalLog;
        setOutput(logs.join("\n") || "✅ Executed successfully!");
      } catch (err) {
        setOutput("❌ " + err.message);
      }
      return;
    }

    try {
      setOutput("⏳ Running...");
      console.log(`Executing ${language} code...`);
      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input: manualInput }),
      });

      // Try to read response body (JSON or text) for better error messages
      const contentType = res.headers.get("content-type") || "";
      let data = null;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = { output: await res.text() };
      }

      if (!res.ok) {
        // If server returned JSON error shape, show it, else show status + text
        const errMessage = data && (data.error || data.output) ? (data.error || data.output) : `HTTP ${res.status}`;
        setOutput(`❌ Error: ${errMessage}`);
        return;
      }

      if (data.needsInput) {
        const userInput = prompt("🔸 Your code needs input — please enter it:");
        if (userInput !== null) {
          await handleRun(userInput);
        } else {
          setOutput("⚠️ Input required but cancelled.");
        }
        return;
      }

      setOutput(data.output || "❌ Execution failed");
    } catch (error) {
      console.error("Code execution failed:", error);
      setOutput(`❌ Error: ${error.message || "Backend connection failed"}`);
    }
  };

  // ---------- BUTTONS ----------
  const handleFormat = () => {
    setCodes((prev) => ({ ...prev, [language]: prev[language].trim() }));
  };
  const handleSave = () => {
    localStorage.setItem("savedCodes", JSON.stringify(codes));
    setOutput("💾 Code saved!");
  };
  const handleLoad = () => {
    const saved = localStorage.getItem("savedCodes");
    if (saved) {
      setCodes(JSON.parse(saved));
      setOutput("📂 Code loaded!");
    }
  };
  const handleClear = () => {
    setCodes((prev) => ({ ...prev, [language]: "" }));
    setOutput("🧹 Cleared!");
  };
  const handleDownload = () => {
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
  };

const handleAISubmit = async (e) => {
  e.preventDefault();
  if (!aiQuery.trim()) return;
  
  // Clear any previous console messages
  console.clear();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    console.log("Sending request to AI endpoint...");
    const res = await fetch("http://localhost:5000/ai", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ query: aiQuery }),
      signal: controller.signal
    });
    console.log("Got response:", res.status);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log('Server response data:', data);
    
    if (!data || !data.answer) {
      console.warn('Invalid response format:', data);
      throw new Error('Invalid response from server');
    }

    console.log('Adding new AI response to chat history');
    setAiResponses((prev) => [...prev, { q: aiQuery, a: data.answer }]);
  } catch (error) {
    console.error('AI request failed:', error);
    let errorMessage = 'AI backend not responding';
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out';
    } else if (error instanceof TypeError) {
      errorMessage = 'Network error - Is the server running?';
    } else {
      errorMessage = error.message;
    }
    setAiResponses((prev) => [...prev, { 
      q: aiQuery, 
      a: `❌ Error: ${errorMessage}`
    }]);
  } finally {
    clearTimeout(timeoutId);
  }
  setAiQuery("");
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
        navigator.clipboard.writeText(`http://localhost:3000/share/${data.shareId}`);
        alert("🔗 Share link copied!");
      } else alert("⚠️ Failed to create share link.");
    } catch {
      alert("❌ Backend not responding.");
    }
  };

  const pageBg = darkMode ? "bg-gray-900 text-white" : "bg-pink-100 text-black";
  const editorBg = darkMode ? "bg-white" : "bg-pink-200";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <header
        className="p-4 flex justify-between items-center"
        style={{
          background: "linear-gradient(90deg,#5b21b6 0%,#8b5cf6 50%,#ec4899 100%)",
        }}
      >
        <h1 className="font-bold text-2xl text-white">💻 DevStudio</h1>

        <div className="flex items-center gap-3">
          <select
            className="rounded px-2 py-1 text-gray-900"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 bg-gray-800 text-white rounded"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          <button
            onClick={() => setShowAI(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            🤖 AI
          </button>
        </div>
      </header>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 p-3">
        <button onClick={() => handleRun()} className="bg-emerald-500 px-3 py-2 rounded text-white">
          ▶️ Run
        </button>
        <button onClick={handleFormat} className="bg-cyan-500 px-3 py-2 rounded text-white">
          🎨 Format
        </button>
        <button onClick={handleSave} className="bg-orange-500 px-3 py-2 rounded text-white">
          💾 Save
        </button>
        <button onClick={handleLoad} className="bg-violet-500 px-3 py-2 rounded text-white">
          📂 Load
        </button>
        <button onClick={handleClear} className="bg-rose-500 px-3 py-2 rounded text-white">
          🧹 Clear
        </button>
        <button onClick={handleDownload} className="bg-fuchsia-500 px-3 py-2 rounded text-white">
          ⬇️ Download
        </button>
        <button onClick={handleShare} className="bg-indigo-500 px-3 py-2 rounded text-white">
          🔗 Share
        </button>
      </div>

      {/* Editor + Output */}
      <div ref={containerRef} className="flex px-3 gap-0" style={{ height: "500px" }}>
        <div style={{ width: `${dividerPosition}%` }} className={`h-full ${editorBg} rounded-l overflow-hidden`}>
          <Editor
            height="100%"
            theme={darkMode ? "vs-light" : "vs-dark"}
            language={language}
            value={codes[language]}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
          />
        </div>

        <div
          onMouseDown={startDragging}
          className="w-2 bg-gray-500 cursor-col-resize hover:bg-pink-400"
          title="Drag to resize"
        ></div>

        <div
          style={{ width: `${100 - dividerPosition}%` }}
          className="h-full rounded-r bg-black text-green-400 p-3 overflow-auto"
        >
          {language === "html" || language === "css" ? (
            <iframe
              title="preview"
              style={{ width: "100%", height: "100%", border: "none", background: "white" }}
              srcDoc={output}
            />
          ) : (
            <pre className="whitespace-pre-wrap">{output || "// Output will appear here"}</pre>
          )}
        </div>
      </div>
{/* 🧠 AI Chat Window */}
{showAI && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg w-[400px] h-[500px] flex flex-col relative overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 text-center font-semibold">
        🤖 DevStudio AI Assistant
      </div>

      <button
        onClick={() => setShowAI(false)}
        className="absolute top-2 right-2 text-white hover:text-red-300"
      >
        ✖
      </button>

      {/* Chat controls */}
      <div className="flex justify-end gap-2 p-2 bg-gray-100 border-b">
        <button
          onClick={() => setAiResponses([])}
          className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Chats
        </button>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-3">
        {aiResponses.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">
            Start chatting with your coding assistant 💬
          </p>
        ) : (
          aiResponses.map((msg, i) => (
            <div key={i} className="space-y-1 relative group">
              <button
                onClick={() => {
                  setAiResponses(prev => prev.filter((_, index) => index !== i));
                }}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                title="Delete message"
              >
                ✖
              </button>
              <div className="bg-purple-100 text-purple-900 p-2 rounded-lg self-end">
                <strong>You:</strong> {msg.q}
              </div>
              <div className="bg-gray-200 text-gray-800 p-2 rounded-lg">
                <strong>AI:</strong> {msg.a}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input field */}
      <form onSubmit={handleAISubmit} className="flex border-t p-2 bg-white">
        <input
          type="text"
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          placeholder="Ask AI something..."
          className="flex-1 px-2 py-1 border rounded text-black"
        />
        <button
          type="submit"
          className="ml-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-1 rounded"
        >
          Send
        </button>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default App;
