
import { User, Student, FeeRecord, AttendanceRecord, MarkEntry, FeeStructure } from './types';

// The specific URL provided by the user for auto-connection
const DEFAULT_REMOTE_URL = 'https://script.google.com/macros/s/AKfycbwoNvw_angFpObnS_pxGzLKVy_dlop_hqRhz-WZ-o6hivlfeMH_qZ5mzk9Fl2eUNhW5qQ/exec';

const getExternalUrl = () => {
  const savedUrl = localStorage.getItem('erp_remote_url');
  const url = savedUrl || DEFAULT_REMOTE_URL;
  return url.trim().replace(/\/+$/, '');
};

const runServerFunction = async <T>(funcName: string, ...args: any[]): Promise<T> => {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res: T) => resolve(res))
        .withFailureHandler((err: any) => reject(new Error(err?.message || 'Script Error')))[funcName](...args);
    });
  }

  const remoteUrl = getExternalUrl();
  if (remoteUrl && remoteUrl.includes('script.google.com')) {
    try {
      const baseUrl = remoteUrl.endsWith('/exec') ? remoteUrl : remoteUrl + '/exec';
      const url = new URL(baseUrl);
      url.searchParams.set('action', funcName);
      if (args && args.length > 0) url.searchParams.set('data', JSON.stringify(args));
      url.searchParams.set('_t', Date.now().toString());
      
      const response = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`Cloud Error: HTTP ${response.status}`);
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Server returned an empty response. Please check your Apps Script deployment.');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Malformed JSON response:", text);
        throw new Error('Server returned malformed JSON. Ensure you are not being redirected to a login page.');
      }

      if (result.status === 'error') throw new Error(result.message || 'Server-side processing error');
      return result.data as T;
    } catch (err: any) {
      console.error(`❌ Cloud API Error [${funcName}]:`, err.message);
      throw err;
    }
  }
  return [] as any;
};

export const api = {
  login: (u: string, p: string) => runServerFunction<User | null>('authenticateUser', u, p),
  getStudents: () => runServerFunction<Student[]>('getStudents'),
  saveStudent: (s: Student) => runServerFunction<boolean>('saveStudent', s),
  getFees: () => runServerFunction<FeeRecord[]>('getFeeRecords'),
  saveFee: (f: FeeRecord) => runServerFunction<boolean>('saveFeeRecord', f),
  saveFeeRecords: (fees: FeeRecord[]) => runServerFunction<boolean>('saveFeeRecords', fees),
  getFeeCategories: () => runServerFunction<string[]>('getFeeCategories'),
  saveFeeCategory: (name: string) => runServerFunction<boolean>('saveFeeCategory', name),
  getFeeStructures: () => runServerFunction<FeeStructure[]>('getFeeStructures'),
  saveFeeStructure: (f: FeeStructure) => runServerFunction<boolean>('saveFeeStructure', f),
  getAttendance: () => runServerFunction<AttendanceRecord[]>('getAttendanceRecords'),
  saveAttendance: (records: AttendanceRecord[]) => runServerFunction<boolean>('saveAttendance', records),
  getMarks: () => runServerFunction<MarkEntry[]>('getMarksRecords'),
  saveMark: (m: MarkEntry) => runServerFunction<boolean>('saveMark', m),
  initDb: () => runServerFunction<string>('initializeDatabase'),
  testConnection: () => runServerFunction<any>('testConnection'),
  isAppsScript: () => typeof google !== 'undefined' && !!google.script,
  getDefaultUrl: () => DEFAULT_REMOTE_URL
};

declare var google: any;
