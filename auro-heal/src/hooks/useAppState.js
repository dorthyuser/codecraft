import { useState, useMemo } from 'react';
import { apps as seedApps, fixed as seedFixed, environments } from '../data/seed.js';

export function useAppState() {
  const [errorApps,  setErrorApps]  = useState(seedApps);
  const [fixedItems, setFixedItems] = useState(seedFixed);
  const [dismissed,  setDismissed]  = useState([]);
  const [modalApp,   setModalApp]   = useState(null);

  const activeAlerts = useMemo(
    () => errorApps.filter(a => !dismissed.includes(a.id)),
    [errorApps, dismissed]
  );

  const handleFixed = (rec) => {
    setErrorApps(xs => xs.filter(a => a.name !== rec.app));
    setFixedItems(xs => [{ ...rec, id: 'fix-' + Date.now() }, ...xs]);
    setModalApp(null);
  };

  const handleRefix = (item) => {
    setModalApp({
      id: 'refix-' + item.id,
      name: item.app, env: item.env, lang: '—',
      severity: 'medium', occurrences: 1, lastSeen: 'now',
      errorType: item.errorType,
      error: `Previously fixed: ${item.summary}\n  commit ${item.commit} on ${item.branch}`,
      logExcerpt: [
        '[2026-05-17 09:00:00] INFO  re-fix requested by user',
        '[2026-05-17 09:00:00] WARN  prior patch did not fully resolve issue',
      ],
      repo: item.repo, branch: item.branch,
    });
  };

  const handleDismiss = (id) => setDismissed(xs => [...xs, id]);

  const reset = () => {
    setErrorApps(seedApps);
    setFixedItems(seedFixed);
    setDismissed([]);
  };

  const envData = useMemo(() => environments.map(e => ({
    ...e,
    errors: errorApps.filter(a => a.env === e.id).length || e.errors,
  })), [errorApps]);

  return {
    errorApps, fixedItems, dismissed, modalApp,
    activeAlerts, envData,
    setModalApp, handleFixed, handleRefix, handleDismiss, reset,
  };
}
