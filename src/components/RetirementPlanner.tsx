import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronDown, TrendingUp, LogOut, User as UserIcon, Calculator, ArrowRight, ShieldCheck, PieChart, Activity, DollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, logout } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function RetirementPlanner() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser({ uid: 'guest-user', displayName: 'Guest User' } as any);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [navigate]);

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
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A059] mt-1">Retirement Planner</p>
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
                  <button onClick={() => navigate('/orbit/balance-sheet')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left w-full">Balance Sheet</button>
                  <button onClick={() => navigate('/orbit/retirement-planner')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-white bg-[#333333] transition-colors text-left w-full">Retirement Planner</button>
                  <button onClick={() => navigate('/orbit/simulator')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left w-full">Wealth Simulator</button>
                  <button onClick={() => navigate('/orbit/history')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left w-full">Historical Performance</button>
                  <button onClick={() => navigate('/orbit/currency-converter')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left w-full">Currency Converter</button>
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

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-serif font-bold text-white italic mb-2">Retirement Intelligence</h2>
          <p className="text-[#6E8A96] font-mono text-sm uppercase tracking-widest">Comprehensive cash flow modeling and scenario analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Core Inputs Section */}
            <section className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px]">
              <div className="flex items-center gap-3 mb-8">
                <Calculator className="text-[#C5A059]" size={24} />
                <h3 className="text-2xl font-serif font-bold text-white">Core Assumptions</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Current Age</label>
                    <input type="number" defaultValue={35} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Target Retirement Age</label>
                    <input type="number" defaultValue={65} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Life Expectancy</label>
                    <input type="number" defaultValue={95} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Expected Inflation Rate (%)</label>
                    <input type="number" step="0.1" defaultValue={3.0} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Pre-Retirement Return (%)</label>
                    <input type="number" step="0.1" defaultValue={7.0} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Post-Retirement Return (%)</label>
                    <input type="number" step="0.1" defaultValue={5.0} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>
            </section>

            {/* Income & Expenses Section */}
            <section className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px]">
              <div className="flex items-center gap-3 mb-8">
                <DollarSign className="text-[#C5A059]" size={24} />
                <h3 className="text-2xl font-serif font-bold text-white">Cash Flow Projections</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-white border-b border-[#333333] pb-2">Income Sources</h4>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Current Annual Income</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-[#6E8A96] font-mono">$</span>
                      <input type="text" defaultValue="150,000" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] pl-8 pr-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Expected Social Security (Annual)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-[#6E8A96] font-mono">$</span>
                      <input type="text" defaultValue="36,000" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] pl-8 pr-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-white border-b border-[#333333] pb-2">Retirement Needs</h4>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Desired Annual Spend (Today's $)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-[#6E8A96] font-mono">$</span>
                      <input type="text" defaultValue="100,000" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] pl-8 pr-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Healthcare Buffer (Annual)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-[#6E8A96] font-mono">$</span>
                      <input type="text" defaultValue="15,000" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] pl-8 pr-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Sidebar: Results & Actions */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <PieChart size={150} />
              </div>
              <h3 className="font-serif text-lg font-bold text-white mb-6 flex items-center gap-3 italic relative z-10">
                <Activity size={18} className="text-[#C5A059]" />
                Projection Results
              </h3>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-1">Required Portfolio at Age 65</p>
                  <p className="text-3xl font-serif font-bold text-white">$2,450,000</p>
                </div>
                
                <div className="h-px w-full bg-[#333333]" />
                
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-1">Projected Portfolio at Age 65</p>
                  <p className="text-3xl font-serif font-bold text-[#1E5C38]">$2,850,000</p>
                </div>

                <div className="p-4 bg-[#1E5C38]/10 border border-[#1E5C38]/20 rounded-[2px]">
                  <p className="text-sm text-[#1E5C38] font-bold flex items-center gap-2">
                    <ShieldCheck size={16} /> On Track
                  </p>
                  <p className="text-xs text-[#6E8A96] mt-1">Your current trajectory exceeds your required portfolio target.</p>
                </div>
                
                <button className="w-full py-4 bg-[#C5A059] hover:bg-[#D4AF68] text-[#0A0A0A] font-mono text-xs uppercase tracking-widest font-bold rounded-[2px] transition-colors flex items-center justify-center gap-2 mt-4">
                  Run Full Monte Carlo <ArrowRight size={14} />
                </button>
              </div>
            </section>

            <section className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px]">
              <h3 className="font-serif text-lg font-bold text-white mb-6 flex items-center gap-3 italic">
                <TrendingUp size={18} className="text-[#C5A059]" />
                Action Items
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border border-[#C5A059] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-[#C5A059] rounded-full" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-bold">Increase 401(k) Contribution</p>
                    <p className="text-xs text-[#6E8A96] mt-1">Bump up by 2% to maximize employer match.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border border-[#333333] flex items-center justify-center flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-bold">Review Asset Allocation</p>
                    <p className="text-xs text-[#6E8A96] mt-1">Current equity exposure is 85%. Consider rebalancing.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
