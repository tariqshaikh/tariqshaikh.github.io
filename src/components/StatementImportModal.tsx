import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Database,
  History,
  Info,
  Zap,
  Download,
  RefreshCw
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, setDoc, doc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface StatementImportModalProps {
  userId: string;
  onClose: () => void;
  onExpensesExtracted: (expenses: Partial<any>[]) => void;
  existingFixedExpenses?: any[];
  existingOrbitExpenses?: any[];
}

interface ParsedExpense {
  name: string;
  amount: number;
  frequency: 'annual' | 'semi-annual' | 'quarterly' | 'monthly' | 'bi-weekly' | 'weekly' | 'one-time';
  category: string;
  date?: string; // YYYY-MM-DD
  confidence: number; // 0-100
  selected?: boolean;
  historicalAverage?: number;
  useAverage?: boolean;
  hitCount?: number;
  alreadyTracking?: boolean;
}

interface UploadLog {
  id: string;
  fileName: string;
  uploadDate: any;
  status: 'processed' | 'failed';
  expensesFound: number;
  rawFileContent?: string;
}

export default function StatementImportModal({ 
  userId, 
  onClose, 
  onExpensesExtracted,
  existingFixedExpenses,
  existingOrbitExpenses
}: StatementImportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<UploadLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    if (userId === 'guest-user') return;
    setIsLoadingHistory(true);
    try {
      // 1. Check primary and legacy collections without strict ordering (safer for mixed schemas)
      const collRef = collection(db, 'users', userId, 'statementUploads');
      const legacyCollRef = collection(db, 'users', userId, 'statementUploadHistory');
      const alternateLegacyCollRef = collection(db, 'users', userId, 'uploads'); // Just in case
      
      const [snapshot, legacySnapshot, altSnapshot] = await Promise.all([
        getDocs(collRef).catch(() => ({ docs: [], forEach: () => {} })),
        getDocs(legacyCollRef).catch(() => ({ docs: [], forEach: () => {} })),
        getDocs(alternateLegacyCollRef).catch(() => ({ docs: [], forEach: () => {} }))
      ]);

      const logs: UploadLog[] = [];
      
      snapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() } as UploadLog);
      });

      legacySnapshot.forEach(doc => {
        const data = doc.data();
        if (!logs.find(l => l.id === doc.id)) {
          logs.push({ 
            id: doc.id, 
            fileName: data.fileName || 'Legacy Statement', 
            uploadDate: data.date || data.uploadDate || null, 
            status: data.status || 'processed',
            expensesFound: data.expenseCount || data.expensesFound || 0 
          } as any);
        }
      });

      altSnapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        if (!logs.find(l => l.id === doc.id)) {
          logs.push({
            id: doc.id,
            fileName: data.name || data.fileName || 'Old Upload',
            uploadDate: data.date || data.uploadDate || data.timestamp || null,
            status: data.status || 'processed',
            expensesFound: data.count || data.expensesFound || 0
          } as any);
        }
      });

      // 2. Client-side sort to avoid silent query failures due to missing indexes or fields
      const sortedLogs = logs.sort((a, b) => {
        const dateA = a.uploadDate?.toDate ? a.uploadDate.toDate() : (a.uploadDate instanceof Date ? a.uploadDate : new Date(0));
        const dateB = b.uploadDate?.toDate ? b.uploadDate.toDate() : (b.uploadDate instanceof Date ? b.uploadDate : new Date(0));
        return dateB.getTime() - dateA.getTime();
      });

      setHistory(sortedLogs);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
      setError(null);
    }
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);

    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    };

    try {
      const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '';
      if (!apiKey) throw new Error("Gemini API Key is missing");
      
      const ai = new GoogleGenAI({ apiKey });
      const promptText = `
        You are a financial AI assistant. Analyze the following credit card statement data.
        Identify ONLY recurring, fixed, or seasonal expenses.
        IGNORE variable, day-to-day spending (coffee, groceries, restaurants, etc).

        HISTORICAL TIMELINE RULE:
        - If a merchant/expense appears multiple times (e.g. a monthly Netflix charge appearing 3 times in a long statement), return EACH individual occurrence as a separate object in the JSON array. This is critical for building a historical trend timeline. DO NOT consolidate them into a single entry.

        DATA CLEANING RULES:
        - For "name": Clean up vendor names. Convert ALL CAPS bank descriptions (e.g. "NETFLIX.COM* 800-456-7890") into clean, human-readable Title Case names (e.g. "Netflix"). 
        - STRIP ALL NON-BRANDING TEXT: Remove suffixes like "Annual Membership", "Fee", "Member Fee", "Subscription", "Service", "Monthly", bank codes, phone numbers, and location info.
        - Example: "CHASE SAPPHIRE ANNUAL MEMBERSHIP" -> "Chase Sapphire".
        - Example: "AMEX PLATINUM FEE" -> "Amex Platinum".
        - Example: "NETFLIX.COM INTERNET" -> "Netflix".
        
        - Keep proper acronyms uppercase if they make sense (e.g., "PSEG", "NJ").
        - Strip transaction codes, phone numbers, and web suffixes if they clutter the primary name.

        CATEGORIZATION RULES:
        - Categories: 'insurance', 'subscription', 'tax', 'maintenance_and_utilities', 'food', 'health_and_fitness', 'vacation', or 'other'.
        - Membership fees -> 'subscription'.
        - Utility bills -> 'maintenance_and_utilities'.
        - Gyms/Health -> 'health_and_fitness'.
        
        Estimate frequency: 'annual', 'semi-annual', 'quarterly', 'monthly', 'bi-weekly', 'weekly', or 'one-time'.
        Confidence score: 0 to 100.

        Respond explicitly in JSON array format.
        Structure:
        [
          {
            "name": "Vendor Name",
            "amount": 15.99,
            "frequency": "monthly",
            "category": "subscription",
            "date": "YYYY-MM-DD",
            "confidence": 95
          }
        ]
      `;

      let allContents: any[] = [promptText];
      let fileContents: { name: string, isPdf: boolean, type: string, rawSave: string }[] = [];

      for (const f of files) {
        const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          if (f.size > 2 * 1024 * 1024) throw new Error(`PDF file ${f.name} must be less than 2MB.`);
          const arrayBuffer = await f.arrayBuffer();
          const base64Str = arrayBufferToBase64(arrayBuffer);
          
          allContents.push({
            inlineData: {
              data: base64Str,
              mimeType: 'application/pdf'
            }
          });
          
          fileContents.push({ 
            name: f.name, 
            isPdf: true, 
            type: f.type,
            rawSave: base64Str.length < 800000 ? base64Str : "" 
          });
        } else {
          const text = await f.text();
          allContents.push(`\n\nStatement Data (${f.name}):\n${text.substring(0, 15000)}`);
          fileContents.push({ 
            name: f.name, 
            isPdf: false, 
            type: f.type,
            rawSave: text.substring(0, 500000) 
          });
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: allContents
      });

      let jsonStr = response.text || "[]";
      // Clean up markdown markers if present
      jsonStr = jsonStr.replace(/\\"\\"\\"json/g, '').replace(/\\"\\"\\"/g, '').trim();

      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);

      const toTitleCase = (str: string) => {
        return str.toLowerCase().split(' ').map(word => {
          return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
      };

      const parsed = (JSON.parse(jsonStr) as ParsedExpense[]).map(p => ({
        ...p,
        name: p.name === p.name.toUpperCase() ? toTitleCase(p.name) : p.name
      }));
      
      const configured = parsed.map(p => ({
        ...p,
        selected: p.confidence > 70,
        useAverage: false
      }));

      // Enrich with intelligence
      if (userId !== 'guest-user' && configured.length > 0) {
        setIsEnriching(true);
        try {
          // 1. Pre-process current Orbit data once
          const currentOrbitHits: Record<string, number[]> = {};
          
          if (existingOrbitExpenses) {
            existingOrbitExpenses.forEach(e => {
              const name = e.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (!currentOrbitHits[name]) currentOrbitHits[name] = [];
              currentOrbitHits[name].push(e.amount);
            });
          }
          
          if (existingFixedExpenses) {
            existingFixedExpenses.forEach(e => {
              const name = e.label.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (!currentOrbitHits[name]) currentOrbitHits[name] = [];
              currentOrbitHits[name].push(e.amount);
            });
          }

          // 2. Fetch historical intelligence once
          const intelQuery = query(collection(db, 'users', userId, 'expenseIntelligence'));
          const snapshot = await getDocs(intelQuery);
          const historyHits: Record<string, number[]> = {};
          
          snapshot.forEach(doc => {
            const data = doc.data();
            const name = (data.merchantName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!historyHits[name]) historyHits[name] = [];
            historyHits[name].push(data.amount);
          });

          // 3. Map with fuzzy matching in memory
          const enriched = configured.map(p => {
            const normalizedNew = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const allHits: number[] = [];
            let isAlreadyTracking = false;

            // Check current hits
            Object.entries(currentOrbitHits).forEach(([name, hits]) => {
              // Substring check for near-duplicates
              if (normalizedNew.length > 4 && name.length > 4) {
                if (name.includes(normalizedNew) || normalizedNew.includes(name)) {
                  allHits.push(...hits);
                  isAlreadyTracking = true;
                }
              } else if (name === normalizedNew) {
                allHits.push(...hits);
                isAlreadyTracking = true;
              }
            });

            // Check history hits
            Object.entries(historyHits).forEach(([name, hits]) => {
              if (normalizedNew.length > 4 && name.length > 4) {
                if (name.includes(normalizedNew) || normalizedNew.includes(name)) {
                  allHits.push(...hits);
                }
              } else if (name === normalizedNew) {
                allHits.push(...hits);
              }
            });

            if (allHits.length > 0) {
              const avg = allHits.reduce((a, b) => a + b, 0) / allHits.length;
              return {
                ...p,
                historicalAverage: avg,
                hitCount: allHits.length,
                useAverage: false,
                alreadyTracking: isAlreadyTracking,
                selected: isAlreadyTracking ? false : p.selected // Default to unselected if tracking
              };
            }
            
            if (isAlreadyTracking) {
               return {
                  ...p,
                  alreadyTracking: true,
                  selected: false
               }
            }
            return p;
          });
          
          setParsedExpenses(enriched);
        } catch (err) {
          console.error("Enrichment failed", err);
          setParsedExpenses(configured);
        } finally {
          setIsEnriching(false);
        }
      } else {
        setParsedExpenses(configured);
      }

      setStep('review');

      // Log successful uploads to history if logged in
      if (userId !== 'guest-user') {
        const promises = fileContents.map(fc => 
          addDoc(collection(db, 'users', userId, 'statementUploads'), {
            fileName: fc.name,
            uploadDate: serverTimestamp(),
            status: 'processed',
            // Display the total found across the batch for each log
            expensesFound: configured.length, 
            rawFileContent: fc.rawSave
          })
        );
        await Promise.all(promises);

        // Save raw hits to intelligence IMMEDIATELY
        try {
          const intelPromises = configured.map(p => {
            let hitDate = new Date();
            if (p.date) {
              const parsedDate = new Date(p.date);
              // Ensure it's a valid date
              if (!isNaN(parsedDate.getTime())) {
                hitDate = parsedDate;
              }
            }

            const dateStr = p.date || hitDate.toISOString().split('T')[0];
            const uniqueId = `intel_${p.name.trim().toLowerCase().replace(/\s+/g, '_')}_${p.amount}_${dateStr}`;

            return setDoc(doc(db, 'users', userId, 'expenseIntelligence', uniqueId), {
              merchantName: p.name,
              amount: p.amount,
              date: hitDate,
              category: p.category
            });
          });
          await Promise.all(intelPromises);
        } catch (err) {
          console.error("Failed to seed intelligence", err);
        }
      }

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to process statements. Please check the files and try again.");
      
      if (userId !== 'guest-user' && files.length > 0) {
        for (const f of files) {
          let fallbackText = "";
          try { 
            if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
              fallbackText = "PDF parsing failed or file too large.";
            } else {
              fallbackText = await f.text(); 
            }
          } catch(err){}
          await addDoc(collection(db, 'users', userId, 'statementUploads'), {
            fileName: f.name,
            uploadDate: serverTimestamp(),
            status: 'failed',
            expensesFound: 0,
            rawFileContent: fallbackText.substring(0, 500000)
          });
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const importSelected = async () => {
    const selected = parsedExpenses.filter(p => p.selected);

    const configuredForOrbit = selected.map(p => {
       const finalAmount = p.useAverage && p.historicalAverage ? p.historicalAverage : p.amount;
       // Convert to Orbit expense format
       return {
         id: 'orbit_imp_' + Date.now() + Math.random().toString(36).substr(2, 5),
         name: p.name,
         amount: finalAmount,
         frequency: p.frequency,
         category: p.category,
         month: new Date().getMonth() + 1,
         months: [new Date().getMonth() + 1]
       };
    });
    
    onExpensesExtracted(configuredForOrbit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="border-b border-slate-200 p-5 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E5C38]/10 rounded-full flex items-center justify-center">
              <Database className="text-[#1E5C38]" size={20} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900 leading-tight">Magic Statement Import</h2>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-0.5">Powered by Gemini AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'import' ? 'bg-white text-[#1E5C38] border-b-2 border-[#1E5C38]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Import New
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-[#1E5C38] border-b-2 border-[#1E5C38]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Past Imports
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'import' && (
            <>
              {step === 'upload' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
                    <Info className="shrink-0 mt-0.5" size={18} />
                    <p>Upload a CSV or PDF of your bank or credit card statement. Our AI will scan the transactions to find recurring bills, subscriptions, and seasonal expenses that belong in your Orbit tracker.</p>
                  </div>

                  <div 
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors ${files.length > 0 ? 'border-[#1E5C38] bg-[#1E5C38]/5' : 'border-slate-300 hover:border-[#1E5C38]/50 hover:bg-slate-50'}`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input 
                      type="file" 
                      accept=".csv,.txt,.pdf"
                      multiple
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    
                    {files.length > 0 ? (
                      <div className="space-y-4 flex flex-col items-center w-full">
                        <div className="w-16 h-16 bg-[#1E5C38]/10 text-[#1E5C38] rounded-2xl flex items-center justify-center">
                          <FileText size={32} />
                        </div>
                        <div className="w-full max-y-32 overflow-y-auto space-y-2">
                          {files.map((f, idx) => (
                            <div key={idx} className="flex justify-between items-center text-left bg-white p-2 rounded border border-slate-200">
                              <div>
                                <p className="font-bold text-slate-800 text-sm truncate max-w-48">{f.name}</p>
                                <p className="text-xs text-slate-500 mt-1">{(f.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFiles(files.filter((_, i) => i !== idx));
                                }}
                                className="text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-4 px-4 py-2 border border-[#1E5C38] text-[#1E5C38] rounded-lg text-sm font-bold hover:bg-[#1E5C38]/10 transition-colors"
                        >
                          Add Another File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                          <Upload size={32} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Drag & drop your statement here</p>
                          <p className="text-sm text-slate-500 mt-1">Supports .csv, .txt, or .pdf</p>
                        </div>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                          Browse Files
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-3 text-sm">
                      <AlertCircle className="shrink-0 mt-0.5" size={18} />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={processFiles}
                      disabled={files.length === 0 || isProcessing}
                      className="px-6 py-3 bg-[#1E5C38] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#154629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Analyzing Statements...
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          Track your spend orbit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900 mb-1">Review Found Expenses</h3>
                    <p className="text-sm text-slate-600">Gemini found {parsedExpenses.length} potential recurring expenses. Select the ones you'd like to track in Orbit.</p>
                  </div>

                  {parsedExpenses.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center">
                      <p className="text-slate-600">No recurring expenses could be identified confidently in this file.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 p-3 grid grid-cols-12 gap-4 border-b border-slate-200 text-xs font-mono uppercase tracking-widest text-[#8C8670]">
                        <div className="col-span-1 text-center">Add</div>
                        <div className="col-span-4">Vendor</div>
                        <div className="col-span-1">Freq</div>
                        <div className="col-span-4 text-right">Amount Strategy</div>
                        <div className="col-span-2 text-right">Confidence</div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {Array.from(new Set(parsedExpenses.map(p => p.category))).map((category: string) => (
                          <div key={category} className="contents">
                            <div className="col-span-12 bg-slate-50/50 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-[#C5A059] border-b border-slate-100 flex justify-between items-center">
                              <span>{category.replace(/_/g, ' ')}</span>
                            </div>
                            {parsedExpenses
                              .map((p, i) => ({ ...p, originalIndex: i }))
                              .filter(p => p.category === category)
                              .map((expense) => (
                                <div 
                                  key={expense.originalIndex} 
                                  className={`p-4 grid grid-cols-12 gap-4 items-center border-b border-slate-100 last:border-0 transition-colors ${expense.selected ? 'bg-[#1E5C38]/5' : 'hover:bg-slate-50 opacity-60'}`}
                                >
                                  <div className="col-span-1 flex justify-center">
                                    <button 
                                      onClick={() => {
                                        const newList = [...parsedExpenses];
                                        newList[expense.originalIndex].selected = !newList[expense.originalIndex].selected;
                                        setParsedExpenses(newList);
                                      }}
                                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${expense.selected ? 'bg-[#1E5C38] border-[#1E5C38]' : 'border-slate-300'}`}
                                    >
                                      {expense.selected && <CheckCircle size={14} className="text-white" />}
                                    </button>
                                  </div>
                                  <div className="col-span-4 font-medium text-slate-900 truncate">
                                    {expense.name}
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {expense.alreadyTracking && (
                                        <span className="text-[8px] bg-[#1E5C38]/10 text-[#1E5C38] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                                          Already Tracking
                                        </span>
                                      )}
                                      {expense.hitCount && expense.hitCount > 0 && (
                                        <div className="text-[8px] text-[#C5A059] font-mono font-bold flex items-center gap-1">
                                          <History size={8} /> {expense.hitCount} Past Hits
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="col-span-1 text-[10px] text-slate-500 capitalize font-mono">
                                    {expense.frequency.substring(0, 3)}
                                  </div>
                                  <div className="col-span-4 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg">
                                        <button
                                          onClick={() => {
                                            const newList = [...parsedExpenses];
                                            newList[expense.originalIndex].useAverage = false;
                                            setParsedExpenses(newList);
                                          }}
                                          className={`px-2 py-1 rounded text-[9px] font-mono transition-all ${!expense.useAverage ? 'bg-white text-[#2C3338] shadow-sm font-bold' : 'text-[#8C8670]'}`}
                                        >
                                          Current: ${expense.amount.toFixed(0)}
                                        </button>
                                        {expense.historicalAverage && (
                                          <button
                                            onClick={() => {
                                              const newList = [...parsedExpenses];
                                              newList[expense.originalIndex].useAverage = true;
                                              setParsedExpenses(newList);
                                            }}
                                            className={`px-2 py-1 rounded text-[9px] font-mono transition-all ${expense.useAverage ? 'bg-[#C5A059] text-white shadow-sm font-bold' : 'text-[#8C8670]'}`}
                                          >
                                            Avg: ${expense.historicalAverage.toFixed(0)}
                                          </button>
                                        )}
                                      </div>
                                      {expense.historicalAverage && !expense.useAverage && Math.abs(expense.amount - expense.historicalAverage) > (expense.historicalAverage * 0.15) && (
                                        <div className="text-[8px] text-amber-600 font-mono italic animate-pulse">
                                          {expense.amount < expense.historicalAverage ? 'Lower than average' : 'Higher than average'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="col-span-2 flex justify-end">
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${expense.confidence > 80 ? 'bg-green-100 text-green-700' : expense.confidence > 50 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                      {expense.confidence}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <button
                      onClick={() => {
                        setStep('upload');
                        setFiles([]);
                        setParsedExpenses([]);
                      }}
                      className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Start Over
                    </button>
                    {parsedExpenses.filter(p => p.selected).length > 0 ? (
                      <button
                        onClick={importSelected}
                        className="px-6 py-3 bg-[#1E5C38] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#154629] transition-colors"
                      >
                        Import {parsedExpenses.filter(p => p.selected).length} Items to Orbit
                      </button>
                    ) : (
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                      >
                        Log Data & Close
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900 mb-1">Past Imports</h3>
                  <p className="text-sm text-slate-600">A log of all files you've scanned using the Magic Import tool.</p>
                </div>
                <button 
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                  className="p-2 text-slate-400 hover:text-[#1E5C38] transition-colors rounded-lg hover:bg-slate-100"
                  title="Refresh History"
                >
                  <RefreshCw size={18} className={isLoadingHistory ? 'animate-spin' : ''} />
                </button>
              </div>

              {userId === 'guest-user' ? (
                <div className="bg-slate-50 p-6 rounded-xl text-center text-slate-500 text-sm border border-slate-200">
                  Please log in to save and view your import history.
                </div>
              ) : isLoadingHistory ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>
              ) : history.length === 0 ? (
                <div className="bg-slate-50 p-10 rounded-xl flex flex-col justify-center items-center text-slate-500 text-sm border border-slate-200">
                  <History size={32} className="mb-3 text-slate-300" />
                  <p className="font-bold text-slate-700 mb-1">No statements imported yet.</p>
                  <p className="text-center text-slate-500 text-xs max-w-sm mt-2">
                    If you uploaded statements previously while acting as a guest, they were not saved. Please reupload them now that you are logged in.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(log => (
                    <div key={log.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.status === 'processed' ? 'bg-[#1E5C38]/10 text-[#1E5C38]' : 'bg-red-100 text-red-700'}`}>
                          {log.status === 'processed' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{log.fileName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {log.uploadDate?.toDate ? log.uploadDate.toDate().toLocaleString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        {log.status === 'processed' ? (
                          <p className="text-sm font-bold text-slate-700">{log.expensesFound} Found</p>
                        ) : (
                          <p className="text-sm font-bold text-red-600">Failed</p>
                        )}
                        {log.rawFileContent && (
                          <button
                            onClick={() => {
                              try {
                                const isPdf = log.fileName.toLowerCase().endsWith('.pdf');
                                let blob;
                                if (isPdf && !log.rawFileContent!.startsWith('PDF parsing failed')) {
                                  const binaryString = window.atob(log.rawFileContent!);
                                  const bytes = new Uint8Array(binaryString.length);
                                  for (let i = 0; i < binaryString.length; i++) {
                                      bytes[i] = binaryString.charCodeAt(i);
                                  }
                                  blob = new Blob([bytes], { type: 'application/pdf' });
                                } else {
                                  blob = new Blob([log.rawFileContent!], { type: 'text/plain' });
                                }
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `original_${log.fileName}`;
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch(e) {
                                console.error("Could not download file", e);
                                alert("Failed to download file. It may be corrupted or too large.");
                              }
                            }}
                            className="text-xs flex items-center gap-1 text-[#1E5C38] font-bold hover:underline"
                          >
                            <Download size={12} />
                            Original File
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
