
import React, { useState } from 'react';
import { Student, AttendanceRecord } from '../types';
import { CLASSES, SECTIONS, getTodayBS } from '../constants';
import { api } from '../api';

interface AttendanceProps {
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  students: Student[];
}

const AttendanceSystem: React.FC<AttendanceProps> = ({ attendance, setAttendance, students }) => {
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [date, setDate] = useState(getTodayBS());
  const [isSaving, setIsSaving] = useState(false);

  const filteredStudents = students.filter(s => s.class === selectedClass && s.section === selectedSection);
  
  const toggleStatus = (studentId: string) => {
    const existingIndex = attendance.findIndex(a => a.studentId === studentId && a.dateBS === date);
    if (existingIndex > -1) {
      const updated = [...attendance];
      updated[existingIndex].status = updated[existingIndex].status === 'Present' ? 'Absent' : 'Present';
      setAttendance(updated);
    } else {
      setAttendance([...attendance, { dateBS: date, class: selectedClass, studentId, status: 'Present' }]);
    }
  };

  const getStatus = (studentId: string) => {
    return attendance.find(a => a.studentId === studentId && a.dateBS === date)?.status || 'Absent';
  };

  const handleBulkSave = async () => {
    setIsSaving(true);
    // Only save the current class/date records
    const classRecords = attendance.filter(a => a.dateBS === date && a.class === selectedClass);
    try {
      await api.saveAttendance(classRecords);
      alert("Attendance saved to database!");
    } catch (err) {
      alert("Error saving attendance.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex flex-wrap gap-6">
          <div className="w-48">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Class</label>
            <select className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-600 transition" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Section</label>
            <select className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-600 transition" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Date (BS)</label>
            <input type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Presence</p>
            <h4 className="text-3xl font-black text-blue-600 tabular-nums">
              {filteredStudents.filter(s => getStatus(s.studentId) === 'Present').length}<span className="text-slate-300 text-lg mx-1">/</span>{filteredStudents.length}
            </h4>
          </div>
          <button 
            onClick={handleBulkSave}
            disabled={isSaving || filteredStudents.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center space-x-3"
          >
            {isSaving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <i className="fas fa-cloud-upload-alt"></i>}
            <span>{isSaving ? 'Saving...' : 'Submit Records'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-10">
          {filteredStudents.map(student => {
            const status = getStatus(student.studentId);
            return (
              <div 
                key={student.studentId}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                  status === 'Present' 
                    ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100' 
                    : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
                onClick={() => toggleStatus(student.studentId)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                    status === 'Present' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}>
                    {student.rollNo}
                  </div>
                  <div>
                    <p className={`font-black text-sm leading-tight transition-colors ${status === 'Present' ? 'text-emerald-900' : 'text-slate-700'}`}>
                      {student.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student.studentId}</p>
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  status === 'Present' ? 'bg-emerald-600 text-white scale-110' : 'border-2 border-slate-200 bg-white'
                }`}>
                  {status === 'Present' && <i className="fas fa-check text-xs"></i>}
                </div>
              </div>
            );
          })}
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-24 text-center text-slate-300 font-black uppercase tracking-widest flex flex-col items-center">
            <i className="fas fa-user-slash text-5xl mb-6 text-slate-100"></i>
            No students in this group
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceSystem;
