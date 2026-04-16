import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Zap, Wallet, TrendingUp, RefreshCw, ChevronRight, 
  Home, DollarSign, Edit2, Plus, PieChart, Info, Settings,
  ArrowUpRight, ArrowDownRight, ChevronLeft, Building, Play
} from 'lucide-react';

interface SurplusAllocationModalProps {
  periodSurplus: number;
  monthsInRange: number;
  normalizedMonthlySurplus: number;
  onClose: () => void;
}

interface RealEstateProperty {
  id: string;
  name: string;
  purchasePrice: number;
  currentValue: number;
  equity: number;
  mortgagePayment: number;
  rentCollected: number;
  type: string;
}

interface Preferences {
  comfortLevel: string | null;
  riskTolerance: string | null;
  vehicles: string[];
  timeHorizon: string | null;
  ownsRealEstate: boolean | null;
  properties: RealEstateProperty[];
  allocationSaved: boolean;
  allocations: {
    hysa: number;
    equities: number;
    realEstate: number;
    debt: number;
  };
}

const DEFAULT_PREFS: Preferences = {
  comfortLevel: null,
  riskTolerance: null,
  vehicles: [],
  timeHorizon: null,
  ownsRealEstate: null,
  properties: [],
  allocationSaved: false,
  allocations: {
    hysa: 0,
    equities: 0,
    realEstate: 0,
    debt: 0
  }
};

