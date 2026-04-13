import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { ChevronLeft, Users, Globe, Clock, Monitor } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

interface VisitorLog {
  id: string;
  path: string;
  referrer: string;
  userAgent: string;
  timestamp: Timestamp;
  userId: string | null;
  sessionId: string;
  screenResolution: string;
}

export default function VisitorInsights() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email === 'TShaikh92@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        if (user) navigate('/'); // Not admin, redirect
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const logsRef = collection(db, 'visitorLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VisitorLog[];
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">Restricted Access</h1>
          <p className="text-slate-500 mb-6">Only the administrator can view visitor insights.</p>
          <Link to="/" className="text-blue-600 font-medium hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  const stats = {
    total: logs.length,
    uniqueSessions: new Set(logs.map(l => l.sessionId)).size,
    topPages: Object.entries(logs.reduce((acc, log) => {
      acc[log.path] = (acc[log.path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5)
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-xl font-serif font-bold">Visitor Insights</h1>
          </div>
          <div className="text-sm font-mono text-slate-400 uppercase tracking-widest">Admin Only</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <Users size={20} />
              <span className="text-xs font-mono uppercase tracking-widest font-bold">Total Visits</span>
            </div>
            <div className="text-3xl font-serif font-bold">{stats.total}</div>
            <p className="text-xs text-slate-400 mt-1">Last 100 entries</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-green-600 mb-2">
              <Globe size={20} />
              <span className="text-xs font-mono uppercase tracking-widest font-bold">Unique Sessions</span>
            </div>
            <div className="text-3xl font-serif font-bold">{stats.uniqueSessions}</div>
            <p className="text-xs text-slate-400 mt-1">Based on session IDs</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-purple-600 mb-2">
              <Monitor size={20} />
              <span className="text-xs font-mono uppercase tracking-widest font-bold">Top Page</span>
            </div>
            <div className="text-3xl font-serif font-bold">{stats.topPages[0]?.[0] || 'N/A'}</div>
            <p className="text-xs text-slate-400 mt-1">{stats.topPages[0]?.[1] || 0} visits</p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="font-serif font-bold">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Page</th>
                  <th className="px-6 py-4">Referrer</th>
                  <th className="px-6 py-4">Device / UA</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Loading logs...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No logs found yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {log.timestamp?.toDate().toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{log.path}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]" title={log.referrer}>
                        {log.referrer}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[300px]" title={log.userAgent}>
                        {log.userAgent}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
