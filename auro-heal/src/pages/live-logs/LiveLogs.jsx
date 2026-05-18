import { useState, useEffect, useRef } from 'react';
import { EnvBadge } from '../../components/Badges.jsx';
import { IconActivity } from '../../components/Icons.jsx';

const LEVEL_STYLE = {
  ERROR: { text: 'text-coral',     bg: 'bg-coral-soft',  border: 'border-coral/30' },
  WARN:  { text: 'text-amber',     bg: 'bg-amber-soft',  border: 'border-amber/30' },
  INFO:  { text: 'text-teal',      bg: 'bg-teal-soft',   border: 'border-teal/30'  },
  DEBUG: { text: 'text-ink-mute',  bg: 'bg-sunken',      border: 'border-line'     },
};

const SAMPLE_LOGS = [
  { env: 'aws',   app: 'checkout-service',    level: 'ERROR', msg: "TypeError: Cannot read properties of undefined (reading 'token')" },
  { env: 'aws',   app: 'auth-gateway',        level: 'WARN',  msg: 'JWT verification slow — 2400ms, threshold 500ms' },
  { env: 'gcp',   app: 'notifications-fanout',level: 'ERROR', msg: 'send on closed channel — worker restart 4/10' },
  { env: 'azure', app: 'warehouse-sync',      level: 'INFO',  msg: 'sync batch 489 started · 1240 rows' },
  { env: 'gcp',   app: 'reporting-pipeline',  level: 'WARN',  msg: 'BigQuery job approaching 300s limit · 280s elapsed' },
  { env: 'vps',   app: 'edge-router',         level: 'DEBUG', msg: 'buffer allocated 4096 bytes at parser/parse.js:48' },
  { env: 'aws',   app: 'checkout-service',    level: 'INFO',  msg: 'POST /api/v1/checkout · 142ms' },
  { env: 'azure', app: 'warehouse-sync',      level: 'ERROR', msg: 'UniqueViolation on sku_idx · batch rolled back' },
  { env: 'aws',   app: 'auth-gateway',        level: 'INFO',  msg: 'token refreshed for user 83920 · exp +3600s' },
  { env: 'gcp',   app: 'notifications-fanout',level: 'WARN',  msg: 'pubsub backpressure detected · queue depth 12,400' },
];

let logCounter = 0;
function makeLog() {
  const src = SAMPLE_LOGS[logCounter % SAMPLE_LOGS.length];
  logCounter++;
  return {
    id: Date.now() + Math.random(),
    ts: new Date().toISOString().replace('T', ' ').slice(0, 19),
    ...src,
  };
}

export function LiveLogs() {
  const [logs,    setLogs]    = useState(() => Array.from({ length: 18 }, makeLog));
  const [paused,  setPaused]  = useState(false);
  const [envFilter, setEnvFilter] = useState('all');
  const [lvlFilter, setLvlFilter] = useState('all');
  const [search,  setSearch]  = useState('');
  const bottomRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setLogs(xs => [...xs.slice(-200), makeLog()]);
    }, 900);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const visible = logs.filter(l => {
    if (envFilter !== 'all' && l.env !== envFilter) return false;
    if (lvlFilter !== 'all' && l.level !== lvlFilter) return false;
    if (search && !l.msg.toLowerCase().includes(search.toLowerCase()) && !l.app.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const envs   = ['all', 'aws', 'azure', 'gcp', 'vps'];
  const levels = ['all', 'ERROR', 'WARN', 'INFO', 'DEBUG'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-7 pb-5 border-b border-line flex-wrap">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute mb-1.5">Real-time</div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight m-0">Live logs</h1>
          <p className="text-ink-soft mt-1.5 text-sm">Streaming log feed across all monitored environments. Errors are highlighted in red.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-full ${paused ? 'bg-amber-soft text-amber-deep' : 'bg-teal-soft text-teal-deep'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-amber' : 'bg-teal animate-pulse2'}`} />
            {paused ? 'Paused' : 'Live'}
          </span>
          <button
            onClick={() => setPaused(p => !p)}
            className="bg-raised border border-line px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-soft hover:bg-sunken transition-colors"
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          className="bg-raised border border-line rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-teal-deep w-48"
          placeholder="Search logs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="bg-raised border border-line rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-teal-deep" value={envFilter} onChange={e => setEnvFilter(e.target.value)}>
          {envs.map(e => <option key={e} value={e}>{e === 'all' ? 'All envs' : e.toUpperCase()}</option>)}
        </select>
        <select className="bg-raised border border-line rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-teal-deep" value={lvlFilter} onChange={e => setLvlFilter(e.target.value)}>
          {levels.map(l => <option key={l} value={l}>{l === 'all' ? 'All levels' : l}</option>)}
        </select>
        <label className="ml-auto flex items-center gap-2 text-xs text-ink-soft cursor-pointer select-none">
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="accent-teal-deep" />
          Auto-scroll
        </label>
      </div>

      {/* Log stream */}
      <div className="flex-1 bg-[#0e1210] rounded-lg border border-[#1e2620] overflow-hidden flex flex-col" style={{ minHeight: 400 }}>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1e2620] bg-[#141812]">
          <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2d3630]"/><span className="w-2.5 h-2.5 rounded-full bg-[#2d3630]"/><span className="w-2.5 h-2.5 rounded-full bg-[#2d3630]"/></div>
          <span className="font-mono text-[11px] text-[#5a6b62] ml-2">auro-heal · log stream · {visible.length} lines</span>
          <span className="ml-auto font-mono text-[11px] text-[#3a4d42]">{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
          {visible.map(log => {
            const st = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.DEBUG;
            return (
              <div key={log.id} className="flex items-start gap-3 font-mono text-[11.5px]">
                <span className="text-[#5d6d65] shrink-0">{log.ts}</span>
                <span className={`shrink-0 px-1.5 py-px rounded text-[10px] font-bold ${st.bg} ${st.text} border ${st.border}`}>{log.level}</span>
                <EnvBadge env={log.env} />
                <span className="text-[#7a9688] shrink-0">{log.app}</span>
                <span className={`flex-1 ${st.text !== 'text-ink-mute' ? st.text : 'text-[#adc4b8]'}`}>{log.msg}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
