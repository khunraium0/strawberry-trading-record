# 🍓 Strawberry Trading Record

> **A modern, mobile-first web application designed for small strawberry farm owners and fruit traders to record daily harvest purchasing, wholesale selling, partner ledger tracking, and trading reports.**

---

## 📖 Project Overview

**Strawberry Trading Record** empowers agricultural business owners, strawberry growers, wholesale market buyers, and distributors to replace manual paper notebooks with an intuitive, mobile-optimized digital ledger.

The app supports:
- Morning harvest intake and grower purchase entries
- Market shipments, store delivery orders, and wholesale sales
- Automatic transaction total calculation (`Quantity × Unit Price`)
- Supplier and buyer classification with full order history ledgers
- Myanmar Kyat (`MMK` / `Ks`) currency formatting
- Extensible product catalog (pre-loaded with Strawberries Grade A/B, expandable to jams, dried fruit, or other produce)
- Complete reports with quantity movements and CSV export
- Dual-mode architecture: **Cloud Supabase PostgreSQL** with Row-Level Security (RLS) + **Instant Offline/Demo Browser Persistence**

---

## ✨ Features

### 1. 📊 Executive Dashboard
- **Financial Metrics**: Total sales revenue, total purchase cost, and trading cashflow difference.
- **Physical Quantities**: Total kilograms collected from farms and total kilograms delivered to buyers.
- **Partner Counters**: Active supplier and buyer count.
- **Date Filters**: Filter metrics by **Today**, **This Month**, **All Time**, or **Custom Date Range**.
- **Quick Action Bar**: One-tap buttons to immediately add purchases, sales, or customer partners.
- **Recent Transactions**: Real-time overview of the 5 most recent sales deliveries and purchase intakes.

### 2. 👥 Customer & Partner Management
- **Role Classification**:
  - **Suppliers**: Strawberry growers and farming partners.
  - **Buyers**: Bakeries, supermarkets, cafes, and wholesale market stalls.
  - **Both**: Flexible dual classification for partners who both supply raw fruit and buy packaged products.
- **Partner Ledger View**: View every historical purchase and sale associated with a specific customer, complete with sub-totals.
- **Contact Details**: Name, phone number with one-click call, address, and notes.
- **Search & Filter**: Search by name or phone; filter by role category.

### 3. 🍓 Product & Variety Catalog
- **Default Products**: Pre-seeded with *Fresh Strawberry (Grade A / Export)* and *Strawberry (Grade B / Processing)*.
- **Dynamic Schema**: Freely add new berries, fruits, or value-added goods (e.g. Strawberry Jam, Gift Boxes) without changing database schema.
- **Units of Measurement**: Standardized support for `Kg`, `Box`, `Pack`, `Basket`, `Viss`, `Crate`, and `Gram`.
- **Status Control**: Toggle varieties between active and archived.

### 4. 🛒 Purchase Management (Inflow / Expenses)
- Form fields: Supplier, Product, Date, Quantity, Unit, Price per Unit, Auto-calculated Total Amount, and Notes.
- Real-time client-side calculation: $\text{Total Amount} = \text{Quantity} \times \text{Price Per Unit}$.
- Strict input validation rejecting negative quantities or prices.
- Responsive design: interactive data table on desktop, tactile card list on mobile.
- Date, supplier, and product filters + sorting (newest/oldest) + pagination.

### 5. 📈 Sales Management (Outflow / Revenue)
- Form fields: Buyer, Product, Date, Quantity, Unit, Selling Price, Auto-calculated Total Amount, and Notes.
- Real-time client-side calculation: $\text{Total Amount} = \text{Quantity} \times \text{Selling Price Per Unit}$.
- View transaction details modal with complete calculation breakdown.
- Edit and delete actions with confirmation dialogs.

### 6. 📑 Reports & CSV Export
- Aggregated procurement expense and sales revenue for any selected date range.
- Breakdown of purchased and sold quantities by product variety.
- Summary of transaction counts and financial volumes by partner.
- One-click CSV export:
  - `Export Purchases to CSV`
  - `Export Sales to CSV`
  - `Export All Trading Ledger to CSV`
- **Accounting Integrity**: Explicit separation of Sales Revenue vs Purchase Expense; includes an accounting disclosure explaining that trading cashflow does not represent true net profit until cold storage, packaging, labor, and overheads are factored in.

