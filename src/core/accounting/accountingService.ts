import {
  Account,
  AccountType,
  JournalEntry,
  JournalLine,
  TrialBalanceReport,
  TrialBalanceRow,
  AccountLedger,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  Invoice,
  ReceivableItem,
  PayableItem,
  ExpenseRecord,
  InventoryItem,
  TaxConfiguration,
  BudgetItem,
  FinancialRatiosData,
  AccountingColumnMapping,
} from '../types/accounting';

// Initial default Chart of Accounts according to Section 54
export const DEFAULT_CHART_OF_ACCOUNTS: Account[] = [
  // Assets (1000s)
  {
    id: 'acc_1010',
    code: '1010',
    name: 'Cash on Hand',
    type: 'Asset',
    subType: 'Cash',
    description: 'Petty cash and physical notes',
    balance: 14500,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_1020',
    code: '1020',
    name: 'Operating Bank Account',
    type: 'Asset',
    subType: 'Bank',
    description: 'Primary commercial bank checking account',
    balance: 86400,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_1200',
    code: '1200',
    name: 'Accounts Receivable',
    type: 'Asset',
    subType: 'Accounts Receivable',
    description: 'Unpaid customer invoices and billed receivables',
    balance: 32000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_1300',
    code: '1300',
    name: 'Inventory Stock',
    type: 'Asset',
    subType: 'Inventory',
    description: 'Goods available for sale and warehouse stock',
    balance: 45000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_1500',
    code: '1500',
    name: 'Equipment & Computers',
    type: 'Asset',
    subType: 'Equipment',
    description: 'Office hardware, machinery, and workstations',
    balance: 28000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_1600',
    code: '1600',
    name: 'Office Property',
    type: 'Asset',
    subType: 'Property',
    description: 'Commercial real estate and long-term leasehold improvements',
    balance: 120000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },

  // Liabilities (2000s)
  {
    id: 'acc_2010',
    code: '2010',
    name: 'Accounts Payable',
    type: 'Liability',
    subType: 'Accounts Payable',
    description: 'Outstanding vendor bills and trade payables',
    balance: 21500,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_2200',
    code: '2200',
    name: 'Commercial Bank Loan',
    type: 'Liability',
    subType: 'Loans',
    description: 'Medium-term corporate credit financing',
    balance: 40000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_2300',
    code: '2300',
    name: 'Taxes Payable',
    type: 'Liability',
    subType: 'Taxes Payable',
    description: 'Accrued corporate income tax and VAT liabilities',
    balance: 8400,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_2400',
    code: '2400',
    name: 'Salaries Payable',
    type: 'Liability',
    subType: 'Salaries Payable',
    description: 'Accrued staff wages and payroll deductions',
    balance: 12000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },

  // Equity (3000s)
  {
    id: 'acc_3010',
    code: '3010',
    name: "Owner's Capital",
    type: 'Equity',
    subType: "Owner's Capital",
    description: 'Initial and contributed partner equity',
    balance: 122000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_3020',
    code: '3020',
    name: 'Retained Earnings',
    type: 'Equity',
    subType: 'Retained Earnings',
    description: 'Cumulative prior years undistributed operating profits',
    balance: 64000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },

  // Revenue (4000s)
  {
    id: 'acc_4010',
    code: '4010',
    name: 'Sales Revenue',
    type: 'Revenue',
    subType: 'Sales Revenue',
    description: 'Core product and subscription software revenues',
    balance: 142000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_4020',
    code: '4020',
    name: 'Consulting Service Revenue',
    type: 'Revenue',
    subType: 'Service Revenue',
    description: 'Professional onboarding and advisory service fees',
    balance: 28500,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },

  // Expenses (5000s - 6000s)
  {
    id: 'acc_5010',
    code: '5010',
    name: 'Cost of Goods Sold (COGS)',
    type: 'Expense',
    subType: 'Cost of Goods Sold',
    description: 'Direct server infrastructure, cloud hosting and software licenses',
    balance: 38400,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_6010',
    code: '6010',
    name: 'Salaries & Wages',
    type: 'Expense',
    subType: 'Salaries',
    description: 'Engineering, sales, and administrative payroll',
    balance: 42000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_6020',
    code: '6020',
    name: 'Office Rent',
    type: 'Expense',
    subType: 'Rent',
    description: 'Headquarters workspace lease payments',
    balance: 12000,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_6030',
    code: '6030',
    name: 'Utilities & Internet',
    type: 'Expense',
    subType: 'Utilities',
    description: 'Fiber internet connection, electricity, and office maintenance',
    balance: 3200,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_6040',
    code: '6040',
    name: 'Marketing & Advertising',
    type: 'Expense',
    subType: 'Marketing',
    description: 'Digital campaigns, SEO, and community events',
    balance: 9500,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'acc_6070',
    code: '6070',
    name: 'Corporate Tax Expense',
    type: 'Expense',
    subType: 'Taxes',
    description: 'Statutory income taxes assessed',
    balance: 7400,
    currency: 'USD',
    isActive: true,
    createdAt: '2026-01-01',
  },
];

