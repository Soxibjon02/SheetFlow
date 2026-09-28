# SheetFlow — No-Code Google Sheets Analytics & Management Platform

**SheetFlow** is a production-grade, scalable SaaS platform that connects directly to Google Sheets, automatically profiles spreadsheet columns, performs advanced calculations through predefined functions without writing formulas or SQL, dynamically generates visual dashboards, and allows authorized users to manage spreadsheet rows directly.

---

## ⚡ Key Architectural Highlights

1. **Google Sheets Integration**:
   - **Mode A (Preview / Read)**: Paste any public Google Sheets URL to preview schema, sample rows, and data types without requiring immediate authentication.
   - **Mode B (Connected Sheet)**: Authorize via Google OAuth 2.0 with AES-256-GCM encrypted tokens for live read and write operations.
2. **Data Normalization & Type Detection**:
   - Ingests raw spreadsheet 2D arrays into normalized internal structures.
   - Detects `text`, `number`, `currency` ($, €, £, UZS), `percentage`, `date`, `datetime`, `boolean`, `category`, and `unknown` types.
   - Allows users to manually override detected column types via an inline dropdown.
3. **Standalone Calculation Engine & Central Function Registry**:
   - Independent pure TypeScript calculation engine with zero UI dependencies.
   - Supports 25+ functions across **Basic** (`SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA`, `MEDIAN`, `MODE`), **Conditional** (`COUNTIF`, `SUMIF`, `AVERAGEIF`), **Data** (`UNIQUE`, `DUPLICATES`, `EMPTY_VALUES`, `MISSING_VALUES`, `SORT`, `FILTER`), **Percentage** (`PERCENTAGE`, `GROWTH_PERCENTAGE`), **Date** (`TODAY`, `GROUP_BY_MONTH`, `GROUP_BY_YEAR`), and **Text**.
   - Supports multi-group breakdowns (e.g. `AVERAGE Score by City`).
   - Covered by a unit test suite with 100% pass rate.
4. **Automatic Data Analysis & Dashboard Generator**:
   - **Analyze Sheet**: Discovers summary metrics, detects null/duplicate records, and suggests tailored analytics widgets.
   - **Generate Dashboard**: Automatically converts columns into KPI cards, bar charts, trend lines, donut distribution charts, and ranking tables.
5. **Spreadsheet Management & Two-Way Sync**:
   - Spreadsheet preview grid with sticky headers, sorting, search filtering, and pagination.
   - **Add Row**, **Edit Row**, and **Delete Row** operations with instant feedback and Google Sheets sync.
6. **Reusable Template System**:
   - Pre-configured turnkey templates for **Education** (Student Performance, Attendance), **Business** (SaaS MRR, Operational Expenses), **Personal Budget**, and **Project Tasks** with 1-click instantiation.
7. **Executive Report Generation**:
   - Formatted reports with print-to-PDF layout and 1-click CSV export.
8. **Professional No-Code Accounting Module (Sections 53–71)**:
   - **Double-Entry Engine**: Strict validation requiring Total Debit = Total Credit before posting.
   - **Journal Entries & Audit Trail**: Draft, Posted, and Reversed (Storno contra entries) statuses with non-destructive history.
   - **General Ledger & Trial Balance**: Real-time account balances, debit/credit tallies, and automated discrepancy detection.
   - **Financial Statements**: Multi-step Income Statement (Gross, Operating, Pre-tax, Net Profit), Balance Sheet (Assets = Liabilities + Equity validation), and 3-tier Cash Flow statement.
   - **Invoicing & AR/AP Aging**: Line-item invoices, tax and discount engines, printable/PDF export, and 5-tier aging buckets (`Current`, `1–30`, `31–60`, `61–90`, `90+` days).
   - **Inventory, Taxes & Budgets**: COGS, stock valuation, multi-type configurable taxes (VAT, Sales Tax, Income Tax), and budget vs. actual variance analysis.
   - **Google Sheets Mapping**: Non-destructive column-to-ledger mapping engine.
9. **Macroeconomic & Econometric Module (Sections 72–86)**:
   - **Macroeconomic Dashboard**: GDP, GDP Growth, CPI Inflation, Policy Interest Rate, Trade Balance, Public Debt, and Stability Matrix.
   - **Growth & Deflators**: CAGR calculator, Real vs Nominal purchasing power deflator.
   - **Country Benchmark Comparisons**: Side-by-side economic benchmarking (e.g. Uzbekistan vs Kazakhstan) with leader badges.
   - **Pearson Correlation Analysis**: Linear regression, covariance, R-squared, and mandatory methodological notice: *"Correlation indicates statistical association and does not by itself establish causation."*
   - **Interactive Economic Models**: Break-Even Analysis, Price Elasticity of Demand, and Supply & Demand Equilibrium.
   - **Time-Series Forecasting**: 3-period trend projection with confidence intervals (+/-6%) and forecasting disclaimer.
