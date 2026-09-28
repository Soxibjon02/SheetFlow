import { TemplateDefinition } from '../types/dashboard';
import { STUDENTS_SAMPLE_GRID, SAAS_REVENUE_SAMPLE_GRID, EXPENSES_SAMPLE_GRID } from '../sample-data';

export const TEMPLATES: TemplateDefinition[] = [
  // 1. EDUCATION TEMPLATES
  {
    id: 'template_student_performance',
    name: 'Student Exam & Academic Performance',
    category: 'Education',
    description: 'Track exam scores, pass rates, student attendance, and city-level academic achievement.',
    iconName: 'GraduationCap',
    expectedColumns: [
      { name: 'Student Name', type: 'text', description: 'Full name of student' },
      { name: 'Age', type: 'number', description: 'Student age' },
      { name: 'City', type: 'category', description: 'Region or city' },
      { name: 'Subject', type: 'category', description: 'Academic subject' },
      { name: 'Score', type: 'number', description: 'Exam score out of 100' },
      { name: 'Attendance', type: 'percentage', description: 'Class attendance percentage' },
      { name: 'Passed', type: 'boolean', description: 'Exam pass status (Yes/No)' },
    ],
    sampleDataRows: STUDENTS_SAMPLE_GRID.slice(1).map((r) => ({
      'Student Name': r[0],
      Age: r[1],
      City: r[2],
      Subject: r[3],
      Score: r[4],
      Attendance: r[5],
      Passed: r[6],
      'Exam Date': r[7],
    })),
    suggestedWidgets: [
      {
        id: 't_w1',
        title: 'Total Students',
        type: 'kpi',
        calculation: { function: 'COUNT', column: 'Student Name' },
        customOptions: { color: '#10b981' },
      },
      {
        id: 't_w2',
        title: 'Average Score',
        type: 'kpi',
        calculation: { function: 'AVERAGE', column: 'Score' },
        customOptions: { color: '#6366f1' },
      },
      {
        id: 't_w3',
        title: 'Pass Rate',
        type: 'kpi',
        calculation: { function: 'PERCENTAGE', column: 'Passed', parameters: { targetValue: 'Yes' } },
        customOptions: { color: '#f59e0b' },
      },
      {
        id: 't_w4',
        title: 'Score by City',
        type: 'bar',
        calculation: { function: 'AVERAGE', column: 'Score', groupBy: 'City' },
      },
      {
        id: 't_w5',
        title: 'Subject Distribution',
        type: 'donut',
        calculation: { function: 'COUNT', groupBy: 'Subject' },
      },
    ],
  },
  {
    id: 'template_attendance_tracker',
    name: 'Class Attendance & Discipline',
    category: 'Education',
    description: 'Monitor daily student presence, absent trends, and attendance alerts.',
    iconName: 'UserCheck',
    expectedColumns: [
      { name: 'Student Name', type: 'text', description: 'Student identifier' },
      { name: 'Attendance Rate', type: 'percentage', description: 'Percentage of classes attended' },
      { name: 'Status', type: 'category', description: 'Excellent / At Risk / Critical' },
    ],
    suggestedWidgets: [
      {
        id: 'att_1',
        title: 'Average Attendance',
        type: 'kpi',
        calculation: { function: 'AVERAGE', column: 'Attendance Rate' },
      },
    ],
  },

  // 2. BUSINESS TEMPLATES
  {
    id: 'template_saas_revenue',
    name: 'SaaS MRR & Customer Subscriptions',
    category: 'Business',
    description: 'Monitor Monthly Recurring Revenue (MRR), subscription tier breakdown, and customer churn risks.',
    iconName: 'TrendingUp',
    expectedColumns: [
      { name: 'Customer Name', type: 'text', description: 'Company or customer name' },
      { name: 'Plan', type: 'category', description: 'Subscription tier (Pro, Enterprise, Business)' },
      { name: 'Country', type: 'category', description: 'Customer origin country' },
      { name: 'MRR', type: 'currency', description: 'Monthly Recurring Revenue' },
      { name: 'Active Users', type: 'number', description: 'Number of active seats' },
      { name: 'Churn Risk', type: 'boolean', description: 'Flagged churn warning' },
    ],
    sampleDataRows: SAAS_REVENUE_SAMPLE_GRID.slice(1).map((r) => ({
      'Customer Name': r[0],
      Plan: r[1],
      Country: r[2],
      MRR: r[3],
      'Active Users': r[4],
      'Churn Risk': r[5],
      'Signup Date': r[6],
    })),
    suggestedWidgets: [
      {
        id: 'saas_w1',
        title: 'Total MRR',
        type: 'kpi',
        calculation: { function: 'SUM', column: 'MRR' },
        customOptions: { color: '#10b981' },
      },
      {
        id: 'saas_w2',
        title: 'Average MRR per Account',
        type: 'kpi',
        calculation: { function: 'AVERAGE', column: 'MRR' },
        customOptions: { color: '#6366f1' },
      },
      {
        id: 'saas_w3',
        title: 'MRR by Plan',
        type: 'bar',
        calculation: { function: 'SUM', column: 'MRR', groupBy: 'Plan' },
      },
      {
        id: 'saas_w4',
        title: 'Customer Geographic Distribution',
        type: 'donut',
        calculation: { function: 'COUNT', groupBy: 'Country' },
      },
    ],
  },
  {
    id: 'template_expenses_budget',
    name: 'Operational Expenses & Department Budget',
    category: 'Business',
    description: 'Track corporate expenditure, vendor contracts, department spending and approvals.',
    iconName: 'DollarSign',
    expectedColumns: [
      { name: 'Expense Title', type: 'text', description: 'Description of purchase' },
      { name: 'Department', type: 'category', description: 'Department incurring expense' },
      { name: 'Category', type: 'category', description: 'Software, Travel, Utilities, Infrastructure' },
      { name: 'Amount', type: 'currency', description: 'Expense amount' },
      { name: 'Vendor', type: 'text', description: 'Payee / merchant' },
      { name: 'Status', type: 'category', description: 'Approved, Pending, Rejected' },
    ],
    sampleDataRows: EXPENSES_SAMPLE_GRID.slice(1).map((r) => ({
      'Expense Title': r[0],
      Department: r[1],
      Category: r[2],
      Amount: r[3],
      Vendor: r[4],
      Status: r[5],
      Date: r[6],
    })),
    suggestedWidgets: [
      {
        id: 'exp_w1',
        title: 'Total Expenses',
        type: 'kpi',
        calculation: { function: 'SUM', column: 'Amount' },
        customOptions: { color: '#ef4444' },
      },
      {
        id: 'exp_w2',
        title: 'Department Spend Breakdown',
        type: 'bar',
        calculation: { function: 'SUM', column: 'Amount', groupBy: 'Department' },
      },
      {
        id: 'exp_w3',
        title: 'Category Allocation',
        type: 'donut',
        calculation: { function: 'SUM', column: 'Amount', groupBy: 'Category' },
      },
    ],
  },

  // 3. PERSONAL TEMPLATES
  {
    id: 'template_personal_budget',
    name: 'Personal Budget & Savings Tracker',
    category: 'Personal',
    description: 'Categorize daily expenses, track monthly savings goal, and control cash flow.',
    iconName: 'PieChart',
    expectedColumns: [
      { name: 'Item', type: 'text', description: 'Expense item' },
      { name: 'Category', type: 'category', description: 'Groceries, Rent, Transport, Entertainment' },
      { name: 'Cost', type: 'currency', description: 'Amount spent' },
      { name: 'Date', type: 'date', description: 'Date of transaction' },
    ],
    suggestedWidgets: [
      {
        id: 'pb_w1',
        title: 'Total Monthly Spend',
        type: 'kpi',
        calculation: { function: 'SUM', column: 'Cost' },
        customOptions: { color: '#06b6d4' },
      },
    ],
  },

  // 4. PROJECT MANAGEMENT TEMPLATES
  {
    id: 'template_project_tasks',
    name: 'Agile Tasks, Deadlines & Team Velocity',
    category: 'Project Management',
    description: 'Monitor task completion rates, assignees, priorities, and sprint milestones.',
    iconName: 'CheckSquare',
    expectedColumns: [
      { name: 'Task Name', type: 'text', description: 'Task title' },
      { name: 'Assignee', type: 'category', description: 'Team member responsible' },
      { name: 'Priority', type: 'category', description: 'High, Medium, Low' },
      { name: 'Status', type: 'category', description: 'Done, In Progress, Blocked' },
      { name: 'Due Date', type: 'date', description: 'Target completion date' },
    ],
    suggestedWidgets: [
      {
        id: 'pm_w1',
        title: 'Total Sprint Tasks',
        type: 'kpi',
        calculation: { function: 'COUNT', column: 'Task Name' },
        customOptions: { color: '#8b5cf6' },
      },
    ],
  },
];
