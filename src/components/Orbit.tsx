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
  Wallet,
  ShieldCheck,
  Plus,
  Menu
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
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
          <div className="bg-[#FAF9F6] border border-[#8B0000] p-8 max-w-md w-full rounded-[2px]">
            <div className="flex items-center gap-3 text-[#FF4444] mb-4">
              <AlertCircle size={24} />
              <h2 className="font-serif text-xl font-bold">System Error</h2>
            </div>
            <p className="text-[#8C8670] text-sm mb-6 leading-relaxed">
              Orbit encountered a critical error. This is often due to a connection issue or security restriction.
            </p>
            <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-[2px] mb-6 overflow-auto max-h-40">
              <code className="text-[10px] text-[#FF4444] font-mono break-all">{this.state.errorInfo}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#E8E4D0] text-[#2C3338] font-bold rounded-[2px] hover:bg-[#D8D4C0] transition-all"
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
interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  month: number; // 1-12
  frequency: 'annual' | 'semi-annual' | 'quarterly' | 'monthly' | 'bi-weekly' | 'weekly' | 'one-time';
  category: string;
  customCategory?: string;
}

interface PersonIncome {
  paycheckAmount: number;
  frequencyPerMonth: number;
}

interface FixedExpense {
  id: string;
  label: string;
  amount: number;
}

interface FinanceProfile {
  primaryIncome: PersonIncome;
  spouseIncome: PersonIncome;
  fixedExpenses: FixedExpense[];
  savingsGoal: number;
  cardColors: Record<string, string>;
}

// --- Components ---

