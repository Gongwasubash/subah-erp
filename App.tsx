
import React, { useState, useEffect } from 'react';
import { User, Student, FeeRecord, AttendanceRecord, MarkEntry } from './types';
import { getTodayBS } from './constants';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import FeeManagement from './components/FeeManagement';
import AttendanceSystem from './components/AttendanceSystem';
import ResultManagement from './components/ResultManagement';
import LoginPage from './components/LoginPage';
import Settings from './components/Settings';
import Reports from './components/Reports';
import { api } from './api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAppsScript, setIsAppsScript] = useState(false);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkEntry[]>([]);

  useEffect(() => {
    // Sync the System URL to local storage if it's new or empty
    const systemUrl = api.getDefaultUrl();
    const storedUrl = localStorage.getItem('erp_remote_url');
    const storedSystemVersion = localStorage.getItem('erp_system_url_version');

    if (!storedUrl || storedSystemVersion !== systemUrl) {
      localStorage.setItem('erp_remote_url', systemUrl);
      localStorage.setItem('erp_system_url_version', systemUrl);
    }

    setIsAppsScript(api.isAppsScript());
    const savedUser = localStorage.getItem('erp_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch(e) { localStorage.removeItem('erp_user'); }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchGlobalData();
    }
  }, [user]);

  const fetchGlobalData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsSyncing(true);
    
    try {
      const [sData, fData, aData, mData] = await Promise.all([
        api.getStudents(),
        api.getFees(),
        api.getAttendance(),
        api.getMarks()
      ]);
      setStudents(sData || []);
      setFees(fData || []);
      setAttendance(aData || []);
      setMarks(mData || []);
    } catch (error: any) {
      console.error("Failed to load global data:", error);
      if (!silent) alert("Cloud Sync Failed: " + error.message);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleLogin = (u: User) => {
    localStorage.setItem('erp_user', JSON.stringify(u));
    setUser(u);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-slate-900 mb-6"></div>
        <p className="text-slate-500 font-medium tracking-wide">Syncing with Subash Cloud...</p>
      </div>
    );

    switch (activeTab) {
      case 'dashboard': return <Dashboard students={students} fees={fees} attendance={attendance} />;
      case 'students': return <StudentManagement students={students} setStudents={setStudents} />;
      case 'fees': return <FeeManagement fees={fees} setFees={setFees} students={students} user={user} />;
      case 'attendance': return <AttendanceSystem attendance={attendance} setAttendance={setAttendance} students={students} />;
      case 'exams': return <ResultManagement marks={marks} setMarks={setMarks} students={students} />;
      case 'reports': return <Reports students={students} fees={fees} />;
      case 'settings': return <Settings user={user} />;
      default: return <Dashboard students={students} fees={fees} attendance={attendance} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="no-print w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col border-r border-slate-800">
        <div className="p-6 flex items-center space-x-3 bg-slate-950">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
            <i className="fas fa-graduation-cap text-xl"></i>
          </div>
          <div>
            <h1 className="font-black text-lg leading-tight tracking-tight text-white uppercase italic">Subash ERP</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">Connected Mode</p>
          </div>
        </div>

        <div className="px-4 mt-6 mb-2">
           <button 
             onClick={() => fetchGlobalData(true)}
             disabled={isSyncing}
             className={`w-full ${isSyncing ? 'bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'} text-slate-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center space-x-2 border border-slate-700 shadow-inner`}
           >
             <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i>
             <span>{isSyncing ? 'Syncing...' : 'Fetch Live Data'}</span>
           </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
          <NavItem icon="fa-chart-pie" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon="fa-user-graduate" label="Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
          <NavItem icon="fa-file-invoice-dollar" label="Fees & Billing" active={activeTab === 'fees'} onClick={() => setActiveTab('fees')} />
          <NavItem icon="fa-calendar-check" label="Attendance" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
          <NavItem icon="fa-file-alt" label="Exams & Result" active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} />
          <NavItem icon="fa-chart-bar" label="Reports & Dues" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <NavItem icon="fa-cog" label="Cloud Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </nav>

        <div className="p-4 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-4 p-2 bg-slate-900 rounded-xl border border-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden text-white">
              <p className="text-sm font-bold truncate">{user.username}</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-all rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border border-red-600/20">
            <i className="fas fa-sign-out-alt"></i>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 relative">
        <header className="no-print sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 z-20 flex justify-between items-center shadow-sm">
          <div className="flex items-center space-x-4">
             <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">{activeTab.replace('-', ' ')}</h2>
             <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
             <div className="flex items-center space-x-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
               <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
               <span>Cloud Connected</span>
             </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="bg-slate-100 px-4 py-2 rounded-xl flex items-center space-x-3 border border-slate-200/50">
              <i className="far fa-calendar-alt text-blue-600 text-sm"></i>
              <span className="text-sm font-black text-slate-700 tracking-tight">{getTodayBS()} BS</span>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}>
    <i className={`fas ${icon} w-5 text-center text-sm`}></i>
    <span>{label}</span>
  </button>
);

export default App;
