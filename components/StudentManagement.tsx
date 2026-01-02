
import React, { useState } from 'react';
import { Student } from '../types';
import { CLASSES, SECTIONS, getTodayBS } from '../constants';
import { api } from '../api';

interface StudentManagementProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ students, setStudents }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<Partial<Student>>({
    class: 'Class 1',
    section: 'A',
    gender: 'Male',
    admissionDateBS: getTodayBS(),
    status: 'Active'
  });

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toString().includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNo) {
      alert("Please fill name and roll number.");
      return;
    }

    setIsSaving(true);
    const newId = `SID-${208100 + students.length + 1}`;
    const newStudent = { ...formData, studentId: newId } as Student;
    
    try {
      await api.saveStudent(newStudent);
      setStudents([...students, newStudent]);
      setIsAdding(false);
      setFormData({ class: 'Class 1', section: 'A', gender: 'Male', admissionDateBS: getTodayBS(), status: 'Active' });
    } catch (err: any) {
      alert("Failed to save student: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-lg">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search students by name, ID or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium shadow-sm transition-all outline-none"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <i className="fas fa-user-plus"></i>
          <span>New Admission</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-blue-50 animate-fadeIn relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Student Admission Portal</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Batch 2081 BS</p>
            </div>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900 p-2 transition bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <InputField label="Student Full Name" required onChange={(v) => setFormData({...formData, name: v})} />
            <InputField label="Class Roll Number" required onChange={(v) => setFormData({...formData, rollNo: v})} />
            <SelectField label="Select Class" options={CLASSES} value={formData.class} onChange={(v) => setFormData({...formData, class: v})} />
            <SelectField label="Section" options={SECTIONS} value={formData.section} onChange={(v) => setFormData({...formData, section: v})} />
            <SelectField label="Gender" options={['Male', 'Female', 'Other']} value={formData.gender} onChange={(v) => setFormData({...formData, gender: v})} />
            <InputField label="Father's Full Name" onChange={(v) => setFormData({...formData, fatherName: v})} />
            <InputField label="Mother's Full Name" onChange={(v) => setFormData({...formData, motherName: v})} />
            <InputField label="Birth Date (BS)" placeholder="YYYY-MM-DD" onChange={(v) => setFormData({...formData, dobBS: v})} />
            <InputField label="Admission Date (BS)" value={formData.admissionDateBS} onChange={(v) => setFormData({...formData, admissionDateBS: v})} />
            <InputField label="Contact Phone" onChange={(v) => setFormData({...formData, phone: v})} />
            <div className="md:col-span-2">
              <InputField label="Permanent Address" onChange={(v) => setFormData({...formData, address: v})} />
            </div>
            <div className="md:col-span-3 pt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-emerald-600/20 transition-all flex items-center space-x-3"
              >
                {isSaving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <i className="fas fa-save"></i>}
                <span>{isSaving ? 'Registering...' : 'Complete Admission'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left erp-table">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">SID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.studentId} className="hover:bg-blue-50/30 transition group">
                    <td className="px-8 py-5 text-sm font-black text-blue-600">{s.studentId}</td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Roll No: {s.rollNo}</div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{s.class} - {s.section}</td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{s.phone || 'N/A'}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-right">
                      <div className="flex justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white transition flex items-center justify-center"><i className="fas fa-edit text-xs"></i></button>
                        <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-600 hover:text-white transition flex items-center justify-center"><i className="fas fa-trash text-xs"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                   <i className="fas fa-search"></i>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No matching students found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-32 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-8 text-4xl">
               <i className="fas fa-user-graduate"></i>
            </div>
            <h4 className="text-xl font-black text-slate-800 mb-2">Database is Empty</h4>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
              No student records were found in your Google Sheet. Start by adding a new admission.
            </p>
            <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-600/20">
               Register First Student
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InputField: React.FC<{ label: string; placeholder?: string; value?: string; required?: boolean; onChange?: (v: string) => void }> = ({ label, placeholder, value, required, onChange }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input 
      type="text" 
      placeholder={placeholder || label}
      defaultValue={value}
      onChange={(e) => onChange?.(e.target.value)}
      required={required}
      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-medium transition"
    />
  </div>
);

const SelectField: React.FC<{ label: string; options: string[]; value?: string; onChange?: (v: string) => void }> = ({ label, options, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{label}</label>
    <select 
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold transition"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default StudentManagement;
