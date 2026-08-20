import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { ChevronLeft, Activity, Users, Globe, Clock, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface VisitorLog {
  id: string;
  path: string;
  referrer: string;
  userAgent: string;
  browser: string;
  device: string;
  language: string;
  timestamp: Timestamp;
  userId: string | null;
  sessionId: string;
  screenResolution: string;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  timeSpentSeconds: number | null;
}

function flag(code: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397));
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatDuration(s: number | null): string {
  if (!s || s < 3) return '—';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function pageName(path: string): string {
  if (!path || path === '/') return 'Home';
  return path.replace(/^\//, '').replace(/-/g, ' ');
}

function DeviceIcon({ device }: { device: string }) {
  if (device === 'Mobile') return <Smartphone size={12} className="inline mr-1 opacity-60" />;
  if (device === 'Tablet') return <Tablet size={12} className="inline mr-1 opacity-60" />;
  return <Monitor size={12} className="inline mr-1 opacity-60" />;
}

export default function VisitorInsights() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setAuthLoading(false);
      if (user && user.email?.toLowerCase() === 'tshaikh92@gmail.com') {
        setIsAdmin(true);
      } else if (user) {
        navigate('/');
      } else {
        navigate('/login?redirect=/admin/visitors');
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'visitorLogs'), orderBy('timestamp', 'desc'), limit(200));
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as VisitorLog)));
      setLoading(false);
    });
    return () => unsub();
  }, [isAdmin]);

  if (authLoading) return (
    <div className="min-h-screen bg-[#07091A] flex items-center justify-center">
      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay:`${i*0.15}s` }} />
        ))}
      </div>
    </div>
  );
  if (!isAdmin) return null;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter(l => l.timestamp?.toDate() >= todayStart);
  const uniqueSessions = new Set(logs.map(l => l.sessionId)).size;
  const withTime = logs.filter(l => l.timeSpentSeconds && l.timeSpentSeconds >= 3);
  const avgTime = withTime.length
    ? Math.round(withTime.reduce((s, l) => s + (l.timeSpentSeconds ?? 0), 0) / withTime.length)
    : null;

  const topCountry = Object.entries(
    logs.reduce((acc, l) => { if (l.country) acc[l.country] = (acc[l.country] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])[0];

  const topPages = Object.entries(
    logs.reduce((acc, l) => { acc[l.path] = (acc[l.path] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const topSources = Object.entries(
    logs.reduce((acc, l) => { const r = l.referrer || 'direct'; acc[r] = (acc[r] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const maxPageCount = topPages[0]?.[1] ?? 1;

  return (
    <div className="min-h-screen bg-[#07091A] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/8 sticky top-0 z-10 backdrop-blur-md bg-[#07091A]/80">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-1.5 hover:bg-white/8 rounded-lg transition-colors text-slate-400 hover:text-white">
              <ChevronLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-violet-400" />
              <span className="font-mono text-sm font-bold text-slate-200 uppercase tracking-widest">Visitor Insights</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Visits', value: logs.length, sub: 'last 200', icon: <Activity size={14} />, color: 'violet' },
            { label: 'Unique Visitors', value: uniqueSessions, sub: 'by session', icon: <Users size={14} />, color: 'cyan' },
            { label: 'Today', value: todayLogs.length, sub: 'visits so far', icon: <Clock size={14} />, color: 'green' },
            { label: 'Avg Time', value: formatDuration(avgTime), sub: 'per visit', icon: <Clock size={14} />, color: 'amber' },
            { label: 'Top Country', value: topCountry ? `${flag(logs.find(l => l.country === topCountry[0])?.countryCode ?? null)} ${topCountry[0]}` : '—', sub: topCountry ? `${topCountry[1]} visits` : 'no data', icon: <Globe size={14} />, color: 'rose' },
          ].map(card => (
            <div key={card.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className={`flex items-center gap-1.5 mb-2 text-${card.color}-400 opacity-70`}>
                {card.icon}
                <span className="font-mono text-[9px] uppercase tracking-widest">{card.label}</span>
              </div>
              <div className="text-xl font-bold text-white leading-tight">{loading ? '—' : card.value}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent visits table */}
          <div className="lg:col-span-2 rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/6 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">Recent Activity</span>
              <span className="font-mono text-[10px] text-slate-600">{logs.length} entries</span>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-600 text-sm">Loading...</div>
              ) : logs.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-slate-600 text-sm">No visits logged yet.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-mono uppercase tracking-widest text-slate-600 border-b border-white/5">
                      <th className="px-5 py-3">When</th>
                      <th className="px-5 py-3">Page</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Device</th>
                      <th className="px-5 py-3">Source</th>
                      <th className="px-5 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => {
                      const ts = log.timestamp?.toDate?.();
                      const isNew = ts && (Date.now() - ts.getTime()) < 300000;
                      return (
                        <tr key={log.id} className={`border-b border-white/4 text-sm transition-colors ${i % 2 === 0 ? 'bg-white/[0.01]' : ''} hover:bg-violet-500/5`}>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className={`font-mono text-[11px] ${isNew ? 'text-green-400' : 'text-slate-500'}`}>
                              {ts ? timeAgo(ts) : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-slate-200 text-xs font-medium capitalize">{pageName(log.path)}</span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {log.city || log.country ? (
                              <span className="text-slate-400 text-xs">
                                {flag(log.countryCode)} {log.city ?? log.country}
                              </span>
                            ) : (
                              <span className="text-slate-700 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="text-slate-500 text-xs">
                              <DeviceIcon device={log.device ?? 'Desktop'} />
                              {log.browser ?? '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs ${log.referrer && log.referrer !== 'direct' ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                              {log.referrer || 'direct'}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="font-mono text-[11px] text-slate-500">
                              {formatDuration(log.timeSpentSeconds)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Top pages */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">Top Pages</span>
              </div>
              <div className="p-4 space-y-2">
                {topPages.length === 0 ? (
                  <p className="text-slate-600 text-xs">No data</p>
                ) : topPages.map(([path, count]) => (
                  <div key={path} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-slate-300 text-xs truncate capitalize">{pageName(path)}</span>
                        <span className="font-mono text-[10px] text-slate-500 ml-2 shrink-0">{count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500/60" style={{ width: `${(count / maxPageCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic sources */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">Traffic Sources</span>
              </div>
              <div className="p-4 space-y-2">
                {topSources.length === 0 ? (
                  <p className="text-slate-600 text-xs">No data</p>
                ) : topSources.map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between py-1 border-b border-white/4 last:border-0">
                    <span className={`text-xs ${source === 'direct' ? 'text-slate-500' : 'text-cyan-400/80'}`}>{source}</span>
                    <span className="font-mono text-[10px] text-slate-500">{count} visits</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
