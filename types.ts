
export type Role = 'Admin' | 'Accountant' | 'Teacher' | 'Office Staff';

export interface User {
  username: string;
  role: Role;
  status: 'Active' | 'Inactive';
}

export interface Student {
  studentId: string;
  rollNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  class: string;
  section: string;
  gender: string;
  dobBS: string;
  address: string;
  phone: string;
  admissionDateBS: string;
  status: 'Active' | 'Left';
}

export interface FeeStructure {
  class: string;
  feeType: string;
  amount: number;
}

export interface FeeRecord {
  receiptNo: string;
  studentId: string;
  studentName: string;
  class: string;
  month: string;
  feeType: string;
  amount: number;
  discount: number;
  total: number;
  paidDateBS: string;
  paymentMode: string;
  collectedBy: string;
  status: 'Paid' | 'Due';
}

export interface Subject {
  class: string;
  code: string;
  name: string;
  fullMarks: number;
  passMarks: number;
}

export interface MarkEntry {
  studentId: string;
  class: string;
  examName: string;
  subject: string;
  marksObtained: number;
}

export interface AttendanceRecord {
  dateBS: string;
  class: string;
  studentId: string;
  status: 'Present' | 'Absent';
}