const ColorPicker = ({ color, onChange }: { color: string, onChange: (c: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = ['#C5A059', '#1E5C38', '#8B0000', '#6E8A96', '#2C3338', '#8C8670'];
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-[#E8E4D0] rounded-[2px] text-[#8C8670] transition-colors"
      >
        <Menu size={14} />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 p-2 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] shadow-xl z-50 flex gap-2">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => { onChange(c); setIsOpen(false); }}
              className={`w-4 h-4 rounded-full border ${color === c ? 'border-[#2C3338]' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon: Icon, trend, color = '#C5A059', onColorChange }: any) => (
  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px] relative overflow-visible group shadow-sm transition-colors" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
    <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-[2px]" style={{ backgroundColor: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex items-center gap-2">
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-mono ${trend > 0 ? 'text-[#1E5C38]' : 'text-[#8B0000]'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
        {onColorChange && <ColorPicker color={color} onChange={onColorChange} />}
      </div>
    </div>
    <div className="font-mono text-[11px] uppercase tracking-widest text-[#8C8670] mb-1">{label}</div>
    <div className="text-3xl font-serif font-bold text-[#2C3338] mb-1">{value}</div>
    <div className="text-[13px] text-[#8C8670] italic">{subValue}</div>
  </div>
);

const SliderInput = ({ label, value, min, max, step, onChange, unit = "", onSync }: any) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-[#8C8670]">{label}</label>
        {onSync && (
          <button 
            onClick={onSync}
            className="p-1 hover:bg-[#E8E4D0] rounded-[2px] text-[#C5A059] transition-colors group/sync"
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
      className="w-full h-1 bg-[#E8E4D0] rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
    />
  </div>
);

function Orbit() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'individual' | 'family'>('individual');
  
  const [profile, setProfile] = useState<FinanceProfile>({
    primaryIncome: { paycheckAmount: 3500, frequencyPerMonth: 2 },
    spouseIncome: { paycheckAmount: 0, frequencyPerMonth: 0 },
    fixedExpenses: [
      { id: '1', label: 'Rent / Mortgage', amount: 2200 },
      { id: '2', label: 'Car Payment', amount: 450 },
      { id: '3', label: 'Student Loans', amount: 300 },
      { id: '4', label: 'Utilities', amount: 250 },
      { id: '5', label: 'Groceries', amount: 600 },
      { id: '6', label: 'Insurance', amount: 150 },
      { id: '7', label: 'Other', amount: 250 }
    ],
    savingsGoal: 1000,
    cardColors: {
      income: '#1E5C38',
      spend: '#8B0000',
      surplus: '#C5A059',
      totalSpend: '#1E5C38'
    }
  });

  const [expenses, setExpenses] = useState<RecurringExpense[]>([
    { id: '1', name: 'Car Insurance', amount: 1200, month: 3, frequency: 'semi-annual', category: 'insurance' },
    { id: '2', name: 'Amex Platinum Fee', amount: 695, month: 1, frequency: 'annual', category: 'subscription' },
    { id: '3', name: 'Property Tax', amount: 4500, month: 10, frequency: 'annual', category: 'tax' },
    { id: '4', name: 'Amazon Prime', amount: 139, month: 7, frequency: 'annual', category: 'subscription' },
    { id: '5', name: 'Car Maintenance', amount: 400, month: 5, frequency: 'quarterly', category: 'maintenance' },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiCoach, setShowAiCoach] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<RecurringExpense>>({
    name: '',
    amount: 0,
    month: 1,
    frequency: 'annual',
    category: 'other'
  });
  const [showAddExpense, setShowAddExpense] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const categorizedPresets = {
    'Streaming & Entertainment': [
      { name: 'Netflix', amount: 20, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Hulu', amount: 15, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Disney+', amount: 14, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'HBO Max', amount: 16, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Spotify', amount: 11, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'YouTube Premium', amount: 14, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Paramount+', amount: 12, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Peacock', amount: 10, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Apple TV+', amount: 10, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Audible', amount: 15, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Nintendo Switch Online', amount: 50, frequency: 'annual', category: 'subscription', month: 10 },
      { name: 'PlayStation Plus', amount: 80, frequency: 'annual', category: 'subscription', month: 11 },
      { name: 'Xbox Game Pass', amount: 120, frequency: 'annual', category: 'subscription', month: 12 },
    ],
    'Credit Cards & Finance': [
      { name: 'Amex Platinum', amount: 695, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Amex Gold', amount: 250, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Chase Sapphire Reserve', amount: 550, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Chase Sapphire Preferred', amount: 95, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Venture X', amount: 395, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Citi Premier', amount: 95, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Tax Preparation', amount: 300, frequency: 'annual', category: 'tax', month: 3 },
      { name: 'Financial Advisor Fee', amount: 1000, frequency: 'annual', category: 'other', month: 12 },
    ],
    'Insurance & Protection': [
      { name: 'Car Insurance', amount: 1200, frequency: 'semi-annual', category: 'insurance', month: 3 },
      { name: 'Life Insurance', amount: 500, frequency: 'annual', category: 'insurance', month: 6 },
      { name: 'Pet Insurance', amount: 400, frequency: 'annual', category: 'insurance', month: 1 },
      { name: 'Home Insurance', amount: 1500, frequency: 'annual', category: 'insurance', month: 1 },
      { name: 'Umbrella Policy', amount: 300, frequency: 'annual', category: 'insurance', month: 5 },
      { name: 'Identity Theft Protection', amount: 150, frequency: 'annual', category: 'insurance', month: 2 },
    ],
    'Home & Auto Maintenance': [
      { name: 'Car Maintenance', amount: 400, frequency: 'quarterly', category: 'maintenance', month: 5 },
      { name: 'Home Maintenance', amount: 1000, frequency: 'quarterly', category: 'maintenance', month: 3 },
      { name: 'HVAC Service', amount: 200, frequency: 'annual', category: 'maintenance', month: 4 },
      { name: 'Pest Control', amount: 150, frequency: 'quarterly', category: 'maintenance', month: 1 },
      { name: 'Pool Opening/Closing', amount: 600, frequency: 'semi-annual', category: 'maintenance', month: 5 },
      { name: 'Gutter Cleaning', amount: 200, frequency: 'semi-annual', category: 'maintenance', month: 4 },
      { name: 'Landscaping Mulch', amount: 500, frequency: 'annual', category: 'maintenance', month: 4 },
    ],
    'Travel & Leisure': [
      { name: 'Annual Vacation', amount: 5000, frequency: 'annual', category: 'other', month: 7 },
      { name: 'Holiday Travel', amount: 2000, frequency: 'annual', category: 'other', month: 12 },
      { name: 'TSA PreCheck / Global Entry', amount: 100, frequency: 'one-time', category: 'other', month: 1 },
      { name: 'National Parks Pass', amount: 80, frequency: 'annual', category: 'subscription', month: 5 },
      { name: 'Ski Pass', amount: 800, frequency: 'annual', category: 'subscription', month: 10 },
    ],
    'Education & Learning': [
      { name: 'Tuition Payment', amount: 10000, frequency: 'semi-annual', category: 'other', month: 8 },
      { name: 'School Supplies', amount: 300, frequency: 'annual', category: 'other', month: 8 },
      { name: 'Online Courses', amount: 200, frequency: 'quarterly', category: 'subscription', month: 1 },
      { name: 'Professional Certification', amount: 500, frequency: 'annual', category: 'other', month: 6 },
    ],
    'Gifts & Donations': [
      { name: 'Holiday Gifts', amount: 1500, frequency: 'annual', category: 'other', month: 12 },
      { name: 'Birthday Fund', amount: 1000, frequency: 'annual', category: 'other', month: 1 },
      { name: 'Annual Charity Donation', amount: 2000, frequency: 'annual', category: 'other', month: 12 },
      { name: 'Alumni Association', amount: 100, frequency: 'annual', category: 'subscription', month: 9 },
    ],
    'Memberships & Subscriptions': [
      { name: 'Amazon Prime', amount: 139, frequency: 'annual', category: 'subscription', month: 7 },
      { name: 'Costco Membership', amount: 60, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Gym Membership', amount: 600, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Professional Dues', amount: 300, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Property Tax', amount: 4500, frequency: 'annual', category: 'tax', month: 10 },
      { name: 'Cloud Storage (iCloud/Google)', amount: 120, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Newspaper/Journal Sub', amount: 150, frequency: 'annual', category: 'subscription', month: 1 },
    ]
  };

  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(categorizedPresets)[0]);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser({ uid: 'guest-user', displayName: 'Guest User' } as any);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

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

  // --- Calculations ---
  const monthlyIncome = useMemo(() => {
    const primary = profile.primaryIncome.paycheckAmount * profile.primaryIncome.frequencyPerMonth;
    const spouse = profile.spouseIncome.paycheckAmount * profile.spouseIncome.frequencyPerMonth;
    return primary + spouse;
  }, [profile.primaryIncome, profile.spouseIncome]);

  const monthlyFixedExpenses = useMemo(() => {
    return profile.fixedExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [profile.fixedExpenses]);

  const totalAnnualOrbitExpenses = useMemo(() => expenses.reduce((sum, e) => {
    if (e.frequency === 'annual' || e.frequency === 'one-time') return sum + e.amount;
    if (e.frequency === 'semi-annual') return sum + (e.amount * 2);
    if (e.frequency === 'quarterly') return sum + (e.amount * 4);
    if (e.frequency === 'monthly') return sum + (e.amount * 12);
    if (e.frequency === 'bi-weekly') return sum + (e.amount * 26);
    if (e.frequency === 'weekly') return sum + (e.amount * 52);
    return sum;
  }, 0), [expenses]);

  const totalAnnualFixedExpenses = monthlyFixedExpenses * 12;
  const totalAnnualIncome = monthlyIncome * 12;
  const totalAnnualSpend = totalAnnualFixedExpenses + totalAnnualOrbitExpenses;
  const annualSurplus = totalAnnualIncome - totalAnnualSpend;

  // --- AI Logic ---
  const askAiCoach = async () => {
    setIsAiLoading(true);
    setShowAiCoach(true);
    try {
      const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '';
      if (!apiKey) throw new Error("Gemini API Key is missing");
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        As a strategic cash flow coach, analyze this annual financial outlook for a ${mode} setup:
        - Annual Income: $${totalAnnualIncome.toLocaleString()}
        - Annual Fixed Expenses (Mortgage, Utilities, etc): $${totalAnnualFixedExpenses.toLocaleString()}
        - Annual "Orbiting" (Irregular) Expenses: $${totalAnnualOrbitExpenses.toLocaleString()}
        - Total Annual Spend: $${totalAnnualSpend.toLocaleString()}
        - Annual Surplus/Deficit: $${annualSurplus.toLocaleString()}
        
        Irregular Expenses List:
        ${expenses.map(e => `- ${e.name}: $${e.amount} (${e.frequency})`).join('\n')}
        
        Provide 3 high-impact strategic insights on how to manage this annual cycle. 
        Focus on "Sinking Funds", optimizing payment timing, and ensuring the surplus is put to work.
        Since this is a ${mode} plan, tailor the advice accordingly.
        Keep it professional, punchy, and strategic. Use markdown.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      setAiResponse(response.text || "I'm analyzing your cash flow orbit...");
    } catch (error) {
      console.error("AI Coach Error:", error);
      setAiResponse("I'm having trouble analyzing your orbits right now. Please try again later.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      const finalCategory = newExpense.category === 'other' ? (newExpense.customCategory || 'other') : newExpense.category;
      const expenseToSave = {
        ...newExpense,
        category: finalCategory
      };
      if (editingExpenseId) {
        setExpenses(expenses.map(e => e.id === editingExpenseId ? { ...expenseToSave, id: editingExpenseId } as RecurringExpense : e));
      } else {
        setExpenses([...expenses, { ...expenseToSave, id: Date.now().toString() } as RecurringExpense]);
      }
      setNewExpense({ name: '', amount: 0, month: 1, frequency: 'annual', category: 'other', customCategory: '' });
      setEditingExpenseId(null);
      setShowAddExpense(false);
    }
  };

  const editExpense = (exp: RecurringExpense) => {
    const isStandard = ['insurance', 'tax', 'subscription', 'maintenance'].includes(exp.category);
    setNewExpense({
      ...exp,
      category: isStandard ? exp.category : 'other',
      customCategory: isStandard ? '' : exp.category
    });
    setEditingExpenseId(exp.id);
    setShowAddExpense(true);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const addFixedExpense = () => {
    setProfile({
      ...profile,
      fixedExpenses: [...profile.fixedExpenses, { id: Date.now().toString(), label: 'New Expense', amount: 0 }]
    });
  };

  const removeFixedExpense = (id: string) => {
    setProfile({
      ...profile,
      fixedExpenses: profile.fixedExpenses.filter(e => e.id !== id)
    });
  };

  const updateFixedExpense = (id: string, updates: Partial<FixedExpense>) => {
    setProfile({
      ...profile,
      fixedExpenses: profile.fixedExpenses.map(e => e.id === id ? { ...e, ...updates } : e)
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C3338] font-sans selection:bg-[#C5A059]/30">
      {/* Header */}
      <header className="border-b border-[#E8E4D0] bg-[#FAF9F6]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/portfolio" className="p-2 hover:bg-[#E8E4D0] rounded-[2px] transition-colors group">
              <ChevronLeft size={20} className="text-[#8C8670] group-hover:text-[#2C3338]" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C5A059] rounded-[2px] flex items-center justify-center">
                <TrendingUp size={24} className="text-[#FAF9F6]" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#2C3338] italic leading-none">Orbit</h1>
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C5A059] mt-1">Cash Flow Intelligence</p>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 mr-4">
            {user && (
              <>
                <div className="relative group py-2">
                  <button className="text-[11px] font-mono uppercase tracking-widest text-[#2C3338] transition-colors flex items-center gap-1">
                    Tools <ChevronDown size={12} />
                  </button>
                  <div className="absolute top-full right-0 w-48 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                    <button onClick={() => navigate('/orbit/currency-converter')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Currency Converter</button>
                    <button onClick={() => navigate('/orbit/retirement-planner')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Wealth Simulator <span className="text-[9px] text-[#C5A059] block">(In Production)</span></button>
                    <button onClick={() => navigate('/orbit')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#2C3338] bg-[#E8E4D0] transition-colors text-left w-full">Annual Orbit</button>
                  </div>
                </div>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[#2C3338]">{user.displayName}</div>
                  <div className="text-[10px] text-[#8C8670] font-mono">{user.email}</div>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-[2px] border border-[#E8E4D0]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] flex items-center justify-center">
                    <UserIcon size={20} className="text-[#8C8670]" />
                  </div>
                )}
                {user.uid === 'guest-user' ? (
                  <button 
                    onClick={() => navigate('/login')}
                    className="p-2.5 bg-[#FAF9F6] border border-[#E8E4D0] text-[#C5A059] rounded-[2px] hover:text-[#2C3338] hover:border-[#C5A059] transition-all"
                    title="Sign In"
                  >
                    <UserIcon size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={logout}
                    className="p-2.5 bg-[#FAF9F6] border border-[#E8E4D0] text-[#8C8670] rounded-[2px] hover:text-[#2C3338] hover:border-[#8B0000] transition-all"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A059] text-[#FAF9F6] rounded-[2px] text-sm font-bold hover:bg-[#B38F48] transition-all"
              >
                <LogIn size={18} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Mode Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#E8E4D0]/30 p-1 rounded-[2px] border border-[#E8E4D0] flex">
            <button 
              onClick={() => setMode('individual')}
              className={`px-8 py-2 text-[11px] font-mono uppercase tracking-widest transition-all ${mode === 'individual' ? 'bg-[#C5A059] text-[#FAF9F6] font-bold shadow-md' : 'text-[#8C8670] hover:text-[#2C3338]'}`}
            >
              Individual
            </button>
            <button 
              onClick={() => setMode('family')}
              className={`px-8 py-2 text-[11px] font-mono uppercase tracking-widest transition-all ${mode === 'family' ? 'bg-[#C5A059] text-[#FAF9F6] font-bold shadow-md' : 'text-[#8C8670] hover:text-[#2C3338]'}`}
            >
              Family
            </button>
          </div>
        </div>

        {/* Stats Grid (Full Width) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            label="Annual Income" 
            value={`$${totalAnnualIncome.toLocaleString()}`} 
            subValue="Gross yearly inflow"
            icon={TrendingUp}
            color={profile.cardColors.income}
            onColorChange={(c: string) => setProfile({...profile, cardColors: {...profile.cardColors, income: c}})}
          />
          <StatCard 
            label="Annual Spend" 
            value={`$${totalAnnualSpend.toLocaleString()}`} 
            subValue="Fixed + Orbiting"
            icon={RefreshCw}
            color={profile.cardColors.spend}
            onColorChange={(c: string) => setProfile({...profile, cardColors: {...profile.cardColors, spend: c}})}
          />
          <StatCard 
            label="Annual Surplus" 
            value={`$${annualSurplus.toLocaleString()}`} 
            subValue="Potential savings"
            icon={Zap}
            trend={annualSurplus > 0 ? 1 : -1}
            color={profile.cardColors.surplus}
            onColorChange={(c: string) => setProfile({...profile, cardColors: {...profile.cardColors, surplus: c}})}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] shadow-sm">
              <h2 className="font-serif text-xl font-bold text-[#2C3338] mb-8 flex items-center gap-3">
                <Wallet size={20} className="text-[#C5A059]" />
                Income & Fixed
              </h2>
              
              <div className="space-y-8">
                {/* Primary Income */}
                <div className="p-4 bg-[#E8E4D0]/10 rounded-[2px] border border-[#E8E4D0]/50">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#C5A059] mb-4">Primary Income</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-[#8C8670] mb-1">Paycheck</label>
                      <div className="flex items-center gap-1 border-b border-[#E8E4D0] focus-within:border-[#C5A059]">
                        <span className="text-sm font-serif text-[#8C8670]">$</span>
                        <input 
                          type="number"
                          value={profile.primaryIncome.paycheckAmount}
                          onChange={(e) => setProfile({
                            ...profile, 
                            primaryIncome: { ...profile.primaryIncome, paycheckAmount: Number(e.target.value) }
                          })}
                          className="w-full bg-transparent py-1 text-sm font-serif outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-[#8C8670] mb-1">Freq / Mo</label>
                      <input 
                        type="number"
                        value={profile.primaryIncome.frequencyPerMonth}
                        onChange={(e) => setProfile({
                          ...profile, 
                          primaryIncome: { ...profile.primaryIncome, frequencyPerMonth: Number(e.target.value) }
                        })}
                        className="w-full bg-transparent border-b border-[#E8E4D0] py-1 text-sm font-serif focus:border-[#C5A059] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Spouse Income if Family Mode */}
                {mode === 'family' && (
                  <div className="p-4 bg-[#E8E4D0]/10 rounded-[2px] border border-[#E8E4D0]/50">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#C5A059] mb-4">Spouse Income</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-[#8C8670] mb-1">Paycheck</label>
                        <div className="flex items-center gap-1 border-b border-[#E8E4D0] focus-within:border-[#C5A059]">
                          <span className="text-sm font-serif text-[#8C8670]">$</span>
                          <input 
                            type="number"
                            value={profile.spouseIncome.paycheckAmount}
                            onChange={(e) => setProfile({
                              ...profile, 
                              spouseIncome: { ...profile.spouseIncome, paycheckAmount: Number(e.target.value) }
                            })}
                            className="w-full bg-transparent py-1 text-sm font-serif outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-[#8C8670] mb-1">Freq / Mo</label>
                        <input 
                          type="number"
                          value={profile.spouseIncome.frequencyPerMonth}
                          onChange={(e) => setProfile({
                            ...profile, 
                            spouseIncome: { ...profile.spouseIncome, frequencyPerMonth: Number(e.target.value) }
                          })}
                          className="w-full bg-transparent border-b border-[#E8E4D0] py-1 text-sm font-serif focus:border-[#C5A059] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Fixed Expenses */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670]">Monthly Fixed</h3>
                    <button 
                      onClick={addFixedExpense}
                      className="text-[9px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors"
                    >
                      + Add Item
                    </button>
                  </div>
                  {profile.fixedExpenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center border-b border-[#E8E4D0]/50 pb-2 group">
                      <div className="flex items-center gap-2 flex-1">
                        <button 
                          onClick={() => removeFixedExpense(exp.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#8B0000] hover:bg-[#8B0000]/10 p-1 rounded transition-all"
                        >
                          ✕
                        </button>
                        <input 
                          type="text"
                          value={exp.label}
                          onChange={(e) => updateFixedExpense(exp.id, { label: e.target.value })}
                          className="text-[11px] font-mono uppercase tracking-tighter text-[#8C8670] bg-transparent outline-none focus:text-[#2C3338] w-full"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-serif font-bold text-[#2C3338]">$</span>
                        <input 
                          type="number"
                          value={exp.amount}
                          onChange={(e) => updateFixedExpense(exp.id, { amount: Number(e.target.value) })}
                          className="w-20 bg-transparent text-right text-sm font-serif font-bold text-[#2C3338] focus:text-[#C5A059] outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] shadow-sm">
              <h2 className="font-serif text-xl font-bold text-[#2C3338] mb-6 flex items-center gap-3">
                <Info size={20} className="text-[#C5A059]" />
                Sinking Fund Logic
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-[#FAF9F6] border-l-2 border-[#C5A059]">
                  <p className="text-sm text-[#8C8670] mb-1 italic">Monthly Set-Aside</p>
                  <p className="text-lg font-serif font-bold text-[#2C3338]">${Math.round(totalAnnualOrbitExpenses / 12).toLocaleString()} / mo</p>
                  <p className="text-xs text-[#C5A059] mt-2 font-mono">To cover all irregular expenses</p>
                </div>
                <p className="text-xs text-[#8C8670] leading-relaxed italic">
                  By saving this amount monthly into a dedicated "Sinking Fund" account, you neutralize the impact of large one-time hits like car insurance or property taxes.
                </p>
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {/* Fluid Expense Grid */}
            <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#2C3338] italic">Your Annual Finance Orbit</h2>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#8C8670] mt-1">Comprehensive view of all annual payments</p>
                </div>
                <button 
                  onClick={askAiCoach}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] text-[#FAF9F6] rounded-[2px] text-xs font-bold hover:bg-[#B38F48] transition-all"
                >
                  <Zap size={14} />
                  AI Insights
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Total Spend Card (Large) */}
                <div className="col-span-2 border p-6 rounded-[2px] flex flex-col justify-between relative group" style={{ backgroundColor: `${profile.cardColors.totalSpend}05`, borderColor: `${profile.cardColors.totalSpend}20` }}>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ColorPicker 
                      color={profile.cardColors.totalSpend} 
                      onChange={(c) => setProfile({...profile, cardColors: {...profile.cardColors, totalSpend: c}})} 
                    />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: profile.cardColors.totalSpend }}>Total Annual Spend</h3>
                    <div className="text-3xl font-serif font-bold text-[#2C3338]">${totalAnnualSpend.toLocaleString()}</div>
                  </div>
                  <div className="text-[10px] font-mono mt-4" style={{ color: `${profile.cardColors.totalSpend}99` }}>Jan 1 - Dec 31</div>
                </div>

                {/* Fixed Expense Cards */}
                {profile.fixedExpenses.map((item, i) => {
                  const color = profile.cardColors[`fixed_${item.id}`] || '#C5A059';
                  return (
                    <div key={i} className="border p-4 rounded-[2px] flex flex-col justify-between transition-colors group relative" style={{ backgroundColor: `${color}05`, borderColor: '#E8E4D0' }}>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ColorPicker 
                          color={color} 
                          onChange={(c) => setProfile({...profile, cardColors: {...profile.cardColors, [`fixed_${item.id}`]: c}})} 
                        />
                      </div>
                      <h3 className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] group-hover:text-[#2C3338] transition-colors pr-6">{item.label}</h3>
                      <div className="text-lg font-serif font-bold text-[#2C3338] mt-2">${(item.amount * 12).toLocaleString()}</div>
                      <div className="text-[8px] font-mono text-[#8C8670]/60 mt-2 italic">Annual Total</div>
                    </div>
                  );
                })}

                {/* Orbiting Expense Categories */}
                {Array.from(new Set(expenses.map(e => e.category))).map((cat, i) => {
                  const color = profile.cardColors[`cat_${cat}`] || '#2C3338';
                  const catTotal = expenses
                    .filter(e => e.category === cat)
                    .reduce((sum, e) => {
                      if (e.frequency === 'annual' || e.frequency === 'one-time') return sum + e.amount;
                      if (e.frequency === 'semi-annual') return sum + (e.amount * 2);
                      if (e.frequency === 'quarterly') return sum + (e.amount * 4);
                      if (e.frequency === 'monthly') return sum + (e.amount * 12);
                      if (e.frequency === 'bi-weekly') return sum + (e.amount * 26);
                      if (e.frequency === 'weekly') return sum + (e.amount * 52);
                      return sum;
                    }, 0);
                  
                  return (
                    <div key={cat} className="bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-[2px] flex flex-col justify-between transition-colors group relative" style={{ borderTopColor: color, borderTopWidth: '2px' }}>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ColorPicker 
                          color={color} 
                          onChange={(c) => setProfile({...profile, cardColors: {...profile.cardColors, [`cat_${cat}`]: c}})} 
                        />
                      </div>
                      <h3 className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] group-hover:text-[#2C3338] transition-colors pr-6">Orbit: {cat}</h3>
                      <div className="text-lg font-serif font-bold text-[#2C3338] mt-2">${catTotal.toLocaleString()}</div>
                      <div className="text-[8px] font-mono text-[#8C8670]/60 mt-2 italic">Irregular Hits</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orbiting Expenses List */}
            <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-[2px] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl font-bold text-[#2C3338] flex items-center gap-3">
                  <RefreshCw size={20} className="text-[#C5A059]" />
                  Orbiting Expenses
                </h3>
                <button 
                  onClick={() => setShowAddExpense(true)}
                  className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors"
                >
                  + Add Expense
                </button>
              </div>
              
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-[#E8E4D0] rounded-[2px]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">No orbits tracked yet</p>
                    <button 
                      onClick={() => setShowAddExpense(true)}
                      className="mt-2 text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:underline"
                    >
                      + Add your first expense
                    </button>
                  </div>
                ) : (
                  expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-4 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] group hover:border-[#C5A059] transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#C5A059]/10 rounded-[2px] flex items-center justify-center">
                          {exp.category === 'insurance' && <ShieldCheck size={18} className="text-[#C5A059]" />}
                          {exp.category === 'tax' && <DollarSign size={18} className="text-[#C5A059]" />}
                          {exp.category === 'subscription' && <RefreshCw size={18} className="text-[#C5A059]" />}
                          {exp.category === 'maintenance' && <Home size={18} className="text-[#C5A059]" />}
                          {exp.category === 'other' && <Zap size={18} className="text-[#C5A059]" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#2C3338]">{exp.name}</div>
                          <div className="text-[10px] text-[#8C8670] font-mono uppercase tracking-tighter">
                            ${exp.amount.toLocaleString()} • {exp.frequency} • {monthNames[exp.month - 1]}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => editExpense(exp)}
                          className="p-2 text-[#C5A059] hover:bg-[#C5A059]/10 rounded-[2px] transition-all"
                          title="Edit Orbit"
                        >
                          <Save size={14} />
                        </button>
                        <button 
                          onClick={() => removeExpense(exp.id)}
                          className="p-2 text-[#8B0000] hover:bg-[#8B0000]/10 rounded-[2px] transition-all"
                          title="Remove Orbit"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* AI Coach Section */}
            <AnimatePresence>
              {showAiCoach && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#FAF9F6] border border-[#C5A059]/30 p-8 rounded-[2px] relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <Zap size={40} className="text-[#C5A059]/10" />
                  </div>
                  
                  <h2 className="font-serif text-xl font-bold text-[#2C3338] mb-6 flex items-center gap-3">
                    <MessageSquare size={20} className="text-[#C5A059]" />
                    Strategic Insights
                  </h2>

                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="w-12 h-12 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
                      <p className="font-mono text-sm text-[#8C8670] animate-pulse">Analyzing market trajectories...</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate max-w-none prose-p:text-[#2C3338] prose-li:text-[#2C3338] prose-strong:text-[#C5A059] prose-h3:text-[#2C3338] prose-h3:font-serif">
                      <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>') }} />
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setShowAiCoach(false)}
                    className="mt-8 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] transition-colors"
                  >
                    Dismiss Analysis
                  </button>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddExpense(false);
                setEditingExpenseId(null);
                setNewExpense({ name: '', amount: 0, month: 1, frequency: 'annual', category: 'other' });
              }}
              className="absolute inset-0 bg-[#2C3338]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#FAF9F6] border border-[#E8E4D0] p-8 max-w-4xl w-full rounded-[2px] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-[#2C3338] italic">{editingExpenseId ? 'Edit Orbiting Expense' : 'Add New Orbit'}</h2>
                  <p className="text-sm text-[#8C8670] mt-1 italic">Strategize for the irregular hits that orbit your annual cycle.</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAddExpense(false);
                    setEditingExpenseId(null);
                    setNewExpense({ name: '', amount: 0, month: 1, frequency: 'annual', category: 'other' });
                  }}
                  className="p-2 hover:bg-[#E8E4D0] rounded-[2px] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form Side */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-[2px]">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#C5A059] mb-6">Expense Details</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Expense Name</label>
                        <input 
                          type="text" 
                          value={newExpense.name}
                          onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                          className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-[2px] text-sm focus:border-[#C5A059] outline-none transition-all font-serif italic"
                          placeholder="e.g. Car Insurance"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Amount ($)</label>
                          <input 
                            type="number" 
                            value={newExpense.amount}
                            onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-[2px] text-sm focus:border-[#C5A059] outline-none transition-all font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Month</label>
                          <select 
                            value={newExpense.month}
                            onChange={e => setNewExpense({...newExpense, month: Number(e.target.value)})}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-[2px] text-sm focus:border-[#C5A059] outline-none transition-all font-mono uppercase tracking-widest"
                          >
                            {monthNames.map((name, i) => (
                              <option key={name} value={i + 1}>{name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Frequency</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['annual', 'semi-annual', 'quarterly', 'monthly', 'bi-weekly', 'weekly', 'one-time'].map(freq => (
                            <button
                              key={freq}
                              onClick={() => setNewExpense({...newExpense, frequency: freq as any})}
                              className={`py-2 px-1 text-[9px] font-mono uppercase tracking-widest border rounded-[2px] transition-all ${newExpense.frequency === freq ? 'bg-[#C5A059] border-[#C5A059] text-[#FAF9F6] font-bold shadow-sm' : 'border-[#E8E4D0] text-[#8C8670] hover:border-[#C5A059]'}`}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['insurance', 'tax', 'subscription', 'maintenance', 'other'].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setNewExpense({...newExpense, category: cat})}
                              className={`py-2 px-1 text-[9px] font-mono uppercase tracking-tighter border rounded-[2px] transition-all ${newExpense.category === cat ? 'bg-[#2C3338] border-[#2C3338] text-[#FAF9F6] font-bold shadow-sm' : 'border-[#E8E4D0] text-[#8C8670] hover:border-[#2C3338]'}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        {newExpense.category === 'other' && (
                          <div className="mt-3">
                            <input 
                              type="text" 
                              value={newExpense.customCategory || ''}
                              onChange={e => setNewExpense({...newExpense, customCategory: e.target.value})}
                              className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-2 rounded-[2px] text-[10px] focus:border-[#C5A059] outline-none transition-all font-mono uppercase tracking-widest"
                              placeholder="Write in category..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={handleAddExpense}
                      className="w-full py-5 bg-[#C5A059] text-[#FAF9F6] font-bold rounded-[2px] hover:bg-[#B38F48] transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
                    >
                      <Save size={18} />
                      {editingExpenseId ? 'Update Orbit' : 'Add to Orbit'}
                    </button>
                  </div>
                </div>

                {/* Presets Side */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-[#E8E4D0]/20 p-8 rounded-[2px] border border-[#E8E4D0] h-full">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#2C3338] font-bold flex items-center gap-2">
                        <Zap size={14} className="text-[#C5A059]" />
                        Orbit Library
                      </h3>
                      <div className="flex gap-2">
                        <select 
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#2C3338] focus:border-[#C5A059] focus:outline-none"
                        >
                          {Object.keys(categorizedPresets).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                      {(categorizedPresets as any)[selectedCategory].map((preset: any) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setNewExpense({ ...preset, id: editingExpenseId || Date.now().toString() });
                            // Don't close modal, let user refine
                          }}
                          className="flex flex-col items-start p-4 bg-[#FAF9F6] border border-[#E8E4D0] rounded-[2px] hover:border-[#C5A059] hover:shadow-md transition-all group text-left relative"
                        >
                          <div className="absolute top-2 right-2 text-[#C5A059] opacity-0 group-hover:opacity-100 transition-all">
                            <Plus size={14} />
                          </div>
                          <div className="text-xs font-bold text-[#2C3338] mb-1 group-hover:text-[#C5A059] transition-colors">{preset.name}</div>
                          <div className="text-[9px] text-[#8C8670] font-mono uppercase tracking-tighter flex items-center gap-2">
                            <span>${preset.amount.toLocaleString()}</span>
                            <span className="w-1 h-1 bg-[#E8E4D0] rounded-full" />
                            <span>{preset.frequency}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-8 p-4 bg-[#FAF9F6]/50 border border-[#E8E4D0] rounded-[2px]">
                      <p className="text-[10px] text-[#8C8670] italic leading-relaxed flex items-start gap-2">
                        <Info size={12} className="text-[#C5A059] shrink-0 mt-0.5" />
                        Select a preset to populate the form. You can then adjust the specific amount, month, or frequency before saving to your orbit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="border-t border-[#E8E4D0] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <TrendingUp size={20} className="text-[#C5A059]" />
            <span className="font-serif font-bold text-[#2C3338] italic">Orbit</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C8670]">
            Strategic Cash Flow Intelligence — v2.0.0
          </div>
          <div className="flex gap-6">
            {['Privacy', 'Security', 'Terms'].map(link => (
              <a key={link} href="#" className="text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#C5A059] transition-colors">{link}</a>
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
