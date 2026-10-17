import { Editor } from '@monaco-editor/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { htmlSnippets } from './snippets/htmlSnippets';
import { jsSnippets } from './snippets/jsSnippets';
import { yamlSnippets } from './snippets/yamlSnippets';
import theme from './themes/theme.json' with { type: 'json' }
import Cookies from 'js-cookie';
import type { ChangeData, EditorChange } from '../../types/CodeEditorTypes';
import type { Monaco } from '@monaco-editor/react';
import {
  FiSettings,
  FiUsers,
  FiFile,
  FiCode,
  FiType,
  FiMap
} from 'react-icons/fi';
import {
  FaArrowLeft,
  FaArrowRight,
} from 'react-icons/fa'
import { editor, Position } from 'monaco-editor';

interface CodeEditorCompProps {
  editorLanguage: string,
  handleEditorChange: (event: editor.IModelContentChangedEvent) => void,
  setEditorLanguage: React.Dispatch<React.SetStateAction<string>>,
  fileContent: string,
  response: string,
  title: string,
  readOnly: boolean,
  messages: Array<string>,
  isConnectedRef: React.RefObject<Boolean>,
  setRes: React.Dispatch<React.SetStateAction<string>>,
  setFileContent: React.Dispatch<React.SetStateAction<string>>,
  setReadOnly: React.Dispatch<React.SetStateAction<boolean>>,
  readOnlyRef: React.MutableRefObject<boolean>
}

