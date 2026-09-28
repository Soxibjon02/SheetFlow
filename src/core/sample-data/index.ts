import { normalizeRawGrid } from '../datasource';
import { SheetData } from '../types/sheet';

// 1. Education: Student Exam Performance
export const STUDENTS_SAMPLE_GRID: any[][] = [
  ['Student Name', 'Age', 'City', 'Subject', 'Score', 'Attendance', 'Passed', 'Exam Date'],
  ['Ali Vohidov', 19, 'Samarkand', 'Mathematics', 88, '94%', 'Yes', '2026-09-15'],
  ['Zarina Karimova', 18, 'Tashkent', 'Physics', 94, '98%', 'Yes', '2026-09-16'],
  ['Jasur Beknazarov', 20, 'Bukhara', 'Mathematics', 72, '86%', 'Yes', '2026-09-15'],
  ['Malika Usmanova', 19, 'Samarkand', 'Computer Science', 96, '100%', 'Yes', '2026-09-18'],
  ['Bobur Mirzoev', 21, 'Fergana', 'Physics', 58, '75%', 'No', '2026-09-16'],
  ['Dilnoza Rahimova', 18, 'Tashkent', 'Mathematics', 84, '91%', 'Yes', '2026-09-15'],
  ['Otabek Shodiev', 20, 'Samarkand', 'Computer Science', 79, '88%', 'Yes', '2026-09-18'],
  ['Shahzoda Alieva', 19, 'Andijan', 'Physics', 91, '95%', 'Yes', '2026-09-16'],
  ['Farhod Yusupov', 22, 'Bukhara', 'Mathematics', 64, '80%', 'No', '2026-09-15'],
  ['Gulnoza Tursunova', 18, 'Tashkent', 'Computer Science', 89, '92%', 'Yes', '2026-09-18'],
  ['Sardor Azimov', 20, 'Samarkand', 'Physics', 82, '89%', 'Yes', '2026-09-16'],
  ['Kamila Ergasheva', 19, 'Namangan', 'Mathematics', 76, '84%', 'Yes', '2026-09-15'],
  ['Rustam Normatov', 21, 'Tashkent', 'Computer Science', 95, '97%', 'Yes', '2026-09-18'],
  ['Madina Saidova', 18, 'Bukhara', 'Physics', 68, '78%', 'Yes', '2026-09-16'],
  ['Eldor Kalandarov', 20, 'Samarkand', 'Mathematics', 90, '94%', 'Yes', '2026-09-15'],
];

// 2. Business: SaaS Revenue & Customers
export const SAAS_REVENUE_SAMPLE_GRID: any[][] = [
  ['Customer Name', 'Plan', 'Country', 'MRR', 'Active Users', 'Churn Risk', 'Signup Date'],
  ['Apex Logistics', 'Enterprise', 'Uzbekistan', '$2400', 145, 'No', '2026-01-12'],
  ['Nexus Health', 'Pro', 'United States', '$850', 42, 'No', '2026-02-05'],
  ['SilkRoad Retail', 'Enterprise', 'Uzbekistan', '$3100', 210, 'No', '2026-01-28'],
  ['FinTech Labs', 'Business', 'United Kingdom', '$1450', 88, 'Yes', '2026-03-14'],
  ['Samarkand Cloud', 'Enterprise', 'Uzbekistan', '$2800', 160, 'No', '2026-02-18'],
  ['EuroTech Agency', 'Pro', 'Germany', '$750', 35, 'No', '2026-04-02'],
  ['Nordic Stream', 'Business', 'Sweden', '$1200', 65, 'No', '2026-03-22'],
  ['Tashkent Payments', 'Enterprise', 'Uzbekistan', '$4200', 310, 'No', '2026-01-08'],
  ['Global Freight Co', 'Enterprise', 'United States', '$3600', 240, 'Yes', '2026-02-19'],
  ['Alpha Analytics', 'Pro', 'United Kingdom', '$800', 28, 'No', '2026-05-11'],
  ['Orient Motors CRM', 'Business', 'Uzbekistan', '$1600', 92, 'No', '2026-03-30'],
  ['Bright Future Ed', 'Pro', 'Kazakhstan', '$650', 30, 'No', '2026-04-18'],
];

// 3. Finance: Operational Expenses Tracker
export const EXPENSES_SAMPLE_GRID: any[][] = [
  ['Expense Title', 'Department', 'Category', 'Amount', 'Vendor', 'Status', 'Date'],
  ['AWS Cloud Hosting', 'Engineering', 'Infrastructure', '$4850', 'Amazon Web Services', 'Approved', '2026-09-01'],
  ['Google Workspace License', 'IT Operations', 'Software', '$1240', 'Google LLC', 'Approved', '2026-09-03'],
  ['Quarterly Marketing Ads', 'Marketing', 'Advertising', '$6500', 'Meta Platforms', 'Approved', '2026-09-05'],
  ['Office Fiber Internet', 'Operations', 'Utilities', '$450', 'Beeline Telecom', 'Approved', '2026-09-02'],
  ['Figma Enterprise Design', 'Product', 'Software', '$840', 'Figma Inc', 'Approved', '2026-09-08'],
  ['Sales Team Travel Samarkand', 'Sales', 'Travel', '$1850', 'Uzbekistan Airways', 'Pending', '2026-09-12'],
  ['Data Security Audit', 'Security', 'Consulting', '$3500', 'KPMG Advisory', 'Approved', '2026-09-15'],
  ['HubSpot CRM Subscription', 'Sales', 'Software', '$2100', 'HubSpot Inc', 'Approved', '2026-09-10'],
  ['Employee Wellness Snacks', 'HR', 'Office Perks', '$620', 'Korzinka Supermarkets', 'Approved', '2026-09-14'],
  ['GitHub Enterprise Cloud', 'Engineering', 'DevTools', '$960', 'GitHub Inc', 'Approved', '2026-09-04'],
];

export function getInitialSampleSheets(): SheetData[] {
  return [
    normalizeRawGrid(
      'Student Exam & Performance 2026',
      STUDENTS_SAMPLE_GRID,
      'sheet_sample_students',
      'Term 3 Grades',
      'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
    ),
    normalizeRawGrid(
      'SaaS Global Revenue & MRR',
      SAAS_REVENUE_SAMPLE_GRID,
      'sheet_sample_saas',
      'Subscriptions Q3',
      'https://docs.google.com/spreadsheets/d/1XyZ9874aBCdEFGhijkLMnoPQRstuvWXyz1234567890'
    ),
    normalizeRawGrid(
      'Monthly Operational Expenses',
      EXPENSES_SAMPLE_GRID,
      'sheet_sample_expenses',
      'September 2026',
      'https://docs.google.com/spreadsheets/d/1E_Expenses_Sheet_Sample_Demo_Key_9876543210'
    ),
  ];
}
