// Root app
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "blue"
}/*EDITMODE-END*/;

const ACCENTS = {
  blue: { light: ['oklch(48% 0.14 258)', 'oklch(96% 0.02 258)', 'oklch(32% 0.14 258)'],
          dark:  ['oklch(72% 0.14 245)', 'oklch(28% 0.08 245)', 'oklch(88% 0.08 245)'] },
  teal: { light: ['oklch(52% 0.11 200)', 'oklch(96% 0.025 200)', 'oklch(35% 0.11 200)'],
          dark:  ['oklch(75% 0.11 195)', 'oklch(28% 0.07 195)', 'oklch(88% 0.08 195)'] },
};

function App() {
  const [view, setView] = useStateApp('dashboard'); // dashboard | workspace
  const [project, setProject] = useStateApp(PROJECTS[0]);
  const [language, setLanguage] = useStateApp('java');
  const [activity, setActivity] = useStateApp('fix');
  const [selectedSugg, setSelectedSugg] = useStateApp(null);

  const [uploadMode, setUploadMode] = useStateApp(null); // 'upload' | 'paste' | 'git'
  const [diffSugg, setDiffSugg] = useStateApp(null);
  const [testsOpen, setTestsOpen] = useStateApp(false);
  const [prOpen, setPrOpen] = useStateApp(false);

  const [tweaks, setTweaks] = useStateApp(TWEAK_DEFAULTS);
  const [tweaksUIVisible, setTweaksUIVisible] = useStateApp(false);
  const [toasts, setToasts] = useStateApp([]);

  // Apply theme/accent
  useEffectApp(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    const [a, s, ink] = (tweaks.theme === 'dark' ? ACCENTS[tweaks.accent].dark : ACCENTS[tweaks.accent].light);
    document.documentElement.style.setProperty('--accent', a);
    document.documentElement.style.setProperty('--accent-soft', s);
    document.documentElement.style.setProperty('--accent-ink', ink);
  }, [tweaks.theme, tweaks.accent]);

  // Tweaks host protocol
  useEffectApp(() => {
    const handler = (e) => {
      if (!e.data || !e.data.type) return;
      if (e.data.type === '__activate_edit_mode') setTweaksUIVisible(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksUIVisible(false);
    };
    window.addEventListener('message', handler);
    // announce availability AFTER listener is installed
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*'); } catch {}
  };

  const toast = (title, body, kind = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, title, body, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const openProject = (p) => {
    setProject(p);
    setLanguage(p.lang === 'py' ? 'node' : (CODE_SAMPLES[p.lang] ? p.lang : 'java'));
    setActivity('fix');
    setSelectedSugg(null);
    setView('workspace');
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">&lt;/&gt;</span>
          <span>Codecraft</span>
        </div>
        <span className="sep"></span>
        <div className="crumb">
          <span className="here" style={{ cursor: 'pointer' }} onClick={() => setView('dashboard')}>Projects</span>
          {view === 'workspace' && <>
            <I.ChevR size={11}/>
            <span className="here">{project.name}</span>
            <I.ChevR size={11}/>
            <span className="mono" style={{ fontSize: 12 }}>{CODE_SAMPLES[language]?.file}</span>
          </>}
        </div>
        <span className="spacer"></span>
        <button className="btn sm" onClick={() => setUploadMode('upload')}>
          <I.Plus size={12}/> New
        </button>
        <span className="sep"></span>
        <button className="icon-btn" title="Docs"><I.Book size={15}/></button>
        <button className="icon-btn" title="Settings"><I.Settings size={15}/></button>
        <div className="avatar">PS</div>
      </div>

      {view === 'dashboard' && (
        <Dashboard
          onOpenProject={openProject}
          onUpload={(mode) => setUploadMode(mode)}
        />
      )}

      {view === 'workspace' && (
        <Workspace
          project={project}
          language={language}
          onChangeLang={setLanguage}
          activity={activity}
          setActivity={setActivity}
          selectedSugg={selectedSugg}
          setSelectedSugg={setSelectedSugg}
          onBack={() => setView('dashboard')}
          onOpenDiff={(s) => setDiffSugg(s)}
          onOpenTests={() => setTestsOpen(true)}
          onOpenPr={() => setPrOpen(true)}
          onToast={toast}
        />
      )}

      {uploadMode && (
        <UploadModal
          mode={uploadMode}
          onClose={() => setUploadMode(null)}
          onOpenProject={openProject}
        />
      )}

      {diffSugg && (
        <DiffModal
          suggestion={diffSugg}
          onClose={() => setDiffSugg(null)}
          onAccept={() => {
            setDiffSugg(null);
            toast('Change applied', 'OrderService.java updated locally.');
          }}
          onGenerateTests={() => { setDiffSugg(null); setTestsOpen(true); }}
        />
      )}

      {testsOpen && (
        <TestsModal
          onClose={() => setTestsOpen(false)}
          onSave={(mode) => {
            setTestsOpen(false);
            if (mode === 'pr') setPrOpen(true);
            else if (mode === 'download') toast('Download ready', 'orders-api.zip (2.4 MB) — including test class.');
            else toast('Saved locally', 'OrderServiceTest.java added to src/test/java.');
          }}
        />
      )}

      {prOpen && (
        <PrModal
          onClose={() => setPrOpen(false)}
          onSubmitted={(mode) => {
            setPrOpen(false);
            if (mode === 'download') toast('Download ready', 'orders-api.zip (2.4 MB) downloaded.');
            else toast('Pull request opened', '#482 · ai/fix-order-items-npe → main');
          }}
        />
      )}

      {tweaksUIVisible && (
        <div className="tweaks-panel">
          <div className="tweaks-head">
            <I.Settings size={13}/>
            <span className="t">Tweaks</span>
            <span className="spacer"></span>
            <button className="icon-btn" onClick={() => setTweaksUIVisible(false)}><I.Close size={13}/></button>
          </div>
          <div className="tweaks-body">
            <div className="tweak-row">
              <span className="lbl">Theme</span>
              <div className="tweak-options">
                <button className={`tweak-opt ${tweaks.theme === 'light' ? 'active' : ''}`} onClick={() => setTweak({ theme: 'light' })}>
                  <I.Sun size={11}/> Light
                </button>
                <button className={`tweak-opt ${tweaks.theme === 'dark' ? 'active' : ''}`} onClick={() => setTweak({ theme: 'dark' })}>
                  <I.Moon size={11}/> Dark
                </button>
              </div>
            </div>
            <div className="tweak-row">
              <span className="lbl">Accent</span>
              <div className="swatches">
                <button className={`swatch ${tweaks.accent === 'blue' ? 'active' : ''}`}
                        style={{ background: tweaks.theme === 'dark' ? ACCENTS.blue.dark[0] : ACCENTS.blue.light[0] }}
                        onClick={() => setTweak({ accent: 'blue' })} title="Deep blue"/>
                <button className={`swatch ${tweaks.accent === 'teal' ? 'active' : ''}`}
                        style={{ background: tweaks.theme === 'dark' ? ACCENTS.teal.dark[0] : ACCENTS.teal.light[0] }}
                        onClick={() => setTweak({ accent: 'teal' })} title="Teal"/>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.45 }}>
              Switching theme changes background, surfaces and accent contrast.
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
