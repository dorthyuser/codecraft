const LOGO_BG  = { aws: 'bg-[#c47d2a]', azure: 'bg-[#2a5ec4]', gcp: 'bg-[#1e8c4a]', vps: 'bg-[#5a3c9a]' };
const TINT     = { aws: 'env-card-aws', azure: 'env-card-azure', gcp: 'env-card-gcp', vps: 'env-card-vps' };
const HEALTH_FILL = { healthy: 'bg-gradient-to-r from-teal-deep to-teal', degraded: 'bg-gradient-to-r from-amber-deep to-amber' };

export function EnvCard({ env }) {
  const isHealthy = env.status === 'healthy';
  return (
    <div className={`relative bg-raised border border-line rounded-lg p-4 flex flex-col gap-3 overflow-hidden shadow-card h-full ${TINT[env.id]}`}>
      {/* header */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] text-white tracking-wide flex-none ${LOGO_BG[env.id] ?? 'bg-ink'}`}>
          {env.name.slice(0, 3).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-[15px] tracking-tight">{env.name}</div>
          <div className="font-mono text-[10px] text-ink-mute uppercase tracking-widest">{env.kind}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-ink-soft">
          <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-teal animate-pulse2' : 'bg-amber animate-pulse2'}`} />
          {env.status}
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-mono text-lg font-semibold tracking-tight">{env.instances}</div>
          <div className="font-mono text-[10px] text-ink-mute uppercase tracking-wide mt-0.5">Instances</div>
        </div>
        <div>
          <div className={`font-mono text-lg font-semibold tracking-tight ${env.errors > 0 ? 'text-coral-deep' : ''}`}>{env.errors}</div>
          <div className="font-mono text-[10px] text-ink-mute uppercase tracking-wide mt-0.5">Active errors</div>
        </div>
      </div>

      {/* health bar */}
      <div>
        <div className="h-1 bg-sunken rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${HEALTH_FILL[env.status] ?? HEALTH_FILL.healthy}`} style={{ width: `${env.health}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[11px] text-ink-mute">Health</span>
          <span className="font-mono text-[11px] font-semibold text-ink-soft">{env.health}%</span>
        </div>
      </div>

      {/* region */}
      <div className="font-mono text-[11px] text-ink-soft border-t border-dashed border-line pt-2">{env.region}</div>
    </div>
  );
}
