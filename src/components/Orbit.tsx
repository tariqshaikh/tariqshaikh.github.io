import React, { useState, useMemo, useEffect, useCallback, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  MessageSquare, 
  ChevronLeft, 
  ChevronDown,
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  Home, 
  Info,
  RefreshCw,
  LogIn,
  LogOut,
  Save,
  User as UserIcon,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { 
  auth, 
  signInWithGoogle, 
  logout, 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  getDocFromServer,
  limit,
  orderBy
} from 'firebase/firestore';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: "" };
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
          <div className="bg-[#1A1A1A] border border-[#8B0000] p-8 max-w-md w-full rounded-[2px]">
            <div className="flex items-center gap-3 text-[#FF4444] mb-4">
              <AlertCircle size={24} />
              <h2 className="font-serif text-xl font-bold">System Error</h2>
            </div>
            <p className="text-[#6E8A96] text-sm mb-6 leading-relaxed">
              Orbit encountered a critical error. This is often due to a connection issue or security restriction.
            </p>
            <div className="bg-[#0A0A0A] p-4 rounded-[2px] mb-6 overflow-auto max-h-40">
              <code className="text-[10px] text-[#FF4444] font-mono break-all">{this.state.errorInfo}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#333333] text-white font-bold rounded-[2px] hover:bg-[#444444] transition-all"
            >
              Restart Simulation
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Types ---
interface Scenario {
  id: string;
  name: string;
  monthlySavings: number;
  annualReturn: number;
  initialWealth: number;
  years: number;
  oneTimeEvent?: {
    year: number;
    amount: number; // negative for expense, positive for windfall
    label: string;
  };
}

// --- Mock Data Generator ---
const generateProjection = (scenario: Scenario) => {
  const data = [];
  let currentWealth = scenario.initialWealth;
  const monthlyRate = scenario.annualReturn / 100 / 12;

  for (let year = 0; year <= scenario.years; year++) {
    data.push({
      year: 2026 + year,
      wealth: Math.round(currentWealth),
    });

    // Compound for 12 months
    for (let month = 0; month < 12; month++) {
      currentWealth = (currentWealth + scenario.monthlySavings) * (1 + monthlyRate);
    }

    // Apply one-time event if it happens this year
    if (scenario.oneTimeEvent && scenario.oneTimeEvent.year === year) {
      currentWealth += scenario.oneTimeEvent.amount;
    }
  }
  return data;
};

// --- Components ---

