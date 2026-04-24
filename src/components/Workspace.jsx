import { useState, useEffect, useRef } from 'react';
import I from './Icons';
import { CodeViewer, FileTree } from './Shared';
import { ACTIVITIES, SUGGESTIONS, CODE_SAMPLES } from '../data/index';

const INSTRUCTION_BUTTONS = [
  { id: 'analyse',  label: 'Analyse code',         icon: 'Sparkle', prompt: 'Analyse this code end-to-end.' },
  { id: 'refactor', label: 'Refactor',             icon: 'Bolt',    prompt: 'Refactor for clarity and maintainability.' },
  { id: 'fix',      label: 'Fix code',             icon: 'Wrench',  prompt: 'Find and fix bugs.' },
  { id: 'tests',    label: 'Generate tests',       icon: 'Flask',   prompt: 'Generate unit tests.' },
  { id: 'coverage', label: 'Coverage report',      icon: 'Shield',  prompt: 'Produce a code coverage report targeting 99%.' },
  { id: 'verify',   label: 'Check my instruction', icon: 'Info',    prompt: 'Check my instruction above for errors or ambiguity before running.' },
];

function ChatComposer({ draft, setDraft }) {
  const [active, setActive] = useState([]);
  const toggle = (id) => setActive(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  const run = () => {
    const hasAnyInput = draft.trim().length > 0 || active.length > 0;
    if (!hasAnyInput) return;
    setDraft('');
    setActive([]);
  };
  const canSend = draft.trim().length > 0 || active.length > 0;

  const IconComp = (name) => {
    const Comp = I[name];
    return Comp ? <Comp size={11} /> : null;
  };

  return (
    <div className="chat-composer">
      <div className="instr-row">
        {INSTRUCTION_BUTTONS.map(b => (
          <button
            key={b.id}
            className={`instr-btn ${active.includes(b.id) ? 'active' : ''}`}
            onClick={() => toggle(b.id)}
            title={b.prompt}
          >
            {IconComp(b.icon)}
            {b.label}
            {active.includes(b.id) && <I.Check size={11} />}
          </button>
        ))}
      </div>
      {active.length > 0 && (
        <div className="instr-summary">
          <I.Sparkle size={10} />
          Will run {active.length} {active.length === 1 ? 'instruction' : 'instructions'} in order{draft.trim() ? ', plus your message' : ''}.
        </div>
      )}
      <div className="composer-box">
        <textarea
          rows={1}
          placeholder={active.length > 0
            ? 'Add extra detail for the selected instructions (optional)…'
            : 'Ask a follow-up, or pick one or more instructions above…'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <div className="composer-row">
          <span className="ctx-chip"><I.File size={11} /> OrderService.java</span>
          <span className="ctx-chip">+ Add context</span>
          <span className="spacer"></span>
          <span className="kbd">⌘↵</span>
          <button className="send-btn" disabled={!canSend} onClick={run}>
            <I.Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ activity, language, onPreviewSuggestion, selectedSugg, setSelectedSugg }) {
  const act = ACTIVITIES.find(a => a.id === activity) || ACTIVITIES[0];
  const suggs = SUGGESTIONS[activity] || SUGGESTIONS.improve;
  const [thinking, setThinking] = useState(true);
  const [revealed, setRevealed] = useState(0);
  const [draft, setDraft] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    setThinking(true);
    setRevealed(0);
    const t1 = setTimeout(() => setThinking(false), 900);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealed(r => {
        if (r >= suggs.length) { clearInterval(interval); return r; }
        return r + 1;
      });
      if (i >= suggs.length) clearInterval(interval);
    }, 320);
    return () => { clearTimeout(t1); clearInterval(interval); };
  }, [activity]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [revealed, thinking]);

  const intro = {
    fix: "I found one active issue and a couple of preventative fixes. The main risk is an NPE on line 13 when items is null.",
    improve: "Here are three improvements I'd prioritize — starting with readability, then a real N+1 perf win.",
    refactor: "Two refactors that keep behavior identical. The command/query split is larger in scope.",
    secure: "Two findings. The authorization gap is the one to fix today.",
    tests: "I can generate a test class covering the main paths. With both suggestions applied you'll hit 99%+ line coverage.",
    explain: "Here's a breakdown of what this file does. Click through to expand any section.",
  }[activity];

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div>
          <div className="chat-activity-badge">
            <I.Sparkle size={11} /> {act.label}
          </div>
          <div className="chat-sub" style={{ marginTop: 4 }}>OrderService.java • {language}</div>
        </div>
        <button className="icon-btn" title="Close"><I.Close size={14} /></button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        <div className="msg user">
          <span className="ava">U</span>
          <div className="content">
            <div className="name">You</div>
            <div className="text">{
              activity === 'fix' ? 'Find the bug in this file and suggest a fix.' :
              activity === 'improve' ? 'What could be improved here?' :
              activity === 'refactor' ? 'Suggest some refactors.' :
              activity === 'secure' ? 'Run a security review on this file.' :
              activity === 'tests' ? 'Generate tests to hit 99% coverage.' :
              'Explain what this class does.'
            }</div>
          </div>
        </div>

        {thinking ? (
          <div className="msg ai">
            <span className="ava">AI</span>
            <div className="content">
              <div className="name">Assistant</div>
              <div className="ai-thinking">
                Reading OrderService.java, OrderRequest.java
                <span className="dots"><span></span><span></span><span></span></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="msg ai">
            <span className="ava">AI</span>
            <div className="content">
              <div className="name">Assistant</div>
              <div className="text">{intro}</div>
              <div className="sugg-list">
                {suggs.slice(0, revealed).map(s => (
                  <div
                    key={s.id}
                    className={`sugg-card ${selectedSugg === s.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedSugg(s.id); onPreviewSuggestion(s); }}
                  >
                    <div className="sugg-row-1">
                      <span className={`sugg-badge ${s.badge}`}>{s.badge}</span>
                      <span className="sugg-title">{s.title}</span>
                    </div>
                    <div className="sugg-desc">{s.desc}</div>
                    <div className="sugg-meta">
                      <span className="m"><I.Info size={11} /> {s.impact}</span>
                      <span className="m">{s.confidence}% confidence</span>
                      {s.files > 0 && <span className="m">{s.files} {s.files === 1 ? 'file' : 'files'}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {revealed >= suggs.length && (
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
                  Pick one to preview a side-by-side diff, or tell me what you'd like to do differently.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ChatComposer draft={draft} setDraft={setDraft} />
    </div>
  );
}

export function Workspace({ project, onBack, onOpenDiff, onOpenTests, onOpenPr, language, onChangeLang, activity, setActivity, selectedSugg, setSelectedSugg, onToast }) {
  const sample = CODE_SAMPLES[language];
  const chatOpen = activity !== null;

  return (
    <div className={`workspace ${chatOpen ? '' : 'no-chat'}`}>
      <FileTree projectName={project.name} />

      <div className="editor-wrap">
        <div className="editor-tabs">
          <button className="ed-tab active">
            <span className={`lang-chip ${language}`} style={{ width: 16, height: 16, fontSize: 9, borderRadius: 3 }}>
              {language === 'java' ? 'J' : language === 'cs' ? 'C#' : language === 'node' ? 'N' : 'A'}
            </span>
            {sample.file}
            <span className="close"><I.Close size={11} /></span>
          </button>
          <button className="ed-tab">
            <I.File size={12} />
            OrderRequest.java
            <span className="close"><I.Close size={11} /></span>
          </button>
        </div>

        <div className="editor-toolbar">
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>{sample.path}</div>
          <span className="spacer" style={{ flex: 1 }}></span>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={language}
              onChange={e => onChangeLang(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 7, border: '1px solid var(--line)',
                background: 'var(--panel)', color: 'var(--ink-2)', fontSize: 12, fontFamily: 'inherit'
              }}
            >
              <option value="java">Java • Spring Boot</option>
              <option value="cs">C# • .NET API</option>
              <option value="node">AWS Lambda • Node</option>
              <option value="az">Azure Functions</option>
            </select>
            {ACTIVITIES.map(a => {
              const Ico = I[a.icon];
              return (
                <button
                  key={a.id}
                  className={`activity-chip ${a.id === 'fix' ? 'warn' : ''}`}
                  onClick={() => setActivity(a.id)}
                >
                  {Ico && <Ico size={12} />}
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <CodeViewer sample={sample} onLensClick={() => setActivity('fix')} />

        <div className="status-bar">
          <span>Ln 13, Col 41</span>
          <span className="mono">UTF-8</span>
          <span className="mono">LF</span>
          <span style={{ flex: 1 }}></span>
          <span><I.Branch size={11} /> {project.branch}</span>
          <span className="ok">● AI ready</span>
        </div>
      </div>

      {chatOpen && (
        <ChatPanel
          activity={activity}
          language={sample.lang}
          selectedSugg={selectedSugg}
          setSelectedSugg={setSelectedSugg}
          onPreviewSuggestion={(s) => {
            if (activity === 'tests') onOpenTests();
            else onOpenDiff(s);
          }}
        />
      )}
    </div>
  );
}