// Initial Realistic Journal Entries (All balanced: Total Debit = Total Credit)
export const DEFAULT_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je_1001',
    entryNumber: 'JE-2026-001',
    date: '2026-01-05',
    description: 'Client software license invoice payment received via Bank',
    reference: 'INV-2026-081',
    status: 'Posted',
    currency: 'USD',
    totalDebit: 18500,
    totalCredit: 18500,
    createdBy: 'Soxibjon',
    createdAt: '2026-01-05T09:00:00Z',
    postedAt: '2026-01-05T09:05:00Z',
    lines: [
      {
        id: 'jl_1001_1',
        accountId: 'acc_1020',
        accountName: 'Operating Bank Account',
        accountCode: '1020',
        debit: 18500,
        credit: 0,
        description: 'Received bank wire',
      },
      {
        id: 'jl_1001_2',
        accountId: 'acc_4010',
        accountName: 'Sales Revenue',
        accountCode: '4010',
        debit: 0,
        credit: 18500,
        description: 'Software license revenue recognition',
      },
    ],
  },
  {
    id: 'je_1002',
    entryNumber: 'JE-2026-002',
    date: '2026-01-12',
    description: 'Monthly Cloud Infrastructure server bill paid via Bank',
    reference: 'AWS-99120',
    status: 'Posted',
    currency: 'USD',
    totalDebit: 4200,
    totalCredit: 4200,
    createdBy: 'Soxibjon',
    createdAt: '2026-01-12T14:30:00Z',
    postedAt: '2026-01-12T14:35:00Z',
    lines: [
      {
        id: 'jl_1002_1',
        accountId: 'acc_5010',
        accountName: 'Cost of Goods Sold (COGS)',
        accountCode: '5010',
        debit: 4200,
        credit: 0,
        description: 'Cloud hosting charges',
      },
      {
        id: 'jl_1002_2',
        accountId: 'acc_1020',
        accountName: 'Operating Bank Account',
        accountCode: '1020',
        debit: 0,
        credit: 4200,
        description: 'Direct wire disbursement',
      },
    ],
  },
  {
    id: 'je_1003',
    entryNumber: 'JE-2026-003',
    date: '2026-01-20',
    description: 'Billed consulting services to Enterprise Partner on credit',
    reference: 'INV-2026-089',
    status: 'Posted',
    currency: 'USD',
    totalDebit: 12000,
    totalCredit: 12000,
    createdBy: 'Soxibjon',
    createdAt: '2026-01-20T11:15:00Z',
    postedAt: '2026-01-20T11:20:00Z',
    lines: [
      {
        id: 'jl_1003_1',
        accountId: 'acc_1200',
        accountName: 'Accounts Receivable',
        accountCode: '1200',
        debit: 12000,
        credit: 0,
        description: 'Trade receivable invoice',
      },
      {
        id: 'jl_1003_2',
        accountId: 'acc_4020',
        accountName: 'Consulting Service Revenue',
        accountCode: '4020',
        debit: 0,
        credit: 12000,
        description: 'Enterprise workflow integration fee',
      },
    ],
  },
  {
    id: 'je_1004',
    entryNumber: 'JE-2026-004',
    date: '2026-01-28',
    description: 'Office headquarters monthly lease payment',
    reference: 'RENT-0126',
    status: 'Posted',
    currency: 'USD',
    totalDebit: 3000,
    totalCredit: 3000,
    createdBy: 'Soxibjon',
    createdAt: '2026-01-28T16:00:00Z',
    postedAt: '2026-01-28T16:02:00Z',
    lines: [
      {
        id: 'jl_1004_1',
        accountId: 'acc_6020',
        accountName: 'Office Rent',
        accountCode: '6020',
        debit: 3000,
        credit: 0,
        description: 'January office lease',
      },
      {
        id: 'jl_1004_2',
        accountId: 'acc_1020',
        accountName: 'Operating Bank Account',
        accountCode: '1020',
        debit: 0,
        credit: 3000,
        description: 'Bank payment to landlord',
      },
    ],
  },
  {
    id: 'je_1005',
    entryNumber: 'JE-2026-005',
    date: '2026-02-01',
    description: 'Hardware computer workstations acquisition on trade credit',
    reference: 'PO-DELL-882',
    status: 'Draft',
    currency: 'USD',
    totalDebit: 8500,
    totalCredit: 8500,
    createdBy: 'Soxibjon',
    createdAt: '2026-02-01T10:00:00Z',
    lines: [
      {
        id: 'jl_1005_1',
        accountId: 'acc_1500',
        accountName: 'Equipment & Computers',
        accountCode: '1500',
        debit: 8500,
        credit: 0,
        description: 'Developer workstations',
      },
      {
        id: 'jl_1005_2',
        accountId: 'acc_2010',
        accountName: 'Accounts Payable',
        accountCode: '2010',
        debit: 0,
        credit: 8500,
        description: '30-day supplier credit',
      },
    ],
  },
];

