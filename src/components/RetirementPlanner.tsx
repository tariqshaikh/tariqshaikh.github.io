import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp,
  TrendingUp, 
  LogOut, 
  User as UserIcon, 
  Calculator, 
  ArrowRight, 
  ShieldCheck, 
  PieChart, 
  Activity, 
  DollarSign,
  Target,
  FileText,
  Heart,
  Plane,
  Briefcase,
  Download,
  Info,
  AlertCircle,
  Trash2,
  Edit2,
  Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, logout } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

type MainTab = 'Analysis' | 'Stress Test' | 'Social Security' | 'Medicare' | 'Cash Flows';
type AnalysisSubTab = 'Retirement Outlook' | 'Confidence' | 'Comparisons';

export default function RetirementPlanner() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('Analysis');
  const [activeSubTab, setActiveSubTab] = useState<AnalysisSubTab>('Retirement Outlook');
  const navigate = useNavigate();

  // Core Assumptions State
  const [planningType, setPlanningType] = useState<'Individual' | 'Couple'>('Couple');
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [spouseAge, setSpouseAge] = useState(35);
  const [spouseRetirementAge, setSpouseRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(95);
  const [inflationRate, setInflationRate] = useState(3.0);
  const [preRetirementReturn, setPreRetirementReturn] = useState(7.0);
  const [postRetirementReturn, setPostRetirementReturn] = useState(5.0);

  // Accounts State
  const [ledgerAccounts, setLedgerAccounts] = useState<any[]>([]);
  const [manualAccounts, setManualAccounts] = useState<any[]>([]);
  const [accountSettings, setAccountSettings] = useState<Record<string, any>>({});
  const [futureInflows, setFutureInflows] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [primaryName, setPrimaryName] = useState<string>("");
  const [spouseName, setSpouseName] = useState<string>("");
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [tempPrimaryName, setTempPrimaryName] = useState("");
  const [tempSpouseName, setTempSpouseName] = useState("");

  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [proposedMultiplier, setProposedMultiplier] = useState(1.15);

  // Modals State
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddInflowOpen, setIsAddInflowOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingInflow, setEditingInflow] = useState<any>(null);

  const [newAccount, setNewAccount] = useState({ name: '', balance: 0, annualContribution: 0, type: 'Taxable' });
  const [newInflow, setNewInflow] = useState({ name: '', amount: 0, age: 65 });

  // Income Sources State
  const [socialSecurity, setSocialSecurity] = useState({ monthly: 3200, age: 67 });
  const [pension, setPension] = useState({ annual: 12000, cola: true });
  const [deferredAssets, setDeferredAssets] = useState({ value: 185000, status: 'DEFERRED' });

  // Goals State
  const [goals, setGoals] = useState([
    { id: 'g1', title: 'Retirement Expense', category: 'RETIREMENT', value: 10000, period: 'Monthly', icon: <Briefcase size={20} /> },
    { id: 'g2', title: 'Travel', category: 'LIFESTYLE VACATION', value: 25000, period: 'Annual', icon: <Plane size={20} /> },
    { id: 'g3', title: 'Health Cost', category: 'RETIREMENT', value: 12000, period: 'Annual', icon: <Heart size={20} /> },
  ]);

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

  // Fetch real data from Firestore
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const itemsRef = collection(db, 'users', user.uid, 'netWorthItems');
    const unsub = onSnapshot(itemsRef, (snapshot) => {
      const items = snapshot.docs.map(d => d.data());
      
      // Map Firestore items to accounts
      const mappedAccounts = items
        .filter((item: any) => item.isAsset && item.value > 0)
        .map((item: any) => ({
          id: item.id,
          name: item.name || 'Unnamed Account',
          balance: item.value,
          annualContribution: item.name?.toLowerCase().includes('401k') ? 22500 : 
                             item.name?.toLowerCase().includes('ira') ? 6500 : 0,
          type: item.taxStatus || 'Taxable'
        }));

      if (mappedAccounts.length > 0) {
        setLedgerAccounts(mappedAccounts);
      } else {
        // Fallback to defaults if no data
        setLedgerAccounts([
          { id: '1', name: '401(k)', balance: 250000, annualContribution: 22500, type: 'Tax-Deferred' },
          { id: '2', name: 'Roth IRA', balance: 85000, annualContribution: 6500, type: 'Tax-Free' },
          { id: '3', name: 'Brokerage', balance: 120000, annualContribution: 12000, type: 'Taxable' },
        ]);
      }
      setIsDataLoaded(true);
    });

    return () => unsub();
  }, [user, isAuthReady]);

  // Fetch manual accounts and settings
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const settingsRef = doc(db, 'users', user.uid, 'retirementSettings', 'data');
    const unsub = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setManualAccounts(data.manualAccounts || []);
        setAccountSettings(data.accountSettings || {});
        setFutureInflows(data.futureInflows || []);
      }
    });

    return () => unsub();
  }, [user, isAuthReady]);

  const combinedAccounts = useMemo(() => {
    return [
      ...ledgerAccounts.map(acc => ({
        ...acc,
        annualContribution: accountSettings[acc.id]?.annualContribution ?? acc.annualContribution
      })),
      ...manualAccounts
    ];
  }, [ledgerAccounts, manualAccounts, accountSettings]);

  // Fetch app settings for names
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const appSettingsRef = doc(db, 'users', user.uid, 'appSettings', 'general');
    const unsub = onSnapshot(appSettingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPrimaryName(data.primaryName || '');
        setSpouseName(data.spouseName || '');
        setTempPrimaryName(data.primaryName || '');
        setTempSpouseName(data.spouseName || '');
      }
    });

    return () => unsub();
  }, [user, isAuthReady]);

  // Projection Logic
  const projectionData = useMemo(() => {
    const data = [];
    
    // Initialize buckets
    let taxableBalance = combinedAccounts.filter(a => a.type === 'Taxable').reduce((sum, acc) => sum + acc.balance, 0);
    let taxDeferredBalance = combinedAccounts.filter(a => a.type === 'Tax-Deferred').reduce((sum, acc) => sum + acc.balance, 0);
    let taxFreeBalance = combinedAccounts.filter(a => a.type === 'Tax-Free').reduce((sum, acc) => sum + acc.balance, 0);
    
    if (deferredAssets.status === 'TAXABLE') taxableBalance += deferredAssets.value;
    else if (deferredAssets.status === 'TAX-FREE') taxFreeBalance += deferredAssets.value;
    else taxDeferredBalance += deferredAssets.value;

    const taxableContr = combinedAccounts.filter(a => a.type === 'Taxable').reduce((sum, acc) => sum + acc.annualContribution, 0);
    const taxDeferredContr = combinedAccounts.filter(a => a.type === 'Tax-Deferred').reduce((sum, acc) => sum + acc.annualContribution, 0);
    const taxFreeContr = combinedAccounts.filter(a => a.type === 'Tax-Free').reduce((sum, acc) => sum + acc.annualContribution, 0);

    for (let age = currentAge; age <= lifeExpectancy; age++) {
      const yearOffset = age - currentAge;
      const currentSpouseAge = spouseAge + yearOffset;
      
      const isP1Retired = age >= retirementAge;
      const isP2Retired = planningType === 'Couple' ? currentSpouseAge >= spouseRetirementAge : true;
      const isRetired = isP1Retired; 
      
      const yearReturn = isRetired ? postRetirementReturn : preRetirementReturn;
      const inflationFactor = Math.pow(1 + (inflationRate / 100), yearOffset);
      
      let totalAnnualNeed = 0;
      goals.forEach(g => {
        const amount = g.period === 'Monthly' ? g.value * 12 : g.value;
        totalAnnualNeed += amount;
      });
      totalAnnualNeed *= inflationFactor;
      
      let annualIncome = 0;
      if (age >= socialSecurity.age) {
        annualIncome += (socialSecurity.monthly * 12) * inflationFactor;
      }
      if (isRetired) {
        annualIncome += pension.cola ? pension.annual * inflationFactor : pension.annual;
      }
      
      let netAnnualNeed = Math.max(0, totalAnnualNeed - annualIncome);
      
      // Contributions
      let p1Ratio = isP1Retired ? 0 : (planningType === 'Couple' ? 0.5 : 1);
      let p2Ratio = isP2Retired ? 0 : (planningType === 'Couple' ? 0.5 : 0);
      let activeRatio = p1Ratio + p2Ratio;

      let activeTaxableContr = taxableContr * activeRatio;
      let activeTaxDeferredContr = taxDeferredContr * activeRatio;
      let activeTaxFreeContr = taxFreeContr * activeRatio;

      const yearInflows = futureInflows.filter(f => f.age === age).reduce((sum, f) => sum + f.amount, 0);
      taxableBalance += yearInflows; // Assume inflows go to taxable

      // Grow balances
      taxableBalance *= (1 + (yearReturn / 100));
      taxDeferredBalance *= (1 + (yearReturn / 100));
      taxFreeBalance *= (1 + (yearReturn / 100));

      // Add contributions
      taxableBalance += activeTaxableContr;
      taxDeferredBalance += activeTaxDeferredContr;
      taxFreeBalance += activeTaxFreeContr;

      // Withdrawals (Taxable -> Tax-Deferred -> Tax-Free)
      // Simplified tax estimation: 15% on Taxable (cap gains), 25% on Tax-Deferred (income), 0% on Tax-Free
      let actualWithdrawal = 0;
      let taxPaid = 0;
      if (isRetired && netAnnualNeed > 0) {
        // Taxable
        if (taxableBalance > 0 && netAnnualNeed > 0) {
          const grossNeed = netAnnualNeed / 0.85;
          if (taxableBalance >= grossNeed) {
            taxableBalance -= grossNeed;
            actualWithdrawal += grossNeed;
            taxPaid += grossNeed * 0.15;
            netAnnualNeed = 0;
          } else {
            const netFromTaxable = taxableBalance * 0.85;
            actualWithdrawal += taxableBalance;
            taxPaid += taxableBalance * 0.15;
            netAnnualNeed -= netFromTaxable;
            taxableBalance = 0;
          }
        }
        // Tax-Deferred
        if (taxDeferredBalance > 0 && netAnnualNeed > 0) {
          const grossNeed = netAnnualNeed / 0.75;
          if (taxDeferredBalance >= grossNeed) {
            taxDeferredBalance -= grossNeed;
            actualWithdrawal += grossNeed;
            taxPaid += grossNeed * 0.25;
            netAnnualNeed = 0;
          } else {
            const netFromDeferred = taxDeferredBalance * 0.75;
            actualWithdrawal += taxDeferredBalance;
            taxPaid += taxDeferredBalance * 0.25;
            netAnnualNeed -= netFromDeferred;
            taxDeferredBalance = 0;
          }
        }
        // Tax-Free
        if (taxFreeBalance > 0 && netAnnualNeed > 0) {
          if (taxFreeBalance >= netAnnualNeed) {
            taxFreeBalance -= netAnnualNeed;
            actualWithdrawal += netAnnualNeed;
            netAnnualNeed = 0;
          } else {
            actualWithdrawal += taxFreeBalance;
            netAnnualNeed -= taxFreeBalance;
            taxFreeBalance = 0;
          }
        }
      }

      const totalBalance = taxableBalance + taxDeferredBalance + taxFreeBalance;

      data.push({
        age,
        spouseAge: currentSpouseAge,
        year: new Date().getFullYear() + yearOffset,
        balance: Math.max(0, totalBalance),
        taxableBalance: Math.max(0, taxableBalance),
        taxDeferredBalance: Math.max(0, taxDeferredBalance),
        taxFreeBalance: Math.max(0, taxFreeBalance),
        withdrawalRate: isRetired && totalBalance > 0 ? (actualWithdrawal / totalBalance) * 100 : 0,
        actualWithdrawal,
        taxPaid,
        inflows: activeTaxableContr + activeTaxDeferredContr + activeTaxFreeContr + yearInflows + annualIncome,
        outflows: isRetired ? totalAnnualNeed : 0,
        netFlows: (activeTaxableContr + activeTaxDeferredContr + activeTaxFreeContr + yearInflows + annualIncome) - (isRetired ? totalAnnualNeed : 0)
      });
    }
    return data;
  }, [currentAge, retirementAge, spouseAge, spouseRetirementAge, planningType, lifeExpectancy, inflationRate, preRetirementReturn, postRetirementReturn, combinedAccounts, goals, futureInflows, socialSecurity, pension, deferredAssets]);

  const confidenceData = useMemo(() => {
    // Generate Monte Carlo-like range of outcomes
    return projectionData.map(d => {
      const yearOffset = d.age - currentAge;
      // Best case: +2% return
      const bestCase = d.balance * Math.pow(1.02, yearOffset);
      // Worst case: -2% return
      const worstCase = d.balance * Math.pow(0.98, yearOffset);
      
      return {
        ...d,
        bestCase,
        worstCase,
        medianCase: d.balance
      };
    });
  }, [projectionData, currentAge]);

  const comparisonData = useMemo(() => {
    // Compare current plan with a "Proposed Plan" (user-defined multiplier)
    const data = [];
    
    // Initialize buckets
    let taxableBalance = combinedAccounts.filter(a => a.type === 'Taxable').reduce((sum, acc) => sum + acc.balance, 0);
    let taxDeferredBalance = combinedAccounts.filter(a => a.type === 'Tax-Deferred').reduce((sum, acc) => sum + acc.balance, 0);
    let taxFreeBalance = combinedAccounts.filter(a => a.type === 'Tax-Free').reduce((sum, acc) => sum + acc.balance, 0);
    
    if (deferredAssets.status === 'TAXABLE') taxableBalance += deferredAssets.value;
    else if (deferredAssets.status === 'TAX-FREE') taxFreeBalance += deferredAssets.value;
    else taxDeferredBalance += deferredAssets.value;

    const taxableContr = combinedAccounts.filter(a => a.type === 'Taxable').reduce((sum, acc) => sum + acc.annualContribution, 0) * proposedMultiplier;
    const taxDeferredContr = combinedAccounts.filter(a => a.type === 'Tax-Deferred').reduce((sum, acc) => sum + acc.annualContribution, 0) * proposedMultiplier;
    const taxFreeContr = combinedAccounts.filter(a => a.type === 'Tax-Free').reduce((sum, acc) => sum + acc.annualContribution, 0) * proposedMultiplier;

    for (let age = currentAge; age <= lifeExpectancy; age++) {
      const yearOffset = age - currentAge;
      const currentSpouseAge = spouseAge + yearOffset;
      
      const isP1Retired = age >= retirementAge;
      const isP2Retired = planningType === 'Couple' ? currentSpouseAge >= spouseRetirementAge : true;
      const isRetired = isP1Retired; 
      
      const yearReturn = isRetired ? postRetirementReturn : preRetirementReturn;
      const inflationFactor = Math.pow(1 + (inflationRate / 100), yearOffset);
      
      let totalAnnualNeed = 0;
      goals.forEach(g => {
        const amount = g.period === 'Monthly' ? g.value * 12 : g.value;
        totalAnnualNeed += amount;
      });
      totalAnnualNeed *= inflationFactor;
      
      let annualIncome = 0;
      if (age >= socialSecurity.age) {
        annualIncome += (socialSecurity.monthly * 12) * inflationFactor;
      }
      if (isRetired) {
        annualIncome += pension.cola ? pension.annual * inflationFactor : pension.annual;
      }
      
      let netAnnualNeed = Math.max(0, totalAnnualNeed - annualIncome);
      
      // Contributions
      let p1Ratio = isP1Retired ? 0 : (planningType === 'Couple' ? 0.5 : 1);
      let p2Ratio = isP2Retired ? 0 : (planningType === 'Couple' ? 0.5 : 0);
      let activeRatio = p1Ratio + p2Ratio;

      let activeTaxableContr = taxableContr * activeRatio;
      let activeTaxDeferredContr = taxDeferredContr * activeRatio;
      let activeTaxFreeContr = taxFreeContr * activeRatio;

      const yearInflows = futureInflows.filter(f => f.age === age).reduce((sum, f) => sum + f.amount, 0);
      taxableBalance += yearInflows; // Assume inflows go to taxable

      // Grow balances
      taxableBalance *= (1 + (yearReturn / 100));
      taxDeferredBalance *= (1 + (yearReturn / 100));
      taxFreeBalance *= (1 + (yearReturn / 100));

      // Add contributions
      taxableBalance += activeTaxableContr;
      taxDeferredBalance += activeTaxDeferredContr;
      taxFreeBalance += activeTaxFreeContr;

      // Withdrawals (Taxable -> Tax-Deferred -> Tax-Free)
      if (isRetired && netAnnualNeed > 0) {
        if (taxableBalance > 0 && netAnnualNeed > 0) {
          const grossNeed = netAnnualNeed / 0.85;
          if (taxableBalance >= grossNeed) {
            taxableBalance -= grossNeed;
            netAnnualNeed = 0;
          } else {
            const netFromTaxable = taxableBalance * 0.85;
            netAnnualNeed -= netFromTaxable;
            taxableBalance = 0;
          }
        }
        if (taxDeferredBalance > 0 && netAnnualNeed > 0) {
          const grossNeed = netAnnualNeed / 0.75;
          if (taxDeferredBalance >= grossNeed) {
            taxDeferredBalance -= grossNeed;
            netAnnualNeed = 0;
          } else {
            const netFromDeferred = taxDeferredBalance * 0.75;
            netAnnualNeed -= netFromDeferred;
            taxDeferredBalance = 0;
          }
        }
        if (taxFreeBalance > 0 && netAnnualNeed > 0) {
          if (taxFreeBalance >= netAnnualNeed) {
            taxFreeBalance -= netAnnualNeed;
            netAnnualNeed = 0;
          } else {
            netAnnualNeed -= taxFreeBalance;
            taxFreeBalance = 0;
          }
        }
      }

      const totalBalance = taxableBalance + taxDeferredBalance + taxFreeBalance;

      data.push({
        age,
        spouseAge: currentSpouseAge,
        year: new Date().getFullYear() + yearOffset,
        proposedBalance: Math.max(0, totalBalance)
      });
    }
    
    // Merge with projectionData
    return projectionData.map((d, i) => ({
      ...d,
      proposedBalance: data[i]?.proposedBalance || 0
    }));
  }, [projectionData, combinedAccounts, currentAge, retirementAge, spouseAge, spouseRetirementAge, planningType, postRetirementReturn, preRetirementReturn, inflationRate, goals, futureInflows, proposedMultiplier, socialSecurity, pension, deferredAssets, lifeExpectancy]);

  const handleSaveSettings = async (newData: any) => {
    if (!user || user.uid === 'guest-user') return;
    const settingsRef = doc(db, 'users', user.uid, 'retirementSettings', 'data');
    await setDoc(settingsRef, newData, { merge: true });
  };

  const handleSaveNames = async () => {
    if (!user || user.uid === 'guest-user') return;
    const appSettingsRef = doc(db, 'users', user.uid, 'appSettings', 'general');
    await setDoc(appSettingsRef, {
      primaryName: tempPrimaryName,
      spouseName: tempSpouseName
    }, { merge: true });
    setPrimaryName(tempPrimaryName);
    setSpouseName(tempSpouseName);
    setIsEditingNames(false);
  };

  const handleUpdateAccountContribution = (id: string, contribution: number) => {
    const newSettings = {
      ...accountSettings,
      [id]: { ...accountSettings[id], annualContribution: contribution }
    };
    setAccountSettings(newSettings);
    handleSaveSettings({ accountSettings: newSettings });
  };

  const handleAddManualAccount = (account: any) => {
    const newManualAccounts = [...manualAccounts, { ...account, id: Date.now().toString() }];
    setManualAccounts(newManualAccounts);
    handleSaveSettings({ manualAccounts: newManualAccounts });
    setIsAddAccountOpen(false);
  };

  const handleDeleteManualAccount = (id: string) => {
    const newManualAccounts = manualAccounts.filter(a => a.id !== id);
    setManualAccounts(newManualAccounts);
    handleSaveSettings({ manualAccounts: newManualAccounts });
  };

  const handleAddInflow = (inflow: any) => {
    const newInflows = [...futureInflows, { ...inflow, id: Date.now().toString() }];
    setFutureInflows(newInflows);
    handleSaveSettings({ futureInflows: newInflows });
    setIsAddInflowOpen(false);
  };

  const handleDeleteInflow = (id: string) => {
    const newInflows = futureInflows.filter(i => i.id !== id);
    setFutureInflows(newInflows);
    handleSaveSettings({ futureInflows: newInflows });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

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
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A059] mt-1">Retirement Planner</p>
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
                  <button onClick={() => navigate('/orbit/retirement-planner')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#2C3338] bg-[#E8E4D0] transition-colors text-left w-full">Retirement Planner</button>
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

      {/* Secondary Navigation */}
      <div className="bg-[#FAF9F6] border-b border-[#E8E4D0]">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 h-12">
          {(['Analysis', 'Stress Test', 'Social Security', 'Medicare', 'Cash Flows'] as MainTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[11px] font-mono uppercase tracking-widest h-full border-b-2 transition-all ${
                activeTab === tab 
                ? 'text-[#C5A059] border-[#C5A059]' 
                : 'text-[#8C8670] border-transparent hover:text-[#2C3338]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'Analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-5xl font-serif font-bold text-[#2C3338] italic mb-4 leading-tight">Your Retirement Analysis</h2>
                  <p className="text-[#8C8670] max-w-2xl text-sm leading-relaxed mb-6">
                    A comprehensive look at your projected assets, withdrawal strategies, and probability of success based on current market conditions and your personal goals.
                  </p>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-[#FAF9F6] p-1 rounded-[2px] border border-[#E8E4D0] flex">
                      <button
                        onClick={() => setPlanningType('Individual')}
                        className={`px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-all rounded-[1px] ${
                          planningType === 'Individual'
                          ? 'bg-[#C5A059] text-[#FAF9F6] font-bold'
                          : 'text-[#8C8670] hover:text-[#2C3338]'
                        }`}
                      >
                        {primaryName || 'Individual'}
                      </button>
                      <button
                        onClick={() => setPlanningType('Couple')}
                        className={`px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-all rounded-[1px] ${
                          planningType === 'Couple'
                          ? 'bg-[#C5A059] text-[#FAF9F6] font-bold'
                          : 'text-[#8C8670] hover:text-[#2C3338]'
                        }`}
                      >
                        {primaryName && spouseName ? `${primaryName} & ${spouseName}` : 'Couple'}
                      </button>
                    </div>
                    <button 
                      onClick={() => setIsEditingNames(true)}
                      className="p-2 hover:bg-[#E8E4D0] rounded-[2px] text-[#8C8670] hover:text-[#C5A059] transition-colors"
                      title="Edit Names"
                    >
                      <Edit2 size={14} />
                    </button>
                    <div className="h-8 w-px bg-[#E8E4D0]" />
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-1">
                          {primaryName ? `${primaryName}'s Age` : 'Your Age'}
                        </span>
                        <input 
                          type="number" 
                          value={currentAge} 
                          onChange={(e) => setCurrentAge(Number(e.target.value))}
                          className="bg-transparent text-[#2C3338] font-mono text-sm border-b border-[#E8E4D0] focus:border-[#C5A059] outline-none w-24 px-3 py-1"
                        />
                      </div>
                      {planningType === 'Couple' && (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-1">
                            {spouseName ? `${spouseName}'s Age` : 'the right person\'s Age'}
                          </span>
                          <input 
                            type="number" 
                            value={spouseAge} 
                            onChange={(e) => setSpouseAge(Number(e.target.value))}
                            className="bg-transparent text-[#2C3338] font-mono text-sm border-b border-[#E8E4D0] focus:border-[#C5A059] outline-none w-24 px-3 py-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-64 h-32 rounded-[2px] overflow-hidden border border-[#E8E4D0] relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800" 
                    alt="Luxury Office" 
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-[8px] font-mono uppercase tracking-widest text-[#2C3338]/60">Strategic Planning</p>
                  </div>
                </div>
              </div>
                
                <div className="flex items-center gap-2 bg-[#FAF9F6] p-1 rounded-[2px] border border-[#E8E4D0]">
                  {(['Retirement Outlook', 'Confidence', 'Comparisons'] as AnalysisSubTab[]).map(sub => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubTab(sub)}
                      className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-all rounded-[1px] ${
                        activeSubTab === sub
                        ? 'bg-[#C5A059] text-[#FAF9F6] font-bold'
                        : 'text-[#8C8670] hover:text-[#2C3338]'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                {/* Scenario Explanation - Only show on Comparisons tab */}
                {activeSubTab === 'Comparisons' && (
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#C5A059] rounded-full" />
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-[#2C3338] font-bold">Baseline Plan</p>
                          <p className="text-[10px] text-[#8C8670]">Your current trajectory based on existing assets and contributions.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-[#1E5C38] rounded-full" />
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-[#2C3338] font-bold">Proposed Plan</p>
                          <p className="text-[10px] text-[#8C8670]">The impact of suggested adjustments, like increased savings or optimized claiming.</p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-auto bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-[2px]">
                      <label className="block text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-3">Proposed Savings Increase (%)</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="1" 
                          max="2" 
                          step="0.05" 
                          value={proposedMultiplier}
                          onChange={(e) => setProposedMultiplier(Number(e.target.value))}
                          className="w-48 accent-[#C5A059]"
                        />
                        <span className="text-sm font-mono text-[#2C3338] font-bold">+{Math.round((proposedMultiplier - 1) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Chart Section */}
              <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Activity className="text-[#C5A059]" size={20} />
                    <h3 className="text-xl font-serif font-bold text-[#2C3338]">
                      {activeSubTab === 'Comparisons' ? 'Scenario Analysis - Invested Assets' : 
                       activeSubTab === 'Confidence' ? 'Monte Carlo Range of Outcomes' :
                       activeSubTab === 'Retirement Outlook' ? 'Retirement Outlook & Success' :
                       'Retirement Income Breakdown'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    {activeSubTab !== 'Retirement Outlook' && (
                      <select className="bg-[#FAF9F6] border border-[#E8E4D0] text-[10px] font-mono uppercase tracking-widest text-[#2C3338] px-3 py-1.5 focus:outline-none focus:border-[#C5A059]">
                        <option>Baseline</option>
                        <option>Proposed Plan</option>
                      </select>
                    )}
                    <button className="p-2 hover:bg-[#E8E4D0] rounded-[2px] transition-colors text-[#8C8670] hover:text-[#2C3338]">
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  {activeSubTab === 'Retirement Outlook' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full overflow-y-auto pr-2">
                      {/* Shrunk Probability Card */}
                      <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] flex flex-col justify-center text-center relative overflow-hidden group hover:border-[#C5A059] transition-all">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-50" />
                        <p className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Probability of Success</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-serif font-bold text-[#2C3338] italic">92</span>
                          <span className="text-xl font-serif text-[#C5A059]">%</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 justify-center">
                          <ShieldCheck className="text-[#1E5C38]" size={14} />
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#1E5C38] font-bold">High Confidence</span>
                        </div>
                      </div>

                      {/* Income Sources Card */}
                      <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] flex flex-col justify-between">
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-4">Income Sources</p>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Investments</span>
                              <span className="text-[11px] font-mono text-[#1E5C38] font-bold">72%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Social Security</span>
                              <span className="text-[11px] font-mono text-[#1E5C38] font-bold">18%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Pensions</span>
                              <span className="text-[11px] font-mono text-[#1E5C38] font-bold">10%</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-[#E8E4D0]">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-1">Total Annual Income</p>
                          <p className="text-xl font-serif font-bold text-[#2C3338]">{formatCurrency(goals.find(g => g.id === 'g1')?.value ? goals.find(g => g.id === 'g1')!.value * 12 : 0)}</p>
                        </div>
                      </div>

                      {/* Expense Breakdown Card */}
                      <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] flex flex-col justify-between">
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-4">Expense Breakdown</p>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Essential</span>
                              <span className="text-[11px] font-mono text-[#8B0000] font-bold">65%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Healthcare</span>
                              <span className="text-[11px] font-mono text-[#8B0000] font-bold">15%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Discretionary</span>
                              <span className="text-[11px] font-mono text-[#8B0000] font-bold">20%</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-[#E8E4D0]">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-1">Annual Expenses</p>
                          <p className="text-xl font-serif font-bold text-[#2C3338]">{formatCurrency(goals.reduce((sum, g) => sum + (g.period === 'Monthly' ? g.value * 12 : g.value), 0))}</p>
                        </div>
                      </div>

                      {/* Tax Efficiency Card */}
                      <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] flex flex-col justify-between">
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-4">Tax Efficiency</p>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Effective Rate</span>
                              <span className="text-[11px] font-mono text-[#C5A059] font-bold">
                                {(() => {
                                  const totalTax = projectionData.reduce((sum, d) => sum + d.taxPaid, 0);
                                  const totalWithdrawal = projectionData.reduce((sum, d) => sum + (d.withdrawalRate > 0 ? (d.withdrawalRate / 100) * d.balance : 0), 0);
                                  return totalWithdrawal > 0 ? ((totalTax / totalWithdrawal) * 100).toFixed(1) + '%' : '0.0%';
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Tax-Free</span>
                              <span className="text-[11px] font-mono text-[#C5A059] font-bold">
                                {(() => {
                                  const retirementStart = projectionData.find(d => d.age === retirementAge);
                                  if (!retirementStart || retirementStart.balance === 0) return '0%';
                                  return ((retirementStart.taxFreeBalance / retirementStart.balance) * 100).toFixed(0) + '%';
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#2C3338]">Tax-Deferred</span>
                              <span className="text-[11px] font-mono text-[#C5A059] font-bold">
                                {(() => {
                                  const retirementStart = projectionData.find(d => d.age === retirementAge);
                                  if (!retirementStart || retirementStart.balance === 0) return '0%';
                                  return ((retirementStart.taxDeferredBalance / retirementStart.balance) * 100).toFixed(0) + '%';
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-[#E8E4D0]">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-1">Lifetime Tax</p>
                          <p className="text-xl font-serif font-bold text-[#2C3338]">
                            {formatCurrency(projectionData.reduce((sum, d) => sum + d.taxPaid, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {activeSubTab === 'Comparisons' ? (
                        <AreaChart data={comparisonData}>
                          <defs>
                            <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorProposed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1E5C38" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#1E5C38" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D0" vertical={false} />
                          <XAxis dataKey="age" stroke="#8C8670" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                          <YAxis stroke="#8C8670" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#FAF9F6', border: '1px solid #E8E4D0', borderRadius: '2px' }}
                            itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                            labelStyle={{ color: '#8C8670', marginBottom: '4px', fontSize: '10px' }}
                            labelFormatter={(label) => `Age: ${label}`}
                            formatter={(v: number) => [formatCurrency(v), 'Balance']}
                          />
                          <Area type="monotone" dataKey="balance" name="Baseline" stroke="#C5A059" fillOpacity={1} fill="url(#colorBaseline)" strokeWidth={2} />
                          <Area type="monotone" dataKey="proposedBalance" name="Proposed" stroke="#1E5C38" fillOpacity={1} fill="url(#colorProposed)" strokeWidth={2} />
                        </AreaChart>
                      ) : (
                        <div className="h-full flex flex-col">
                          <div className="flex-1">
                            <AreaChart data={confidenceData}>
                              <defs>
                                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#C5A059" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                              <XAxis dataKey="age" stroke="#6E8A96" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                              <YAxis stroke="#6E8A96" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#FAF9F6', border: '1px solid #E8E4D0', borderRadius: '2px' }}
                                itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                                labelStyle={{ color: '#6E8A96', marginBottom: '4px', fontSize: '10px' }}
                                labelFormatter={(label) => `Age: ${label}`}
                                formatter={(v: number) => [formatCurrency(v), 'Balance']}
                              />
                              <Area type="monotone" dataKey="bestCase" name="Best Case" stroke="#1E5C38" fill="transparent" strokeDasharray="5 5" />
                              <Area type="monotone" dataKey="worstCase" name="Worst Case" stroke="#8B0000" fill="transparent" strokeDasharray="5 5" />
                              <Area type="monotone" dataKey="medianCase" name="Median Outcome" stroke="#C5A059" fillOpacity={1} fill="url(#colorConfidence)" strokeWidth={2} />
                            </AreaChart>
                          </div>
                          <div className="mt-6 flex flex-wrap gap-6 justify-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-[#1E5C38] rounded-full border border-[#1E5C38]" style={{ borderStyle: 'dashed' }} />
                              <span className="text-[10px] font-mono text-[#8C8670] uppercase tracking-widest">Best Case (Top 5%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-[#C5A059] rounded-full" />
                              <span className="text-[10px] font-mono text-[#8C8670] uppercase tracking-widest">Median Outcome (Expected)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-[#8B0000] rounded-full border border-[#8B0000]" style={{ borderStyle: 'dashed' }} />
                              <span className="text-[10px] font-mono text-[#8C8670] uppercase tracking-widest">Worst Case (Bottom 5%)</span>
                            </div>
                          </div>
                          <div className="mt-4 p-4 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px]">
                            <p className="text-[11px] text-[#8C8670] leading-relaxed text-center italic">
                              This range represents 1,000 simulations of your plan. The "Worst Case" shows how you'd fare in a prolonged market downturn, while "Best Case" assumes favorable returns.
                            </p>
                          </div>
                        </div>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="mt-8 flex flex-col md:flex-row items-center justify-end gap-12">
                  <div className="text-right group relative">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Info size={10} className="text-[#8C8670]" />
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">Ending Assets</p>
                    </div>
                    <p className="text-3xl font-serif font-bold text-[#2C3338]">
                      {formatCurrency(projectionData[projectionData.length - 1].balance)}
                    </p>
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] text-[10px] text-[#8C8670] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      The projected total value of all your investment accounts at the end of your plan (Age {lifeExpectancy}).
                    </div>
                  </div>
                  <div className="text-right group relative">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Info size={10} className="text-[#8C8670]" />
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">Income Stability</p>
                    </div>
                    <p className="text-3xl font-serif font-bold text-[#2C3338]">92%</p>
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] text-[10px] text-[#8C8670] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      A measure of how reliably your portfolio can support your desired lifestyle without depletion.
                    </div>
                  </div>
                </div>
              </section>

              {/* Retirement Income & Goals Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Target className="text-[#C5A059]" size={24} />
                    <h3 className="text-2xl font-serif font-bold text-[#2C3338] italic">Retirement Income & Goals</h3>
                  </div>
                  <button className="px-4 py-2 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[10px] font-mono uppercase tracking-widest hover:bg-[#C5A059]/20 transition-all">
                    Add Goal +
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Static Retirement Age Card */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] relative group overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                        <UserIcon size={20} />
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670]">RETIREMENT</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#2C3338] mb-4">{planningType === 'Couple' ? 'Retirement Ages' : 'Retirement Age'}</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono uppercase text-[#8C8670]">
                            {primaryName ? `${primaryName}'s Target` : 'Target Age'}
                          </span>
                          <input 
                            type="number" 
                            value={retirementAge} 
                            onChange={(e) => setRetirementAge(Number(e.target.value))}
                            className="bg-[#FAF9F6] text-[#2C3338] font-mono text-sm border border-[#E8E4D0] focus:border-[#C5A059] outline-none w-16 px-2 py-1 rounded-[2px] text-right transition-all"
                          />
                        </div>
                        {planningType === 'Couple' && (
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono uppercase text-[#8C8670]">
                              {spouseName ? `${spouseName}'s Target` : 'the right person\'s Target'}
                            </span>
                            <input 
                              type="number" 
                              value={spouseRetirementAge} 
                              onChange={(e) => setSpouseRetirementAge(Number(e.target.value))}
                              className="bg-[#FAF9F6] text-[#2C3338] font-mono text-sm border border-[#E8E4D0] focus:border-[#C5A059] outline-none w-16 px-2 py-1 rounded-[2px] text-right transition-all"
                            />
                          </div>
                        )}
                      </div>
                      <div className="h-px bg-[#E8E4D0]" />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase text-[#8C8670]">Life Expectancy</span>
                        <input 
                          type="number" 
                          value={lifeExpectancy} 
                          onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                          className="bg-[#FAF9F6] text-[#2C3338] font-mono text-sm border border-[#E8E4D0] focus:border-[#C5A059] outline-none w-16 px-2 py-1 rounded-[2px] text-right transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Security Box */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] relative group overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670]">INCOME</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#2C3338] mb-4">Social Security</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8C8670]">Monthly Est.</span>
                        <div className="flex items-center">
                          <span className="text-sm font-mono text-[#8C8670] mr-1">$</span>
                          <input 
                            type="number" 
                            value={socialSecurity.monthly}
                            onChange={(e) => setSocialSecurity({...socialSecurity, monthly: Number(e.target.value)})}
                            className="bg-transparent text-[#2C3338] font-mono text-sm font-bold border-b border-transparent focus:border-[#C5A059] outline-none w-16 text-right transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8C8670]">Claiming Age</span>
                        <input 
                          type="number" 
                          value={socialSecurity.age}
                          onChange={(e) => setSocialSecurity({...socialSecurity, age: Number(e.target.value)})}
                          className="bg-transparent text-[#C5A059] font-mono text-xs font-bold border-b border-transparent focus:border-[#C5A059] outline-none w-12 text-right transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pensions Box */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] relative group overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                        <Briefcase size={20} />
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670]">INCOME</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#2C3338] mb-4">Pensions</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8C8670]">Annual Est.</span>
                        <div className="flex items-center">
                          <span className="text-sm font-mono text-[#8C8670] mr-1">$</span>
                          <input 
                            type="number" 
                            value={pension.annual}
                            onChange={(e) => setPension({...pension, annual: Number(e.target.value)})}
                            className="bg-transparent text-[#2C3338] font-mono text-sm font-bold border-b border-transparent focus:border-[#C5A059] outline-none w-20 text-right transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8C8670]">COLA Adj.</span>
                        <button 
                          onClick={() => setPension({...pension, cola: !pension.cola})}
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-[2px] transition-colors ${pension.cola ? 'bg-[#1E5C38]/20 text-[#1E5C38]' : 'bg-[#E8E4D0] text-[#8C8670]'}`}
                        >
                          {pension.cola ? 'YES' : 'NO'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Deferred Assets Box */}
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] relative group overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                        <TrendingUp size={20} />
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670]">ASSETS</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#2C3338] mb-4">Deferred Assets</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8C8670]">Total Value</span>
                        <div className="flex items-center">
                          <span className="text-sm font-mono text-[#8C8670] mr-1">$</span>
                          <input 
                            type="number" 
                            value={deferredAssets.value}
                            onChange={(e) => setDeferredAssets({...deferredAssets, value: Number(e.target.value)})}
                            className="bg-transparent text-[#2C3338] font-mono text-sm font-bold border-b border-transparent focus:border-[#C5A059] outline-none w-24 text-right transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#8C8670]">Tax Status</span>
                        <div className="flex items-center space-x-1 bg-[#FAF9F6] border border-[#E8E4D0] p-0.5 rounded-[2px]">
                          {['Taxable', 'Deferred', 'Free'].map(status => {
                            const fullStatus = status === 'Deferred' ? 'DEFERRED' : status === 'Free' ? 'TAX-FREE' : 'TAXABLE';
                            const isSelected = deferredAssets.status === fullStatus;
                            return (
                              <button
                                key={status}
                                onClick={() => setDeferredAssets({...deferredAssets, status: fullStatus})}
                                className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-[2px] transition-colors ${
                                  isSelected ? 'bg-[#E8E4D0] text-[#C5A059]' : 'text-[#8C8670] hover:text-[#2C3338]'
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {goals.map(goal => (
                    <div key={goal.id} className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] relative group overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                          {goal.icon}
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670]">{goal.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#2C3338] mb-4">{goal.title}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[#8C8670]">{goal.period} amount</span>
                          <span className="text-sm font-mono text-[#2C3338] font-bold">{formatCurrency(goal.value)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[#8C8670]">Inflation Adj.</span>
                          <span className="text-xs font-mono text-[#1E5C38] font-bold">YES</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Core Assumptions & Accounts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                  <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px]">
                    <div className="flex items-center gap-3 mb-8">
                      <Calculator className="text-[#C5A059]" size={24} />
                      <h3 className="text-2xl font-serif font-bold text-[#2C3338]">Core Assumptions</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Current Age</label>
                          <input 
                            type="number" 
                            value={currentAge} 
                            onChange={(e) => setCurrentAge(Number(e.target.value))}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Target Retirement Age</label>
                          <input 
                            type="number" 
                            value={retirementAge} 
                            onChange={(e) => setRetirementAge(Number(e.target.value))}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Life Expectancy</label>
                          <input 
                            type="number" 
                            value={lifeExpectancy} 
                            onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none transition-colors" 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Expected Inflation Rate (%)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            value={inflationRate} 
                            onChange={(e) => setInflationRate(Number(e.target.value))}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Pre-Retirement Return (%)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            value={preRetirementReturn} 
                            onChange={(e) => setPreRetirementReturn(Number(e.target.value))}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Post-Retirement Return (%)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            value={postRetirementReturn} 
                            onChange={(e) => setPostRetirementReturn(Number(e.target.value))}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none transition-colors" 
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px]">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <PieChart className="text-[#C5A059]" size={24} />
                        <h3 className="text-2xl font-serif font-bold text-[#2C3338]">Invested Assets</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setIsAddAccountOpen(true)}
                          className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors"
                        >
                          Add Account +
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">ETS:</span>
                          <div className="flex items-center space-x-1 bg-[#FAF9F6] border border-[#E8E4D0] p-0.5 rounded-[2px]">
                            {['Taxable', 'Deferred', 'Free'].map(status => {
                              const fullStatus = status === 'Deferred' ? 'DEFERRED' : status === 'Free' ? 'TAX-FREE' : 'TAXABLE';
                              const isSelected = deferredAssets.status === fullStatus;
                              return (
                                <button
                                  key={status}
                                  onClick={() => setDeferredAssets({...deferredAssets, status: fullStatus})}
                                  className={`px-2 py-1 text-[9px] font-mono uppercase tracking-widest rounded-[1px] transition-colors ${
                                    isSelected ? 'bg-[#C5A059] text-black font-bold' : 'text-[#8C8670] hover:text-[#2C3338]'
                                  }`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {combinedAccounts.map(acc => (
                        <div key={acc.id} className="bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] group hover:border-[#C5A059]/50 transition-all overflow-hidden">
                          <div 
                            className="flex items-center justify-between p-4 cursor-pointer"
                            onClick={() => setExpandedAccountId(expandedAccountId === acc.id ? null : acc.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#8C8670] group-hover:text-[#C5A059]">
                                <DollarSign size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-[#2C3338]">{acc.name}</p>
                                  {manualAccounts.some(ma => ma.id === acc.id) && (
                                    <span className="text-[8px] font-mono uppercase px-1 bg-[#C5A059]/20 text-[#C5A059] rounded-[1px]">Manual</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm font-mono text-[#2C3338] font-bold">{formatCurrency(acc.balance)}</p>
                                <p className="text-[9px] font-mono text-[#1E5C38]">+{formatCurrency(acc.annualContribution)}/yr</p>
                              </div>
                              <div className="text-[#8C8670]">
                                {expandedAccountId === acc.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedAccountId === acc.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-[#E8E4D0] bg-[#FAF9F6]"
                              >
                                <div className="p-6 space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <label className="block text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Annual Contribution</label>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8670] text-xs">$</span>
                                        <input 
                                          type="number"
                                          value={acc.annualContribution}
                                          onChange={(e) => handleUpdateAccountContribution(acc.id, Number(e.target.value))}
                                          className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] pl-7 pr-4 py-2 text-[#2C3338] font-mono text-sm focus:border-[#C5A059] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-mono uppercase tracking-widest text-[#8C8670] mb-2">Estimated Growth Rate (%)</label>
                                      <input 
                                        type="number"
                                        step="0.1"
                                        defaultValue={7.0}
                                        className="w-full bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-4 py-2 text-[#2C3338] font-mono text-sm focus:border-[#C5A059] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-[2px]">
                                    <h5 className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] mb-3 flex items-center gap-2">
                                      <Calculator size={12} /> Projection Calculator
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-[9px] font-mono uppercase text-[#8C8670] mb-1">Value at Retirement</p>
                                        <p className="text-lg font-serif font-bold text-[#2C3338]">
                                          {formatCurrency(
                                            acc.balance * Math.pow(1.07, retirementAge - currentAge) + 
                                            acc.annualContribution * ((Math.pow(1.07, retirementAge - currentAge) - 1) / 0.07)
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-mono uppercase text-[#8C8670] mb-1">Total Contributions</p>
                                        <p className="text-lg font-serif font-bold text-[#2C3338]">
                                          {formatCurrency(acc.annualContribution * (retirementAge - currentAge))}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-4 border-t border-[#E8E4D0]">
                                    <div className="flex gap-4">
                                      {manualAccounts.some(ma => ma.id === acc.id) && (
                                        <button 
                                          onClick={() => handleDeleteManualAccount(acc.id)}
                                          className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-[#8B0000] hover:text-red-600 transition-colors"
                                        >
                                          <Trash2 size={12} /> Delete Account
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-[9px] font-mono text-[#6E8A96] italic">Changes are saved automatically and reflected in the charts above.</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Future Inflows Section */}
                  <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px]">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-[#C5A059]" size={24} />
                        <h3 className="text-2xl font-serif font-bold text-[#2C3338]">Manual Projections</h3>
                      </div>
                      <button 
                        onClick={() => setIsAddInflowOpen(true)}
                        className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors"
                      >
                        Add Inflow +
                      </button>
                    </div>

                    <div className="space-y-4">
                      {futureInflows.length === 0 ? (
                        <div className="p-8 border border-dashed border-[#E8E4D0] rounded-[2px] text-center">
                          <p className="text-xs text-[#6E8A96]">No manual inflows projected (e.g. inheritance, property sale).</p>
                        </div>
                      ) : (
                        futureInflows.map(inflow => (
                          <div key={inflow.id} className="flex items-center justify-between p-4 bg-[#F5F2E1] border border-[#E8E4D0] rounded-[2px] group hover:border-[#C5A059] transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-[#FAF9F6] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                                <Plus size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#2C3338]">{inflow.name}</p>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96]">At Age {inflow.age}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm font-mono text-[#1E5C38] font-bold">+{formatCurrency(inflow.amount)}</p>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96]">Lump Sum</p>
                              </div>
                              <button 
                                onClick={() => handleDeleteInflow(inflow.id)}
                                className="p-2 text-[#6E8A96] hover:text-[#8B0000] transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <ShieldCheck size={150} />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#2C3338] mb-6 flex items-center gap-3 italic relative z-10">
                      <Activity size={18} className="text-[#C5A059]" />
                      Projection Results
                    </h3>
                    
                    <div className="space-y-6 relative z-10">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-1">Portfolio at Retirement</p>
                        <p className="text-3xl font-serif font-bold text-[#2C3338]">
                          {formatCurrency(projectionData.find(d => d.age === retirementAge)?.balance || 0)}
                        </p>
                      </div>
                      
                      <div className="h-px w-full bg-[#E8E4D0]" />
                      
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-1">Estimated Monthly Income</p>
                        <p className="text-3xl font-serif font-bold text-[#1E5C38]">
                          {formatCurrency((goals.find(g => g.id === 'g1')?.value || 0))}
                        </p>
                      </div>

                      <div className="p-4 bg-[#1E5C38]/10 border border-[#1E5C38]/20 rounded-[2px]">
                        <p className="text-sm text-[#1E5C38] font-bold flex items-center gap-2">
                          <ShieldCheck size={16} /> On Track
                        </p>
                        <p className="text-xs text-[#6E8A96] mt-1">Your current trajectory exceeds your required portfolio target.</p>
                      </div>
                      
                      <button className="w-full py-4 bg-[#C5A059] hover:bg-[#D4AF68] text-[#FAF9F6] font-mono text-xs uppercase tracking-widest font-bold rounded-[2px] transition-colors flex items-center justify-center gap-2 mt-4">
                        Run Full Monte Carlo <ArrowRight size={14} />
                      </button>
                    </div>
                  </section>

                  <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px]">
                    <h3 className="font-serif text-lg font-bold text-[#2C3338] mb-6 flex items-center gap-3 italic">
                      <Info size={18} className="text-[#C5A059]" />
                      Strategic Insights
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-[#F5F2E1] border-l-2 border-[#C5A059]">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] mb-1">Optimization</p>
                        <p className="text-xs text-[#2C3338] leading-relaxed">
                          Increasing your 401(k) contribution by just 2% could add an estimated $180k to your ending assets.
                        </p>
                      </div>
                      <div className="p-4 bg-[#F5F2E1] border-l-2 border-[#6E8A96]">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-1">Risk Alert</p>
                        <p className="text-xs text-[#2C3338] leading-relaxed">
                          Your withdrawal rate exceeds 4% in later years. Consider adjusting your post-retirement return assumptions.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Stress Test' && (
            <motion.div
              key="stress-test"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-serif font-bold text-[#2C3338] italic mb-2">Stress Testing</h2>
                  <p className="text-[#6E8A96] max-w-2xl text-sm leading-relaxed">
                    Evaluate how your retirement plan holds up against significant market downturns, high inflation, or unexpected health events.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="relative h-48 rounded-[2px] overflow-hidden border border-[#E8E4D0]">
                    <img 
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200" 
                      alt="Modern Architecture" 
                      className="w-full h-full object-cover opacity-30"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FAF9F6] via-transparent to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-center px-12">
                      <h3 className="text-2xl font-serif font-bold text-[#2C3338] italic mb-2">Portfolio Projections</h3>
                      <p className="text-xs text-[#6E8A96] max-w-md">Visualizing your wealth accumulation over the next {retirementAge - currentAge} years.</p>
                    </div>
                  </div>

                  <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px]">
                    <h3 className="text-xl font-serif font-bold text-[#2C3338] mb-6">Market Crash Scenario (-25%)</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionData.map(d => ({ ...d, balance: d.age === currentAge ? d.balance * 0.75 : d.balance }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D0" vertical={false} />
                          <XAxis dataKey="age" stroke="#6E8A96" fontSize={10} fontFamily="monospace" />
                          <YAxis stroke="#6E8A96" fontSize={10} fontFamily="monospace" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#FAF9F6', border: '1px solid #E8E4D0', color: '#2C3338' }}
                            itemStyle={{ color: '#2C3338' }}
                            formatter={(v: number) => [formatCurrency(v), 'Portfolio Balance']}
                          />
                          <Area type="monotone" dataKey="balance" stroke="#8B0000" fill="#8B0000" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-[#8B0000]/10 border border-[#8B0000]/20 rounded-[2px]">
                      <p className="text-sm text-[#8B0000] font-bold">Impact Analysis</p>
                      <p className="text-xs text-[#6E8A96] mt-1">
                        A 25% market drop today would reduce your ending assets by approximately {formatCurrency(projectionData[projectionData.length-1].balance * 0.25)}.
                      </p>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px]">
                    <h4 className="text-sm font-bold text-[#2C3338] mb-4 uppercase tracking-widest font-mono text-[10px]">Stress Scenarios</h4>
                    <div className="space-y-3">
                      <button className="w-full p-3 text-left bg-[#E8E4D0] border border-[#C5A059] text-[#2C3338] text-xs rounded-[2px]">Market Crash (-25%)</button>
                      <button className="w-full p-3 text-left bg-[#F5F2E1] border border-[#E8E4D0] text-[#6E8A96] text-xs rounded-[2px] hover:border-[#C5A059] transition-colors">High Inflation (6%)</button>
                      <button className="w-full p-3 text-left bg-[#F5F2E1] border border-[#E8E4D0] text-[#6E8A96] text-xs rounded-[2px] hover:border-[#C5A059] transition-colors">Long Term Care Event</button>
                      <button className="w-full p-3 text-left bg-[#F5F2E1] border border-[#E8E4D0] text-[#6E8A96] text-xs rounded-[2px] hover:border-[#C5A059] transition-colors">Early Retirement (-5 yrs)</button>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px]">
                    <h4 className="text-sm font-bold text-[#2C3338] mb-4 uppercase tracking-widest font-mono text-[10px]">Plan Resilience</h4>
                    <div className="flex items-center justify-center py-8">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path className="text-[#E8E4D0]" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          <path className="text-[#C5A059]" strokeDasharray="78, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-bold text-[#2C3338]">78%</span>
                          <span className="text-[8px] text-[#6E8A96] uppercase">Score</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-[#6E8A96] leading-relaxed">
                      Your plan shows high resilience to market volatility but moderate sensitivity to inflation.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Social Security' && (
            <motion.div
              key="social-security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-serif font-bold text-[#2C3338] italic mb-2">Social Security Optimization</h2>
                  <p className="text-[#6E8A96] max-w-2xl text-sm leading-relaxed">
                    Determine the optimal age to claim your benefits to maximize your lifetime income.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px]">
                    <h3 className="text-lg font-serif font-bold text-[#2C3338] mb-6">Benefit Estimator</h3>
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] font-bold">Your Benefits</p>
                        <div>
                          <label className="block text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Monthly Benefit (at 67)</label>
                          <input type="number" defaultValue={3200} className="w-full bg-[#F5F2E1] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Claiming Age</label>
                          <input type="range" min="62" max="70" defaultValue="67" className="w-full accent-[#C5A059]" />
                          <div className="flex justify-between text-[8px] font-mono text-[#6E8A96] mt-2">
                            <span>62</span>
                            <span>67 (FRA)</span>
                            <span>70</span>
                          </div>
                        </div>
                      </div>

                      {planningType === 'Couple' && (
                        <div className="space-y-4 pt-6 border-t border-[#E8E4D0]">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] font-bold">Spouse Benefits</p>
                          <div>
                            <label className="block text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Monthly Benefit (at 67)</label>
                            <input type="number" defaultValue={2800} className="w-full bg-[#F5F2E1] border border-[#E8E4D0] rounded-[2px] px-4 py-3 text-[#2C3338] font-mono focus:border-[#C5A059] focus:outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Claiming Age</label>
                            <input type="range" min="62" max="70" defaultValue="67" className="w-full accent-[#C5A059]" />
                            <div className="flex justify-between text-[8px] font-mono text-[#6E8A96] mt-2">
                              <span>62</span>
                              <span>67 (FRA)</span>
                              <span>70</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#C5A059] p-8 rounded-[2px] text-[#FAF9F6]">
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold mb-2">Strategic Advice</h4>
                    <p className="text-sm font-medium leading-relaxed">
                      {planningType === 'Couple' 
                        ? "For couples, coordinating claiming ages can significantly increase survivor benefits. Consider having the higher earner delay until 70."
                        : "Delaying your claim until age 70 would increase your monthly benefit by approximately 24% compared to claiming at your Full Retirement Age."
                      }
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] h-full">
                    <h3 className="text-xl font-serif font-bold text-[#2C3338] mb-8">Lifetime Benefit Comparison</h3>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { age: '62', benefit: (2240 + (planningType === 'Couple' ? 1960 : 0)) * 12 * (95-62) },
                          { age: '67', benefit: (3200 + (planningType === 'Couple' ? 2800 : 0)) * 12 * (95-67) },
                          { age: '70', benefit: (3968 + (planningType === 'Couple' ? 3472 : 0)) * 12 * (95-70) },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D0" vertical={false} />
                          <XAxis dataKey="age" stroke="#6E8A96" fontSize={10} fontFamily="monospace" label={{ value: 'Claiming Age', position: 'insideBottom', offset: -5, fill: '#6E8A96', fontSize: 10 }} />
                          <YAxis stroke="#6E8A96" fontSize={10} fontFamily="monospace" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#FAF9F6', border: '1px solid #E8E4D0', color: '#2C3338' }}
                            itemStyle={{ color: '#2C3338' }}
                            formatter={(v: number) => [formatCurrency(v), 'Total Lifetime Benefit']}
                          />
                          <Bar dataKey="benefit" fill="#C5A059" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Medicare' && (
            <motion.div
              key="medicare"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-serif font-bold text-[#2C3338] italic mb-2">Medicare Planning</h2>
                  <p className="text-[#6E8A96] max-w-2xl text-sm leading-relaxed">
                    Estimate your future healthcare costs and understand how Medicare parts A, B, and D fit into your budget.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] space-y-6">
                  <div className="w-12 h-12 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#2C3338]">Part B Premiums</h3>
                  <p className="text-sm text-[#6E8A96] leading-relaxed">
                    Standard monthly premium for 2024 is $174.70. Higher earners may pay an Income Related Monthly Adjustment Amount (IRMAA).
                  </p>
                  <div className="pt-4 border-t border-[#E8E4D0]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-1">Estimated Annual Cost {planningType === 'Couple' ? '(Couple)' : ''}</p>
                    <p className="text-2xl font-serif font-bold text-[#2C3338]">{formatCurrency(2096 * (planningType === 'Couple' ? 2 : 1))}</p>
                  </div>
                </div>

                <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] space-y-6">
                  <div className="w-12 h-12 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                    <Activity size={24} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#2C3338]">Part D & Medigap</h3>
                  <p className="text-sm text-[#6E8A96] leading-relaxed">
                    Prescription drug coverage and supplemental insurance to cover the "gaps" in original Medicare.
                  </p>
                  <div className="pt-4 border-t border-[#E8E4D0]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-1">Estimated Annual Cost {planningType === 'Couple' ? '(Couple)' : ''}</p>
                    <p className="text-2xl font-serif font-bold text-[#2C3338]">{formatCurrency(3500 * (planningType === 'Couple' ? 2 : 1))}</p>
                  </div>
                </div>

                <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] space-y-6">
                  <div className="w-12 h-12 bg-[#E8E4D0] flex items-center justify-center rounded-[2px] text-[#C5A059]">
                    <Heart size={24} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#2C3338]">Out-of-Pocket</h3>
                  <p className="text-sm text-[#6E8A96] leading-relaxed">
                    Deductibles, copayments, and coinsurance for services not fully covered by insurance.
                  </p>
                  <div className="pt-4 border-t border-[#E8E4D0]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-1">Estimated Annual Cost</p>
                    <p className="text-2xl font-serif font-bold text-[#2C3338]">$2,500</p>
                  </div>
                </div>
              </div>

              <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px]">
                <h3 className="text-xl font-serif font-bold text-[#2C3338] mb-8">Healthcare Cost Projection (Inflation Adjusted)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData.filter(d => d.age >= 65)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D0" vertical={false} />
                      <XAxis dataKey="age" stroke="#6E8A96" fontSize={10} fontFamily="monospace" />
                      <YAxis stroke="#6E8A96" fontSize={10} fontFamily="monospace" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FAF9F6', border: '1px solid #E8E4D0', color: '#2C3338' }}
                        itemStyle={{ color: '#2C3338' }}
                        formatter={(v: number) => [formatCurrency(v * 0.15), 'Annual Health Costs']}
                      />
                      <Area type="monotone" dataKey="outflows" stroke="#C5A059" fill="#C5A059" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'Cash Flows' && (
            <motion.div
              key="cashflows"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-serif font-bold text-[#2C3338] italic mb-2">Cash Flow Summary</h2>
                  <p className="text-[#6E8A96] font-mono text-sm uppercase tracking-widest">Annual projection of all inflows and outflows</p>
                </div>
                <div className="flex items-center gap-4">
                  <select className="bg-[#FAF9F6] border border-[#E8E4D0] text-[10px] font-mono uppercase tracking-widest text-[#2C3338] px-4 py-2 focus:outline-none focus:border-[#C5A059]">
                    <option>Proposed plan</option>
                    <option>Current plan</option>
                  </select>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#E8E4D0] text-[#2C3338] text-[10px] font-mono uppercase tracking-widest rounded-[2px] hover:bg-[#D4AF68] transition-all">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#E8E4D0] rounded-[2px]">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-[#E8E4D0]">
                      <th rowSpan={2} className="p-4 text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">Year</th>
                      <th rowSpan={2} className="p-4 text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">{planningType === 'Couple' ? 'Ages (You/Spouse)' : 'Age'}</th>
                      <th colSpan={3} className="p-2 text-center text-[10px] font-mono uppercase tracking-widest text-[#2C3338] border-r border-[#E8E4D0] bg-[#1E5C38]/10">Cash Inflows</th>
                      <th colSpan={4} className="p-2 text-center text-[10px] font-mono uppercase tracking-widest text-[#2C3338] border-r border-[#E8E4D0] bg-[#8B0000]/10">Cash Outflows</th>
                      <th rowSpan={2} className="p-4 text-[10px] font-mono uppercase tracking-widest text-[#6E8A96]">Net Flows</th>
                    </tr>
                    <tr className="bg-[#FAF9F6] border-b border-[#E8E4D0]">
                      <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">Income</th>
                      <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">Dist.</th>
                      <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">Total</th>
                      <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">Expenses</th>
                      <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">Goals</th>
                      <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">Tax</th>
                      <th className="p-3 text-[9px] font-mono uppercase tracking-widest text-[#6E8A96] border-r border-[#E8E4D0]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectionData.filter((_, i) => i % 5 === 0 || i === 0).map((row, idx) => {
                      const totalInflows = row.inflows + row.actualWithdrawal;
                      const totalOutflows = row.outflows + row.taxPaid;
                      const netFlows = totalInflows - totalOutflows;
                      return (
                      <tr key={idx} className="border-b border-[#E8E4D0] hover:bg-[#F5F2E1] transition-colors">
                        <td className="p-4 font-mono text-xs text-[#2C3338] border-r border-[#E8E4D0]">{row.year}</td>
                        <td className="p-4 font-mono text-xs text-[#2C3338] border-r border-[#E8E4D0]">
                          {planningType === 'Couple' ? `${row.age} / ${row.spouseAge}` : row.age}
                        </td>
                        <td className="p-4 font-mono text-xs text-[#1E5C38] border-r border-[#E8E4D0]">{formatCurrency(row.inflows)}</td>
                        <td className="p-4 font-mono text-xs text-[#1E5C38] border-r border-[#E8E4D0]">{formatCurrency(row.actualWithdrawal)}</td>
                        <td className="p-4 font-mono text-xs text-[#1E5C38] border-r border-[#E8E4D0] font-bold">{formatCurrency(totalInflows)}</td>
                        <td className="p-4 font-mono text-xs text-[#8B0000] border-r border-[#E8E4D0]">{formatCurrency(row.outflows)}</td>
                        <td className="p-4 font-mono text-xs text-[#8B0000] border-r border-[#E8E4D0]">$0</td>
                        <td className="p-4 font-mono text-xs text-[#8B0000] border-r border-[#E8E4D0]">{formatCurrency(row.taxPaid)}</td>
                        <td className="p-4 font-mono text-xs text-[#8B0000] border-r border-[#E8E4D0] font-bold">{formatCurrency(totalOutflows)}</td>
                        <td className={`p-4 font-mono text-xs font-bold ${netFlows >= 0 ? 'text-[#1E5C38]' : 'text-[#8B0000]'}`}>
                          {netFlows >= 0 ? formatCurrency(netFlows) : `(${formatCurrency(Math.abs(netFlows))})`}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab !== 'Analysis' && activeTab !== 'Cash Flows' && (
            <motion.div
              key="coming-soon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6 border border-[#333333]">
                <AlertCircle size={40} className="text-[#C5A059]" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-2 italic">{activeTab} Module</h3>
              <p className="text-[#6E8A96] max-w-md">
                We are currently refining the {activeTab} calculations and integration. 
                This module will be available in the next strategic update.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAddAccountOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddAccountOpen(false)}
              className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px] shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-bold text-white italic mb-6">Add Manual Account</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Account Name</label>
                  <input 
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="e.g. Future Inheritance"
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Current Balance</label>
                    <input 
                      type="number"
                      value={newAccount.balance}
                      onChange={(e) => setNewAccount({ ...newAccount, balance: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Annual Contribution</label>
                    <input 
                      type="number"
                      value={newAccount.annualContribution}
                      onChange={(e) => setNewAccount({ ...newAccount, annualContribution: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Account Type</label>
                  <div className="flex items-center space-x-1 bg-[#0A0A0A] border border-[#333333] p-1 rounded-[2px] w-full">
                    {['Taxable', 'Deferred', 'Free'].map(status => {
                      const fullStatus = status === 'Deferred' ? 'Tax-Deferred' : status === 'Free' ? 'Tax-Free' : 'Taxable';
                      const isSelected = newAccount.type === fullStatus;
                      return (
                        <button
                          key={status}
                          onClick={() => setNewAccount({ ...newAccount, type: fullStatus })}
                          className={`flex-1 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-[2px] transition-colors ${
                            isSelected ? 'bg-[#333333] text-white' : 'text-[#6E8A96] hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddAccountOpen(false)}
                    className="flex-1 py-3 border border-[#333333] text-[#6E8A96] font-mono text-[10px] uppercase tracking-widest hover:text-white hover:bg-[#333333] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleAddManualAccount(newAccount)}
                    className="flex-1 py-3 bg-[#C5A059] text-[#0A0A0A] font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#D4AF68] transition-all"
                  >
                    Add Account
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Inflow Modal */}
      <AnimatePresence>
        {isAddInflowOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddInflowOpen(false)}
              className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px] shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-bold text-white italic mb-6">Add Manual Projection</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Inflow Name</label>
                  <input 
                    type="text"
                    value={newInflow.name}
                    onChange={(e) => setNewInflow({ ...newInflow, name: e.target.value })}
                    placeholder="e.g. Sale of Business"
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Amount</label>
                    <input 
                      type="number"
                      value={newInflow.amount}
                      onChange={(e) => setNewInflow({ ...newInflow, amount: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">At Age</label>
                    <input 
                      type="number"
                      value={newInflow.age}
                      onChange={(e) => setNewInflow({ ...newInflow, age: Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddInflowOpen(false)}
                    className="flex-1 py-3 border border-[#333333] text-[#6E8A96] font-mono text-[10px] uppercase tracking-widest hover:text-white hover:bg-[#333333] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleAddInflow(newInflow)}
                    className="flex-1 py-3 bg-[#C5A059] text-[#0A0A0A] font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#D4AF68] transition-all"
                  >
                    Add Inflow
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Names Modal */}
      <AnimatePresence>
        {isEditingNames && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingNames(false)}
              className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px] shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-bold text-white italic mb-6">Personalize Your Plan</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Primary Name</label>
                  <input 
                    type="text"
                    value={tempPrimaryName}
                    onChange={(e) => setTempPrimaryName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6E8A96] mb-2">Spouse / Partner Name</label>
                  <input 
                    type="text"
                    value={tempSpouseName}
                    onChange={(e) => setTempSpouseName(e.target.value)}
                    placeholder="Spouse Name"
                    className="w-full bg-[#0A0A0A] border border-[#333333] rounded-[2px] px-4 py-3 text-white font-mono focus:border-[#C5A059] focus:outline-none transition-colors"
                  />
                  <p className="text-[10px] text-[#6E8A96] mt-2 italic">Tip: You can refer to them as "the right person" if you prefer.</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsEditingNames(false)}
                    className="flex-1 py-3 border border-[#333333] text-[#6E8A96] font-mono text-[10px] uppercase tracking-widest hover:text-white hover:bg-[#333333] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveNames}
                    className="flex-1 py-3 bg-[#C5A059] text-[#0A0A0A] font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#D4AF68] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
