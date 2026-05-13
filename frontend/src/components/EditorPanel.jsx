import React, { useEffect, useState } from "react";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Play, 
  Search, 
  Replace, 
  Zap,
  Download,
  ChevronDown,
  ChevronUp,
  Hash
} from "lucide-react";

const EditorPanel = ({
  language,
  code,
  onCodeChange,
  onEditorMount,
  onErrorsChange,
  darkMode,
  dividerPosition,
  onRun,
  isRunning,
  setLanguage,
  verticalLayout = false,
  onFormat,
  onFind,
  onReplace,
  onGoToLine,
  onDownload,
  showMinimap = true,
  wordWrap = true,
  fontSize = 14,
  onFontSizeChange,
  tabSize = 2,
  onTabSizeChange,
  insertSpaces = true,
  onInsertSpacesChange
}) => {
  const editorRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [selection, setSelection] = useState({ startLine: 0, endLine: 0, startColumn: 0, endColumn: 0 });

  // Supported languages (removed dummy ones)
  const languages = [
    { id: 'javascript', name: 'JavaScript', icon: 'JS', extensions: ['.js', '.jsx'] },
    { id: 'python', name: 'Python', icon: 'Py', extensions: ['.py'] },
    { id: 'cpp', name: 'C++', icon: 'C++', extensions: ['.cpp', '.cc'] },
    { id: 'java', name: 'Java', icon: 'Java', extensions: ['.java'] },
    { id: 'html', name: 'HTML', icon: 'HTML', extensions: ['.html', '.htm'] },
    { id: 'css', name: 'CSS', icon: 'CSS', extensions: ['.css'] }
  ];

  // No resize handling needed for textarea - CSS flex handles layout automatically

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageSelector && !event.target.closest('.language-selector')) {
        setShowLanguageSelector(false);
      }
      if (showFindReplace && !event.target.closest('.find-replace-panel')) {
        setShowFindReplace(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageSelector, showFindReplace]);

  // Update cursor position and stats
  const updateEditorStats = () => {
    if (!editorRef.current) return;

    const textarea = editorRef.current;
    const text = textarea.value;
    const lines = text.split('\n');
    
    // Get cursor position
    const start = textarea.selectionStart;
    const textBeforeCursor = text.substring(0, start);
    const linesBeforeCursor = textBeforeCursor.split('\n');
    const currentLine = linesBeforeCursor.length;
    const currentColumn = linesBeforeCursor[linesBeforeCursor.length - 1].length + 1;
    
    setCursorPosition({ line: currentLine, column: currentColumn });
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
    setLineCount(lines.length);

    // Get selection info
    const end = textarea.selectionEnd;
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const selectedLines = selectedText.split('\n').length;
      setSelection({
        startLine: currentLine,
        endLine: currentLine + selectedLines - 1,
        startColumn: currentColumn,
        endColumn: currentColumn + selectedText.length
      });
    } else {
      setSelection({
        startLine: currentLine,
        endLine: currentLine,
        startColumn: currentColumn,
        endColumn: currentColumn
      });
    }
  };

  // Helper function to check if brackets are balanced across entire code
  const checkBracketsBalanced = (codeStr) => {
    let stack = [];
    let inString = false;
    let stringChar = null;
    let inComment = false;
    let inLineComment = false;

    for (let i = 0; i < codeStr.length; i++) {
      const char = codeStr[i];
      const nextChar = codeStr[i + 1];
      const prevChar = codeStr[i - 1];

      // Handle line comments
      if (inLineComment) {
        if (char === '\n') inLineComment = false;
        continue;
      }

      // Handle block comments
      if (inComment) {
        if (char === '*' && nextChar === '/') {
          inComment = false;
          i++;
        }
        continue;
      }

      // Check for comment start (but not in strings)
      if (!inString) {
        if (char === '/' && nextChar === '/') {
          inLineComment = true;
          i++;
          continue;
        }
        if (char === '/' && nextChar === '*') {
          inComment = true;
          i++;
          continue;
        }
      }

      // Handle strings
      if (inString) {
        if (char === stringChar && prevChar !== '\\') {
          inString = false;
          stringChar = null;
        }
        continue;
      }

      // Check for string start
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        inString = true;
        stringChar = char;
        continue;
      }

      // Check brackets (ignore in strings and comments)
      if (!inString && !inComment && !inLineComment) {
        if (char === '(' || char === '[' || char === '{') {
          stack.push(char);
        } else if (char === ')' || char === ']' || char === '}') {
          if (stack.length === 0) return false;
          const last = stack.pop();
          if ((char === ')' && last !== '(') || 
              (char === ']' && last !== '[') || 
              (char === '}' && last !== '{')) {
            return false;
          }
        }
      }
    }

    return stack.length === 0;
  };

  // Basic syntax error detection
  useEffect(() => {
    const lines = code.split("\n");
    const errors = [];

    // Check brackets across entire code (not line-by-line)
    if (['javascript', 'python', 'cpp', 'java', 'csharp', 'php'].includes(language)) {
      if (!checkBracketsBalanced(code)) {
        errors.push({
          line: 1,
          message: "Bracket mismatch in code",
          code: "See errors panel",
        });
      }
    }

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return;
      }

      // Python-specific checks
      if (language === "python") {
        if (
          trimmed.match(/^(if|elif|else|for|while|def|class|try|except|finally|with)/) &&
          !trimmed.endsWith(":")
        ) {
          errors.push({
            line: lineNum,
            message: "Missing colon (:)",
            code: line,
          });
        }
      }
    });

    if (onErrorsChange) onErrorsChange(errors);
  }, [code, language, onErrorsChange]);

  // Update editor stats when content changes
  useEffect(() => {
    updateEditorStats();
  }, [code]);

  // Find and replace functionality
  const handleFind = () => {
    if (!editorRef.current || !findText) return;
    
    const textarea = editorRef.current;
    const text = textarea.value;
    const index = text.indexOf(findText, textarea.selectionStart);
    
    if (index !== -1) {
      textarea.setSelectionRange(index, index + findText.length);
      textarea.focus();
    }
  };

  const handleReplace = () => {
    if (!editorRef.current || !findText) return;
    
    const textarea = editorRef.current;
    const text = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    
    if (selectedText === findText) {
      const newText = text.substring(0, start) + replaceText + text.substring(end);
      onCodeChange(newText);
      textarea.setSelectionRange(start, start + replaceText.length);
      textarea.focus();
    }
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || !findText) return;
    
    const textarea = editorRef.current;
    const text = textarea.value;
    const newText = text.replaceAll(findText, replaceText);
    onCodeChange(newText);
    textarea.focus();
  };

  // Go to line functionality
  const handleGoToLine = () => {
    if (!editorRef.current) return;
    
    const line = prompt('Go to line:');
    if (line && !isNaN(line)) {
      const lineNumber = parseInt(line);
      const textarea = editorRef.current;
      const text = textarea.value;
      const lines = text.split('\n');
      
      if (lineNumber > 0 && lineNumber <= lines.length) {
        let charIndex = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
          charIndex += lines[i].length + 1; // +1 for newline
        }
        textarea.setSelectionRange(charIndex, charIndex);
        textarea.focus();
      }
    }
  };

  // Format code
  const handleFormat = () => {
    if (!editorRef.current) return;
    
    // Basic formatting for common languages
    const textarea = editorRef.current;
    let formattedCode = textarea.value;
    
    if (language === 'javascript' || language === 'python' || language === 'cpp' || language === 'java') {
      // Basic indentation fix
      const lines = formattedCode.split('\n');
      let indentLevel = 0;
      const indentSize = insertSpaces ? tabSize : 1;
      const indentChar = insertSpaces ? ' '.repeat(tabSize) : '\t';
      
      formattedCode = lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        // Decrease indent for closing braces/brackets
        if (trimmed.match(/^[\}\]\)]/)) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indented = indentChar.repeat(indentLevel) + trimmed;
        
        // Increase indent for opening braces/brackets
        if (trimmed.match(/[\{\[\(]$/)) {
          indentLevel++;
        }
        
        return indented;
      }).join('\n');
    }
    
    onCodeChange(formattedCode);
  };

  const currentLang = languages.find(lang => lang.id === language) || languages[0];

  return (
    <div 
      ref={containerRef} 
      style={verticalLayout ? { height: `${dividerPosition}%` } : { width: `${dividerPosition}%` }} 
      className={`flex flex-col h-full min-h-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${verticalLayout ? 'border-b' : 'border-r'}`}
    >
      {/* Enhanced Editor Header */}
      <div className={`flex items-center justify-between px-2 sm:px-4 py-2 border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} relative`}>
        <div className="flex items-center gap-2">
          <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className={`text-sm font-medium capitalize hover:bg-gray-200 px-2 py-1 rounded transition-colors language-selector flex items-center gap-1 ${darkMode ? 'text-white hover:bg-gray-600' : 'text-gray-700'}`}
              title="Select Language"
            >
              {currentLang.name}
              {showLanguageSelector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          
          {showLanguageSelector && (
            <div className={`absolute top-full left-0 mt-1 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border rounded-lg shadow-xl z-20 language-selector min-w-48 max-h-64 overflow-y-auto`}>
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setLanguage(lang.id);
                    setShowLanguageSelector(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-xs capitalize hover:bg-gray-100 transition-colors flex items-center gap-2 ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'text-gray-700'} ${language === lang.id ? (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800') : ''}`}
                >
                  <span>{lang.icon}</span>
                  <span>{lang.name}</span>
                  <span className={`text-xs ml-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {lang.extensions.join(', ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Toolbar */}
        <div className="flex items-center gap-1">
          {/* Find/Replace */}
          <button
            onClick={() => setShowFindReplace(!showFindReplace)}
            title="Find & Replace (Ctrl+F)"
            className={`flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors ${showFindReplace ? (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800') : ''} ${darkMode ? 'hover:bg-gray-600' : ''}`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Format Code */}
          <button
            onClick={handleFormat}
            title="Format Code (Shift+Alt+F)"
            className={`flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors ${darkMode ? 'hover:bg-gray-600' : ''}`}
          >
            <Zap className="w-4 h-4" />
          </button>

          {/* Go to Line */}
          <button
            onClick={handleGoToLine}
            title="Go to Line (Ctrl+G)"
            className={`flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors ${darkMode ? 'hover:bg-gray-600' : ''}`}
          >
            <Hash className="w-4 h-4" />
          </button>

          {/* Download Code */}
          <button
            onClick={onDownload}
            title="Download Code"
            className={`flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors ${darkMode ? 'hover:bg-gray-600' : ''}`}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Run Button */}
          <button
            onClick={onRun}
            disabled={isRunning}
            title="Run Code (F5)"
            className={`flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors ml-2 ${
              isRunning ? "text-gray-400 cursor-not-allowed" : "text-green-600 hover:text-green-700"
            }`}
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Find & Replace Panel */}
      {showFindReplace && (
        <div className={`border-b px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} find-replace-panel`}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Find"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
              />
            </div>
            <div className="flex items-center gap-1">
              <Replace className="w-4 h-4" />
              <input
                type="text"
                placeholder="Replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                onKeyDown={(e) => e.key === 'Enter' && handleReplace()}
              />
            </div>
            <button
              onClick={handleFind}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Find
            </button>
            <button
              onClick={handleReplace}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Replace All
            </button>
            <button
              onClick={() => setShowFindReplace(false)}
              className={`p-1 rounded hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-600' : ''}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Code Editor - Textarea-based */}
      <div className="flex-1 relative">
        <div className="w-full h-full">
          <textarea
            ref={editorRef}
            className={`w-full h-full p-4 font-mono resize-none border-0 outline-none ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            value={code}
            onChange={(e) => {
              onCodeChange(e.target.value);
              updateEditorStats();
            }}
            onSelect={() => updateEditorStats()}
            onFocus={() => {
              // Simulate onEditorMount for compatibility
              onEditorMount(editorRef.current);
            }}
            placeholder={`// DevStudio Code Editor\n// Language: ${language}\n// Write your code here...`}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: '1.5',
              tabSize: tabSize,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre'
            }}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Enhanced Status Bar */}
      <div className={`flex items-center justify-between px-4 py-2 border-t ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'} text-xs relative`}>
        <div className="flex items-center gap-4">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          {selection.startLine !== selection.endLine && (
            <span>
              Sel {selection.endLine - selection.startLine + 1} lines, {selection.endColumn - selection.startColumn} chars
            </span>
          )}
          <span>{lineCount} lines</span>
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
        <div className="flex items-center gap-2">
          <span>•</span>
          <span>UTF-8</span>
          <span>•</span>
          <span>LF</span>
          <span>•</span>
          <span>{insertSpaces ? 'Spaces' : 'Tabs'}: {tabSize}</span>
          <span>•</span>
          <span>DevStudio Pro v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;
