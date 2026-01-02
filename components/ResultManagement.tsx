
import React, { useState } from 'react';
import { Student, MarkEntry } from '../types';
import { CLASSES, calculateGrade } from '../constants';
import { getAcademicAdvice } from '../geminiService';
import { api } from '../api';

interface ResultProps {
  marks: MarkEntry[];
  setMarks: React.Dispatch<React.SetStateAction<MarkEntry[]>>;
  students: Student[];
}

const ResultManagement: React.FC<ResultProps> = ({ marks, setMarks, students }) => {
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [examName, setExamName] = useState('First Terminal');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [aiInsight, setAiInsight] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);

  const [markInput, setMarkInput] = useState({
    subject: 'Mathematics',
    obtained: 0
  });

  const subjects = ['Nepali', 'English', 'Mathematics', 'Science', 'Social Studies', 'Computer', 'Health'];

  const studentMarks = marks.filter(m => m.studentId === selectedStudent?.studentId && m.examName === examName);

  const handleAddMark = async () => {
    if (!selectedStudent) return;
    setIsSaving(true);
    const newMark: MarkEntry = {
      studentId: selectedStudent.studentId,
      class: selectedClass,
      examName: examName,
      subject: markInput.subject,
      marksObtained: markInput.obtained
    };
    
    try {
      await api.saveMark(newMark);
      setMarks([...marks, newMark]);
      setAiInsight('');
    } catch(err: any) {
      alert("Failed to save mark: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const analyzePerformance = async () => {
    if (!selectedStudent || studentMarks.length === 0) return;
    setIsAnalyzing(true);
    const advice = await getAcademicAdvice(selectedStudent.name, studentMarks);
    setAiInsight(advice || '');
    setIsAnalyzing(false);
  };

  if (showReportCard && selectedStudent) {
    const totalObtained = studentMarks.reduce((acc, m) => acc + m.marksObtained, 0);
    const totalFull = studentMarks.length * 100;
    const finalGpa = studentMarks.length > 0 ? (studentMarks.reduce((acc, m) => acc + calculateGrade(m.marksObtained, 100).point, 0) / studentMarks.length).toFixed(2) : "0.00";

    return (
      <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-10 no-print">
          <button onClick={() => setShowReportCard(false)} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black">
            <i className="fas fa-arrow-left mr-2"></i> Back to Editor
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-600/20">
            <i className="fas fa-print mr-2"></i> Print Report Card
          </button>
        </div>

        <div className="print-only a4-page">
           <div className="border-[6px] border-slate-900 p-12 h-full flex flex-col">
              <div className="text-center mb-12">
                 <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">Subash ERP</h1>
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Secondary Education Department • Nepal</p>
                 <div className="inline-block border-2 border-slate-900 px-8 py-2 font-black text-xl uppercase tracking-widest bg-slate-50">
                    Progress Report Card
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12 border-b-2 border-slate-900 pb-8">
                 <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Information</p>
                    <h2 className="text-2xl font-black">{selectedStudent.name}</h2>
                    <p className="text-sm font-bold">ID: {selectedStudent.studentId}</p>
                    <p className="text-sm font-bold">{selectedStudent.class} {selectedStudent.section}</p>
                 </div>
                 <div className="text-right space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Examination Details</p>
                    <h3 className="text-xl font-black uppercase">{examName}</h3>
                    <p className="text-sm font-bold">Session: 2081 BS</p>
                    <p className="text-sm font-bold">Date: {new Date().toLocaleDateString()}</p>
                 </div>
              </div>

              <table className="w-full border-collapse mb-12 flex-grow">
                 <thead>
                    <tr className="bg-slate-900 text-white text-xs uppercase tracking-widest">
                       <th className="py-4 px-6 text-left border border-slate-900">Subject Name</th>
                       <th className="py-4 px-6 text-center border border-slate-900">Full Marks</th>
                       <th className="py-4 px-6 text-center border border-slate-900">Obtained</th>
                       <th className="py-4 px-6 text-center border border-slate-900">Grade</th>
                       <th className="py-4 px-6 text-center border border-slate-900">GPA</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm font-bold text-slate-800">
                    {studentMarks.map((m, i) => {
                       const { grade, point } = calculateGrade(m.marksObtained, 100);
                       return (
                          <tr key={i} className="border border-slate-900">
                             <td className="py-4 px-6 border border-slate-900">{m.subject}</td>
                             <td className="py-4 px-6 text-center border border-slate-900">100</td>
                             <td className="py-4 px-6 text-center border border-slate-900 font-black">{m.marksObtained}</td>
                             <td className="py-4 px-6 text-center border border-slate-900 font-black">{grade}</td>
                             <td className="py-4 px-6 text-center border border-slate-900">{point.toFixed(1)}</td>
                          </tr>
                       );
                    })}
                 </tbody>
                 <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900">
                       <td className="py-4 px-6 border border-slate-900 text-right">TOTALS / AGGREGATE</td>
                       <td className="py-4 px-6 text-center border border-slate-900">{studentMarks.length * 100}</td>
                       <td className="py-4 px-6 text-center border border-slate-900">{totalObtained}</td>
                       <td className="py-4 px-6 text-center border border-slate-900 text-xl">{finalGpa} (GPA)</td>
                       <td className="py-4 px-6 text-center border border-slate-900">-</td>
                    </tr>
                 </tfoot>
              </table>

              {aiInsight && (
                <div className="mb-12 p-6 bg-slate-50 border border-slate-300 rounded-xl italic text-sm text-slate-700 leading-relaxed">
                   <strong>Principal's Feedback:</strong> "{aiInsight}"
                </div>
              )}

              <div className="mt-auto pt-12 flex justify-between">
                 <div className="w-48 text-center border-t-2 border-slate-900 pt-2">
                    <p className="text-[10px] font-black uppercase">Class Teacher</p>
                 </div>
                 <div className="w-48 text-center border-t-2 border-slate-900 pt-2">
                    <p className="text-[10px] font-black uppercase">Examination Head</p>
                 </div>
                 <div className="w-48 text-center border-t-2 border-slate-900 pt-2">
                    <p className="text-[10px] font-black uppercase">Principal</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Class</label>
          <select className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Exam Type</label>
          <select className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={examName} onChange={(e) => setExamName(e.target.value)}>
            <option>First Terminal</option>
            <option>Second Terminal</option>
            <option>Annual Exam</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Choose Student</label>
          <select 
            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" 
            onChange={(e) => {
              const s = students.find(st => st.studentId === e.target.value);
              setSelectedStudent(s || null);
              setAiInsight('');
            }}
          >
            <option value="">Select Student...</option>
            {students.filter(s => s.class === selectedClass).map(s => <option key={s.studentId} value={s.studentId}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="font-black text-slate-900 mb-6 flex items-center space-x-3">
              <i className="fas fa-edit text-blue-600"></i>
              <span>Enter Marks</span>
            </h4>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Subject</label>
                  <select 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    value={markInput.subject}
                    onChange={(e) => setMarkInput({...markInput, subject: e.target.value})}
                  >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Obtained</label>
                  <input type="number" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black" value={markInput.obtained} onChange={(e) => setMarkInput({...markInput, obtained: parseInt(e.target.value)})} />
                </div>
              </div>
              <button onClick={handleAddMark} disabled={isSaving} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg transition disabled:opacity-50">
                {isSaving ? <i className="fas fa-sync fa-spin"></i> : "Submit Mark"}
              </button>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Saved Subject Grades</h5>
              <div className="space-y-3">
                {studentMarks.map((m, idx) => {
                  const { grade } = calculateGrade(m.marksObtained, 100);
                  return (
                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                      <span className="font-bold text-slate-700">{m.subject}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-black text-slate-900">{m.marksObtained} / 100</span>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase">{grade}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
              <div className="flex justify-between items-center mb-6 relative">
                <h4 className="font-black flex items-center"><i className="fas fa-robot mr-3 text-blue-400"></i> AI Academic Advice</h4>
                <button 
                  onClick={analyzePerformance}
                  disabled={isAnalyzing || studentMarks.length === 0}
                  className="bg-blue-600 hover:bg-blue-500 text-[10px] uppercase font-black px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {isAnalyzing ? <i className="fas fa-spinner fa-spin"></i> : 'Run Analysis'}
                </button>
              </div>
              {aiInsight ? (
                <p className="text-blue-100 text-sm leading-relaxed italic border-l-4 border-blue-500 pl-4">
                  "{aiInsight}"
                </p>
              ) : (
                <div className="text-slate-500 text-xs italic text-center py-8">
                  Get automated academic feedback for {selectedStudent.name}.
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowReportCard(true)}
              disabled={studentMarks.length === 0}
              className="w-full bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between hover:border-blue-600 transition group disabled:opacity-50"
            >
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-red-600 group-hover:text-white transition-all">
                    <i className="fas fa-file-pdf"></i>
                 </div>
                 <div className="text-left">
                    <p className="font-black text-slate-900">Official Report Card</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Generate A4 PDF Layout</p>
                 </div>
              </div>
              <i className="fas fa-chevron-right text-slate-300 group-hover:text-blue-600 transition"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultManagement;
