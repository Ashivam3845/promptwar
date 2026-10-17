# GigSaathi AI — Multilingual AI Companion for India's Gig & Informal Workers

> **PromptWars MVP Edition — Extended with Sarvam Multilingual Voice & Document Intelligence**  
> Genuinely functional, mobile-first, and production-ready Next.js application built for delivery partners, cab drivers, and daily wage earners.

---

## 1. Product Overview & Key Features

GigSaathi AI addresses the economic and informational precarity faced by India's gig and unorganized workforce (Zomato/Swiggy delivery executives, Uber/Ola cab drivers, Blinkit/Zepto quick-commerce riders, construction workers):

1. **Multilingual Voice Assistant (`/assistant`) — Sarvam AI & OpenAI Hybrid**:
   - **Speech-to-Text (STT)**: Powered by Sarvam's **Saaras (`saaras:v4`)** model supporting English, Hindi, and Punjabi with code-mixed speech recognition.
   - **Human-in-the-Loop Review**: Workers review and edit transcriptions before sending, preventing accidental submissions.
   - **Conversational Intelligence**: Powered by OpenAI (`gpt-4o-mini`) with retrieval-augmented generation (RAG) over verified Indian welfare schemes and labor guidelines.
   - **Text-to-Speech (TTS)**: Spoken audio responses powered by Sarvam's **Bulbul (`bulbul:v4-flash`)** model with native Indic speakers (`sanchita_hi_assistant`, `harpreet_pa_narration`, `aparna_en_companion`). Features listen, loading, and stop playback controls.

2. **AI Document Intelligence (`/complaints`) — Sarvam Vision**:
   - **Deduction Statement & Screenshot OCR**: Upload pay statements, deduction screenshots, or penalty SMS (PNG, JPEG, WEBP, PDF up to 10MB).
   - **Candidate Field Extraction**: Extracts platform name, disputed penalty amount, reference date, and order/trip ID.
   - **Explicit User Confirmation**: Workers can review, correct, or reject extracted fields before transferring facts into the formal complaint generator.
   - **Grievance Generation**: Powered by OpenAI, generating a formal letter citing Natural Justice, Consumer Protection norms, and a checklist of supporting evidence.

3. **Deterministic Earnings & Expense Ledger (`/tracker`)**:
   - Accurately tracks **Base Gross**, **Incentives/Surge**, **Fuel/Charging Costs**, **Food & Vehicle Maintenance**, **Platform Cuts/Penalties**, and **Hours Worked**.
   - Formula:
     $$\text{Total Income} = \text{Gross} + \text{Incentives}$$
     $$\text{Total Expenses} = \text{Fuel} + \text{Other Expenses}$$
     $$\text{Net Take-Home} = \text{Total Income} - \text{Total Expenses} - \text{Platform Deductions}$$
     $$\text{Effective Hourly Rate} = \frac{\text{Net Income}}{\text{Hours Worked}} \quad (\text{when Hours} > 0)$$
   - Full validation against zero hours, negative monetary values, excessive daily hours (>24h), and future dates.
   - Live preview, add, edit, delete, and platform filtering.

4. **Dual Themes: Sunlight Outdoor Mode & Dark Navy Mode**:
   - **Sunlight Mode**: Ultra-high-contrast true white background (`#ffffff` / `#f8fafc`) and dark text (`#0f172a`) for delivery riders reading phones under direct sunlight.
   - **Dark Navy Mode**: Eye-resting dark navy (`#090e1a`) with glowing emerald accents (`#10b981`) for night shifts and battery conservation.
   - One-tap switch in the top navigation bar.

5. **Curated Welfare Schemes Knowledge Base (`/schemes`)**:
   - Official government sources:
     - **e-Shram Portal** (UAN 12-digit card, ₹2 Lakh PMSBY accidental insurance).
     - **Ayushman Bharat PM-JAY** (Cashless hospitalization up to ₹5 Lakh/family).
     - **Rajasthan Platform Based Gig Workers Welfare Board Act** (Statutory welfare fund & cess).
     - **PM Shram Yogi Maan-dhan (PM-SYM)** (₹3,000/month lifelong pension with 50% govt co-contribution).
     - **Delhi Motor Vehicle Aggregator Scheme** (Mandatory ₹5 Lakh on-duty accidental cover & ₹25k health cover).
     - **National Consumer Helpline (NCH 1915)** (Formal escalation for unfair deductions).
   - Searchable by keyword and filterable by State/Central jurisdiction. Includes eligibility, exclusions, verified benefits, application steps, and last-verified timestamps.

