import { useState, useRef } from 'react';
import { Play, RotateCcw, Copy, Check } from 'lucide-react';

function detectLanguage(code) {
  if (!code) return 'text';
  const c = code.trim();
  if (c.match(/public\s+class\s|System\.out\.print|void\s+main|import\s+java\./)) return 'java';
  if (c.match(/^#include|cout\s*<<|int\s+main\s*\(/)) return 'cpp';
  if (c.match(/^(def |import |from |print\(|class \w+:)/m)) return 'python';
  if (c.match(/^(SELECT |CREATE TABLE|INSERT INTO)/im)) return 'sql';
  if (c.match(/^(<!DOCTYPE|<html|<div)/i)) return 'html';
  if (c.match(/console\.|const |let |var |function |=>|require\(|import .* from/)) return 'javascript';
  if (c.match(/^(Formula|F_|lim\(|∑|∫|→|Δ)/m)) return 'formula';
  return 'text';
}

export default function CodeEditor({ initialCode = '', language: langProp }) {
  const language = langProp || detectLanguage(initialCode);
  const canRun = language === 'javascript';
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const runCode = () => {
    setRunning(true);
    setOutput('');

    // Capture console.log output
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => logs.push(args.map(String).join(' '));
    console.error = (...args) => logs.push('Error: ' + args.map(String).join(' '));
    console.warn = (...args) => logs.push('Warning: ' + args.map(String).join(' '));

    try {
      const result = new Function(code)();
      if (result !== undefined) {
        logs.push('→ ' + String(result));
      }
      setOutput(logs.join('\n') || '(no output)');
    } catch (err) {
      setOutput('Error: ' + err.message);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setRunning(false);
    }
  };

  const resetCode = () => {
    setCode(initialCode);
    setOutput('');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleKeyDown = (e) => {
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={copyCode}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetCode}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Reset code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {canRun && (
            <button
              onClick={runCode}
              disabled={running}
              className="flex items-center gap-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors ml-1"
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          )}
        </div>
      </div>

      {/* Code textarea */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="w-full bg-gray-900 text-green-400 font-mono text-sm p-3 resize-none focus:outline-none min-h-[120px] leading-relaxed"
        style={{ tabSize: 2 }}
        rows={Math.min(code.split('\n').length + 1, 20)}
      />

      {/* Output */}
      {output && (
        <div className="border-t border-gray-700 bg-gray-950 p-3">
          <p className="text-xs text-gray-500 mb-1 font-mono">Output:</p>
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}

// Read-only code block (for display before editing)
export function CodeBlock({ code, language: langProp }) {
  const language = langProp || detectLanguage(code);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button
          onClick={copyCode}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="bg-gray-900 text-green-400 font-mono text-sm p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}
