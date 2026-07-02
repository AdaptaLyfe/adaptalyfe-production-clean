# Adaptalyfe — Tech Stack & Code Flow Reference

> Use this document to understand exactly how the app is wired together, where every folder lives, and how frontend talks to backend. Written for updating agent instructions or onboarding new developers.

---

## 1. Runtime Overview

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 18 |
| Language | TypeScript | 5.x |
| Build tool | Vite | 5.x |
| Styling | Tailwind CSS + custom CSS variables | 3.x |
| UI components | Radix UI / shadcn/ui | latest |
| Routing (frontend) | Wouter | 3.x |
| Server state | TanStack Query (React Query) | v5 |
| Forms | React Hook Form + Zod | latest |
| Icons | Lucide React | latest |
| Backend runtime | Node.js | 20.x |
| Backend framework | Express.js | 4.x |
| Database | PostgreSQL (Neon serverless) | 15 |
| ORM | Drizzle ORM | latest |
| Schema validation | Zod + drizzle-zod | latest |
| Session store | connect-pg-simple (PostgreSQL) | latest |
| Payments | Stripe | latest |
| Mobile wrapper | Capacitor | 5.x |
| Analytics | Firebase Analytics | 10.x |
| Hosting | Railway (production) | — |
| Dev server | Replit (same-port, single process) | — |

---

## 2. Root-Level File Map

```
/                           ← project root
├── client/                 ← ALL frontend code (React)
├── server/                 ← ALL backend code (Express)
├── shared/                 ← Types + DB schema shared by both
├── dist/                   ← Production build output (git-ignored in dev)
├── android/                ← Capacitor Android native project
├── ios/                    ← Capacitor iOS native project
│
├── vite.config.ts          ← Vite config (DO NOT EDIT — Replit managed)
├── tailwind.config.ts      ← Tailwind theme + dark mode config
├── drizzle.config.ts       ← Drizzle Kit config (DO NOT EDIT)
├── tsconfig.json           ← TypeScript config (root)
├── capacitor.config.ts     ← Capacitor app ID + splash screen settings
├── package.json            ← Dependencies + npm scripts (DO NOT EDIT)
└── replit.md               ← Project overview + agent preferences
```

---

## 3. How the Single Process Works

In **development** (Replit), one Node.js process runs everything:

```
npm run dev
  └── tsx server/index.ts
        ├── Express handles /api/* routes  (port 5000)
        └── Vite dev server handles everything else
              └── Serves client/src/* with HMR
```

In **production** (Railway), the build step runs first:

```
npm run build
  └── vite build → dist/public/   (static React bundle)

npm start
  └── node dist/index.js
        ├── Express handles /api/* routes
        └── Express serves dist/public/ as static files (catch-all → index.html)
```

**Key point:** There is no proxy. Backend and frontend share the same origin (`https://app.getadaptalyfeapp.com`). Vite's dev server is inserted into Express as middleware in development only (`server/vite.ts`).

---

## 4. Frontend Code Flow

### Entry point chain

```
client/index.html
  └── <script src="/src/main.tsx">
        ├── createRoot(#root)
        ├── Wraps app in <QueryClientProvider> + <TooltipProvider>
        ├── Detects platform (web / iOS / Android via Capacitor)
        ├── Applies platform CSS classes (android-native, ios-native)
        ├── Sets up Capacitor: StatusBar, Keyboard, back-button handler
        ├── Hides native splash screen after React first paint
        └── Renders <App />
```

### App.tsx — routing hub

```
client/src/App.tsx
  ├── Reads session token from localStorage (getSessionToken)
  ├── Redirects to /dashboard if already logged in and on auth page
  ├── Runs useSubscriptionEnforcement() globally (subscription gate)
  ├── Runs useFirebaseAnalytics() globally (tracks page views)
  └── <Switch> (Wouter router)
        ├── Public routes  → /  /login  /register  /pricing  /features  /privacy-policy
        ├── Invite routes  → /invite/:code  /accept-invitation  /mobile-accept-invitation
        ├── Protected (AuthCheck) → /dashboard  /tasks  /financial  /medical  etc.
        ├── Caregiver      → /caregiver-setup  /caregiver-dashboard
        ├── Admin (AdminCheck)       → /admin
        └── Super-Admin (SuperAdminCheck) → /super-admin  /admin-org-codes
```