6. **User Authentication & Supervisor Admin Portal (`/login` & `/admin`)**:
   - Email + password sign up, log in, log out, email verification, and forgot/reset password, powered by **Supabase Auth** (cookie sessions via `@supabase/ssr`).
   - `src/proxy.ts` protects every page and API route: signed-out visitors are redirected to `/login?next=...` (APIs return `401`), and signed-in users are redirected away from `/login`.
   - **Default admin:** set `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run `npm run create-admin`. It creates a pre-confirmed admin account (or promotes an existing one) and is safe to re-run. Everyone else signs up from `/login` as a worker.
   - Admin role is read from Supabase `app_metadata` (users cannot self-assign it). To promote another user manually, run in the Supabase SQL editor:
     `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' WHERE email = 'you@example.com';`
   - Supervisor dashboard with aggregate network metrics, searchable worker directory, and audit dossiers of worker shifts and grievance letters.

---

## 2. Technology Stack & AI Division of Responsibilities

| Capability | AI Provider / Model | Rationale & Responsibility |
| :--- | :--- | :--- |
| **Speech-to-Text (STT)** | **Sarvam AI** (`saaras:v4`) | State-of-the-art Indic speech recognition for Hindi (`hi-IN`), Punjabi (`pa-IN`), and English (`en-IN`) with code-mixed vernacular support. |
| **Text-to-Speech (TTS)** | **Sarvam AI** (`bulbul:v4-flash`) | Natural Indic voice synthesis with verified persona speakers (`sanchita_hi_assistant`, `harpreet_pa_narration`, `aparna_en_companion`). |
| **Document Intelligence**| **Sarvam AI** (`sarvam-vision-v1`) | OCR and layout digitization of Indian delivery app screenshots, deduction slips, and invoices. |
| **Conversational Reasoning** | **OpenAI** (`gpt-4o-mini`) | Empathetic reasoning, context retrieval over verified government welfare schemes, and dignified worker advice. |
| **Complaint Structuring** | **OpenAI** (`gpt-4o-mini`) | Structured JSON legal letter drafting, grounds of natural justice, requested relief, and evidence checklist. |

---

### Performance & cost controls
- **Retrieval, not prompt stuffing**: `src/lib/schemeRetrieval.ts` picks the 1–3 schemes relevant to the question (precomputed, stemmed keyword index) and sends them as compact JSON in the reply language only. The chat prompt is 60–88% smaller than sending every scheme in all three languages.
- **Response caching**: one-off chat questions (such as the suggested-question buttons) and synthesised speech are cached in a small in-memory LRU (`src/lib/lruCache.ts`), so identical requests never pay for a second AI call.
- **Lean payloads**: speech is returned as raw audio bytes (about 25% smaller than base64 JSON), queries select only the columns the UI uses, admin queries are row-limited, and large screenshots are resized in the browser before upload.
- **Bounded latency**: provider calls time out after 30s, document jobs are polled with backoff, complaint output is capped at 1,500 tokens, and chat requests are cancelled if the user leaves the page.
- **No wasted work**: the proxy skips session verification for visitors without a session cookie, lists update from save results instead of being refetched, and totals and searches are memoized or precomputed.

## 3. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure the environment variables:
```env
# OpenAI Configuration (Conversational Reasoning & Complaint Structuring)
OPENAI_API_KEY=sk-proj-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini

# Sarvam AI Configuration (Multilingual Voice STT, TTS & Document Intelligence)
SARVAM_API_KEY=sk_your_sarvam_key_here

# Supabase Configuration (accounts and each user's own records)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
```

