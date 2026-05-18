/* Auro Heal — shared icon set + small UI atoms */
const { useEffect, useRef, useState, useMemo } = React;

const Icon = {
  dashboard: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <rect x="2" y="2" width="5" height="5" rx="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" />
    </svg>
  ),
  fixed: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pulse: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M1 8h3l2-5 3 10 2-5h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v1.8M8 12.7v1.8M14.5 8h-1.8M3.3 8H1.5M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3M12.6 12.6l-1.3-1.3M4.7 4.7L3.4 3.4" strokeLinecap="round" />
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M3.5 11h9l-1-1.5V6.5a3.5 3.5 0 1 0-7 0v3L3.5 11zM6.5 13a1.5 1.5 0 0 0 3 0" strokeLinejoin="round" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  ),
  spark: (p) => (
    <svg viewBox="0 0 16 16" fill="currentColor" {...p}>
      <path d="M8 1l1.4 4.6L14 7l-4.6 1.4L8 13l-1.4-4.6L2 7l4.6-1.4L8 1z" />
    </svg>
  ),
  arrowRight: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  git: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <circle cx="4" cy="4" r="1.6" /><circle cx="4" cy="12" r="1.6" /><circle cx="12" cy="8" r="1.6" />
      <path d="M4 5.6v4.8M5.5 4h2.7a2 2 0 0 1 2 2v.5" strokeLinecap="round" />
    </svg>
  ),
  branch: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <circle cx="4" cy="3" r="1.4" /><circle cx="4" cy="13" r="1.4" /><circle cx="12" cy="6" r="1.4" />
      <path d="M4 4.5v7M4 9.5a5 5 0 0 1 5-5h1.5" strokeLinecap="round" />
    </svg>
  ),
  refresh: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M13 4.5A6 6 0 0 0 2.2 7M3 11.5A6 6 0 0 0 13.8 9" strokeLinecap="round" />
      <path d="M13 1.5v3h-3M3 14.5v-3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
};

function Badge({ kind, children }) {
  return <span className={`badge ${kind ? "badge-" + kind : ""}`}>{children}</span>;
}

function EnvBadge({ env }) {
  return (
    <span className={`badge badge-env-${env}`}>
      <span className="dot" />
      {env.toUpperCase()}
    </span>
  );
}

function SevBadge({ sev }) {
  return (
    <span className={`badge badge-sev-${sev}`}>
      <span className="dot" />
      {sev}
    </span>
  );
}

// Render a single log line with level coloring
function LogLine({ line }) {
  const m = line.match(/^(\[[^\]]+\])\s+(\w+)\s+(.*)$/);
  if (!m) return <div className="log-line">{line}</div>;
  const [, ts, lvl, rest] = m;
  return (
    <div className="log-line">
      <span style={{ color: "#5d6d65" }}>{ts}</span>{" "}
      <span className={`lvl-${lvl}`}>{lvl}</span>{" "}
      <span>{rest}</span>
    </div>
  );
}

Object.assign(window, { Icon, Badge, EnvBadge, SevBadge, LogLine });