### Page folder

```
client/src/pages/
  ├── landing.tsx               Public marketing page
  ├── login.tsx                 Login form → POST /api/login
  ├── register.tsx              Registration → POST /api/register
  ├── dashboard.tsx             Main logged-in view, shows all modules
  ├── daily-tasks.tsx           Task list → GET/POST/PATCH /api/daily-tasks
  ├── financial.tsx             Bills, budget → GET/POST /api/bills  /api/budgets
  ├── mood-tracking.tsx         Mood log → GET/POST /api/mood-entries
  ├── medical.tsx               Conditions, meds, contacts → /api/medical-*
  ├── meal-shopping.tsx         Meal plans + grocery list → /api/meal-plans
  ├── pharmacy.tsx              Pharmacy info → /api/pharmacy
  ├── academic-planner.tsx      Classes, assignments → /api/academic-*
  ├── skills-milestones.tsx     Independence skills builder
  ├── calendar.tsx              Appointments → /api/appointments
  ├── settings.tsx              User preferences → /api/user-preferences
  ├── subscription.tsx          Subscription plans + Stripe checkout
  ├── caregiver-setup.tsx       Care recipient manages caregivers
  ├── caregiver-dashboard.tsx   Caregiver views care recipient data
  ├── accept-invitation.tsx     Accept caregiver invite (web)
  ├── mobile-accept-invitation.tsx  Accept caregiver invite (native app)
  ├── sleep-tracking.tsx        Sleep log → /api/sleep-entries
  ├── resources.tsx             Community/personal resources
  ├── rewards.tsx               Gamification points + badges
  └── admin-dashboard.tsx       Internal admin panel
```

### Component folder

```
client/src/components/
  ├── AuthCheck.tsx             HOC — redirects to /login if no session
  ├── AdminCheck.tsx            HOC — redirects if not admin
  ├── SuperAdminCheck.tsx       HOC — redirects if not super-admin
  ├── navigation.tsx            Desktop top nav bar
  ├── simple-navigation.tsx     Simplified nav (used in most pages)
  ├── mobile-bottom-navigation.tsx  Bottom tab bar for mobile
  ├── caregiver-control-panel.tsx   Lock/unlock settings panel
  ├── ai-chatbot.tsx            AdaptAI chat window
  ├── subscription-banner.tsx   Subscription status banner
  ├── stripe-wrapper.tsx        Wraps Stripe Elements provider
  ├── error-boundary.tsx        React error boundary wrapper
  ├── loading-skeleton.tsx      Skeleton loaders
  └── ui/                       All shadcn/ui primitives (button, card, dialog, etc.)
```

### Hooks folder

```
client/src/hooks/
  ├── useSubscription.ts        Reads /api/user, returns subscription status
  ├── useFirebaseAnalytics.ts   Logs page views + events to Firebase
  ├── useNotifications.ts       Reads /api/notifications, marks as read
  ├── useMoodRequirement.ts     Checks if daily mood entry is needed
  ├── useDashboardLayout.ts     Persists drag-and-drop tile order
  ├── useAutoDemo.ts            Auto-populates demo data on first login
  ├── use-toast.ts              Toast notification hook (shadcn)
  └── useSafeRef.ts             Ref that won't cause memory leaks
```

### Lib folder

```
client/src/lib/
  ├── queryClient.ts            ← MOST IMPORTANT frontend file
  │     ├── apiRequest()        All POST/PUT/DELETE calls go through here
  │     ├── getQueryFn()        Default fetch function for all useQuery calls
  │     ├── queryClient         TanStack QueryClient singleton
  │     ├── getSessionToken()   Reads adaptalyfe_session_token from localStorage
  │     ├── setSessionToken()   Saves token to localStorage after login
  │     └── logout()            Calls /api/logout + clears localStorage token
  ├── firebase.ts               Firebase init + analytics helpers (trackSignUp etc.)
  ├── notifications.ts          Push notification utilities
  ├── apple-store-billing.ts    Apple StoreKit bridge (Capacitor)
  ├── google-play-billing.ts    Google Play Billing bridge (Capacitor)
  ├── offline.ts                Service worker offline cache helpers
  └── utils.ts                  cn() classname helper + misc utilities
```