export default function SurplusAllocationModal({
  periodSurplus,
  monthsInRange,
  normalizedMonthlySurplus,
  onClose
}: SurplusAllocationModalProps) {
  
  const [prefs, setPrefs] = useState<Preferences>(() => {
    const saved = localStorage.getItem('orbit_surplus_prefs');
    return saved ? JSON.parse(saved) : DEFAULT_PREFS;
  });

  const [currentStep, setCurrentStep] = useState<'DASHBOARD' | 'PREF_Q1' | 'PREF_Q2' | 'PREF_Q3' | 'PREF_Q4' | 'PREF_Q5' | 'RE_SETUP' | 'RECOMMENDATION'>(
    prefs.allocationSaved ? 'DASHBOARD' : 'PREF_Q1'
  );

  const savePrefs = (newPrefs: Preferences) => {
    setPrefs(newPrefs);
    localStorage.setItem('orbit_surplus_prefs', JSON.stringify(newPrefs));
  };

  const resetPreferences = () => {
    savePrefs(DEFAULT_PREFS);
    setCurrentStep('PREF_Q1');
  };

  // Setup Handlers
  const handleNextStep = (next: typeof currentStep) => {
    setCurrentStep(next);
  };

  const getRecommendedAllocation = () => {
    let rec = { hysa: 50, equities: 30, realEstate: 10, debt: 10 };
    if (prefs.riskTolerance === 'aggressive') {
      rec = { hysa: 10, equities: 70, realEstate: 20, debt: 0 };
    } else if (prefs.riskTolerance === 'conservative') {
      rec = { hysa: 70, equities: 10, realEstate: 0, debt: 20 };
    } else if (prefs.riskTolerance === 'balanced') {
      rec = { hysa: 30, equities: 40, realEstate: 20, debt: 10 };
    }
    
    // adjust for timeline
    if (prefs.timeHorizon === '<1y') {
      rec = { hysa: 90, equities: 0, realEstate: 0, debt: 10 };
    }
    return rec;
  };

  // Preference Renders
  const renderPrefQ1 = () => (
    <div className="p-8">
      <h2 className="text-2xl font-serif font-bold text-[#2C3338] mb-2">How hands-on do you want to be?</h2>
      <p className="text-[#8C8670] text-sm mb-8">Personalize your capital deployment strategy.</p>
      
      <div className="space-y-4">
        {[
          { id: 'hands-off', label: 'Very hands-off', desc: 'Set it and forget it' },
          { id: 'moderate', label: 'Moderately active', desc: 'Review and adjust quarterly' },
          { id: 'active', label: 'Actively managed', desc: 'Hands-on portfolio management' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => {
              setPrefs({...prefs, comfortLevel: opt.id});
              handleNextStep('PREF_Q2');
            }}
            className="w-full text-left p-5 rounded-xl border border-[#E8E4D0] hover:border-[#C5A059] bg-[#FAF9F6] transition-all group"
          >
            <div className="font-bold text-[#2C3338] group-hover:text-[#C5A059] transition-colors">{opt.label}</div>
            <div className="text-xs text-[#8C8670] mt-1">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPrefQ2 = () => (
    <div className="p-8">
      <button onClick={() => setCurrentStep('PREF_Q1')} className="text-[#8C8670] hover:text-[#C5A059] mb-4"><ChevronLeft size={20}/></button>
      <h2 className="text-2xl font-serif font-bold text-[#2C3338] mb-2">How do you feel about market volatility?</h2>
      
      <div className="space-y-4 mt-8">
        {[
          { id: 'conservative', label: 'Conservative', desc: 'Protect capital, minimal risk' },
          { id: 'balanced', label: 'Balanced', desc: 'Moderate growth, stomach some dips' },
          { id: 'aggressive', label: 'Aggressive', desc: 'Maximize returns, long-term focus' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => {
              setPrefs({...prefs, riskTolerance: opt.id});
              handleNextStep('PREF_Q3');
            }}
            className="w-full text-left p-5 rounded-xl border border-[#E8E4D0] hover:border-[#6366F1] bg-[#FAF9F6] transition-all group"
          >
            <div className="font-bold text-[#2C3338] group-hover:text-[#6366F1] transition-colors">{opt.label}</div>
            <div className="text-xs text-[#8C8670] mt-1">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPrefQ3 = () => (
    <div className="p-8">
      <button onClick={() => setCurrentStep('PREF_Q2')} className="text-[#8C8670] hover:text-[#C5A059] mb-4"><ChevronLeft size={20}/></button>
      <h2 className="text-2xl font-serif font-bold text-[#2C3338] mb-2">Which vehicles interest you most?</h2>
      <p className="text-[#8C8670] text-sm mb-8">Select all that apply.</p>
      
      <div className="grid grid-cols-2 gap-4">
        {['HYSA', 'Index Funds/Stocks', 'Real Estate', 'Debt Paydown', 'Crypto', 'Bonds'].map(v => {
          const isSelected = prefs.vehicles.includes(v);
          return (
            <button
              key={v}
              onClick={() => {
                const updated = isSelected 
                  ? prefs.vehicles.filter(x => x !== v)
                  : [...prefs.vehicles, v];
                setPrefs({...prefs, vehicles: updated});
              }}
              className={`p-4 rounded-xl border text-left transition-all ${isSelected ? 'border-[#C5A059] bg-[#C5A059]/10' : 'border-[#E8E4D0] bg-[#FAF9F6] hover:border-[#C5A059]'}`}
            >
              <div className={`font-bold text-sm ${isSelected ? 'text-[#C5A059]' : 'text-[#2C3338]'}`}>{v}</div>
            </button>
          )
        })}
      </div>
      <button 
        onClick={() => handleNextStep('PREF_Q4')}
        disabled={prefs.vehicles.length === 0}
        className="mt-8 w-full p-4 bg-[#C5A059] text-white rounded-xl font-bold disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );

  const renderPrefQ4 = () => (
    <div className="p-8">
      <button onClick={() => setCurrentStep('PREF_Q3')} className="text-[#8C8670] hover:text-[#C5A059] mb-4"><ChevronLeft size={20}/></button>
      <h2 className="text-2xl font-serif font-bold text-[#2C3338] mb-6">When do you need this money?</h2>
      
      <div className="space-y-4">
        {[
          { id: '<1y', label: 'Less than 1 year' },
          { id: '1-5y', label: '1 - 5 years' },
          { id: '5-10y', label: '5 - 10 years' },
          { id: '10y+', label: '10+ years (Retirement)' }
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => {
              setPrefs({...prefs, timeHorizon: opt.id});
              handleNextStep('PREF_Q5');
            }}
            className="w-full text-left p-5 rounded-xl border border-[#E8E4D0] hover:border-[#1E5C38] bg-[#FAF9F6] transition-all group font-bold text-[#2C3338]"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPrefQ5 = () => (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-serif font-bold text-[#2C3338] mb-8">Do you own any investment properties?</h2>
      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => {
            setPrefs({...prefs, ownsRealEstate: true});
            handleNextStep('RE_SETUP');
          }}
          className="p-8 rounded-2xl border border-[#E8E4D0] hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all flex flex-col items-center justify-center gap-4"
        >
          <Home size={32} className="text-[#C5A059]" />
          <span className="font-bold text-lg text-[#2C3338]">Yes</span>
        </button>
        <button
          onClick={() => {
            setPrefs({...prefs, ownsRealEstate: false});
            handleNextStep('RECOMMENDATION');
          }}
          className="p-8 rounded-2xl border border-[#E8E4D0] hover:border-[#8C8670] hover:bg-[#8C8670]/5 transition-all flex flex-col items-center justify-center gap-4"
        >
          <X size={32} className="text-[#8C8670]" />
          <span className="font-bold text-lg text-[#2C3338]">Not yet</span>
        </button>
      </div>
    </div>
  );

  const [tempProp, setTempProp] = useState<Partial<RealEstateProperty>>({});
  
  const renderReSetup = () => (
    <div className="p-8">
      <h2 className="text-2xl font-serif font-bold text-[#2C3338] mb-6">Add Property</h2>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-[#8C8670] mb-2 block">Property Address/Nickname</label>
          <input className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-lg text-sm" value={tempProp.name || ''} onChange={e => setTempProp({...tempProp, name: e.target.value})} placeholder="e.g. 123 Main St" />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-[#8C8670] mb-2 block">Est. Current Value</label>
            <input type="number" className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-lg text-sm" value={tempProp.currentValue || ''} onChange={e => setTempProp({...tempProp, currentValue: Number(e.target.value)})} placeholder="$" />
          </div>
          <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-[#8C8670] mb-2 block">Total Equity</label>
            <input type="number" className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-lg text-sm" value={tempProp.equity || ''} onChange={e => setTempProp({...tempProp, equity: Number(e.target.value)})} placeholder="$" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-[#8C8670] mb-2 block">Mortgage Pymt/mo</label>
            <input type="number" className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-lg text-sm" value={tempProp.mortgagePayment || ''} onChange={e => setTempProp({...tempProp, mortgagePayment: Number(e.target.value)})} placeholder="$" />
          </div>
          <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-[#8C8670] mb-2 block">Rent Collected/mo</label>
            <input type="number" className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-lg text-sm" value={tempProp.rentCollected || ''} onChange={e => setTempProp({...tempProp, rentCollected: Number(e.target.value)})} placeholder="$" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-mono tracking-widest uppercase text-[#8C8670] mb-2 block">Property Type</label>
          <select className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-lg text-sm" value={tempProp.type || ''} onChange={e => setTempProp({...tempProp, type: e.target.value})}>
            <option value="">Select type...</option>
            <option value="primary">Primary Residence</option>
            <option value="rental">Long-term Rental</option>
            <option value="vacation">Vacation/Short-term</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div className="pt-4 flex gap-4">
          <button 
            onClick={() => {
              const fullProp: RealEstateProperty = {
                id: Date.now().toString(),
                name: tempProp.name || 'Unnamed Property',
                purchasePrice: tempProp.purchasePrice || 0,
                currentValue: tempProp.currentValue || 0,
                equity: tempProp.equity || 0,
                mortgagePayment: tempProp.mortgagePayment || 0,
                rentCollected: tempProp.rentCollected || 0,
                type: tempProp.type || 'rental'
              };
              setPrefs({...prefs, properties: [...prefs.properties, fullProp]});
              setTempProp({});
              handleNextStep('RECOMMENDATION');
            }}
            className="flex-1 bg-[#2C3338] text-[#FAF9F6] p-4 rounded-xl font-bold hover:bg-[#1A1F22] transition-colors"
          >
            Save Property
          </button>
          <button 
            onClick={() => handleNextStep('RECOMMENDATION')}
            className="px-6 border border-[#E8E4D0] rounded-xl text-[#8C8670] font-bold hover:bg-[#E8E4D0]"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecommendation = () => {
    const rec = getRecommendedAllocation();
    return (
      <div className="p-8">
        <h2 className="text-2xl font-serif font-bold text-[#2C3338] mb-2">Your Optimized Strategy</h2>
        <p className="text-[#8C8670] text-sm mb-8">
          Based on your {prefs.riskTolerance} risk tolerance and {prefs.timeHorizon} horizon.
        </p>
        
        <div className="bg-[#FAF9F6] border border-[#C5A059] rounded-2xl p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#6366F1]">{rec.equities}%</div>
              <div className="text-[10px] font-mono uppercase text-[#8C8670]">Equities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#1E5C38]">{rec.hysa}%</div>
              <div className="text-[10px] font-mono uppercase text-[#8C8670]">HYSA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#C5A059]">{rec.realEstate}%</div>
              <div className="text-[10px] font-mono uppercase text-[#8C8670]">Real Estate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#8B0000]">{rec.debt}%</div>
              <div className="text-[10px] font-mono uppercase text-[#8C8670]">Debt</div>
            </div>
          </div>
          <p className="text-sm text-[#2C3338] leading-relaxed italic text-center border-t border-[#E8E4D0] pt-4">
            "A mix heavily weighted towards {rec.equities > rec.hysa ? 'equities' : 'cash equivalents'} perfectly aligns with your timeline. We've structured this to {prefs.riskTolerance === 'aggressive' ? 'maximize long-term compound growth' : 'protect your capital while keeping it liquid'}."
          </p>
        </div>
        
        <button 
          onClick={() => {
            savePrefs({...prefs, allocations: rec, allocationSaved: true});
            setCurrentStep('DASHBOARD');
          }}
          className="w-full bg-[#C5A059] text-white p-4 rounded-xl font-bold hover:bg-[#B38F48] transition-colors"
        >
          Accept & Go to Dashboard
        </button>
      </div>
    );
  };

  const renderDashboard = () => {
    const totalEq = prefs.properties.reduce((sum, p) => sum + p.equity, 0);
    const totalCashflow = prefs.properties.reduce((sum, p) => sum + (p.rentCollected - p.mortgagePayment), 0);

    const updateAllocation = (key: keyof Preferences['allocations'], val: number) => {
      setPrefs({...prefs, allocations: {...prefs.allocations, [key]: val}});
    }

    return (
      <div className="flex flex-col h-full bg-[#FAF9F6]">
        {/* Header */}
        <div className="p-8 border-b border-[#E8E4D0] bg-white sticky top-0 z-20 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#1E5C38]/10 rounded-lg">
                <Zap size={20} className="text-[#1E5C38]" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#2C3338]">Capital Deployment</h2>
            </div>
            <p className="text-sm text-[#8C8670]">
              <span className="font-bold text-[#1E5C38]">${periodSurplus.toLocaleString()}</span> projected surplus over {monthsInRange}mo (Avg <span className="font-bold text-[#2C3338]">${Math.round(normalizedMonthlySurplus).toLocaleString()}</span>/mo)
            </p>
          </div>
          <button onClick={resetPreferences} className="text-[10px] font-mono tracking-widest text-[#8C8670] uppercase hover:text-[#C5A059] flex items-center gap-1">
            <Settings size={12}/> Update Prefs
          </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto">
          {/* Real Estate Portfolio */}
          {prefs.properties.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-sm font-bold text-[#2C3338] font-mono uppercase tracking-widest">Real Estate Portfolio</h3>
                <button className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest flex items-center gap-1 hover:underline">
                  <Plus size={12} /> Add Property
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prefs.properties.map(p => (
                  <div key={p.id} className="border border-[#E8E4D0] rounded-xl p-5 bg-white shadow-sm flex flex-col hover:border-[#C5A059] transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold text-[#2C3338]">{p.name}</div>
                        <div className="text-[10px] font-mono text-[#8C8670] uppercase">{p.type}</div>
                      </div>
                      <div className="p-2 bg-[#C5A059]/10 rounded-lg text-[#C5A059]">
                        <Building size={16} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-auto">
                      <div>
                        <div className="text-[9px] font-mono text-[#8C8670] uppercase tracking-widest">Equity</div>
                        <div className="font-bold text-[#2C3338]">${p.equity.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-[#8C8670] uppercase tracking-widest">Mo. Cashflow</div>
                        <div className={`font-bold ${(p.rentCollected - p.mortgagePayment) >= 0 ? 'text-[#1E5C38]' : 'text-[#8B0000]'}`}>
                          {(p.rentCollected - p.mortgagePayment) >= 0 ? '+' : ''}${(p.rentCollected - p.mortgagePayment).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Allocation Sliders */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-[#2C3338] font-mono uppercase tracking-widest flex items-center gap-2">
                <PieChart size={16} className="text-[#6366F1]"/>
                Allocation Strategy
              </h3>
              <div className="text-[10px] font-mono uppercase tracking-widest bg-[#6366F1]/10 text-[#6366F1] px-2 py-1 rounded-md">
                {(prefs.allocations.hysa + prefs.allocations.equities + prefs.allocations.realEstate + prefs.allocations.debt).toFixed(0)}% Allocated
              </div>
            </div>

            <div className="space-y-6">
              {/* Equities */}
              <div className={`p-5 rounded-2xl border ${prefs.vehicles.includes('Index Funds/Stocks') ? 'border-[#6366F1]/40 bg-white' : 'border-[#E8E4D0] opacity-60 bg-[#FAF9F6]'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#6366F1]/10 rounded-lg">
                      <TrendingUp size={18} className="text-[#6366F1]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2C3338]">Index Funds / Equities</h4>
                      <p className="text-[11px] font-mono text-[#8C8670]">S&P 500, ETFs | Est. 8-10% return</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#6366F1]">{prefs.allocations.equities}%</div>
                    <div className="text-[10px] font-mono text-[#8C8670] uppercase">${Math.round(normalizedMonthlySurplus * (prefs.allocations.equities/100)).toLocaleString()}/mo</div>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={prefs.allocations.equities} onChange={(e) => updateAllocation('equities', Number(e.target.value))} className="w-full accent-[#6366F1]" />
                {prefs.vehicles.includes('Index Funds/Stocks') && (
                  <div className="mt-3 text-[10px] font-mono text-[#2C3338] flex items-center gap-1 bg-[#6366F1]/5 p-2 rounded block">
                    <span className="text-[#6366F1]">✓</span> You prefer stocks — consider auto-investing this sum.
                  </div>
                )}
              </div>

              {/* HYSA */}
              <div className={`p-5 rounded-2xl border ${prefs.vehicles.includes('HYSA') ? 'border-[#1E5C38]/40 bg-white' : 'border-[#E8E4D0] opacity-60 bg-[#FAF9F6]'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1E5C38]/10 rounded-lg">
                      <Wallet size={18} className="text-[#1E5C38]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2C3338]">High-Yield Savings</h4>
                      <p className="text-[11px] font-mono text-[#8C8670]">Emergency fund | Est. 4-5% APY</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#1E5C38]">{prefs.allocations.hysa}%</div>
                    <div className="text-[10px] font-mono text-[#8C8670] uppercase">${Math.round(normalizedMonthlySurplus * (prefs.allocations.hysa/100)).toLocaleString()}/mo</div>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={prefs.allocations.hysa} onChange={(e) => updateAllocation('hysa', Number(e.target.value))} className="w-full accent-[#1E5C38]" />
                {prefs.riskTolerance === 'conservative' && (
                  <div className="mt-3 text-[10px] font-mono text-[#2C3338] flex items-center gap-1 bg-[#1E5C38]/5 p-2 rounded block">
                    <span className="text-[#1E5C38]">✓</span> Matches your conservative risk preference perfectly.
                  </div>
                )}
              </div>

              {/* Real Estate */}
              <div className={`p-5 rounded-2xl border ${prefs.vehicles.includes('Real Estate') || prefs.ownsRealEstate ? 'border-[#C5A059]/40 bg-white' : 'border-[#E8E4D0] opacity-60 bg-[#FAF9F6]'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#C5A059]/10 rounded-lg">
                      <Home size={18} className="text-[#C5A059]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2C3338]">Real Estate Fund</h4>
                      <p className="text-[11px] font-mono text-[#8C8670]">REITs, Direct | Est. 6-12% return</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#C5A059]">{prefs.allocations.realEstate}%</div>
                    <div className="text-[10px] font-mono text-[#8C8670] uppercase">${Math.round(normalizedMonthlySurplus * (prefs.allocations.realEstate/100)).toLocaleString()}/mo</div>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={prefs.allocations.realEstate} onChange={(e) => updateAllocation('realEstate', Number(e.target.value))} className="w-full accent-[#C5A059]" />
                {prefs.ownsRealEstate ? (
                  <div className="mt-3 text-[10px] font-mono text-[#2C3338] flex items-center gap-1 bg-[#C5A059]/5 p-2 rounded block">
                    You have <span className="font-bold text-[#C5A059]">${(totalEq/1000).toFixed(0)}k</span> in RE equity. Use this to save for the next down payment.
                  </div>
                ) : !prefs.vehicles.includes('Real Estate') ? (
                  <div className="mt-3 text-[10px] font-mono text-[#8C8670] italic">
                    You indicated lower interest in real estate.
                  </div>
                ) : null}
              </div>

               {/* Debt */}
               <div className={`p-5 rounded-2xl border ${prefs.vehicles.includes('Debt Paydown') ? 'border-[#8B0000]/40 bg-white' : 'border-[#E8E4D0] opacity-60 bg-[#FAF9F6]'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#8B0000]/10 rounded-lg">
                      <RefreshCw size={18} className="text-[#8B0000]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2C3338]">Debt Paydown</h4>
                      <p className="text-[11px] font-mono text-[#8C8670]">Guaranteed return = interest rate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#8B0000]">{prefs.allocations.debt}%</div>
                    <div className="text-[10px] font-mono text-[#8C8670] uppercase">${Math.round(normalizedMonthlySurplus * (prefs.allocations.debt/100)).toLocaleString()}/mo</div>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={prefs.allocations.debt} onChange={(e) => updateAllocation('debt', Number(e.target.value))} className="w-full accent-[#8B0000]" />
              </div>

            </div>
          </section>

          <button 
            onClick={() => {
               savePrefs({...prefs});
               onClose();
            }}
            className="w-full bg-[#2C3338] text-[#FAF9F6] p-4 rounded-xl font-bold hover:bg-[#1A1F22] transition-colors mt-8 shadow-md flex items-center justify-center gap-2"
          >
             Save Strategy & Return
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#2C3338]/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#FAF9F6] w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
      >
        {currentStep !== 'DASHBOARD' && (
           <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl text-[#8C8670] hover:bg-[#E8E4D0] transition-colors z-20">
             <X size={20} />
           </button>
        )}

        <div className="flex-1 overflow-y-auto">
          {currentStep === 'PREF_Q1' && renderPrefQ1()}
          {currentStep === 'PREF_Q2' && renderPrefQ2()}
          {currentStep === 'PREF_Q3' && renderPrefQ3()}
          {currentStep === 'PREF_Q4' && renderPrefQ4()}
          {currentStep === 'PREF_Q5' && renderPrefQ5()}
          {currentStep === 'RE_SETUP' && renderReSetup()}
          {currentStep === 'RECOMMENDATION' && renderRecommendation()}
          {currentStep === 'DASHBOARD' && renderDashboard()}
        </div>
      </motion.div>
    </div>
  );
}