// Sample Invoices
export const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv_2026_001',
    invoiceNumber: 'INV-2026-001',
    customerName: 'Tashkent Tech Logistics',
    customerEmail: 'finance@tashkenttech.uz',
    invoiceDate: '2026-01-10',
    dueDate: '2026-02-10',
    items: [
      {
        id: 'item_1',
        description: 'SheetFlow Enterprise License (100 seats)',
        quantity: 1,
        unitPrice: 15000,
        discountPercent: 0,
        taxRate: 12,
        amount: 16800,
      },
    ],
    subtotal: 15000,
    discount: 0,
    tax: 1800,
    total: 16800,
    paidAmount: 16800,
    remainingAmount: 0,
    status: 'Paid',
    currency: 'USD',
    createdAt: '2026-01-10',
  },
  {
    id: 'inv_2026_002',
    invoiceNumber: 'INV-2026-002',
    customerName: 'Samarkand Agro Export',
    customerEmail: 'accounting@samagro.com',
    invoiceDate: '2026-01-25',
    dueDate: '2026-02-25',
    items: [
      {
        id: 'item_2',
        description: 'Custom Accounting Google Sheets Integration',
        quantity: 40,
        unitPrice: 150,
        discountPercent: 5,
        taxRate: 12,
        amount: 6384,
      },
    ],
    subtotal: 6000,
    discount: 300,
    tax: 684,
    total: 6384,
    paidAmount: 3000,
    remainingAmount: 3384,
    status: 'Partially Paid',
    currency: 'USD',
    createdAt: '2026-01-25',
  },
  {
    id: 'inv_2026_003',
    invoiceNumber: 'INV-2026-003',
    customerName: 'Bukhara Silk Retail',
    customerEmail: 'info@bukharasilk.uz',
    invoiceDate: '2026-02-05',
    dueDate: '2026-03-05',
    items: [
      {
        id: 'item_3',
        description: 'Multi-Department Analytics & Inventory System',
        quantity: 1,
        unitPrice: 9500,
        discountPercent: 0,
        taxRate: 12,
        amount: 10640,
      },
    ],
    subtotal: 9500,
    discount: 0,
    tax: 1140,
    total: 10640,
    paidAmount: 0,
    remainingAmount: 10640,
    status: 'Sent',
    currency: 'USD',
    createdAt: '2026-02-05',
  },
  {
    id: 'inv_2026_004',
    invoiceNumber: 'INV-2026-004',
    customerName: 'Fergana Digital Media',
    customerEmail: 'billing@fergana.digital',
    invoiceDate: '2025-11-15',
    dueDate: '2025-12-15',
    items: [
      {
        id: 'item_4',
        description: 'Consulting Retainer Q4',
        quantity: 1,
        unitPrice: 4200,
        discountPercent: 0,
        taxRate: 12,
        amount: 4704,
      },
    ],
    subtotal: 4200,
    discount: 0,
    tax: 504,
    total: 4704,
    paidAmount: 0,
    remainingAmount: 4704,
    status: 'Overdue',
    currency: 'USD',
    createdAt: '2025-11-15',
  },
];

// Sample Accounts Payable
export const DEFAULT_PAYABLES: PayableItem[] = [
  {
    id: 'ap_1',
    supplier: 'Amazon Web Services',
    billNumber: 'AWS-2026-01',
    billDate: '2026-01-28',
    dueDate: '2026-02-28',
    amount: 5200,
    paidAmount: 0,
    remainingAmount: 5200,
    status: 'Unpaid',
    agingBucket: 'Current',
    daysOverdue: 0,
  },
  {
    id: 'ap_2',
    supplier: 'Google Cloud Platform',
    billNumber: 'GCP-88310',
    billDate: '2026-01-15',
    dueDate: '2026-02-15',
    amount: 3400,
    paidAmount: 1000,
    remainingAmount: 2400,
    status: 'Partially Paid',
    agingBucket: 'Current',
    daysOverdue: 0,
  },
  {
    id: 'ap_3',
    supplier: 'Dell Technologies',
    billNumber: 'DELL-99120',
    billDate: '2025-12-10',
    dueDate: '2026-01-10',
    amount: 8500,
    paidAmount: 0,
    remainingAmount: 8500,
    status: 'Overdue',
    agingBucket: '31–60 Days',
    daysOverdue: 48,
  },
  {
    id: 'ap_4',
    supplier: 'Office Lease Management LLC',
    billNumber: 'RENT-Q1',
    billDate: '2026-01-01',
    dueDate: '2026-01-31',
    amount: 4500,
    paidAmount: 4500,
    remainingAmount: 0,
    status: 'Paid',
    agingBucket: 'Current',
    daysOverdue: 0,
  },
];

