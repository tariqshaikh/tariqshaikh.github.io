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
      setUser(u);
      setIsAuthReady(true);
      if (!u && isAuthReady) navigate('/orbit');
    });
    return () => unsubscribe();
  }, [navigate, isAuthReady]);

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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#D1D1D1] font-sans">
      {/* Header */}
      <header className="border-b border-[#333333] bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/orbit/dashboard" className="p-2 hover:bg-[#1A1A1A] rounded-[2px] transition-colors group">
              <ChevronLeft size={20} className="text-[#6E8A96] group-hover:text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C5A059] rounded-[2px] flex items-center justify-center">
                <TrendingUp size={24} className="text-[#0A0A0A]" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-white italic leading-none">Orbit</h1>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A059] mt-1">Currency Converter</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <Link to="/orbit/dashboard" className="text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white transition-colors">Dashboard</Link>
              
              <div className="relative group py-2">
                <button className="text-[11px] font-mono uppercase tracking-widest text-white transition-colors flex items-center gap-1">
                  Tools <ChevronDown size={12} />
                </button>
                <div className="absolute top-full right-0 w-48 bg-[#1A1A1A] border border-[#333333] rounded-[2px] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                  <Link to="/orbit/balance-sheet" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left">Balance Sheet</Link>
                  <div className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#4B5563] cursor-not-allowed opacity-50">Retirement Planner</div>
                  <Link to="/orbit/simulator" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left">Wealth Simulator</Link>
                  <Link to="/orbit/history" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left">Historical Performance</Link>
                  <Link to="/orbit/currency-converter" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-white bg-[#333333] transition-colors text-left">Currency Converter</Link>
                </div>
              </div>
            </nav>
            <div className="flex flex-col items-end">
              <span className="text-[12px] font-bold text-white">{user.displayName}</span>
              <button onClick={() => logout()} className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-[#C5A059] transition-colors flex items-center gap-1">
                <LogOut size={10} /> Sign Out
              </button>
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-[2px] border border-[#333333]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 bg-[#1A1A1A] border border-[#333333] rounded-[2px] flex items-center justify-center">
                <UserIcon size={20} className="text-[#6E8A96]" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-serif font-bold text-white italic mb-2">Currency Converter</h2>
          <p className="text-[#6E8A96] font-mono text-sm uppercase tracking-widest">Real-time global exchange rates</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#333333] p-10 rounded-[2px] shadow-xl">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-mono text-[#6E8A96] uppercase tracking-widest">Amount</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#0A0A0A] border border-[#333333] p-4 rounded-[2px] text-white font-mono text-lg focus:outline-none focus:border-[#C5A059] transition-colors"
                placeholder="Enter amount..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="space-y-3">
                <label className="text-[11px] font-mono text-[#6E8A96] uppercase tracking-widest">From</label>
                <input
                  list="currencies-from-page"
                  value={from}
                  onChange={(e) => setFrom(e.target.value.toUpperCase())}
                  className="w-full bg-[#0A0A0A] border border-[#333333] p-4 rounded-[2px] text-white font-mono text-lg focus:outline-none focus:border-[#C5A059] transition-colors uppercase"
                  placeholder="USD"
                />
                <datalist id="currencies-from-page">
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </datalist>
              </div>
              
              <div className="space-y-3">
                <label className="text-[11px] font-mono text-[#6E8A96] uppercase tracking-widest">To</label>
                <input
                  list="currencies-to-page"
                  value={to}
                  onChange={(e) => setTo(e.target.value.toUpperCase())}
                  className="w-full bg-[#0A0A0A] border border-[#333333] p-4 rounded-[2px] text-white font-mono text-lg focus:outline-none focus:border-[#C5A059] transition-colors uppercase"
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
                className="absolute left-1/2 top-[42px] -translate-x-1/2 w-10 h-10 bg-[#1A1A1A] border border-[#333333] rounded-full flex items-center justify-center text-[#C5A059] hover:border-[#C5A059] hover:bg-[#C5A059]/10 transition-all z-10 hidden md:flex"
                title="Swap Currencies"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            
            <div className="p-8 bg-[#0A0A0A] border border-[#333333] rounded-[2px] mt-8 text-center">
              <div className="text-[11px] font-mono text-[#6E8A96] uppercase tracking-widest mb-3">Converted Amount</div>
              <div className="text-5xl font-serif font-bold text-white italic">
                {loading ? '...' : `${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`}
              </div>
              <div className="text-xs text-[#6E8A96] mt-4 font-mono">
                1 {from} = {rates[from] && rates[to] ? (rates[to] / rates[from]).toFixed(4) : '...'} {to}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
