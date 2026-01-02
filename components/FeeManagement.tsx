
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
  const [categories, setCategories] = useState<string[]>([]);
  const [monthlyCategories, setMonthlyCategories] = useState<string[]>([]);
  const [oneTimeCategories, setOneTimeCategories] = useState<string[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [printBillSet, setPrintBillSet] = useState<FeeRecord[] | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [paymentMode, setPaymentMode] = useState('Cash');
  
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);

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
      if (cloudCats) {
        setCategories(cloudCats);
        // Filter categories into monthly and one-time
        const monthly = cloudCats.filter(cat => 
          cat.toLowerCase().includes('monthly') || 
          cat.toLowerCase().includes('tuition') ||
          cat.toLowerCase().includes('bus') ||
          cat.toLowerCase().includes('transportation') ||
          cat.toLowerCase().includes('hostel') ||
          cat.toLowerCase().includes('boarding') ||
          cat.toLowerCase().includes('computer') ||
          cat.toLowerCase().includes('late payment')
        );
        const oneTime = cloudCats.filter(cat => 
          cat.toLowerCase().includes('admission') ||
          cat.toLowerCase().includes('annual') ||
          cat.toLowerCase().includes('terminal') ||
          cat.toLowerCase().includes('exam') ||
          cat.toLowerCase().includes('library') ||
          cat.toLowerCase().includes('laboratory') ||
          cat.toLowerCase().includes('sports') ||
          cat.toLowerCase().includes('id card') ||
          cat.toLowerCase().includes('diary') ||
          cat.toLowerCase().includes('calendar') ||
          cat.toLowerCase().includes('building') ||
          cat.toLowerCase().includes('maintenance') ||
          cat.toLowerCase().includes('uniform') ||
          cat.toLowerCase().includes('field trip') ||
          cat.toLowerCase().includes('stationery') ||
          cat.toLowerCase().includes('books') ||
          cat.toLowerCase().includes('insurance') ||
          cat.toLowerCase().includes('health') ||
          cat.toLowerCase().includes('miscellaneous')
        );
        setMonthlyCategories(monthly);
        setOneTimeCategories(oneTime);
      }
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
      setBillingItems([]);
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

        <div className="print-only a5-page text-slate-900 font-sans">
           <div className="w-full h-full p-4 bg-white text-black">
              {/* Header */}
              <div className="text-center pb-3 mb-4">
                 <h1 className="text-xl font-bold uppercase">SUBASH SCHOOL</h1>
                 <p className="text-base">Fee Payment Receipt</p>
                 <p className="text-base">Academic Year: 2081 BS</p>
                 <p className="text-sm">Date Issued: {new Date().toLocaleDateString('en-GB')}</p>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-base">
                 <div>
                    <p><strong>Name:</strong> {printBillSet[0].studentName}</p>
                    <p><strong>Class:</strong> {printBillSet[0].class}</p>
                 </div>
                 <div>
                    <p><strong>Receipt No:</strong> {printBillSet[0].receiptNo}</p>
                    <p><strong>Date:</strong> {printBillSet[0].paidDateBS} BS</p>
                 </div>
              </div>

              {/* Fee Details */}
              <div className="mb-4">
                 <table className="w-full text-base border-collapse border border-black">
                    <thead>
                       <tr className="bg-gray-100">
                          <th className="text-left py-2 px-3 border border-black">Particulars</th>
                          <th className="text-left py-2 px-3 border border-black">Months</th>
                          <th className="text-right py-2 px-3 border border-black">Amount (Rs.)</th>
                       </tr>
                    </thead>
                    <tbody>
                       {(() => {
                         const groupedItems = printBillSet.reduce((acc, item) => {
                           const existing = acc.find(g => g.feeType === item.feeType);
                           if (existing) {
                             existing.months.push(item.month);
                             existing.total += item.total;
                           } else {
                             acc.push({ feeType: item.feeType, months: [item.month], total: item.total });
                           }
                           return acc;
                         }, [] as {feeType: string, months: string[], total: number}[]);
                         
                         return groupedItems.map((group, idx) => (
                           <tr key={idx}>
                              <td className="py-2 px-3 border border-black">{group.feeType}</td>
                              <td className="py-2 px-3 border border-black">
                                 {group.months.length === 1 ? group.months[0] : 
                                  group.months.length > 1 ? `${group.months[0]} to ${group.months[group.months.length-1]}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right border border-black">{group.total.toLocaleString()}</td>
                           </tr>
                         ));
                       })()}
                       <tr className="font-bold bg-gray-50">
                          <td className="py-2 px-3 border border-black" colSpan={2}>TOTAL AMOUNT PAID</td>
                          <td className="py-2 px-3 text-right border border-black">Rs. {totalPaid.toLocaleString()}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              {/* Footer */}
              <div className="text-base">
                 <div className="text-center pt-3">
                    <p className="text-base">Thank you for your payment</p>
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
        <div className="animate-fadeIn space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8 no-print">
            <div className="flex justify-between items-center">
               <button onClick={() => setIsBilling(false)} className="text-slate-400 hover:text-slate-900 font-black uppercase text-xs flex items-center">
                  <i className="fas fa-arrow-left mr-2"></i> Back to Portal
               </button>
               <h2 className="text-xl font-black text-slate-800 uppercase italic">Consolidated Billing Portal</h2>
               <div className="flex gap-4">
                  <select className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-600" onChange={(e) => setSelectedStudent(students.find(s => s.studentId === e.target.value) || null)} value={selectedStudent?.studentId || ''}>
                    <option value="">Select Student...</option>
                    {students.map(s => <option key={s.studentId} value={s.studentId}>{s.name} ({s.class})</option>)}
                  </select>
                  <button 
                    onClick={handleBillSubmit}
                    disabled={isSaving || !selectedStudent || grandTotal <= 0}
                    className="bg-slate-900 text-white px-8 py-2 rounded-xl font-black text-xs uppercase shadow-xl shadow-slate-900/20 disabled:opacity-30 transition"
                  >
                    {isSaving ? 'Processing...' : `Confirm Bill (${billingItems.length})`}
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-slate-100 pt-8">
               {/* Fee Categories */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                     <i className="fas fa-calendar-alt mr-2 text-blue-500"></i> Monthly Categories
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scroll">
                     {monthlyCategories.map(cat => {
                       const isSelected = billingItems.some(item => item.feeType === cat);
                       return (
                         <div key={cat} className="space-y-2">
                           <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                              <input type="checkbox" className="hidden" checked={isSelected} onChange={() => {
                                if (isSelected) {
                                  // Remove all items for this category
                                  setBillingItems(prev => prev.filter(item => item.feeType !== cat));
                                } else {
                                  // Add item for this category with current month
                                  const structure = feeStructures.find(s => s.class === (selectedStudent ? selectedStudent.class : 'Class 1') && s.feeType === cat);
                                  const newItem = { 
                                    id: `item-${Date.now()}`, 
                                    month: NEPALI_MONTHS[new Date().getMonth() % 12], 
                                    feeType: cat, 
                                    amount: structure ? structure.amount : 0, 
                                    discount: 0 
                                  };
                                  setBillingItems(prev => [...prev, newItem]);
                                }
                              }} />
                              <i className={`fas ${isSelected ? 'fa-check-circle text-blue-600' : 'fa-circle text-slate-200'} mr-3`}></i>
                              <span className="text-[10px] font-black uppercase text-slate-700">{cat}</span>
                           </label>
                           {isSelected && (
                             <div className="ml-6 grid grid-cols-4 gap-1">
                               {NEPALI_MONTHS.map(m => {
                                 const isMonthSelected = billingItems.some(item => item.feeType === cat && item.month === m);
                                 const isPaid = fees.some(f => 
                                   f.studentId === selectedStudent?.studentId &&
                                   f.feeType === cat && 
                                   f.month === m && 
                                   f.status === 'Paid'
                                 );
                                 return (
                                   <button 
                                      key={m} 
                                      onClick={() => {
                                        if (isPaid) return; // Don't allow selection if paid
                                        if (isMonthSelected) {
                                          // Remove this month for this category
                                          setBillingItems(prev => prev.filter(item => !(item.feeType === cat && item.month === m)));
                                        } else {
                                          // Add this month for this category
                                          const structure = feeStructures.find(s => s.class === (selectedStudent ? selectedStudent.class : 'Class 1') && s.feeType === cat);
                                          const newItem = { 
                                            id: `item-${Date.now()}`, 
                                            month: m, 
                                            feeType: cat, 
                                            amount: structure ? structure.amount : 0, 
                                            discount: 0 
                                          };
                                          setBillingItems(prev => [...prev, newItem]);
                                        }
                                      }}
                                      disabled={isPaid}
                                      className={`py-1 px-2 rounded text-[8px] font-bold uppercase border transition-all relative ${
                                        isPaid
                                          ? 'bg-green-100 text-green-600 border-green-300 cursor-not-allowed'
                                          : isMonthSelected
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                                      }`}
                                   >
                                      {m.slice(0,3)}
                                      {isPaid && <i className="fas fa-check absolute top-0 right-0 text-green-600 text-[6px]"></i>}
                                   </button>
                                 );
                               })}
                             </div>
                           )}
                         </div>
                       );
                     })}
                  </div>
               </div>

               {/* One-Time Categories */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                     <i className="fas fa-tag mr-2 text-emerald-500"></i> One-Time Categories
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scroll">
                     {oneTimeCategories.map(cat => {
                       const isSelected = billingItems.some(item => item.feeType === cat);
                       const isPaid = fees.some(f => 
                         f.studentId === selectedStudent?.studentId &&
                         f.feeType === cat && 
                         f.status === 'Paid'
                       );
                       return (
                         <label key={cat} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all relative ${
                           isPaid
                             ? 'bg-green-100 border-green-300 cursor-not-allowed'
                             : isSelected 
                               ? 'bg-emerald-50 border-emerald-600' 
                               : 'bg-slate-50 border-transparent hover:border-slate-200'
                         }`}>
                            <input type="checkbox" className="hidden" checked={isSelected} disabled={isPaid} onChange={() => {
                              if (isPaid) return; // Don't allow selection if paid
                              if (isSelected) {
                                // Remove item for this category
                                setBillingItems(prev => prev.filter(item => item.feeType !== cat));
                              } else {
                                // Add item for this category
                                const structure = feeStructures.find(s => s.class === (selectedStudent ? selectedStudent.class : 'Class 1') && s.feeType === cat);
                                const newItem = { 
                                  id: `item-${Date.now()}`, 
                                  month: '-', 
                                  feeType: cat, 
                                  amount: structure ? structure.amount : 0, 
                                  discount: 0 
                                };
                                setBillingItems(prev => [...prev, newItem]);
                              }
                            }} />
                            <i className={`fas ${
                              isPaid
                                ? 'fa-check-circle text-green-600'
                                : isSelected 
                                  ? 'fa-check-circle text-emerald-600' 
                                  : 'fa-circle text-slate-200'
                            } mr-3`}></i>
                            <span className={`text-[10px] font-black uppercase ${
                              isPaid ? 'text-green-600' : 'text-slate-700'
                            }`}>{cat}</span>
                            {isPaid && <span className="ml-auto text-[8px] text-green-600 font-bold">PAID</span>}
                         </label>
                       );
                     })}
                  </div>
               </div>

               {/* Selected Categories & Months */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                     <i className="fas fa-credit-card mr-2 text-amber-500"></i> Selected Categories & Months
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                     {billingItems.length === 0 ? (
                       <p className="text-[9px] text-gray-500 italic">No categories selected</p>
                     ) : (
                       billingItems.map(item => (
                         <div key={item.id} className="bg-slate-50 p-3 rounded-lg">
                           <p className="text-[9px] font-bold text-slate-600 mb-2">{item.feeType}</p>
                           <div className="flex items-center gap-2">
                             <span className="bg-blue-600 text-white px-2 py-1 rounded text-[8px] font-bold">
                               {item.month.slice(0,3)}
                             </span>
                             <span className="text-[8px] text-slate-500">NPR {(item.amount - item.discount).toLocaleString()}</span>
                           </div>
                         </div>
                       ))
                     )}
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                     <div className="flex gap-2">
                        {['Cash', 'E-Sewa', 'Bank'].map(mode => (
                          <button 
                            key={mode} 
                            onClick={() => setPaymentMode(mode)}
                            className={`flex-1 py-2 rounded-xl font-black text-xs uppercase transition-all ${paymentMode === mode ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                          >
                            {mode}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                   <tr>
                      <th className="px-8 py-5 font-black uppercase tracking-widest text-slate-400">Fee Category</th>
                      <th className="px-8 py-5 font-black uppercase tracking-widest text-slate-400">Month</th>
                      <th className="px-8 py-5 font-black uppercase tracking-widest text-slate-400">Amount</th>
                      <th className="px-8 py-5 font-black uppercase tracking-widest text-slate-400">Discount</th>
                      <th className="px-8 py-5 text-right font-black uppercase tracking-widest text-slate-400">Total</th>
                      <th className="px-8 py-5 text-center font-black uppercase tracking-widest text-slate-400">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {billingItems.map((item) => (
                     <tr key={item.id} className="hover:bg-blue-50/20 transition">
                        <td className="px-8 py-5">
                           <select className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none" value={item.feeType} onChange={(e) => updateItem(item.id, { feeType: e.target.value })}>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </td>
                        <td className="px-8 py-5">
                           <select className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none" value={item.month} onChange={(e) => updateItem(item.id, { month: e.target.value })}>
                              {NEPALI_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                           </select>
                        </td>
                        <td className="px-8 py-5">
                           <input type="number" className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none" value={item.amount || ''} onChange={(e) => updateItem(item.id, { amount: parseInt(e.target.value) || 0 })} />
                        </td>
                        <td className="px-8 py-5">
                           <input type="number" className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-red-600 outline-none" value={item.discount || ''} onChange={(e) => updateItem(item.id, { discount: parseInt(e.target.value) || 0 })} />
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                           NPR {(item.amount - item.discount).toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-center">
                           <button onClick={() => removeItem(item.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition">
                              <i className="fas fa-trash"></i>
                           </button>
                        </td>
                     </tr>
                   ))}
                   <tr className="bg-slate-50 border-t-2 border-slate-900">
                      <td className="px-8 py-5" colSpan={4}>
                         <div className="flex items-center justify-between">
                            <span className="font-black uppercase tracking-widest text-slate-600">Grand Total</span>
                            <button onClick={addItem} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition">
                               <i className="fas fa-plus mr-2"></i>Add Item
                            </button>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-900 text-lg">
                         NPR {grandTotal.toLocaleString()}
                      </td>
                      <td className="px-8 py-5"></td>
                   </tr>
                </tbody>
             </table>
          </div>
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
