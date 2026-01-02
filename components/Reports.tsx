
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
  
  // Ticking States
  const [selectedMonths, setSelectedMonths] = useState<string[]>([NEPALI_MONTHS[new Date().getMonth() % 12]]);
  const [selectedMonthlyCats, setSelectedMonthlyCats] = useState<string[]>(['Monthly Tuition Fee']);
  const [selectedFixedCats, setSelectedFixedCats] = useState<string[]>(['Annual Fee']);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    api.getFeeStructures().then(res => setFeeStructures(res || []));
  }, []);

  // Advanced Categorized Calculation Engine
  const studentDueData = useMemo(() => {
    return students.map(student => {
      let totalDue = 0;
      const monthlyBreakdown: { month: string; category: string; amount: number }[] = [];
      const fixedBreakdown: { category: string; amount: number }[] = [];

      // 1. Process Monthly Recurring Fees
      selectedMonths.forEach(month => {
        selectedMonthlyCats.forEach(category => {
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
  }, [students, fees, selectedMonths, selectedMonthlyCats, selectedFixedCats, feeStructures]);

  const filteredData = studentDueData.filter(s => s.class === selectedClass);
  const totalOutstanding = studentDueData.reduce((acc, s) => acc + s.totalDue, 0);

  const toggleMonth = (m: string) => {
    setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const toggleMonthlyCat = (c: string) => {
    setSelectedMonthlyCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
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
                   {MONTHLY_FEE_TYPES.map(cat => (
                     <label key={cat} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedMonthlyCats.includes(cat) ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <input type="checkbox" className="hidden" checked={selectedMonthlyCats.includes(cat)} onChange={() => toggleMonthlyCat(cat)} />
                        <i className={`fas ${selectedMonthlyCats.includes(cat) ? 'fa-check-circle text-blue-600' : 'fa-circle text-slate-200'} mr-3`}></i>
                        <span className="text-[10px] font-black uppercase text-slate-700">{cat}</span>
                     </label>
                   ))}
                </div>
             </div>

             {/* Fixed Cats */}
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                   <i className="fas fa-tag mr-2 text-emerald-500"></i> Fixed/One-Time Categories
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scroll">
                   {ONE_TIME_FEE_TYPES.map(cat => (
                     <label key={cat} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedFixedCats.includes(cat) ? 'bg-emerald-50 border-emerald-600' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <input type="checkbox" className="hidden" checked={selectedFixedCats.includes(cat)} onChange={() => toggleFixedCat(cat)} />
                        <i className={`fas ${selectedFixedCats.includes(cat) ? 'fa-check-circle text-emerald-600' : 'fa-circle text-slate-200'} mr-3`}></i>
                        <span className="text-[10px] font-black uppercase text-slate-700">{cat}</span>
                     </label>
                   ))}
                </div>
             </div>

             {/* Target Months */}
             <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                   <i className="fas fa-clock mr-2 text-amber-500"></i> Selected Months (For Monthly Fees)
                </p>
                <div className="grid grid-cols-3 gap-2">
                   {NEPALI_MONTHS.map(m => (
                     <button 
                        key={m} 
                        onClick={() => toggleMonth(m)}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase border-2 transition-all ${selectedMonths.includes(m) ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                     >
                        {m.slice(0,3)}
                     </button>
                   ))}
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
                            {student.monthlyBreakdown.length} months x {selectedMonthlyCats.length} cats
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex flex-wrap gap-1">
                            {student.fixedBreakdown.map(b => (
                               <span key={b.category} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[8px] font-black uppercase">{b.category}</span>
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

        <div className="print-only a4-page">
           <div className="grid grid-cols-1 gap-8">
              {printableStudents.map((data) => (
                <div key={data.studentId} className="border-4 border-slate-900 p-8 rounded-3xl relative overflow-hidden break-inside-avoid mb-10">
                   <div className="text-center border-b-4 border-slate-900 pb-6 mb-8">
                      <h1 className="text-3xl font-black uppercase tracking-tighter">Subash ERP</h1>
                      <div className="bg-slate-900 text-white px-10 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] inline-block mt-3 italic shadow-lg">
                         OFFICIAL FEE REMINDER & CREDIT SLIP
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-10 mb-8 border-b-2 border-slate-100 pb-8">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</p>
                         <h4 className="font-black text-2xl text-slate-900 uppercase">{data.name}</h4>
                         <p className="font-bold text-slate-500">SID: {data.studentId} • Roll No: {data.rollNo}</p>
                      </div>
                      <div className="text-right space-y-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Details</p>
                         <h4 className="font-black text-2xl text-slate-900 uppercase">{data.class} - {data.section}</h4>
                         <p className="font-bold text-slate-500 uppercase">Batch Session: 2081 BS</p>
                      </div>
                   </div>

                   {/* Itemized Tables */}
                   <div className="space-y-8">
                      {data.monthlyBreakdown.length > 0 && (
                        <div>
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 border-l-4 border-blue-600 pl-3">Monthly Arrears Summary</p>
                           <table className="w-full text-[10px] border-collapse">
                              <thead>
                                 <tr className="bg-slate-100 border-t-2 border-b-2 border-slate-900 text-slate-900">
                                    <th className="py-2 px-4 text-left font-black uppercase">Month</th>
                                    <th className="py-2 px-4 text-left font-black uppercase">Fee Category</th>
                                    <th className="py-2 px-4 text-right font-black uppercase">Amount</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-bold uppercase">
                                 {data.monthlyBreakdown.map((item, idx) => (
                                    <tr key={idx}>
                                       <td className="py-2 px-4">{item.month}</td>
                                       <td className="py-2 px-4">{item.category}</td>
                                       <td className="py-2 px-4 text-right">NPR {item.amount.toLocaleString()}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                      )}

                      {data.fixedBreakdown.length > 0 && (
                        <div>
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 border-l-4 border-emerald-600 pl-3">Fixed / One-Time Dues</p>
                           <table className="w-full text-[10px] border-collapse">
                              <tbody className="divide-y divide-slate-100 font-bold uppercase border-t-2 border-b-2 border-slate-900">
                                 {data.fixedBreakdown.map((item, idx) => (
                                    <tr key={idx}>
                                       <td className="py-3 px-4 flex items-center">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3"></div>
                                          {item.category}
                                       </td>
                                       <td className="py-3 px-4 text-right font-black text-slate-900">NPR {item.amount.toLocaleString()}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                      )}
                   </div>

                   <div className="flex justify-between items-center bg-slate-900 text-white p-10 rounded-3xl mt-12 shadow-2xl">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Combined Total Due Balance</p>
                         <h3 className="text-5xl font-black tracking-tighter italic">NPR {data.totalDue.toLocaleString()}</h3>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold uppercase italic opacity-70 mb-1">Required Action</p>
                         <p className="text-sm font-black uppercase tracking-widest border-b-2 border-white pb-1">Immediate Settlement</p>
                      </div>
                   </div>

                   <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300 flex justify-between items-end">
                      <div className="text-[9px] text-slate-400 italic font-black uppercase max-w-[300px] leading-relaxed">
                         Note: This is an automated financial notice. Please ignore if payment was made in the last 24 hours. Contact administrative desk for queries.
                      </div>
                      <div className="text-center w-64 border-t-4 border-slate-900 pt-3">
                         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Administrative Seal</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
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