const CodeEditorComp: React.FC<CodeEditorCompProps> = ({
  editorLanguage,
  handleEditorChange,
  setEditorLanguage,
  fileContent,
  response,
  title,
  readOnly,
  messages,
  isConnectedRef,
  setRes,
  setReadOnly,
  readOnlyRef
}) => {
  const [editorFontSize, setEditorFontSize] = useState<number>(parseInt(Cookies.get("editor-fontsize") ?? "18", 10) || 18);
  const [minimap, setMinimap] = useState<boolean>(Cookies.get("editor-minimap") === "false" ? false : true);
  const [toggleSettings, setToggleSettings] = useState<boolean>(false);
  const [clientsCount, setClientsCount] = useState<number>(0)
  const isRemoteChangeRef = useRef<boolean>(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editor;

    monacoInstance.editor.defineTheme('vs-dark', theme as any);

    monacoInstance.languages.registerCompletionItemProvider('html', {
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const textBeforePosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const scriptOpen = /<script[^>]*>/gi;
        const scriptClose = /<\/script>/gi;

        let match;
        let lastOpenIndex = -1;
        let lastCloseIndex = -1;

        while (match = scriptOpen.exec(textBeforePosition)) {
          lastOpenIndex = match.index;
        }

        while (match = scriptClose.exec(textBeforePosition)) {
          lastCloseIndex = match.index;
        }

        const inScriptTag = lastOpenIndex > lastCloseIndex;

        let suggestions = htmlSnippets(monacoInstance).map(snippet => ({
          ...snippet,
          range,
        }));

        if (inScriptTag) {
          const suggestions = jsSnippets(monacoInstance).map(snippet => ({
            ...snippet,
            range,
          }));
          return { suggestions: suggestions };
        }

        return { suggestions: suggestions };
      }
    });

    monacoInstance.languages.registerCompletionItemProvider("javascript", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = jsSnippets(monacoInstance).map(snippet => ({
          ...snippet,
          range,
        }));

        return { suggestions };
      },
    });

    monacoInstance.languages.registerCompletionItemProvider('yaml', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        let suggestions = yamlSnippets(monacoInstance).map(snippet => ({
          ...snippet,
          range
        }))
        return { suggestions: suggestions };
      }
    });

    editor.addCommand(monacoInstance.KeyCode.Enter, () => {
      if (readOnlyRef.current) return;

      const position = editor.getPosition();
      const model = editor.getModel();
      if (!position || !model) return;

      const selection = editor.getSelection();
      const range = selection ?? new monacoInstance.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      );

      editor.executeEdits('manual-enter', [{
        range,
        text: '\n',
        forceMoveMarkers: true,
      }]);

      const newLine = position.lineNumber + 1;
      editor.setPosition({ lineNumber: newLine, column: 1 });
      editor.revealLineInCenterIfOutsideViewport(newLine);
    });

    editor.onDidChangeModelContent((event: editor.IModelContentChangedEvent) => {
      if (readOnlyRef.current) {
        editor.trigger("myapp", "undo", "");
        return;
      }

      if (isRemoteChangeRef.current) {
        isRemoteChangeRef.current = false;
        return;
      }

      handleEditorChange(event);
    });

    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS
      ],
      run: () => {
        console.log("Already saved!");
      }
    });

    editor.addAction({
      id: 'undo-file',
      label: 'Undo File',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyZ
      ],
      run: () => {
        editor.trigger("myapp", "undo", "");
      }
    });

    editor.addAction({
      id: 'redo-file',
      label: 'Redo File',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyZ
      ],
      run: () => {
        editor.trigger("myapp", "redo", "");
      }
    });

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.updateOptions({ 
          readOnly: readOnlyRef.current,
          domReadOnly: readOnlyRef.current 
        });
      }
    }, 0);
  }, [handleEditorChange]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    const position = editorRef.current.getPosition();
    const model = editorRef.current.getModel();

    if (model) {
      model.setValue(fileContent);
      if (position) {
        editorRef.current.setPosition(position);
      }
    }
  }, [fileContent]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    editorRef.current.updateOptions({ 
      readOnly: readOnly,
      domReadOnly: readOnly 
    });
    
    const domNode = editorRef.current.getDomNode();
    if (domNode) {
      const textarea = domNode.querySelector('textarea');
      if (textarea) {
        textarea.readOnly = readOnly;
        textarea.disabled = readOnly;
        
        if (readOnly) {
          textarea.style.opacity = '0.8';
          textarea.style.cursor = 'not-allowed';
          domNode.setAttribute('title', 'Waiting for connection...');
        } else {
          textarea.style.opacity = '1';
          textarea.style.cursor = 'text';
          domNode.removeAttribute('title');
        }
      }
    }
    
    setTimeout(() => {
      editorRef.current?.layout();
    }, 10);
    
  }, [readOnly]);

  useEffect(() => {
    if (isConnectedRef.current && messages.length > 0) {
      let message: EditorChange;

      try {
        message = JSON.parse(messages[messages.length - 1] ?? "");
      } catch (err) {
        console.warn(messages[messages.length - 1]);
        console.error(err);
        return;
      }

      switch (message.type) {
        case "editor-change":
          isRemoteChangeRef.current = true;
          if (message.change) {
            applyRemoteChange(message.change);
          }
          break;
        case "editor-update-usercount":
          setClientsCount(message.count ?? 0);
          break;
        case "error":
          setRes(message.error ?? "Unknown error");
          break;
        case "file-changed-externally":
          setRes("File changed externally! Please refresh!");
          setReadOnly(true);
          break;
        case "full-content-update":
          if (message.content) {
            if (!editorRef.current) return;

            const editor = editorRef.current;
            const model = editor.getModel();

            if (!model) return;

            isRemoteChangeRef.current = true;

            model.applyEdits([{
              range: model.getFullModelRange(),
              text: message.content,
              forceMoveMarkers: true
            }]);
          }
          break;
      }
    }
  }, [messages, isConnectedRef, setRes, setReadOnly]);

  const applyRemoteChange = (change: ChangeData) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();

    if (!model) return;

    switch (change.type) {
      case 'insert':
        model.applyEdits([{
          range: change.range,
          text: change?.text,
          forceMoveMarkers: true
        }]);
        break;
      case 'delete':
        model.applyEdits([{
          range: change.range,
          text: '',
          forceMoveMarkers: true
        }]);
        break;
      case 'replace':
        model.applyEdits([{
          range: change.range,
          text: change.text,
          forceMoveMarkers: true
        }]);
        break;
    }
  };

  return (
    <div className={"flex flex-col h-screen bg-gray-900"}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 md:px-6 py-2 md:py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-6">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <FiCode className="w-6 h-6" />
            <span className="text-md md:text-xl font-bold text-white flex gap-2"><span className='hidden md:block italic'>FolderHost</span> Editor</span>
          </div>

          {/* File Info */}
          <div className="flex items-center space-x-2 text-gray-300">
            <FiFile className="w-4 h-4" />
            <span className="text-sm">{title}</span>
          </div>

          {/* Online Users */}
          <div className="flex items-center space-x-2 text-green-400">
            <FiUsers className="w-4 h-4" />
            <span className="text-sm flex gap-1">
              <span className="hidden md:block">Online:</span> <span className="font-semibold text-emerald-300">{clientsCount}</span>
            </span>
          </div>

          {/* Status */}
          {response && (
            <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <span className="text-sm text-yellow-200">{response}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 md:space-x-3">
          <button
            onClick={() => editorRef.current?.trigger("myapp", "undo", "")}
            className="p-2 md:text-2xl bg-slate-600 rounded-full hover:bg-sky-600 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <button
            onClick={() => editorRef.current?.trigger("myapp", "redo", "")}
            className="p-2 md:text-2xl bg-slate-600 rounded-full hover:bg-sky-600 transition-colors"
          >
            <FaArrowRight />
          </button>
          {/* Settings Toggle */}
          <button
            onClick={() => setToggleSettings(!toggleSettings)}
            className={`hidden md:flex items-center space-x-2 px-4 py-2 transition-colors rounded-lg ${toggleSettings
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            <FiSettings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={`transition-all duration-300 ${toggleSettings ? 'w-3/4' : 'w-full'}`}>
          <Editor
            className="h-full"
            theme="vs-dark"
            onMount={handleEditorDidMount}
            options={{
              fontSize: editorFontSize,
              tabCompletion: "on",
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
              readOnly: readOnly,
              domReadOnly: readOnly,
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              minimap: {
                enabled: minimap,
                renderCharacters: false,
                maxColumn: 120
              },
              scrollBeyondLastLine: false,
              renderWhitespace: 'none',
              unicodeHighlight: {
                ambiguousCharacters: true,
                includeComments: true,
                includeStrings: true,
              },
              padding: { top: 20, bottom: 20 },
              lineNumbersMinChars: 3,
              folding: true,
              showFoldingControls: 'mouseover',
              matchBrackets: 'always',
              automaticLayout: true,
            }}
            language={editorLanguage}
            value={fileContent}
          />
        </div>

        {/* Settings Panel */}
        {toggleSettings && (
          <div className="w-1/4 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <FiSettings className="w-6 h-6" />
                <span>Editor Settings</span>
              </h2>

              {/* Language Selection */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                    <FiCode className="w-4 h-4" />
                    <span>Language</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-transparent"
                    value={editorLanguage}
                    onChange={(e) => setEditorLanguage(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="html">HTML</option>
                    <option value="xml">XML</option>
                    <option value="json">JSON</option>
                    <option value="yaml">YAML</option>
                    <option value="css">CSS</option>
                    <option value="php">PHP</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="kotlin">Kotlin</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="sql">SQL</option>
                    <option value="go">Golang</option>
                    <option value="fsharp">F#</option>
                    <option value="shell">Shell</option>
                    <option value="bat">Batch</option>
                    <option value="markdown">Markdown</option>
                    <option value="plaintext">Plain Text</option>
                  </select>
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                    <FiType className="w-4 h-4" />
                    <span>Font Size</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="10"
                      max="32"
                      value={editorFontSize}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setEditorFontSize(value);
                        Cookies.set("editor-fontsize", value.toString(), {
                          expires: 7
                        });
                      }}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="w-12 px-2 py-1 text-center text-white bg-gray-700 rounded-md">
                      {editorFontSize}px
                    </span>
                  </div>
                </div>

                {/* Minimap */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                    <FiMap className="w-4 h-4" />
                    <span>Minimap</span>
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setMinimap(true);
                        Cookies.set("editor-minimap", "true", {
                          expires: 7
                        });
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors ${minimap
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      Enabled
                    </button>
                    <button
                      onClick={() => {
                        setMinimap(false);
                        Cookies.set("editor-minimap", "false", {
                          expires: 7
                        });
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors ${!minimap
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      Disabled
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 mt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => editorRef.current?.trigger("myapp", "undo", "")}
                      className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Undo (Ctrl+Z)
                    </button>
                    <button
                      onClick={() => editorRef.current?.trigger("myapp", "redo", "")}
                      className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Redo (Ctrl+Shift+Z)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditorComp;