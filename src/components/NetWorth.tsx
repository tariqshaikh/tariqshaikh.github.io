import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  ChevronLeft, 
  ChevronDown,
  ChevronRight,
  Plus, 
  Trash2, 
  Save, 
  PieChart as PieChartIcon, 
  History, 
  BarChart3,
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Wallet,
  CreditCard,
  Briefcase,
  PiggyBank,
  Zap,
  RefreshCw,
  Info,
  AlertCircle,
  Globe
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface NetWorthItem {
  id: string;
  userId: string;
  category: string;
  name: string;
  institution: string;
  value: number;
  isAsset: boolean;
  order: number;
}

interface SectionSettings {
  id: string;
  customTitle?: string;
  isCustom?: boolean;
  isAsset?: boolean;
  color?: string;
  includeInNetWorth?: boolean;
}

interface SectionDefinition {
  id: string;
  title: string;
  isAsset: boolean;
  color: string;
  defaultItems: string[];
  isCustom?: boolean;
  includeInNetWorth?: boolean;
}

interface HistorySnapshot {
  id: string;
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

const DEFAULT_SECTIONS: SectionDefinition[] = [
  { 
    id: 'accounts', 
    title: 'Joint Accounts', 
    isAsset: true, 
    color: '#1E5C38',
    defaultItems: [
      'Checking Account',
      'High Yield Savings Account',
      'Emergency Fund',
      'Other'
    ]
  },
  { 
    id: 'individual-accounts', 
    title: 'Individual Accounts', 
    isAsset: true, 
    color: '#2D6A4F',
    defaultItems: [
      'Checking Account',
      'Other'
    ]
  },
  { 
    id: 'long-term-assets', 
    title: 'Long Term Assets', 
    isAsset: true, 
    color: '#059669',
    defaultItems: [
      'Primary Home Mortgage Equity',
      'Car Equity',
      'Other'
    ]
  },
  { 
    id: 'investments', 
    title: 'Joint Investments', 
    isAsset: true, 
    color: '#0471A4',
    defaultItems: [
      'Brokerage',
      'Crypto',
      'Other'
    ]
  },
  { 
    id: 'retirement-1', 
    title: 'Spouse 1 Retirement', 
    isAsset: true, 
    color: '#1E5C38',
    defaultItems: [
      '401k',
      'Roth IRA',
      'Other'
    ]
  },
  { 
    id: 'retirement-2', 
    title: 'Spouse 2 Retirement', 
    isAsset: true, 
    color: '#1E5C38',
    defaultItems: [
      '401k',
      'Roth IRA',
      'Other'
    ]
  },
  { 
    id: 'debt', 
    title: 'Joint Debt', 
    isAsset: false, 
    color: '#1C355E',
    defaultItems: [
      'Student Loan',
      'Car Loan',
      'Other'
    ]
  }
];

const COLORS = ['#C5A059', '#6E8A96', '#1E5C38', '#8B0000', '#4A4A4A', '#B38F48'];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
];

// --- Helpers ---
const getInstitutionPlaceholder = (categoryId: string) => {
  const placeholders: Record<string, string> = {
    'retirement-1': 'e.g. Vanguard, Fidelity, Schwab',
    'retirement-2': 'e.g. TIAA, Empower, Betterment',
    'accounts': 'e.g. Chase, BofA, Marcus',
    'individual-accounts': 'e.g. Chase, BofA, Marcus',
    'investments': 'e.g. Robinhood, E*TRADE, Coinbase',
    'debt': 'e.g. SoFi, Mohela, Rocket Mortgage',
    'child-accounts': 'e.g. 529 Plan, UTMA, Custodial'
  };
  return placeholders[categoryId] || 'e.g. Institution Name';
};

const formatCurrency = (val: number, symbol: string = '$') => {
  if (isNaN(val)) return "0";
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
  return formatted;
};

const parseCurrency = (val: string) => {
  return Number(val.replace(/[^0-9.-]+/g, ""));
};

// --- Sub-components ---
const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const inputs = Array.from(document.querySelectorAll('.ledger-input')) as HTMLInputElement[];
    const index = inputs.indexOf(e.currentTarget);
    if (index > -1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
      inputs[index + 1].select();
    }
  }
};

const BalanceInput = React.memo(({ value, onUpdate, symbol = '$' }: { value: number, onUpdate: (val: number) => void, symbol?: string }) => {
  const [localValue, setLocalValue] = useState(formatCurrency(value, symbol));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formatCurrency(value, symbol));
    }
  }, [value, isFocused, symbol]);

  // Debounced auto-save while typing
  useEffect(() => {
    if (!isFocused) return;
    
    const timer = setTimeout(() => {
      const numericValue = parseCurrency(localValue);
      if (numericValue !== value && !isNaN(numericValue)) {
        onUpdate(numericValue);
      }
    }, 800); // 800ms debounce for quick auto-save
    
    return () => clearTimeout(timer);
  }, [localValue, isFocused, value, onUpdate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits and common separators while typing
    if (/^[0-9,]*$/.test(raw.replace(/[^0-9,]/g, ''))) {
      setLocalValue(raw);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseCurrency(localValue);
    if (numericValue !== value) {
      onUpdate(numericValue);
    }
    setLocalValue(formatCurrency(numericValue, symbol));
  };

  return (
    <div className="flex items-center justify-end">
      <span className="text-[#9CA3AF] text-xs mr-1.5 font-mono">{symbol}</span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleEnterKey}
        className="ledger-input bg-transparent text-base font-mono font-bold text-[#111827] text-right focus:outline-none border-b border-transparent focus:border-[#3B82F6] transition-colors w-32"
      />
    </div>
  );
});

const LedgerRow = React.memo(({ 
  item, 
  sectionId, 
  updateItem, 
  handleDelete, 
  deleteConfirm,
  symbol = '$'
}: { 
  item: NetWorthItem, 
  sectionId: string,
  updateItem: (id: string, field: keyof NetWorthItem, val: any) => void,
  handleDelete: (item: NetWorthItem) => void,
  deleteConfirm: { id: string, step: number } | null,
  symbol?: string
}) => {
  const [localName, setLocalName] = useState(item.name);
  const [localInstitution, setLocalInstitution] = useState(item.institution || '');

  useEffect(() => {
    setLocalName(item.name);
  }, [item.name]);

  useEffect(() => {
    setLocalInstitution(item.institution || '');
  }, [item.institution]);

  // Debounced auto-save for name
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localName !== item.name) {
        updateItem(item.id, 'name', localName);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [localName, item.id, item.name, updateItem]);

  // Debounced auto-save for institution
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localInstitution !== (item.institution || '')) {
        updateItem(item.id, 'institution', localInstitution);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [localInstitution, item.id, item.institution, updateItem]);

  return (
    <tr className="hover:bg-[#F9FAFB] group transition-colors">
      <td className="px-6 py-4">
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onKeyDown={handleEnterKey}
          placeholder="e.g. 401k"
          className="ledger-input w-full bg-transparent text-sm text-[#111827] font-semibold focus:outline-none border-b border-transparent focus:border-[#3B82F6] transition-colors"
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="text"
          value={localInstitution}
          onChange={(e) => setLocalInstitution(e.target.value)}
          onKeyDown={handleEnterKey}
          placeholder={getInstitutionPlaceholder(sectionId)}
          className="ledger-input w-full bg-transparent text-sm text-[#4B5563] focus:outline-none border-b border-transparent focus:border-[#3B82F6] transition-colors italic"
        />
      </td>
      <td className="px-6 py-4 text-right">
        <BalanceInput 
          value={item.value} 
          onUpdate={(val) => updateItem(item.id, 'value', val)} 
          symbol={symbol}
        />
      </td>
      <td className="px-3 py-4 text-center">
        <button
          onClick={() => handleDelete(item)}
          className={`p-2 rounded-full transition-all ${
            deleteConfirm?.id === item.id 
              ? 'bg-red-50 text-red-600 scale-110 shadow-sm' 
              : 'text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100'
          }`}
        >
          {deleteConfirm?.id === item.id ? (
            <AlertCircle size={16} />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </td>
    </tr>
  );
});

const LedgerSection = React.memo(({ 
  section, 
  items, 
  user, 
  isDataLoaded, 
  addItem, 
  updateItem, 
  deleteItem, 
  updateSectionTitle,
  updateSectionSetting,
  symbol = '$'
}: { 
  section: SectionDefinition & { title: string },
  items: NetWorthItem[],
  user: User | null,
  isDataLoaded: boolean,
  addItem: (cat: string) => void,
  updateItem: (id: string, field: keyof NetWorthItem, val: any) => void,
  deleteItem: (id: string) => void,
  updateSectionTitle: (id: string, title: string) => void,
  updateSectionSetting: (id: string, setting: Partial<SectionSettings>) => void,
  symbol?: string
}) => {
  const sectionItems = useMemo(() => items
    .filter(i => i.category === section.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0)), [items, section.id]);

  // Initialize with default items if empty
  useEffect(() => {
    if (user && isDataLoaded && sectionItems.length === 0 && section.defaultItems.length > 0) {
      section.defaultItems.forEach((name, idx) => {
        const id = `${section.id}-${idx}`;
        const path = `users/${user.uid}/netWorthItems/${id}`;
        setDoc(doc(db, path), {
          id,
          userId: user.uid,
          category: section.id,
          name,
          institution: '',
          value: 0,
          isAsset: section.isAsset,
          order: idx,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
    }
  }, [user, isDataLoaded, sectionItems.length, section.id, section.defaultItems, section.isAsset]);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, step: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(section.id !== 'individual-accounts' && section.id !== 'long-term-assets');

  const handleDelete = useCallback((item: NetWorthItem) => {
    if (item.value === 0) {
      deleteItem(item.id);
      return;
    }

    if (!deleteConfirm || deleteConfirm.id !== item.id) {
      setDeleteConfirm({ id: item.id, step: 1 });
    } else if (deleteConfirm.step === 1) {
      setDeleteConfirm({ id: item.id, step: 2 });
    } else {
      deleteItem(item.id);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deleteItem]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <div 
        className="px-6 py-4 flex justify-between items-center border-b border-[#F3F4F6] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
        style={{ borderLeft: `6px solid ${section.color}` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="text-[#9CA3AF]">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
          <div className="flex flex-col">
            <input
              type="text"
              defaultValue={section.title}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => updateSectionTitle(section.id, e.target.value)}
              className="bg-transparent text-[#111827] font-serif font-bold text-xl focus:outline-none border-b border-transparent hover:border-[#D1D5DB] transition-colors w-full"
            />
            <span className="text-[9px] font-mono text-[#9CA3AF] uppercase tracking-widest mt-0.5">
              {section.isAsset ? 'Asset Category' : 'Liability Category'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-2 mr-4"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider">
              Include in Net Worth
            </span>
            <button
              onClick={() => updateSectionSetting(section.id, { includeInNetWorth: !section.includeInNetWorth })}
              className={`w-8 h-4 rounded-full transition-colors relative ${section.includeInNetWorth ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${section.includeInNetWorth ? 'translate-x-4.5 left-0' : 'translate-x-0.5 left-0'}`} />
            </button>
          </div>
          {!isExpanded && (
            <span className="text-sm font-mono font-bold text-[#111827]">
              {symbol}{formatCurrency(sectionItems.reduce((acc, i) => acc + i.value, 0), symbol)}
            </span>
          )}
          <div 
            className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
            style={{ backgroundColor: `${section.color}15`, color: section.color }}
          >
            {section.isAsset ? 'Asset' : 'Liability'}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB]/50">
                      <th className="text-[10px] text-left px-6 py-3 font-mono text-[#6B7280] uppercase tracking-widest w-1/3">Description</th>
                      <th className="text-[10px] text-left px-6 py-3 font-mono text-[#6B7280] uppercase tracking-widest w-1/3">Platform / Institution</th>
                      <th className="text-[10px] text-right px-6 py-3 font-mono text-[#6B7280] uppercase tracking-widest">Balance</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {sectionItems.map((item) => (
                      <LedgerRow 
                        key={item.id}
                        item={item}
                        sectionId={section.id}
                        updateItem={updateItem}
                        handleDelete={handleDelete}
                        deleteConfirm={deleteConfirm}
                        symbol={symbol}
                      />
                    ))}
                    <tr className="bg-[#F9FAFB] font-bold">
                      <td colSpan={2} className="px-6 py-4 text-xs font-serif text-[#374151] uppercase tracking-[0.2em]">
                        {section.title} Total
                      </td>
                      <td className="px-6 py-4 text-right text-lg font-mono text-[#111827]">
                        {symbol}{formatCurrency(sectionItems.reduce((acc, i) => acc + i.value, 0), symbol)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => addItem(section.id)}
                className="w-full py-4 flex items-center justify-center gap-3 text-xs font-mono font-bold text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all border-t border-dashed border-[#E5E7EB]"
              >
                <Plus size={16} />
                ADD NEW {section.isAsset ? 'ASSET' : 'LIABILITY'} ENTRY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default function NetWorth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [items, setItems] = useState<NetWorthItem[]>([]);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [sectionSettings, setSectionSettings] = useState<SectionSettings[]>([]);
  const [appTitle, setAppTitle] = useState<string>("Net Worth Calculator");
  const [viewType, setViewType] = useState<'individual' | 'family' | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFamilyView, setIsFamilyView] = useState(false);
  const [childAccountsCount, setChildAccountsCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const navigate = useNavigate();

  const sections = useMemo(() => {
    let base = DEFAULT_SECTIONS.map(s => {
      const settings = sectionSettings.find(set => set.id === s.id);
      let title = settings?.customTitle || s.title;
      
      if (viewType === 'individual') {
        // Individual view: remove "Joint" or "Spouse" references
        title = title.replace('Joint ', '').replace('Spouse 1 ', '').replace('Spouse 2 ', '');
        if (s.id === 'retirement-2') return null; 
      }
      return { ...s, title, includeInNetWorth: settings?.includeInNetWorth ?? true };
    }).filter(Boolean) as (SectionDefinition & { title: string, includeInNetWorth: boolean })[];

    const customSections = sectionSettings.filter(s => s.isCustom).map(s => ({
      id: s.id,
      title: s.customTitle || 'Custom Section',
      isAsset: s.isAsset ?? true,
      color: s.color || '#6B7280',
      defaultItems: [],
      isCustom: true,
      includeInNetWorth: s.includeInNetWorth ?? true
    }));

    base = [...base, ...customSections];

    if (childAccountsCount > 0) {
      base.push({
        id: 'child-accounts',
        title: 'Child Accounts',
        isAsset: true,
        color: '#C5A059',
        defaultItems: Array(childAccountsCount).fill('Child Account'),
        includeInNetWorth: true
      });
    }

    return base;
  }, [viewType, childAccountsCount, sectionSettings]);

  const currentCurrency = useMemo(() => 
    CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0], 
    [currencyCode]
  );

  // --- Auth & Data ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (!u && isAuthReady) navigate('/orbit');
    });
    return () => unsubscribe();
  }, [navigate, isAuthReady]);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const itemsRef = collection(db, 'users', user.uid, 'netWorthItems');
    const unsubItems = onSnapshot(itemsRef, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NetWorthItem)));
      setIsDataLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'netWorthItems');
    });

    const historyRef = query(collection(db, 'users', user.uid, 'netWorthHistory'), orderBy('date', 'asc'));
    const unsubHistory = onSnapshot(historyRef, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HistorySnapshot)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'netWorthHistory');
    });

    const settingsRef = collection(db, 'users', user.uid, 'sectionSettings');
    const unsubSettings = onSnapshot(settingsRef, (snapshot) => {
      setSectionSettings(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SectionSettings)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sectionSettings');
    });

    const appSettingsRef = doc(db, 'users', user.uid, 'appSettings', 'general');
    const unsubAppTitle = onSnapshot(appSettingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAppTitle(data.appTitle || "Net Worth Calculator");
        setViewType(data.viewType || null);
        setCurrencyCode(data.currencyCode || "USD");
        setChildAccountsCount(data.childAccountsCount || 0);
        if (!data.viewType) {
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'appSettings');
    });

    return () => {
      unsubItems();
      unsubHistory();
      unsubSettings();
      unsubAppTitle();
    };
  }, [user, isAuthReady]);

  // --- Calculations ---
  const visibleSectionIds = useMemo(() => sections.map(s => s.id), [sections]);
  
  const visibleItems = useMemo(() => 
    items.filter(i => visibleSectionIds.includes(i.category)), 
    [items, visibleSectionIds]
  );

  const includedSectionIds = useMemo(() => 
    sections.filter(s => s.includeInNetWorth).map(s => s.id),
    [sections]
  );

  const totalAssets = useMemo(() => 
    visibleItems
      .filter(i => i.isAsset && includedSectionIds.includes(i.category))
      .reduce((acc, i) => acc + i.value, 0), 
    [visibleItems, includedSectionIds]
  );
  
  const totalLiabilities = useMemo(() => 
    visibleItems
      .filter(i => !i.isAsset && includedSectionIds.includes(i.category))
      .reduce((acc, i) => acc + i.value, 0), 
    [visibleItems, includedSectionIds]
  );
  
  const netWorth = totalAssets - totalLiabilities;
  
  const chartData = useMemo(() => {
    const grouped = visibleItems.filter(i => i.isAsset && i.value > 0).reduce((acc: any, item) => {
      const section = sections.find(s => s.id === item.category);
      const label = section?.title || item.category;
      acc[label] = (acc[label] || 0) + item.value;
      return acc;
    }, {});
    return Object.keys(grouped).map(name => ({ name, value: grouped[name] }));
  }, [visibleItems, sections]);

  // --- Actions ---
  const updateItem = useCallback(async (itemId: string, field: keyof NetWorthItem, value: any) => {
    if (!user) return;
    const path = `users/${user.uid}/netWorthItems/${itemId}`;
    
    try {
      await setDoc(doc(db, path), {
        [field]: field === 'value' ? Number(value) : value,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  // Migrate Long Term Assets
  useEffect(() => {
    if (!user || !isDataLoaded || items.length === 0) return;

    const itemsToMigrate = items.filter(item => 
      (item.category === 'accounts' || item.category === 'individual-accounts') && 
      (item.name === 'Primary Home Mortgage Equity' || item.name === 'Car Equity')
    );

    if (itemsToMigrate.length > 0) {
      itemsToMigrate.forEach(item => {
        updateItem(item.id, 'category', 'long-term-assets');
      });
    }
  }, [user, isDataLoaded, items, updateItem]);

  const addItem = useCallback(async (category: string) => {
    if (!user) return;
    const id = Math.random().toString(36).substring(7);
    const path = `users/${user.uid}/netWorthItems/${id}`;
    const isAsset = sections.find(s => s.id === category)?.isAsset ?? true;
    
    try {
      await setDoc(doc(db, path), {
        id,
        userId: user.uid,
        category,
        name: '',
        institution: '',
        value: 0,
        isAsset,
        order: items.filter(i => i.category === category).length,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user, sections, items]);

  const deleteItem = useCallback(async (itemId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/netWorthItems/${itemId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }, [user]);

  const updateSectionTitle = useCallback(async (sectionId: string, newTitle: string) => {
    if (!user) return;
    const path = `users/${user.uid}/sectionSettings/${sectionId}`;
    try {
      await setDoc(doc(db, path), { customTitle: newTitle }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  const updateSectionSetting = useCallback(async (sectionId: string, setting: Partial<SectionSettings>) => {
    if (!user) return;
    const path = `users/${user.uid}/sectionSettings/${sectionId}`;
    try {
      await setDoc(doc(db, path), setting, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  const addCustomSection = useCallback(async (isAsset: boolean) => {
    if (!user) return;
    const id = `custom-${Math.random().toString(36).substring(7)}`;
    const path = `users/${user.uid}/sectionSettings/${id}`;
    try {
      await setDoc(doc(db, path), {
        id,
        customTitle: isAsset ? 'New Asset Category' : 'New Liability Category',
        isCustom: true,
        isAsset,
        color: isAsset ? '#059669' : '#DC2626',
        includeInNetWorth: true
      });
      setIsAddingSection(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  const updateAppTitle = useCallback(async (newTitle: string) => {
    if (!user) return;
    const path = `users/${user.uid}/appSettings/general`;
    try {
      await setDoc(doc(db, path), { appTitle: newTitle }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  const updateViewType = useCallback(async (type: 'individual' | 'family') => {
    if (!user) return;
    const path = `users/${user.uid}/appSettings/general`;
    try {
      await setDoc(doc(db, path), { viewType: type }, { merge: true });
      setShowOnboarding(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  const updateCurrency = useCallback(async (code: string) => {
    if (!user) return;
    const path = `users/${user.uid}/appSettings/general`;
    try {
      await setDoc(doc(db, path), { currencyCode: code }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  const updateChildAccountsCount = useCallback(async (count: number) => {
    if (!user) return;
    const path = `users/${user.uid}/appSettings/general`;
    try {
      await setDoc(doc(db, path), { childAccountsCount: count }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }, [user]);

  const [showSaveToast, setShowSaveToast] = useState(false);

  const saveSnapshot = async () => {
    if (!user) return;
    const date = new Date().toISOString().split('T')[0];
    const id = date;
    try {
      await setDoc(doc(db, 'users', user.uid, 'netWorthHistory', id), {
        userId: user.uid,
        date,
        totalAssets,
        totalLiabilities,
        netWorth,
        updatedAt: serverTimestamp()
      });
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'netWorthHistory');
    }
  };

  const analyzeNetWorth = async () => {
    if (!user) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Analyze this net worth profile:
        - Total Assets: ${currentCurrency.symbol}${totalAssets.toLocaleString()}
        - Total Liabilities: ${currentCurrency.symbol}${totalLiabilities.toLocaleString()}
        - Net Worth: ${currentCurrency.symbol}${netWorth.toLocaleString()}
        - Asset Breakdown: ${JSON.stringify(chartData)}
        
        Provide 3 strategic insights on asset allocation, debt management, and wealth building. Be punchy and professional. Use markdown.
      `;
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiAnalysis(result.text || "Analysis complete.");
    } catch (e) {
      setAiAnalysis("Unable to analyze at this time.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isAuthReady || !isDataLoaded) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-mono text-[#6E8A96] uppercase tracking-[0.3em] animate-pulse">Initializing Ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827] font-sans selection:bg-[#3B82F6]/30">
      {/* Save Toast */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[100] bg-[#111827] text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-[#333333]"
          >
            <div className="w-2 h-2 bg-[#C5A059] rounded-full animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest">Snapshot Recorded Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/orbit/dashboard" className="p-2 hover:bg-[#F3F4F6] rounded-md transition-colors group">
              <ChevronLeft size={20} className="text-[#6B7280] group-hover:text-[#111827]" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-xl font-serif font-bold text-[#111827] tracking-tight px-1">
                {appTitle}
              </h1>
              <span className="text-[9px] font-mono text-[#9CA3AF] uppercase tracking-widest px-1">Financial Position Ledger</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6 mr-4">
              <Link to="/orbit/dashboard" className="text-[11px] font-mono uppercase tracking-widest text-[#6B7280] hover:text-[#111827] transition-colors">Dashboard</Link>
              
              <div className="relative group py-2">
                <button className="text-[11px] font-mono uppercase tracking-widest text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1">
                  Tools <ChevronDown size={12} />
                </button>
                <div className="absolute top-full right-0 w-48 bg-white border border-[#E5E7EB] rounded-[2px] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                  <Link to="/orbit/balance-sheet" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#111827] bg-[#F3F4F6] transition-colors text-left">Balance Sheet</Link>
                  <Link to="/orbit/retirement-planner" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors text-left">Retirement Planner</Link>
                  <Link to="/orbit/simulator" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors text-left">Wealth Simulator</Link>
                  <Link to="/orbit/history" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors text-left">Historical Performance</Link>
                  <Link to="/orbit/currency-converter" className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors text-left">Currency Converter</Link>
                </div>
              </div>
            </nav>
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-[#1E5C38]/10 text-[#1E5C38] rounded-full mr-2">
              <div className="w-1.5 h-1.5 bg-[#1E5C38] rounded-full animate-pulse" />
              <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Live Sync Active</span>
            </div>

            <div className="relative group/currency">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-[10px] font-mono font-bold text-[#4B5563] hover:border-[#3B82F6] transition-all">
                <Globe size={12} className="text-[#3B82F6]" />
                {currentCurrency.code} ({currentCurrency.symbol})
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-xl opacity-0 invisible group-hover/currency:opacity-100 group-hover/currency:visible transition-all z-[100] min-w-[200px] py-1 max-h-[400px] overflow-y-auto">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => updateCurrency(c.code)}
                    className={`w-full text-left px-4 py-2 text-[10px] font-mono hover:bg-[#F3F4F6] transition-colors flex justify-between items-center ${currencyCode === c.code ? 'text-[#3B82F6] bg-[#F3F4F6]' : 'text-[#4B5563]'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="font-bold">{c.symbol}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-[#E5E7EB] mx-2" />

            <button 
              onClick={analyzeNetWorth}
              className="flex items-center gap-2 px-5 py-2 bg-[#111827] text-white rounded-md text-xs font-bold hover:bg-[#1F2937] transition-all shadow-sm"
            >
              <Zap size={16} className="text-[#FBBF24]" />
              AI Audit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left & Middle Columns: Ledgers */}
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 gap-10">
              {sections.map(s => (
                <div key={s.id}>
                  <LedgerSection 
                    section={s} 
                    items={items}
                    user={user}
                    isDataLoaded={isDataLoaded}
                    addItem={addItem}
                    updateItem={updateItem}
                    deleteItem={deleteItem}
                    updateSectionTitle={updateSectionTitle}
                    updateSectionSetting={updateSectionSetting}
                    symbol={currentCurrency.symbol}
                  />
                </div>
              ))}
              
              {/* Add New Category Placeholder */}
              {!isAddingSection ? (
                <button 
                  onClick={() => setIsAddingSection(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-8 bg-transparent border-2 border-dashed border-[#D1D5DB] text-[#6B7280] hover:text-[#111827] hover:border-[#9CA3AF] hover:bg-[#F9FAFB] rounded-xl font-bold uppercase tracking-widest transition-all"
                >
                  <Plus size={20} />
                  Add New Category
                </button>
              ) : (
                <div className="w-full flex flex-col items-center justify-center gap-4 px-6 py-8 bg-white border-2 border-dashed border-[#D1D5DB] rounded-xl">
                  <span className="text-sm font-bold text-[#374151] uppercase tracking-widest">Select Category Type</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => addCustomSection(true)}
                      className="px-6 py-2 bg-[#059669] text-white rounded-lg font-bold hover:bg-[#047857] transition-colors"
                    >
                      Asset
                    </button>
                    <button 
                      onClick={() => addCustomSection(false)}
                      className="px-6 py-2 bg-[#DC2626] text-white rounded-lg font-bold hover:bg-[#B91C1C] transition-colors"
                    >
                      Liability
                    </button>
                    <button 
                      onClick={() => setIsAddingSection(false)}
                      className="px-6 py-2 bg-transparent border border-[#D1D5DB] text-[#6B7280] rounded-lg font-bold hover:bg-[#F3F4F6] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Net Worth Summary Row in Ledger Area */}
            <div className="bg-white border border-[#E5E7EB] p-8 rounded-xl flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.2em] mb-1">Aggregate Assets</span>
                <span className="text-2xl font-bold text-[#059669] tracking-tight">{currentCurrency.symbol}{formatCurrency(totalAssets, currentCurrency.symbol)}</span>
              </div>
              <div className="hidden md:block text-[#D1D5DB] text-3xl font-thin">−</div>
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.2em] mb-1">Aggregate Liabilities</span>
                <span className="text-2xl font-bold text-[#DC2626] tracking-tight">{currentCurrency.symbol}{formatCurrency(totalLiabilities, currentCurrency.symbol)}</span>
              </div>
              <div className="hidden md:block text-[#D1D5DB] text-3xl font-thin">=</div>
              <div className="flex flex-col items-center md:items-end bg-[#F9FAFB] px-6 py-3 rounded-lg border border-[#F3F4F6]">
                <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.2em] mb-1">Net Worth Position</span>
                <span className="text-3xl font-serif font-bold text-[#111827] tracking-tight">{currentCurrency.symbol}{formatCurrency(netWorth, currentCurrency.symbol)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Charts */}
          <div className="lg:col-span-4 space-y-6">
            {/* Summary Cards */}
            <div>
              <div className="bg-[#111827] rounded-xl overflow-hidden shadow-xl">
                <div className="p-8 text-center border-b border-white/10">
                  <div className="text-[11px] font-mono text-white/50 uppercase tracking-[0.3em] mb-2">Total Net Worth</div>
                  <div className="text-5xl font-serif font-bold text-white tracking-tighter">{currentCurrency.symbol}{formatCurrency(netWorth, currentCurrency.symbol)}</div>
                </div>
                <div className="p-4 bg-white/5 flex justify-between items-center px-8">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Status</span>
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Verified
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center shadow-sm">
                  <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.2em] mb-1">Total Assets</div>
                  <div className="text-xl font-serif font-bold text-[#059669] tracking-tight">{currentCurrency.symbol}{formatCurrency(totalAssets, currentCurrency.symbol)}</div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center shadow-sm">
                  <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.2em] mb-1">Total Debt</div>
                  <div className="text-xl font-serif font-bold text-[#DC2626] tracking-tight">{currentCurrency.symbol}{formatCurrency(totalLiabilities, currentCurrency.symbol)}</div>
                </div>
              </div>

              <button 
                onClick={saveSnapshot}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-4 bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] rounded-xl text-sm font-bold transition-all shadow-sm"
                title="Save a snapshot of your current net worth to history"
              >
                <History size={18} className="text-[#6B7280]" />
                Take a Snapshot
              </button>
              <p className="text-center text-[10px] text-[#9CA3AF] mt-2 font-mono uppercase tracking-wider">
                This will add it to your performance history
              </p>

              <button 
                onClick={() => updateChildAccountsCount(childAccountsCount + 1)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-transparent border border-dashed border-[#D1D5DB] text-[#6B7280] hover:text-[#111827] hover:border-[#9CA3AF] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                <Plus size={14} /> Add Child Account
              </button>
            </div>

            {/* Allocation Chart */}
            <div className="bg-white border border-[#E5E7EB] p-8 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif text-lg font-bold text-[#111827]">Asset Allocation</h3>
                <PieChartIcon size={18} className="text-[#9CA3AF]" />
              </div>
              <div className="h-[280px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-mono text-[#9CA3AF] uppercase tracking-widest">Total</span>
                  <span className="text-xl font-bold text-[#111827]">${formatCurrency(totalAssets)}</span>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {chartData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3 group">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-medium text-[#4B5563] group-hover:text-[#111827] transition-colors">{d.name}</span>
                    <div className="flex-1 border-b border-dotted border-[#E5E7EB] mx-2" />
                    <span className="text-xs font-bold text-[#111827]">{((d.value / totalAssets) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Audit */}
            <AnimatePresence>
              {aiAnalysis && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-[#111827] p-8 rounded-xl relative shadow-lg"
                >
                  <div className="absolute -top-3 left-8 bg-[#111827] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Zap size={12} className="text-[#FBBF24]" />
                    Strategic Audit
                  </div>
                  
                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <RefreshCw className="animate-spin text-[#111827]" size={32} />
                      <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-widest">Analyzing Portfolio...</span>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <div className="text-[13px] text-[#374151] leading-relaxed space-y-4 font-serif italic">
                        <div dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>') }} />
                      </div>
                    </div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-4 rounded-lg text-center">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF]">Next Scheduled Update</p>
              <p className="text-xs font-bold text-[#4B5563] mt-1">April 05, 2026</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 mt-12 border-t border-[#E5E7EB]">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9CA3AF]">
            Orbit Ledger Engine — v2.0.4
          </div>
          <div className="flex gap-6 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
            <span>Privacy</span>
            <span>Security</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#111827]/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-[#E5E7EB]"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="text-[#111827]" size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#111827] mb-2">Welcome to Orbit</h2>
                <p className="text-[#6B7280] text-sm mb-8">Let's set up your ledger. Is this balance sheet for an individual or a family?</p>
                
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => updateViewType('individual')}
                    className="flex items-center justify-between p-4 border-2 border-[#E5E7EB] hover:border-[#111827] rounded-xl transition-all group text-left"
                  >
                    <div>
                      <div className="font-bold text-[#111827]">Individual</div>
                      <div className="text-xs text-[#6B7280]">Personal assets and liabilities</div>
                    </div>
                    <ArrowUpRight className="text-[#D1D5DB] group-hover:text-[#111827] transition-colors" size={20} />
                  </button>
                  
                  <button 
                    onClick={() => updateViewType('family')}
                    className="flex items-center justify-between p-4 border-2 border-[#E5E7EB] hover:border-[#111827] rounded-xl transition-all group text-left"
                  >
                    <div>
                      <div className="font-bold text-[#111827]">Family</div>
                      <div className="text-xs text-[#6B7280]">Joint accounts, spouse, and dependents</div>
                    </div>
                    <ArrowUpRight className="text-[#D1D5DB] group-hover:text-[#111827] transition-colors" size={20} />
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-[#F3F4F6]">
                  <p className="text-[10px] font-mono text-[#9CA3AF] uppercase tracking-widest">You can change this anytime in settings</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
