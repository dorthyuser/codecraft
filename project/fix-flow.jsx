/* Auro Heal — Fix flow modal (review → fixing → success → commit → committed) */
const { useState: useFS, useEffect: useFE, useRef: useFR } = React;

function ProgressStage({ steps, app, onDone }) {
  // run through steps with delays; mark each as done.
  const [active, setActive] = useFS(0);          // index currently running (-1 once all done)
  const [doneTimes, setDoneTimes] = useFS({});    // index -> ms label
  const startRef = useFR(performance.now());

  useFE(() => {
    if (active >= steps.length) { onDone(); return; }
    const dur = 500 + Math.random() * 900; // 0.5 – 1.4s per step
    const t = setTimeout(() => {
      setDoneTimes((d) => ({ ...d, [active]: (dur / 1000).toFixed(2) + "s" }));
      setActive(active + 1);
    }, dur);
    return () => clearTimeout(t);
  }, [active]);

  // running clock
  const [clock, setClock] = useFS("0.0s");
  useFE(() => {
    const i = setInterval(() => {
      const t = (performance.now() - startRef.current) / 1000;
      setClock(t.toFixed(1) + "s");
    }, 100);
    return () => clearInterval(i);
  }, []);

  const fill = (tpl) =>
    tpl.replace("{repo}", app.repo).replace("{branch}", app.branch);

  return (
    <div className="progress-shell">
      <div className="progress-titlebar">
        <div className="tb-dots"><span /><span /><span /></div>
        <div className="tb-title">auro-heal · session #{Math.floor(1000 + Math.random() * 9000)}</div>
        <div className="tb-clock">{clock}</div>
      </div>
      <div className="progress-body">
        {steps.map((s, i) => {
          const state = i < active ? "done" : i === active ? "run" : "pend";
          return (
            <div key={i} className={`step-row ${state === "pend" ? "pending" : ""}`}>
              <div className={`ico ${state}`}>{state === "done" ? "✓" : ""}</div>
              <div className="lbl">
                {s.label}
                <div className="det">{fill(s.detail)}</div>
              </div>
              <div className="ms">{doneTimes[i] || (state === "run" ? "running…" : "")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FixFlow({ app, onClose, onFixed }) {
  const [step, setStep] = useFS("review");      // review | fixing | success | commit | committed
  const [repo, setRepo] = useFS(app.repo);
  const [branch, setBranch] = useFS(app.branch);
  const [notes, setNotes] = useFS("");
  const [commitRepo, setCommitRepo] = useFS(app.repo);
  const [commitBranch, setCommitBranch] = useFS(app.branch);
  const [commitMsg, setCommitMsg] = useFS(`fix(${app.name}): patch ${app.errorType} via auro-heal`);
  const [commitHash, setCommitHash] = useFS("");

  // patch summary surfaced on success
  const patchSummary = useFR({
    filesChanged: 3,
    additions: 41,
    deletions: 18,
    testsPassed: 184,
    summary: `Guarded undefined access in payments.validatePayment and added null-safe path through the order processor. Regression test added.`,
  }).current;

  const submitFix = () => setStep("fixing");
  const onProgressDone = () => setStep("success");
  const goCommit = () => setStep("commit");
  const doCommit = () => {
    setStep("commit-running");
    setTimeout(() => {
      const h = Array.from({ length: 7 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
      setCommitHash(h);
      setStep("committed");
    }, 1200);
  };

  const finish = () => {
    onFixed({
      app: app.name,
      env: app.env,
      errorType: app.errorType,
      summary: patchSummary.summary,
      filesChanged: patchSummary.filesChanged,
      additions: patchSummary.additions,
      deletions: patchSummary.deletions,
      commit: commitHash,
      branch: commitBranch,
      repo: commitRepo,
      fixedAt: "Just now",
      duration: "1m 42s",
    });
  };

  const titleByStep = {
    "review":          "Review error & propose fix",
    "fixing":          "Auro is fixing this app",
    "success":         "Fix verified",
    "commit":          "Commit the patch",
    "commit-running":  "Committing patch",
    "committed":       "Pushed to repository",
  };

  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget && step === "review") onClose(); }}>
      <div className="modal" role="dialog" aria-label="Fix flow">
        <div className="modal-head">
          <div>
            <h2>{titleByStep[step]}</h2>
            <div className="modal-app-meta">
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{app.name}</span>
              {" · "}<EnvBadge env={app.env} />{" · "}{app.lang}
            </div>
          </div>
          {(step === "review" || step === "committed") && (
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <Icon.close width="14" height="14" />
            </button>
          )}
        </div>

        <div className="modal-body">
          {step === "review" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div className="section-label">Detected error · {app.errorType}</div>
                <div className="err-block">
                  <div className="err-head">{app.error.split("\n")[0]}</div>
                  <div style={{ color: "#94a39b" }}>{app.error.split("\n").slice(1).join("\n")}</div>
                  <div style={{ marginTop: 10, borderTop: "1px solid #232524", paddingTop: 10 }}>
                    {app.logExcerpt.map((ln, i) => <LogLine key={i} line={ln} />)}
                  </div>
                </div>
              </div>

              <div className="section-label">Source</div>
              <div className="field-row">
                <div className="field">
                  <label><Icon.git width="11" height="11" style={{ verticalAlign: "-1px", marginRight: 4 }} />Git repository URL</label>
                  <input className="input mono" value={repo} onChange={(e) => setRepo(e.target.value)} />
                </div>
                <div className="field">
                  <label><Icon.branch width="11" height="11" style={{ verticalAlign: "-1px", marginRight: 4 }} />Branch</label>
                  <input className="input mono" value={branch} onChange={(e) => setBranch(e.target.value)} />
                </div>
              </div>

              <div className="field">
                <label>Additional instructions for the agent · optional</label>
                <textarea
                  className="textarea"
                  placeholder="e.g. Avoid breaking the public API. Keep TypeScript strict mode passing. Add a regression test."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="hint">Plain language. These are appended to the LLM's prompt alongside the error context.</div>
              </div>
            </>
          )}

          {(step === "fixing" || step === "success") && (
            <ProgressStage steps={window.AURO_DATA.fixSteps} app={{ repo, branch }} onDone={onProgressDone} />
          )}

          {step === "success" && (
            <div style={{ marginTop: 18 }}>
              <div className="success-card">
                <div className="success-mark"><Icon.check /></div>
                <h3 className="success-title">{app.name} is healed</h3>
                <p className="success-sub">{patchSummary.summary}</p>
              </div>
              <div className="diff-grid">
                <div className="diff-cell"><div className="v">{patchSummary.filesChanged}</div><div className="l">Files changed</div></div>
                <div className="diff-cell"><div className="v add">+{patchSummary.additions}</div><div className="l">Additions</div></div>
                <div className="diff-cell"><div className="v del">−{patchSummary.deletions}</div><div className="l">Deletions</div></div>
                <div className="diff-cell"><div className="v">{patchSummary.testsPassed}</div><div className="l">Tests passing</div></div>
              </div>
            </div>
          )}

          {(step === "commit" || step === "commit-running") && (
            <>
              <div className="banner" style={{ marginBottom: 18 }}>
                <span className="b-dot" />
                Patch ready. Repository and branch are pre-filled from the source — change them only if you'd like to commit elsewhere.
              </div>
              <div className="field-row">
                <div className="field">
                  <label><Icon.git width="11" height="11" style={{ verticalAlign: "-1px", marginRight: 4 }} />Repository</label>
                  <input className="input mono" value={commitRepo} onChange={(e) => setCommitRepo(e.target.value)} disabled={step === "commit-running"} />
                </div>
                <div className="field">
                  <label><Icon.branch width="11" height="11" style={{ verticalAlign: "-1px", marginRight: 4 }} />Branch</label>
                  <input className="input mono" value={commitBranch} onChange={(e) => setCommitBranch(e.target.value)} disabled={step === "commit-running"} />
                </div>
              </div>
              <div className="field">
                <label>Commit message</label>
                <input className="input mono" value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} disabled={step === "commit-running"} />
              </div>
              <div className="field">
                <label>Patch preview</label>
                <div className="err-block" style={{ background: "#11140f", color: "#cfe1d6" }}>
                  <div><span style={{ color: "#6a7a72" }}>diff --git a/payments.js b/payments.js</span></div>
                  <div><span style={{ color: "var(--coral)" }}>- const token = req.body.payment.token;</span></div>
                  <div><span style={{ color: "var(--teal)" }}>+ const token = req.body?.payment?.token;</span></div>
                  <div><span style={{ color: "var(--teal)" }}>+ if (!token) throw new PaymentValidationError('missing token');</span></div>
                  <div style={{ color: "#6a7a72", marginTop: 6 }}>… 2 more files changed</div>
                </div>
              </div>
            </>
          )}

          {step === "committed" && (
            <div className="success-card" style={{ paddingTop: 8 }}>
              <div className="success-mark"><Icon.check /></div>
              <h3 className="success-title">Committed & pushed</h3>
              <p className="success-sub">
                Patch landed on{" "}
                <span className="tag-mono" style={{ color: "var(--ink)" }}>{commitBranch}</span>
                {" "}as{" "}
                <span className="tag-mono" style={{ background: "var(--bg-sunken)", padding: "1px 6px", borderRadius: 4, color: "var(--ink)" }}>{commitHash}</span>.
                CI will run on the next push event.
              </p>
              <div className="diff-grid">
                <div className="diff-cell" style={{ gridColumn: "1 / span 2" }}>
                  <div className="l">Repository</div>
                  <div className="v" style={{ fontSize: 13, marginTop: 4, color: "var(--ink)" }}>{commitRepo}</div>
                </div>
                <div className="diff-cell">
                  <div className="l">Branch</div>
                  <div className="v" style={{ fontSize: 13, marginTop: 4, color: "var(--ink)" }}>{commitBranch}</div>
                </div>
                <div className="diff-cell">
                  <div className="l">Commit</div>
                  <div className="v" style={{ fontSize: 13, marginTop: 4, color: "var(--ink)" }}>{commitHash}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {step === "review" && (
            <>
              <div className="footnote">
                <Icon.spark width="12" height="12" style={{ color: "var(--teal-deep)" }} />
                Auro will not push without your confirmation.
              </div>
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-teal" onClick={submitFix} disabled={!repo || !branch}>
                Submit & fix <Icon.arrowRight width="12" height="12" />
              </button>
            </>
          )}
          {step === "fixing" && (
            <>
              <div className="footnote">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", display: "inline-block" }} />
                Working… you can leave this tab open or come back later.
              </div>
              <button className="btn" onClick={onClose}>Run in background</button>
            </>
          )}
          {step === "success" && (
            <>
              <div className="footnote">Reviewed by 3 rule checks · 1 regression test added</div>
              <button className="btn" onClick={onClose}>Save & close</button>
              <button className="btn btn-teal" onClick={goCommit}>
                Continue to commit <Icon.arrowRight width="12" height="12" />
              </button>
            </>
          )}
          {step === "commit" && (
            <>
              <div className="footnote">Pushing to <span style={{ color: "var(--ink)" }}>{commitRepo}</span></div>
              <button className="btn" onClick={() => setStep("success")}>Back</button>
              <button className="btn btn-teal" onClick={doCommit}>
                <Icon.git width="12" height="12" /> Commit patch
              </button>
            </>
          )}
          {step === "commit-running" && (
            <>
              <div className="footnote">
                <span className="ico run" style={{ width: 10, height: 10, borderColor: "var(--teal-deep)", borderTopColor: "transparent", display: "inline-block" }} />
                Pushing commit to remote…
              </div>
              <button className="btn" disabled>Committing</button>
            </>
          )}
          {step === "committed" && (
            <>
              <div className="footnote">Logged in audit trail</div>
              <button className="btn" onClick={finish}>Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FixFlow });
