import { useState, useEffect } from 'react';
import I from './components/Icons';
import { Toast } from './components/Shared';
import { Dashboard } from './components/Dashboard';
import { Workspace } from './components/Workspace';
import { UploadModal, DiffModal, TestsModal, PrModal } from './components/Modals';
import { PROJECTS, CODE_SAMPLES } from './data/index';

const TWEAK_DEFAULTS = { theme: 'light', accent: 'blue' };
const ACCENTS = {
  blue: { light: ['oklch(48% 0.14 258)','oklch(96% 0.02 258)','oklch(32% 0.14 258)'], dark: ['oklch(72% 0.14 245)','oklch(28% 0.08 245)','oklch(88% 0.08 245)'] },
  teal: { light: ['oklch(52% 0.11 200)','oklch(96% 0.025 200)','oklch(35% 0.11 200)'], dark: ['oklch(75% 0.11 195)','oklch(28% 0.07 195)','oklch(88% 0.08 195)'] },
};

export default function App() {
  const [view, setView] = useState('dashboard');

  // Active project (demo or real)
  const [project, setProject] = useState(null);

  // Real workspace state (set when user uploads / clones / pastes)
  const [workspaceId, setWorkspaceId] = useState(null);
  const [workspaceFiles, setWorkspaceFiles] = useState([]);   // file tree from backend
  const [currentFile, setCurrentFile] = useState(null);       // { path, content, language }
  const [repoInfo, setRepoInfo] = useState(null);             // { owner, repo } from GitHub clone

  // UI state
  const [activity, setActivity] = useState('fix');
  const [selectedSugg, setSelectedSugg] = useState(null);
  const [uploadMode, setUploadMode] = useState(null);
  const [diffSugg, setDiffSugg] = useState(null);
  const [diffData, setDiffData] = useState(null);             // real diff from backend
  const [modifiedCode, setModifiedCode] = useState(null);
  const [testsOpen, setTestsOpen] = useState(false);
  const [prOpen, setPrOpen] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweaksUIVisible, setTweaksUIVisible] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Apply theme/accent
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    const [a, s, ink] = tweaks.theme === 'dark' ? ACCENTS[tweaks.accent].dark : ACCENTS[tweaks.accent].light;
    document.documentElement.style.setProperty('--accent', a);
    document.documentElement.style.setProperty('--accent-soft', s);
    document.documentElement.style.setProperty('--accent-ink', ink);
  }, [tweaks.theme, tweaks.accent]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.data?.type) return;
      if (e.data.type === '__activate_edit_mode') setTweaksUIVisible(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksUIVisible(false);
    };
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (patch) => {
    setTweaks(t => ({ ...t, ...patch }));
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*'); } catch {}
  };

  const toast = (title, body, kind = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, title, body, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  // Open a demo project (no real workspace)
  const openDemoProject = (p) => {
    setProject(p);
    setWorkspaceId(null);
    setWorkspaceFiles([]);
    setCurrentFile(null);
    setRepoInfo(null);
    setActivity('fix');
    setSelectedSugg(null);
    setView('workspace');
  };

  // Open a real workspace (from upload / paste / clone)
  const openRealWorkspace = ({ workspaceId: wid, tree, project: proj, openFile, repoInfo: ri }) => {
    setWorkspaceId(wid);
    setWorkspaceFiles(tree || []);
    setProject(proj || { id: wid, name: 'My Project', branch: 'main', lang: 'java' });
    setRepoInfo(ri || null);
    setActivity('fix');
    setSelectedSugg(null);
    setCurrentFile(openFile || null);
    setDiffData(null);
    setModifiedCode(null);
    setView('workspace');
  };

  const handleOpenDiff = (sugg, diffDataFromBackend, modCode) => {
    setDiffSugg(sugg);
    setDiffData(diffDataFromBackend || null);
    setModifiedCode(modCode || null);
  };

  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">&lt;/&gt;</span>
          <span>Codecraft</span>
        </div>
        <span className="sep"></span>
        <div className="crumb">
          <span className="here" style={{ cursor: 'pointer' }} onClick={() => setView('dashboard')}>Projects</span>
          {view === 'workspace' && project && (
            <>
              <I.ChevR size={11} />
              <span className="here">{project.name}</span>
              {currentFile && (
                <>
                  <I.ChevR size={11} />
                  <span className="mono" style={{ fontSize: 12 }}>{currentFile.path.split('/').pop()}</span>
                </>
              )}
            </>
          )}
        </div>
        <span className="spacer"></span>
        <button className="btn sm" onClick={() => setUploadMode('upload')}>
          <I.Plus size={12} /> New
        </button>
        <span className="sep"></span>
        <button className="icon-btn" title="Docs"><I.Book size={15} /></button>
        <button className="icon-btn" title="Settings" onClick={() => setTweaksUIVisible(v => !v)}>
          <I.Settings size={15} />
        </button>
        <div className="avatar">AI</div>
      </div>

      {view === 'dashboard' && (
        <Dashboard
          onOpenProject={openDemoProject}
          onUpload={(mode) => setUploadMode(mode)}
        />
      )}

      {view === 'workspace' && project && (
        <Workspace
          project={project}
          workspaceId={workspaceId}
          workspaceFiles={workspaceFiles}
          currentFile={currentFile}
          setCurrentFile={setCurrentFile}
          activity={activity}
          setActivity={setActivity}
          selectedSugg={selectedSugg}
          setSelectedSugg={setSelectedSugg}
          onOpenDiff={handleOpenDiff}
          onOpenTests={() => setTestsOpen(true)}
          onOpenPr={() => setPrOpen(true)}
          onToast={toast}
        />
      )}

      {/* Modals */}
      {uploadMode && (
        <UploadModal
          mode={uploadMode}
          onClose={() => setUploadMode(null)}
          onOpenDemoProject={openDemoProject}
          onOpenRealWorkspace={openRealWorkspace}
          onToast={toast}
        />
      )}

      {diffSugg && (
        <DiffModal
          suggestion={diffSugg}
          diffData={diffData}
          modifiedCode={modifiedCode}
          workspaceId={workspaceId}
          currentFile={currentFile}
          onClose={() => { setDiffSugg(null); setDiffData(null); setModifiedCode(null); }}
          onAccept={(code) => {
            setDiffSugg(null);
            setDiffData(null);
            setModifiedCode(null);
            if (currentFile && code) setCurrentFile(f => ({ ...f, content: code }));
            toast('Change applied', currentFile ? `${currentFile.path.split('/').pop()} updated.` : 'File updated.');
          }}
          onGenerateTests={() => { setDiffSugg(null); setDiffData(null); setTestsOpen(true); }}
          onToast={toast}
        />
      )}

      {testsOpen && (
        <TestsModal
          workspaceId={workspaceId}
          currentFile={currentFile}
          modifiedCode={modifiedCode}
          onClose={() => setTestsOpen(false)}
          onSave={(mode) => {
            setTestsOpen(false);
            if (mode === 'pr') setPrOpen(true);
            else if (mode === 'download') toast('Download ready', 'Project zip prepared.');
            else toast('Saved', 'Test file added to workspace.');
          }}
        />
      )}

      {prOpen && (
        <PrModal
          workspaceId={workspaceId}
          repoInfo={repoInfo}
          currentFile={currentFile}
          onClose={() => setPrOpen(false)}
          onSubmitted={(result) => {
            setPrOpen(false);
            if (result?.prUrl) toast('Pull request created', `#${result.prNumber} opened on GitHub`);
            else if (result?.mode === 'download') toast('Download ready', 'Project zip prepared.');
            else toast('Pushed', 'Changes pushed to branch.');
          }}
          onToast={toast}
        />
      )}

      {tweaksUIVisible && (
        <div className="tweaks-panel">
          <div className="tweaks-head">
            <I.Settings size={13} />
            <span className="t">Tweaks</span>
            <span className="spacer"></span>
            <button className="icon-btn" onClick={() => setTweaksUIVisible(false)}><I.Close size={13} /></button>
          </div>
          <div className="tweaks-body">
            <div className="tweak-row">
              <span className="lbl">Theme</span>
              <div className="tweak-options">
                {['light', 'dark'].map(t => (
                  <button key={t} className={`tweak-opt ${tweaks.theme === t ? 'active' : ''}`} onClick={() => setTweak({ theme: t })}>
                    {t === 'light' ? <><I.Sun size={11} /> Light</> : <><I.Moon size={11} /> Dark</>}
                  </button>
                ))}
              </div>
            </div>
            <div className="tweak-row">
              <span className="lbl">Accent</span>
              <div className="swatches">
                {['blue', 'teal'].map(ac => (
                  <button key={ac} className={`swatch ${tweaks.accent === ac ? 'active' : ''}`}
                    style={{ background: tweaks.theme === 'dark' ? ACCENTS[ac].dark[0] : ACCENTS[ac].light[0] }}
                    onClick={() => setTweak({ accent: ac })} title={ac} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.45 }}>
              Switching theme changes all surfaces and accent contrast.
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