### Path aliases (set in vite.config.ts)

| Import alias | Resolves to |
|---|---|
| `@/` | `client/src/` |
| `@shared/` | `shared/` |
| `@assets/` | `attached_assets/` |

---

## 5. Backend Code Flow

### Entry point chain

```
server/index.ts
  ├── Creates Express app
  ├── Applies security middleware (Helmet, CORS, rate limiters)
  ├── Registers raw body parser for /api/stripe/webhook FIRST
  ├── Registers express.json() + express.urlencoded()
  ├── Calls registerRoutes(app) → server/routes.ts
  ├── Calls initializeComprehensiveDemo() → server/demo-data.ts
  ├── In development: mounts Vite dev server → server/vite.ts
  └── In production: serves dist/public/ as static files
```

### Server folder

```
server/
  ├── index.ts          ← Entry point — middleware stack + server startup
  ├── routes.ts         ← ALL API endpoints (~6300 lines, single file)
  ├── storage.ts        ← ALL database operations (Drizzle ORM wrapper)
  ├── vite.ts           ← Vite middleware integration (DO NOT EDIT)
  ├── demo-data.ts      ← Seeds realistic demo data on first run
  ├── audit.ts          ← HIPAA audit logging middleware
  ├── task-reminder-service.ts  ← Cron-style reminder notifications
  ├── production.ts     ← Alternate entry for Railway (no Vite dependency)
  └── security-middleware.ts    ← Extra auth/permission checks
```

### How routes.ts is organized (top → bottom)

```
server/routes.ts sections (approximate line ranges):
  ~1–116      Session setup (connect-pg-simple, express-session)
  ~117–284    Health, Firebase config, debug endpoints
  ~284–600    Auth: /api/register  /api/login  /api/logout  /api/user
  ~600–1200   Daily tasks, notifications, user preferences
  ~1200–1800  Bills, budgets, income, financial tracking
  ~1800–2100  Subscription enforcement, caregiver access check
  ~2100–2450  Caregiver invitations, care relationships, locked settings
  ~2450–2600  Mood entries
  ~2600–3000  Medical: conditions, medications, allergies, emergency contacts
  ~3000–3300  Appointments, pharmacy
  ~3300–3600  Meal plans, shopping lists
  ~3600–3900  Academic planner, tasks, assignments
  ~3900–4200  Resources, rewards, sleep tracking
  ~4200–4275  Subscription payment enforcement gate
  ~4275–4600  Stripe: webhook, create-subscription, cancel, portal
  ~4600–5100  Apple App Store: verify-purchase, restore, notifications
  ~5100–5400  Google Play: verify-purchase, notifications (Pub/Sub)
  ~5400–5600  Admin endpoints (org codes, user management)
  ~5600–6200  Miscellaneous: documents, skill builder, wearables, voice
  ~6200+      Catch-all wildcard → serves index.html (SPA fallback)
```

---

## 6. Shared Schema (single source of truth)

```
shared/schema.ts          ← Drizzle table definitions + Zod insert schemas
shared/banking-schema.ts  ← Bank account + transaction table definitions
```

**Every database table is defined here.** Both the frontend and backend import types from this file. Nothing else should define DB types.

**Pattern for every table:**
```typescript
// 1. Drizzle table
export const myTable = pgTable("my_table", { ... });

// 2. Insert schema (Zod, used for validation)
export const insertMyTableSchema = createInsertSchema(myTable).omit({ id: true, createdAt: true });

// 3. Insert type
export type InsertMyTable = z.infer<typeof insertMyTableSchema>;

// 4. Select type (full row from DB)
export type MyTable = typeof myTable.$inferSelect;
```

### Key tables

