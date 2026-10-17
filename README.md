# GigSaathi AI — Multilingual AI Companion for India's Gig & Informal Workers

> **PromptWars MVP Edition**  
> Genuinely functional, mobile-first, and production-ready Next.js application built for delivery partners, cab drivers, and daily wage earners.

---

## 1. Product Overview & Key Features

GigSaathi AI addresses the harsh economic and informational precarity faced by India's gig and unorganized workforce (Zomato/Swiggy delivery executives, Uber/Ola cab drivers, Blinkit/Zepto quick-commerce riders, construction workers):

1. **Deterministic Earnings & Expense Ledger (`/tracker`)**:
   - Accurately tracks **Base Gross**, **Incentives/Surge**, **Fuel/Charging Costs**, **Food & Vehicle Maintenance**, **Platform Cuts/Penalties**, and **Hours Worked**.
   - Formula:
     $$\text{Total Income} = \text{Gross} + \text{Incentives}$$
     $$\text{Total Expenses} = \text{Fuel} + \text{Other Expenses}$$
     $$\text{Net Take-Home} = \text{Total Income} - \text{Total Expenses} - \text{Platform Deductions}$$
     $$\text{Effective Hourly Rate} = \frac{\text{Net Income}}{\text{Hours Worked}} \quad (\text{when Hours} > 0)$$
   - Full validation against zero hours, negative monetary values, excessive daily hours (>24h), and future dates.
   - Live preview, add, edit, delete, and platform filtering.

2. **Multilingual Interface & AI Assistant (`/assistant`)**:
   - Native support for **English (`en`)**, **Hindi (`hi`)**, and **Punjabi (`pa`)**.
   - Real-time conversation backed by OpenAI (`gpt-4o-mini` / configurable via `OPENAI_MODEL`).
   - Retrieval-augmented context using curated verified Indian government welfare schemes and labour regulations.
   - Sourced citation links for verified facts.
   - Plain language tailored for low-literacy users; explicit uncertainty handling; never fabricates legal citations or scheme rules.

3. **Curated Welfare Schemes Knowledge Base (`/schemes`)**:
   - Official government sources:
     - **e-Shram Portal** (UAN 12-digit card, ₹2 Lakh PMSBY accidental insurance).
     - **Ayushman Bharat PM-JAY** (Cashless hospitalization up to ₹5 Lakh/family).
     - **Rajasthan Platform Based Gig Workers Welfare Board Act** (Statutory welfare fund & cess).
     - **PM Shram Yogi Maan-dhan (PM-SYM)** (₹3,000/month lifelong pension with 50% govt co-contribution).
     - **Delhi Motor Vehicle Aggregator Scheme** (Mandatory ₹5 Lakh on-duty accidental cover & ₹25k health cover).
     - **National Consumer Helpline (NCH 1915)** (Formal escalation for unfair deductions).
   - Searchable by keyword and filterable by State/Central jurisdiction. Includes eligibility, exclusions, verified benefits, application steps, and last-verified timestamps.

4. **AI Grievance & Complaint Studio (`/complaints`)**:
   - Transforms informal descriptions of unfair penalties, wrongful ID block, or unpaid tips into formal, legally sound representation letters.
   - Structured JSON response from OpenAI:
     - Clear Subject Line
     - Formal Letter Body
     - Summary of Key Facts
     - Grounds for Relief & Natural Justice
     - Specific Demands / Requested Relief
     - Recommended Supporting Evidence Checklist
   - One-click copy to clipboard, editable textarea, and local saved drafts history.

5. **Settings & Profile (`/settings`)**:
   - Language switcher, worker profile preferences, data management, and sample data reset.

---

## 2. Technology Stack & Architecture

- **Framework**: Next.js 16 (App Router, Turbopack, TypeScript)
- **Styling**: Tailwind CSS 4 with custom dark navy palette (`#090e1a`, `#0f172a`), emerald accents (`#10b981`), high-contrast accessible controls
- **Icons**: Lucide React
- **AI Engine**: Official `openai` Node.js SDK
- **Database / Persistence**:
  - Dual-mode architecture:
    1. **Production**: Supabase PostgreSQL with Row Level Security (RLS) policies and migrations in `/supabase/migrations`.
    2. **Local Demo Mode**: Resilient client-side storage with pre-populated real-world demo shift records and sample grievance letters.
- **Testing**: Vitest automated unit and route validation test suite.

---

## 3. Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure the environment variables:
```env
# OpenAI Configuration (Required for live AI chat & letter generation)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Supabase Configuration (Optional for cloud sync; local demo mode works out-of-the-box)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
```

> **Security Note**: Never commit `.env.local` to Git. Private credentials and API keys are strictly loaded on the server side via Route Handlers and never exposed to the client browser.

---

## 4. Getting Started Locally

### Prerequisites
- Node.js >= 20
- npm >= 10

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npx vitest run

# 3. Start local development server
npm run dev

# 4. Open in browser
http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
```

---

## 5. Automated Tests

The test suite validates:
- Deterministic net earnings and effective hourly wage calculations.
- Handling of zero hours (prevents division by zero).
- Input validation (date bounds, non-negative monetary constraints, max daily hours).
- Curated welfare schemes schema integrity and search filtering.
- Route handler payload validation and error responses for missing keys.

To run tests:
```bash
npx vitest run
```

---

## 6. Database Migrations (Supabase PostgreSQL)

Full SQL migration is located in `supabase/migrations/20261017_init_gigsaathi.sql`:
- `profiles`: User language preference, platform, and city.
- `earnings_records`: Shift records with `GENERATED ALWAYS AS` deterministic stored column for `net_earnings`.
- `complaint_drafts`: Saved grievance letters with JSONB structured arrays.
- Complete Row Level Security (RLS) policies isolating user records via `auth.uid() = user_id`.

---

## 7. Demo Script for Hackathon Judges

1. **Step 1: Dashboard Overview (`/`)**
   - Point out the dark navy mobile-first command center.
   - Showcase KPI cards: Net Take-Home (₹) vs False App Gross, Fuel Expenses, Platform Deductions, and Effective Hourly Rate.
   - Switch language to **हिन्दी** and **ਪੰਜਾਬੀ** in the header to demonstrate instant i18n adaptation.
2. **Step 2: Earnings Tracker (`/tracker`)**
   - Click **Log New Shift**.
   - Input: Gross ₹1,200, Bonus ₹300, Fuel ₹200, Maintenance ₹50, Deduction ₹50, Hours Worked 8.
   - Observe live deterministic preview: Net ₹1,200, Rate ₹150/hr.
   - Save the record; observe updated totals and entry in the ledger.
3. **Step 3: Welfare Schemes (`/schemes`)**
   - Search for "e-Shram" or filter by "Rajasthan".
   - Highlight official government URLs, eligibility, exclusions, and last-verified timestamps.
4. **Step 4: AI Assistant (`/assistant`)**
   - Click a suggested question chip (e.g. *Rain delay deduction dispute* or *e-Shram accident cover*).
   - Show how the AI references verified government sources with clickable links.
5. **Step 5: Grievance Studio (`/complaints`)**
   - Review the generated formal letter complete with facts, legal grounds under Natural Justice, and demanded relief.
   - Demonstrate the **Copy to Clipboard** button ready for email or NCH 1915 escalation.
