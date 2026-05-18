import { useState, useMemo } from 'react';
import { EnvCard } from '../../components/EnvCard.jsx';
import { SevBadge, EnvBadge } from '../../components/Badges.jsx';
import { IconSearch, IconSpark } from '../../components/Icons.jsx';

function AppRow({ app, onFix }) {
  return (
    <div
      className="grid grid-cols-[1.4fr_0.7fr_0.7fr_1.6fr_0.5fr_0.6fr_80px] gap-3 items-center px-4 py-3.5 border-b border-lines last:border-0 hover:bg-canvas cursor-pointer transition-colors text-sm"
      onClick={() => onFix(app)}
    >
      <div>
        <div className="font-semibold text-[14px]">{app.name}</div>
        <div className="font-mono text-[11px] text-ink-mute mt-0.5">{app.lang}</div>
      </div>
      <div><EnvBadge env={app.env} /></div>
      <div><SevBadge sev={app.severity} /></div>
      <div className="min-w-0">
        <div className="font-mono text-[12px]">{app.errorType}</div>
        <div className="font-mono text-[11px] text-ink-mute mt-0.5 truncate">{app.error.split('\n')[0]}</div>
      </div>
      <div className="font-mono font-semibold">{app.occurrences}</div>
      <div className="font-mono text-[12px] text-ink-mute">{app.lastSeen}</div>
      <div>
        <button
          className="inline-flex items-center gap-1.5 bg-ink text-raised px-2.5 py-1.5 rounded-[7px] text-xs font-semibold hover:bg-[#2a2926] transition-colors"
          onClick={e => { e.stopPropagation(); onFix(app); }}
        >
          <span className="w-2 h-2 rounded-full bg-teal shadow-[0_0_0_2px_rgba(255,255,255,0.1)]" />
          Fix
        </button>
      </div>
    </div>
  );
}

export function Dashboard({ envData, errorApps, onFix, envEmphasis = 'cards' }) {
  const [filter, setFilter] = useState('all');
  const [query,  setQuery]  = useState('');

  const filtered = useMemo(() => errorApps.filter(a => {
    if (filter !== 'all' && a.env !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.errorType.toLowerCase().includes(q);
    }
    return true;
  }), [errorApps, filter, query]);

  const totalErrors    = envData.reduce((n, e) => n + e.errors, 0);
  const totalInstances = envData.reduce((n, e) => n + e.instances, 0);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-end justify-between gap-6 mb-7 pb-5 border-b border-line flex-wrap">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute mb-1.5">Operations · Live</div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight m-0">Self-heal console</h1>
          <p className="text-ink-soft mt-1.5 text-sm">Auro inspects logs across your environments and proposes patches for the LLM to apply.</p>
        </div>
        <div className="flex gap-7 items-center flex-wrap">
          <div className="text-right">
            <div className="font-mono text-[22px] font-semibold tracking-tight">{totalInstances}</div>
            <div className="font-mono text-[11px] text-ink-mute uppercase tracking-wide mt-1">Instances watched</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[22px] font-semibold tracking-tight text-coral-deep">{totalErrors}</div>
            <div className="font-mono text-[11px] text-ink-mute uppercase tracking-wide mt-1">Open errors</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[22px] font-semibold tracking-tight text-teal-deep">128</div>
            <div className="font-mono text-[11px] text-ink-mute uppercase tracking-wide mt-1">Healed · 30d</div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="flex items-center gap-2.5 bg-raised border border-line rounded-lg px-3.5 py-2.5 text-[12.5px] text-ink-soft mb-8 flex-wrap">
        <span className="w-2 h-2 rounded-full bg-teal shadow-[0_0_0_4px_rgba(94,185,174,0.2)] shrink-0" />
        Auro is ingesting{' '}
        <span className="font-mono text-xs bg-sunken text-ink px-1.5 py-px rounded">12,408</span>{' '}
        log lines/minute across{' '}
        <span className="font-mono text-xs bg-sunken text-ink px-1.5 py-px rounded">4</span>{' '}
        environments. Pick an app below to start a fix.
      </div>

      {/* Environments */}
      <section className="mb-9">
        <div className="flex items-baseline justify-between mb-3.5">
          <div className="font-semibold text-[13px]">Environments</div>
          <div className="font-mono text-[11px] text-ink-mute">Updated · 4s ago</div>
        </div>

        {envEmphasis === 'strip' ? (
          <div className="flex bg-raised border border-line rounded-lg overflow-hidden flex-wrap">
            {envData.map(e => (
              <div key={e.id} className="flex-1 min-w-[160px] p-4 flex flex-col gap-2.5 border-r border-lines last:border-r-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] text-white tracking-wide ${
                    { aws: 'bg-[#c47d2a]', azure: 'bg-[#2a5ec4]', gcp: 'bg-[#1e8c4a]', vps: 'bg-[#5a3c9a]' }[e.id]
                  }`}>{e.name.slice(0,3)}</div>
                  <div>
                    <div className="font-bold text-[14px]">{e.name}</div>
                    <div className="font-mono text-[10px] text-ink-mute uppercase tracking-widest">{e.kind}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-ink-soft">
                    <span className={`w-1.5 h-1.5 rounded-full ${e.status === 'healthy' ? 'bg-teal' : 'bg-amber'}`} />
                    {e.status}
                  </div>
                </div>
                <div className="flex gap-4 font-mono text-xs text-ink-soft">
                  <span><strong className="text-ink">{e.instances}</strong> inst</span>
                  <span className={e.errors > 0 ? 'text-coral-deep' : ''}><strong>{e.errors}</strong> errors</span>
                  <span><strong className="text-ink">{e.health}%</strong> health</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {envData.map(e => <EnvCard key={e.id} env={e} />)}
          </div>
        )}
      </section>

      {/* Apps table */}
      <section>
        <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
          <div className="font-semibold text-[13px]">Apps reporting errors</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2 w-3.5 h-3.5 text-ink-mute" />
              <input
                className="bg-raised border border-line rounded-lg pl-7 pr-3 py-1.5 text-[13px] outline-none focus:border-teal-deep focus:ring-2 focus:ring-teal/20 w-48"
                placeholder="Search app or error"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select
              className="bg-raised border border-line rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-teal-deep w-40"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All environments</option>
              {envData.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-raised border border-line rounded-lg overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_1.6fr_0.5fr_0.6fr_80px] gap-3 items-center px-4 py-2.5 bg-canvas border-b border-line" style={{ minWidth: 700 }}>
              {['App', 'Env', 'Severity', 'Error', 'Hits', 'Last seen', ''].map((h, i) => (
                <div key={i} className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-mute">{h}</div>
              ))}
            </div>
            <div style={{ minWidth: 700 }}>
              {filtered.map(a => <AppRow key={a.id} app={a} onFix={onFix} />)}
              {filtered.length === 0 && (
                <div className="py-9 text-center text-ink-mute text-[13px]">No apps match those filters.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
