const SEV_CLASSES = {
  critical: 'bg-coral-soft text-coral-deep border-coral/30',
  high:     'bg-coral-soft text-coral-deep border-coral/20',
  medium:   'bg-amber-soft text-amber-deep border-amber/25',
  low:      'bg-sunken text-ink-soft border-line',
};

const ENV_CLASSES = {
  aws:   'bg-[#fdf6e3] text-[#7a5c10]',
  azure: 'bg-[#eef2fc] text-[#2a3e9a]',
  gcp:   'bg-[#e8f5ee] text-[#1a6640]',
  vps:   'bg-sunken text-ink-soft',
};

export function SevBadge({ sev }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-medium uppercase tracking-wide border ${SEV_CLASSES[sev] ?? SEV_CLASSES.low}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {sev}
    </span>
  );
}

export function EnvBadge({ env }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-medium uppercase tracking-wide ${ENV_CLASSES[env] ?? ENV_CLASSES.vps}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {env?.toUpperCase()}
    </span>
  );
}
