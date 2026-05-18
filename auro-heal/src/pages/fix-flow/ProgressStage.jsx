import { useEffect, useState } from 'react';
import { IconCheck } from '../../components/Icons.jsx';

const STEP_DELAY = 420;

export function ProgressStage({ steps = [], active = false }) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (!active) { setRevealed(0); return; }
    setRevealed(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= steps.length) clearInterval(id);
    }, STEP_DELAY);
    return () => clearInterval(id);
  }, [active, steps.length]);

  return (
    <div className="bg-[#0e1210] rounded-xl border border-[#1e2620] p-4 font-mono text-[11px] space-y-1.5 min-h-[160px]">
      <div className="text-[#4a6a58] mb-2 select-none">// auro-heal fix engine</div>
      {steps.slice(0, revealed).map((step, i) => (
        <div key={i} className="flex items-start gap-2 animate-fadein">
          {step.done ? (
            <span className="text-teal mt-0.5 shrink-0">✓</span>
          ) : (
            <span className="text-[#4a6a58] mt-0.5 shrink-0">›</span>
          )}
          <span className={step.done ? 'text-[#7a9a88]' : 'text-[#c8ddd0]'}>{step.text}</span>
        </div>
      ))}
      {active && revealed < steps.length && (
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse2 shrink-0" />
          <span className="text-[#4a6a58]">running…</span>
        </div>
      )}
    </div>
  );
}