| Table | Purpose |
|---|---|
| `users` | Accounts, subscription status, Stripe/Apple/Google IDs |
| `daily_tasks` | Task list items per user |
| `bills` | Bill tracking with payment website URLs |
| `mood_entries` | Daily mood log |
| `appointments` | Calendar events |
| `medications` | Med list, dosage, refill tracking |
| `care_relationships` | Links caregivers ↔ care recipients |
| `caregiver_invitations` | One-time invite codes |
| `caregiver_permissions` | Granular per-feature access controls |
| `locked_user_settings` | Caregiver-locked app settings |
| `meal_plans` + `shopping_list_items` | Meal planning |
| `academic_classes` + `assignments` | Academic planner |
| `sleep_entries` | Sleep tracking |
| `user_preferences` | Dashboard layout, theme, accessibility |
| `organization_codes` | Org partner codes for free access |

---

## 7. Database Connection

```
storage.ts
  └── import { db } from "./db"
        └── @neondatabase/serverless  ←  reads DATABASE_URL env var
              └── Neon PostgreSQL (same DB for dev and prod on Railway)
```

All DB operations go through `storage.ts`. Routes never query the DB directly — they always call `storage.*()` methods.

**storage.ts pattern:**
```typescript
async getUser(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || undefined;
}
```

---

## 8. Authentication Flow

### Login
```
Frontend: POST /api/login  { username, password }
  └── server validates credentials
  └── creates req.session (PostgreSQL session store)
  └── returns { sessionToken, user }
  └── Frontend: setSessionToken(token) → localStorage
```

### Every subsequent request
```
Frontend queryClient.ts:
  getAuthHeaders() → reads localStorage → adds  Authorization: Bearer <token>

Server session middleware:
  reads Bearer token → validates against sessions table → populates req.session.user
```

### Auth check on pages
```
<AuthCheck>  →  calls /api/user
  if 401 → redirects to /login
  if 200 → renders the protected page
```

### Session storage
- **Web browser:** `express-session` stores server-side, `localStorage` stores the token client-side
- **Mobile (Capacitor):** Same `localStorage` but persists across app restarts

---

## 9. How a Feature Request Flows End-to-End

Example: user marks a daily task complete.

```
1. User taps "Complete" button on daily-tasks.tsx

2. useMutation calls:
   apiRequest("PATCH", `/api/daily-tasks/${id}/complete`, { isCompleted: true })
   → queryClient.ts adds Authorization header
   → fetch('/api/daily-tasks/123/complete', { method: PATCH, ... })

3. Express router in routes.ts matches:
   app.patch("/api/daily-tasks/:id/complete", ...)
   → validates req.session.userId
   → calls storage.completeTask(id, userId)

4. storage.ts:
   await db.update(dailyTasks).set({ isCompleted: true }).where(eq(dailyTasks.id, id))

5. Route returns: res.json({ success: true, task: updatedTask })

6. onSuccess in useMutation:
   queryClient.invalidateQueries({ queryKey: ['/api/daily-tasks'] })
   → TanStack Query re-fetches the task list
   → UI re-renders with updated data
```

---

## 10. Subscription & Payment Flow

### Stripe (web)
```
/subscription page → choose plan
  → POST /api/create-subscription
  → Stripe creates PaymentIntent / Subscription
  → Client confirms with Stripe.js
  → Stripe calls /api/stripe/webhook (registered in Stripe Dashboard)
  → Webhook updates users.subscriptionStatus + subscriptionExpiresAt in DB
```

### Apple App Store (iOS)
```
ios/ Capacitor → StoreKit purchase
  → POST /api/apple/verify-purchase  { receiptData, productId }
  → Server verifies with Apple receipt API
  → Stores appleOriginalTransactionId on user
  → Apple calls /api/apple/notifications on each renewal
  → Server looks up user by originalTransactionId → updates DB
```

### Google Play (Android)
```
android/ Capacitor → Google Play Billing plugin
  → POST /api/google-play/verify-purchase  { purchaseToken, productId }
  → Stores googlePlayPurchaseToken on user
  → Google calls /api/google-play/notifications via Cloud Pub/Sub
  → Server looks up user by purchaseToken → updates DB
```

