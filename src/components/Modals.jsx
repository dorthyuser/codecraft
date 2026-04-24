import { useState, useEffect } from 'react';
import I from './Icons';
import { ModalShell } from './Shared';
import { DIFF, GENERATED_TESTS, TEST_CASES, PROJECTS } from '../data/index';

export function UploadModal({ mode, onClose, onOpenProject }) {
  const [tab, setTab] = useState(mode || 'upload');
  useEffect(() => setTab(mode || 'upload'), [mode]);

  return (
    <ModalShell onClose={onClose} sizeClass="upload">
      <div className="modal-head">
        <div>
          <h3 className="modal-title">New analysis</h3>
          <div className="modal-sub">Give the assistant something to work with.</div>
        </div>
        <span className="spacer"></span>
        <button className="icon-btn" onClick={onClose}><I.Close size={14} /></button>
      </div>
      <div className="modal-body">
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <button className={`chip ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>Upload</button>
          <button className={`chip ${tab === 'paste' ? 'active' : ''}`} onClick={() => setTab('paste')}>Paste</button>
          <button className={`chip ${tab === 'git' ? 'active' : ''}`} onClick={() => setTab('git')}>Git</button>
        </div>

        {tab === 'upload' && (
          <div className="drop-zone">
            <div className="big-ico"><I.Upload size={22} /></div>
            <div className="title">Drop a folder or .zip here</div>
            <div className="sub">or <span style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>browse files</span> — up to 50 MB</div>
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted-2)' }}>Supports .java · .cs · .js · .ts · .py · .go — plus common build files</div>
          </div>
        )}

        {tab === 'paste' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <select style={{ padding: '7px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--ink)', fontSize: 12.5, fontFamily: 'inherit' }}>
                <option>Java</option><option>C#</option><option>JavaScript</option><option>Python</option>
              </select>
              <input className="pr-input" placeholder="filename.java" defaultValue="OrderService.java" style={{ flex: 1 }} />
            </div>
            <textarea
              className="pr-textarea mono"
              style={{ minHeight: 180, fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}
              placeholder="Paste your code here…"
              defaultValue={`@Service\npublic class OrderService {\n    // …\n}`}
            />
          </div>
        )}

        {tab === 'git' && (
          <div>
            <input className="pr-input mono" placeholder="https://github.com/org/repo" defaultValue="https://github.com/acme/orders-api" />
            <div className="or-divider">Or pick a recent</div>
            <div className="git-connect-list">
              {[
                { r: 'acme/orders-api', b: 'main • 2h ago' },
                { r: 'acme/billing-service', b: 'feat/refunds • 1d ago' },
                { r: 'acme/notify-lambda', b: 'main • 3d ago' },
              ].map((x, i) => (
                <div key={i} className="git-entry">
                  <span className="git-ico"><I.Git size={14} /></span>
                  <div style={{ flex: 1 }}>
                    <div className="repo">{x.r}</div>
                    <div className="repo-meta">{x.b}</div>
                  </div>
                  <I.ArrowRight size={14} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="modal-foot">
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>
          <I.Robot size={12} /> AI API connected · <span className="mono" style={{ fontSize: 11.5 }}>claude-haiku-4-5</span>
        </span>
        <span className="spacer"></span>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={() => { onClose(); onOpenProject(PROJECTS[0]); }}>
          Continue <I.ArrowRight size={12} />
        </button>
      </div>
    </ModalShell>
  );
}

export function DiffModal({ suggestion, onClose, onAccept, onGenerateTests }) {
  const [viewFull, setViewFull] = useState(true);
  const [comment, setComment] = useState('');
  const before = viewFull ? DIFF.beforeFull : DIFF.before;
  const after = viewFull ? DIFF.afterFull : DIFF.after;

  return (
    <ModalShell onClose={onClose} sizeClass="diff">
      <div className="modal-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="modal-title">{suggestion?.title || 'Preview change'}</h3>
          <div className="modal-sub">OrderService.java · {suggestion?.confidence}% confidence · behavior preserved outside highlighted region</div>
        </div>
        <button className="chip" onClick={() => setViewFull(v => !v)}>{viewFull ? 'Show hunk only' : 'Show full context'}</button>
        <button className="icon-btn" onClick={onClose}><I.Close size={14} /></button>
      </div>

      <div className="diff-summary">
        <span className="pill">OrderService.java</span>
        <span className="pill add">+{DIFF.added} additions</span>
        <span className="pill del">−{DIFF.removed} deletion</span>
        <span style={{ flex: 1 }}></span>
        <span>{suggestion?.impact}</span>
      </div>

      <div className="modal-body p0">
        <div className="diff-grid">
          <div className="diff-side">
            <div className="diff-side-head">
              <span className="label">Original</span>
              <span>· src/main/java/com/acme/orders/OrderService.java</span>
            </div>
            <div className="diff-lines">
              {before.map((l, i) => (
                <div key={i} className={`dline ${l.del ? 'del' : ''} ${l.add ? 'add' : ''}`}>
                  <span className="n">{l.n}</span>
                  <span className="c">{(l.del ? '- ' : l.add ? '+ ' : '  ') + l.c}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="diff-side">
            <div className="diff-side-head">
              <span className="label">Suggested</span>
              <span>· with fix applied</span>
            </div>
            <div className="diff-lines">
              {after.map((l, i) => (
                <div key={i} className={`dline ${l.del ? 'del' : ''} ${l.add ? 'add' : ''}`}>
                  <span className="n">{l.n}</span>
                  <span className="c">{(l.del ? '- ' : l.add ? '+ ' : '  ') + l.c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--panel-2)' }}>
        <div className="composer-box" style={{ background: 'var(--panel)' }}>
          <textarea
            rows={1}
            placeholder="Refine: e.g. use Collections.emptyList() instead of Optional, or add a log statement…"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <div className="composer-row">
            <span className="ctx-chip"><I.Paper size={10} /> Change on lines 12–14</span>
            <span className="spacer"></span>
            <button className="btn sm" disabled={!comment.trim()}>Regenerate <I.Sparkle size={11} /></button>
          </div>
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn ghost" onClick={onClose}>Discard</button>
        <span className="spacer"></span>
        <button className="btn" onClick={onGenerateTests}>
          <I.Flask size={12} /> Apply + generate tests
        </button>
        <button className="btn primary" onClick={onAccept}>
          <I.Check size={13} /> Accept change
        </button>
      </div>
    </ModalShell>
  );
}

function TypingTests({ onDone }) {
  const [curLine, setCurLine] = useState(0);
  const [curCol, setCurCol] = useState(0);

  useEffect(() => {
    if (curLine >= GENERATED_TESTS.length) { onDone(); return; }
    const full = GENERATED_TESTS[curLine];
    if (curCol > full.length) {
      const t = setTimeout(() => { setCurLine(l => l + 1); setCurCol(0); }, 40);
      return () => clearTimeout(t);
    }
    const speed = Math.max(4, 24 - Math.min(20, curCol / 2));
    const t = setTimeout(() => setCurCol(c => c + Math.max(1, Math.floor(full.length / 20))), speed);
    return () => clearTimeout(t);
  }, [curLine, curCol]);

  const rendered = [];
  for (let i = 0; i < curLine; i++) rendered.push(GENERATED_TESTS[i]);
  if (curLine < GENERATED_TESTS.length) rendered.push(GENERATED_TESTS[curLine].slice(0, curCol));

  const html = (line) =>
    line
      .replace(/("[^"]*")/g, '<span class="str">$1</span>')
      .replace(/(@\w+)/g, '<span class="anno">$1</span>')
      .replace(/\b(class|void|public|private|return|new|static|import|final|when|any|thenAnswer|assertThat)\b/g, '<span class="kw">$1</span>')
      .replace(/(\/\/[^\n]*)/g, '<span class="cmt">$1</span>');

  return (
    <div className="tg-gen-output">
      {rendered.map((l, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: html(l) || '&nbsp;' }} />
      ))}
      {curLine < GENERATED_TESTS.length && <span className="caret-cursor"></span>}
    </div>
  );
}

export function TestsModal({ onClose, onSave }) {
  const [step, setStep] = useState(0);
  const [testStates, setTestStates] = useState(TEST_CASES.map(() => 'pending'));
  const [pct, setPct] = useState(0);

  const goToRun = () => {
    setStep(1);
    TEST_CASES.forEach((_, i) => {
      setTimeout(() => setTestStates(s => s.map((v, j) => j === i ? 'running' : v)), 120 + i * 380);
      setTimeout(() => setTestStates(s => s.map((v, j) => j === i ? 'pass' : v)), 320 + i * 380);
    });
    setTimeout(() => setStep(2), 120 + TEST_CASES.length * 380 + 250);
  };

  useEffect(() => {
    if (step === 2) {
      let n = 0;
      const interval = setInterval(() => {
        n += 2;
        if (n >= 99) { n = 99; clearInterval(interval); }
        setPct(n);
      }, 18);
      return () => clearInterval(interval);
    }
  }, [step]);

  const circumference = 2 * Math.PI * 50;
  const offset = circumference * (1 - pct / 100);

  return (
    <ModalShell onClose={onClose} sizeClass="tests" noBackdropClose>
      <div className="modal-head">
        <div>
          <h3 className="modal-title">Generate tests + verify coverage</h3>
          <div className="modal-sub">Targets OrderService.java · goal: 99% line coverage</div>
        </div>
        <span className="spacer"></span>
        <button className="icon-btn" onClick={onClose}><I.Close size={14} /></button>
      </div>

      <div className="tg-steps">
        <div className={`tg-step ${step > 0 ? 'done' : 'active'}`}>
          <div className="circle">{step > 0 ? <I.Check size={16} /> : '1'}</div>
          <div className="label">Generate</div>
          <div className="tg-step-conn"></div>
        </div>
        <div className={`tg-step ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>
          <div className="circle">{step > 1 ? <I.Check size={16} /> : '2'}</div>
          <div className="label">Run</div>
          <div className="tg-step-conn"></div>
        </div>
        <div className={`tg-step ${step === 2 ? 'active' : ''}`}>
          <div className="circle">{step >= 2 && pct >= 99 ? <I.Check size={16} /> : '3'}</div>
          <div className="label">Coverage report</div>
        </div>
      </div>

      <div className="tg-stage">
        {step === 0 && (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Writing JUnit 5 + Mockito tests — 6 cases across happy path, null input, empty cart, repository persistence, transactional behavior, and negative price.
            </div>
            <TypingTests onDone={goToRun} />
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Running <span className="mono">mvn test</span> inside an ephemeral sandbox…
            </div>
            <div className="test-list">
              {TEST_CASES.map((t, i) => (
                <div key={i} className={`test-item ${testStates[i]}`}>
                  <div className="tstat">
                    {testStates[i] === 'pass' && <I.Check size={10} />}
                    {testStates[i] === 'fail' && <I.X size={10} />}
                  </div>
                  <div className="tname">{t.name}</div>
                  <div className="ttime">{testStates[i] === 'pass' ? t.time : testStates[i] === 'running' ? 'running…' : ''}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="cov-gauge">
              <div className="cov-ring">
                <svg width="120" height="120">
                  <circle cx="60" cy="60" r="50" fill="none" className="cov-track" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" className="cov-fill"
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset} />
                </svg>
                <div className="cov-label">
                  <div>
                    <div className="cov-pct">{pct}%</div>
                    <div className="cov-sub">Line coverage</div>
                  </div>
                </div>
              </div>
              <div className="cov-details">
                <div className="cov-bar">
                  <span className="blbl">Lines</span>
                  <div className="btrack"><div className="bfill" style={{ width: `${pct}%` }}></div></div>
                  <span className="bval">{pct}%</span>
                </div>
                <div className="cov-bar">
                  <span className="blbl">Branches</span>
                  <div className="btrack"><div className="bfill" style={{ width: `${Math.max(0, pct - 3)}%` }}></div></div>
                  <span className="bval">{Math.max(0, pct - 3)}%</span>
                </div>
                <div className="cov-bar">
                  <span className="blbl">Methods</span>
                  <div className="btrack"><div className="bfill" style={{ width: '100%' }}></div></div>
                  <span className="bval">100%</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                  Target of 99% reached · 6 tests · 81ms total
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--success-soft)', border: '1px solid color-mix(in oklab, var(--success) 30%, transparent)', borderRadius: 8, padding: '10px 12px' }}>
              <strong style={{ color: 'var(--ink)' }}>All 6 tests passing.</strong> Generated OrderServiceTest.java is ready to save — ready to commit both files to a new branch.
            </div>
          </>
        )}
      </div>

      <div className="modal-foot">
        {step < 2 ? (
          <>
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <span className="spacer"></span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {step === 0 ? 'Generating…' : 'Running…'}
            </span>
          </>
        ) : (
          <>
            <button className="btn ghost" onClick={onClose}>Close</button>
            <span className="spacer"></span>
            <button className="btn" onClick={() => onSave('download')}>
              <I.Download size={12} /> Download project
            </button>
            <button className="btn" onClick={() => onSave('save')}><I.Save size={12} /> Save locally</button>
            <button className="btn primary" onClick={() => onSave('pr')}><I.Git size={12} /> Commit to Git</button>
          </>
        )}
      </div>
    </ModalShell>
  );
}

export function PrModal({ onClose, onSubmitted }) {
  const [submitting, setSubmitting] = useState(false);
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onSubmitted(); }, 1400);
  };

  return (
    <ModalShell onClose={onClose} sizeClass="pr">
      <div className="modal-head">
        <div>
          <h3 className="modal-title">Submit to Git</h3>
          <div className="modal-sub">Push a new branch and open a pull request on <span className="mono">acme/orders-api</span></div>
        </div>
        <span className="spacer"></span>
        <button className="icon-btn" onClick={onClose}><I.Close size={14} /></button>
      </div>
      <div className="modal-body">
        <div className="pr-row">
          <div className="pr-field">
            <label className="pr-label">Base branch</label>
            <input className="pr-input mono" defaultValue="main" readOnly />
          </div>
          <div style={{ display: 'grid', placeItems: 'center', paddingTop: 22, color: 'var(--muted)' }}>
            <I.ArrowRight size={14} />
          </div>
          <div className="pr-field">
            <label className="pr-label">New branch</label>
            <input className="pr-input mono" defaultValue="ai/fix-order-items-npe" />
          </div>
        </div>

        <div className="pr-field" style={{ marginBottom: 14 }}>
          <label className="pr-label">Commit message</label>
          <input className="pr-input" defaultValue="fix(orders): guard against null items in placeOrder" />
        </div>

        <div className="pr-field" style={{ marginBottom: 14 }}>
          <label className="pr-label">PR description</label>
          <textarea className="pr-textarea" defaultValue={`Fixes a NullPointerException in OrderService.placeOrder when OrderRequest.items is null.\n\n• Wraps request.getItems() in Optional.ofNullable with an emptyList fallback\n• Adds 6 unit tests covering happy path, null items, empty cart, repository save, @Transactional, and negative price\n• Line coverage: 99%\n\nGenerated and verified by the AI assistant.`} />
        </div>

        <div className="pr-field">
          <label className="pr-label">Files in this PR</label>
          <div className="pr-files">
            <div className="pr-file">
              <I.File size={12} />
              <span className="pf-name">src/main/java/com/acme/orders/OrderService.java</span>
              <span className="pf-delta"><span className="ap">+4</span> <span className="dp">−1</span></span>
            </div>
            <div className="pr-file">
              <I.File size={12} />
              <span className="pf-name">src/test/java/com/acme/orders/OrderServiceTest.java</span>
              <span className="pf-delta"><span className="ap">+38</span> <span className="dp">−0</span></span>
            </div>
          </div>
        </div>

        <div className="pr-checks">
          <div className="pr-check"><I.Check size={13} /> All 6 tests passing</div>
          <div className="pr-check"><I.Check size={13} /> Line coverage 99% (target: 99%)</div>
          <div className="pr-check"><I.Check size={13} /> No new SpotBugs or Checkstyle warnings</div>
          <div className="pr-check"><I.Check size={13} /> Branch protection rules will be respected</div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <span className="spacer"></span>
        <button className="btn" onClick={() => { onClose(); onSubmitted && onSubmitted('download'); }}>
          <I.Download size={12} /> Download project
        </button>
        <button className="btn">Save locally only</button>
        <button className="btn primary" onClick={submit} disabled={submitting}>
          {submitting ? 'Submitting…' : (<><I.Git size={12} /> Create pull request</>)}
        </button>
      </div>
    </ModalShell>
  );
}