10. **Internationalization & Modern UX**:
   - Dual language support: **English** and **O'zbekcha (Uzbek)** with 100% dictionary parity.
   - Dark mode & Light mode toggle with sleek glassmorphism aesthetics and Plus Jakarta Sans typography.

---

## 📁 Project Structure

```
├── api/                           # Vercel Serverless Functions entrypoint
│   └── index.ts                   # Route handler for /api/*
├── src/
│   ├── core/                      # Standalone Core Engines (Pure TypeScript)
│   │   ├── types/                 # Sheet, Calculation, Dashboard & Filter types
│   │   ├── detector/              # Data Type Detector & Cell Parser
│   │   ├── filter/                # Structured Filter Engine (AND, OR, NOT)
│   │   ├── calculations/          # Central Function Registry & Engine
│   │   │   ├── registry.ts        # Function definitions & calculation handlers
│   │   │   ├── engine.ts          # Calculation executor & formatter
│   │   │   └── engine.test.ts     # Vitest unit test suite (Section 45 & 46)
│   │   ├── analyzer/              # Automatic Sheet Analyzer & suggested analytics
│   │   ├── dashboard-generator/   # Automatic Dashboard Generator
│   │   ├── datasource/            # Generic IDataSource abstraction
│   │   ├── sample-data/           # Rich datasets for Education, SaaS & Expenses
│   │   └── templates/             # Reusable turnkey templates
│   ├── server/                    # Backend & Database Architecture
│   │   ├── db/
│   │   │   ├── schema.ts          # Drizzle ORM schema for Neon PostgreSQL
│   │   │   └── index.ts           # Neon client connection
│   │   ├── security/
│   │   │   ├── encryption.ts      # AES-256-GCM token encryption
│   │   │   └── auth.ts            # Scrypt password hashing & session tokens
│   │   ├── services/
│   │   │   └── googleSheets.ts    # Google OAuth 2.0 & Sheets API service
│   │   └── api/
│   │       ├── types.ts           # Standardized API response format
│   │       └── router.ts          # REST-style request router
│   ├── components/                # UI Components
│   │   ├── layout/                # Navbar, Sidebar, AppLayout
│   │   ├── spreadsheet/           # SpreadsheetGrid (sticky header, sorting, pagination)
│   │   ├── charts/                # Dynamic Recharts WidgetRenderer (KPI, Bar, Line, Donut)
│   │   ├── builder/               # No-Code FunctionBuilderModal
│   │   └── sheets/                # ConnectSheetModal
│   ├── pages/                     # Routed Application Pages
│   │   ├── dashboard/             # Main Overview Dashboard
│   │   ├── sheets/                # My Sheets & Sheet Detail View/Editor
│   │   ├── analytics/             # Sheet Analysis & Profiling
│   │   ├── calculations/          # Function Studio & Calculation History
│   │   ├── dashboards/            # Executive Visualizer & Dashboard Builder
│   │   ├── templates/             # Templates Gallery
│   │   ├── reports/               # Executive Summary Reports & PDF/CSV Export
│   │   └── settings/              # Profile, Google Account, Language & Theme
│   ├── services/                  # API Client & Browser Mock Fallback
│   ├── lib/                       # Auth, Theme, and i18n Context Providers
│   ├── App.tsx                    # React Router configuration
│   └── main.tsx                   # React root entry
├── .env.example                   # Environment variable templates
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Calculation Engine Tests
```bash
npx vitest run
```
*Executes all unit tests verifying `SUM`, `AVERAGE`, `MAX`, `MIN`, `COUNT`, `COUNTIF`, `SUMIF`, `AVERAGEIF`, `PERCENTAGE`, `GROWTH_PERCENTAGE`, `GroupBy`, data type detection, and filters.*

### 3. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to launch the platform. Out of the box, SheetFlow runs with interactive sample spreadsheets (Education, SaaS Revenue, Expenses) and local persistence, so you can test all features immediately without configuring credentials.

### 4. Build for Production
```bash
npm run build
```

---

## 🔐 Connecting Neon Database & Google Cloud OAuth

To connect to your own Neon PostgreSQL instance and Google Cloud Console:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure **Neon PostgreSQL**:
   - Create a free database at [neon.tech](https://neon.tech).
   - Set `DATABASE_URL=postgresql://user:password@endpoint.neon.tech/sheetflow?sslmode=require`.
3. Configure **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com).
   - Enable **Google Sheets API**.
   - Under **OAuth Consent Screen**, configure your application name and add scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Under **Credentials**, create an **OAuth 2.0 Client ID (Web Application)**:
     - Authorized JavaScript origins: `http://localhost:3000` and your Vercel URL.
     - Authorized redirect URIs: `http://localhost:3000/api/google/callback` and `https://your-domain.vercel.app/api/google/callback`.
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
4. Deploy to **Vercel**:
   - Connect the repository on Vercel.
   - Add the environment variables from `.env` in the Vercel project settings.
   - Vercel automatically deploys the frontend and the serverless functions in `/api`.
