import React, { useState, useEffect, useMemo } from 'react';
import { Student, FeeRecord, AttendanceRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, ScatterChart, Scatter, Treemap } from 'recharts';
import { getDashboardSummary } from '../geminiService';
import { api } from '../api';

interface DashboardProps {
  students: Student[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, fees, attendance }) => {
  const [aiSummary, setAiSummary] = useState("Analyzing financial and academic data...");
  const [activeChart, setActiveChart] = useState('overview');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [monthlyCategories, setMonthlyCategories] = useState<string[]>([]);
  const [oneTimeCategories, setOneTimeCategories] = useState<string[]>([]);
  const [selectedMonthlyCategories, setSelectedMonthlyCategories] = useState<string[]>([]);
  const [selectedOneTimeCategories, setSelectedOneTimeCategories] = useState<string[]>([]);
  const [selectedMonthsPerCategory, setSelectedMonthsPerCategory] = useState<{[key: string]: string[]}>({});
  
  const getFeeAmount = (studentClass: string, feeType: string) => {
    const feeStructure: {[key: string]: {[key: string]: number}} = {
      'Nursery': { 
        'Monthly Fee': 2000, 'Computer & IT Fee': 500, 'Bus/Transportation Fee': 800, 'Hostel/Boarding Fee': 1500, 'Late Payment Fine': 100,
        'Admission Fee': 5000, 'Annual Fee': 3000, 'Terminal Exam Fee': 1000, 'Library Fee': 200, 'Laboratory Fee': 300,
        'Sports & EC Fee': 500, 'ID Card & Belt/Tie Fee': 200, 'Diary & Calendar Fee': 150, 'Building Fund': 2000,
        'Maintenance Fee': 500, 'Uniform Fee': 1200, 'Field Trip Fee': 800, 'Stationery & Books Fee': 1500,
        'Insurance/Health Fee': 300, 'Miscellaneous Fee': 200
      },
      'LKG': { 
        'Monthly Fee': 2200, 'Computer & IT Fee': 500, 'Bus/Transportation Fee': 800, 'Hostel/Boarding Fee': 1500, 'Late Payment Fine': 100,
        'Admission Fee': 5000, 'Annual Fee': 3000, 'Terminal Exam Fee': 1000, 'Library Fee': 200, 'Laboratory Fee': 300,
        'Sports & EC Fee': 500, 'ID Card & Belt/Tie Fee': 200, 'Diary & Calendar Fee': 150, 'Building Fund': 2000,
        'Maintenance Fee': 500, 'Uniform Fee': 1200, 'Field Trip Fee': 800, 'Stationery & Books Fee': 1500,
        'Insurance/Health Fee': 300, 'Miscellaneous Fee': 200
      },
      'UKG': { 
        'Monthly Fee': 2400, 'Computer & IT Fee': 500, 'Bus/Transportation Fee': 800, 'Hostel/Boarding Fee': 1500, 'Late Payment Fine': 100,
        'Admission Fee': 5000, 'Annual Fee': 3000, 'Terminal Exam Fee': 1000, 'Library Fee': 200, 'Laboratory Fee': 300,
        'Sports & EC Fee': 500, 'ID Card & Belt/Tie Fee': 200, 'Diary & Calendar Fee': 150, 'Building Fund': 2000,
        'Maintenance Fee': 500, 'Uniform Fee': 1200, 'Field Trip Fee': 800, 'Stationery & Books Fee': 1500,
        'Insurance/Health Fee': 300, 'Miscellaneous Fee': 200
      },
      'Class 1': { 
        'Monthly Fee': 2600, 'Computer & IT Fee': 600, 'Bus/Transportation Fee': 900, 'Hostel/Boarding Fee': 1600, 'Late Payment Fine': 100,
        'Admission Fee': 6000, 'Annual Fee': 3500, 'Terminal Exam Fee': 1200, 'Library Fee': 250, 'Laboratory Fee': 400,
        'Sports & EC Fee': 600, 'ID Card & Belt/Tie Fee': 200, 'Diary & Calendar Fee': 150, 'Building Fund': 2500,
        'Maintenance Fee': 600, 'Uniform Fee': 1300, 'Field Trip Fee': 900, 'Stationery & Books Fee': 1800,
        'Insurance/Health Fee': 350, 'Miscellaneous Fee': 250
      },
      'Class 2': { 
        'Monthly Fee': 2800, 'Computer & IT Fee': 600, 'Bus/Transportation Fee': 900, 'Hostel/Boarding Fee': 1600, 'Late Payment Fine': 100,
        'Admission Fee': 6000, 'Annual Fee': 3500, 'Terminal Exam Fee': 1200, 'Library Fee': 250, 'Laboratory Fee': 400,
        'Sports & EC Fee': 600, 'ID Card & Belt/Tie Fee': 200, 'Diary & Calendar Fee': 150, 'Building Fund': 2500,
        'Maintenance Fee': 600, 'Uniform Fee': 1300, 'Field Trip Fee': 900, 'Stationery & Books Fee': 1800,
        'Insurance/Health Fee': 350, 'Miscellaneous Fee': 250
      },
      'Class 3': { 
        'Monthly Fee': 3000, 'Computer & IT Fee': 600, 'Bus/Transportation Fee': 900, 'Hostel/Boarding Fee': 1600, 'Late Payment Fine': 100,
        'Admission Fee': 6000, 'Annual Fee': 3500, 'Terminal Exam Fee': 1200, 'Library Fee': 250, 'Laboratory Fee': 400,
        'Sports & EC Fee': 600, 'ID Card & Belt/Tie Fee': 200, 'Diary & Calendar Fee': 150, 'Building Fund': 2500,
        'Maintenance Fee': 600, 'Uniform Fee': 1300, 'Field Trip Fee': 900, 'Stationery & Books Fee': 1800,
        'Insurance/Health Fee': 350, 'Miscellaneous Fee': 250
      },
      'Class 4': { 
        'Monthly Fee': 3200, 'Computer & IT Fee': 700, 'Bus/Transportation Fee': 1000, 'Hostel/Boarding Fee': 1700, 'Late Payment Fine': 100,
        'Admission Fee': 7000, 'Annual Fee': 4000, 'Terminal Exam Fee': 1500, 'Library Fee': 300, 'Laboratory Fee': 500,
        'Sports & EC Fee': 700, 'ID Card & Belt/Tie Fee': 200, 'Diary & Calendar Fee': 150, 'Building Fund': 3000,
        'Maintenance Fee': 700, 'Uniform Fee': 1400, 'Field Trip Fee': 1000, 'Stationery & Books Fee': 2000,
        'Insurance/Health Fee': 400, 'Miscellaneous Fee': 300
      },
      'Class 5': { 
        'Monthly Fee': 3400, 'Computer & IT Fee': 700, 'Bus/Transportation Fee': 1000, 'Hostel/Boarding Fee': 1700, 'Late Payment Fine': 100,
        'Admission Fee': 7000, 'Annual Fee': 4000, 'Terminal Exam Fee': 1500, 'Library Fee': 300, 'Laboratory Fee': 500,
        'Sports & EC Fee': 700, 'ID Card & Belt/Tie Fee': 200, 'Diary & Calendar Fee': 150, 'Building Fund': 3000,
        'Maintenance Fee': 700, 'Uniform Fee': 1400, 'Field Trip Fee': 1000, 'Stationery & Books Fee': 2000,
        'Insurance/Health Fee': 400, 'Miscellaneous Fee': 300
      }
    };
    return feeStructure[studentClass]?.[feeType] || 0;
  };

  // Fee Collection Overview using selected categories and months
  const getCollectionOverview = () => {
    let totalCollected = 0;
    let totalOutstanding = 0;
    
    students.forEach(student => {
      // Calculate monthly collections and dues for selected categories and months
      selectedMonthlyCategories.forEach(feeType => {
        const selectedMonths = selectedMonthsPerCategory[feeType] || [];
        selectedMonths.forEach(month => {
          const paidFee = fees.find(f => 
            f.studentId === student.studentId && 
            f.feeType === feeType && 
            f.month === month && 
            f.status === 'Paid'
          );
          const feeAmount = getFeeAmount(student.class, feeType);
          
          if (paidFee) {
            totalCollected += paidFee.total;
          } else if (feeAmount > 0) {
            totalOutstanding += feeAmount;
          }
        });
      });
      
      // Calculate admission collections and dues for selected one-time categories
      selectedOneTimeCategories.forEach(feeType => {
        const paidFee = fees.find(f => 
          f.studentId === student.studentId && 
          f.feeType === feeType && 
          f.status === 'Paid'
        );
        const feeAmount = getFeeAmount(student.class, feeType);
        
        if (paidFee) {
          totalCollected += paidFee.total;
        } else if (feeAmount > 0) {
          totalOutstanding += feeAmount;
        }
      });
    });
    
    console.log('Outstanding Calculation Debug:', {
      selectedMonthlyCategories,
      selectedOneTimeCategories,
      selectedMonthsPerCategory,
      totalOutstanding,
      totalCollected
    });
    
    return { totalCollected, totalOutstanding };
  };
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cloudCats = await api.getFeeCategories();
        if (cloudCats) {
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
          // Only select monthly fee categories (containing "monthly" in the name)
          const monthlyFeeCategories = monthly.filter(cat => 
            cat.toLowerCase().includes('monthly')
          );
          setSelectedMonthlyCategories(monthlyFeeCategories);
          // Only select admission-related categories from one-time
          const admissionCategories = oneTime.filter(cat => 
            cat.toLowerCase().includes('admission')
          );
          setSelectedOneTimeCategories(admissionCategories);
          // Initialize months up to current month for each monthly category
          const allMonths = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
          const currentDate = new Date();
          const currentMonthIndex = currentDate.getMonth() + 4; // Adjust for Nepali calendar (Baisakh starts around April)
          const monthsUpToCurrent = allMonths.slice(0, Math.min(currentMonthIndex, 12));
          const monthsPerCategory: {[key: string]: string[]} = {};
          monthlyFeeCategories.forEach(cat => {
            monthsPerCategory[cat] = monthsUpToCurrent;
          });
          setSelectedMonthsPerCategory(monthsPerCategory);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);
  
  const collectionOverview = useMemo(() => {
    const result = getCollectionOverview();
    return result;
  }, [selectedMonthlyCategories, selectedOneTimeCategories, selectedMonthsPerCategory, students, fees]);
  
  const stats = {
    totalStudents: students.length,
    totalFees: collectionOverview.totalCollected,
    totalDues: collectionOverview.totalOutstanding,
    attendanceRate: students.length > 0 ? 85 : 0
  };

  // Outstanding dues calculation with filters
  const getOutstandingDues = () => {
    const monthlyFeeTypes = ['Monthly Tuition Fee', 'Computer Fee', 'Lab Fee', 'Library Fee'];
    const admissionFeeTypes = ['Admission Fee', 'Registration Fee', 'Development Fee'];
    
    return students.map(student => {
      const studentFees = fees.filter(f => f.studentId === student.studentId);
      const paidFees = studentFees.filter(f => f.status === 'Paid');
      
      // Calculate monthly dues
      const monthlyDues = monthlyFeeTypes.map(feeType => {
        const months = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
        return months.map(month => {
          const isPaid = paidFees.some(f => f.feeType === feeType && f.month === month);
          return {
            feeType,
            month,
            amount: isPaid ? 0 : getFeeAmount(student.class, feeType),
            isPaid
          };
        }).filter(f => f.amount > 0);
      }).flat();
      
      // Calculate admission dues
      const admissionDues = admissionFeeTypes.map(feeType => {
        const isPaid = paidFees.some(f => f.feeType === feeType);
        return {
          feeType,
          month: 'One-time',
          amount: isPaid ? 0 : getFeeAmount(student.class, feeType),
          isPaid
        };
      }).filter(f => f.amount > 0);
      
      const totalDue = [...monthlyDues, ...admissionDues].reduce((sum, f) => sum + f.amount, 0);
      
      return {
        ...student,
        monthlyDues,
        admissionDues,
        totalDue
      };
    }).filter(s => s.totalDue > 0);
  };

  const outstandingDues = getOutstandingDues();
  const classes = ['All', ...Array.from(new Set(students.map(s => s.class)))];
  const months = ['All', 'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
  
  const filteredDues = outstandingDues.filter(student => {
    const classMatch = selectedClass === 'All' || student.class === selectedClass;
    const monthMatch = selectedMonth === 'All' || 
      student.monthlyDues.some(d => d.month === selectedMonth) ||
      (selectedMonth === 'One-time' && student.admissionDues.length > 0);
    return classMatch && monthMatch;
  });

  // Data for different charts using filtered collection overview data
  const pieData = [
    { name: 'Paid Fees', value: collectionOverview.totalCollected, fill: '#10b981' },
    { name: 'Outstanding Dues', value: collectionOverview.totalOutstanding, fill: '#f59e0b' }
  ];

  const classData = students.reduce((acc, student) => {
    const existing = acc.find(item => item.class === student.class);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ class: student.class, count: 1, fees: 0 });
    }
    return acc;
  }, [] as {class: string, count: number, fees: number}[]);

  // Monthly trend using filtered categories and months from backend data
  const monthlyTrend = useMemo(() => {
    const trendData: {month: string, amount: number}[] = [];
    const allMonths = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
    
    allMonths.forEach(month => {
      let monthTotal = 0;
      selectedMonthlyCategories.forEach(feeType => {
        const selectedMonths = selectedMonthsPerCategory[feeType] || [];
        if (selectedMonths.includes(month)) {
          const monthFees = fees.filter(f => 
            f.feeType === feeType && 
            f.month === month && 
            f.status === 'Paid'
          );
          monthTotal += monthFees.reduce((sum, f) => sum + f.total, 0);
        }
      });
      
      // Add one-time category collections for the month
      selectedOneTimeCategories.forEach(feeType => {
        const oneTimeFees = fees.filter(f => 
          f.feeType === feeType && 
          f.status === 'Paid'
        );
        monthTotal += oneTimeFees.reduce((sum, f) => sum + f.total, 0);
      });
      
      trendData.push({ month, amount: monthTotal });
    });
    return trendData.filter(d => d.amount > 0);
  }, [selectedMonthlyCategories, selectedOneTimeCategories, selectedMonthsPerCategory, fees]);

  // Scatter data using filtered categories
  const scatterData = useMemo(() => {
    return students.map(student => {
      let totalPaid = 0;
      let count = 0;
      
      selectedMonthlyCategories.forEach(feeType => {
        const selectedMonths = selectedMonthsPerCategory[feeType] || [];
        selectedMonths.forEach(month => {
          const fee = fees.find(f => f.studentId === student.studentId && f.feeType === feeType && f.month === month && f.status === 'Paid');
          if (fee) {
            totalPaid += fee.total;
            count += 1;
          }
        });
      });
      
      selectedOneTimeCategories.forEach(feeType => {
        const fee = fees.find(f => f.studentId === student.studentId && f.feeType === feeType && f.status === 'Paid');
        if (fee) {
          totalPaid += fee.total;
          count += 1;
        }
      });
      
      return {
        class: student.class,
        totalPaid,
        count
      };
    });
  }, [students, fees, selectedMonthlyCategories, selectedOneTimeCategories, selectedMonthsPerCategory]);

  const treemapData = useMemo(() => {
    return classData.map(item => ({
      name: item.class,
      size: item.count * 100,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  }, [classData, selectedMonthlyCategories, selectedOneTimeCategories]);

  useEffect(() => {
    const fetchSummary = async () => {
      const summary = await getDashboardSummary(stats);
      setAiSummary(summary || "No data available.");
    };
    fetchSummary();
  }, [stats, selectedMonthlyCategories, selectedOneTimeCategories, selectedMonthsPerCategory]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* AI Assistant Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <i className="fas fa-robot text-xl"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">AI Analytics Assistant</h3>
            <p className="text-blue-100 text-sm leading-relaxed opacity-90">
              {aiSummary}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          icon="fa-users" 
          label="Total Students" 
          value={stats.totalStudents.toString()} 
          trend="+12%" 
          trendUp={true}
          color="blue" 
        />
        <KPICard 
          icon="fa-money-bill-wave" 
          label="Revenue (NPR)" 
          value={stats.totalFees.toLocaleString()} 
          trend="+8.5%" 
          trendUp={true}
          color="green" 
        />
        <KPICard 
          icon="fa-exclamation-triangle" 
          label="Outstanding (NPR)" 
          value={stats.totalDues.toLocaleString()} 
          trend="-5.2%" 
          trendUp={false}
          color="amber" 
        />
        <KPICard 
          icon="fa-clipboard-check" 
          label="Attendance Rate" 
          value={`${stats.attendanceRate}%`} 
          trend="+2.1%" 
          trendUp={true}
          color="purple" 
        />
      </div>

      {/* Category Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fas fa-filter text-blue-600 mr-2"></i>
          Fee Category Filters
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Categories */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <i className="fas fa-calendar-alt mr-2 text-blue-500"></i> Monthly Categories
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {monthlyCategories.map(cat => {
                const isSelected = selectedMonthlyCategories.includes(cat);
                const selectedMonths = selectedMonthsPerCategory[cat] || [];
                const allMonths = ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
                return (
                  <div key={cat} className="space-y-2">
                    <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? 'bg-blue-50 border-blue-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isSelected} 
                        onChange={() => {
                          if (isSelected) {
                            setSelectedMonthlyCategories(prev => prev.filter(c => c !== cat));
                          } else {
                            setSelectedMonthlyCategories(prev => [...prev, cat]);
                          }
                        }} 
                      />
                      <i className={`fas ${isSelected ? 'fa-check-circle text-blue-600' : 'fa-circle text-gray-300'} mr-2`}></i>
                      <span className="text-xs font-medium text-gray-700">{cat}</span>
                    </label>
                    {isSelected && (
                      <div className="ml-6 grid grid-cols-4 gap-1">
                        {allMonths.map(month => {
                          const isMonthSelected = selectedMonths.includes(month);
                          return (
                            <button 
                              key={month}
                              onClick={() => {
                                const currentMonths = selectedMonthsPerCategory[cat] || [];
                                if (isMonthSelected) {
                                  setSelectedMonthsPerCategory(prev => ({
                                    ...prev,
                                    [cat]: currentMonths.filter(m => m !== month)
                                  }));
                                } else {
                                  setSelectedMonthsPerCategory(prev => ({
                                    ...prev,
                                    [cat]: [...currentMonths, month]
                                  }));
                                }
                              }}
                              className={`py-1 px-2 rounded text-xs font-bold uppercase border transition-all ${
                                isMonthSelected
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              {month.slice(0,3)}
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
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <i className="fas fa-tag mr-2 text-emerald-500"></i> One-Time Categories
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {oneTimeCategories.map(cat => {
                const isSelected = selectedOneTimeCategories.includes(cat);
                return (
                  <label key={cat} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'bg-emerald-50 border-emerald-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isSelected} 
                      onChange={() => {
                        if (isSelected) {
                          setSelectedOneTimeCategories(prev => prev.filter(c => c !== cat));
                        } else {
                          setSelectedOneTimeCategories(prev => [...prev, cat]);
                        }
                      }} 
                    />
                    <i className={`fas ${isSelected ? 'fa-check-circle text-emerald-600' : 'fa-circle text-gray-300'} mr-2`}></i>
                    <span className="text-xs font-medium text-gray-700">{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chart Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-chart-line text-blue-600 mr-2"></i>
            Analytics
          </h4>
          <div className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: 'fa-chart-bar', desc: 'Fee collection summary' },
              { id: 'pie', label: 'Distribution', icon: 'fa-chart-pie', desc: 'Payment breakdown' },
              { id: 'trend', label: 'Trends', icon: 'fa-chart-line', desc: 'Monthly patterns' },
              { id: 'scatter', label: 'Analysis', icon: 'fa-braille', desc: 'Student insights' },
              { id: 'treemap', label: 'Hierarchy', icon: 'fa-th', desc: 'Class structure' }
            ].map(chart => (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                className={`w-full text-left p-3 rounded-lg transition-all group ${
                  activeChart === chart.id 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm' 
                    : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <i className={`fas ${chart.icon} text-sm`}></i>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{chart.label}</div>
                    <div className="text-xs opacity-70">{chart.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-semibold text-gray-900 text-lg">
                {activeChart === 'overview' && 'Fee Collection Overview'}
                {activeChart === 'pie' && 'Payment Distribution'}
                {activeChart === 'trend' && 'Monthly Trends'}
                {activeChart === 'scatter' && 'Student Analysis'}
                {activeChart === 'treemap' && 'Class Hierarchy'}
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                {activeChart === 'overview' && 'Total collections vs outstanding amounts'}
                {activeChart === 'pie' && 'Breakdown of fee payments and dues'}
                {activeChart === 'trend' && 'Collection patterns over time'}
                {activeChart === 'scatter' && 'Payment behavior analysis'}
                {activeChart === 'treemap' && 'Student distribution by class'}
              </p>
            </div>
          </div>
          
          <div className="h-80 bg-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
              {activeChart === 'overview' && (
                <BarChart data={[
                  { name: 'Paid Fees', value: collectionOverview.totalCollected, fill: '#10b981' },
                  { name: 'Outstanding Dues', value: collectionOverview.totalOutstanding, fill: '#f59e0b' }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                    }} 
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[
                      { name: 'Paid Fees', value: collectionOverview.totalCollected, fill: '#10b981' },
                      { name: 'Outstanding Dues', value: collectionOverview.totalOutstanding, fill: '#f59e0b' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              )}
              
              {activeChart === 'pie' && (
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Paid Fees', value: collectionOverview.totalCollected, fill: '#10b981' },
                      { name: 'Outstanding Dues', value: collectionOverview.totalOutstanding, fill: '#f59e0b' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Paid Fees', value: collectionOverview.totalCollected, fill: '#10b981' },
                      { name: 'Outstanding Dues', value: collectionOverview.totalOutstanding, fill: '#f59e0b' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                </PieChart>
              )}
              
              {activeChart === 'trend' && (
                <LineChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                </LineChart>
              )}
              
              {activeChart === 'scatter' && (
                <ScatterChart data={scatterData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="totalPaid" name="Total Paid" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis dataKey="count" name="Payment Count" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Scatter dataKey="count" fill="#8b5cf6" />
                </ScatterChart>
              )}
              
              {activeChart === 'treemap' && (
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  ratio={4/3}
                  stroke="#fff"
                  strokeWidth={2}
                  content={({root, depth, x, y, width, height, index, payload, colors, rank, name}) => (
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        style={{
                          fill: payload?.fill || '#3b82f6',
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                      />
                      <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="500">
                        {name}
                      </text>
                    </g>
                  )}
                />
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fas fa-clock text-blue-600 mr-2"></i>
          Recent Activity
        </h4>
        <div className="space-y-3">
          {fees.slice(0, 5).reverse().map((fee, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <i className="fas fa-check text-xs"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{fee.studentName}</p>
                  <p className="text-xs text-gray-500">{fee.feeType} - {fee.month}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600">NPR {fee.total.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{fee.paidDateBS}</p>
              </div>
            </div>
          ))}
          {fees.length === 0 && (
            <div className="text-center py-8">
              <i className="fas fa-inbox text-gray-300 text-3xl mb-3"></i>
              <p className="text-sm text-gray-500">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ 
  icon: string; 
  label: string; 
  value: string; 
  trend: string;
  trendUp: boolean;
  color: 'blue' | 'green' | 'amber' | 'purple';
}> = ({ icon, label, value, trend, trendUp, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    amber: 'bg-amber-500',
    purple: 'bg-purple-500'
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg text-white flex items-center justify-center`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className={`flex items-center space-x-1 text-xs font-medium ${
          trendUp ? 'text-green-600' : 'text-red-600'
        }`}>
          <i className={`fas ${trendUp ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
          <span>{trend}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  );
};

export default Dashboard;