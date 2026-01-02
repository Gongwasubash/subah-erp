
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api';

interface SettingsProps { user: User; }

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [remoteUrl, setRemoteUrl] = useState(localStorage.getItem('erp_remote_url') || '');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const handleStorage = () => setRemoteUrl(localStorage.getItem('erp_remote_url') || '');
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const saveUrl = () => {
    const trimmed = remoteUrl.trim().replace(/\/+$/, '');
    if (!trimmed.startsWith('https://script.google.com')) {
      alert("Invalid URL structure. Please use the /exec link from Google Apps Script.");
      return;
    }
    
    let finalUrl = trimmed;
    if (!trimmed.endsWith('/exec')) {
      finalUrl = trimmed.split('?')[0];
      if (!finalUrl.endsWith('/exec')) finalUrl += '/exec';
    }

    localStorage.setItem('erp_remote_url', finalUrl);
    setRemoteUrl(finalUrl);
    setMessage('✅ URL Configured.');
    
    setDiagnostics(["⏳ Checking connection..."]);
    setTimeout(() => { setMessage(''); runDiagnostics(); }, 1000);
  };

  const resetToDefault = () => {
    const defaultUrl = api.getDefaultUrl();
    localStorage.setItem('erp_remote_url', defaultUrl);
    setRemoteUrl(defaultUrl);
    setMessage('✅ Reset to Default Link.');
    setDiagnostics(["⏳ Re-testing connection..."]);
    setTimeout(() => runDiagnostics(), 500);
  };

  const runDiagnostics = async () => {
    setIsTesting(true);
    const logs: string[] = ["🔍 Checking Cloud API..."];
    
    if (!remoteUrl) {
      logs.push("❌ No URL. System in Local Mode.");
      setDiagnostics(logs);
      setIsTesting(false);
      return;
    }

    try {
      const res = await api.testConnection();
      logs.push(`✅ Cloud Handshake Success!`);
      logs.push(`📁 Active DB: "${res.sheet}"`);
      logs.push(`🚀 SERVER VERSION: ${res.version || 'Older (Please update)'}`);
      logs.push(`🚀 STATUS: ONLINE`);
    } catch (err: any) {
      logs.push(`❌ Error: ${err.message}`);
      if (err.message.includes('Action not recognized')) {
        logs.push("🚨 FIX: You haven't deployed the latest code. Go to Apps Script > Deploy > New Deployment.");
      } else if (err.message.includes('AUTH_REQUIRED') || err.message.includes('Unexpected token')) {
        logs.push("🚨 FIX: Redeploy your script. Set 'Who has access' to 'Anyone'.");
      }
    }
    setDiagnostics(logs);
    setIsTesting(false);
  };

  const copyBackendCode = () => {
    const code = `/**
 * Hamro School ERP - Unified Backend
 * VERSION: 3.4.0 (Robust Sync)
 */
const SS = SpreadsheetApp.getActiveSpreadsheet();
const VERSION = "3.4.0";

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action) {
      const action = e.parameter.action;
      const dataString = e.parameter.data;
      let data = [];
      if (dataString) {
        try { data = JSON.parse(dataString); } catch (err) { console.error("JSON Parse Error: " + dataString); }
      }
      let res;
      switch(action) {
        case "testConnection": res = { status: "success", data: { sheet: SS.getName(), user: Session.getActiveUser().getEmail(), version: VERSION } }; break;
        case "getStudents": res = { status: "success", data: getStudents() }; break;
        case "saveStudent": res = { status: "success", data: saveStudent(data[0]) }; break;
        case "getFeeRecords": res = { status: "success", data: getFeeRecords() }; break;
        case "saveFeeRecord": res = { status: "success", data: saveFeeRecord(data[0]) }; break;
        case "getFeeCategories": res = { status: "success", data: getFeeCategories() }; break;
        case "saveFeeCategory": res = { status: "success", data: saveFeeCategory(data[0]) }; break;
        case "getAttendanceRecords": res = { status: "success", data: getAttendanceRecords() }; break;
        case "saveAttendance": res = { status: "success", data: saveAttendance(data[0]) }; break;
        case "getMarksRecords": res = { status: "success", data: getMarksRecords() }; break;
        case "saveMark": res = { status: "success", data: saveMark(data[0]) }; break;
        case "initializeDatabase": res = { status: "success", data: initializeDatabase() }; break;
        case "authenticateUser": res = { status: "success", data: authenticateUser(data[0], data[1]) }; break;
        default: res = { status: "error", message: "Action not recognized: " + action + ". Please ensure you have deployed VERSION " + VERSION + " as a NEW VERSION." };
      }
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "API is live." })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeDatabase() {
  const sheets = [
    { name: 'Users', cols: ['Username', 'Password', 'Role', 'Status'] },
    { name: 'Students', cols: ['Student_ID', 'Roll_No', 'Student_Name', 'Father_Name', 'Mother_Name', 'Class', 'Section', 'Gender', 'Date_of_Birth', 'Address', 'Phone', 'Admission_Date', 'Status'] },
    { name: 'Fee_Record', cols: ['Receipt_No', 'Student_ID', 'Student_Name', 'Class', 'Month', 'Fee_Type', 'Amount', 'Discount', 'Total', 'Paid_Date', 'Payment_Mode', 'Collected_By', 'Status'] },
    { name: 'Fee_Categories', cols: ['Category_Name', 'Description'] },
    { name: 'Attendance', cols: ['Date', 'Class', 'Student_ID', 'Status'] },
    { name: 'Marks', cols: ['Student_ID', 'Class', 'Exam_Name', 'Subject', 'Marks_Obtained'] }
  ];
  sheets.forEach(s => {
    let sheet = SS.getSheetByName(s.name) || SS.insertSheet(s.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(s.cols);
      sheet.getRange(1, 1, 1, s.cols.length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
    }
  });
  const catSheet = SS.getSheetByName('Fee_Categories');
  if (catSheet.getLastRow() === 1) {
    const defaults = [
      ['Admission Fee', 'One-time admission charge'], ['Monthly Tuition Fee', 'Regular monthly study fee'], ['Annual Fee', 'Yearly administrative fee'], ['Terminal Exam Fee', 'Fee per examination term'], ['Computer & IT Fee', 'Lab and technology usage'], ['Library Fee', 'Book access and maintenance'], ['Laboratory Fee', 'Science lab materials'], ['Bus/Transportation Fee', 'School vehicle service'], ['Hostel/Boarding Fee', 'Accommodation charges'], ['Sports & EC Fee', 'Extracurricular activities'], ['ID Card & Belt/Tie Fee', 'Accessories and identification'], ['Diary & Calendar Fee', 'Annual school publications'], ['Building Fund', 'Infrastructure development'], ['Maintenance Fee', 'Facility upkeep'], ['Late Payment Fine', 'Penalty for delayed fees'], ['Uniform Fee', 'School dress set charges'], ['Field Trip Fee', 'Educational tours'], ['Stationery & Books Fee', 'Curriculum materials'], ['Insurance/Health Fee', 'Student safety fund'], ['Miscellaneous Fee', 'Other small expenses']
    ];
    defaults.forEach(d => catSheet.appendRow(d));
  }
  const userSheet = SS.getSheetByName('Users');
  if (userSheet.getLastRow() === 1) userSheet.appendRow(['admin', 'admin123', 'Admin', 'Active']);
  return "Database Initialized Successfully!";
}

function getFeeCategories() {
  const s = SS.getSheetByName('Fee_Categories');
  if (!s) return ['Monthly Tuition Fee', 'Admission Fee'];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.length > 0 ? data.map(r => r[0]) : ['Monthly Tuition Fee', 'Admission Fee'];
}

function saveFeeCategory(name) {
  let s = SS.getSheetByName('Fee_Categories');
  if (!s) { s = SS.insertSheet('Fee_Categories'); s.appendRow(['Category_Name', 'Description']); }
  s.appendRow([name, 'User defined category']);
  return true;
}

function authenticateUser(u, p) {
  const sheet = SS.getSheetByName('Users');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === u && data[i][1].toString() === p && data[i][3] === 'Active') {
      return { username: data[i][0], role: data[i][2], status: data[i][3] };
    }
  }
  return null;
}

function getStudents() {
  const s = SS.getSheetByName('Students');
  if (!s) return [];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ studentId: r[0], rollNo: r[1], name: r[2], fatherName: r[3], motherName: r[4], class: r[5], section: r[6], gender: r[7], dobBS: r[8], address: r[9], phone: r[10], admissionDateBS: r[11], status: r[12] }));
}

function saveStudent(s) { SS.getSheetByName('Students').appendRow([s.studentId, s.rollNo, s.name, s.fatherName, s.motherName, s.class, s.section, s.gender, s.dobBS, s.address, s.phone, s.admissionDateBS, s.status]); return true; }

function getFeeRecords() {
  const s = SS.getSheetByName('Fee_Record');
  if (!s) return [];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ receiptNo: r[0], studentId: r[1], studentName: r[2], class: r[3], month: r[4], feeType: r[5], amount: r[6], discount: r[7], total: r[8], paidDateBS: r[9], paymentMode: r[10], collectedBy: r[11], status: r[12] }));
}

function saveFeeRecord(f) { SS.getSheetByName('Fee_Record').appendRow([f.receiptNo, f.studentId, f.studentName, f.class, f.month, f.feeType, f.amount, f.discount, f.total, f.paidDateBS, f.paymentMode, f.collectedBy, f.status]); return true; }

function getAttendanceRecords() {
  const s = SS.getSheetByName('Attendance');
  if (!s) return [];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ dateBS: r[0], class: r[1], studentId: r[2], status: r[3] }));
}

function saveAttendance(rs) { const s = SS.getSheetByName('Attendance'); rs.forEach(r => s.appendRow([r.dateBS, r.class, r.studentId, r.status])); return true; }

function getMarksRecords() {
  const s = SS.getSheetByName('Marks');
  if (!s) return [];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ studentId: r[0], class: r[1], examName: r[2], subject: r[3], marksObtained: r[4] }));
}

function saveMark(m) { SS.getSheetByName('Marks').appendRow([m.studentId, m.class, m.examName, m.subject, m.marksObtained]); return true; }`;
    navigator.clipboard.writeText(code);
    alert("VERSION 3.4.0 code copied! Go to Apps Script, paste it, and DEPLOY as a NEW VERSION.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Connectivity</h2>
          <p className="text-slate-500 font-medium">Cloud Database Integration</p>
        </div>
        <button onClick={() => setShowGuide(!showGuide)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition hover:bg-blue-700">
          {showGuide ? 'Hide Instructions' : 'Setup Guide'}
        </button>
      </div>

      {showGuide && (
        <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-4 shadow-xl border border-blue-500/20">
          <h3 className="text-lg font-black text-blue-400">Critical Setup Steps</h3>
          <ol className="list-decimal list-inside text-sm text-slate-400 space-y-3">
            <li>Open your Google Sheet, go to <b>Extensions {'>'} Apps Script</b>.</li>
            <li>Replace all existing code with the code from the button below.</li>
            <li>Click the <b>Deploy</b> button (top right) {'>'} <b>Manage Deployments</b>.</li>
            <li>Click the <b>Pencil (Edit)</b> icon next to your active deployment.</li>
            <li>Change the Version to <b>"New Version"</b>. This is mandatory!</li>
            <li>Click <b>Deploy</b>.</li>
            <li>Copy the <b>Web App URL</b> and paste it below.</li>
          </ol>
          <button onClick={copyBackendCode} className="bg-blue-600 w-full py-4 rounded-xl font-black mt-4 hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
             1. Copy Code (v3.4.0)
          </button>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">Web App Deployment URL</label>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={remoteUrl} 
            onChange={(e) => setRemoteUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
          />
          <div className="flex gap-2">
            <button onClick={saveUrl} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition">
              Save
            </button>
            <button onClick={resetToDefault} className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-bold hover:bg-slate-200 transition">
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between border border-white/5">
          <div>
            <h3 className="font-black mb-4 flex items-center text-emerald-400">
               <i className="fas fa-satellite-dish mr-3"></i>
               Connection Logs
            </h3>
            <div className="bg-black/40 rounded-2xl p-4 font-mono text-[10px] space-y-2 h-40 overflow-y-auto border border-white/10">
              {diagnostics.map((l, i) => (
                <div key={i} className={l.includes('✅') ? 'text-emerald-400' : l.includes('❌') ? 'text-red-400' : 'text-slate-400'}>
                  {l}
                </div>
              ))}
              {diagnostics.length === 0 && <p className="text-slate-600 italic">No logs recorded.</p>}
            </div>
          </div>
          <button onClick={runDiagnostics} disabled={isTesting || !remoteUrl} className="mt-6 bg-white/10 hover:bg-white/20 py-4 rounded-xl font-bold transition">
            {isTesting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-sync mr-2"></i>}
            Run Connection Check
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 mb-2">Initialize Database</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">This creates the Student, Fee, and User sheets in your Google Spreadsheet automatically.</p>
          </div>
          <button 
            onClick={async () => {
                if (!confirm("Initialize Cloud Database? This will create standard tabs in your spreadsheet.")) return;
                setIsInitializing(true);
                try {
                  const res = await api.initDb();
                  setMessage(`✅ ${res}`);
                } catch(e:any) { setMessage(`❌ ${e.message}`); }
                setIsInitializing(false);
            }}
            disabled={isInitializing || !remoteUrl}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black hover:bg-blue-700 transition"
          >
            {isInitializing ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-database"></i>}
            <span className="ml-3">Setup Spreadsheet Tabs</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 p-6 rounded-2xl text-sm font-black bg-slate-900 text-white shadow-2xl animate-fadeIn z-50 border border-white/10">
          {message}
        </div>
      )}
    </div>
  );
};

export default Settings;
