import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  User as UserIcon,
  MoreVertical,
  Trash2,
  Plus,
  X,
  Maximize2,
  Minimize2
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
  logout,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp
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
  const [view, setView] = useState<'1m' | '3m' | '6m' | '1y' | '5y' | 'all' | 'ytd'>('all');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showManualSuccess, setShowManualSuccess] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAssets, setManualAssets] = useState('0');
  const [manualLiabilities, setManualLiabilities] = useState('0');
  const [isMaximized, setIsMaximized] = useState(false);

  const deleteSnapshot = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'netWorthHistory', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `netWorthHistory/${id}`);
    }
  };

  const handleManualEntry = async () => {
    if (!user) return;
    
    const assets = Number(manualAssets.replace(/[^0-9.-]+/g, ""));
    const liabilities = Number(manualLiabilities.replace(/[^0-9.-]+/g, ""));

    try {
      // Use date as ID to match NetWorth.tsx and prevent duplicates for the same day
      const id = manualDate;
      await setDoc(doc(db, 'users', user.uid, 'netWorthHistory', id), {
        userId: user.uid,
        date: manualDate,
        totalAssets: assets,
        totalLiabilities: liabilities,
        netWorth: assets - liabilities,
        updatedAt: serverTimestamp()
      });
      setShowManualEntry(false);
      setShowManualSuccess(true);
      setTimeout(() => setShowManualSuccess(false), 3000);
      setManualAssets('0');
      setManualLiabilities('0');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'netWorthHistory');
    }
  };

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
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HistorySnapshot));
      // Ensure data is sorted by date ascending for the graph and stats
      const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
      setHistory(sortedData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'netWorthHistory');
    });

    return () => unsub();
  }, [user]);

  const filteredData = useMemo(() => {
    if (history.length === 0) return [];

    const now = new Date();
    let startDate = new Date(0); // Default to all time

    if (view === '1m') startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    else if (view === '3m') startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    else if (view === '6m') startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    else if (view === '1y') startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    else if (view === '5y') startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    else if (view === 'ytd') startDate = new Date(now.getFullYear(), 0, 1);

    return history.filter(s => new Date(s.date) >= startDate);
  }, [history, view]);

  const stats = useMemo(() => {
    if (filteredData.length < 2) return { change: 0, percent: 0 };
    const latest = filteredData[filteredData.length - 1].netWorth;
    const first = filteredData[0].netWorth;
    const change = latest - first;
    
    let percent = 0;
    if (first === 0) {
      percent = latest > 0 ? 100 : (latest < 0 ? -100 : 0);
    } else {
      percent = (change / Math.abs(first)) * 100;
    }
    
    return { change, percent };
  }, [filteredData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C3338] font-sans">
      {/* Manual Entry Success Toast */}
      <AnimatePresence>
        {showManualSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[100] bg-[#2C3338] text-[#FAF9F6] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#E8E4D0]"
          >
            <div className="w-2 h-2 bg-[#C5A059] rounded-full animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest">Manual Entry Recorded</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="border-b border-[#E8E4D0] bg-[#FAF9F6]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/orbit/dashboard" className="p-2 hover:bg-[#E8E4D0] rounded-xl transition-colors group">
              <ChevronLeft size={18} className="text-[#8C8670] group-hover:text-[#2C3338]" />
            </Link>
            <h1 className="text-xl font-serif font-bold text-[#2C3338]">Historical Performance</h1>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <Link to="/orbit/dashboard" className="text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] transition-colors">Dashboard</Link>
              
              <div className="relative group py-2">
                <button className="text-[11px] font-mono uppercase tracking-widest text-[#2C3338] transition-colors flex items-center gap-1">
                  Tools <ChevronDown size={12} />
                </button>
                <div className="absolute top-full right-0 w-48 bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                  <button onClick={() => navigate('/orbit')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Annual Orbit</button>
                  <button onClick={() => navigate('/orbit/currency-converter')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Currency Converter</button>
                  <div className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-[#8C8670]/50 border-t border-[#E8E4D0] mt-1 pt-3">Future Modules (TBD)</div>
                  <button className="px-4 py-1 text-[11px] font-mono uppercase tracking-widest text-[#8C8670]/40 cursor-not-allowed text-left w-full">Wealth Simulator</button>
                  <button className="px-4 py-1 text-[11px] font-mono uppercase tracking-widest text-[#8C8670]/40 cursor-not-allowed text-left w-full">Balance Sheet</button>
                </div>
              </div>
            </nav>
            
            <div className="h-6 w-px bg-[#E8E4D0] mx-2" />
            
            {user?.uid === 'guest-user' ? (
              <button onClick={() => navigate('/login')} className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors flex items-center gap-1">
                <UserIcon size={14} /> Sign In
              </button>
            ) : (
              <button onClick={() => logout()} className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#8B0000] transition-colors flex items-center gap-1">
                <LogOut size={14} /> Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Time Period Filters - Centered above stats */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-[#FAF9F6] border border-[#E8E4D0] p-1 rounded-xl shadow-sm">
            {(['1m', '3m', '6m', '1y', '5y', 'all', 'ytd'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-5 py-2 text-[10px] font-mono uppercase tracking-widest transition-all rounded-lg ${
                  view === v ? 'bg-[#2C3338] text-[#FAF9F6] font-bold' : 'text-[#8C8670] hover:text-[#2C3338]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-xl shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Current Net Worth</div>
            <div className="text-3xl font-serif font-bold text-[#2C3338]">
              {history.length > 0 ? formatCurrency(history[history.length - 1].netWorth) : '$0'}
            </div>
          </div>
          <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-xl shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Period Change</div>
            <div className={`text-3xl font-serif font-bold flex items-center gap-2 ${stats.change >= 0 ? 'text-[#1E5C38]' : 'text-[#8B0000]'}`}>
              {stats.change >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
              {formatCurrency(Math.abs(stats.change))}
            </div>
          </div>
          <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-xl shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Growth Rate</div>
            <div className={`text-3xl font-serif font-bold ${stats.percent >= 0 ? 'text-[#1E5C38]' : 'text-[#8B0000]'}`}>
              {stats.percent >= 0 ? '+' : ''}{stats.percent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`grid gap-6 ${isMaximized ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
          {/* Chart Section */}
          <div className={`bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-xl shadow-sm ${isMaximized ? 'mb-6' : ''}`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#2C3338]">Net Worth Growth</h2>
                <p className="text-xs text-[#8C8670] italic">Visualizing your wealth accumulation over time</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 hover:bg-[#E8E4D0] rounded-xl text-[#8C8670] transition-colors flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest"
                >
                  {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  {isMaximized ? 'Minimize' : 'Maximize'}
                </button>
                <button className="p-2 hover:bg-[#E8E4D0] rounded-xl text-[#8C8670] transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
            
            <div className={`${isMaximized ? 'h-[500px]' : 'h-[400px]'} w-full`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData}>
                  <defs>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4D0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#8C8670', fontFamily: 'monospace' }}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      if (view === '1y' || view === '5y' || view === 'all') {
                        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#8C8670', fontFamily: 'monospace' }}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#2C3338', border: 'none', borderRadius: '12px', color: '#FAF9F6', fontSize: '12px' }}
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
                    dot={{ r: 4, fill: '#C5A059', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-[#E8E4D0] bg-[#E8E4D0]/30 flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-widest font-bold text-[#2C3338]">Snapshot Ledger</h3>
            </div>
            <div className="overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E4D0]">
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[#8C8670]">Date</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[#8C8670]">Total Assets</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[#8C8670]">Total Liabilities</th>
                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-[#8C8670] text-right">Net Worth</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4D0]">
                  {[...filteredData].reverse().map((s) => (
                    <tr key={s.id} className="hover:bg-[#E8E4D0]/10 transition-colors group">
                      <td className="px-6 py-4 text-xs font-medium text-[#2C3338]">
                        {new Date(s.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#1E5C38] font-medium">
                        {formatCurrency(s.totalAssets)}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#8B0000] font-medium">
                        {formatCurrency(s.totalLiabilities)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-serif font-bold text-[#2C3338]">
                          {formatCurrency(s.netWorth)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative group/menu">
                          <button className="p-1 hover:bg-[#E8E4D0] rounded-xl text-[#8C8670] transition-colors">
                            <MoreVertical size={14} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-[100]">
                            <button 
                              onClick={() => deleteSnapshot(s.id)}
                              className="w-full text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#8B0000] hover:bg-[#E8E4D0] transition-colors flex items-center gap-2"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-[#8C8670] italic text-sm">
                        No snapshots recorded yet. Save your first balance sheet to start tracking.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E8E4D0] bg-[#FAF9F6]">
              <button 
                onClick={() => setShowManualEntry(true)}
                className="w-full text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors flex items-center justify-center gap-2 py-3 border border-dashed border-[#E8E4D0] rounded-xl bg-[#FAF9F6] hover:bg-[#E8E4D0]/20"
              >
                <Plus size={14} /> Add Manual Entry
              </button>
            </div>
          </div>
        </div>

        {/* Manual Entry Modal */}
        {showManualEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#FAF9F6] w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-[#E8E4D0]"
            >
              <div className="px-6 py-4 border-b border-[#E8E4D0] flex items-center justify-between bg-[#E8E4D0]/30">
                <h3 className="text-sm font-mono uppercase tracking-widest font-bold text-[#2C3338]">Add Historical Entry</h3>
                <button onClick={() => setShowManualEntry(false)} className="text-[#8C8670] hover:text-[#2C3338]">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-1">Date</label>
                  <input 
                    type="date" 
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4D0] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C5A059] transition-colors text-[#2C3338]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-1">Total Assets</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8670] text-xs font-mono">$</span>
                    <input 
                      type="text" 
                      value={manualAssets}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9,]/g, '');
                        if (val === '') {
                          setManualAssets('0');
                        } else {
                          const numeric = Number(val.replace(/,/g, ''));
                          if (!isNaN(numeric)) {
                            setManualAssets(new Intl.NumberFormat('en-US').format(numeric));
                          }
                        }
                      }}
                      className="w-full bg-[#FAF9F6] border border-[#E8E4D0] pl-7 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C5A059] transition-colors text-[#2C3338]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-1">Total Liabilities</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8670] text-xs font-mono">$</span>
                    <input 
                      type="text" 
                      value={manualLiabilities}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9,]/g, '');
                        if (val === '') {
                          setManualLiabilities('0');
                        } else {
                          const numeric = Number(val.replace(/,/g, ''));
                          if (!isNaN(numeric)) {
                            setManualLiabilities(new Intl.NumberFormat('en-US').format(numeric));
                          }
                        }
                      }}
                      className="w-full bg-[#FAF9F6] border border-[#E8E4D0] pl-7 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C5A059] transition-colors text-[#2C3338]"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-[#E8E4D0]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">Resulting Net Worth</span>
                    <span className="text-lg font-serif font-bold text-[#2C3338]">
                      {formatCurrency(Number(manualAssets.replace(/,/g, '')) - Number(manualLiabilities.replace(/,/g, '')))}
                    </span>
                  </div>
                  <button 
                    onClick={handleManualEntry}
                    className="w-full bg-[#2C3338] text-[#FAF9F6] py-3 rounded-xl text-[11px] font-mono uppercase tracking-widest hover:bg-[#3C4348] transition-all shadow-md"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <footer className="py-12 text-center opacity-30">
        <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#8C8670]">
          Orbit Historical Analysis Engine
        </div>
      </footer>
    </div>
  );
}
