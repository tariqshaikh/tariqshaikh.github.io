import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Wallet, 
  Zap, 
  ArrowRight, 
  ChevronLeft, 
  ChevronDown,
  Plus, 
  History, 
  User as UserIcon,
  LogOut,
  Target,
  BarChart3,
  ShieldCheck,
  Globe,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, logout } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc } from 'firebase/firestore';

export default function OrbitHome() {
  const [user, setUser] = useState<any>({ uid: 'guest-user' });
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<any>(null);
  const [viewType, setViewType] = useState<'individual' | 'family' | null>('family');
  const [childAccountsCount, setChildAccountsCount] = useState(0);
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [primaryName, setPrimaryName] = useState<string>("");
  const [spouseName, setSpouseName] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthReady) {
      window.scrollTo(0, 0);
    }
  }, [isAuthReady]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser({ uid: 'guest-user', displayName: 'Guest User' });
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Get app settings for view type and child accounts
    const appSettingsRef = doc(db, 'users', user.uid, 'appSettings', 'general');
    const unsubAppSettings = onSnapshot(appSettingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setViewType(data.viewType || 'family');
        setChildAccountsCount(data.childAccountsCount || 0);
        setCurrencyCode(data.currencyCode || 'USD');
        setPrimaryName(data.primaryName || '');
        setSpouseName(data.spouseName || '');
      }
    });

    // Get current net worth items
    const itemsRef = collection(db, 'users', user.uid, 'netWorthItems');
    const unsubItems = onSnapshot(itemsRef, (snapshot) => {
      const items = snapshot.docs.map(d => d.data());
      
      // Calculate net worth based on view type
      // We must strictly follow the same logic as NetWorth.tsx to avoid "phantom" values
      
      const validSectionIds = [
        'accounts',
        'individual-accounts',
        'investments',
        'retirement-1',
        'debt'
      ];
      
      // If viewType is null or 'family', we include retirement-2
      if (viewType !== 'individual') {
        validSectionIds.push('retirement-2');
      }
      
      if (childAccountsCount > 0) {
        validSectionIds.push('child-accounts');
      }
      
      const filteredItems = items.filter((item: any) => 
        item.category && validSectionIds.includes(item.category)
      );

      const assets = filteredItems.filter((i: any) => i.isAsset).reduce((acc, i: any) => acc + i.value, 0);
      const liabilities = filteredItems.filter((i: any) => !i.isAsset).reduce((acc, i: any) => acc + i.value, 0);
      setNetWorth(assets - liabilities);
    });

    // Get last snapshot
    const historyRef = query(
      collection(db, 'users', user.uid, 'netWorthHistory'), 
      orderBy('date', 'desc'), 
      limit(1)
    );
    const unsubHistory = onSnapshot(historyRef, (snapshot) => {
      if (!snapshot.empty) {
        setLastSnapshot(snapshot.docs[0].data());
      }
    });

    return () => {
      unsubAppSettings();
      unsubItems();
      unsubHistory();
    };
  }, [user, viewType, childAccountsCount]);

  const currentCurrency = useMemo(() => {
    const currencies: Record<string, string> = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$', 'INR': '₹',
      'CHF': 'Fr', 'CNY': '¥', 'HKD': 'HK$', 'NZD': 'NZ$', 'SEK': 'kr', 'KRW': '₩', 
      'SGD': 'S$', 'NOK': 'kr', 'MXN': '$', 'BRL': 'R$'
    };
    return { code: currencyCode, symbol: currencies[currencyCode] || '$' };
  }, [currencyCode]);

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C3338] font-sans">
      {/* Header */}
      <header className="border-b border-[#E8E4D0] bg-[#FAF9F6]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="p-2 hover:bg-[#E8E4D0] rounded-[2px] transition-colors group">
              <ChevronLeft size={20} className="text-[#8C8670] group-hover:text-[#2C3338]" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C5A059] rounded-[2px] flex items-center justify-center">
                <TrendingUp size={24} className="text-[#FAF9F6]" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#2C3338] italic leading-none">Orbit</h1>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A059] mt-1">Strategic Wealth Intelligence</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] transition-colors"
              >
                Settings
              </button>
              <Link to="/orbit/dashboard" className="text-[11px] font-mono uppercase tracking-widest text-[#2C3338] transition-colors">Dashboard</Link>
              
              <div className="relative group py-2">
                <button className="text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] transition-colors flex items-center gap-1">
                  Tools <ChevronDown size={12} />
                </button>
                <div className="absolute top-full right-0 w-48 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                  <button onClick={() => navigate('/orbit/balance-sheet')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Balance Sheet</button>
                  <button onClick={() => navigate('/orbit/retirement-planner')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Retirement Planner</button>
                  <button onClick={() => navigate('/orbit/simulator')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Wealth Simulator</button>
                  <button onClick={() => navigate('/orbit/history')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Historical Performance</button>
                  <button onClick={() => navigate('/orbit/currency-converter')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Currency Converter</button>
                </div>
              </div>
            </nav>
            <div className="flex flex-col items-end">
              <span className="text-[12px] font-bold text-[#2C3338]">{user.displayName}</span>
              {user.uid === 'guest-user' ? (
                <button onClick={() => navigate('/login')} className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors flex items-center gap-1">
                  <UserIcon size={10} /> Sign In
                </button>
              ) : (
                <button onClick={() => logout()} className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#C5A059] transition-colors flex items-center gap-1">
                  <LogOut size={10} /> Sign Out
                </button>
              )}
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-[2px] border border-[#E8E4D0]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] flex items-center justify-center">
                <UserIcon size={20} className="text-[#8C8670]" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-serif font-bold text-[#2C3338] italic mb-2">
            Welcome back, {primaryName || user.displayName?.split(' ')[0] || 'User'}
          </h2>
          <p className="text-[#8C8670] font-mono text-sm uppercase tracking-widest">Your strategic wealth overview</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Summary Card */}
          <div className="lg:col-span-8 space-y-8">
            <Link 
              to="/orbit/balance-sheet"
              className="block bg-[#FAF9F6] border border-[#E8E4D0] p-10 rounded-[2px] relative overflow-hidden group hover:border-[#C5A059] transition-all shadow-sm"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-[#2C3338]">
                <TrendingUp size={200} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-[#C5A059]">Current Net Worth</div>
                  <div className="text-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                    Open Balance Sheet <ArrowRight size={12} />
                  </div>
                </div>
                <div className="text-6xl font-serif font-bold text-[#2C3338] mb-6">
                  {netWorth !== null ? `${currentCurrency.symbol}${netWorth.toLocaleString()}` : '---'}
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck size={16} className="text-[#1E5C38]" />
                      <span className="text-[#8C8670]">Verified Assets</span>
                    </div>
                    {lastSnapshot && (
                      <div className="text-sm font-mono text-[#8C8670]">
                        Last Update: <span className="text-[#2C3338]">{lastSnapshot.date}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-[#8C8670] opacity-0 group-hover:opacity-100 transition-opacity max-w-sm text-right leading-relaxed">
                    Update your assets and liabilities to track your true financial position and manage ledger.
                  </div>
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link 
                to="/orbit/history"
                className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] hover:border-[#C5A059] transition-all group shadow-sm"
              >
                <div className="w-12 h-12 bg-[#C5A059]/10 rounded-[2px] flex items-center justify-center mb-6 group-hover:bg-[#C5A059]/20 transition-colors">
                  <BarChart3 size={24} className="text-[#C5A059]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2C3338] mb-2">Historical Performance</h3>
                <p className="text-sm text-[#8C8670] mb-6 leading-relaxed">Track your wealth accumulation over months, quarters, and years.</p>
                <div className="flex items-center gap-2 text-[#C5A059] font-mono text-xs uppercase tracking-widest">
                  View History <ArrowRight size={14} />
                </div>
              </Link>

              <Link 
                to="/orbit/simulator"
                className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] hover:border-[#C5A059] transition-all group shadow-sm"
              >
                <div className="w-12 h-12 bg-[#C5A059]/10 rounded-[2px] flex items-center justify-center mb-6 group-hover:bg-[#C5A059]/20 transition-colors">
                  <RefreshCw size={24} className="text-[#C5A059]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2C3338] mb-2">Annual Orbit</h3>
                <p className="text-sm text-[#8C8670] mb-6 leading-relaxed">Manage your orbiting expenses and strategic annual cash flow intelligence.</p>
                <div className="flex items-center gap-2 text-[#C5A059] font-mono text-xs uppercase tracking-widest">
                  Manage Orbit <ArrowRight size={14} />
                </div>
              </Link>

              <Link 
                to="/orbit/retirement-planner"
                className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] hover:border-[#C5A059] transition-all group relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#C5A059]/20 to-transparent rounded-bl-full" />
                <div className="w-12 h-12 bg-[#C5A059]/10 rounded-[2px] flex items-center justify-center mb-6 group-hover:bg-[#C5A059]/20 transition-colors relative z-10">
                  <Target size={24} className="text-[#C5A059]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2C3338] mb-2 relative z-10">Wealth Simulator</h3>
                <p className="text-sm text-[#8C8670] mb-6 leading-relaxed relative z-10">Comprehensive retirement modeling, cash flow projections, and scenario analysis.</p>
                <div className="flex items-center gap-2 text-[#C5A059] font-mono text-xs uppercase tracking-widest relative z-10">
                  Run Simulator <ArrowRight size={14} />
                </div>
              </Link>

              <Link 
                to="/orbit/currency-converter"
                className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] hover:border-[#C5A059] transition-all group shadow-sm"
              >
                <div className="w-12 h-12 bg-[#C5A059]/10 rounded-[2px] flex items-center justify-center mb-6 group-hover:bg-[#C5A059]/20 transition-colors">
                  <Globe size={24} className="text-[#C5A059]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2C3338] mb-2">Currency Converter</h3>
                <p className="text-sm text-[#8C8670] mb-6 leading-relaxed">Real-time global exchange rates for 15+ major currencies.</p>
                <div className="flex items-center gap-2 text-[#C5A059] font-mono text-xs uppercase tracking-widest">
                  Open Converter <ArrowRight size={14} />
                </div>
              </Link>

              <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] opacity-60 grayscale-[0.5] transition-all relative overflow-hidden shadow-sm">
                <div className="absolute top-4 right-4 bg-[#E8E4D0] text-[#8C8670] px-3 py-1 text-[9px] font-mono uppercase tracking-widest rounded-[2px]">
                  Coming Soon
                </div>
                <div className="w-12 h-12 bg-[#E8E4D0] rounded-[2px] flex items-center justify-center mb-6">
                  <Wallet size={24} className="text-[#8C8670]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#8C8670] mb-2">Statement Analyzer</h3>
                <p className="text-sm text-[#8C8670] mb-4 leading-relaxed">Upload your debit and credit card statements to get granular insights into your monthly spending and usage patterns.</p>
                <button disabled className="w-full py-3 bg-[#E8E4D0] text-[#8C8670] font-mono text-xs uppercase tracking-widest font-bold rounded-[2px] cursor-not-allowed flex items-center justify-center gap-2 mt-4">
                  <Plus size={14} /> Upload Statement
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: Quick Actions & Insights */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] shadow-sm">
              <h3 className="font-serif text-lg font-bold text-[#2C3338] mb-6 flex items-center gap-3 italic">
                <Zap size={18} className="text-[#C5A059]" />
                Strategic Nudges
              </h3>
              <div className="space-y-6">
                <div className="p-4 bg-[#FAF9F6] border-l-2 border-[#C5A059] shadow-sm">
                  <p className="text-xs text-[#8C8670] uppercase tracking-widest font-mono mb-2">Optimization</p>
                  <p className="text-sm text-[#2C3338] leading-relaxed">Your cash-to-asset ratio is high. Consider moving $5k to your brokerage for better yield.</p>
                </div>
                <div className="p-4 bg-[#FAF9F6] border-l-2 border-[#8C8670] shadow-sm">
                  <p className="text-xs text-[#8C8670] uppercase tracking-widest font-mono mb-2">Reminder</p>
                  <p className="text-sm text-[#2C3338] leading-relaxed">It's been 22 days since your last balance sheet audit. Keep your data fresh.</p>
                </div>
              </div>
            </section>

            <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] shadow-sm">
              <h3 className="font-serif text-lg font-bold text-[#2C3338] mb-6 flex items-center gap-3 italic">
                <BarChart3 size={18} className="text-[#C5A059]" />
                Wealth Velocity
              </h3>
              <div className="flex items-center justify-center py-10 border border-dashed border-[#E8E4D0] rounded-[2px]">
                <p className="text-xs font-mono text-[#8C8670] uppercase tracking-widest">Chart data pending...</p>
              </div>
              <p className="text-[10px] text-[#8C8670] mt-4 italic text-center">Velocity is calculated after your second monthly snapshot.</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E8E4D0] py-12 mt-20 opacity-50">
        <div className="max-w-7xl mx-auto px-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C8670]">
          Orbit Strategic Intelligence — v1.0.5
        </div>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-[#2C3338]/80 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] w-full max-w-md relative z-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif font-bold text-[#2C3338] italic mb-6">Profile Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Primary Name</label>
                <input 
                  type="text" 
                  value={primaryName}
                  onChange={(e) => setPrimaryName(e.target.value)}
                  placeholder={user.displayName || "Your Name"}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Spouse / Partner Name</label>
                <input 
                  type="text" 
                  value={spouseName}
                  onChange={(e) => setSpouseName(e.target.value)}
                  placeholder="Spouse Name"
                  className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-[#8C8670] mt-2 italic">If left blank, we'll refer to them as "Spouse" or "the right person".</p>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={async () => {
                    if (user.uid !== 'guest-user') {
                      await setDoc(doc(db, 'users', user.uid, 'appSettings', 'general'), {
                        primaryName,
                        spouseName
                      }, { merge: true });
                    }
                    setIsSettingsOpen(false);
                  }}
                  className="flex-1 py-3 bg-[#C5A059] text-[#FAF9F6] font-mono text-xs uppercase tracking-widest font-bold rounded-[2px] hover:bg-[#B38F48] transition-colors"
                >
                  Save Settings
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-3 bg-transparent border border-[#E8E4D0] text-[#8C8670] font-mono text-xs uppercase tracking-widest font-bold rounded-[2px] hover:text-[#2C3338] hover:border-[#8C8670] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
