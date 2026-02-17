import React from "react";

const OutputPanel = ({ language, output, dividerPosition, startDragging }) => {
  return (
    <>
      <div
        onMouseDown={startDragging}
        className="w-2 bg-gradient-to-b from-purple-500 to-pink-500 cursor-col-resize hover:w-3 transition-all"
        title="Drag to resize"
      ></div>

      <div
        style={{ width: `${100 - dividerPosition}%` }}
        className="h-full rounded-r-lg bg-black text-green-400 p-4 overflow-auto shadow-lg font-mono"
      >
        {language === "html" || language === "css" ? (
          <iframe
            title="preview"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "white",
              borderRadius: "8px",
            }}
            srcDoc={output}
          />
        ) : (
          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {output ||
              `// Output Terminal\n// Click 'Run' to execute your ${language} code\n// DevStudio Professional IDE v1.0`}
          </pre>
        )}
      </div>
    </>
  );
};

export default OutputPanel;