// Sample Inventory
export const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_item_1',
    sku: 'HW-SRV-01',
    name: 'High-Performance Edge Gateway',
    category: 'Hardware',
    quantity: 45,
    purchasePrice: 420,
    sellingPrice: 750,
    totalCost: 18900,
    inventoryValue: 33750,
    lowStockThreshold: 10,
    valuationMethod: 'FIFO',
    unit: 'Units',
  },
  {
    id: 'inv_item_2',
    sku: 'HW-IOT-09',
    name: 'Smart Sensor Telemetry Node',
    category: 'Hardware',
    quantity: 120,
    purchasePrice: 65,
    sellingPrice: 120,
    totalCost: 7800,
    inventoryValue: 14400,
    lowStockThreshold: 25,
    valuationMethod: 'Weighted Average',
    unit: 'Pcs',
  },
  {
    id: 'inv_item_3',
    sku: 'LIC-ENT-YR',
    name: 'Enterprise License Dongle',
    category: 'Software Key',
    quantity: 8,
    purchasePrice: 200,
    sellingPrice: 600,
    totalCost: 1600,
    inventoryValue: 4800,
    lowStockThreshold: 15,
    valuationMethod: 'FIFO',
    unit: 'Keys',
  },
];

// Sample Taxes
export const DEFAULT_TAXES: TaxConfiguration[] = [
  {
    id: 'tax_vat_12',
    name: 'Standard Value Added Tax (VAT)',
    type: 'VAT',
    rate: 12,
    effectiveDate: '2023-01-01',
    country: 'Uzbekistan',
    accountId: 'acc_2300',
    isActive: true,
  },
  {
    id: 'tax_cit_15',
    name: 'Corporate Income Tax (CIT)',
    type: 'Income Tax',
    rate: 15,
    effectiveDate: '2023-01-01',
    country: 'Uzbekistan',
    accountId: 'acc_6070',
    isActive: true,
  },
  {
    id: 'tax_wht_10',
    name: 'Non-Resident Withholding Tax',
    type: 'Withholding Tax',
    rate: 10,
    effectiveDate: '2023-01-01',
    country: 'Uzbekistan',
    accountId: 'acc_2300',
    isActive: false,
  },
];

// Sample Budget
export const DEFAULT_BUDGET: BudgetItem[] = [
  {
    id: 'b_1',
    category: 'Sales Revenue',
    type: 'Revenue',
    period: '2026-Annual',
    budgetAmount: 180000,
    actualAmount: 170500,
    variance: -9500,
    variancePercent: -5.28,
  },
  {
    id: 'b_2',
    category: 'COGS',
    type: 'Expense',
    period: '2026-Annual',
    budgetAmount: 45000,
    actualAmount: 38400,
    variance: 6600,
    variancePercent: 14.67,
  },
  {
    id: 'b_3',
    category: 'Salaries & Wages',
    type: 'Expense',
    period: '2026-Annual',
    budgetAmount: 48000,
    actualAmount: 42000,
    variance: 6000,
    variancePercent: 12.5,
  },
  {
    id: 'b_4',
    category: 'Marketing',
    type: 'Expense',
    period: '2026-Annual',
    budgetAmount: 12000,
    actualAmount: 9500,
    variance: 2500,
    variancePercent: 20.83,
  },
  {
    id: 'b_5',
    category: 'Rent & Utilities',
    type: 'Expense',
    period: '2026-Annual',
    budgetAmount: 16000,
    actualAmount: 15200,
    variance: 800,
    variancePercent: 5.0,
  },
];

class AccountingService {
  private accounts: Account[] = [...DEFAULT_CHART_OF_ACCOUNTS];
  private journalEntries: JournalEntry[] = [...DEFAULT_JOURNAL_ENTRIES];
  private invoices: Invoice[] = [...DEFAULT_INVOICES];
  private payables: PayableItem[] = [...DEFAULT_PAYABLES];
  private inventory: InventoryItem[] = [...DEFAULT_INVENTORY];
  private taxes: TaxConfiguration[] = [...DEFAULT_TAXES];
  private budgets: BudgetItem[] = [...DEFAULT_BUDGET];

  // 1. Chart of Accounts
  getAccounts(): Account[] {
    return [...this.accounts];
  }

  getAccountById(id: string): Account | undefined {
    return this.accounts.find((a) => a.id === id);
  }

  createAccount(account: Omit<Account, 'id' | 'createdAt'>): Account {
    const newAccount: Account = {
      ...account,
      id: `acc_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.accounts.push(newAccount);
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<Account>): Account {
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Account not found: ${id}`);
    this.accounts[idx] = { ...this.accounts[idx], ...updates };
    return this.accounts[idx];
  }

  // 2. Double-Entry Journal Engine (Section 55 & 56)
  getJournalEntries(): JournalEntry[] {
    return [...this.journalEntries];
  }

