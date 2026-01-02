
import React, { useState, useEffect } from 'react';
import { Student, FeeRecord, AttendanceRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDashboardSummary } from '../geminiService';

interface DashboardProps {
  students: Student[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, fees, attendance }) => {
  const [aiSummary, setAiSummary] = useState("Analyzing financial and academic data...");
  
  const stats = {
    totalStudents: students.length,
    totalFees: fees.reduce((acc, curr) => acc + (curr.status === 'Paid' ? curr.total : 0), 0),
    totalDues: fees.reduce((acc, curr) => acc + (curr.status === 'Due' ? curr.total : 0), 0),
    attendanceRate: students.length > 0 ? 85 : 0 // Mocked rate
  };

  useEffect(() => {
    const fetchSummary = async () => {
      const summary = await getDashboardSummary(stats);
      setAiSummary(summary || "No data available.");
    };
    fetchSummary();
  }, [students, fees]);

  const chartData = [
    { name: 'Paid', value: stats.totalFees, color: '#10b981' },
    { name: 'Due', value: stats.totalDues, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* AI Assistant Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl flex items-start space-x-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <i className="fas fa-robot text-2xl"></i>
        </div>
        <div>
          <h3 className="font-bold text-lg">ERP Smart Assistant</h3>
          <p className="text-blue-100 text-sm mt-1 max-w-3xl leading-relaxed">
            {aiSummary}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="fa-users" label="Total Students" value={stats.totalStudents.toString()} color="bg-blue-500" />
        <StatCard icon="fa-money-bill-wave" label="Fees Collected (NPR)" value={stats.totalFees.toLocaleString()} color="bg-emerald-500" />
        <StatCard icon="fa-exclamation-triangle" label="Current Dues (NPR)" value={stats.totalDues.toLocaleString()} color="bg-amber-500" />
        <StatCard icon="fa-clipboard-check" label="Attendance %" value={`${stats.attendanceRate}%`} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-slate-800 mb-6">Fee Collection Overview</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-slate-800 mb-6">Recent Fee Payments</h4>
          <div className="space-y-4">
            {fees.slice(0, 5).reverse().map((fee, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <i className="fas fa-check"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{fee.studentName}</p>
                    <p className="text-xs text-slate-500">{fee.month} Fee</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">NPR {fee.total}</p>
                  <p className="text-[10px] text-slate-400">{fee.paidDateBS}</p>
                </div>
              </div>
            ))}
            {fees.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No recent transactions</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
    <div className={`w-12 h-12 ${color} rounded-xl text-white flex items-center justify-center mb-4`}>
      <i className={`fas ${icon} text-lg`}></i>
    </div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

export default Dashboard;
