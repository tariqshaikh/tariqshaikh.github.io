import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronDown,
  TrendingUp, 
  Calendar, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  auth, 
  db,
  logout
} from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface HistorySnapshot {
  id: string;
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export default function NetWorthHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [view, setView] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser({ uid: 'guest-user', displayName: 'Guest User' });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const historyRef = query(
      collection(db, 'users', user.uid, 'netWorthHistory'), 
      orderBy('date', 'asc')
    );
    
    const unsub = onSnapshot(historyRef, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HistorySnapshot)));
    });

    return () => unsub();
  }, [user]);

  const filteredData = useMemo(() => {
    if (history.length === 0) return [];

    if (view === 'monthly') {
      // Group by month, take the last snapshot of each month
      const months: { [key: string]: HistorySnapshot } = {};
      history.forEach(s => {
        const monthKey = s.date.substring(0, 7); // YYYY-MM
        months[monthKey] = s;
      });
      return Object.values(months);
    }

    if (view === 'quarterly') {
      // Group by quarter
      const quarters: { [key: string]: HistorySnapshot } = {};
      history.forEach(s => {
        const date = new Date(s.date);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const quarterKey = `${date.getFullYear()}-Q${quarter}`;
        quarters[quarterKey] = s;
      });
      return Object.values(quarters);
    }

    if (view === 'yearly') {
      // Group by year
      const years: { [key: string]: HistorySnapshot } = {};
      history.forEach(s => {
        const yearKey = s.date.substring(0, 4); // YYYY
        years[yearKey] = s;
      });
      return Object.values(years);
    }

    return history;
  }, [history, view]);

  const stats = useMemo(() => {
    if (filteredData.length < 2) return { change: 0, percent: 0 };
    const latest = filteredData[filteredData.length - 1].netWorth;
    const previous = filteredData[filteredData.length - 2].netWorth;
    const change = latest - previous;
    const percent = (change / previous) * 100;
    return { change, percent };
  }, [filteredData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1C1E] font-sans">
      <header className="border-b border-[#EEEEEE] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/orbit/dashboard" className="p-2 hover:bg-[#F8F9FA] rounded-[2px] transition-colors group">
              <ChevronLeft size={18} className="text-[#6E8A96] group-hover:text-[#1A1C1E]" />
            </Link>
            <h1 className="text-xl font-serif font-bold text-[#1A1C1E]">Historical Performance</h1>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <Link to="/orbit/dashboard" className="text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-[#1A1C1E] transition-colors">Dashboard</Link>
              
              <div className="relative group py-2">
                <button className="text-[11px] font-mono uppercase tracking-widest text-[#1A1C1E] transition-colors flex items-center gap-1">
                  Tools <ChevronDown size={12} />
                </button>
                <div className="absolute top-full right-0 w-48 bg-white border border-[#EEEEEE] rounded-[2px] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                  <button onClick={() => navigate('/orbit/balance-sheet')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-[#1A1C1E] hover:bg-[#F8F9FA] transition-colors text-left w-full">Balance Sheet</button>
                  <button onClick={() => navigate('/orbit/retirement-planner')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-[#1A1C1E] hover:bg-[#F8F9FA] transition-colors text-left w-full opacity-50 cursor-not-allowed" disabled>Retirement Planner</button>
                  <button onClick={() => navigate('/orbit/simulator')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-[#1A1C1E] hover:bg-[#F8F9FA] transition-colors text-left w-full">Wealth Simulator</button>
                  <button onClick={() => navigate('/orbit/history')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#1A1C1E] bg-[#F8F9FA] transition-colors text-left w-full">Historical Performance</button>
                  <button onClick={() => navigate('/orbit/currency-converter')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-[#1A1C1E] hover:bg-[#F8F9FA] transition-colors text-left w-full">Currency Converter</button>
                </div>
              </div>
            </nav>
            <div className="flex bg-[#F8F9FA] border border-[#EEEEEE] p-1 rounded-[2px]">
              {(['monthly', 'quarterly', 'yearly'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all rounded-[1px] ${
                    view === v ? 'bg-[#1A1C1E] text-white font-bold' : 'text-[#6E8A96] hover:text-[#1A1C1E]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            
            <div className="h-6 w-px bg-[#EEEEEE] mx-2" />
            
            {user?.uid === 'guest-user' ? (
              <button onClick={() => navigate('/login')} className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#1A1C1E] transition-colors flex items-center gap-1">
                <UserIcon size={14} /> Sign In
              </button>
            ) : (
              <button onClick={() => logout()} className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-[#8B0000] transition-colors flex items-center gap-1">
                <LogOut size={14} /> Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-[#EEEEEE] p-6 rounded-[2px] shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Current Net Worth</div>
            <div className="text-3xl font-serif font-bold">
              {history.length > 0 ? formatCurrency(history[history.length - 1].netWorth) : '$0'}
            </div>
          </div>
          <div className="bg-white border border-[#EEEEEE] p-6 rounded-[2px] shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Period Change</div>
            <div className={`text-3xl font-serif font-bold flex items-center gap-2 ${stats.change >= 0 ? 'text-[#1E5C38]' : 'text-[#8B0000]'}`}>
              {stats.change >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
              {formatCurrency(Math.abs(stats.change))}
            </div>
          </div>
          <div className="bg-white border border-[#EEEEEE] p-6 rounded-[2px] shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Growth Rate</div>
            <div className={`text-3xl font-serif font-bold ${stats.percent >= 0 ? 'text-[#1E5C38]' : 'text-[#8B0000]'}`}>
              {stats.percent >= 0 ? '+' : ''}{stats.percent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white border border-[#EEEEEE] p-8 rounded-[2px] shadow-sm mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-serif font-bold">Net Worth Growth</h2>
              <p className="text-xs text-[#6E8A96] italic">Visualizing your wealth accumulation over time</p>
            </div>
            <button className="p-2 hover:bg-[#F8F9FA] rounded-[2px] text-[#6E8A96] transition-colors">
              <Download size={18} />
            </button>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6E8A96', fontFamily: 'monospace' }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return view === 'yearly' ? d.getFullYear().toString() : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6E8A96', fontFamily: 'monospace' }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1C1E', border: 'none', borderRadius: '2px', color: 'white', fontSize: '12px' }}
                  itemStyle={{ color: '#C5A059' }}
                  formatter={(val: number) => [formatCurrency(val), 'Net Worth']}
                />
                <Area 
                  type="monotone" 
                  dataKey="netWorth" 
                  stroke="#C5A059" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorNetWorth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white border border-[#EEEEEE] rounded-[2px] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#EEEEEE] bg-[#F8F9FA]">
            <h3 className="text-sm font-mono uppercase tracking-widest font-bold">Snapshot Ledger</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EEEEEE]">
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[#6E8A96]">Date</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[#6E8A96]">Total Assets</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[#6E8A96]">Total Liabilities</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[#6E8A96] text-right">Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {[...filteredData].reverse().map((s) => (
                <tr key={s.id} className="hover:bg-[#FDFDFD] transition-colors group">
                  <td className="px-6 py-4 text-xs font-medium text-[#1A1C1E]">
                    {new Date(s.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-xs text-[#1E5C38] font-medium">
                    {formatCurrency(s.totalAssets)}
                  </td>
                  <td className="px-6 py-4 text-xs text-[#8B0000] font-medium">
                    {formatCurrency(s.totalLiabilities)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-serif font-bold text-[#1A1C1E]">
                      {formatCurrency(s.netWorth)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-[#6E8A96] italic text-sm">
                    No snapshots recorded yet. Save your first balance sheet to start tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="py-12 text-center opacity-30">
        <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#6E8A96]">
          Orbit Historical Analysis Engine
        </div>
      </footer>
    </div>
  );
}
