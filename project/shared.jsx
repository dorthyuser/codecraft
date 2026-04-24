// Small reusable pieces: CodeLine, FileTree, Toast, ModalShell
const { useState, useEffect, useRef, useMemo } = React;

function renderTokens(tokens) {
  return tokens.map((tok, i) => {
    const [cls, text] = tok;
    if (cls === 't' || cls === 'punct' || cls === 'var') return <span key={i}>{text}</span>;
    return <span key={i} className={`tk-${cls === 'type' ? 'type' : cls === 'anno' ? 'anno' : cls === 'str' ? 'str' : cls === 'num' ? 'num' : cls === 'fn' ? 'fn' : cls === 'kw' ? 'kw' : cls}`}>{text}</span>;
  });
}

function CodeViewer({ sample, onLensClick }) {
  return (
    <div className="code-area">
      <div className="gutter mono">
        {sample.lines.map((_, i) => (
          <span key={i} className={`ln ${sample.lines[i].issue ? 'issue' : ''}`}>{i+1}</span>
        ))}
      </div>
      <div className="code-lines">
        {sample.lines.map((line, i) => (
          <span key={i} className={`cl ${line.issue ? 'highlight-danger' : ''}`}>
            {line.tokens.length === 0 ? '\u00a0' : renderTokens(line.tokens)}
            {line.lens && (
              <span className="inline-lens" onClick={() => onLensClick && onLensClick()}>
                <I.Sparkle size={11}/> {line.lens} → Fix
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(node.open ?? false);
  const pad = { paddingLeft: depth * 12 + 4 };
  if (node.file) {
    return (
      <div className={`ft-node ${node.active ? 'active' : ''}`} style={pad}>
        <span className="caret" style={{ visibility: 'hidden' }}><I.ChevR size={10}/></span>
        <span className="ico"><I.File size={12}/></span>
        <span>{node.name}</span>
        {node.modified && <span className="dot-mod" title="modified"></span>}
      </div>
    );
  }
  return (
    <>
      <div className="ft-node" style={pad} onClick={() => setOpen(o => !o)}>
        <span className={`caret ${open ? 'open' : ''}`}><I.ChevR size={10}/></span>
        <span className="ico">{open ? <I.FolderOpen size={13}/> : <I.Folder size={13}/>}</span>
        <span>{node.name}</span>
      </div>
      {open && node.children && node.children.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1}/>)}
    </>
  );
}

function FileTree({ projectName }) {
  return (
    <div className="filetree">
      <div className="ft-search">
        <I.Search size={12}/>
        <input placeholder="Search files…"/>
      </div>
      <div className="ft-node" style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
        <span className="caret open"><I.ChevR size={10}/></span>
        <span className="ico"><I.FolderOpen size={13}/></span>
        <span>{projectName}</span>
      </div>
      {FILE_TREE.folders.map((f, i) => <TreeNode key={i} node={f} depth={1}/>)}
    </div>
  );
}

function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind || 'success'}`}>
          <span className="ticon" style={t.kind === 'info' ? { background: 'var(--accent)' } : {}}>
            <I.Check size={13}/>
          </span>
          <div className="tmsg">
            <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 1 }}>{t.title}</div>
            {t.body && <div style={{ color: 'var(--muted)', fontSize: 11.5 }}>{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ModalShell({ children, onClose, sizeClass = '', noBackdropClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={(e) => { if (!noBackdropClose && e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${sizeClass}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { CodeViewer, FileTree, Toast, ModalShell, TreeNode, renderTokens });
