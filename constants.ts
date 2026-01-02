
export const NEPALI_MONTHS = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const CLASSES = [
  'Nursery', 'LKG', 'UKG', 
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 
  'Class 11', 'Class 12'
];

export const SECTIONS = ['A', 'B', 'C', 'D'];

export const MONTHLY_FEE_TYPES = [
  'Monthly Tuition Fee',
  'Bus/Transportation Fee',
  'Hostel/Boarding Fee',
  'Computer & IT Fee',
  'Late Payment Fine'
];

export const ONE_TIME_FEE_TYPES = [
  'Admission Fee',
  'Annual Fee',
  'Terminal Exam Fee',
  'Library Fee',
  'Laboratory Fee',
  'Sports & EC Fee',
  'ID Card & Belt/Tie Fee',
  'Diary & Calendar Fee',
  'Building Fund',
  'Maintenance Fee',
  'Uniform Fee',
  'Field Trip Fee',
  'Stationery & Books Fee',
  'Insurance/Health Fee',
  'Miscellaneous Fee'
];

export const DEFAULT_FEE_CATEGORIES = [...MONTHLY_FEE_TYPES, ...ONE_TIME_FEE_TYPES];

export const calculateGrade = (marks: number, fullMarks: number): { grade: string; gpa: number; point: number } => {
  const percentage = (marks / fullMarks) * 100;
  if (percentage >= 90) return { grade: 'A+', gpa: 4.0, point: 4.0 };
  if (percentage >= 80) return { grade: 'A', gpa: 3.6, point: 3.6 };
  if (percentage >= 70) return { grade: 'B+', gpa: 3.2, point: 3.2 };
  if (percentage >= 60) return { grade: 'B', gpa: 2.8, point: 2.8 };
  if (percentage >= 50) return { grade: 'C+', gpa: 2.4, point: 2.4 };
  if (percentage >= 40) return { grade: 'C', gpa: 2.0, point: 2.0 };
  return { grade: 'D', gpa: 1.6, point: 1.6 };
};

export const getTodayBS = () => {
  const d = new Date();
  return `2081-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
