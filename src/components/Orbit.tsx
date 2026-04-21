import React, { useState, useMemo, useEffect, useCallback, Component, useRef } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  MessageSquare, 
  ChevronLeft, 
  ChevronDown,
  ChevronRight,
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
  ShoppingCart,
  Plus,
  Menu,
  Search,
  Filter,
  X,
  Database,
  Plane,
  Activity,
  GripVertical,
  Loader2
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
import { logVisit } from '../lib/analytics';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  getDocFromServer,
  limit,
  orderBy
} from 'firebase/firestore';

import StatementImportModal from './StatementImportModal';

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
          <div className="bg-[#FAF9F6] border border-[#8B0000] p-8 max-w-md w-full rounded-xl">
            <div className="flex items-center gap-3 text-[#FF4444] mb-4">
              <AlertCircle size={24} />
              <h2 className="font-serif text-xl font-bold">System Error</h2>
            </div>
            <p className="text-[#8C8670] text-sm mb-6 leading-relaxed">
              Orbit encountered a critical error. This is often due to a connection issue or security restriction.
            </p>
            <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-xl mb-6 overflow-auto max-h-40">
              <code className="text-[10px] text-[#FF4444] font-mono break-all">{this.state.errorInfo}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#E8E4D0] text-[#2C3338] font-bold rounded-xl hover:bg-[#D8D4C0] transition-all"
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
  month: number; // Legacy single month (1-12)
  months?: number[]; // New multiple months (1-12)
  frequency: 'annual' | 'semi-annual' | 'quarterly' | 'monthly' | 'bi-weekly' | 'weekly' | 'one-time';
  category: string;
  customCategory?: string;
  sortOrder?: number;
  paymentType?: 'automated' | 'manual';
  notes?: string;
}

const getMonthlyReserveAmount = (exp: RecurringExpense) => {
  if (exp.frequency === 'monthly') return exp.amount;
  if (exp.frequency === 'annual' || exp.frequency === 'one-time') return exp.amount / 12;
  if (exp.frequency === 'semi-annual') return exp.amount / 6;
  if (exp.frequency === 'quarterly') return exp.amount / 3;
  if (exp.frequency === 'bi-weekly') return (exp.amount * 26) / 12;
  if (exp.frequency === 'weekly') return (exp.amount * 52) / 12;
  return exp.amount;
};

const getMonthlyReserveExplainer = (exp: RecurringExpense) => {
  if (exp.frequency === 'monthly') return '';
  if (exp.frequency === 'annual' || exp.frequency === 'one-time') return `$${exp.amount.toLocaleString()} annually ÷ 12`;
  if (exp.frequency === 'semi-annual') return `$${exp.amount.toLocaleString()} semi-annually ÷ 6`;
  if (exp.frequency === 'quarterly') return `$${exp.amount.toLocaleString()} quarterly ÷ 3`;
  if (exp.frequency === 'bi-weekly') return `$${exp.amount.toLocaleString()} bi-weekly (x26 payments ÷ 12)`;
  if (exp.frequency === 'weekly') return `$${exp.amount.toLocaleString()} weekly (x52 payments ÷ 12)`;
  return '';
};

const ReorderItem: React.FC<{ 
  exp: RecurringExpense, 
  onEdit: (e: RecurringExpense) => void,
  onRemove: (id: string) => void,
  itemProps?: any,
  isMonthlyOrbit?: boolean
}> = ({ exp, onEdit, onRemove, itemProps, isMonthlyOrbit }) => {
  const controls = useDragControls();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const displayAmount = isMonthlyOrbit && exp.frequency !== 'monthly' ? getMonthlyReserveAmount(exp) : exp.amount;
  
  return (
    <Reorder.Item 
      value={exp}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => { (itemProps as any).onDragStart?.() }}
      onDragEnd={() => { (itemProps as any).onDragEnd?.() }}
      className={`flex justify-between items-center p-4 bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl group hover:border-[#C5A059] cursor-pointer transition-all shadow-sm active:shadow-md active:scale-[1.005] ${isMonthlyOrbit && exp.frequency !== 'monthly' ? 'border-b-[#C5A059] border-b-2' : ''}`}
      onClick={() => onEdit(exp)}
    >
      <div className="flex items-center gap-4">
        <div 
          onPointerDown={(e) => controls.start(e)}
          className="text-[#8C8670]/30 group-hover:text-[#C5A059] transition-colors cursor-grab active:cursor-grabbing p-1 -ml-1"
        >
          <GripVertical size={20} />
        </div>
        <div className="w-10 h-10 bg-[#C5A059]/10 rounded-xl flex items-center justify-center">
            {exp.category === 'insurance' && <ShieldCheck size={18} className="text-[#C5A059]" />}
            {exp.category === 'tax' && <DollarSign size={18} className="text-[#C5A059]" />}
            {exp.category === 'subscription' && <RefreshCw size={18} className="text-[#C5A059]" />}
            {(exp.category.includes('maintenance') || exp.category.includes('utilities')) ? <Home size={18} className="text-[#C5A059]" /> : null}
            {exp.category === 'food' && <ShoppingCart size={18} className="text-[#C5A059]" />}
            {exp.category === 'health_and_fitness' && <Activity size={18} className="text-[#C5A059]" />}
            {exp.category === 'vacation' && <Plane size={18} className="text-[#C5A059]" />}
            {(exp.category === 'other' || !['insurance', 'tax', 'subscription', 'maintenance_and_utilities', 'food', 'health_and_fitness', 'vacation'].includes(exp.category)) && <Zap size={18} className="text-[#C5A059]" />}
        </div>
        <div>
          <div className="text-sm font-bold text-[#2C3338] flex items-center gap-2">
            {exp.name}
            {exp.paymentType && (
              <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded leading-none ${exp.paymentType === 'automated' ? 'bg-[#1E5C38]/10 text-[#1E5C38]' : 'bg-[#C5A059]/10 text-[#C5A059]'}`}>
                {exp.paymentType}
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#8C8670] font-mono uppercase tracking-tighter mt-1">
            <span className={isMonthlyOrbit && exp.frequency !== 'monthly' ? 'text-[#C5A059] font-bold' : ''}>
              ${displayAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            {' • '} 
            {exp.frequency.replace('-', ' ')} 
            {exp.frequency !== 'monthly' && ['annual', 'semi-annual', 'quarterly', 'custom'].includes(exp.frequency) && 
              ` • ${(exp.months && exp.months.length > 0) ? exp.months.map(m => monthNames[m - 1]).join(', ') : monthNames[exp.month - 1]}`
            }
            {isMonthlyOrbit && exp.frequency !== 'monthly' && (
              <div className="text-[10px] text-[#C5A059] font-bold mt-1.5 tracking-tight leading-none flex flex-col gap-0.5">
                <span className="uppercase font-sans">Monthly Reserve</span>
                <span className="text-[9px] opacity-80 italic lowercase font-sans font-medium">{getMonthlyReserveExplainer(exp)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="p-2 text-[#8C8670] group-hover:text-[#C5A059] transition-colors" title="Edit Orbit">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(exp.id); }}
          className="p-2 text-[#8B0000] hover:bg-[#8B0000]/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
          title="Remove Orbit"
        >
          <X size={16} />
        </button>
      </div>
    </Reorder.Item>
  );
};

interface IncomeSource {
  id: string;
  label: string;
  paycheckAmount: number;
  frequencyPerMonth: number;
}

interface AutomatedInvestment {
  id: string;
  label: string;
  amount: number;
  investmentType: 'brokerage' | '401k' | 'ira' | 'crypto' | 'other';
  frequency: 'monthly' | 'bi-weekly' | 'weekly';
  notes?: string;
}

interface FixedExpense {
  id: string;
  label: string;
  amount: number;
  dueDate?: number; // legacy single
  dueDates?: number[]; // multiple days
  paymentFrequency?: 1 | 2;
  paymentType?: 'automated' | 'manual';
  notes?: string;
}

interface FinanceProfile {
  incomes: IncomeSource[];
  fixedExpenses: FixedExpense[];
  automatedInvestments?: AutomatedInvestment[];
  savingsGoal: number;
  cardColors: Record<string, string>;
  hasSeededDefaults?: boolean;
}


// --- Components ---

const ExpenseTrendGraph = ({ merchantName, userId }: { merchantName: string, userId: string }) => {
  const [data, setData] = useState<{ date: Date, amount: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!merchantName || !userId || userId === 'guest-user') return;
    setLoading(true);
    
    const intelRef = collection(db, 'users', userId, 'expenseIntelligence');
    const unsubscribe = onSnapshot(intelRef, (snapshot) => {
      const hits: { date: Date, amount: number }[] = [];
      const normalizedTarget = merchantName.trim().toLowerCase();
      
      snapshot.forEach(doc => {
        const d = doc.data();
        const pName = d.merchantName?.trim().toLowerCase() || '';
        
        // Slightly smarter matching: check for substrings in either direction
        if (pName && (pName.includes(normalizedTarget) || normalizedTarget.includes(pName))) {
          let hitDate: Date;
          if (d.date?.toDate) {
            hitDate = d.date.toDate();
          } else if (d.date instanceof Date) {
            hitDate = d.date;
          } else if (typeof d.date === 'string' || typeof d.date === 'number') {
            hitDate = new Date(d.date);
          } else {
            hitDate = new Date();
          }

          hits.push({
            date: hitDate,
            amount: d.amount
          });
        }
      });

      // Sort by date ascending
      hits.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Deduplicate/Group by date to avoid multiple points on same exact MS
      const uniqueHits: { date: Date, amount: number }[] = [];
      const seenKeys = new Set<string>();
      
      hits.forEach(hit => {
        const dateKey = hit.date.toISOString().split('T')[0];
        const compositeKey = `${dateKey}_${hit.amount}`;
        
        if (!seenKeys.has(compositeKey)) {
          seenKeys.add(compositeKey);
          uniqueHits.push(hit);
        }
      });

      setData(uniqueHits);
      setLoading(false);
    }, (err) => {
      console.error("Failed to sync trend data", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [merchantName, userId]);

  if (loading && data.length === 0) return <div className="text-[10px] text-[#8C8670] mt-4 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Analyzing historical trends...</div>;
  if (data.length < 2) {
    return (
      <div className="mt-8 pt-6 border-t border-[#E8E4D0]">
        <div className="flex justify-between items-center mb-4">
           <h4 className="text-xs font-mono uppercase tracking-widest text-[#8C8670] flex items-center gap-1">
             <Activity size={12} className="text-[#C5A059]" />
             Historical Trend
           </h4>
        </div>
        <div className="bg-[#FAF9F6] border border-[#E8E4D0] border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <Activity size={24} className="text-[#8C8670] mb-2 opacity-30" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">Not Enough Data</p>
            <p className="text-[10px] text-[#8C8670] max-w-[200px] mt-1 opacity-70">Import more statements containing this merchant to see price fluctuations.</p>
        </div>
      </div>
    );
  }

  const firstAmt = data[0].amount;
  const lastAmt = data[data.length - 1].amount;
  const pctChange = ((lastAmt - firstAmt) / firstAmt) * 100;

  const chartData = data.map((d, i) => ({
    name: d.date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    amount: d.amount,
  }));

  return (
    <div className="mt-8 pt-6 border-t border-[#E8E4D0]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-mono uppercase tracking-widest text-[#8C8670] flex items-center gap-1">
          <Activity size={12} className="text-[#C5A059]" />
          Historical Trend
        </h4>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${pctChange > 0 ? 'bg-red-100 text-red-700' : pctChange < 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {pctChange > 0 ? <TrendingUp size={10} /> : pctChange < 0 ? <TrendingUp size={10} className="rotate-180" /> : null}
          {Math.abs(pctChange).toFixed(1)}% {pctChange > 0 ? 'Increase' : pctChange < 0 ? 'Decrease' : 'Stable'}
        </div>
      </div>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
             <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4D0" />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#8C8670" />
            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#2C3338', border: 'none', borderRadius: '8px', color: '#FAF9F6', fontSize: '12px' }}
              itemStyle={{ color: '#C5A059' }}
              formatter={(val: number) => [`$${val.toFixed(2)}`, 'Amount']}
            />
            <Area type="monotone" dataKey="amount" stroke="#C5A059" fillOpacity={1} fill="url(#colorAmount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


const ColorPicker = ({ color, onChange }: { color: string, onChange: (c: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = [
    '#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#06B6D4', '#8B5CF6',
    '#B5EAD7', '#E0BBE4', '#95D5EE', '#FFDAC1', '#FFB7B2', '#E2F0CB',
    '#C5A059', '#1E5C38', '#8B0000', '#6E8A96', '#2C3338', '#8C8670'
  ];
  
  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`p-1 rounded-xl text-[#8C8670] transition-colors ${isOpen ? 'bg-[#E8E4D0] text-[#2C3338]' : 'hover:bg-[#E8E4D0]'}`}
      >
        <Menu size={14} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
          <div className="absolute top-full right-0 mt-1 p-3 bg-white border border-[#E8E4D0] rounded-xl shadow-2xl z-[50] grid grid-cols-6 gap-2 w-48 backdrop-blur-sm bg-white/95">
            {colors.map(c => (
              <button
                key={c}
                onClick={(e) => { e.stopPropagation(); onChange(c); setIsOpen(false); }}
                className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${color === c ? 'border-[#2C3338] ring-2 ring-[#2C3338]/20' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon: Icon, color = '#C5A059', onColorChange, onClick }: any) => (
  <div className={`bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-xl relative overflow-visible group shadow-sm transition-all hover:shadow-md hover:z-50 ${onClick ? 'cursor-pointer hover:border-[#C5A059]' : ''}`} style={{ borderTopColor: color, borderTopWidth: '4px' }} onClick={onClick}>
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-xl" style={{ backgroundColor: color }} />
    <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ backgroundColor: color }} />
    <div className="flex justify-between items-start mb-4 relative z-50">
      <div className="p-2.5 rounded-xl shadow-sm pointer-events-none" style={{ backgroundColor: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex items-center gap-2">
        {onColorChange && <ColorPicker color={color} onChange={onColorChange} />}
      </div>
    </div>
    <div className="relative z-10 pointer-events-none">
      <div className="font-mono text-[11px] uppercase tracking-widest text-[#8C8670] mb-1 font-bold">{label}</div>
      <div className="text-3xl font-serif font-bold text-[#2C3338] mb-1">{value}</div>
      <div className="text-[13px] text-[#8C8670] italic">{subValue}</div>
    </div>
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
            className="p-1 hover:bg-[#E8E4D0] rounded-xl text-[#C5A059] transition-colors group/sync"
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
      className="w-full h-1 bg-[#E8E4D0] rounded-xl appearance-none cursor-pointer accent-[#C5A059]"
    />
  </div>
);

const DEFAULT_EXPENSES: RecurringExpense[] = [
  { id: 'default_car_ins', name: 'Car Insurance', amount: 1200, month: 3, months: [3, 9], frequency: 'semi-annual', category: 'insurance' },
  { id: 'default_amex_plat', name: 'Amex Platinum Fee', amount: 695, month: 1, months: [1], frequency: 'annual', category: 'subscription' },
  { id: 'default_amazon', name: 'Amazon Prime', amount: 139, month: 7, months: [7], frequency: 'annual', category: 'subscription' },
  { id: 'default_car_maint', name: 'Car Maintenance', amount: 400, month: 5, months: [2, 5, 8, 11], frequency: 'quarterly', category: 'maintenance_and_utilities' },
  { id: 'default_groceries', name: 'Groceries', amount: 800, month: 1, months: [1], frequency: 'monthly', category: 'food' },
  { id: 'default_restaurants', name: 'Restaurants & Fast Food', amount: 400, month: 1, months: [1], frequency: 'monthly', category: 'food' },
];

function Orbit() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'individual' | 'family'>('individual');
  
  const [profile, setProfile] = useState<FinanceProfile>({
    incomes: [
      { id: 'inc_1', label: 'Income Stream 1', paycheckAmount: 3500, frequencyPerMonth: 2 }
    ],
    fixedExpenses: [
      { id: '1', label: 'Rent / Mortgage', amount: 2200 },
      { id: '2', label: 'Car Payment', amount: 450 },
      { id: '3', label: 'Student Loans', amount: 300 },
      { id: '4', label: 'Day Care', amount: 1200 }
    ],
    savingsGoal: 1000,
    cardColors: {
      income: '#1E5C38',
      spend: '#8B0000',
      surplus: '#C5A059',
      totalSpend: '#1E5C38'
    },
    hasSeededDefaults: false
  });

  const [startDate, setStartDate] = useState<string>(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${new Date().getFullYear()}-12-31`);

  const [expenses, setExpenses] = useState<RecurringExpense[]>(DEFAULT_EXPENSES);

  const [isSaving, setIsSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOrbitCategory, setSelectedOrbitCategory] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<RecurringExpense>>({
    name: '',
    amount: 0,
    months: [],
    frequency: 'annual',
    category: 'other',
    paymentType: undefined,
    notes: ''
  });

  useEffect(() => {
    document.title = "Annual Orbit: Cash Flow Intelligence";
    logVisit('/orbit');
  }, []);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const categorizedPresets = {
    'Daily Living & Variable': [
      { name: 'Groceries', amount: 800, frequency: 'monthly', category: 'daily_living', month: 1 },
      { name: 'Dining Out', amount: 300, frequency: 'monthly', category: 'daily_living', month: 1 },
      { name: 'Gas / Transit', amount: 200, frequency: 'monthly', category: 'daily_living', month: 1 },
      { name: 'Gifts', amount: 500, frequency: 'annual', category: 'daily_living', month: 12 },
      { name: 'Personal Care', amount: 100, frequency: 'monthly', category: 'daily_living', month: 1 },
      { name: 'Pet Care', amount: 100, frequency: 'monthly', category: 'daily_living', month: 1 },
      { name: 'Clothing', amount: 200, frequency: 'quarterly', category: 'daily_living', month: 1 },
      { name: 'Custom Expense', amount: 0, frequency: 'monthly', category: 'other', month: 1 },
    ],
    'Streaming & Entertainment': [
      { name: 'Netflix', amount: 23, frequency: 'monthly', category: 'subscription', month: 1 },
      { name: 'Hulu', amount: 18, frequency: 'monthly', category: 'subscription', month: 1 },
      { name: 'Disney+', amount: 140, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'HBO Max', amount: 16, frequency: 'monthly', category: 'subscription', month: 1 },
      { name: 'Spotify', amount: 120, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'YouTube Premium', amount: 14, frequency: 'monthly', category: 'subscription', month: 1 },
      { name: 'Paramount+', amount: 12, frequency: 'monthly', category: 'subscription', month: 1 },
      { name: 'Peacock', amount: 12, frequency: 'monthly', category: 'subscription', month: 1 },
      { name: 'Apple TV+', amount: 10, frequency: 'monthly', category: 'subscription', month: 1 },
      { name: 'Audible', amount: 15, frequency: 'monthly', category: 'subscription', month: 1 },
      { name: 'Nintendo Switch Online', amount: 50, frequency: 'annual', category: 'subscription', month: 10 },
      { name: 'PlayStation Plus', amount: 80, frequency: 'annual', category: 'subscription', month: 11 },
      { name: 'Xbox Game Pass', amount: 120, frequency: 'annual', category: 'subscription', month: 12 },
      { name: 'Custom Entertainment', amount: 0, frequency: 'monthly', category: 'subscription', month: 1 },
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
      { name: 'Custom Finance', amount: 0, frequency: 'annual', category: 'other', month: 1 },
    ],
    'Insurance & Protection': [
      { name: 'Car Insurance', amount: 1200, frequency: 'semi-annual', category: 'insurance', month: 3 },
      { name: 'Life Insurance', amount: 500, frequency: 'annual', category: 'insurance', month: 6 },
      { name: 'Pet Insurance', amount: 400, frequency: 'annual', category: 'insurance', month: 1 },
      { name: 'Home Insurance', amount: 1500, frequency: 'annual', category: 'insurance', month: 1 },
      { name: 'Umbrella Policy', amount: 300, frequency: 'annual', category: 'insurance', month: 5 },
      { name: 'Identity Theft Protection', amount: 150, frequency: 'annual', category: 'insurance', month: 2 },
      { name: 'Custom Insurance', amount: 0, frequency: 'annual', category: 'insurance', month: 1 },
    ],
    'Home & Auto Maintenance': [
      { name: 'Car Maintenance', amount: 400, frequency: 'quarterly', category: 'maintenance_and_utilities', month: 5 },
      { name: 'Home Maintenance', amount: 1000, frequency: 'quarterly', category: 'maintenance_and_utilities', month: 3 },
      { name: 'HVAC Service', amount: 200, frequency: 'annual', category: 'maintenance_and_utilities', month: 4 },
      { name: 'Pest Control', amount: 150, frequency: 'quarterly', category: 'maintenance_and_utilities', month: 1 },
      { name: 'Pool Opening/Closing', amount: 600, frequency: 'semi-annual', category: 'maintenance_and_utilities', month: 5 },
      { name: 'Gutter Cleaning', amount: 200, frequency: 'semi-annual', category: 'maintenance_and_utilities', month: 4 },
      { name: 'Landscaping Mulch', amount: 500, frequency: 'annual', category: 'maintenance_and_utilities', month: 4 },
      { name: 'Custom Maintenance', amount: 0, frequency: 'annual', category: 'maintenance_and_utilities', month: 1 },
    ],
    'Travel & Leisure': [
      { name: 'Major Annual Vacation', amount: 5000, frequency: 'annual', category: 'vacation', month: 7 },
      { name: 'Quarterly Getaways', amount: 800, frequency: 'quarterly', category: 'vacation', month: 3 },
      { name: 'Monthly Weekend Trips', amount: 300, frequency: 'monthly', category: 'vacation', month: 1 },
      { name: 'Holiday Travel (Flights)', amount: 1500, frequency: 'annual', category: 'vacation', month: 12 },
      { name: 'Spring Break Trip', amount: 1200, frequency: 'annual', category: 'vacation', month: 4 },
      { name: 'Camping & Outdoors', amount: 400, frequency: 'semi-annual', category: 'vacation', month: 5 },
      { name: 'Ski / Snowboard Season', amount: 1000, frequency: 'annual', category: 'vacation', month: 11 },
      { name: 'Staycation Fund', amount: 100, frequency: 'monthly', category: 'vacation', month: 1 },
      { name: 'Passport / Travel Fees', amount: 160, frequency: 'one-time', category: 'other', month: 1 },
      { name: 'TSA PreCheck / Global Entry', amount: 100, frequency: 'one-time', category: 'other', month: 1 },
      { name: 'National Parks Pass', amount: 80, frequency: 'annual', category: 'subscription', month: 5 },
      { name: 'Custom Travel Adventure', amount: 0, frequency: 'annual', category: 'vacation', month: 1 },
    ],
    'Education & Learning': [
      { name: 'Tuition Payment', amount: 10000, frequency: 'semi-annual', category: 'other', month: 8 },
      { name: 'School Supplies', amount: 300, frequency: 'annual', category: 'other', month: 8 },
      { name: 'Online Courses', amount: 200, frequency: 'quarterly', category: 'subscription', month: 1 },
      { name: 'Professional Certification', amount: 500, frequency: 'annual', category: 'other', month: 6 },
      { name: 'Custom Education', amount: 0, frequency: 'annual', category: 'other', month: 1 },
    ],
    'Gifts & Donations': [
      { name: 'Holiday Gifts', amount: 1500, frequency: 'annual', category: 'other', month: 12 },
      { name: 'Birthday Fund', amount: 1000, frequency: 'annual', category: 'other', month: 1 },
      { name: 'Annual Charity Donation', amount: 2000, frequency: 'annual', category: 'other', month: 12 },
      { name: 'Alumni Association', amount: 100, frequency: 'annual', category: 'subscription', month: 9 },
      { name: 'Custom Gift/Donation', amount: 0, frequency: 'annual', category: 'other', month: 1 },
    ],
    'Memberships & Subscriptions': [
      { name: 'Amazon Prime', amount: 139, frequency: 'annual', category: 'subscription', month: 7 },
      { name: 'Costco Membership', amount: 65, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Gym Membership', amount: 60, frequency: 'monthly', category: 'health_and_fitness', month: 1 },
      { name: 'Professional Dues', amount: 300, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Cloud Storage (iCloud/Google)', amount: 120, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Newspaper/Journal Sub', amount: 150, frequency: 'annual', category: 'subscription', month: 1 },
      { name: 'Custom Membership', amount: 0, frequency: 'annual', category: 'subscription', month: 1 },
    ]
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [librarySearch, setLibrarySearch] = useState('');

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

  // Load Profile and Expenses
  const isProfileLoaded = useRef(false);
  const isDragging = useRef(false);
  useEffect(() => {
    isProfileLoaded.current = false; // Reset on user change
    if (!user || user.uid === 'guest-user') return;

    const profileRef = doc(db, 'users', user.uid, 'orbitProfile', 'main');
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        delete data.updatedAt; // Strip timestamp to allow deep comparison
        
        // Migration: Convert old primaryIncome/spouseIncome to incomes array
        if (!data.incomes) {
          data.incomes = [];
          if (data.primaryIncome) {
            data.incomes.push({ id: 'inc_primary', label: 'Income Stream 1', ...data.primaryIncome });
          }
          if (data.spouseIncome && data.spouseIncome.paycheckAmount > 0) {
            data.incomes.push({ id: 'inc_spouse', label: 'Income Stream 2', ...data.spouseIncome });
          }
          if (data.incomes.length === 0) {
            data.incomes.push({ id: 'inc_1', label: 'Income Stream 1', paycheckAmount: 3500, frequencyPerMonth: 2 });
          }
        }
        
        if (!data.automatedInvestments) {
          data.automatedInvestments = [];
        }

        // One-time seeding check
        if (data.hasSeededDefaults === undefined || data.hasSeededDefaults === false) {
          DEFAULT_EXPENSES.forEach(exp => {
            setDoc(doc(db, 'users', user.uid, 'orbitExpenses', exp.id), exp).catch(console.error);
          });
          setDoc(docSnap.ref, { ...data, hasSeededDefaults: true }, { merge: true }).catch(console.error);
          data.hasSeededDefaults = true;
        }

        if (!isProfileLoaded.current) {
          setProfile(data);
          isProfileLoaded.current = true;
        }
      } else {
        // Profile doesn't exist yet, seed expenses now
        DEFAULT_EXPENSES.forEach(exp => {
          setDoc(doc(db, 'users', user.uid, 'orbitExpenses', exp.id), exp).catch(console.error);
        });
      }
    });

    const expensesRef = collection(db, 'users', user.uid, 'orbitExpenses');
    const unsubExpenses = onSnapshot(expensesRef, (snapshot) => {
      if (isDragging.current) return;
      const exps = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as RecurringExpense[];
      
      // Sort by sortOrder if available
      exps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      
      // Auto-cleanup all duplicates (especially from multiple statement imports)
      const defaultIds = DEFAULT_EXPENSES.map(e => e.id);
      
      const duplicatesToDelete: string[] = [];
      const uniqueExps: RecurringExpense[] = [];
      const seenNormalizedNames = new Map<string, RecurringExpense>();
      
      exps.forEach(exp => {
        if (!exp.name) return;
        // Aggressive normalization: lowercase and remove all non-alphanumeric characters
        const normalized = exp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Simple fuzzy/substring check: if "NetFlix" exists, "Netflix.com" should match
        let matchedNormalized: string | null = null;
        
        // Find existing match that is a substring or vice versa
        // only for names longer than 4 chars to avoid false positives with small names
        for (const [existingNorm, existingExp] of seenNormalizedNames.entries()) {
          if (normalized.length > 4 && existingNorm.length > 4) {
            if (normalized.includes(existingNorm) || existingNorm.includes(normalized)) {
              matchedNormalized = existingNorm;
              break;
            }
          } else if (normalized === existingNorm) {
            matchedNormalized = existingNorm;
            break;
          }
        }

        if (matchedNormalized) {
          const preferred = seenNormalizedNames.get(matchedNormalized)!;
          // Priority: 1. Default ID, 2. Existing Orbit ID, 3. Earliest ID
          const isExpPreferred = defaultIds.includes(exp.id) && !defaultIds.includes(preferred.id);
          
          if (isExpPreferred) {
            duplicatesToDelete.push(preferred.id);
            seenNormalizedNames.set(normalized, exp);
            // Replace in unique list
            const idx = uniqueExps.findIndex(e => e.id === preferred.id);
            if (idx !== -1) uniqueExps[idx] = exp;
          } else {
            duplicatesToDelete.push(exp.id);
          }
        } else {
          seenNormalizedNames.set(normalized, exp);
          uniqueExps.push(exp);
        }
      });
      
      if (duplicatesToDelete.length > 0) {
        duplicatesToDelete.forEach(id => {
          deleteDoc(doc(db, 'users', user.uid, 'orbitExpenses', id)).catch(err => {
            console.error(`Cleanup failed for ${id}:`, err);
          });
        });
      }

      // Migrate old categories
      uniqueExps.forEach(exp => {
        if (exp.category === 'maintenance') {
          exp.category = 'maintenance_and_utilities';
          setDoc(doc(db, 'users', user.uid, 'orbitExpenses', exp.id), exp).catch(console.error);
        }
      });
      
      setExpenses(uniqueExps);
    });

    return () => {
      unsubProfile();
      unsubExpenses();
    };
  }, [user]);

  // --- Auto-save Profile ---
  useEffect(() => {
    if (!user || user.uid === 'guest-user' || !isAuthReady) return;

    const timer = setTimeout(() => {
      // Only save if profile has changed from what's on the server
      // This is handled by the debounce and the deep equality check in onSnapshot
      saveProfile(profile);
    }, 2000); // Increased debounce to 2 seconds to reduce flashing

    return () => clearTimeout(timer);
  }, [profile, user, isAuthReady]);

  const saveProfile = async (newProfile: FinanceProfile) => {
    if (!user || user.uid === 'guest-user') return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'orbitProfile', 'main'), {
        ...newProfile,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orbitProfile/main');
    } finally {
      setIsSaving(false);
    }
  };

  const saveExpense = async (exp: RecurringExpense) => {
    if (!user || user.uid === 'guest-user') return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'orbitExpenses', exp.id), {
        ...exp,
        sortOrder: exp.sortOrder ?? expenses.length
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orbitExpenses/${exp.id}`);
    }
  };

  const saveExpensesOrder = async (newOrder: RecurringExpense[]) => {
    if (!user || user.uid === 'guest-user') return;
    try {
      const batch = newOrder.map((exp, idx) => {
        return setDoc(doc(db, 'users', user.uid, 'orbitExpenses', exp.id), {
          ...exp,
          sortOrder: idx
        }, { merge: true });
      });
      await Promise.all(batch);
    } catch (error) {
      console.error("Error saving expenses order:", error);
    }
  };

  const deleteExpenseFromDb = async (id: string) => {
    if (!user || user.uid === 'guest-user') return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'orbitExpenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orbitExpenses/${id}`);
    }
  };

  const loadDefaultExpenses = async () => {
    if (!user || user.uid === 'guest-user') return;
    setIsSaving(true);
    try {
      // 1. Find existing expenses that match the default names to avoid duplicates
      const defaultNames = DEFAULT_EXPENSES.map(e => e.name);
      const duplicatesToDelete = expenses.filter(e => 
        defaultNames.includes(e.name) && !DEFAULT_EXPENSES.find(de => de.id === e.id)
      );
      
      const deletePromises = duplicatesToDelete.map(exp => 
        deleteDoc(doc(db, 'users', user.uid, 'orbitExpenses', exp.id))
      );
      await Promise.all(deletePromises);

      // 2. Insert defaults with fixed IDs
      const setPromises = DEFAULT_EXPENSES.map(exp => {
        return setDoc(doc(db, 'users', user.uid, 'orbitExpenses', exp.id), exp);
      });
      await Promise.all(setPromises);
    } catch (error) {
      console.error("Error loading default expenses", error);
    } finally {
      setIsSaving(false);
    }
  };

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
  const monthsInRange = useMemo(() => {
    const [sYear, sMonth] = startDate.split('-').map(Number);
    const [eYear, eMonth] = endDate.split('-').map(Number);
    return Math.max(1, (eYear - sYear) * 12 + (eMonth - sMonth) + 1);
  }, [startDate, endDate]);

  const monthlyIncome = useMemo(() => {
    return profile.incomes.reduce((sum, inc) => sum + (inc.paycheckAmount * inc.frequencyPerMonth), 0);
  }, [profile.incomes]);

  const monthlyFixedExpenses = useMemo(() => {
    return profile.fixedExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [profile.fixedExpenses]);

  const totalPeriodOrbitExpenses = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startTotalMonths = start.getFullYear() * 12 + start.getMonth();
    const endTotalMonths = end.getFullYear() * 12 + end.getMonth();

    return expenses.reduce((sum, e) => {
      if (monthsInRange === 1 && e.frequency !== 'monthly') {
        const annualTotal = e.frequency === 'bi-weekly' ? e.amount * 26 
                          : e.frequency === 'weekly' ? e.amount * 52 
                          : e.frequency === 'quarterly' ? e.amount * 4 
                          : e.frequency === 'semi-annual' ? e.amount * 2 
                          : e.amount; // annual or one-time
        return sum + (annualTotal / 12);
      }

      let occurrences = 0;
      
      if (e.frequency === 'monthly') {
        occurrences = monthsInRange;
      } else if (e.frequency === 'bi-weekly') {
        occurrences = (26 / 12) * monthsInRange;
      } else if (e.frequency === 'weekly') {
        occurrences = (52 / 12) * monthsInRange;
      } else {
        // For annual, semi-annual, quarterly, one-time
        const targetMonths: number[] = [];
        
        if (e.months && e.months.length > 0) {
          e.months.forEach(m => targetMonths.push(m - 1));
        } else {
          // Fallback to legacy single month anchor
          const anchorMonth = (e.month || 1) - 1; // 0-11
          if (e.frequency === 'annual' || e.frequency === 'one-time') {
            targetMonths.push(anchorMonth);
          } else if (e.frequency === 'semi-annual') {
            targetMonths.push(anchorMonth, (anchorMonth + 6) % 12);
          } else if (e.frequency === 'quarterly') {
            targetMonths.push(anchorMonth, (anchorMonth + 3) % 12, (anchorMonth + 6) % 12, (anchorMonth + 9) % 12);
          }
        }

        for (let m = startTotalMonths; m <= endTotalMonths; m++) {
          if (targetMonths.includes(m % 12)) {
            occurrences++;
          }
        }
      }
      
      return sum + (e.amount * occurrences);
    }, 0);
  }, [expenses, startDate, endDate, monthsInRange]);

  const next90DaysOrbitHits = useMemo(() => {
    const today = new Date();
    const currentTotalMonth = today.getFullYear() * 12 + today.getMonth();
    const future3TotalMonth = currentTotalMonth + 3;

    return expenses.reduce((sum, e) => {
      // We only care about non-monthly for the "hits" feeling
      if (e.frequency === 'monthly' || e.frequency === 'weekly' || e.frequency === 'bi-weekly') return sum;
      
      let occurrences = 0;
      const targetMonths: number[] = [];
      if (e.months && e.months.length > 0) {
        e.months.forEach(m => targetMonths.push(m - 1));
      } else {
        const anchorMonth = (e.month || 1) - 1;
        if (e.frequency === 'annual' || e.frequency === 'one-time') {
          targetMonths.push(anchorMonth);
        } else if (e.frequency === 'semi-annual') {
          targetMonths.push(anchorMonth, (anchorMonth + 6) % 12);
        } else if (e.frequency === 'quarterly') {
          targetMonths.push(anchorMonth, (anchorMonth + 3) % 12, (anchorMonth + 6) % 12, (anchorMonth + 9) % 12);
        }
      }

      for (let m = currentTotalMonth; m < future3TotalMonth; m++) {
        if (targetMonths.includes(m % 12)) {
          occurrences++;
        }
      }
      return sum + (e.amount * occurrences);
    }, 0);
  }, [expenses]);

  const totalPeriodFixedExpenses = monthlyFixedExpenses * monthsInRange;
  const totalPeriodIncome = monthlyIncome * monthsInRange;
  const totalPeriodSpend = totalPeriodFixedExpenses + totalPeriodOrbitExpenses;
  const periodSurplus = totalPeriodIncome - totalPeriodSpend;

  // 1-Month Normalized Calculations (Independent of calendar range)
  const normalizedMonthlyOrbit = useMemo(() => {
    return expenses.reduce((sum, e) => {
      const amt = Number(e.amount) || 0;
      if (e.frequency === 'monthly') return sum + amt;
      if (e.frequency === 'bi-weekly') return sum + (amt * (26 / 12));
      if (e.frequency === 'weekly') return sum + (amt * (52 / 12));
      if (e.frequency === 'annual' || e.frequency === 'one-time') return sum + (amt / 12);
      if (e.frequency === 'semi-annual') return sum + ((amt * 2) / 12);
      if (e.frequency === 'quarterly') return sum + ((amt * 4) / 12);
      if (e.frequency === 'custom') return sum + ((amt * (e.months?.length || 1)) / 12);
      return sum;
    }, 0);
  }, [expenses]);

  const normalizedMonthlySpend = monthlyFixedExpenses + normalizedMonthlyOrbit;
  const normalizedMonthlySurplus = monthlyIncome - normalizedMonthlySpend;

  const handleAddExpense = async () => {
    if (newExpense.name && newExpense.amount) {
      const finalCategory = newExpense.category === 'other' ? (newExpense.customCategory || 'other') : newExpense.category;
      const expenseToSave = {
        ...newExpense,
        category: finalCategory,
        // Optional months - can be empty
        months: newExpense.months || [],
        month: newExpense.months && newExpense.months.length > 0 ? newExpense.months[0] : 0
      };

      if (editingExpenseId) {
        const updated = { ...expenseToSave, id: editingExpenseId } as RecurringExpense;
        setExpenses(expenses.map(e => e.id === editingExpenseId ? updated : e));
        await saveExpense(updated);
      } else {
        const id = Date.now().toString();
        const created = { ...expenseToSave, id } as RecurringExpense;
        setExpenses([...expenses, created]);
        await saveExpense(created);
      }

      setNewExpense({ 
        name: '', 
        amount: 0, 
        months: [], 
        frequency: 'annual', 
        category: 'other', 
        customCategory: '',
        paymentType: undefined,
        notes: ''
      });
      setEditingExpenseId(null);
      setShowAddExpense(false);
    }
  };

  const editExpense = (exp: RecurringExpense) => {
    const isStandard = ['insurance', 'tax', 'subscription', 'maintenance_and_utilities', 'health_and_fitness', 'vacation', 'food'].includes(exp.category);
    setNewExpense({
      ...exp,
      category: isStandard ? exp.category : 'other',
      customCategory: isStandard ? '' : exp.category
    });
    setEditingExpenseId(exp.id);
    setShowAddExpense(true);
  };

  const removeExpense = async (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    await deleteExpenseFromDb(id);
  };

  const addIncome = () => {
    const newId = Date.now().toString();
    setProfile({
      ...profile,
      incomes: [...profile.incomes, { id: newId, label: 'New Income', paycheckAmount: 0, frequencyPerMonth: 2 }]
    });
  };

  const updateIncome = (id: string, updates: Partial<IncomeSource>) => {
    setProfile({
      ...profile,
      incomes: profile.incomes.map(inc => inc.id === id ? { ...inc, ...updates } : inc)
    });
  };

  const removeIncome = (id: string) => {
    setProfile({
      ...profile,
      incomes: profile.incomes.filter(inc => inc.id !== id)
    });
  };

  const addFixedExpense = () => {
    const newProfile = {
      ...profile,
      fixedExpenses: [...profile.fixedExpenses, { id: Date.now().toString(), label: 'New Expense', amount: 0 }]
    };
    setProfile(newProfile);
  };

  const removeFixedExpense = (id: string) => {
    const newProfile = {
      ...profile,
      fixedExpenses: profile.fixedExpenses.filter(e => e.id !== id)
    };
    setProfile(newProfile);
  };

  const updateFixedExpense = (id: string, updates: Partial<FixedExpense>) => {
    const newProfile = {
      ...profile,
      fixedExpenses: profile.fixedExpenses.map(e => e.id === id ? { ...e, ...updates } : e)
    };
    setProfile(newProfile);
  };

  const addAutomatedInvestment = () => {
    const newProfile = {
      ...profile,
      automatedInvestments: [...(profile.automatedInvestments || []), { 
        id: Date.now().toString(), 
        label: 'New Investment', 
        amount: 0, 
        investmentType: 'brokerage' as const, 
        frequency: 'monthly' as const 
      }]
    };
    setProfile(newProfile);
  };

  const removeAutomatedInvestment = (id: string) => {
    const newProfile = {
      ...profile,
      automatedInvestments: (profile.automatedInvestments || []).filter(i => i.id !== id)
    };
    setProfile(newProfile);
  };

  const updateAutomatedInvestment = (id: string, updates: Partial<AutomatedInvestment>) => {
    const newProfile = {
      ...profile,
      automatedInvestments: (profile.automatedInvestments || []).map(i => i.id === id ? { ...i, ...updates } : i)
    };
    setProfile(newProfile);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C3338] font-sans selection:bg-[#C5A059]/30">
      {/* Header */}
      <header className="border-b border-[#E8E4D0] bg-[#FAF9F6]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/portfolio" className="p-2 hover:bg-[#E8E4D0] rounded-xl transition-colors group">
              <ChevronLeft size={20} className="text-[#8C8670] group-hover:text-[#2C3338]" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#C5A059] rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-[#FAF9F6]" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-[#2C3338] italic leading-none">Annual Orbit</h1>
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
                  <div className="absolute top-full right-0 w-48 bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                    <button onClick={() => navigate('/orbit')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#2C3338] bg-[#E8E4D0] transition-colors text-left w-full">Annual Orbit</button>
                    <button onClick={() => navigate('/orbit/currency-converter')} className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#2C3338] hover:bg-[#E8E4D0] transition-colors text-left w-full">Currency Converter</button>
                    <div className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-[#8C8670]/50 border-t border-[#E8E4D0] mt-1 pt-3">Future Modules (TBD)</div>
                    <button className="px-4 py-1 text-[11px] font-mono uppercase tracking-widest text-[#8C8670]/40 cursor-not-allowed text-left w-full">Wealth Simulator</button>
                    <button className="px-4 py-1 text-[11px] font-mono uppercase tracking-widest text-[#8C8670]/40 cursor-not-allowed text-left w-full">Balance Sheet</button>
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
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-xl border border-[#E8E4D0]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl flex items-center justify-center">
                    <UserIcon size={20} className="text-[#8C8670]" />
                  </div>
                )}
                {user.uid === 'guest-user' ? (
                  <button 
                    onClick={() => navigate('/login?from=orbit')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] text-[#FAF9F6] rounded-xl text-[11px] font-mono uppercase tracking-widest hover:bg-[#B38F48] transition-all shadow-sm"
                  >
                    <LogIn size={14} />
                    Sign In
                  </button>
                ) : (
                  <button 
                    onClick={async () => {
                      await logout();
                      navigate('/login');
                    }}
                    className="p-2.5 bg-[#FAF9F6] border border-[#E8E4D0] text-[#8C8670] rounded-xl hover:text-[#2C3338] hover:border-[#8B0000] transition-all"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigate('/login?from=orbit')}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A059] text-[#FAF9F6] rounded-xl text-sm font-bold hover:bg-[#B38F48] transition-all"
              >
                <LogIn size={18} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Guest Mode Banner */}
        {user?.uid === 'guest-user' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="text-amber-600" size={24} />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-serif text-lg font-bold text-amber-900">You are currently in Guest Mode</h4>
                <p className="text-sm text-amber-800/80 leading-relaxed">Your Orbit progress will <span className="font-bold underline">not be saved</span>. Sign in or create an account to persist your cash flow intelligence across devices.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/login?from=orbit')}
              className="w-full sm:w-auto px-8 py-3 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#B38F48] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Secure My Data
            </button>
          </motion.div>
        )}

        {/* Cash Flow Intelligence Header */}
        <div className="mb-12 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-4xl font-serif font-bold text-[#2C3338] italic leading-tight">Annual Orbit: Cash Flow Intelligence</h2>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#C5A059] mt-2">Cash Flow Timeline: {monthsInRange} Months</p>
            </div>
          </div>
          
          <div className="py-8 border-y border-[#E8E4D0]/60 flex flex-col md:flex-row gap-12 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-[#C5A059]" />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#8C8670]">Intelligence Overview</span>
              </div>
              <p className="text-[#8C8670] text-sm leading-relaxed max-w-3xl">
                Orbit is built to work with the actual money that <span className="text-[#2C3338] font-bold">hits your bank account</span>—not your gross salary, 401k, or pre-tax figures. By focusing on your net inflow, we accurately project your true cash flow trajectory and the impact of life's big decisions.
              </p>
            </div>
            
            <div className="md:w-80 shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <Info size={14} className="text-[#C5A059]" />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#8C8670]">How to use</span>
              </div>
              <ul className="text-[11px] text-[#8C8670] space-y-2 leading-relaxed font-mono">
                <li><span className="text-[#C5A059] mr-2">01.</span> Adjust your timeline</li>
                <li><span className="text-[#C5A059] mr-2">02.</span> Add all Income Streams</li>
                <li><span className="text-[#C5A059] mr-2">03.</span> Adjust Fixed Expenses</li>
                <li><span className="text-[#C5A059] mr-2">04.</span> Track irregular Orbiting bills</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats Grid (Full Width) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            label="Period Income" 
            value={`$${totalPeriodIncome.toLocaleString()}`} 
            subValue={`Total inflow over ${monthsInRange}mo`}
            icon={TrendingUp}
            color={profile.cardColors.income}
            onColorChange={(c: string) => setProfile({...profile, cardColors: {...profile.cardColors, income: c}})}
          />
          <StatCard 
            label="Period Spend" 
            value={`$${totalPeriodSpend.toLocaleString()}`} 
            subValue="Fixed + Orbiting"
            icon={RefreshCw}
            color={profile.cardColors.spend}
            onColorChange={(c: string) => setProfile({...profile, cardColors: {...profile.cardColors, spend: c}})}
          />
          <StatCard 
            label="Period Surplus" 
            value={`$${periodSurplus.toLocaleString()}`} 
            subValue="Potential savings"
            icon={Zap}
            color={profile.cardColors.surplus}
            onColorChange={(c: string) => setProfile({...profile, cardColors: {...profile.cardColors, surplus: c}})}
            onClick={() => navigate('/orbit/capital-deployment', { state: { periodSurplus, monthsInRange, normalizedMonthlySurplus } })}
          />
        </div>

        {/* 1-Month Snapshot Sub-Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* 1 Month Income */}
          <div className="bg-[#FAF9F6]/50 border border-[#E8E4D0]/60 p-3 rounded-lg flex justify-between items-center shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">1-Month Snapshot</span>
            <span className="font-serif font-bold text-[#2C3338]">${Math.round(monthlyIncome).toLocaleString()}</span>
          </div>
          {/* 1 Month Spend */}
          <div className="bg-[#FAF9F6]/50 border border-[#E8E4D0]/60 p-3 rounded-lg flex justify-between items-center shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">1-Month Snapshot</span>
            <span className="font-serif font-bold text-[#2C3338]">${Math.round(normalizedMonthlySpend).toLocaleString()}</span>
          </div>
          {/* 1 Month Surplus */}
          <div className="bg-[#FAF9F6]/50 border border-[#E8E4D0]/60 p-3 rounded-lg flex justify-between items-center shadow-sm border-b-2" style={{ borderBottomColor: profile.cardColors.surplus }}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">1-Month Snapshot</span>
            <span className="font-serif font-bold text-[#2C3338]">${Math.round(normalizedMonthlySurplus).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-serif text-xl font-bold text-[#2C3338] flex items-center gap-3">
                  <Wallet size={20} className="text-[#C5A059]" />
                  Income & Fixed
                </h2>
                {user && user.uid !== 'guest-user' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl">
                    <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-[#C5A059] animate-pulse' : 'bg-[#1E5C38]'}`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">
                      {isSaving ? 'Saving...' : 'Synced'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {/* Income Streams */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670]">Income Streams</h3>
                    <button 
                      onClick={addIncome}
                      className="text-[9px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors"
                    >
                      + Add Income
                    </button>
                  </div>
                  
                  {profile.incomes.map((income) => (
                    <div key={income.id} className="p-4 bg-[#E8E4D0]/10 rounded-xl border border-[#E8E4D0]/50 relative group">
                      <button 
                        onClick={() => removeIncome(income.id)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-[#8B0000] hover:bg-[#8B0000]/10 p-1.5 rounded-lg transition-all"
                        title="Remove Income"
                      >
                        ✕
                      </button>
                      
                      <input 
                        type="text"
                        value={income.label}
                        onChange={(e) => updateIncome(income.id, { label: e.target.value })}
                        className="font-mono text-[10px] uppercase tracking-widest text-[#C5A059] mb-4 bg-transparent border-b border-transparent hover:border-[#E8E4D0] focus:border-[#C5A059] outline-none w-3/4"
                        placeholder="Income Name"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-[#8C8670] mb-1">Paycheck</label>
                          <div className="flex items-center gap-1 border-b border-[#E8E4D0] focus-within:border-[#C5A059]">
                            <span className="text-sm font-serif text-[#8C8670]">$</span>
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={income.paycheckAmount === 0 ? '' : income.paycheckAmount.toString()}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                updateIncome(income.id, { paycheckAmount: val === '' ? 0 : parseInt(val, 10) });
                              }}
                              className="w-full bg-transparent py-1 text-sm font-serif outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono uppercase text-[#8C8670] mb-1">Freq / Mo</label>
                          <input 
                            type="text"
                            inputMode="numeric"
                            value={income.frequencyPerMonth === 0 ? '' : income.frequencyPerMonth.toString()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              updateIncome(income.id, { frequencyPerMonth: val === '' ? 0 : parseInt(val, 10) });
                            }}
                            className="w-full bg-transparent border-b border-[#E8E4D0] py-1 text-sm font-serif focus:border-[#C5A059] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

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
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-serif font-bold text-[#2C3338]">$</span>
                          <input 
                            type="text"
                            inputMode="numeric"
                            value={exp.amount === 0 ? '' : exp.amount.toString()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              updateFixedExpense(exp.id, { amount: val === '' ? 0 : parseInt(val, 10) });
                            }}
                            className="w-16 bg-transparent text-right text-sm font-serif font-bold text-[#2C3338] focus:text-[#C5A059] outline-none"
                          />
                        </div>
                        <button 
                          onClick={() => setEditingFixedExpense(exp)}
                          className="p-1.5 text-[#8C8670] hover:text-[#C5A059] hover:bg-[#C5A059]/5 rounded transition-all"
                          title="Monthly Fixed Details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {/* Fluid Expense Grid */}
            <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-xl shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-bold text-[#2C3338] italic">Your Finance Orbit</h2>
                    <button 
                      onClick={() => setShowImportModal(true)}
                      disabled={!user || user.uid === 'guest-user'}
                      className={`md:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        (!user || user.uid === 'guest-user') 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-[#1E5C38] text-[#FAF9F6] hover:bg-[#154629]'
                      }`}
                    >
                      <Database size={12} />
                      Import
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => {
                          const year = new Date().getFullYear();
                          setStartDate(`${year}-01-01`);
                          setEndDate(`${year}-12-31`);
                          setShowCustomCalendar(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                          startDate.endsWith('-01-01') && endDate.endsWith('-12-31') && monthsInRange === 12 && !showCustomCalendar
                          ? 'bg-[#C5A059] text-white font-bold shadow-md' 
                          : 'bg-[#E8E4D0]/50 text-[#8C8670] hover:bg-[#E8E4D0]'
                        }`}
                      >
                        Annual Orbit
                      </button>
                      <button 
                        onClick={() => {
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = String(now.getMonth() + 1).padStart(2, '0');
                          const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
                          setStartDate(`${year}-${month}-01`);
                          setEndDate(`${year}-${month}-${lastDay}`);
                          setShowCustomCalendar(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                          startDate.includes(`-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`) && monthsInRange === 1 && !showCustomCalendar
                          ? 'bg-[#C5A059] text-white font-bold shadow-md' 
                          : 'bg-[#E8E4D0]/50 text-[#8C8670] hover:bg-[#E8E4D0]'
                        }`}
                      >
                        Monthly Orbit
                      </button>
                      <button 
                        onClick={() => setShowCustomCalendar(!showCustomCalendar)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                          showCustomCalendar
                          ? 'bg-[#2C3338] text-white font-bold shadow-md' 
                          : 'bg-[#E8E4D0]/50 text-[#8C8670] hover:bg-[#E8E4D0]'
                        }`}
                      >
                        Custom Frame
                      </button>
                    </div>

                    <AnimatePresence>
                      {showCustomCalendar && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-[#E8E4D0]/10 p-4 rounded-xl border border-[#E8E4D0]/60 flex flex-wrap items-end gap-6 mt-2">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] font-bold">Start Date</label>
                              <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-b border-[#E8E4D0] text-sm font-serif text-[#2C3338] outline-none focus:border-[#C5A059] transition-colors py-1"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[9px] font-mono uppercase tracking-widest text-[#8C8670] font-bold">End Date</label>
                              <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-b border-[#E8E4D0] text-sm font-serif text-[#2C3338] outline-none focus:border-[#C5A059] transition-colors py-1"
                              />
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-[#8C8670] uppercase">{monthsInRange} mo active</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <button 
                  onClick={() => setShowImportModal(true)}
                  disabled={!user || user.uid === 'guest-user'}
                  title={!user || user.uid === 'guest-user' ? "Please sign in to import statements" : ""}
                  className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    (!user || user.uid === 'guest-user') 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-[#1E5C38] text-[#FAF9F6] hover:bg-[#154629]'
                  }`}
                >
                  <Database size={14} />
                  Import Statement
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Total Spend Card (Large) */}
                <div className="col-span-2 border p-6 rounded-xl flex flex-col justify-between relative group" style={{ backgroundColor: `${profile.cardColors.totalSpend}05`, borderColor: `${profile.cardColors.totalSpend}20` }}>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <ColorPicker 
                      color={profile.cardColors.totalSpend} 
                      onChange={(c) => setProfile({...profile, cardColors: {...profile.cardColors, totalSpend: c}})} 
                    />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: profile.cardColors.totalSpend }}>Total Period Spend</h3>
                    <div className="text-3xl font-serif font-bold text-[#2C3338]">${totalPeriodSpend.toLocaleString()}</div>
                  </div>
                  <div className="text-[10px] font-mono mt-4" style={{ color: `${profile.cardColors.totalSpend}99` }}>
                    {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Fixed Expense Cards */}
                {profile.fixedExpenses.map((item, i) => {
                  const color = profile.cardColors[`fixed_${item.id}`] || '#C5A059';
                  return (
                    <div 
                      key={i} 
                      onClick={() => setEditingFixedExpense(item)}
                      className="bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-xl flex flex-col justify-between transition-all group relative hover:shadow-md cursor-pointer hover:border-[#C5A059] hover:z-50" 
                      style={{ borderTopColor: color, borderTopWidth: '4px' }}
                    >
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none rounded-xl" style={{ backgroundColor: color }} />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50" onClick={e => e.stopPropagation()}>
                        <ColorPicker 
                          color={color} 
                          onChange={(c) => setProfile({...profile, cardColors: {...profile.cardColors, [`fixed_${item.id}`]: c}})} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] group-hover:text-[#2C3338] transition-colors font-bold relative z-10 leading-tight">
                            {item.label}
                          </h3>
                        </div>
                        <div className="text-xl font-serif font-bold text-[#2C3338] relative z-10">${(item.amount * monthsInRange).toLocaleString()}</div>
                      </div>
                      <div className="flex justify-between items-center mt-3 relative z-10">
                        <div className="text-[8px] font-mono text-[#8C8670]/60 italic group-hover:text-[#C5A059] transition-colors">Period Total</div>
                        {item.paymentType && (
                          <div className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${item.paymentType === 'automated' ? 'bg-[#1E5C38]/10 text-[#1E5C38]' : 'bg-[#C5A059]/10 text-[#C5A059]'}`}>
                            {item.paymentType}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Orbiting Expense Categories */}
                {Array.from(new Set(expenses.map(e => e.category))).map((cat, i) => {
                  const categoryColors: Record<string, string> = {
                    'insurance': '#4A90E2',
                    'subscription': '#9013FE',
                    'tax': '#D0021B',
                    'maintenance_and_utilities': '#F5A623',
                    'food': '#10B981',
                    'health_and_fitness': '#F43F5E',
                    'vacation': '#06B6D4',
                    'other': '#8C8670'
                  };
                  const color = profile.cardColors[`cat_${cat}`] || categoryColors[cat as string] || '#2C3338';
                  
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const startTotalMonths = start.getFullYear() * 12 + start.getMonth();
                  const endTotalMonths = end.getFullYear() * 12 + end.getMonth();

                  const catTotal = expenses
                    .filter(e => e.category === cat)
                    .reduce((sum, e) => {
                      if (monthsInRange === 1 && e.frequency !== 'monthly') {
                        return sum + getMonthlyReserveAmount(e);
                      }
                      
                      let occurrences = 0;
                      
                      if (e.frequency === 'monthly') {
                        occurrences = monthsInRange;
                      } else if (e.frequency === 'bi-weekly') {
                        occurrences = (26 / 12) * monthsInRange;
                      } else if (e.frequency === 'weekly') {
                        occurrences = (52 / 12) * monthsInRange;
                      } else {
                        const targetMonths: number[] = [];
                        
                        if (e.months && e.months.length > 0) {
                          e.months.forEach(m => targetMonths.push(m - 1));
                        } else {
                          const anchorMonth = (e.month || 1) - 1;
                          if (e.frequency === 'annual' || e.frequency === 'one-time') {
                            targetMonths.push(anchorMonth);
                          } else if (e.frequency === 'semi-annual') {
                            targetMonths.push(anchorMonth, (anchorMonth + 6) % 12);
                          } else if (e.frequency === 'quarterly') {
                            targetMonths.push(anchorMonth, (anchorMonth + 3) % 12, (anchorMonth + 6) % 12, (anchorMonth + 9) % 12);
                          }
                        }

                        for (let m = startTotalMonths; m <= endTotalMonths; m++) {
                          if (targetMonths.includes(m % 12)) {
                            occurrences++;
                          }
                        }
                      }
                      
                      return sum + (e.amount * occurrences);
                    }, 0);
                  
                  return (
                      <div 
                        key={cat} 
                        onClick={() => setSelectedOrbitCategory(cat as string)}
                        className="bg-[#FAF9F6] border border-[#E8E4D0] p-4 rounded-xl flex flex-col justify-between transition-all group relative hover:shadow-md hover:border-[#C5A059] cursor-pointer hover:z-50" 
                        style={{ borderTopColor: color, borderTopWidth: '4px' }}
                      >
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none rounded-xl" style={{ backgroundColor: color }} />
                      <div className={`absolute top-2 right-2 transition-opacity z-50 ${profile.cardColors[`cat_${cat}`] ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <ColorPicker 
                          color={color} 
                          onChange={(c) => setProfile({...profile, cardColors: {...profile.cardColors, [`cat_${cat}`]: c}})} 
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] group-hover:text-[#2C3338] transition-colors font-bold relative z-10 leading-tight mb-1">
                          {String(cat).replace(/_/g, ' ')}
                        </h3>
                        <div className="text-xl font-serif font-bold text-[#2C3338] relative z-10 pointer-events-none">${Math.round(catTotal).toLocaleString()}</div>
                      </div>
                      <div className="text-[8px] font-mono text-[#8C8670]/60 mt-3 italic relative z-10 pointer-events-none group-hover:text-[#C5A059] transition-colors">View Expenses</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orbiting Expenses List */}
            <section className="bg-[#FAF9F6] border border-[#E8E4D0] p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl font-bold text-[#2C3338] flex items-center gap-3">
                  <RefreshCw size={20} className="text-[#C5A059]" />
                  Orbiting Expenses
                </h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={loadDefaultExpenses}
                    disabled={isSaving}
                    className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] hover:text-[#C5A059] transition-colors flex items-center gap-1 disabled:opacity-50 italic"
                  >
                    <Zap size={12} />
                    Load Default Expenses
                  </button>
                  <button 
                    onClick={() => setShowAddExpense(true)}
                    className="text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:text-[#2C3338] transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add Expense
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-[#E8E4D0] rounded-xl">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670]">No orbits tracked yet</p>
                    <button 
                      onClick={() => setShowAddExpense(true)}
                      className="mt-2 text-[10px] font-mono uppercase tracking-widest text-[#C5A059] hover:underline"
                    >
                      + Add your first expense
                    </button>
                  </div>
                ) : (
                  <Reorder.Group 
                    axis="y" 
                    values={expenses} 
                    onReorder={(newOrder) => {
                      setExpenses(newOrder);
                    }}
                    className="space-y-3"
                  >
                    {expenses.map(exp => (
                      <ReorderItem 
                        key={exp.id} 
                        exp={exp} 
                        onEdit={editExpense} 
                        onRemove={removeExpense}
                        isMonthlyOrbit={monthsInRange === 1}
                        itemProps={{
                          onDragStart: () => { isDragging.current = true; },
                          onDragEnd: () => { 
                            isDragging.current = false;
                            saveExpensesOrder(expenses); 
                          }
                        }}
                      />
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && user && (
          <StatementImportModal 
            userId={user.uid}
            onClose={() => setShowImportModal(false)}
            existingFixedExpenses={profile.fixedExpenses}
            existingOrbitExpenses={expenses}
            onExpensesExtracted={(extractedExpenses) => {
              // Iterate and save them
              const newExpenses = [...expenses];
              extractedExpenses.forEach((exp: any) => {
                newExpenses.push(exp);
                saveExpense(exp).catch(console.error);
              });
              setExpenses(newExpenses);
            }}
          />
        )}
      </AnimatePresence>

      {/* Category Details Modal */}
      <AnimatePresence>
        {selectedOrbitCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrbitCategory(null)}
              className="absolute inset-0 bg-[#2C3338]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#FAF9F6] border border-[#E8E4D0] p-8 max-w-2xl w-full rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#2C3338] capitalize">
                    {selectedOrbitCategory?.replace(/_/g, ' ')} Orbit
                  </h3>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mt-1">
                    Expenses in this category
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedOrbitCategory(null)}
                  className="p-2 hover:bg-[#E8E4D0] rounded-xl transition-colors"
                >
                  <X size={20} className="text-[#8C8670]" />
                </button>
              </div>

              <div className="space-y-3">
                {expenses.filter(e => e.category === selectedOrbitCategory).length === 0 ? (
                  <p className="text-sm font-mono text-[#8C8670]">No expenses in this category.</p>
                ) : (
                  expenses
                    .filter(e => e.category === selectedOrbitCategory)
                    .map(exp => (
                    <div 
                      key={exp.id} 
                      onClick={() => {
                        setSelectedOrbitCategory(null);
                        editExpense(exp);
                      }}
                      className={`flex justify-between items-center p-4 bg-white border border-[#E8E4D0] rounded-xl cursor-pointer hover:border-[#C5A059] hover:shadow-sm transition-all ${monthsInRange === 1 && exp.frequency !== 'monthly' ? 'border-b-[#C5A059] border-b-2' : ''}`}
                      title="Edit Expense"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#C5A059]/10 rounded-xl flex items-center justify-center shrink-0">
                          {exp.category === 'insurance' && <ShieldCheck size={18} className="text-[#C5A059]" />}
                          {exp.category === 'tax' && <DollarSign size={18} className="text-[#C5A059]" />}
                          {exp.category === 'subscription' && <RefreshCw size={18} className="text-[#C5A059]" />}
                          {(exp.category.includes('maintenance') || exp.category.includes('utilities')) ? <Home size={18} className="text-[#C5A059]" /> : null}
                          {exp.category === 'food' && <ShoppingCart size={18} className="text-[#C5A059]" />}
                          {exp.category === 'health_and_fitness' && <Activity size={18} className="text-[#C5A059]" />}
                          {exp.category === 'vacation' && <Plane size={18} className="text-[#C5A059]" />}
                          {(exp.category === 'other' || !['insurance', 'tax', 'subscription', 'maintenance_and_utilities', 'food', 'health_and_fitness', 'vacation'].includes(exp.category)) && <Zap size={18} className="text-[#C5A059]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#2C3338] truncate">{exp.name}</div>
                          <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] mt-1 whitespace-nowrap">
                            {exp.frequency.replace('-', ' ')}
                            {exp.frequency !== 'monthly' && (
                              <>
                                {' • '}
                                {exp.months && exp.months.length > 0
                                  ? `${exp.months.map(m => new Date(2000, m - 1).toLocaleString('default', { month: 'short' })).join(', ')}`
                                  : `Month ${exp.month}`
                                }
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right flex flex-col items-end min-w-[120px]">
                          <div className={`font-serif font-bold text-lg ${monthsInRange === 1 && exp.frequency !== 'monthly' ? 'text-[#C5A059]' : 'text-[#2C3338]'}`}>
                            ${(monthsInRange === 1 && exp.frequency !== 'monthly' ? getMonthlyReserveAmount(exp) : exp.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </div>
                          {monthsInRange === 1 && exp.frequency !== 'monthly' && (
                            <div className="text-[10px] text-[#C5A059] font-bold tracking-tight flex flex-col gap-0.5 items-end">
                              <span className="uppercase font-sans">Monthly Reserve</span>
                              <span className="text-[9px] opacity-80 italic lowercase font-sans font-medium whitespace-nowrap">{getMonthlyReserveExplainer(exp)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2 text-[#8C8670] group-hover:text-[#C5A059] transition-colors shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative bg-[#FAF9F6] border border-[#E8E4D0] p-8 max-w-4xl w-full rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]"
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
                  className="p-2 hover:bg-[#E8E4D0] rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form Side */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-[#FAF9F6] border border-[#E8E4D0] p-6 rounded-xl">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#C5A059] mb-6">Expense Details</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Expense Name</label>
                        <input 
                          type="text" 
                          value={newExpense.name}
                          onChange={e => setNewExpense({...newExpense, name: e.target.value})}
                          className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-xl text-sm focus:border-[#C5A059] outline-none transition-all font-serif italic"
                          placeholder="e.g. Car Insurance"
                        />
                      </div>
                      
                      {user && newExpense.name && newExpense.name.length > 2 && (
                        <div className="mt-2">
                          <ExpenseTrendGraph merchantName={newExpense.name} userId={user.uid} />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Amount ($)</label>
                          <input 
                            type="text"
                            inputMode="numeric"
                            value={newExpense.amount === 0 ? '' : newExpense.amount?.toString()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setNewExpense({...newExpense, amount: val === '' ? 0 : parseInt(val, 10)});
                            }}
                            className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-xl text-sm focus:border-[#C5A059] outline-none transition-all font-mono"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-3">
                            {['monthly', 'bi-weekly', 'weekly'].includes(newExpense.frequency || '') 
                              ? 'Month (Reference Only)' 
                              : 'Select Active Months'}
                          </label>
                          
                          {['monthly', 'bi-weekly', 'weekly'].includes(newExpense.frequency || '') ? (
                            <div className="p-3 bg-[#E8E4D0]/10 border border-[#E8E4D0] rounded-xl text-[10px] font-mono text-[#8C8670] italic">
                              This expense occurs every {newExpense.frequency === 'monthly' ? 'month' : 'week'}. All months in your timeline are automatically included.
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {monthNames.map((name, i) => {
                                const monthNum = i + 1;
                                const isSelected = newExpense.months?.includes(monthNum);
                                const maxMonths = newExpense.frequency === 'annual' || newExpense.frequency === 'one-time' ? 1 : 
                                                 newExpense.frequency === 'semi-annual' ? 2 : 
                                                 newExpense.frequency === 'quarterly' ? 4 : 12;

                                return (
                                  <button
                                    key={name}
                                    onClick={() => {
                                      const currentMonths = newExpense.months || [];
                                      let nextMonths: number[];
                                      
                                      if (isSelected) {
                                        nextMonths = currentMonths.filter(m => m !== monthNum);
                                      } else {
                                        // If at limit, replace the first one (or just don't add if we want strict)
                                        // Replacing feels more intuitive for "picking"
                                        if (currentMonths.length >= maxMonths) {
                                          nextMonths = [...currentMonths.slice(1), monthNum];
                                        } else {
                                          nextMonths = [...currentMonths, monthNum];
                                        }
                                      }
                                      setNewExpense({ ...newExpense, months: nextMonths, month: nextMonths[0] || 1 });
                                    }}
                                    className={`py-2 px-1 text-[9px] font-mono uppercase tracking-tighter border rounded-lg transition-all ${isSelected ? 'bg-[#C5A059] border-[#C5A059] text-[#FAF9F6] font-bold' : 'border-[#E8E4D0] text-[#8C8670] hover:border-[#C5A059]'}`}
                                  >
                                    {name.substring(0, 3)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Validation Hint */}
                          {!['monthly', 'bi-weekly', 'weekly'].includes(newExpense.frequency || '') && (
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-[9px] text-[#8C8670] font-mono italic">
                                {newExpense.frequency === 'annual' || newExpense.frequency === 'one-time' ? 'Select 1 month (Optional)' : 
                                 newExpense.frequency === 'semi-annual' ? 'Select 2 months (Optional)' : 
                                 newExpense.frequency === 'quarterly' ? 'Select 4 months (Optional)' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Frequency</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['annual', 'semi-annual', 'quarterly', 'monthly', 'bi-weekly', 'weekly', 'one-time'].map(freq => (
                            <button
                              key={freq}
                              onClick={() => setNewExpense({...newExpense, frequency: freq as any})}
                              className={`py-2 px-1 text-[9px] font-mono uppercase tracking-widest border rounded-xl transition-all ${newExpense.frequency === freq ? 'bg-[#C5A059] border-[#C5A059] text-[#FAF9F6] font-bold shadow-sm' : 'border-[#E8E4D0] text-[#8C8670] hover:border-[#C5A059]'}`}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['insurance', 'tax', 'subscription', 'maintenance_and_utilities', 'health_and_fitness', 'vacation', 'food', 'other'].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setNewExpense({...newExpense, category: cat})}
                              className={`py-2 px-1 text-[9px] font-mono uppercase tracking-tighter border rounded-xl transition-all ${newExpense.category === cat ? 'bg-[#2C3338] border-[#2C3338] text-[#FAF9F6] font-bold shadow-sm' : 'border-[#E8E4D0] text-[#8C8670] hover:border-[#2C3338]'}`}
                            >
                              {cat.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                        {newExpense.category === 'other' && (
                          <div className="mt-3">
                            <input 
                              type="text" 
                              value={newExpense.customCategory || ''}
                              onChange={e => setNewExpense({...newExpense, customCategory: e.target.value})}
                              className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-2 rounded-xl text-[10px] focus:border-[#C5A059] outline-none transition-all font-mono uppercase tracking-widest"
                              placeholder="Write in category..."
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setNewExpense({ 
                              ...newExpense, 
                              paymentType: newExpense.paymentType === 'automated' ? undefined : 'automated' 
                            })}
                            className={`py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all border ${newExpense.paymentType === 'automated' ? 'bg-[#1E5C38] text-white border-[#1E5C38]' : 'bg-[#FAF9F6] text-[#8C8670] border-[#E8E4D0] hover:border-[#C5A059]'}`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw size={12} className={newExpense.paymentType === 'automated' ? 'animate-spin-slow' : ''} />
                              Automated
                            </div>
                          </button>
                          <button 
                            onClick={() => setNewExpense({ 
                              ...newExpense, 
                              paymentType: newExpense.paymentType === 'manual' ? undefined : 'manual' 
                            })}
                            className={`py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all border ${newExpense.paymentType === 'manual' ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-[#FAF9F6] text-[#8C8670] border-[#E8E4D0] hover:border-[#C5A059]'}`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Zap size={12} />
                              Manual
                            </div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="font-mono text-[10px] uppercase tracking-widest text-[#8C8670] block mb-2">Strategic Notes</label>
                        <textarea 
                          value={newExpense.notes || ''}
                          onChange={e => setNewExpense({...newExpense, notes: e.target.value})}
                          placeholder="e.g. Log in to renew, account ID..."
                          className="w-full bg-[#FAF9F6] border border-[#E8E4D0] p-3 rounded-xl text-[10px] focus:border-[#C5A059] outline-none transition-all font-sans h-20 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={handleAddExpense}
                      className="w-full py-5 bg-[#C5A059] text-[#FAF9F6] font-bold rounded-xl hover:bg-[#B38F48] transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
                    >
                      <Save size={18} />
                      {editingExpenseId ? 'Update Orbit' : 'Add to Orbit'}
                    </button>
                  </div>
                </div>

                {/* Presets Side */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-[#E8E4D0]/20 p-8 rounded-xl border border-[#E8E4D0] h-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                      <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#2C3338] font-bold flex items-center gap-2">
                        <Zap size={14} className="text-[#C5A059]" />
                        Orbit Library
                      </h3>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8670]" />
                          <input 
                            type="text"
                            placeholder="Search library..."
                            value={librarySearch}
                            onChange={(e) => setLibrarySearch(e.target.value)}
                            className="bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl pl-8 pr-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#2C3338] focus:border-[#C5A059] focus:outline-none w-full"
                          />
                        </div>
                        <select 
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#2C3338] focus:border-[#C5A059] focus:outline-none"
                        >
                          <option value="All Categories">All Categories</option>
                          {Object.keys(categorizedPresets).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                      {Object.entries(categorizedPresets).flatMap(([cat, items]) => 
                        items.filter(p => 
                          (selectedCategory === 'All Categories' || cat === selectedCategory || librarySearch.length > 0) && 
                          (p.name.toLowerCase().includes(librarySearch.toLowerCase()) || cat.toLowerCase().includes(librarySearch.toLowerCase()))
                        ).map((preset: any) => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              const months = preset.months || [preset.month || 1];
                              setNewExpense({ ...preset, months, id: editingExpenseId || Date.now().toString() });
                              // Don't close modal, let user refine
                            }}
                            className="flex flex-col items-start p-4 bg-[#FAF9F6] border border-[#E8E4D0] rounded-xl hover:border-[#C5A059] hover:shadow-md transition-all group text-left relative"
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
                        ))
                      )}
                    </div>
                    
                    <div className="mt-8 p-4 bg-[#FAF9F6]/50 border border-[#E8E4D0] rounded-lg">
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
      {/* Fixed Expense Details Modal */}
      <AnimatePresence>
        {editingFixedExpense && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingFixedExpense(null)}
              className="absolute inset-0 bg-[#2C3338]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FAF9F6] w-full max-w-lg rounded-xl shadow-2xl relative z-10 overflow-hidden border border-[#E8E4D0]"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-serif text-2xl font-bold text-[#2C3338] flex items-center gap-3 italic">
                    {editingFixedExpense.label} Details
                  </h2>
                  <button 
                    onClick={() => setEditingFixedExpense(null)}
                    className="text-[#8C8670] hover:text-[#2C3338] transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                  <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] font-bold">Monthly Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8670] font-serif font-bold">$</span>
                        <input 
                          type="number"
                          value={editingFixedExpense.amount || ''}
                          onChange={(e) => setEditingFixedExpense({ ...editingFixedExpense, amount: parseInt(e.target.value) || 0 })}
                          className="bg-white border border-[#E8E4D0] rounded-xl pl-8 pr-4 py-3 text-lg font-serif text-[#2C3338] focus:border-[#C5A059] outline-none w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] font-bold">Frequency</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const currentDates = editingFixedExpense.dueDates || (editingFixedExpense.dueDate ? [editingFixedExpense.dueDate] : []);
                              let nextDates = [...currentDates];
                              if (num === 1) nextDates = nextDates.slice(0, 1);
                              else if (nextDates.length < 2) nextDates.push(0);
                              
                              setEditingFixedExpense({
                                ...editingFixedExpense,
                                paymentFrequency: num as 1 | 2,
                                dueDates: nextDates
                              });
                            }}
                            className={`py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all border ${editingFixedExpense.paymentFrequency === num || (!editingFixedExpense.paymentFrequency && num === 1) ? 'bg-[#2C3338] text-white border-[#2C3338]' : 'bg-white text-[#8C8670] border-[#E8E4D0] hover:border-[#C5A059]'}`}
                          >
                            {num}x Month
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] font-bold">
                      {editingFixedExpense.paymentFrequency === 2 ? 'Days of Month Paid' : 'Day of Month Paid'}
                    </label>
                    <div className="flex gap-4">
                      {Array.from({ length: editingFixedExpense.paymentFrequency || 1 }).map((_, idx) => {
                        const currentDates = editingFixedExpense.dueDates || (editingFixedExpense.dueDate ? [editingFixedExpense.dueDate] : []);
                        return (
                          <div key={idx} className="flex-1 relative">
                            <input 
                              type="number"
                              min="1"
                              max="31"
                              placeholder={`Date ${idx + 1}`}
                              value={currentDates[idx] || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const nextDates = [...currentDates];
                                nextDates[idx] = val;
                                setEditingFixedExpense({ ...editingFixedExpense, dueDates: nextDates, dueDate: nextDates[0] });
                              }}
                              className="bg-white border border-[#E8E4D0] rounded-xl px-4 py-3 text-lg font-serif text-[#2C3338] focus:border-[#C5A059] outline-none w-full"
                            />
                            {currentDates[idx] > 0 && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#C5A059] font-bold">
                                {idx === 0 ? '1st' : '2nd'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] font-bold">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setEditingFixedExpense({ 
                          ...editingFixedExpense, 
                          paymentType: editingFixedExpense.paymentType === 'automated' ? undefined : 'automated' 
                        })}
                        className={`py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all border ${editingFixedExpense.paymentType === 'automated' ? 'bg-[#1E5C38] text-white border-[#1E5C38]' : 'bg-white text-[#8C8670] border-[#E8E4D0] hover:border-[#C5A059]'}`}
                      >
                       <div className="flex items-center justify-center gap-2">
                         <RefreshCw size={12} className={editingFixedExpense.paymentType === 'automated' ? 'animate-spin-slow' : ''} />
                         Automated
                       </div>
                      </button>
                      <button 
                        onClick={() => setEditingFixedExpense({ 
                          ...editingFixedExpense, 
                          paymentType: editingFixedExpense.paymentType === 'manual' ? undefined : 'manual' 
                        })}
                        className={`py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all border ${editingFixedExpense.paymentType === 'manual' ? 'bg-[#C5A059] text-white border-[#C5A059]' : 'bg-white text-[#8C8670] border-[#E8E4D0] hover:border-[#C5A059]'}`}
                      >
                       <div className="flex items-center justify-center gap-2">
                         <Zap size={12} />
                         Manual
                       </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#8C8670] font-bold">Strategic Notes</label>
                    <textarea 
                      placeholder="e.g. Paid via Checking, Login: user123..."
                      value={editingFixedExpense.notes || ''}
                      onChange={(e) => setEditingFixedExpense({ ...editingFixedExpense, notes: e.target.value })}
                      className="bg-white border border-[#E8E4D0] rounded-xl px-4 py-3 text-sm font-sans text-[#2C3338] focus:border-[#C5A059] outline-none w-full h-24 resize-none"
                    />
                  </div>

                  {user && editingFixedExpense.label && editingFixedExpense.label.length > 2 && (
                    <ExpenseTrendGraph merchantName={editingFixedExpense.label} userId={user.uid} />
                  )}

                  <button 
                    onClick={() => {
                      if (editingFixedExpense) {
                        const updatedFixedExpenses = profile.fixedExpenses.map(fe => 
                          fe.id === editingFixedExpense.id ? editingFixedExpense : fe
                        );
                        const newProfile = { ...profile, fixedExpenses: updatedFixedExpenses };
                        setProfile(newProfile);
                        saveProfile(newProfile); // Save immediately
                        setEditingFixedExpense(null);
                      }
                    }}
                    className="w-full bg-[#2C3338] text-white py-4 rounded-xl font-mono uppercase tracking-[0.2em] text-xs hover:bg-[#1C2125] transition-all shadow-lg active:scale-[0.98]"
                  >
                    Save Orbit Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Surplus Allocation Modal logic removed */}
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
