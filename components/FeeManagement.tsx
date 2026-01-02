
import React, { useState, useEffect, useMemo } from 'react';
import { Student, FeeRecord, User, FeeStructure } from '../types';
import { NEPALI_MONTHS, DEFAULT_FEE_CATEGORIES, getTodayBS, CLASSES } from '../constants';
import { api } from '../api';

interface BillingItem {
  id: string;
  month: string;
  feeType: string;
  amount: number;
  discount: number;
}

interface FeeManagementProps {
  fees: FeeRecord[];
  setFees: React.Dispatch<React.SetStateAction<FeeRecord[]>>;
  students: Student[];
  user: User;
}

const FeeManagement: React.FC<FeeManagementProps> = ({ fees, setFees, students, user }) => {
  const [isBilling, setIsBilling] = useState(false);
  const [isManagingStructure, setIsManagingStructure] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_FEE_CATEGORIES);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [printBillSet, setPrintBillSet] = useState<FeeRecord[] | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [paymentMode, setPaymentMode] = useState('Cash');
  
  const [billingItems, setBillingItems] = useState<BillingItem[]>([
    { id: 'item-1', month: NEPALI_MONTHS[new Date().getMonth() % 12], feeType: 'Monthly Tuition Fee', amount: 0, discount: 0 }
  ]);

  const [structureForm, setStructureForm] = useState<FeeStructure>({
    class: 'Class 1',
    feeType: 'Monthly Tuition Fee',
    amount: 0
  });

  useEffect(() => {
    loadGlobalConfig();
  }, []);

  const loadGlobalConfig = async () => {
    setError('');
    try {
      const [cloudCats, cloudStructures] = await Promise.all([
        api.getFeeCategories(),
        api.getFeeStructures()
      ]);
      if (cloudCats) setCategories(Array.from(new Set([...DEFAULT_FEE_CATEGORIES, ...cloudCats])));
      if (cloudStructures) setFeeStructures(cloudStructures);
    } catch (err: any) {
      console.error("Failed to load configs:", err);
      setError("Sync Error: Using local defaults.");
    }
  };

  const addItem = () => {
    setBillingItems([...billingItems, { 
      id: `item-${Date.now()}`, 
      month: NEPALI_MONTHS[new Date().getMonth() % 12], 
      feeType: 'Monthly Tuition Fee', 
      amount: 0, 
      discount: 0 
    }]);
  };

  const removeItem = (id: string) => {
    if (billingItems.length > 1) {
      setBillingItems(billingItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, updates: Partial<BillingItem>) => {
    setBillingItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      
      if ((updates.feeType || updates.month) && selectedStudent) {
        const match = feeStructures.find(s => s.class === (selectedStudent ? selectedStudent.class : 'Class 1') && s.feeType === (updates.feeType || item.feeType));
        if (match) updated.amount = match.amount;
      }
      return updated;
    }));
  };

  useEffect(() => {
    if (selectedStudent) {
      setBillingItems(prev => prev.map(item => {
        const match = feeStructures.find(s => s.class === selectedStudent.class && s.feeType === item.feeType);
        return match ? { ...item, amount: match.amount } : item;
      }));
    }
  }, [selectedStudent, feeStructures]);

  const grandTotal = useMemo(() => {
    return billingItems.reduce((acc, item) => acc + (item.amount - item.discount), 0);
  }, [billingItems]);

  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || billingItems.length === 0) return;

    setIsSaving(true);
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const newRecords: FeeRecord[] = billingItems.map(item => ({
      receiptNo,
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.name,
      class: selectedStudent.class,
      month: item.month,
      feeType: item.feeType,
      amount: item.amount,
      discount: item.discount,
      total: item.amount - item.discount,
      paidDateBS: getTodayBS(),
      paymentMode: paymentMode,
      collectedBy: user.username,
      status: 'Paid'
    }));

    try {
      await api.saveFeeRecords(newRecords);
      setFees(prev => [...prev, ...newRecords]);
      setIsBilling(false);
      setSelectedStudent(null);
      setBillingItems([{ id: 'item-1', month: NEPALI_MONTHS[new Date().getMonth() % 12], feeType: 'Monthly Tuition Fee', amount: 0, discount: 0 }]);
      setPrintBillSet(newRecords);
    } catch (err: any) {
      alert("Billing failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredFees = fees.filter(f => {
    const matchesSearch = f.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || f.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'All' || f.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const groupedFees = useMemo(() => {
    const map = new Map<string, FeeRecord[]>();
    filteredFees.forEach(f => {
      const existing = map.get(f.receiptNo) || [];
      map.set(f.receiptNo, [...existing, f]);
    });
    return Array.from(map.values()).reverse();
  }, [filteredFees]);

  if (printBillSet) {
    const totalPaid = printBillSet.reduce((acc, f) => acc + f.total, 0);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full text-center no-print">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fas fa-print"></i>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Print Receipt</h3>
          <p className="text-slate-500 mb-6 font-medium">Ready to print receipt #{printBillSet[0].receiptNo}</p>
          <div className="flex flex-col space-y-3">
            <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-slate-800 transition">
              <i className="fas fa-print"></i>
              <span>Print Official Bill</span>
            </button>
            <button onClick={() => setPrintBillSet(null)} className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black hover:bg-slate-200 transition">
              Close Preview
            </button>
          </div>
        </div>

        <div className="print-only a4-page text-slate-900 font-sans">
           <div className="border-[10px] border-double border-slate-900 p-12 h-full relative flex flex-col">
              <div className="text-center border-b-4 border-slate-900 pb-6 mb-8">
                 <h1 className="text-4xl font-black uppercase mb-1 tracking-tighter text-slate-900">Subash ERP</h1>
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kathmandu, Nepal • Phone: 01-4XXXXXX</p>
                 <div className="mt-4 inline-block bg-slate-900 text-white px-6 py-1.5 font-black uppercase text-xs tracking-widest">Fee Payment Receipt</div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 text-sm text-slate-900">
                 <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black text-slate-400">Bill To:</p>
                    <h4 className="text-xl font-black">{printBillSet[0].studentName}</h4>
                    <p className="font-bold text-slate-600">SID: {printBillSet[0].studentId}</p>
                    <p className="font-bold text-slate-600 uppercase">{printBillSet[0].class}</p>
                 </div>
                 <div className="text-right space-y-1">
                    <p className="text-[10px] uppercase font-black text-slate-400">Bill Info:</p>
                    <p className="text-lg font-black">#{printBillSet[0].receiptNo}</p>
                    <p className="font-bold text-slate-600">Date: {printBillSet[0].paidDateBS} BS</p>
                    <p className="font-bold text-slate-600 uppercase">Mode: {printBillSet[0].paymentMode}</p>
                 </div>
              </div>

              <table className="w-full mb-8 border-collapse flex-grow">
                 <thead>
                    <tr className="bg-slate-100 text-slate-900 border-t-2 border-b-2 border-slate-900">
                       <th className="py-3 px-4 text-left font-black uppercase text-[10px]">Particulars</th>
                       <th className="py-3 px-4 text-center font-black uppercase text-[10px]">Month</th>
                       <th className="py-3 px-4 text-right font-black uppercase text-[10px]">Total (NPR)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 text-slate-900">
                    {printBillSet.map((item, idx) => (
                      <tr key={idx}>
                         <td className="py-4 px-4"><div className="font-black text-sm">{item.feeType}</div></td>
                         <td className="py-4 px-4 text-center font-bold uppercase">{item.month}</td>
                         <td className="py-4 px-4 text-right"><span className="text-sm font-black">{item.total.toLocaleString()}</span></td>
                      </tr>
                    ))}
                 </tbody>
              </table>

              <div className="border-t-4 border-slate-900 pt-6">
                 <div className="flex justify-between items-center bg-slate-100 p-6 rounded-xl text-slate-900">
                    <span className="font-black text-xl uppercase tracking-tighter">Total Paid:</span>
                    <span className="text-4xl font-black">NPR {totalPaid.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Fee Portal</h2>
          <p className="text-sm text-slate-500 font-medium">Financial records & automated billing</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsManagingStructure(!isManagingStructure)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 transition">
            <i className="fas fa-layer-group text-blue-500"></i>
            <span>Fee Structure</span>
          </button>
          <button onClick={() => setIsBilling(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black flex items-center space-x-2 transition shadow-xl shadow-blue-600/20 active:scale-95">
            <i className="fas fa-plus-circle"></i>
            <span>Process New Bill</span>
          </button>
        </div>
      </div>

      {isManagingStructure && (
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl animate-fadeIn no-print border border-blue-500/30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase tracking-widest text-blue-400">Fee Structure Setup</h3>
            <button onClick={() => setIsManagingStructure(false)} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Class</label>
              <select className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl font-bold" value={structureForm.class} onChange={(e) => setStructureForm({...structureForm, class: e.target.value})}>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Category</label>
              <select className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl font-bold" value={structureForm.feeType} onChange={(e) => setStructureForm({...structureForm, feeType: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Default Amount</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl font-bold" value={structureForm.amount} onChange={(e) => setStructureForm({...structureForm, amount: parseInt(e.target.value) || 0})} />
            </div>
            <button onClick={async () => { setIsSaving(true); await api.saveFeeStructure(structureForm); await loadGlobalConfig(); setIsSaving(false); }} disabled={isSaving} className="bg-blue-600 px-8 py-3.5 rounded-xl font-black hover:bg-blue-500 transition">
              {isSaving ? 'Saving...' : 'Set Amount'}
            </button>
          </div>
        </div>
      )}

      {isBilling && (
        <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-blue-600 animate-fadeIn no-print max-w-5xl mx-auto overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Consolidated Billing Portal</h3>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest italic">Generate Multi-Item Invoices</p>
            </div>
            <button onClick={() => setIsBilling(false)} className="bg-slate-100 p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition"><i className="fas fa-times"></i></button>
          </div>
          
          <form onSubmit={handleBillSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Student for Billing</label>
                <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none" onChange={(e) => setSelectedStudent(students.find(s => s.studentId === e.target.value) || null)} required value={selectedStudent?.studentId || ''}>
                  <option value="">Search Student...</option>
                  {students.map(s => <option key={s.studentId} value={s.studentId}>{s.name} ({s.class})</option>)}
                </select>
                <div className="absolute right-5 bottom-4 pointer-events-none text-slate-400"><i className="fas fa-chevron-down"></i></div>
              </div>
              <div className="flex flex-col">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Payment Method</label>
                <div className="flex gap-2">
                  {['Cash', 'E-Sewa', 'Bank'].map(mode => (
                    <button key={mode} type="button" onClick={() => setPaymentMode(mode)} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase transition-all ${paymentMode === mode ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}>{mode}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center px-4 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-list-ul text-blue-600"></i>
                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Fee Particulars & Line Items</h4>
                  </div>
                  <button type="button" onClick={addItem} className="bg-emerald-100 text-emerald-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition flex items-center space-x-2">
                    <i className="fas fa-plus"></i>
                    <span>Generate New Row</span>
                  </button>
               </div>

               {/* Table Header Labels for Inputs */}
               <div className="grid grid-cols-12 gap-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:grid">
                  <div className="col-span-4">Category Type</div>
                  <div className="col-span-3">Target Month</div>
                  <div className="col-span-2">Amt (NPR)</div>
                  <div className="col-span-2">Disc (NPR)</div>
                  <div className="col-span-1 text-center">Delete</div>
               </div>
               
               <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scroll pb-4">
                  {billingItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                       <div className="col-span-12 md:col-span-4">
                          <label className="md:hidden text-[8px] font-black text-slate-400 uppercase mb-1">Category</label>
                          <select className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-[11px] font-black outline-none focus:ring-2 focus:ring-blue-600" value={item.feeType} onChange={(e) => updateItem(item.id, { feeType: e.target.value })}>
                             {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="col-span-12 md:col-span-3">
                          <label className="md:hidden text-[8px] font-black text-slate-400 uppercase mb-1">Month</label>
                          <select className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-[11px] font-black outline-none focus:ring-2 focus:ring-blue-600" value={item.month} onChange={(e) => updateItem(item.id, { month: e.target.value })}>
                             {NEPALI_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                       </div>
                       <div className="col-span-5 md:col-span-2">
                          <label className="md:hidden text-[8px] font-black text-slate-400 uppercase mb-1">Amt</label>
                          <input 
                            type="number" 
                            placeholder="Amt"
                            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-600" 
                            value={item.amount || ''} 
                            onChange={(e) => updateItem(item.id, { amount: parseInt(e.target.value) || 0 })} 
                          />
                       </div>
                       <div className="col-span-5 md:col-span-2">
                          <label className="md:hidden text-[8px] font-black text-slate-400 uppercase mb-1">Disc</label>
                          <input 
                            type="number" 
                            placeholder="Disc"
                            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs font-black text-red-600 outline-none focus:ring-2 focus:ring-blue-600" 
                            value={item.discount || ''} 
                            onChange={(e) => updateItem(item.id, { discount: parseInt(e.target.value) || 0 })} 
                          />
                       </div>
                       <div className="col-span-2 md:col-span-1 flex justify-center items-end md:items-center">
                          <button type="button" onClick={() => removeItem(item.id)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center"><i className="fas fa-times"></i></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center text-white gap-6 shadow-2xl border border-white/5">
               <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Grand Total Balance</p>
                  <h3 className="text-4xl font-black italic tracking-tighter">NPR {grandTotal.toLocaleString()}</h3>
               </div>
               <button type="submit" disabled={isSaving || !selectedStudent || grandTotal <= 0} className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-blue-600/20 disabled:opacity-30 hover:bg-blue-500 transition-all active:scale-95">
                  {isSaving ? <i className="fas fa-sync fa-spin mr-2"></i> : <i className="fas fa-file-invoice mr-2"></i>}
                  {isSaving ? 'Synchronizing...' : 'Confirm & Print Receipt'}
               </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden no-print">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
             <h3 className="text-lg font-black text-slate-800 uppercase italic">Recent Transactions</h3>
             <div className="flex gap-4">
                <select className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}><option value="All">All Classes</option>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input type="text" placeholder="Search Receipt/Name..." className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             </div>
          </div>
          <table className="w-full text-left erp-table">
            <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[10px] font-black text-slate-400 uppercase"><th className="px-8 py-5">Receipt</th><th className="px-8 py-5">Student</th><th className="px-8 py-5">Items</th><th className="px-8 py-5 text-right">Total</th><th className="px-8 py-5 text-center">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{groupedFees.map((items) => (
                <tr key={items[0].receiptNo} className="hover:bg-blue-50/20 transition group">
                  <td className="px-8 py-5 text-sm font-black text-blue-600">{items[0].receiptNo}<div className="text-[9px] text-slate-400 font-bold">{items[0].paidDateBS}</div></td>
                  <td className="px-8 py-5"><div className="font-bold text-slate-900 text-sm">{items[0].studentName}</div><div className="text-[10px] text-slate-400 font-bold">{items[0].class}</div></td>
                  <td className="px-8 py-5"><div className="flex flex-wrap gap-1">{items.map((it, idx) => <span key={idx} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-slate-200">{it.feeType}</span>)}</div></td>
                  <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">Rs. {items.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}</td>
                  <td className="px-8 py-5 text-center"><button onClick={() => setPrintBillSet(items)} className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm"><i className="fas fa-print mr-2"></i>Print</button></td>
                </tr>
            ))}</tbody>
          </table>
          {groupedFees.length === 0 && <div className="p-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs italic">No transactions found in cloud</div>}
      </div>
    </div>
  );
};

export default FeeManagement;
