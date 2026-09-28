export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type AccountSubtype =
  // Assets
  | 'Cash'
  | 'Bank'
  | 'Accounts Receivable'
  | 'Inventory'
  | 'Equipment'
  | 'Property'
  | 'Other Assets'
  // Liabilities
  | 'Accounts Payable'
  | 'Loans'
  | 'Taxes Payable'
  | 'Salaries Payable'
  | 'Other Liabilities'
  // Equity
  | "Owner's Capital"
  | 'Retained Earnings'
  | 'Other Equity'
  // Revenue
  | 'Sales Revenue'
  | 'Service Revenue'
  | 'Other Revenue'
  // Expenses
  | 'Cost of Goods Sold'
  | 'Salaries'
  | 'Rent'
  | 'Utilities'
  | 'Marketing'
  | 'Transportation'
  | 'Office Expenses'
  | 'Taxes'
  | 'Other Expenses';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subType: AccountSubtype;
  parentAccountId?: string;
  description: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
}

export type JournalStatus = 'Draft' | 'Posted' | 'Reversed';

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string;
  status: JournalStatus;
  reversalOfId?: string;
  currency: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  postedAt?: string;
  createdBy: string;
}

export interface GeneralLedgerEntry {
  transactionId: string;
  date: string;
  entryNumber: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface AccountLedger {
  account: Account;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  netMovement: number;
  closingBalance: number;
  entries: GeneralLedgerEntry[];
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
  generatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  amount: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  currency: string;
  notes?: string;
  createdAt: string;
}

export type AgingBucket = 'Current' | '1–30 Days' | '31–60 Days' | '61–90 Days' | '90+ Days';

export interface ReceivableItem {
  id: string;
  customer: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  agingBucket: AgingBucket;
  daysOverdue: number;
}

export interface PayableItem {
  id: string;
  supplier: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  agingBucket: AgingBucket;
  daysOverdue: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Corporate Card' | 'Check';
  accountId: string;
  supplier?: string;
  reference?: string;
  attachment?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  totalCost: number;
  inventoryValue: number;
  lowStockThreshold: number;
  valuationMethod: 'FIFO' | 'Weighted Average';
  unit: string;
}

export interface TaxConfiguration {
  id: string;
  name: string;
  type: 'VAT' | 'Sales Tax' | 'Income Tax' | 'Withholding Tax';
  rate: number;
  effectiveDate: string;
  country: string;
  accountId: string;
  isActive: boolean;
}

export interface BudgetItem {
  id: string;
  category: string;
  type: 'Revenue' | 'Expense';
  period: string; // e.g. '2026-Q1', '2026-Annual'
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
}

export interface FinancialRatiosData {
  // Liquidity
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  // Profitability
  grossProfitMargin: number;
  operatingMargin: number;
  netProfitMargin: number;
  roa: number;
  roe: number;
  roi: number;
  // Solvency
  debtRatio: number;
  debtToEquityRatio: number;
  // Efficiency
  inventoryTurnover: number;
  receivablesTurnover: number;
  assetTurnover: number;
}

export interface IncomeStatementData {
  revenue: { name: string; amount: number }[];
  totalRevenue: number;
  cogs: { name: string; amount: number }[];
  totalCogs: number;
  grossProfit: number;
  operatingExpenses: { name: string; amount: number }[];
  totalOperatingExpenses: number;
  operatingProfit: number;
  otherIncomeExpenses: { name: string; amount: number }[];
  totalOtherIncomeExpenses: number;
  profitBeforeTax: number;
  taxExpense: number;
  netProfit: number;
}

export interface BalanceSheetData {
  currentAssets: { name: string; amount: number }[];
  totalCurrentAssets: number;
  nonCurrentAssets: { name: string; amount: number }[];
  totalNonCurrentAssets: number;
  totalAssets: number;

  currentLiabilities: { name: string; amount: number }[];
  totalCurrentLiabilities: number;
  nonCurrentLiabilities: { name: string; amount: number }[];
  totalNonCurrentLiabilities: number;
  totalLiabilities: number;

  equity: { name: string; amount: number }[];
  totalEquity: number;

  totalLiabilitiesAndEquity: number;
  isBalanced: boolean; // Assets = Liabilities + Equity
  difference: number;
}

export interface CashFlowData {
  operatingActivities: { description: string; amount: number }[];
  netOperatingCash: number;
  investingActivities: { description: string; amount: number }[];
  netInvestingCash: number;
  financingActivities: { description: string; amount: number }[];
  netFinancingCash: number;
  netChangeInCash: number;
  openingCash: number;
  closingCash: number;
}

export interface AccountingColumnMapping {
  dateColumn?: string;
  descriptionColumn?: string;
  customerColumn?: string;
  supplierColumn?: string;
  revenueColumn?: string;
  expenseColumn?: string;
  categoryColumn?: string;
  paymentMethodColumn?: string;
  accountColumn?: string;
}