> **Security Note**: Never commit API keys to version control. Provider keys are read exclusively server-side via Next.js Route Handlers (`/api/voice/*`, `/api/documents/*`, `/api/chat`, `/api/complaints/*`) and are never exposed to the client browser.

---

## 4. Getting Started Locally

### Prerequisites
- Node.js >= 20
- npm >= 10

### Database setup (once)
Run the SQL files in `supabase/migrations/` **in filename order** in the Supabase SQL editor. They create the `profiles`, `earnings_records` and `complaint_drafts` tables with Row Level Security (each user can only read and write their own rows; admins get read-only access to everything).

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run checks
npm test            # vitest
npm run typecheck   # tsc --noEmit
npm run lint        # eslint

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
- Sarvam language mapping to BCP-47 (`hi-IN`, `pa-IN`, `en-IN`) and verified Bulbul speakers.
- Sarvam candidate field extraction regex from payment receipts.
- Route handler validation (missing files, empty texts, oversized files, unsupported formats).
- Deterministic earnings and effective hourly wage calculations.
- Handling of zero hours (prevents division by zero).
- Curated welfare schemes schema integrity and search filtering.

- New-user journey rules: a new account starts with zero records (no sample data), demo data stays under demo-only storage keys, admin role can only come from `app_metadata`, and a guest's draft survives sign-up.
- Supabase data mapping (insert vs update, derived fields, friendly error when migrations are missing).
- Proxy access rules (public, demo and account-only pages; `next=` redirects) and the anonymous API rate limit.
- API input validation: bad JSON, unsupported languages, oversized text and files, disallowed file types, and no provider error details leaking to clients.
- Translation completeness for the onboarding and dashboard strings in English, Hindi and Punjabi.

To run tests:
```bash
npm test
```

---

## 6. New User Journey

1. **Landing (`/`)**: what GigSaathi does, language picker, **Get Started**, **Try Demo**, and a direct link to Ask AI without signing up.
2. **Sign up or demo**: sign-up asks only for name, email and password. **Try Demo** opens the app with clearly labelled sample data that lives only in the browser and is never mixed with real accounts.
3. **Quick onboarding (`/onboarding`)**: language, work type, platform and state/city. Every step after language explains why it is asked and can be skipped.
4. **Personal dashboard (`/dashboard`)**: a new user sees a welcome and a prompt to log their first shift. No numbers are shown until they record their own shifts. Returning users see their real totals, recent shifts and saved complaint drafts.
5. **Choose a goal**: unfair deduction, real earnings, welfare schemes or voice help. Nothing forces a fixed order.
6. **Progressive access**: Ask AI, Schemes and complaint drafting work without an account (AI endpoints are rate-limited for guests). Saving a draft asks the guest to sign in, and the draft is restored afterwards.
7. **Return visits**: the session is restored, the saved language applies on every device, and saved drafts can be reopened from the dashboard.

| Access level | Pages |
| :--- | :--- |
| Anyone | `/`, `/assistant`, `/schemes`, `/complaints` (save needs an account), `/login` |
| Account or demo | `/dashboard`, `/tracker`, `/settings` |
| Account only | `/onboarding`, `/reset-password`, `/admin` (admins only) |

### Data deletion policy
- **Settings → Delete records** removes all of the user's shifts and complaint drafts immediately. The account remains.
- **Settings → Delete account** permanently deletes the login. Profile, shifts and drafts are removed with it through `ON DELETE CASCADE`. This requires `SUPABASE_SERVICE_ROLE_KEY` on the server.
- Chat conversations are kept only in the browser tab and are not stored.

## 7. Privacy & Ethics Considerations

- **Human-in-the-Loop Review**: Workers review and edit voice transcriptions before sending to the assistant.
- **Factual Integrity**: Extracting facts from a screenshot does not constitute a legal declaration that a penalty is unlawful. Facts are presented to the worker for explicit confirmation.
- **No False Submissions**: The app never claims a complaint was submitted to a company or government agency; it provides polished, editable representations for the worker to send.
- **Ephemerality**: Uploaded documents and audio buffers are processed in-memory and are not persistently stored on the server.
