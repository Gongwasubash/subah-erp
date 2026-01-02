
/**
 * Subash ERP - Unified Backend
 * VERSION: 3.6.0 (Batch Fee Support)
 * 
 * This script acts as the database engine for the Hamro ERP.
 */
const SS = SpreadsheetApp.getActiveSpreadsheet();
const VERSION = "3.6.0";

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action) {
      const action = e.parameter.action;
      const dataString = e.parameter.data;
      let data = [];
      
      if (dataString) {
        try {
          data = JSON.parse(dataString);
        } catch (err) {
          console.error("JSON Parse Error: " + dataString);
        }
      }
      
      let resultBody;

      switch(action) {
        case "testConnection": 
          resultBody = { 
            status: "success", 
            data: { 
              sheet: SS.getName(), 
              user: Session.getActiveUser().getEmail(),
              version: VERSION
            } 
          }; 
          break;
        case "getStudents": resultBody = { status: "success", data: getStudents() }; break;
        case "saveStudent": resultBody = { status: "success", data: saveStudent(data[0]) }; break;
        case "getFeeRecords": resultBody = { status: "success", data: getFeeRecords() }; break;
        case "saveFeeRecord": resultBody = { status: "success", data: saveFeeRecord(data[0]) }; break;
        case "saveFeeRecords": resultBody = { status: "success", data: saveFeeRecords(data[0]) }; break;
        case "getFeeCategories": resultBody = { status: "success", data: getFeeCategories() }; break;
        case "saveFeeCategory": resultBody = { status: "success", data: saveFeeCategory(data[0]) }; break;
        case "getFeeStructures": resultBody = { status: "success", data: getFeeStructures() }; break;
        case "saveFeeStructure": resultBody = { status: "success", data: saveFeeStructure(data[0]) }; break;
        case "getAttendanceRecords": resultBody = { status: "success", data: getAttendanceRecords() }; break;
        case "saveAttendance": resultBody = { status: "success", data: saveAttendance(data[0]) }; break;
        case "getMarksRecords": resultBody = { status: "success", data: getMarksRecords() }; break;
        case "saveMark": resultBody = { status: "success", data: saveMark(data[0]) }; break;
        case "initializeDatabase": resultBody = { status: "success", data: initializeDatabase() }; break;
        case "authenticateUser": resultBody = { status: "success", data: authenticateUser(data[0], data[1]) }; break;
        default: resultBody = { status: "error", message: "Action not recognized: " + action + ". Please ensure you have deployed VERSION " + VERSION + " as a NEW VERSION." };
      }
      
      return ContentService.createTextOutput(JSON.stringify(resultBody))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Subash ERP API v" + VERSION + " is live." })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeDatabase() {
  const sheets = [
    { name: 'Users', cols: ['Username', 'Password', 'Role', 'Status'] },
    { name: 'Students', cols: ['Student_ID', 'Roll_No', 'Student_Name', 'Father_Name', 'Mother_Name', 'Class', 'Section', 'Gender', 'Date_of_Birth', 'Address', 'Phone', 'Admission_Date', 'Status'] },
    { name: 'Fee_Record', cols: ['Receipt_No', 'Student_ID', 'Student_Name', 'Class', 'Month', 'Fee_Type', 'Amount', 'Discount', 'Total', 'Paid_Date', 'Payment_Mode', 'Collected_By', 'Status'] },
    { name: 'Fee_Structure', cols: ['Class', 'Fee_Type', 'Amount'] },
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
      ['Monthly Tuition Fee', 'Regular monthly study fee'],
      ['Admission Fee', 'One-time admission charge'],
      ['Annual Fee', 'Yearly administrative fee']
    ];
    defaults.forEach(d => catSheet.appendRow(d));
  }

  const userSheet = SS.getSheetByName('Users');
  if (userSheet.getLastRow() === 1) userSheet.appendRow(['admin', 'admin123', 'Admin', 'Active']);
  return "Database Initialized Successfully with " + VERSION + " logic!";
}

function getFeeStructures() {
  const s = SS.getSheetByName('Fee_Structure');
  if (!s) return [];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ class: r[0], feeType: r[1], amount: r[2] }));
}

function saveFeeStructure(f) {
  const s = SS.getSheetByName('Fee_Structure');
  if (!s) return false;
  const data = s.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === f.class && data[i][1] === f.feeType) {
      foundRow = i + 1;
      break;
    }
  }
  if (foundRow > -1) {
    s.getRange(foundRow, 3).setValue(f.amount);
  } else {
    s.appendRow([f.class, f.feeType, f.amount]);
  }
  return true;
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
  if (!s) {
    s = SS.insertSheet('Fee_Categories');
    s.appendRow(['Category_Name', 'Description']);
  }
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

function saveStudent(s) { 
  SS.getSheetByName('Students').appendRow([s.studentId, s.rollNo, s.name, s.fatherName, s.motherName, s.class, s.section, s.gender, s.dobBS, s.address, s.phone, s.admissionDateBS, s.status]); 
  return true; 
}

function getFeeRecords() {
  const s = SS.getSheetByName('Fee_Record');
  if (!s) return [];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ receiptNo: r[0], studentId: r[1], studentName: r[2], class: r[3], month: r[4], feeType: r[5], amount: r[6], discount: r[7], total: r[8], paidDateBS: r[9], paymentMode: r[10], collectedBy: r[11], status: r[12] }));
}

function saveFeeRecord(f) { 
  SS.getSheetByName('Fee_Record').appendRow([f.receiptNo, f.studentId, f.studentName, f.class, f.month, f.feeType, f.amount, f.discount, f.total, f.paidDateBS, f.paymentMode, f.collectedBy, f.status]); 
  return true; 
}

function saveFeeRecords(fees) {
  const s = SS.getSheetByName('Fee_Record');
  if (!s) return false;
  fees.forEach(f => {
    s.appendRow([f.receiptNo, f.studentId, f.studentName, f.class, f.month, f.feeType, f.amount, f.discount, f.total, f.paidDateBS, f.paymentMode, f.collectedBy, f.status]);
  });
  return true;
}

function getAttendanceRecords() {
  const s = SS.getSheetByName('Attendance');
  if (!s) return [];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ dateBS: r[0], class: r[1], studentId: r[2], status: r[3] }));
}

function saveAttendance(rs) { 
  const s = SS.getSheetByName('Attendance'); 
  rs.forEach(r => s.appendRow([r.dateBS, r.class, r.studentId, r.status])); 
  return true; 
}

function getMarksRecords() {
  const s = SS.getSheetByName('Marks');
  if (!s) return [];
  const data = s.getDataRange().getValues();
  data.shift();
  return data.map(r => ({ studentId: r[0], class: r[1], examName: r[2], subject: r[3], marksObtained: r[4] }));
}

function saveMark(m) { 
  SS.getSheetByName('Marks').appendRow([m.studentId, m.class, m.examName, m.subject, m.marksObtained]); 
  return true; 
}
