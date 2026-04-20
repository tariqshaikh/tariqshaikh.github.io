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
  Download
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface StatementImportModalProps {
  userId: string;
  onClose: () => void;
  onExpensesExtracted: (expenses: Partial<any>[]) => void;
}

interface ParsedExpense {
  name: string;
  amount: number;
  frequency: 'annual' | 'semi-annual' | 'quarterly' | 'monthly' | 'bi-weekly' | 'weekly' | 'one-time';
  category: string;
  confidence: number; // 0-100
  selected?: boolean;
}

interface UploadLog {
  id: string;
  fileName: string;
  uploadDate: any;
  status: 'processed' | 'failed';
  expensesFound: number;
  rawFileContent?: string;
}

export default function StatementImportModal({ userId, onClose, onExpensesExtracted }: StatementImportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<UploadLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    if (userId === 'guest-user') return;
    setIsLoadingHistory(true);
    try {
      const q = query(collection(db, 'users', userId, 'statementUploads'), orderBy('uploadDate', 'desc'));
      const snapshot = await getDocs(q);
      const logs: UploadLog[] = [];
      snapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() } as UploadLog);
      });
      setHistory(logs);
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
        You are a financial AI assistant. Analyze the following credit card statement data (which may be CSV, plain text, or PDF).
        Identify ONLY recurring, fixed, or seasonal expenses (e.g., streaming subscriptions, software, insurance, quarterly bills, club dues, specific utility patterns, yearly memberships).
        IGNORE variable, day-to-day spending (e.g., coffee shops, individual grocery trips, restaurants, amazon random purchases, gas stations).

        For each recurring expense you find, categorize it into one of these based on context: 'insurance', 'subscription', 'tax', 'maintenance_and_utilities', 'food', 'health_and_fitness', 'vacation', or 'other'.
        
        CRITICAL CATEGORIZATION RULES:
        - Credit card annual membership fees (e.g., "Chase Sapphire", "Amex Platinum") MUST be categorized as 'subscription'.
        - Utility bills (e.g., "PSEG", "ConEdison", water, electric, gas, internet) MUST be categorized as 'maintenance_and_utilities'.
        - Gyms, boutique fitness, and health memberships (e.g., "Solidcore", "Equinox", "Peloton") MUST be categorized as 'health_and_fitness'.
        
        Estimate its frequency: 'annual', 'semi-annual', 'quarterly', 'monthly', 'bi-weekly', 'weekly', or 'one-time'.
        Also provide a confidence score from 0 to 100 on how certain you are it is a recurring/fixed expense.

        Respond explicitly in JSON format as an array of objects.
        Structure:
        [
          {
            "name": "Vendor Name",
            "amount": 15.99,
            "frequency": "monthly",
            "category": "subscription",
            "confidence": 95
          }
        ]

        Only return the JSON array, no markdown wrappers and no explanation.
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

      const parsed = JSON.parse(jsonStr) as ParsedExpense[];
      
      // Default to selected true for high confidence
      const configured = parsed.map(p => ({
        ...p,
        selected: p.confidence > 70
      }));

      setParsedExpenses(configured);
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

  const importSelected = () => {
    const selected = parsedExpenses.filter(p => p.selected);
    const configuredForOrbit = selected.map(p => {
       // Convert to Orbit expense format
       return {
         id: 'orbit_imp_' + Date.now() + Math.random().toString(36).substr(2, 5),
         name: p.name,
         amount: p.amount,
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
                        <div className="col-span-3">Category / Freq</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-2 text-right">Confidence</div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {parsedExpenses.map((expense, idx) => (
                          <div 
                            key={idx} 
                            className={`p-4 grid grid-cols-12 gap-4 items-center border-b border-slate-100 last:border-0 transition-colors ${expense.selected ? 'bg-[#1E5C38]/5' : ''}`}
                            onClick={() => {
                              const newList = [...parsedExpenses];
                              newList[idx].selected = !newList[idx].selected;
                              setParsedExpenses(newList);
                            }}
                          >
                            <div className="col-span-1 flex justify-center">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${expense.selected ? 'bg-[#1E5C38] border-[#1E5C38]' : 'border-slate-300'}`}>
                                {expense.selected && <CheckCircle size={14} className="text-white" />}
                              </div>
                            </div>
                            <div className="col-span-4 font-medium text-slate-900 truncate">
                              {expense.name}
                            </div>
                            <div className="col-span-3">
                              <div className="text-sm font-medium capitalize">{expense.category}</div>
                              <div className="text-xs text-slate-500 capitalize">{expense.frequency}</div>
                            </div>
                            <div className="col-span-2 text-right font-serif font-bold text-slate-900">
                              ${expense.amount.toFixed(2)}
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${expense.confidence > 80 ? 'bg-green-100 text-green-700' : expense.confidence > 50 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                {expense.confidence}%
                              </span>
                            </div>
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
                    <button
                      onClick={importSelected}
                      disabled={parsedExpenses.filter(p => p.selected).length === 0}
                      className="px-6 py-3 bg-[#1E5C38] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#154629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Import {parsedExpenses.filter(p => p.selected).length} Items to Orbit
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 mb-1">Past Imports</h3>
                <p className="text-sm text-slate-600">A log of all files you've scanned using the Magic Import tool.</p>
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
                  No statements imported yet.
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
