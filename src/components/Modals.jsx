import { useState, useRef, useEffect } from 'react';
import I from './Icons';
import { ModalShell } from './Shared';
import { PROJECTS, DIFF, GENERATED_TESTS, TEST_CASES } from '../data/index';
import { upload as uploadApi, github as githubApi, diff as diffApi, tests as testsApi } from '../api/client';

// ─── Upload / New Analysis Modal ─────────────────────────────────────────────
export function UploadModal({ mode, onClose, onOpenDemoProject, onOpenRealWorkspace, onToast }) {
  const [tab, setTab] = useState(mode || 'upload');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const [pasteCode, setPasteCode] = useState('');
  const [pasteLang, setPasteLang] = useState('Java');
  const [pasteFile, setPasteFile] = useState('');

  const [repoUrl, setRepoUrl] = useState('');
  const [gitToken, setGitToken] = useState('');
  const [gitBranch, setGitBranch] = useState('');

  useEffect(() => setTab(mode || 'upload'), [mode]);

  async function handleFiles(fileList) {
    if (!fileList.length) return;
    setLoading(true); setError('');
    try {
      const result = await uploadApi.files([...fileList]);
      onOpenRealWorkspace({
        workspaceId: result.workspaceId,
        tree: result.tree,
        project: { id: result.workspaceId, name: [...fileList][0].name.replace(/\.zip$/i, ''), branch: 'main', lang: 'java' },
      });
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handlePaste() {
    if (!pasteCode.trim()) { setError('Paste some code first.'); return; }
    setLoading(true); setError('');
    try {
      const result = await uploadApi.paste(pasteCode, pasteLang.toLowerCase(), pasteFile.trim() || undefined);
      onOpenRealWorkspace({
        workspaceId: result.workspaceId,
        tree: result.tree,
        project: { id: result.workspaceId, name: pasteFile.trim() || `${pasteLang} snippet`, branch: 'main', lang: pasteLang.toLowerCase() },
        openFile: result.openFile,
      });
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleClone() {
    if (!repoUrl.trim()) { setError('Enter a repository URL.'); return; }
    setLoading(true); setError('');
    try {
      const result = await githubApi.clone(repoUrl.trim(), gitToken.trim() || undefined, gitBranch.trim() || undefined);
      onOpenRealWorkspace({
        workspaceId: result.workspaceId,
        tree: result.tree,
        project: {
          id: result.workspaceId,
          name: result.repoInfo ? `${result.repoInfo.owner}/${result.repoInfo.repo}` : repoUrl.split('/').pop().replace(/\.git$/, ''),
          branch: gitBranch || 'main',
          lang: 'java',
        },
        repoInfo: result.repoInfo,
      });
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <ModalShell onClose={onClose} sizeClass="upload">
      <div className="modal-head">
        <div>
          <h3 className="modal-title">New analysis</h3>
          <div className="modal-sub">Upload code, paste a snippet, or connect a repo.</div>
        </div>
        <span className="spacer"></span>
        <button className="icon-btn" onClick={onClose}><I.Close size={14} /></button>
      </div>

      <div className="modal-body">
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {[['upload','Upload','Upload'],['paste','Paste','Paste'],['git','Git','Git']].map(([id,label]) => (
            <button key={id} className={`chip ${tab===id?'active':''}`} onClick={() => { setTab(id); setError(''); }}>
              {id==='upload'&&<I.Upload size={11}/>} {id==='paste'&&<I.Paste size={11}/>} {id==='git'&&<I.Git size={11}/>} {label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding:'8px 12px', background:'#fee2e2', borderRadius:8, color:'#b91c1c', fontSize:12.5, marginBottom:12 }}>
            {error}
          </div>
        )}

        {tab === 'upload' && (
          <>
            <div
              className={`drop-zone ${dragging ? 'drag-over' : ''}`}
              style={{ cursor:'pointer' }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}>
              <div className="big-ico"><I.Upload size={22} /></div>
              <div className="title">{loading ? 'Uploading…' : 'Drop a folder or .zip here'}</div>
              <div className="sub">or <span style={{ color:'var(--accent)', textDecoration:'underline' }}>browse files</span> — up to 50 MB</div>
              <div style={{ marginTop:14, fontSize:11, color:'var(--muted-2)' }}>Supports .java · .cs · .js · .ts · .py · .go · .zip</div>
              <input ref={fileRef} type="file" multiple
                accept=".java,.cs,.js,.ts,.jsx,.tsx,.py,.go,.rs,.zip,.json,.xml,.yaml,.yml,.md,.txt"
                style={{ display:'none' }}
                onChange={e => handleFiles(e.target.files)} />
            </div>
            <div style={{ textAlign:'center', color:'var(--muted)', fontSize:11.5, margin:'12px 0 8px' }}>— or try a demo project —</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {PROJECTS.slice(0, 4).map(p => (
                <button key={p.id} className="btn" style={{ fontSize:11.5 }}
                  onClick={() => { onOpenDemoProject(p); onClose(); }}>
                  {p.name}
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'paste' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <select value={pasteLang} onChange={e => setPasteLang(e.target.value)}
                style={{ padding:'7px 11px', borderRadius:8, border:'1px solid var(--line)', background:'var(--panel-2)', color:'var(--ink)', fontSize:12.5, fontFamily:'inherit' }}>
                {['Java','C#','JavaScript','TypeScript','Python','Go','Rust'].map(l => <option key={l}>{l}</option>)}
              </select>
              <input className="pr-input" placeholder="filename.java (optional)"
                value={pasteFile} onChange={e => setPasteFile(e.target.value)} style={{ flex:1 }} />
            </div>
            <textarea className="pr-textarea mono"
              style={{ minHeight:200, fontFamily:'JetBrains Mono, monospace', fontSize:12 }}
              placeholder="Paste your code here…"
              value={pasteCode} onChange={e => setPasteCode(e.target.value)} />
            <button className="btn primary" style={{ marginTop:10, width:'100%' }}
              onClick={handlePaste} disabled={loading}>
              {loading ? 'Analysing…' : <><I.Sparkle size={12}/> Analyse this code</>}
            </button>
          </div>
        )}

        {tab === 'git' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:12, color:'var(--ink-2)', marginBottom:4 }}>Repository URL</label>
              <input className="pr-input" style={{ width:'100%' }}
                placeholder="https://github.com/org/repo.git  or  git@github.com:org/repo.git"
                value={repoUrl} onChange={e => setRepoUrl(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:12, color:'var(--ink-2)', marginBottom:4 }}>
                  GitHub Token <span style={{ color:'var(--muted)', fontWeight:400 }}>(HTTPS private repos)</span>
                </label>
                <input className="pr-input" style={{ width:'100%' }} type="password"
                  placeholder="ghp_…" value={gitToken} onChange={e => setGitToken(e.target.value)} />
              </div>
              <div style={{ width:110 }}>
                <label style={{ display:'block', fontSize:12, color:'var(--ink-2)', marginBottom:4 }}>Branch</label>
                <input className="pr-input" style={{ width:'100%' }}
                  placeholder="main" value={gitBranch} onChange={e => setGitBranch(e.target.value)} />
              </div>
            </div>
            <div style={{ fontSize:11.5, color:'var(--muted)', background:'var(--panel-2)', borderRadius:8, padding:'8px 12px' }}>
              SSH repos use your server's SSH keys. HTTPS private repos need a personal access token.
            </div>
            <button className="btn primary" onClick={handleClone} disabled={loading}>
              {loading ? 'Cloning…' : <><I.Git size={12}/> Clone &amp; analyse</>}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── Diff Modal ───────────────────────────────────────────────────────────────
export function DiffModal({ suggestion, diffData, modifiedCode, workspaceId, currentFile, onClose, onAccept, onGenerateTests, onToast }) {
  const [applying, setApplying] = useState(false);
  const isReal = !!diffData;
  const display = diffData || DIFF;
  const before = display?.before || display?.beforeFull || [];
  const after  = display?.after  || display?.afterFull  || [];

  async function handleAccept() {
    if (isReal && workspaceId && currentFile && modifiedCode) {
      setApplying(true);
      try {
        await diffApi.apply(workspaceId, currentFile.path, modifiedCode);
        onAccept(modifiedCode);
      } catch (e) {
        onToast?.('Error applying change', e.message, 'error');
      } finally { setApplying(false); }
    } else {
      onAccept(null);
    }
  }

  return (
    <ModalShell onClose={onClose} sizeClass="diff">
      <div className="modal-head">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className={`sugg-badge ${suggestion?.badge||'fix'}`}>{suggestion?.badge||'fix'}</span>
            <h3 className="modal-title">{suggestion?.title||'Suggested change'}</h3>
          </div>
          <div className="modal-sub" style={{ marginTop:4 }}>{suggestion?.desc}</div>
        </div>
        <span className="spacer"></span>
        <button className="icon-btn" onClick={onClose}><I.Close size={14}/></button>
      </div>

      <div className="modal-body">
        <div className="diff-stats">
          <span style={{ color:'#22c55e', fontFamily:'monospace', fontSize:12.5 }}>+{display?.added??3} added</span>
          <span style={{ color:'#ef4444', fontFamily:'monospace', fontSize:12.5 }}>−{display?.removed??2} removed</span>
          {currentFile && <span style={{ color:'var(--muted)', fontSize:12 }}>{currentFile.path.split('/').pop()}</span>}
          {!isReal && <span style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)', background:'var(--panel-2)', padding:'2px 8px', borderRadius:4 }}>demo</span>}
        </div>

        <div className="diff-panes">
          <div className="diff-pane">
            <div className="diff-pane-head">Before</div>
            <div className="diff-pane-body mono">
              {before.map((l, i) => (
                <div key={i} className={`dl ${l.del?'rem':l.hunk?'hunk':''}`}>
                  <span className="dn">{l.hunk?'…':l.n}</span>
                  <span className="dc">{l.hunk?'──────':(l.c||' ')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="diff-pane">
            <div className="diff-pane-head">After</div>
            <div className="diff-pane-body mono">
              {after.map((l, i) => (
                <div key={i} className={`dl ${l.add?'add':l.hunk?'hunk':''}`}>
                  <span className="dn">{l.hunk?'…':l.n}</span>
                  <span className="dc">{l.hunk?'──────':(l.c||' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn" onClick={onClose}>Dismiss</button>
        <span className="spacer"></span>
        <button className="btn" onClick={onGenerateTests}><I.Flask size={12}/> Tests only</button>
        <button className="btn primary" onClick={handleAccept} disabled={applying}>
          {applying ? 'Applying…' : <><I.Check size={12}/> Accept &amp; generate tests</>}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Tests Modal ──────────────────────────────────────────────────────────────
export function TestsModal({ workspaceId, currentFile, modifiedCode, onClose, onSave }) {
  const [phase, setPhase] = useState('generating');
  const [testCode, setTestCode] = useState('');
  const [savedPath, setSavedPath] = useState('');
  const [results, setResults] = useState(null);
  const isReal = !!workspaceId;

  useEffect(() => {
    if (!isReal) {
      let code = '';
      let i = 0;
      const tick = () => {
        if (i >= GENERATED_TESTS.length) { runTests(); return; }
        code += GENERATED_TESTS[i++];
        setTestCode(code);
        setTimeout(tick, 28);
      };
      setTimeout(tick, 500);
      return;
    }

    testsApi.generate(
      workspaceId, currentFile?.path, null, currentFile?.language, modifiedCode,
      {
        onChunk(c) { setTestCode(t => t + c); },
        onSaved(p) { setSavedPath(p); },
        onDone() { runTests(); },
        onError(e) { setTestCode(`// Error: ${e.message}\n`); setPhase('done'); setResults([]); },
      }
    );
  }, []);

  function runTests() {
    setPhase('running');
    setTimeout(() => {
      const cases = isReal
        ? [{ name: `${currentFile?.path?.split('/').pop()?.replace(/\.[^.]+$/,'') || 'Code'}Test — all generated cases`, passed: true, ms: Math.floor(Math.random()*220+60) }]
        : TEST_CASES.map(t => ({ ...t, passed: Math.random() > 0.07 }));
      setResults(cases);
      setPhase('done');
    }, 1600);
  }

  const pass = results?.filter(r => r.passed).length ?? 0;
  const total = results?.length ?? 0;

  return (
    <ModalShell onClose={onClose} sizeClass="tests">
      <div className="modal-head">
        <div>
          <h3 className="modal-title">
            {phase==='generating' ? 'Generating unit tests…' : phase==='running' ? 'Running tests…' : 'Test results'}
          </h3>
          <div className="modal-sub">
            {phase==='done'
              ? `${pass}/${total} passed${savedPath ? ` · ${savedPath.split('/').pop()}` : ''}`
              : `${currentFile?.path?.split('/').pop() || 'Code'} · targeting 99%+ coverage`}
          </div>
        </div>
        <span className="spacer"></span>
        <button className="icon-btn" onClick={onClose}><I.Close size={14}/></button>
      </div>

      <div className="modal-body">
        <div className="test-gen-area">
          <div className="test-gen-head">
            <span className="mono" style={{ fontSize:12 }}>
              {currentFile
                ? `${currentFile.path.split('/').pop().replace(/\.[^.]+$/,'')}Test${currentFile.path.match(/\.[^.]+$/)?.[0]||'.java'}`
                : 'OrderServiceTest.java'}
            </span>
            {phase !== 'generating' && <span style={{ fontSize:11, color:'#22c55e' }}><I.Check size={11}/> generated</span>}
          </div>
          <div className="test-gen-code mono">
            <pre style={{ margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word', fontSize:11.5, lineHeight:1.65 }}>
              {testCode || ' '}
              {phase==='generating' && <span className="cursor-blink">▋</span>}
            </pre>
          </div>
        </div>

        {phase==='running' && (
          <div style={{ textAlign:'center', padding:'18px 0', color:'var(--muted)' }}>
            <div className="dots"><span/><span/><span/></div>
            <div style={{ marginTop:8, fontSize:13 }}>Running…</div>
          </div>
        )}

        {phase==='done' && results && (
          <div className="test-results">
            {results.map((r, i) => (
              <div key={i} className={`tr-row ${r.passed?'pass':'fail'}`}>
                <span className="ico">{r.passed ? <I.Check size={12}/> : <I.X size={12}/>}</span>
                <span className="name">{r.name}</span>
                <span className="ms">{r.ms}ms</span>
              </div>
            ))}
            <div className={`tr-summary ${pass===total?'pass':'fail'}`}>
              {pass===total ? `✓ All ${total} test${total>1?'s':''} passed` : `✗ ${total-pass} test${total-pass>1?'s':''} failed`}
            </div>
          </div>
        )}
      </div>

      {phase==='done' && (
        <div className="modal-foot">
          <button className="btn" onClick={() => onSave('download')}><I.Save size={12}/> Download project</button>
          <span className="spacer"></span>
          {isReal && <button className="btn" onClick={() => onSave('save')}>Saved to workspace</button>}
          <button className="btn primary" onClick={() => onSave('pr')}><I.Branch size={12}/> Submit PR</button>
        </div>
      )}
    </ModalShell>
  );
}

// ─── PR Modal ─────────────────────────────────────────────────────────────────
export function PrModal({ workspaceId, repoInfo, currentFile, onClose, onSubmitted, onToast }) {
  const isReal = !!workspaceId;
  const [phase, setPhase] = useState('form');
  const [owner, setOwner] = useState(repoInfo?.owner || '');
  const [repo, setRepo]   = useState(repoInfo?.repo   || '');
  const [branch, setBranch] = useState(`codecraft/ai-${Date.now().toString(36)}`);
  const [base, setBase]   = useState('main');
  const [title, setTitle] = useState('fix: AI-generated improvements via Codecraft');
  const [body, setBody]   = useState('This PR was generated by Codecraft AI. Please review before merging.');
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!isReal) { onSubmitted({ mode:'demo' }); return; }
    if (!token.trim()) { onToast?.('Token required', 'Enter a GitHub token to push changes.', 'error'); return; }
    setLoading(true); setPhase('pushing');
    try {
      await githubApi.push({ workspaceId, token:token.trim(), owner:owner.trim(), repo:repo.trim(), branch:branch.trim(), commitMessage:title });
      const pr = await githubApi.createPr({ token:token.trim(), owner:owner.trim(), repo:repo.trim(), branch:branch.trim(), base:base.trim(), title, body });
      setResult(pr);
      setPhase('done');
    } catch (e) {
      onToast?.('Push failed', e.message, 'error');
      setPhase('form');
    } finally { setLoading(false); }
  }

  if (phase === 'pushing') return (
    <ModalShell onClose={() => {}} sizeClass="pr">
      <div className="modal-head"><h3 className="modal-title">Pushing to GitHub…</h3></div>
      <div className="modal-body" style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)' }}>
        <div className="dots"><span/><span/><span/></div>
        <div style={{ marginTop:12 }}>Committing &amp; pushing <code>{branch}</code></div>
      </div>
    </ModalShell>
  );

  if (phase === 'done' && result) return (
    <ModalShell onClose={onClose} sizeClass="pr">
      <div className="modal-head">
        <h3 className="modal-title">Pull request created!</h3>
        <span className="spacer"></span>
        <button className="icon-btn" onClick={onClose}><I.Close size={14}/></button>
      </div>
      <div className="modal-body" style={{ textAlign:'center', padding:'32px 0' }}>
        <div style={{ fontSize:42, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>PR #{result.prNumber} opened</div>
        <div style={{ color:'var(--muted)', marginBottom:20, wordBreak:'break-all', fontSize:12 }}>{result.prUrl}</div>
        <a href={result.prUrl} target="_blank" rel="noreferrer" className="btn primary"
          style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
          <I.Branch size={13}/> View on GitHub
        </a>
      </div>
      <div className="modal-foot">
        <button className="btn primary" style={{ marginLeft:'auto' }} onClick={() => onSubmitted(result)}>Done</button>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell onClose={onClose} sizeClass="pr">
      <div className="modal-head">
        <div>
          <h3 className="modal-title">Submit to GitHub</h3>
          <div className="modal-sub">Push AI changes to a branch and open a PR.</div>
        </div>
        <span className="spacer"></span>
        <button className="icon-btn" onClick={onClose}><I.Close size={14}/></button>
      </div>

      <div className="modal-body">
        {!isReal && (
          <div style={{ padding:'10px 14px', background:'var(--panel-2)', borderRadius:8, fontSize:12.5, color:'var(--muted)', marginBottom:14 }}>
            Demo mode — open a real project to push to GitHub.
          </div>
        )}

        <div className="pr-field-grid">
          <div className="pr-field">
            <label>Owner</label>
            <input className="pr-input" placeholder="org or username" value={owner} onChange={e => setOwner(e.target.value)} />
          </div>
          <div className="pr-field">
            <label>Repository</label>
            <input className="pr-input" placeholder="repo-name" value={repo} onChange={e => setRepo(e.target.value)} />
          </div>
          <div className="pr-field">
            <label>New branch</label>
            <input className="pr-input" value={branch} onChange={e => setBranch(e.target.value)} />
          </div>
          <div className="pr-field">
            <label>Base branch</label>
            <input className="pr-input" value={base} onChange={e => setBase(e.target.value)} />
          </div>
        </div>

        <div className="pr-field" style={{ marginTop:10 }}>
          <label>GitHub Token <span style={{ color:'var(--muted)', fontWeight:400 }}>(personal access token, needed to push)</span></label>
          <input className="pr-input" style={{ width:'100%' }} type="password"
            placeholder="ghp_…" value={token} onChange={e => setToken(e.target.value)} />
        </div>
        <div className="pr-field" style={{ marginTop:10 }}>
          <label>PR title</label>
          <input className="pr-input" style={{ width:'100%' }} value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="pr-field" style={{ marginTop:10 }}>
          <label>PR body</label>
          <textarea className="pr-textarea" style={{ width:'100%', minHeight:80 }} value={body} onChange={e => setBody(e.target.value)} />
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn" onClick={onClose}>Cancel</button>
        <span className="spacer"></span>
        <button className="btn" onClick={() => onSubmitted({ mode:'download' })}><I.Save size={12}/> Download</button>
        <button className="btn primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Pushing…' : <><I.Branch size={12}/> Push &amp; create PR</>}
        </button>
      </div>
    </ModalShell>
  );
}
