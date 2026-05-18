const LEVEL_COLOR = { ERROR: 'text-coral', WARN: 'text-amber', INFO: 'text-teal' };

export function LogLine({ line }) {
  const m = line.match(/^(\[[^\]]+\])\s+(\w+)\s+(.*)$/);
  if (!m) return <div className="font-mono text-xs text-[#8c9b94]">{line}</div>;
  const [, ts, lvl, rest] = m;
  return (
    <div className="font-mono text-xs flex gap-2">
      <span className="text-[#5d6d65]">{ts}</span>
      <span className={LEVEL_COLOR[lvl] ?? 'text-[#8c9b94]'}>{lvl}</span>
      <span className="text-[#8c9b94]">{rest}</span>
    </div>
  );
}
