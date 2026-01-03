
import React, { useState, useMemo, useEffect } from 'react';
import { Student, FeeRecord, FeeStructure } from '../types';
import { NEPALI_MONTHS, CLASSES, MONTHLY_FEE_TYPES, ONE_TIME_FEE_TYPES } from '../constants';
import { api } from '../api';

interface ReportsProps {
  students: Student[];
  fees: FeeRecord[];
}

const Reports: React.FC<ReportsProps> = ({ students, fees }) => {
  const [currentView, setCurrentView] = useState<'summary' | 'matrix' | 'credit-slips'>('summary');
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeCategories, setFeeCategories] = useState<string[]>([]);
  
  // Filter categories into monthly and one-time based on database
  const monthlyCategories = feeCategories.filter(cat => 
    cat.toLowerCase().includes('monthly') || 
    cat.toLowerCase().includes('tuition') ||
    cat.toLowerCase().includes('bus') ||
    cat.toLowerCase().includes('transportation') ||
    cat.toLowerCase().includes('hostel') ||
    cat.toLowerCase().includes('boarding') ||
    cat.toLowerCase().includes('computer') ||
    cat.toLowerCase().includes('late payment')
  );
  
  const oneTimeCategories = feeCategories.filter(cat => 
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

  // Initialize selected categories when fee categories are loaded
  useEffect(() => {
    if (monthlyCategories.length > 0 && selectedMonthlyCats.length === 0) {
      // Don't auto-select, let user choose
    }
    if (oneTimeCategories.length > 0 && selectedFixedCats.length === 0) {
      // Don't auto-select, let user choose
    }
  }, [monthlyCategories, oneTimeCategories]);

  // Ticking States
  const [selectedMonths, setSelectedMonths] = useState<string[]>([NEPALI_MONTHS[new Date().getMonth() % 12]]);
  const [selectedMonthlyCats, setSelectedMonthlyCats] = useState<string[]>([]);
  const [selectedFixedCats, setSelectedFixedCats] = useState<string[]>([]);
  const [categoryMonths, setCategoryMonths] = useState<{[category: string]: string[]}>({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    api.getFeeStructures().then(res => setFeeStructures(res || []));
    api.getFeeCategories().then(res => setFeeCategories(res || []));
  }, []);

  // Advanced Categorized Calculation Engine
  const studentDueData = useMemo(() => {
    return students.map(student => {
      let totalDue = 0;
      const monthlyBreakdown: { month: string; category: string; amount: number }[] = [];
      const fixedBreakdown: { category: string; amount: number }[] = [];

      // 1. Process Monthly Recurring Fees
      selectedMonthlyCats.forEach(category => {
        const monthsForCategory = categoryMonths[category] || [];
        monthsForCategory.forEach(month => {
          const isPaid = fees.some(f => 
            f.studentId === student.studentId && 
            f.month === month && 
            f.feeType === category && 
            f.status === 'Paid'
          );

          if (!isPaid) {
            const structure = feeStructures.find(s => s.class === student.class && s.feeType === category);
            const amount = structure ? structure.amount : 0;
            if (amount > 0) {
              totalDue += amount;
              monthlyBreakdown.push({ month, category, amount });
            }
          }
        });
      });

      // 2. Process Fixed/One-Time Fees
      selectedFixedCats.forEach(category => {
        const isPaid = fees.some(f => 
          f.studentId === student.studentId && 
          f.feeType === category && 
          f.status === 'Paid'
        );

        if (!isPaid) {
          const structure = feeStructures.find(s => s.class === student.class && s.feeType === category);
          const amount = structure ? structure.amount : 0;
          if (amount > 0) {
            totalDue += amount;
            fixedBreakdown.push({ category, amount });
          }
        }
      });

      return {
        ...student,
        totalDue,
        monthlyBreakdown,
        fixedBreakdown,
        isDefaulter: totalDue > 0
      };
    });
  }, [students, fees, selectedMonthlyCats, selectedFixedCats, feeStructures, categoryMonths]);

  const filteredData = studentDueData.filter(s => s.class === selectedClass);
  const totalOutstanding = studentDueData.reduce((acc, s) => acc + s.totalDue, 0);

  const toggleMonthForCategory = (month: string, category: string) => {
    setCategoryMonths(prev => {
      const categoryMonthsList = prev[category] || [];
      const newMonths = categoryMonthsList.includes(month)
        ? categoryMonthsList.filter(m => m !== month)
        : [...categoryMonthsList, month];
      return { ...prev, [category]: newMonths };
    });
  };

  const toggleMonth = (m: string) => {
    setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const toggleMonthlyCat = (c: string) => {
    setSelectedMonthlyCats(prev => {
      if (prev.includes(c)) {
        setCategoryMonths(prevMonths => {
          const newMonths = { ...prevMonths };
          delete newMonths[c];
          return newMonths;
        });
        return prev.filter(x => x !== c);
      } else {
        setCategoryMonths(prevMonths => ({
          ...prevMonths,
          [c]: [NEPALI_MONTHS[new Date().getMonth() % 12]]
        }));
        return [...prev, c];
      }
    });
  };

  const toggleFixedCat = (c: string) => {
    setSelectedFixedCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  if (currentView === 'matrix') {
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8 no-print">
          <div className="flex justify-between items-center">
             <button onClick={() => setCurrentView('summary')} className="text-slate-400 hover:text-slate-900 font-black uppercase text-xs flex items-center">
                <i className="fas fa-arrow-left mr-2"></i> Dashboard
             </button>
             <h2 className="text-xl font-black text-slate-800 uppercase italic">Categorized Due Matrix</h2>
             <div className="flex gap-4">
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-600">
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button 
                  onClick={() => setCurrentView('credit-slips')}
                  disabled={selectedStudentIds.length === 0}
                  className="bg-slate-900 text-white px-8 py-2 rounded-xl font-black text-xs uppercase shadow-xl shadow-slate-900/20 disabled:opacity-30 transition"
                >
                  Confirm & Print ({selectedStudentIds.length})
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-slate-100 pt-8">
             {/* Monthly Cats */}
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                   <i className="fas fa-calendar-alt mr-2 text-blue-500"></i> Monthly Categories
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scroll">
                   {monthlyCategories.map(cat => (
                     <div key={cat} className="space-y-2">
                       <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedMonthlyCats.includes(cat) ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                          <input type="checkbox" className="hidden" checked={selectedMonthlyCats.includes(cat)} onChange={() => toggleMonthlyCat(cat)} />
                          <i className={`fas ${selectedMonthlyCats.includes(cat) ? 'fa-check-circle text-blue-600' : 'fa-circle text-slate-200'} mr-3`}></i>
                          <span className="text-[10px] font-black uppercase text-slate-700">{cat}</span>
                       </label>
                       {selectedMonthlyCats.includes(cat) && (
                         <div className="ml-6 grid grid-cols-4 gap-1">
                           {NEPALI_MONTHS.map(m => {
                             const isPaid = fees.some(f => 
                               f.feeType === cat && 
                               f.month === m && 
                               f.status === 'Paid'
                             );
                             return (
                               <button 
                                  key={m} 
                                  onClick={() => toggleMonthForCategory(m, cat)}
                                  className={`py-1 px-2 rounded text-[8px] font-bold uppercase border transition-all relative ${
                                    (categoryMonths[cat] || []).includes(m)
                                      ? 'bg-blue-600 text-white border-blue-600' 
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                                  }`}
                               >
                                  {m.slice(0,3)}
                                  {isPaid && <i className="fas fa-check absolute top-0 right-0 text-green-500 text-[6px]"></i>}
                               </button>
                             );
                           })}
                         </div>
                       )}
                     </div>
                   ))}
                </div>
             </div>

             {/* Fixed Cats */}
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                   <i className="fas fa-tag mr-2 text-emerald-500"></i> One-Time Categories
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scroll">
                   {oneTimeCategories.map(cat => {
                     const isPaid = fees.some(f => 
                       f.feeType === cat && 
                       f.status === 'Paid'
                     );
                     return (
                       <label key={cat} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedFixedCats.includes(cat) ? 'bg-emerald-50 border-emerald-600' : 'bg-slate-50 border-transparent hover:border-slate-200'} relative`}>
                          <input type="checkbox" className="hidden" checked={selectedFixedCats.includes(cat)} onChange={() => toggleFixedCat(cat)} />
                          <i className={`fas ${selectedFixedCats.includes(cat) ? 'fa-check-circle text-emerald-600' : 'fa-circle text-slate-200'} mr-3`}></i>
                          <span className="text-[10px] font-black uppercase text-slate-700">{cat}</span>
                          {isPaid && <i className="fas fa-check absolute top-2 right-2 text-green-500 text-sm"></i>}
                       </label>
                     );
                   })}
                </div>
             </div>

             {/* Target Months - Now shows selected categories and their months */}
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                   <i className="fas fa-clock mr-2 text-amber-500"></i> Selected Categories & Months
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                   {selectedMonthlyCats.length === 0 ? (
                     <p className="text-[9px] text-gray-500 italic">No monthly categories selected</p>
                   ) : (
                     selectedMonthlyCats.map(cat => (
                       <div key={cat} className="bg-slate-50 p-3 rounded-lg">
                         <p className="text-[9px] font-bold text-slate-600 mb-2">{cat}</p>
                         <div className="flex flex-wrap gap-1">
                           {(categoryMonths[cat] || []).map(month => (
                             <span key={month} className="bg-blue-600 text-white px-2 py-1 rounded text-[8px] font-bold">
                               {month.slice(0,3)}
                             </span>
                           ))}
                           {(categoryMonths[cat] || []).length === 0 && (
                             <span className="text-[8px] text-gray-400 italic">No months selected</span>
                           )}
                         </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                    <th className="px-8 py-5">
                       <input type="checkbox" checked={selectedStudentIds.length === filteredData.length && filteredData.length > 0} onChange={() => setSelectedStudentIds(selectedStudentIds.length === filteredData.length ? [] : filteredData.map(s => s.studentId))} className="w-4 h-4 rounded border-slate-300 text-blue-600 mr-4" />
                       <span className="font-black uppercase tracking-widest text-slate-400">Student</span>
                    </th>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-slate-400">Monthly Arrears</th>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-slate-400">One-Time Dues</th>
                    <th className="px-8 py-5 text-right font-black uppercase tracking-widest text-slate-400">Total Calculation</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {filteredData.map(student => (
                   <tr key={student.studentId} className={`hover:bg-blue-50/20 transition ${selectedStudentIds.includes(student.studentId) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-8 py-5">
                         <div className="flex items-center space-x-4">
                            <input type="checkbox" checked={selectedStudentIds.includes(student.studentId)} onChange={() => setSelectedStudentIds(prev => prev.includes(student.studentId) ? prev.filter(id => id !== student.studentId) : [...prev, student.studentId])} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                            <div><p className="font-black text-slate-800 uppercase">{student.name}</p><p className="text-[9px] text-slate-400 font-bold">SID: {student.studentId}</p></div>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="text-[10px] font-bold text-slate-600">
                            {student.monthlyBreakdown.length > 0 ? (
                              <div className="space-y-1">
                                {Object.entries(categoryMonths).map(([cat, months]) => {
                                  const catBreakdown = student.monthlyBreakdown.filter(b => b.category === cat);
                                  const catTotal = catBreakdown.reduce((sum, b) => sum + b.amount, 0);
                                  return catBreakdown.length > 0 ? (
                                    <div key={cat} className="text-[9px]">
                                      {cat}: {catBreakdown.length} month{catBreakdown.length > 1 ? 's' : ''} - NPR {catTotal.toLocaleString()}
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            ) : 'None'}
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex flex-wrap gap-1">
                            {student.fixedBreakdown.map(b => (
                               <span key={b.category} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                                 {b.category}: NPR {b.amount.toLocaleString()}
                               </span>
                            ))}
                            {student.fixedBreakdown.length === 0 && <span className="text-emerald-500 font-bold">None</span>}
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-red-600 text-sm">
                         NPR {student.totalDue.toLocaleString()}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    );
  }

  if (currentView === 'credit-slips') {
    const printableStudents = studentDueData.filter(s => selectedStudentIds.includes(s.studentId));
    
    return (
      <div className="animate-fadeIn space-y-8">
        <div className="flex justify-between items-center no-print bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={() => setCurrentView('matrix')} className="text-slate-400 hover:text-slate-900 transition font-black uppercase text-xs flex items-center">
             <i className="fas fa-arrow-left mr-2"></i> Edit Selections
           </button>
           <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black shadow-xl shadow-blue-600/20">
              <i className="fas fa-print mr-2"></i> Print Final Slips ({printableStudents.length})
           </button>
        </div>

        {/* Credit Slip Preview */}
        <div className="no-print bg-white p-6 rounded-2xl shadow-lg border border-slate-200 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-center mb-4">Credit Slip Preview</h3>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-center pb-2 mb-3 border-b border-gray-300">
               <h1 className="text-base font-bold uppercase">SUBASH SCHOOL</h1>
               <p className="text-sm">Fee Credit Slip & Due Notice</p>
               <p className="text-xs">Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
            {printableStudents.length > 0 && (
              <>
                <div className="text-sm space-y-1 mb-3">
                   <p><strong>Student:</strong> {printableStudents[0].name}</p>
                   <p><strong>Class:</strong> {printableStudents[0].class}</p>
                   <p><strong>Total Due:</strong> Rs. {printableStudents[0].totalDue.toLocaleString()}</p>
                </div>
                <div className="border border-gray-300 rounded">
                   <table className="w-full text-xs">
                      <thead>
                         <tr className="bg-gray-100">
                            <th className="text-left py-1 px-2 border-r border-gray-300">Particulars</th>
                            <th className="text-right py-1 px-2">Amount</th>
                         </tr>
                      </thead>
                      <tbody>
                         {printableStudents[0].monthlyBreakdown.map((item, idx) => (
                           <tr key={idx} className="border-t border-gray-200">
                              <td className="py-1 px-2 border-r border-gray-300">
                                 <div className="font-medium">{item.category}</div>
                                 <div className="text-xs text-gray-500">{item.month}</div>
                              </td>
                              <td className="py-1 px-2 text-right">Rs. {item.amount.toLocaleString()}</td>
                           </tr>
                         ))}
                         {printableStudents[0].fixedBreakdown.map((item, idx) => (
                           <tr key={idx} className="border-t border-gray-200">
                              <td className="py-1 px-2 border-r border-gray-300">
                                 <div className="font-medium">{item.category}</div>
                                 <div className="text-xs text-gray-500">One-time</div>
                              </td>
                              <td className="py-1 px-2 text-right">Rs. {item.amount.toLocaleString()}</td>
                           </tr>
                         ))}
                         <tr className="border-t-2 border-gray-400 bg-gray-100">
                            <td className="py-2 px-2 font-bold">TOTAL DUE</td>
                            <td className="py-2 px-2 text-right font-bold">Rs. {printableStudents[0].totalDue.toLocaleString()}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="print-only">
              {printableStudents.map((data, index) => (
                <div key={data.studentId} className="a5-page">
                   {/* Header */}
                   <div className="text-center pb-3 mb-4">
                      <h1 className="text-xl font-bold uppercase">SUBASH SCHOOL</h1>
                      <p className="text-base">Fee Credit Slip & Due Notice</p>
                      <p className="text-base">Academic Year: 2081 BS</p>
                      <p className="text-sm">Date Issued: {new Date().toLocaleDateString('en-GB')}</p>
                   </div>

                   {/* Student Info */}
                   <div className="grid grid-cols-2 gap-4 mb-4 text-base">
                      <div>
                         <p><strong>Name:</strong> {data.name}</p>
                         <p><strong>Class:</strong> {data.class} - {data.section}</p>
                      </div>
                      <div>
                         <p><strong>Roll No:</strong> {data.rollNo}</p>
                         <p><strong>Student ID:</strong> {data.studentId}</p>
                      </div>
                   </div>

                   {/* Fee Details */}
                   <div className="mb-4">
                      <table className="w-full text-base border-collapse border border-black">
                         <thead>
                            <tr className="bg-gray-100">
                               <th className="text-left py-2 px-3 border border-black">Particulars</th>
                               <th className="text-left py-2 px-3 border border-black">Month</th>
                               <th className="text-right py-2 px-3 border border-black">Amount (Rs.)</th>
                            </tr>
                         </thead>
                         <tbody>
                            {data.monthlyBreakdown.map((item, idx) => (
                               <tr key={idx}>
                                  <td className="py-2 px-3 border border-black">{item.category}</td>
                                  <td className="py-2 px-3 border border-black">{item.month}</td>
                                  <td className="py-2 px-3 text-right border border-black">{item.amount.toLocaleString()}</td>
                               </tr>
                            ))}
                            {data.fixedBreakdown.map((item, idx) => (
                               <tr key={idx}>
                                  <td className="py-2 px-3 border border-black">{item.category}</td>
                                  <td className="py-2 px-3 border border-black">-</td>
                                  <td className="py-2 px-3 text-right border border-black">{item.amount.toLocaleString()}</td>
                               </tr>
                            ))}
                            <tr className="font-bold bg-gray-50">
                               <td className="py-2 px-3 border border-black" colSpan={2}>TOTAL AMOUNT DUE</td>
                               <td className="py-2 px-3 text-right border border-black">Rs. {data.totalDue.toLocaleString()}</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>

                   {/* Footer */}
                   <div className="text-base">
                      <div className="text-center pt-3">
                         <p className="text-base">Please pay the dues on time to avoid late fees</p>
                      </div>
                   </div>
                </div>
              ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Financial Due Analytics</h3>
               <p className="text-sm text-slate-500 font-medium">Categorized billing engine (Monthly vs One-Time)</p>
               
               <div className="grid grid-cols-2 gap-8 mt-10">
                  <div className="p-8 bg-slate-900 text-white rounded-3xl relative overflow-hidden group shadow-2xl">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                     <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Defaulter Count</h4>
                     <p className="text-5xl font-black tracking-tighter">{studentDueData.filter(s => s.isDefaulter).length}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase mt-4 tracking-widest">Active session 2081</p>
                  </div>
                  <div className="p-8 bg-blue-600 text-white rounded-3xl relative overflow-hidden shadow-xl shadow-blue-600/30">
                     <h4 className="text-[10px] font-black uppercase text-blue-100 mb-2 tracking-widest">Outstanding NPR</h4>
                     <p className="text-4xl font-black tracking-tighter italic truncate">Rs.{totalOutstanding.toLocaleString()}</p>
                     <p className="text-[10px] text-blue-200 font-bold uppercase mt-4 tracking-widest">Live Multi-Tick Sync</p>
                  </div>
               </div>
            </div>

            <button 
               onClick={() => setCurrentView('matrix')}
               className="mt-10 w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center space-x-4 hover:bg-slate-800 transition active:scale-95 shadow-xl shadow-slate-900/20"
            >
               <i className="fas fa-layer-group text-blue-400"></i>
               <span className="uppercase tracking-widest text-sm">Open Categorized Matrix</span>
            </button>
         </div>

         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-10">
            <div>
               <h3 className="text-lg font-black mb-6 uppercase italic text-slate-800">Billing Engine Config</h3>
               <div className="space-y-6">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Active Monthly Items</p>
                     <div className="flex flex-wrap gap-1.5">
                        {selectedMonthlyCats.map(c => <span key={c} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{c}</span>)}
                        {selectedMonthlyCats.length === 0 && <span className="text-[9px] font-bold text-slate-300">No Monthly Selected</span>}
                     </div>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Active Fixed Items</p>
                     <div className="flex flex-wrap gap-1.5">
                        {selectedFixedCats.map(c => <span key={c} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{c}</span>)}
                        {selectedFixedCats.length === 0 && <span className="text-[9px] font-bold text-slate-300">No Fixed Selected</span>}
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collection Ratio</span>
                  <span className="text-xl font-black text-emerald-500">
                     {students.length > 0 ? Math.round(((students.length - studentDueData.filter(s => s.isDefaulter).length) / students.length) * 100) : 0}%
                  </span>
               </div>
               <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                     className="bg-emerald-500 h-full transition-all duration-700 ease-out" 
                     style={{ width: `${students.length > 0 ? ((students.length - studentDueData.filter(s => s.isDefaulter).length) / students.length) * 100 : 0}%` }}
                  ></div>
               </div>
            </div>

            <button 
               onClick={() => {
                  setSelectedStudentIds(studentDueData.filter(s => s.isDefaulter).map(s => s.studentId));
                  setCurrentView('credit-slips');
               }}
               className="w-full py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-slate-900 hover:text-white transition shadow-lg"
            >
               Print All {studentDueData.filter(s => s.isDefaulter).length} Slips
            </button>
         </div>
      </div>
    </div>
  );
};

export default Reports;
