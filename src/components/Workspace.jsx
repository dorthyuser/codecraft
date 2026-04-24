import { useState, useEffect, useRef, useCallback } from 'react';
import I from './Icons';
import { workspace as wsApi, analyze as analyzeApi, chat as chatApi, diff as diffApi } from '../api/client';
import { ACTIVITIES, SUGGESTIONS, CODE_SAMPLES } from '../data/index';

// ─── Simple syntax highlighter for real code ──────────────────────────────────
function highlightLine(line, language) {
  const esc = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kws = {
    java: /\b(public|private|protected|class|interface|extends|implements|new|return|void|static|final|if|else|for|while|try|catch|throws|import|package|null|this|super|true|false)\b/g,
    csharp: /\b(public|private|protected|class|interface|namespace|using|new|return|void|static|readonly|if|else|for|foreach|while|try|catch|null|this|base|true|false|var|async|await)\b/g,
    javascript: /\b(const|let|var|function|class|extends|return|if|else|for|while|try|catch|new|null|undefined|true|false|async|await|import|export|from|of|in|typeof|instanceof)\b/g,
    typescript: /\b(const|let|var|function|class|extends|return|if|else|for|while|try|catch|new|null|undefined|true|false|async|await|import|export|from|of|in|typeof|interface|type|enum)\b/g,
    python: /\b(def|class|import|from|return|if|elif|else|for|while|try|except|with|as|None|True|False|and|or|not|in|is|lambda|yield|pass|break|continue)\b/g,
    go: /\b(func|type|struct|interface|var|const|return|if|else|for|range|go|defer|chan|map|package|import|nil|true|false)\b/g,
  };
  const kwRe = kws[language] || kws.javascript;
  return esc
    .replace(/(\/\/[^\n]*)|(#[^\n]*)/g, '<span class="tk-cmt">$&</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="tk-str">$1</span>')
    .replace(kwRe, '<span class="tk-kw">$&</span>')
    .replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span class="tk-type">$1</span>')
    .replace(/\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="tk-fn">$1</span>');
}

function RealCodeViewer({ file, onLensClick }) {
  if (!file?.content) return (
    <div className="code-area" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
      Select a file to view its contents
    </div>
  );
  const lines = file.content.split('\n');
  return (
    <div className="code-area">
      <div className="gutter mono">
        {lines.map((_, i) => <span key={i} className="ln">{i + 1}</span>)}
      </div>
      <div className="code-lines">
        {lines.map((line, i) => (
          <span key={i} className="cl"
            dangerouslySetInnerHTML={{ __html: highlightLine(line, file.language) || ' ' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Real file tree (backend data) ────────────────────────────────────────────
function RealTreeNode({ node, depth, onSelect, selectedPath }) {
  const [open, setOpen] = useState(node.open ?? depth < 2);
  const pad = { paddingLeft: depth * 12 + 4 };
  if (node.type === 'file') {
    return (
      <div className={`ft-node ${selectedPath === node.path ? 'active' : ''}`} style={pad}
        onClick={() => onSelect(node)}>
        <span className="caret" style={{ visibility: 'hidden' }}><I.ChevR size={10} /></span>
        <span className="ico"><I.File size={12} /></span>
        <span>{node.name}</span>
      </div>
    );
  }
  return (
    <>
      <div className="ft-node" style={pad} onClick={() => setOpen(o => !o)}>
        <span className={`caret ${open ? 'open' : ''}`}><I.ChevR size={10} /></span>
        <span className="ico">{open ? <I.FolderOpen size={13} /> : <I.Folder size={13} />}</span>
        <span>{node.name}</span>
      </div>
      {open && node.children?.map((c, i) => (
        <RealTreeNode key={i} node={c} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} />
      ))}
    </>
  );
}

function RealFileTree({ files, workspaceId, projectName, selectedPath, onFileSelect }) {
  const [query, setQuery] = useState('');
  const filtered = query
    ? files.filter(n => JSON.stringify(n).toLowerCase().includes(query.toLowerCase()))
    : files;

  return (
    <div className="filetree">
      <div className="ft-search">
        <I.Search size={12} />
        <input placeholder="Search files…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <div className="ft-node" style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
        <span className="caret open"><I.ChevR size={10} /></span>
        <span className="ico"><I.FolderOpen size={13} /></span>
        <span>{projectName}</span>
      </div>
      {filtered.map((n, i) => (
        <RealTreeNode key={i} node={n} depth={1} onSelect={onFileSelect} selectedPath={selectedPath} />
      ))}
    </div>
  );
}

// ─── Chat panel with streaming AI ─────────────────────────────────────────────
const INSTRUCTION_BUTTONS = [
  { id: 'analyse',  label: 'Analyse code',         icon: 'Sparkle', prompt: 'Analyse this code end-to-end.' },
  { id: 'refactor', label: 'Refactor',             icon: 'Bolt',    prompt: 'Refactor for clarity.' },
  { id: 'fix',      label: 'Fix code',             icon: 'Wrench',  prompt: 'Find and fix bugs.' },
  { id: 'tests',    label: 'Generate tests',       icon: 'Flask',   prompt: 'Generate unit tests.' },
  { id: 'coverage', label: 'Coverage report',      icon: 'Shield',  prompt: 'Produce a coverage report targeting 99%.' },
  { id: 'verify',   label: 'Check my instruction', icon: 'Info',    prompt: 'Check my instruction for errors or ambiguity.' },
];

function ChatPanel({ activity, currentFile, workspaceId, selectedSugg, setSelectedSugg, onPreviewSuggestion }) {
  const act = ACTIVITIES.find(a => a.id === activity) || ACTIVITIES[0];
  const isRealMode = !!workspaceId;

  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [draft, setDraft] = useState('');
  const [activeInstrs, setActiveInstrs] = useState([]);
  const bodyRef = useRef(null);
  const abortRef = useRef(null);

  // Auto-run analysis when activity changes (real mode only)
  useEffect(() => {
    if (!isRealMode || !currentFile) return;
    runAnalysis();
  }, [activity, currentFile?.path]);

  // Demo mode: show mock suggestions with delay
  useEffect(() => {
    if (isRealMode) return;
    setThinking(true);
    setSuggestions([]);
    const t = setTimeout(() => {
      setThinking(false);
      const mockSuggs = SUGGESTIONS[activity] || SUGGESTIONS.improve;
      mockSuggs.forEach((s, i) => setTimeout(() => setSuggestions(prev => [...prev, s]), i * 320));
    }, 900);
    return () => clearTimeout(t);
  }, [activity, isRealMode]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, thinking, suggestions]);

  function runAnalysis() {
    if (!currentFile) return;
    setThinking(true);
    setStreaming(false);
    setSuggestions([]);
    setMessages([
      { role: 'user', content: `${act.label}: ${currentFile.path}`, ts: Date.now() },
    ]);

    let aiText = '';
    analyzeApi.run(
      workspaceId, currentFile.path, activity, null, currentFile.language,
      {
        onText(chunk) {
          aiText += chunk;
          setThinking(false);
          setStreaming(true);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') return [...prev.slice(0, -1), { ...last, content: aiText }];
            return [...prev, { role: 'assistant', content: aiText }];
          });
        },
        onSuggestions(data) { setSuggestions(data || []); },
        onDone() { setStreaming(false); },
        onError(e) {
          setThinking(false);
          setStreaming(false);
          setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
        },
      }
    );
  }

  function sendChat() {
    const chosen = INSTRUCTION_BUTTONS.filter(b => activeInstrs.includes(b.id));
    const parts = [...chosen.map(b => b.prompt), draft.trim()].filter(Boolean);
    if (!parts.length) return;
    const userMsg = parts.join(' ');
    setDraft('');
    setActiveInstrs([]);

    const newMsgs = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMsgs);
    setStreaming(true);

    let reply = '';
    const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
    chatApi.send(apiMsgs, workspaceId, currentFile?.path, null, currentFile?.language, {
      onChunk(chunk) {
        reply += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') return [...prev.slice(0, -1), { ...last, content: reply }];
          return [...prev, { role: 'assistant', content: reply }];
        });
      },
      onDone() { setStreaming(false); },
      onError(e) {
        setStreaming(false);
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
      },
    });
  }

  const demoMessages = {
    fix: 'I found one active issue and a couple of preventative fixes. The main risk is an NPE when items is null.',
    improve: "Here are three improvements I'd prioritize — readability first, then a real N+1 perf win.",
    refactor: 'Two refactors that keep behavior identical.',
    secure: 'Two findings. The authorization gap is the one to fix today.',
    tests: "I can generate a test class covering the main paths for 99%+ line coverage.",
    explain: "Here's a breakdown of what this file does.",
  };

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div>
          <div className="chat-activity-badge"><I.Sparkle size={11} /> {act.label}</div>
          <div className="chat-sub" style={{ marginTop: 4 }}>
            {currentFile ? currentFile.path.split('/').pop() : 'OrderService.java'} · {currentFile?.language || 'Java'}
          </div>
        </div>
        {isRealMode && <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={runAnalysis} disabled={thinking || streaming}>
          {thinking || streaming ? '…' : <><I.Sparkle size={11} /> Re-run</>}
        </button>}
        <button className="icon-btn" title="Close"><I.Close size={14} /></button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {/* Demo mode */}
        {!isRealMode && (
          <>
            <div className="msg user">
              <span className="ava">U</span>
              <div className="content">
                <div className="name">You</div>
                <div className="text">{act.label} this code.</div>
              </div>
            </div>
            {thinking ? (
              <div className="msg ai">
                <span className="ava">AI</span>
                <div className="content">
                  <div className="name">Assistant</div>
                  <div className="ai-thinking">Analysing…<span className="dots"><span/><span/><span/></span></div>
                </div>
              </div>
            ) : (
              <div className="msg ai">
                <span className="ava">AI</span>
                <div className="content">
                  <div className="name">Assistant</div>
                  <div className="text">{demoMessages[activity]}</div>
                  <SuggList suggestions={suggestions} selectedSugg={selectedSugg} setSelectedSugg={setSelectedSugg} onPreview={onPreviewSuggestion} isDemo />
                  {suggestions.length > 0 && <div style={{ color:'var(--muted)', fontSize:12, marginTop:10 }}>Pick one to preview a diff, or ask a follow-up below.</div>}
                </div>
              </div>
            )}
          </>
        )}

        {/* Real mode */}
        {isRealMode && messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
            <span className="ava">{m.role === 'user' ? 'U' : 'AI'}</span>
            <div className="content">
              <div className="name">{m.role === 'user' ? 'You' : 'Assistant'}</div>
              {thinking && i === messages.length - 1 && m.role === 'user' ? (
                <div className="ai-thinking">Analysing code…<span className="dots"><span/><span/><span/></span></div>
              ) : (
                <div className="text" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              )}
            </div>
          </div>
        ))}

        {isRealMode && thinking && messages.length === 0 && (
          <div className="msg ai">
            <span className="ava">AI</span>
            <div className="content">
              <div className="name">Assistant</div>
              <div className="ai-thinking">Analysing…<span className="dots"><span/><span/><span/></span></div>
            </div>
          </div>
        )}

        {isRealMode && suggestions.length > 0 && (
          <div className="msg ai">
            <span className="ava">AI</span>
            <div className="content">
              <div className="name">Suggestions</div>
              <SuggList suggestions={suggestions} selectedSugg={selectedSugg} setSelectedSugg={setSelectedSugg} onPreview={onPreviewSuggestion} isDemo={false} />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="chat-composer">
        <div className="instr-row">
          {INSTRUCTION_BUTTONS.map(b => {
            const Ico = I[b.icon];
            return (
              <button key={b.id} className={`instr-btn ${activeInstrs.includes(b.id) ? 'active' : ''}`}
                onClick={() => setActiveInstrs(a => a.includes(b.id) ? a.filter(x => x !== b.id) : [...a, b.id])}
                title={b.prompt}>
                {Ico && <Ico size={11} />}{b.label}
                {activeInstrs.includes(b.id) && <I.Check size={11} />}
              </button>
            );
          })}
        </div>
        {activeInstrs.length > 0 && (
          <div className="instr-summary">
            <I.Sparkle size={10} /> Will run {activeInstrs.length} instruction{activeInstrs.length > 1 ? 's' : ''}{draft.trim() ? ', plus your message' : ''}.
          </div>
        )}
        <div className="composer-box">
          <textarea rows={1}
            placeholder={activeInstrs.length > 0 ? 'Add extra detail (optional)…' : 'Ask a follow-up, or pick instructions above…'}
            value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendChat(); }}
          />
          <div className="composer-row">
            <span className="ctx-chip">
              <I.File size={11} /> {currentFile ? currentFile.path.split('/').pop() : 'OrderService.java'}
            </span>
            <span className="spacer"></span>
            <span className="kbd">⌘↵</span>
            <button className="send-btn" disabled={!draft.trim() && !activeInstrs.length} onClick={sendChat}>
              <I.Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggList({ suggestions, selectedSugg, setSelectedSugg, onPreview, isDemo }) {
  return (
    <div className="sugg-list">
      {suggestions.map(s => (
        <div key={s.id} className={`sugg-card ${selectedSugg === s.id ? 'selected' : ''}`}
          onClick={() => { setSelectedSugg(s.id); onPreview(s, isDemo); }}>
          <div className="sugg-row-1">
            <span className={`sugg-badge ${s.badge}`}>{s.badge}</span>
            <span className="sugg-title">{s.title}</span>
          </div>
          <div className="sugg-desc">{s.desc}</div>
          <div className="sugg-meta">
            <span className="m"><I.Info size={11} /> {s.impact}</span>
            <span className="m">{s.confidence}% confidence</span>
            {s.files > 0 && <span className="m">{s.files} file{s.files > 1 ? 's' : ''}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Workspace ────────────────────────────────────────────────────────────
export function Workspace({
  project, workspaceId, workspaceFiles, currentFile, setCurrentFile,
  activity, setActivity, selectedSugg, setSelectedSugg,
  onOpenDiff, onOpenTests, onOpenPr, onToast,
}) {
  const isRealMode = !!workspaceId;
  const [loadingFile, setLoadingFile] = useState(false);

  // Demo mode: use mock code sample
  const demoLang = project?.lang || 'java';
  const demoSample = CODE_SAMPLES[demoLang] || CODE_SAMPLES.java;

  async function handleFileSelect(node) {
    if (!workspaceId) return;
    setLoadingFile(true);
    try {
      const data = await wsApi.readFile(workspaceId, node.path);
      setCurrentFile({ path: node.path, content: data.content, language: data.language });
    } catch (e) {
      onToast('Error', e.message, 'error');
    } finally {
      setLoadingFile(false);
    }
  }

  async function handlePreviewSuggestion(sugg, isDemo) {
    if (isDemo || !workspaceId || !currentFile) {
      // Demo: open test modal for tests, otherwise diff modal with mock data
      if (activity === 'tests') onOpenTests();
      else onOpenDiff(sugg, null, null);
      return;
    }
    // Real: generate diff from backend
    onToast('Generating diff…', `Applying: ${sugg.title}`, 'info');
    try {
      const { diffData, modifiedCode } = await diffApi.generate(workspaceId, currentFile.path, sugg, null, currentFile.language);
      if (activity === 'tests') onOpenTests();
      else onOpenDiff(sugg, diffData, modifiedCode);
    } catch (e) {
      onToast('Error', e.message, 'error');
    }
  }

  return (
    <div className={`workspace ${activity ? '' : 'no-chat'}`}>
      {/* File tree */}
      {isRealMode ? (
        <RealFileTree
          files={workspaceFiles}
          workspaceId={workspaceId}
          projectName={project.name}
          selectedPath={currentFile?.path}
          onFileSelect={handleFileSelect}
        />
      ) : (
        <DemoFileTree projectName={project.name} />
      )}

      {/* Editor */}
      <div className="editor-wrap">
        <div className="editor-tabs">
          <button className="ed-tab active">
            <I.File size={12} />
            {isRealMode
              ? (currentFile ? currentFile.path.split('/').pop() : 'Select a file')
              : demoSample.file}
            <span className="close"><I.Close size={11} /></span>
          </button>
        </div>

        <div className="editor-toolbar">
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isRealMode ? (currentFile?.path || 'No file selected') : demoSample.path}
          </div>
          <span className="spacer"></span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {!isRealMode && (
              <select value={demoLang} onChange={() => {}}
                style={{ padding:'6px 10px', borderRadius:7, border:'1px solid var(--line)', background:'var(--panel)', color:'var(--ink-2)', fontSize:12, fontFamily:'inherit' }}>
                <option value="java">Java • Spring Boot</option>
                <option value="cs">C# • .NET API</option>
                <option value="node">AWS Lambda • Node</option>
                <option value="az">Azure Functions</option>
              </select>
            )}
            {ACTIVITIES.map(a => {
              const Ico = I[a.icon];
              return (
                <button key={a.id} className={`activity-chip ${a.id === 'fix' ? 'warn' : ''} ${activity === a.id ? 'active' : ''}`}
                  onClick={() => setActivity(a.id)} style={activity === a.id ? { background:'var(--accent-soft)', borderColor:'var(--accent)', color:'var(--accent-ink)' } : {}}>
                  {Ico && <Ico size={12} />}{a.label}
                </button>
              );
            })}
          </div>
        </div>

        {loadingFile ? (
          <div className="code-area" style={{ alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>
            Loading…
          </div>
        ) : isRealMode ? (
          <RealCodeViewer file={currentFile} />
        ) : (
          <DemoCodeViewer sample={demoSample} onLensClick={() => setActivity('fix')} />
        )}

        <div className="status-bar">
          <span>{isRealMode ? (currentFile?.language || '—') : 'Java'}</span>
          <span className="mono">UTF-8</span>
          <span style={{ flex: 1 }}></span>
          <span><I.Branch size={11} /> {project.branch || 'main'}</span>
          <span className="ok">● AI ready</span>
        </div>
      </div>

      {/* Chat panel */}
      {activity && (
        <ChatPanel
          activity={activity}
          currentFile={currentFile}
          workspaceId={workspaceId}
          selectedSugg={selectedSugg}
          setSelectedSugg={setSelectedSugg}
          onPreviewSuggestion={handlePreviewSuggestion}
        />
      )}
    </div>
  );
}

// ─── Demo-mode helpers (keep original look for quick exploration) ──────────────
import { FileTree as DemoFileTree, CodeViewer as DemoCodeViewer } from './Shared';