### 7. 🔒 Authentication & Row Level Security (RLS)
- Supabase Auth integration (email + password).
- PostgreSQL Row-Level Security policies ensuring users can only read, write, edit, and delete their own business records.
- 1-Click Demo Mode available out of the box when Supabase environment variables are not yet configured.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) with strawberry theme palette |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15+ with RLS) |
| **State & Context** | React Context API (`AuthContext`, `ToastContext`) |
| **Testing** | [Vitest](https://vitest.dev/) |
| **Deployment Target** | [Vercel](https://vercel.com/) |

---

## 🚀 Installation & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `yarn`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/strawberry-trade-record.git
cd strawberry-trade-record
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

If you have a Supabase project, fill in:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

*(If left blank or with placeholders, the app automatically runs in local demo mode with persistent `localStorage` data).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser (toggle Device Mode with `F12` to preview mobile layouts).

### 4. Run Automated Tests
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## 🗄️ Supabase Cloud Database Setup

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account.
2. Click **New Project**, choose an organization, set a project name (e.g. `strawberry-trading`), and generate a database password.
3. Select a region close to your business users (e.g., `Singapore (ap-southeast-1)`).

### Step 2: Apply the Database Schema
1. Open your Supabase Dashboard.
2. Navigate to the **SQL Editor** tab from the left sidebar.
3. Click **New Query**.
4. Open the file [`supabase/schema.sql`](file:///c:/Users/acer/Desktop/Strawberry%20Trade%20Record/supabase/schema.sql) in this repository and copy its entire contents.
5. Paste the SQL script into the query editor and click **Run**.

The schema executes the following:
- Creates `profiles`, `customers`, `products`, `purchases`, and `sales` tables.
- Sets foreign keys with `ON DELETE CASCADE` on `auth.users`.
- Enables **Row Level Security (RLS)** on all tables.
- Creates granular RLS policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` filtered by `auth.uid() = user_id`.
- Sets up an automatic PostgreSQL trigger (`handle_new_user`) that auto-provisions a business profile and seeds default strawberry varieties whenever a new user signs up.

### Step 3: Retrieve API Credentials
1. In your Supabase Dashboard, go to **Project Settings** (gear icon) > **API**.
2. Find the **Project URL** and copy it into `VITE_SUPABASE_URL` in `.env`.
3. Under **Project API keys**, copy the **anon public** key into `VITE_SUPABASE_ANON_KEY` in `.env`.

> [!WARNING]
> Never put the `service_role` secret key in your `.env` or frontend code. Only use the public `anon` key.

---

## 🚢 Vercel Deployment Instructions

### Method A: Deploy via GitHub & Vercel Dashboard (Recommended)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Strawberry Trading Record web app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/strawberry-trade-record.git
   git push -u origin main
   ```

2. Log in to [Vercel](https://vercel.com/) and click **Add New...** > **Project**.
3. Import the `strawberry-trade-record` repository.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase Anon Key
5. Click **Deploy**. Vercel will build the Vite bundle and provide a live production URL with automated SSL.

### Method B: Deploy using Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```
Follow the interactive prompts, then promote to production:
```bash
vercel --prod
```

---

## 📁 Project Structure

```
Strawberry Trade Record/
├── .env.example               # Environment variables template
├── index.html                 # HTML entry point with mobile viewport & theme-color
├── package.json               # NPM scripts and dependencies
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Custom Tailwind color palette & typography
├── vite.config.js             # Vite bundler & Vitest configuration
├── supabase/
│   └── schema.sql             # PostgreSQL DDL, indexes, RLS policies, and triggers
└── src/
    ├── main.jsx               # React entry point with providers
    ├── App.jsx                # Main application component & routing
    ├── index.css              # Tailwind base styles and utility classes
    ├── context/
    │   ├── AuthContext.jsx    # Authentication & user profile context
    │   └── ToastContext.jsx   # Global toast notifications
    ├── services/
    │   ├── supabaseClient.js  # Supabase client initializer & config detection
    │   ├── localStore.js      # Persistent offline / demo storage layer
    │   ├── authService.js     # Sign in, sign up, session management
    │   ├── customerService.js # Customer & partner CRUD with ledger history
    │   ├── productService.js  # Product varieties CRUD
    │   ├── purchaseService.js # Purchase transaction CRUD with filters
    │   ├── salesService.js    # Sales transaction CRUD with filters
    │   └── reportService.js   # Analytics aggregation & CSV export
    ├── utils/
    │   ├── formatters.js      # MMK currency, quantity, date & CSV download utils
    │   └── validators.js      # Form input & calculation validators
    ├── components/
    │   ├── common/
    │   │   ├── Badge.jsx      # Role & status tags
    │   │   ├── ConfirmDialog.jsx # Modal confirmation for destructive deletes
    │   │   ├── DateFilter.jsx # Quick pills & custom date range filter
    │   │   ├── EmptyState.jsx # Visual empty state with call-to-action
    │   │   ├── Modal.jsx      # Accessible dialog overlay
    │   │   ├── StatCard.jsx   # KPI metric card
    │   │   └── SupabaseStatusBanner.jsx # Live Supabase vs Demo banner
    │   ├── forms/
    │   │   ├── CustomerForm.jsx # Add/edit partner form
    │   │   ├── ProductForm.jsx  # Add/edit product variety form
    │   │   ├── PurchaseForm.jsx # Purchase entry form with live total calculation
    │   │   └── SalesForm.jsx    # Sales entry form with live total calculation
    │   └── layout/
    │       ├── BottomNav.jsx  # Mobile-first fixed bottom navigation bar
    │       ├── Layout.jsx     # Master layout container
    │       ├── Navbar.jsx     # Top app header with user email & logout
    │       └── Sidebar.jsx    # Desktop collapsible navigation drawer
    ├── pages/
    │   ├── DashboardPage.jsx  # Executive KPIs, charts & quick actions
    │   ├── PurchasesPage.jsx  # Purchase records table, cards, and CRUD
    │   ├── SalesPage.jsx      # Sales records table, cards, and CRUD
    │   ├── CustomersPage.jsx  # Customer directory & transaction ledger
    │   ├── ProductsPage.jsx   # Product variety catalog & unit configuration
    │   ├── ReportsPage.jsx    # Financial overview, product movements & CSV export
    │   └── LoginPage.jsx      # Sign in, sign up & demo mode entry
    └── tests/
        └── trading.test.js    # Vitest test suite for calculation, CRUD & validation
```

---

## 🔒 Security Best Practices

1. **Row Level Security (RLS)**: Enforced directly on PostgreSQL inside Supabase. Even if a user attempts to query the database using the client SDK, PostgreSQL policies restrict access strictly to rows where `user_id = auth.uid()`.
2. **Key Isolation**: The `service_role` key is never exposed to the frontend or bundled in production.
3. **Form Validation**: Client-side validation guarantees that negative prices or quantities are rejected before any API request is sent.
4. **Destructive Action Safeguards**: Confirmation modals prevent accidental permanent deletion of partners or transaction entries.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