  createJournalEntry(entry: {
    date: string;
    description: string;
    reference: string;
    currency: string;
    lines: {
      accountId: string;
      debit: number;
      credit: number;
      description?: string;
    }[];
    status?: 'Draft' | 'Posted';
  }): JournalEntry {
    const totalDebit = entry.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    // Section 55 Core Rule: Total Debit = Total Credit
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) {
      throw new Error(
        `Double-entry imbalance! Total Debit ($${totalDebit.toFixed(2)}) must equal Total Credit ($${totalCredit.toFixed(2)}). Discrepancy: $${difference.toFixed(2)}`
      );
    }

    if (entry.lines.length < 2) {
      throw new Error('A journal entry must contain at least one Debit line and one Credit line.');
    }

    const linesWithMeta: JournalLine[] = entry.lines.map((l, i) => {
      const acc = this.getAccountById(l.accountId);
      return {
        id: `jl_${Date.now()}_${i}`,
        accountId: l.accountId,
        accountName: acc?.name || 'Unknown Account',
        accountCode: acc?.code || '0000',
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description,
      };
    });

    const isPosted = entry.status === 'Posted';

    const newEntry: JournalEntry = {
      id: `je_${Date.now()}`,
      entryNumber: `JE-2026-${String(this.journalEntries.length + 1).padStart(3, '0')}`,
      date: entry.date,
      description: entry.description,
      reference: entry.reference,
      status: isPosted ? 'Posted' : 'Draft',
      currency: entry.currency || 'USD',
      lines: linesWithMeta,
      totalDebit,
      totalCredit,
      createdAt: new Date().toISOString(),
      postedAt: isPosted ? new Date().toISOString() : undefined,
      createdBy: 'Soxibjon',
    };

    this.journalEntries.unshift(newEntry);

    // If posted, update balances
    if (isPosted) {
      this.applyEntryToBalances(newEntry);
    }