---

## 11. Caregiver Invitation Flow (fixed)

```
Care recipient (mom) opens caregiver-setup.tsx
  → POST /api/caregiver-invitations  { userName, relationship, ... }
  → DB: caregiver_invitations.caregiverId = mom.id  ← NOTE: field name is misleading,
                                                          this is actually care recipient's ID

Mom shares the 6-character code with the caregiver

Caregiver opens accept-invitation.tsx
  → GET /api/invitation/:code  (validates the code)
  → POST /api/accept-invitation  { invitationCode, userId: caregiver.id }
  → DB: care_relationships created with
        caregiverId = caregiver.id   (person who accepted)
        userId      = mom.id         (person who sent invite)
  → Redirect to /caregiver-dashboard

Caregiver dashboard:
  → GET /api/my-care-recipients  (returns all people linked to logged-in caregiver)
  → Shows real data for each linked care recipient

Mom manages access:
  caregiver-setup.tsx "Active Relationships" tab
  → GET /api/care-relationships/user/:id  (returns mom's caregivers)
  → "Manage Access" button opens dialog
  → DELETE /api/care-relationships/:id  (removes the relationship)
```

---

## 12. Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | server/db.ts | Neon PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | server/routes.ts | Stripe server-side API |
| `VITE_STRIPE_PUBLIC_KEY` | client (Vite prefix) | Stripe.js publishable key |
| `STRIPE_WEBHOOK_SECRET` | server/routes.ts | Verifies Stripe webhook signatures |
| `VITE_FIREBASE_API_KEY` | client/src/lib/firebase.ts | Firebase Analytics |
| `VITE_FIREBASE_PROJECT_ID` | client/src/lib/firebase.ts | Firebase project |
| `VITE_FIREBASE_APP_ID` | client/src/lib/firebase.ts | Firebase app identifier |
| `APPLE_SHARED_SECRET` | server/routes.ts | Apple receipt validation |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | server/routes.ts | Google Play API verification |
| `SESSION_SECRET` | server/index.ts | express-session signing key |

**VITE_ prefix** = available on the frontend (bundled at build time).  
**No VITE_ prefix** = server-only (never exposed to the browser).

---

## 13. Mobile App (Capacitor)

```
capacitor.config.ts   ← App ID: com.adaptalyfe.app, splash screen config

android/              ← Generated Android project (do not hand-edit)
  └── app/src/main/java/com/adaptalyfe/app/
        └── GooglePlayBillingPlugin.java   ← Custom Capacitor plugin for Play Billing

ios/                  ← Generated iOS project (do not hand-edit)
  └── App/App/Info.plist                   ← iOS permissions (camera, location, etc.)

To sync web changes to native:
  npx cap sync

To build Android: open android/ in Android Studio
To build iOS:     open ios/ in Xcode
```

The mobile apps are **the same React codebase** served inside a WebView. API calls go to `https://app.getadaptalyfeapp.com` in production. CORS allows `capacitor://localhost` and `https://localhost` origins.

---

## 14. Key Rules for Agents

1. **Never edit `vite.config.ts`, `drizzle.config.ts`, or `package.json`** — these are managed by the platform.

2. **All new database tables go in `shared/schema.ts`**, following the 4-step pattern (table → insertSchema → InsertType → SelectType).

3. **All DB queries go in `server/storage.ts`** — routes stay thin, call storage methods only.

4. **All API endpoints go in `server/routes.ts`** — one file, follow existing section ordering.

5. **Frontend API calls always use `apiRequest()` from `@/lib/queryClient`** — never raw `fetch()`.

6. **TanStack Query v5 syntax only** — `useQuery({ queryKey: [...] })`, not the old array form.

7. **After any mutation, invalidate the affected query keys** — `queryClient.invalidateQueries({ queryKey: [...] })`.

8. **Never hardcode user IDs** — always read from `req.session.user.id` (backend) or `/api/user` query (frontend).

9. **Environment secrets go through Replit's secret manager** — never write them into code files.

10. **VITE_ prefix required** for any env var that needs to be readable on the frontend.