const StatCard = ({ label, value, subValue, icon: Icon, trend }: any) => (
  <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[2px] relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A059] opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-[#C5A059]/10 rounded-[2px]">
        <Icon size={20} className="text-[#C5A059]" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-mono ${trend > 0 ? 'text-[#1E5C38]' : 'text-[#8B0000]'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="font-mono text-[11px] uppercase tracking-widest text-[#6E8A96] mb-1">{label}</div>
    <div className="text-3xl font-serif font-bold text-white mb-1">{value}</div>
    <div className="text-[13px] text-[#6E8A96] italic">{subValue}</div>
  </div>
);

const SliderInput = ({ label, value, min, max, step, onChange, unit = "", onSync }: any) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-[#6E8A96]">{label}</label>
        {onSync && (
          <button 
            onClick={onSync}
            className="p-1 hover:bg-[#333333] rounded-[2px] text-[#C5A059] transition-colors group/sync"
            title="Sync with latest ledger snapshot"
          >
            <RefreshCw size={12} className="group-hover/sync:rotate-180 transition-transform duration-500" />
          </button>
        )}
      </div>
      <span className="font-serif font-bold text-[#C5A059] text-lg">{unit}{value.toLocaleString()}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
    />
  </div>
);

function Orbit() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [scenario, setScenario] = useState<Scenario>({
    id: 'default',
    name: 'Current Path',
    monthlySavings: 2500,
    annualReturn: 7,
    initialWealth: 150000,
    years: 30,
  });

  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [latestNetWorth, setLatestNetWorth] = useState<number | null>(null);
  const [hasSyncedInitialWealth, setHasSyncedInitialWealth] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiCoach, setShowAiCoach] = useState(false);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      // Redirect to dashboard if logged in and on landing page
      if (currentUser && location.pathname === '/orbit') {
        navigate('/orbit/dashboard');
      }
    });
    return () => unsubscribe();
  }, [location.pathname, navigate]);

  // Validate connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) {
      setSavedScenarios([]);
      return;
    }

    const scenariosRef = collection(db, 'users', user.uid, 'scenarios');
    const unsubscribe = onSnapshot(scenariosRef, (snapshot) => {
      const scenarios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Scenario[];
      setSavedScenarios(scenarios);
      
      // If we have a default scenario, load it
      if (scenarios.length > 0 && scenario.id === 'default') {
        setScenario(scenarios[0]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/scenarios`);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // Fetch latest ledger snapshot
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const historyRef = query(
      collection(db, 'users', user.uid, 'netWorthHistory'),
      orderBy('date', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(historyRef, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        setLatestNetWorth(latest.netWorth);
        
        // Auto-sync once on initial load if it's the default scenario
        if (!hasSyncedInitialWealth && scenario.id === 'default') {
          setScenario(prev => ({
            ...prev,
            initialWealth: latest.netWorth
          }));
          setHasSyncedInitialWealth(true);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'netWorthHistory');
    });

    return () => unsub();
  }, [user, isAuthReady, hasSyncedInitialWealth, scenario.id]);

  const handleSyncWithLedger = () => {
    if (latestNetWorth !== null) {
      setScenario(prev => ({
        ...prev,
        initialWealth: latestNetWorth
      }));
    }
  };

  const handleSaveScenario = async () => {
    if (!user) {
      alert("Please sign in to save your scenarios.");
      return;
    }

    setIsSaving(true);
    const scenarioId = scenario.id === 'default' ? doc(collection(db, 'users', user.uid, 'scenarios')).id : scenario.id;
    const path = `users/${user.uid}/scenarios/${scenarioId}`;
    
    try {
      await setDoc(doc(db, path), {
        ...scenario,
        id: scenarioId,
        userId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setScenario(prev => ({ ...prev, id: scenarioId }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Calculations ---
  const projectionData = useMemo(() => generateProjection(scenario), [scenario]);
  const finalWealth = projectionData[projectionData.length - 1].wealth;
  const totalInvested = scenario.initialWealth + (scenario.monthlySavings * 12 * scenario.years);
  const totalInterest = finalWealth - totalInvested;

  // --- AI Logic ---
  const askAiCoach = async () => {
    setIsAiLoading(true);
    setShowAiCoach(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        As a strategic wealth coach, analyze this financial scenario:
        - Current Wealth: $${scenario.initialWealth.toLocaleString()}
        - Monthly Savings: $${scenario.monthlySavings.toLocaleString()}
        - Expected Annual Return: ${scenario.annualReturn}%
        - Time Horizon: ${scenario.years} years
        - Projected Final Wealth: $${finalWealth.toLocaleString()}
        
        Provide 3 high-impact strategic insights or "What-If" scenarios the user should consider to reach their goals faster. Keep it professional, punchy, and strategic. Use markdown.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setAiResponse(response.text || "I'm analyzing your trajectory...");
    } catch (error) {
      console.error("AI Coach Error:", error);
      setAiResponse("I'm having trouble connecting to the financial markets right now. Please try again later.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#D1D1D1] font-sans selection:bg-[#C5A059]/30">
      {/* Header */}
      <header className="border-b border-[#333333] bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="p-2 hover:bg-[#1A1A1A] rounded-[2px] transition-colors group">
              <ChevronLeft size={20} className="text-[#6E8A96] group-hover:text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C5A059] rounded-[2px] flex items-center justify-center">
                <TrendingUp size={24} className="text-[#0A0A0A]" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-white italic leading-none">Orbit</h1>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A059] mt-1">Wealth Intelligence</p>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 mr-4">
            {user && (
              <>
                <Link to="/orbit/dashboard" className="text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white transition-colors">Dashboard</Link>
                
                <div className="relative group py-2">
                  <button className="text-[11px] font-mono uppercase tracking-widest text-white transition-colors flex items-center gap-1">
                    Tools <ChevronDown size={12} />
                  </button>
                  <div className="absolute top-full right-0 w-48 bg-[#1A1A1A] border border-[#333333] rounded-[2px] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                    <Link to="/orbit/balance-sheet" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left">Balance Sheet</Link>
                    <Link to="/orbit/retirement-planner" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left">Retirement Planner</Link>
                    <Link to="/orbit/simulator" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-white bg-[#333333] transition-colors text-left">Wealth Simulator</Link>
                    <Link to="/orbit/history" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left">Historical Performance</Link>
                    <Link to="/orbit/currency-converter" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white hover:bg-[#333333] transition-colors text-left">Currency Converter</Link>
                  </div>
                </div>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">{user.displayName}</div>
                  <div className="text-[10px] text-[#6E8A96] font-mono">{user.email}</div>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-[2px] border border-[#333333]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 bg-[#1A1A1A] border border-[#333333] rounded-[2px] flex items-center justify-center">
                    <UserIcon size={20} className="text-[#6E8A96]" />
                  </div>
                )}
                <button 
                  onClick={logout}
                  className="p-2.5 bg-[#1A1A1A] border border-[#333333] text-[#6E8A96] rounded-[2px] hover:text-white hover:border-[#8B0000] transition-all"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A059] text-[#0A0A0A] rounded-[2px] text-sm font-bold hover:bg-[#B38F48] transition-all"
              >
                <LogIn size={18} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!user && isAuthReady ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl"
            >
              <h2 className="text-6xl md:text-8xl font-serif font-bold text-white mb-8 italic leading-tight">
                Master Your <span className="text-[#C5A059]">Financial</span> Orbit.
              </h2>
              <p className="text-xl text-[#6E8A96] mb-12 leading-relaxed max-w-2xl mx-auto">
                The premium wealth simulator for strategic minds. Track net worth, simulate life events, and receive AI-driven financial audits.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button 
                  onClick={signInWithGoogle}
                  className="w-full sm:w-auto px-10 py-5 bg-[#C5A059] text-[#0A0A0A] rounded-[2px] text-lg font-bold hover:bg-[#B38F48] transition-all flex items-center justify-center gap-3"
                >
                  <LogIn size={24} />
                  Get Started with Google
                </button>
                <Link 
                  to="/"
                  className="w-full sm:w-auto px-10 py-5 border border-[#333333] text-white rounded-[2px] text-lg font-bold hover:bg-[#1A1A1A] transition-all"
                >
                  Back to Portfolio
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Controls */}
            <div className="lg:col-span-4 space-y-8">
              <section className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px]">
                <h2 className="font-serif text-xl font-bold text-white mb-8 flex items-center gap-3">
                  <Target size={20} className="text-[#C5A059]" />
                  Simulation Parameters
                </h2>
                
                <SliderInput 
                  label="Initial Wealth" 
                  value={scenario.initialWealth} 
                  min={0} 
                  max={Math.max(1000000, Math.ceil(scenario.initialWealth / 100000) * 100000 * 2)} 
                  step={1000} 
                  unit="$"
                  onChange={(v: number) => setScenario({...scenario, initialWealth: v})}
                  onSync={latestNetWorth !== null ? handleSyncWithLedger : null}
                />
                
                <SliderInput 
                  label="Monthly Savings" 
                  value={scenario.monthlySavings} 
                  min={0} 
                  max={20000} 
                  step={100} 
                  unit="$"
                  onChange={(v: number) => setScenario({...scenario, monthlySavings: v})}
                />
                
                <SliderInput 
                  label="Annual Return" 
                  value={scenario.annualReturn} 
                  min={1} 
                  max={15} 
                  step={0.5} 
                  unit=""
                  onChange={(v: number) => setScenario({...scenario, annualReturn: v})}
                />
                
                <SliderInput 
                  label="Time Horizon" 
                  value={scenario.years} 
                  min={1} 
                  max={50} 
                  step={1} 
                  unit=""
                  onChange={(v: number) => setScenario({...scenario, years: v})}
                />

                <button 
                  onClick={handleSaveScenario}
                  disabled={isSaving}
                  className="w-full py-3 mb-8 bg-[#1A1A1A] border border-[#C5A059]/30 text-[#C5A059] font-bold rounded-[2px] flex items-center justify-center gap-2 hover:bg-[#C5A059] hover:text-[#0A0A0A] transition-all disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {scenario.id === 'default' ? 'Save Scenario' : 'Update Scenario'}
                </button>

                <div className="mt-10 pt-8 border-t border-[#333333]">
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#6E8A96] mb-4">Strategic Events</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 p-3 border border-[#333333] rounded-[2px] text-xs font-bold hover:border-[#C5A059] hover:text-white transition-all">
                      <Home size={14} /> Buy House
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 border border-[#333333] rounded-[2px] text-xs font-bold hover:border-[#C5A059] hover:text-white transition-all">
                      <Briefcase size={14} /> Career Jump
                    </button>
                  </div>
                </div>
              </section>

              <section className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px]">
                <h2 className="font-serif text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <Info size={20} className="text-[#C5A059]" />
                  Opportunity Cost
                </h2>
                <div className="space-y-6">
                  <div className="p-4 bg-[#0A0A0A] border-l-2 border-[#C5A059]">
                    <p className="text-sm text-[#6E8A96] mb-1 italic">Daily $10 Coffee</p>
                    <p className="text-lg font-serif font-bold text-white">$300 / mo</p>
                    <p className="text-xs text-[#C5A059] mt-2 font-mono">Future Value: $362,400 (30 yrs)</p>
                  </div>
                  <div className="p-4 bg-[#0A0A0A] border-l-2 border-[#C5A059]">
                    <p className="text-sm text-[#6E8A96] mb-1 italic">Monthly Car Payment</p>
                    <p className="text-lg font-serif font-bold text-white">$650 / mo</p>
                    <p className="text-xs text-[#C5A059] mt-2 font-mono">Future Value: $785,200 (30 yrs)</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Dashboard */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  label="Projected Wealth" 
                  value={`$${(finalWealth / 1000000).toFixed(2)}M`} 
                  subValue={`at year ${2026 + scenario.years}`}
                  icon={TrendingUp}
                  trend={12.4}
                />
                <StatCard 
                  label="Total Invested" 
                  value={`$${(totalInvested / 1000000).toFixed(2)}M`} 
                  subValue="Principal capital"
                  icon={DollarSign}
                />
                <StatCard 
                  label="Market Gains" 
                  value={`$${(totalInterest / 1000000).toFixed(2)}M`} 
                  subValue="Compound growth"
                  icon={Zap}
                  trend={8.2}
                />
              </div>

              {/* Main Chart */}
              <div className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-[2px]">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-white italic">Wealth Trajectory</h2>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] mt-1">Projected growth over {scenario.years} years</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={askAiCoach}
                      className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] text-[#0A0A0A] rounded-[2px] text-xs font-bold hover:bg-[#B38F48] transition-all"
                    >
                      <Zap size={14} />
                      AI Insights
                    </button>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
                      <defs>
                        <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
                      <XAxis 
                        dataKey="year" 
                        stroke="#6E8A96" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: '#6E8A96', fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        stroke="#6E8A96" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        tick={{ fill: '#6E8A96', fontFamily: 'monospace' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333333', borderRadius: '2px' }}
                        itemStyle={{ color: '#C5A059', fontFamily: 'serif', fontWeight: 'bold' }}
                        labelStyle={{ color: '#6E8A96', fontFamily: 'monospace', fontSize: '11px', marginBottom: '4px' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Wealth']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="wealth" 
                        stroke="#C5A059" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorWealth)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Coach Section */}
              <AnimatePresence>
                {showAiCoach && (
                  <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1A1A1A] border border-[#C5A059]/30 p-8 rounded-[2px] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <Zap size={40} className="text-[#C5A059]/10" />
                    </div>
                    
                    <h2 className="font-serif text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <MessageSquare size={20} className="text-[#C5A059]" />
                      Strategic Insights
                    </h2>

                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-12 h-12 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
                        <p className="font-mono text-sm text-[#6E8A96] animate-pulse">Analyzing market trajectories...</p>
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none prose-p:text-[#D1D1D1] prose-li:text-[#D1D1D1] prose-strong:text-[#C5A059] prose-h3:text-white prose-h3:font-serif">
                        <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>') }} />
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setShowAiCoach(false)}
                      className="mt-8 text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-white transition-colors"
                    >
                      Dismiss Analysis
                    </button>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[2px]">
                  <h3 className="font-serif text-lg font-bold text-white mb-4">Risk Profile</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-[#333333] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C5A059] w-[70%]" />
                    </div>
                    <span className="font-mono text-sm text-[#C5A059]">Aggressive</span>
                  </div>
                  <p className="text-xs text-[#6E8A96] mt-4 italic">Based on your 7% return target, we assume a diversified equity-heavy portfolio.</p>
                </div>
                <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[2px]">
                  <h3 className="font-serif text-lg font-bold text-white mb-4">Freedom Date</h3>
                  <div className="flex items-center gap-3">
                    <Calendar size={24} className="text-[#C5A059]" />
                    <div>
                      <p className="text-2xl font-serif font-bold text-white">Oct 2048</p>
                      <p className="text-xs text-[#6E8A96] font-mono uppercase">Estimated Financial Independence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#333333] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <TrendingUp size={20} className="text-[#C5A059]" />
            <span className="font-serif font-bold text-white italic">Orbit</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#6E8A96]">
            Strategic Wealth Intelligence — v1.0.5
          </div>
          <div className="flex gap-6">
            {['Privacy', 'Security', 'Terms'].map(link => (
              <a key={link} href="#" className="text-[11px] font-mono uppercase tracking-widest text-[#6E8A96] hover:text-[#C5A059] transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function OrbitWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <Orbit />
    </ErrorBoundary>
  );
}
