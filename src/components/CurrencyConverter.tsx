import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronDown, RefreshCw, TrendingUp, LogOut, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, logout } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function CurrencyConverter() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [amount, setAmount] = useState<number>(1000);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
  }, [navigate]);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        setRates(data.rates);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const converted = useMemo(() => {
    if (!rates[from] || !rates[to]) return 0;
    const inUsd = amount / rates[from];
    return inUsd * rates[to];
  }, [amount, from, to, rates]);

  const currencies = [
    { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
    { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
    { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
    { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
    { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
    { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
    { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
    { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc' },
    { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan' },
    { code: 'HKD', flag: '🇭🇰', name: 'Hong Kong Dollar' },
    { code: 'NZD', flag: '🇳🇿', name: 'New Zealand Dollar' },
    { code: 'SEK', flag: '🇸🇪', name: 'Swedish Krona' },
    { code: 'KRW', flag: '🇰🇷', name: 'South Korean Won' },
    { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
    { code: 'NOK', flag: '🇳🇴', name: 'Norwegian Krone' },
    { code: 'MXN', flag: '🇲🇽', name: 'Mexican Peso' },
    { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real' },
  ];

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C3338] font-sans selection:bg-[#C5A059]/30">
      {/* Header */}
      <header className="border-b border-[#E8E4D0] bg-[#FAF9F6]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/orbit/dashboard" className="p-2 hover:bg-[#E8E4D0] rounded-[2px] transition-colors group">
              <ChevronLeft size={20} className="text-[#8C8670] group-hover:text-[#2C3338]" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C5A059] rounded-[2px] flex items-center justify-center">
                <TrendingUp size={24} className="text-[#FAF9F6]" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#2C3338] italic leading-none">Orbit</h1>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A059] mt-1">Currency Converter</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <Link to="/orbit/dashboard" className="text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] transition-colors">Dashboard</Link>
              
              <div className="relative group py-2">
                <button className="text-[11px] font-mono uppercase tracking-widest text-[#2C3338] transition-colors flex items-center gap-1">
                  Tools <ChevronDown size={12} />
                </button>
                <div className="absolute top-full right-0 w-48 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                  <button onClick={() => navigate('/orbit/balance-sheet')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Balance Sheet</button>
                  <button onClick={() => navigate('/orbit/retirement-planner')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Retirement Planner</button>
                  <button onClick={() => navigate('/orbit/simulator')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Wealth Simulator</button>
                  <button onClick={() => navigate('/orbit/history')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Historical Performance</button>
                  <button onClick={() => navigate('/orbit/currency-converter')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#2C3338] bg-[#E8E4D0] transition-colors text-left w-full">Currency Converter</button>
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

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-serif font-bold text-[#2C3338] italic mb-2">Currency Converter</h2>
          <p className="text-[#8C8670] font-mono text-sm uppercase tracking-widest">Real-time global exchange rates</p>
        </div>

        <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-10 rounded-[2px] shadow-xl">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-mono text-[#8C8670] uppercase tracking-widest">Amount</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-[2px] text-[#2C3338] font-mono text-lg focus:outline-none focus:border-[#C5A059] transition-colors"
                placeholder="Enter amount..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="space-y-3">
                <label className="text-[11px] font-mono text-[#8C8670] uppercase tracking-widest">From</label>
                <input
                  list="currencies-from-page"
                  value={from}
                  onChange={(e) => setFrom(e.target.value.toUpperCase())}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-[2px] text-[#2C3338] font-mono text-lg focus:outline-none focus:border-[#C5A059] transition-colors uppercase"
                  placeholder="USD"
                />
                <datalist id="currencies-from-page">
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </datalist>
              </div>
              
              <div className="space-y-3">
                <label className="text-[11px] font-mono text-[#8C8670] uppercase tracking-widest">To</label>
                <input
                  list="currencies-to-page"
                  value={to}
                  onChange={(e) => setTo(e.target.value.toUpperCase())}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-[2px] text-[#2C3338] font-mono text-lg focus:outline-none focus:border-[#C5A059] transition-colors uppercase"
                  placeholder="EUR"
                />
                <datalist id="currencies-to-page">
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </datalist>
              </div>
              
              <button 
                onClick={() => {
                  const temp = from;
                  setFrom(to);
                  setTo(temp);
                }}
                className="absolute left-1/2 top-[42px] -translate-x-1/2 w-10 h-10 bg-[#FAF9F6] border border-[#E8E4D0] rounded-full flex items-center justify-center text-[#C5A059] hover:border-[#C5A059] hover:bg-[#C5A059]/10 transition-all z-10 hidden md:flex"
                title="Swap Currencies"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="p-8 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] mt-8 text-center">
              <div className="text-[11px] font-mono text-[#8C8670] uppercase tracking-widest mb-3">Converted Amount</div>
              <div className="text-5xl font-serif font-bold text-[#2C3338] italic">
                {loading ? '...' : `${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`}
              </div>
              <div className="text-xs text-[#8C8670] mt-4 font-mono">
                1 {from} = {rates[from] && rates[to] ? (rates[to] / rates[from]).toFixed(4) : '...'} {to}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
