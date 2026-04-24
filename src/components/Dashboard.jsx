import { useState } from 'react';
import I from './Icons';
import { PROJECTS } from '../data/index';

export function Dashboard({ onOpenProject, onUpload }) {
  const [lang, setLang] = useState('all');
  const filtered = lang === 'all' ? PROJECTS : PROJECTS.filter(p => p.lang === lang);
  const langs = [
    { id: 'all', label: 'All' },
    { id: 'java', label: 'Java' },
    { id: 'cs', label: 'C#' },
    { id: 'node', label: 'Node' },
    { id: 'az', label: 'Azure' },
    { id: 'py', label: 'Python' },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Analyze, fix, improve — then ship.</h1>
          <p className="page-sub">Drop in code or connect a repo. Point the assistant at a file, pick an activity, review suggestions, and submit back to Git.</p>
        </div>
      </div>

      <div className="entry-strip">
        <button className="entry-card" onClick={() => onUpload('upload')}>
          <span className="entry-icon"><I.Upload size={18} /></span>
          <div>
            <div className="title">Upload a folder or zip</div>
            <div className="sub">Drag in a project — supports Java, C#, Node, Python.</div>
          </div>
        </button>
        <button className="entry-card" onClick={() => onUpload('paste')}>
          <span className="entry-icon"><I.Paste size={18} /></span>
          <div>
            <div className="title">Paste code</div>
            <div className="sub">Quickest way to check a single file or snippet.</div>
          </div>
        </button>
        <button className="entry-card" onClick={() => onUpload('git')}>
          <span className="entry-icon"><I.Git size={18} /></span>
          <div>
            <div className="title">Connect a Git repo</div>
            <div className="sub">GitHub, GitLab, or Azure DevOps — read-only until you submit.</div>
          </div>
        </button>
      </div>

      <div className="section-head">
        <h2>Recent projects</h2>
        <div className="filter-row">
          {langs.map(l => (
            <button key={l.id} className={`chip ${lang === l.id ? 'active' : ''}`} onClick={() => setLang(l.id)}>{l.label}</button>
          ))}
        </div>
      </div>

      <div className="projects-grid">
        {filtered.map(p => (
          <div key={p.id} className="proj-card" onClick={() => onOpenProject(p)}>
            <div className="proj-row-1">
              <span className={`lang-chip ${p.lang}`}>{p.langLabel}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="proj-name">{p.name}</div>
                <div className="proj-meta">{p.meta}</div>
              </div>
              <span className="proj-branch"><I.Branch size={11} /> {p.branch}</span>
            </div>
            <div className="proj-stats">
              <span className="stat">
                <span className={`dot ${p.status}`}></span>
                {p.status === 'g' ? 'Healthy' : p.status === 'y' ? 'Needs attention' : 'Issues'}
              </span>
              <span className="stat">{p.issues} {p.issues === 1 ? 'issue' : 'issues'}</span>
              <span className="stat" style={{ marginLeft: 'auto' }}>Open <I.ArrowRight size={11} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
