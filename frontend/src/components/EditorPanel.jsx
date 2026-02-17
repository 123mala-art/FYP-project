import React, { useEffect } from "react";
import Editor from "@monaco-editor/react";

const EditorPanel = ({
  language,
  code,
  onCodeChange,
  onEditorMount,
  darkMode,
  dividerPosition,
}) => {
  const editorRef = React.useRef(null);

  // Detect and highlight errors
  useEffect(() => {
    if (!editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = [];
    const lines = code.split("\n");

    // Basic syntax error detection
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Check for common syntax errors
      if (language === "javascript" || language === "python") {
        // Unclosed brackets
        const openBrackets = (line.match(/[\[\{]/g) || []).length;
        const closeBrackets = (line.match(/[\]\}]/g) || []).length;
        if (openBrackets > closeBrackets) {
          markers.push({
            startLineNumber: lineNum,
            startColumn: 1,
            endLineNumber: lineNum,
            endColumn: line.length + 1,
            message: "⚠️ Unclosed bracket detected",
            severity: 2, // Warning
          });
        }

        // Unclosed quotes
        const singleQuotes = (line.match(/'/g) || []).length;
        const doubleQuotes = (line.match(/"/g) || []).length;
        const backticks = (line.match(/`/g) || []).length;

        if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
          markers.push({
            startLineNumber: lineNum,
            startColumn: 1,
            endLineNumber: lineNum,
            endColumn: line.length + 1,
            message: "⚠️ Unclosed string quote",
            severity: 2,
          });
        }

        // Check for missing colons (Python)
        if (language === "python") {
          if (
            trimmed.match(/^(if|elif|else|for|while|def|class|try|except|finally)/) &&
            !trimmed.endsWith(":")
          ) {
            markers.push({
              startLineNumber: lineNum,
              startColumn: 1,
              endLineNumber: lineNum,
              endColumn: line.length + 1,
              message: "❌ Python: Missing colon (:)",
              severity: 3, // Error
            });
          }
        }
      }

      // Check for C++ syntax errors
      if (language === "cpp") {
        const openBrackets = (line.match(/[\[\{]/g) || []).length;
        const closeBrackets = (line.match(/[\]\}]/g) || []).length;
        if (openBrackets > closeBrackets) {
          markers.push({
            startLineNumber: lineNum,
            startColumn: 1,
            endLineNumber: lineNum,
            endColumn: line.length + 1,
            message: "⚠️ Unclosed bracket detected",
            severity: 2,
          });
        }

        if (trimmed.endsWith(";") === false && trimmed && !trimmed.match(/^[\s]*[{}]/)) {
          if (
            !trimmed.startsWith("//") &&
            !trimmed.startsWith("*") &&
            !trimmed.match(/^(if|else|for|while|switch|case|default)/)
          ) {
            // Optional: warn about missing semicolon
          }
        }
      }
    });

    // Apply markers to editor
    if (editorRef.current && editorRef.current.getModel) {
      const model = editorRef.current.getModel();
      if (model) {
        window.monaco.editor.setModelMarkers(model, "owner", markers);
      }
    }
  }, [code, language]);

  return (
    <div style={{ width: `${dividerPosition}%` }} className="h-full rounded-l-lg overflow-hidden shadow-lg">
      <Editor
        height="100%"
        theme={darkMode ? "vs-dark" : "vs-light"}
        language={language}
        value={code}
        onChange={onCodeChange}
        onMount={(editor) => {
          editorRef.current = editor;
          onEditorMount(editor);
        }}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          glyphMargin: true, // Show error icons in margin
        }}
      />
    </div>
  );
};

export default EditorPanel;
