import { useEffect, useState } from 'react';
import client from '../api/client';
import './Topbar.css';

export default function Topbar({ title, subtitle }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'live' | 'offline'

  useEffect(() => {
    let cancelled = false;

    const ping = () => {
      // Lightweight check against a real endpoint to confirm the API is reachable.
      client.get('/Products')
        .then(() => { if (!cancelled) setStatus('live'); })
        .catch(() => { if (!cancelled) setStatus('offline'); });
    };

    ping();
    const interval = setInterval(ping, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="topbar-sub">{subtitle}</p>}
      </div>
      <span className={`status-pill status-${status}`}>
        <span className="status-dot" />
        {status === 'checking' ? 'Connecting' : status === 'live' ? 'Live' : 'Offline'}
      </span>
    </header>
  );
}