    return newEntry;
  }

  postJournalEntry(id: string): JournalEntry {
    const entry = this.journalEntries.find((j) => j.id === id);
    if (!entry) throw new Error(`Journal entry ${id} not found.`);
    if (entry.status === 'Posted') throw new Error(`Journal entry ${id} is already posted.`);
    if (entry.status === 'Reversed') throw new Error(`Cannot post a reversed journal entry.`);

    // Balance check
    if (Math.abs(entry.totalDebit - entry.totalCredit) > 0.01) {
      throw new Error('Cannot post an unbalanced entry.');
    }

    entry.status = 'Posted';
    entry.postedAt = new Date().toISOString();
    this.applyEntryToBalances(entry);
    return entry;
  }

  reverseJournalEntry(id: string, reason: string): JournalEntry {
    const entry = this.journalEntries.find((j) => j.id === id);
    if (!entry) throw new Error(`Journal entry ${id} not found.`);
    if (entry.status !== 'Posted') throw new Error('Only posted transactions can be reversed.');

    // Create opposite lines
    const reversedLines: JournalLine[] = entry.lines.map((l, i) => ({
      id: `jl_rev_${Date.now()}_${i}`,
      accountId: l.accountId,
      accountName: l.accountName,
      accountCode: l.accountCode,
      debit: l.credit, // swap
      credit: l.debit, // swap
      description: `Reversal: ${l.description || entry.description}`,
    }));

    const reversalEntry: JournalEntry = {
      id: `je_rev_${Date.now()}`,
      entryNumber: `JE-2026-${String(this.journalEntries.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      description: `Reversal of ${entry.entryNumber}: ${reason}`,
      reference: `REV-${entry.entryNumber}`,
      status: 'Posted',
      reversalOfId: entry.id,
      currency: entry.currency,
      lines: reversedLines,
      totalDebit: entry.totalCredit,
      totalCredit: entry.totalDebit,
      createdAt: new Date().toISOString(),
      postedAt: new Date().toISOString(),
      createdBy: 'Soxibjon',
    };

    entry.status = 'Reversed';
    this.journalEntries.unshift(reversalEntry);
    this.applyEntryToBalances(reversalEntry);
    return reversalEntry;
  }

  private applyEntryToBalances(entry: JournalEntry) {
    for (const line of entry.lines) {
      const acc = this.accounts.find((a) => a.id === line.accountId);
      if (!acc) continue;

      // Normal balance rules:
      // Asset & Expense: increase by Debit, decrease by Credit
      // Liability, Equity, Revenue: increase by Credit, decrease by Debit
      if (acc.type === 'Asset' || acc.type === 'Expense') {
        acc.balance += line.debit - line.credit;
      } else {
        acc.balance += line.credit - line.debit;
      }
    }
  }

  // 3. Trial Balance (Section 58)
  getTrialBalance(): TrialBalanceReport {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows: TrialBalanceRow[] = this.accounts.map((acc) => {
      let debit = 0;
      let credit = 0;

      if (acc.type === 'Asset' || acc.type === 'Expense') {
        if (acc.balance >= 0) {
          debit = acc.balance;
        } else {
          credit = Math.abs(acc.balance);
        }
      } else {
        if (acc.balance >= 0) {
          credit = acc.balance;
        } else {
          debit = Math.abs(acc.balance);
        }
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        debit,
        credit,
      };
    });

    const diff = Math.abs(totalDebit - totalCredit);
    return {
      rows,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      difference: Math.round(diff * 100) / 100,
      isBalanced: diff < 0.05,
      generatedAt: new Date().toISOString(),
    };
  }

  // 4. General Ledger (Section 57)
  getGeneralLedger(accountId?: string): AccountLedger[] {
    const targetAccounts = accountId
      ? this.accounts.filter((a) => a.id === accountId)
      : this.accounts;

    return targetAccounts.map((acc) => {
      // Find all posted journal lines touching this account
      const relevantEntries: { entry: JournalEntry; line: JournalLine }[] = [];
      this.journalEntries
        .filter((j) => j.status === 'Posted')
        .forEach((entry) => {
          entry.lines
            .filter((l) => l.accountId === acc.id)
            .forEach((line) => {
              relevantEntries.push({ entry, line });
            });
        });

      let running = 0;
      let totalDeb = 0;
      let totalCred = 0;

      const ledgerEntries = relevantEntries.map(({ entry, line }) => {
        totalDeb += line.debit;
        totalCred += line.credit;

        if (acc.type === 'Asset' || acc.type === 'Expense') {
          running += line.debit - line.credit;
        } else {
          running += line.credit - line.debit;
        }

        return {
          transactionId: entry.id,
          date: entry.date,
          entryNumber: entry.entryNumber,
          description: line.description || entry.description,
          reference: entry.reference,
          debit: line.debit,
          credit: line.credit,
          runningBalance: running,
        };
      });

      return {
        account: acc,
        openingBalance: 0,
        totalDebit: totalDeb,
        totalCredit: totalCred,
        netMovement: acc.balance,
        closingBalance: acc.balance,
        entries: ledgerEntries,
      };
    });
  }

  // 5. Financial Statements (Section 59)
  getIncomeStatement(): IncomeStatementData {
    const revAccounts = this.accounts.filter((a) => a.type === 'Revenue');
    const cogsAccounts = this.accounts.filter((a) => a.subType === 'Cost of Goods Sold');
    const opExpAccounts = this.accounts.filter(
      (a) => a.type === 'Expense' && a.subType !== 'Cost of Goods Sold' && a.subType !== 'Taxes'
    );
    const taxAccounts = this.accounts.filter((a) => a.subType === 'Taxes');

    const totalRevenue = revAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalCogs = cogsAccounts.reduce((sum, a) => sum + a.balance, 0);
    const grossProfit = totalRevenue - totalCogs;

    const totalOperatingExpenses = opExpAccounts.reduce((sum, a) => sum + a.balance, 0);
    const operatingProfit = grossProfit - totalOperatingExpenses;

    const taxExpense = taxAccounts.reduce((sum, a) => sum + a.balance, 0);
    const netProfit = operatingProfit - taxExpense;

    return {
      revenue: revAccounts.map((a) => ({ name: a.name, amount: a.balance })),
      totalRevenue,
      cogs: cogsAccounts.map((a) => ({ name: a.name, amount: a.balance })),
      totalCogs,
      grossProfit,
      operatingExpenses: opExpAccounts.map((a) => ({ name: a.name, amount: a.balance })),
      totalOperatingExpenses,
      operatingProfit,
      otherIncomeExpenses: [],
      totalOtherIncomeExpenses: 0,
      profitBeforeTax: operatingProfit,
      taxExpense,
      netProfit,
    };
  }

  getBalanceSheet(): BalanceSheetData {
    const curAssets = this.accounts.filter(
      (a) => a.type === 'Asset' && ['Cash', 'Bank', 'Accounts Receivable', 'Inventory'].includes(a.subType)
    );
    const nonCurAssets = this.accounts.filter(
      (a) => a.type === 'Asset' && ['Equipment', 'Property', 'Other Assets'].includes(a.subType)
    );

    const curLiabilities = this.accounts.filter(
      (a) => a.type === 'Liability' && ['Accounts Payable', 'Taxes Payable', 'Salaries Payable'].includes(a.subType)
    );
    const nonCurLiabilities = this.accounts.filter(
      (a) => a.type === 'Liability' && a.subType === 'Loans'
    );

    const equityAccounts = this.accounts.filter((a) => a.type === 'Equity');

    const totalCurrentAssets = curAssets.reduce((sum, a) => sum + a.balance, 0);
    const totalNonCurrentAssets = nonCurAssets.reduce((sum, a) => sum + a.balance, 0);
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalCurrentLiabilities = curLiabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalNonCurrentLiabilities = nonCurLiabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    // Equity includes net profit from income statement
    const income = this.getIncomeStatement();
    const totalCapital = equityAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = totalCapital + income.netProfit;

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const diff = Math.abs(totalAssets - totalLiabilitiesAndEquity);

    return {
      currentAssets: curAssets.map((a) => ({ name: a.name, amount: a.balance })),
      totalCurrentAssets,
      nonCurrentAssets: nonCurAssets.map((a) => ({ name: a.name, amount: a.balance })),
      totalNonCurrentAssets,
      totalAssets,

      currentLiabilities: curLiabilities.map((a) => ({ name: a.name, amount: a.balance })),
      totalCurrentLiabilities,
      nonCurrentLiabilities: nonCurLiabilities.map((a) => ({ name: a.name, amount: a.balance })),
      totalNonCurrentLiabilities,
      totalLiabilities,

      equity: [
        ...equityAccounts.map((a) => ({ name: a.name, amount: a.balance })),
        { name: 'Current Period Net Profit', amount: income.netProfit },
      ],
      totalEquity,

      totalLiabilitiesAndEquity,
      isBalanced: diff < 1.0,
      difference: diff,
    };
  }

  getCashFlow(): CashFlowData {
    const cashAccounts = this.accounts.filter((a) => ['Cash', 'Bank'].includes(a.subType));
    const closingCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
    const openingCash = 75000;
    const netChangeInCash = closingCash - openingCash;

    return {
      operatingActivities: [
        { description: 'Cash received from customers', amount: 128500 },
        { description: 'Cash paid to suppliers & hosting', amount: -38400 },
        { description: 'Salaries and payroll paid', amount: -42000 },
        { description: 'Rent and utilities paid', amount: -15200 },
        { description: 'Tax payments', amount: -7400 },
      ],
      netOperatingCash: 25500,
      investingActivities: [
        { description: 'Purchase of workstations & equipment', amount: -8500 },
      ],
      netInvestingCash: -8500,
      financingActivities: [
        { description: 'Bank loan repayments', amount: -5000 },
        { description: 'Owner distributions / dividends', amount: -10000 },
      ],
      netFinancingCash: -15000,
      netChangeInCash,
      openingCash,
      closingCash,
    };
  }

  // 6. Accounts Receivable & AP Aging (Section 60 & 61)
  getReceivables(): ReceivableItem[] {
    return this.invoices
      .filter((inv) => inv.remainingAmount > 0)
      .map((inv) => {
        const due = new Date(inv.dueDate);
        const now = new Date('2026-02-15');
        const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));

        let bucket: ReceivableItem['agingBucket'] = 'Current';
        if (diffDays > 90) bucket = '90+ Days';
        else if (diffDays > 60) bucket = '61–90 Days';
        else if (diffDays > 30) bucket = '31–60 Days';
        else if (diffDays > 0) bucket = '1–30 Days';

        return {
          id: inv.id,
          customer: inv.customerName,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          amount: inv.total,
          paidAmount: inv.paidAmount,
          remainingAmount: inv.remainingAmount,
          status: inv.status as any,
          agingBucket: bucket,
          daysOverdue: Math.max(0, diffDays),
        };
      });
  }

  getPayables(): PayableItem[] {
    return [...this.payables];
  }

  // 7. Invoices (Section 62)
  getInvoices(): Invoice[] {
    return [...this.invoices];
  }

  createInvoice(inv: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
    const newInv: Invoice = {
      ...inv,
      id: `inv_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.invoices.unshift(newInv);
    return newInv;
  }

  // 8. Inventory (Section 64)
  getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  adjustInventory(id: string, newQuantity: number): InventoryItem {
    const item = this.inventory.find((i) => i.id === id);
    if (!item) throw new Error(`Item ${id} not found`);
    item.quantity = newQuantity;
    item.totalCost = Math.round(item.quantity * item.purchasePrice * 100) / 100;
    item.inventoryValue = Math.round(item.quantity * item.sellingPrice * 100) / 100;
    return item;
  }

  // 9. Taxes (Section 65)
  getTaxes(): TaxConfiguration[] {
    return [...this.taxes];
  }

  // 10. Budget (Section 66)
  getBudgets(): BudgetItem[] {
    return [...this.budgets];
  }

  // 11. Financial Ratios (Section 67)
  getFinancialRatios(): FinancialRatiosData {
    const bs = this.getBalanceSheet();
    const inc = this.getIncomeStatement();

    const currentRatio = bs.totalCurrentLiabilities > 0
      ? Math.round((bs.totalCurrentAssets / bs.totalCurrentLiabilities) * 100) / 100
      : 0;

    const quickAssets = this.accounts
      .filter((a) => ['Cash', 'Bank', 'Accounts Receivable'].includes(a.subType))
      .reduce((sum, a) => sum + a.balance, 0);

    const quickRatio = bs.totalCurrentLiabilities > 0
      ? Math.round((quickAssets / bs.totalCurrentLiabilities) * 100) / 100
      : 0;

    const cashOnly = this.accounts
      .filter((a) => ['Cash', 'Bank'].includes(a.subType))
      .reduce((sum, a) => sum + a.balance, 0);

    const cashRatio = bs.totalCurrentLiabilities > 0
      ? Math.round((cashOnly / bs.totalCurrentLiabilities) * 100) / 100
      : 0;

    const grossMargin = inc.totalRevenue > 0
      ? Math.round((inc.grossProfit / inc.totalRevenue) * 10000) / 100
      : 0;

    const operatingMargin = inc.totalRevenue > 0
      ? Math.round((inc.operatingProfit / inc.totalRevenue) * 10000) / 100
      : 0;

    const netProfitMargin = inc.totalRevenue > 0
      ? Math.round((inc.netProfit / inc.totalRevenue) * 10000) / 100
      : 0;

    const roa = bs.totalAssets > 0
      ? Math.round((inc.netProfit / bs.totalAssets) * 10000) / 100
      : 0;

    const roe = bs.totalEquity > 0
      ? Math.round((inc.netProfit / bs.totalEquity) * 10000) / 100
      : 0;

    const debtToEquity = bs.totalEquity > 0
      ? Math.round((bs.totalLiabilities / bs.totalEquity) * 100) / 100
      : 0;

    const debtRatio = bs.totalAssets > 0
      ? Math.round((bs.totalLiabilities / bs.totalAssets) * 10000) / 100
      : 0;

    const inventoryAsset = this.accounts.find((a) => a.subType === 'Inventory')?.balance || 45000;
    const inventoryTurnover = inventoryAsset > 0
      ? Math.round((inc.totalCogs / inventoryAsset) * 100) / 100
      : 0;

    const arAsset = this.accounts.find((a) => a.subType === 'Accounts Receivable')?.balance || 32000;
    const receivablesTurnover = arAsset > 0
      ? Math.round((inc.totalRevenue / arAsset) * 100) / 100
      : 0;

    const assetTurnover = bs.totalAssets > 0
      ? Math.round((inc.totalRevenue / bs.totalAssets) * 100) / 100
      : 0;

    return {
      currentRatio,
      quickRatio,
      cashRatio,
      grossProfitMargin: grossMargin,
      operatingMargin,
      netProfitMargin,
      roa,
      roe,
      roi: roe,
      debtRatio,
      debtToEquityRatio: debtToEquity,
      inventoryTurnover,
      receivablesTurnover,
      assetTurnover,
    };
  }

  // 12. Google Sheets to Accounting Converter (Section 69)
  importSheetToAccounting(
    rows: Record<string, any>[],
    mapping: AccountingColumnMapping
  ): { importedEntriesCount: number; errors: string[] } {
    let imported = 0;
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const date = mapping.dateColumn ? String(row[mapping.dateColumn] || '') : new Date().toISOString().split('T')[0];
      const desc = mapping.descriptionColumn ? String(row[mapping.descriptionColumn] || '') : `Imported Sheet Row #${idx + 1}`;
      const revVal = mapping.revenueColumn ? parseFloat(String(row[mapping.revenueColumn]).replace(/[^0-9.-]/g, '')) : 0;
      const expVal = mapping.expenseColumn ? parseFloat(String(row[mapping.expenseColumn]).replace(/[^0-9.-]/g, '')) : 0;

      if (!isNaN(revVal) && revVal > 0) {
        try {
          this.createJournalEntry({
            date: date || '2026-02-01',
            description: desc || 'Revenue from spreadsheet',
            reference: `GSHEET-ROW-${idx + 1}`,
            currency: 'USD',
            status: 'Posted',
            lines: [
              { accountId: 'acc_1020', debit: revVal, credit: 0, description: 'Bank deposit' },
              { accountId: 'acc_4010', debit: 0, credit: revVal, description: 'Sales revenue recognized' },
            ],
          });
          imported++;
        } catch (e: any) {
          errors.push(`Row #${idx + 1}: ${e.message}`);
        }
      } else if (!isNaN(expVal) && expVal > 0) {
        try {
          this.createJournalEntry({
            date: date || '2026-02-01',
            description: desc || 'Expense from spreadsheet',
            reference: `GSHEET-ROW-${idx + 1}`,
            currency: 'USD',
            status: 'Posted',
            lines: [
              { accountId: 'acc_6080', debit: expVal, credit: 0, description: 'General operational expense' },
              { accountId: 'acc_1020', debit: 0, credit: expVal, description: 'Bank payment' },
            ],
          });
          imported++;
        } catch (e: any) {
          errors.push(`Row #${idx + 1}: ${e.message}`);
        }
      }
    });

    return { importedEntriesCount: imported, errors };
  }
}

export const accountingService = new AccountingService();
