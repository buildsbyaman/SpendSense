<p align="center">
  <img src="assets/images/favicon.png" alt="SpendSense" width="128" height="128" />
</p>

<h1 align="center">SpendSense</h1>

<p align="center">
  A personal finance tracker that stores everything on your device. Local-first and private.
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.buildsbyaman.spendsense"><img src="https://img.shields.io/badge/Google_Play-Get_SpendSense-34A853?logo=googleplay&logoColor=white" alt="Google Play" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/React_Native-blue?logo=react&logoColor=white" alt="React Native" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white" alt="Expo" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/Platforms-iOS%20%7C%20Android%20%7C%20Web-brightgreen" alt="Platforms" /></a>
</p>

---

## Download

SpendSense is available on Android via Google Play:

[![Get it on Google Play](https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png)](https://play.google.com/store/apps/details?id=com.buildsbyaman.spendsense)

---

## Overview

SpendSense is a local-first personal finance tracker built with React Native and Expo. Every transaction, budget, subscription, and setting lives in a SQLite database on your device. There is no server, no API key, no cloud dependency — you own your data. Features such as biometric screen locking keep your data private and safe, and can be turned on from Settings.

---

## Features

- **Local-first storage** -- all transactions, categories, budgets, and settings are saved on-device in SQLite. No backend, no sign-up, no data sent anywhere.
- **Swipe navigation** -- swipe left or right to move between Home, Transactions, Wallets, and Profile with a springy slide animation. Sub-screens slide up as overlays.
- **Multi-wallet support** -- create and manage multiple wallets (bank accounts, cash, credit cards, etc.). Set a default wallet. Balances update automatically as transactions are added. Move money between wallets with transfers.
- **Transaction management** -- add, edit, and delete income, expense, and transfer transactions. Assign each to a wallet, pick a category, and choose a date with quick selectors (today, yesterday, or a calendar).
- **Category filter** -- filter the transaction list by category chips, or tap a slice in the analytics donut chart to jump straight to that category.
- **Transfers** -- move money between two wallets in one step. Pick a From and To wallet; both balances update automatically, and transfers are excluded from income/expense totals, budgets, and analytics.
- **Budgets** -- set spending limits per category. Watch progress bars fill up in real time. Receive a warning when a transaction pushes you over budget.
- **Subscriptions** -- track recurring bills with a billing cycle (weekly, monthly, yearly) and next billing date. See upcoming obligations at a glance.
- **Custom categories** -- create, rename, and assign icons to your own spending and income categories. Drag to reorder them to match your habits.
- **Analytics dashboard** -- category donut chart, income vs. expenses with month-over-month deltas, savings rate, and a trend chart that switches between line and bar views with daily/weekly/monthly granularity. A month/year navigator lets you compare over time. Transfers are excluded from these figures.
- **Screen lock** -- lock the app behind Face ID, fingerprint, or your device PIN/pattern. SpendSense locks automatically whenever it leaves the screen and prompts to unlock on return.
- **Offline by default** -- no account, no sign-in, and no network requests of any kind.
- **Currency settings** -- choose from nine preset currencies or define a custom one. Provide a conversion rate to revalue all existing data in a single pass.
- **Import** -- bring in data from JSON, Excel (.xlsx), or a previously exported SpendSense PDF.
- **Export** -- export your data to PDF, JSON, or Excel (.xlsx). Select which tables to include, filter by date range and transaction type, and share via the OS share sheet.
- **Profile photo** -- set an avatar from your photo library, and choose whether it rides along in JSON exports.
- **Light and dark themes** -- toggle between a light and dark theme. Your preference is saved locally and restored on launch. The app follows the system setting by default.
- **Onboarding** -- a guided first-run flow sets up your name, currency, and profile avatar.
- **Demo data** -- load a realistic set of sample transactions, wallets, and budgets to explore the app before entering your own data.

---

## Navigation

A floating glass capsule bottom bar with four tabs and a centered "+" button for quick transaction entry. Swipe left/right anywhere in the content area to move between the four tabs.

| Tab          | Icon           | Purpose                                                                                                |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------ |
| Home         | Home           | Greeting, total balance, income vs. expenses, quick actions, recent activity                           |
| Transactions | ArrowRightLeft | Full transaction list with search, type filter (All/Expense/Income/Transfer), category chips, and sort |
| Add          | Plus           | Opens a bottom-sheet modal to create a new transaction                                                 |
| Wallets      | Wallet         | Create, edit, and delete wallets. Set a default wallet.                                                |
| Profile      | User           | Settings hub -- profile, dark mode, app lock, and the Manage section                                   |

### Sub-screens

Screens outside the four-tab row open as animated slide-up overlays and navigate back to where you came from:

| Access point     | Screens                                                              |
| ---------------- | -------------------------------------------------------------------- |
| Home quick links | Categories, Budgets, Subscriptions, Analytics (back returns to Home) |
| Profile → Manage | Currency Settings, Import, Export (back returns to Profile)    |

---

## Import and Export

### Supported formats

|            | JSON | Excel (.xlsx) |           PDF           |
| ---------- | :--: | :-----------: | :---------------------: |
| **Import** | Yes  |      Yes      | Yes (SpendSense format) |
| **Export** | Yes  |      Yes      |           Yes           |

### Export options

- Select which tables to include (Transactions, Budgets, Wallets, Subscriptions, Categories, etc.)
- Filter by date range (from, to, or both)
- Choose export format: PDF, JSON, or Excel (.xlsx)
- Transactions export includes a To Wallet column for transfers, so From/To links survive the export -> import round-trip
- All exports are generated locally and shared via the OS share sheet

---

## Tech Stack

| Layer                    | Technology                                                |
| ------------------------ | --------------------------------------------------------- |
| Cross-platform framework | React Native 0.85 via Expo SDK 56                         |
| Routing                  | Expo Router (file-based, typed routes)                    |
| Styling                  | Tailwind CSS 3.4 via NativeWind 4 (CSS custom properties) |
| UI primitives            | shadcn/ui style (new-york variant) via @rn-primitives     |
| Icons                    | Lucide React Native                                       |
| Local database           | SQLite via expo-sqlite (async API, WAL mode)              |
| Charts                   | react-native-gifted-charts, react-native-svg              |
| PDF generation           | jspdf + jspdf-autotable                                   |
| Excel handling           | xlsx (SheetJS)                                            |
| Drag and reorder         | react-native-draggable-flatlist                           |
| Toasts                   | react-native-toast-message                                |
| File picking             | expo-document-picker, expo-image-picker, expo-sharing     |
| Animations               | React Native Reanimated 4 + react-native-worklets         |
| Gestures                 | react-native-gesture-handler                              |
| Blur effects             | expo-blur                                                 |
| Biometrics               | expo-local-authentication                                 |
| Persistence              | @react-native-async-storage/async-storage                 |
| React                    | React 19 + React Native Web                               |
| Language                 | TypeScript 6 (strict mode)                                |
| Formatting               | Prettier with Tailwind CSS plugin                         |

---

## Architecture

SpendSense follows a **local-first, offline-only** pattern with no backend, no API, and no cloud dependency.

### State Management

A layered React Context architecture split by domain:

1. **`useAppCore`** (`context/state/core.ts`) -- Owns all `useState` hooks and refs for every data collection (accounts, transactions, categories, budgets, subscriptions, profile). Refs are re-synced on every render to avoid stale closures.

2. **Domain state hooks** (`context/state/useWalletsState.ts`, `useTransactionsState.ts`, etc.) -- Each receives the core and adds mutation callbacks (add/update/delete) that persist to SQLite and update state atomically.

3. **Higher-level hooks** (`context/hooks/useProfileState.ts`, `useDataManagement.ts`) -- Compose multiple domain hooks for operations like "update currency and convert all amounts" or "clear all data."

4. **`AppProvider`** (`context/AppContext.tsx`) -- Composes everything into a single React Context. On mount, it calls `loadInitialData()` which reads all tables, runs subscription auto-billing, and hydrates state in one pass.

### Data Access

- **`lib/database.ts`** -- Singleton database initialization with WAL mode and a sequential migration system (14 versions via `PRAGMA user_version`).
- **`lib/db/*`** -- Split by entity (account, transaction, category, profile, budget, subscription, reset). Each module exports async CRUD functions.
- **`lib/repository.ts`** -- Barrel re-export for clean imports.

### Theming

All colors, radii, shadows, and font tokens are defined as CSS custom properties in `global.css` with light/dark variants. `tailwind.config.js` maps every CSS variable to a Tailwind utility class. Theme is toggled via NativeWind's `useColorScheme()` and persisted to AsyncStorage.

---

## Database

SpendSense uses **SQLite** via `expo-sqlite` with an async API and WAL mode enabled for concurrent read performance.

### Tables

| Table                        | Purpose                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `accounts`                   | Wallets (bank, card, digital) with balance, type, default flag                                |
| `transactions`               | Income/expense/transfer records with amount, category, date, wallet FK, optional to-wallet FK |
| `profile`                    | Singleton row: name, currency symbol/code, avatar, onboarding state                           |
| `custom_categories`          | User-created categories with icon and color                                                   |
| `deleted_default_categories` | Tracks removed default category names                                                         |
| `category_order`             | JSON array of category names per type (expense/income)                                        |
| `wallet_order`               | JSON array of wallet IDs for drag-to-reorder                                                  |
| `budgets`                    | Per-category spending limits                                                                  |
| `subscriptions`              | Recurring bills with cycle, next billing date, optional end date                              |

### Migrations

The database uses a 14-version forward-only migration system tracked via `PRAGMA user_version`. New installations start at version 14. Existing installations migrate incrementally on launch. All migrations are idempotent, and a self-healing guard re-adds the `transactions.to_wallet_id` column on every launch if it is ever missing.

---

## Security

### Import Hardening

The import subsystem includes several protections against crafted or malicious files:

- **ZIP bomb protection** -- Uncompressed data is capped at 500 MB
- **Prototype pollution guards** -- Input is sanitized before processing
- **Row and column caps** -- 100,000 rows per table, 100 sheets max, 500,000 total rows
- **File size cap** -- Files up to 20 MB accepted
- **File type validation** -- Only JSON, Excel (.xlsx), and SpendSense PDF formats accepted

### App Lock

- Optional screen lock that uses the device's built-in authentication (Face ID, fingerprint, PIN, or pattern)
- Lock preference is stored in the OS secure store (`expo-secure-store`), never in the database
- SpendSense locks instantly when it leaves the foreground and re-prompts on return

### Data Privacy

- All data is stored on-device only
- No accounts, no login, no registration
- No analytics SDKs or tracking
- Fully offline by default -- the app makes no network requests
- Exports are generated locally and shared via the OS share sheet

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- Expo CLI (`npm install -g expo-cli`)
- Xcode (for iOS) or Android Studio (for Android)

### Install and run

```bash
git clone https://github.com/buildsbyaman/SpendSense.git
cd SpendSense
npm install
npm run dev
```

Press `i` for iOS, `a` for Android, or `w` for web.

---

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start Expo dev server with cache cleared |
| `npm run ios`     | Start and open in iOS simulator          |
| `npm run android` | Start and open in Android emulator       |
| `npm run web`     | Start and open in browser                |
| `npm run clean`   | Remove build caches and node_modules     |

---

## Environment Variables

| Variable               | Purpose                                                                                                        | Required      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ------------- |
| `EXPO_PUBLIC_DEV_MODE` | Set to `'1'` to enable developer tools (hidden demo data loading). Must be combined with `__DEV__` being true. | No (dev only) |

No API keys, backend URLs, or secrets are required at build time. The app makes no network requests of any kind.

---

## Dev Tools

A hidden developer tools menu is available behind a **5-tap gesture** on the Settings header title (Profile tab). It is guarded by both the `__DEV__` build flag and the `EXPO_PUBLIC_DEV_MODE` environment variable, so it never appears in production builds. When enabled it adds a **Load Demo Data** option below the Manage section.

---

## Deployment

### iOS

```bash
npx expo prebuild -p ios
# Then build via Xcode or EAS Build
```

### Android

```bash
npx expo prebuild -p android
# Then build via Android Studio or EAS Build
```

Package name: `com.buildsbyaman.spendsense`

### Web

```bash
npx expo export
```

Produces a static site suitable for any static host (Netlify, Vercel, GitHub Pages). The Metro config sets `output: "static"` and adds COOP/COEP headers required by jsPDF's `SharedArrayBuffer` usage. These headers must be configured at the hosting level.

---

## Project Structure

```
app/                              Expo Router file-based screens
  _layout.tsx                       Root stack layout (providers, theme, toast)
  +html.tsx                         Web HTML shell
  +not-found.tsx                    404 screen
  onboarding.tsx                    First-run setup flow
  currency.tsx                      Currency settings + conversion
  add-transaction.tsx               Bottom-sheet modal (create/edit transaction)
  add-wallet.tsx                    Bottom-sheet modal (new wallet)
  add-budget.tsx                    Bottom-sheet modal (new budget)
  add-subscription.tsx              Bottom-sheet modal (new subscription)
  (tabs)/                           Tab-navigated screens
    _layout.tsx                       Animated tab slot (swipe) + glass capsule bar
    index.tsx                         Home -- balance, income/expense, quick actions
    transactions.tsx                  Transaction list with search, filters, category chips
    wallets.tsx                       Wallet management
    profile.tsx                       Settings hub (profile, theme, app lock)
    analytics.tsx                     Charts and breakdowns (line/bar, granularity)
    subscriptions.tsx                 Recurring bill tracking
    budgets.tsx                       Per-category budget limits
    categories.tsx                    Custom category management
    import.tsx                        Import from JSON, Excel, or PDF
    export.tsx                        Export to PDF, JSON, or Excel

components/                       UI components organized by domain
  layout/                           tab-bar.tsx, animated-tab-slot.tsx
  ui/                               Shared primitives (Button, Text, Icon, Avatar, SlideSheet, ConfirmDialog, ToggleRow, AnimatedSegment, etc.)
  analytics/                        CategoryDonut, TrendChart, TrendBarChart, SummaryCards, GranularityToggle, ChartTypeToggle
  budgets/                          Budget item/list components
  categories/                       Category management components
  currency/                         Currency preset grid, custom form, conversion
  import/                           Import wizard components
  profile/                          ProfileCard, ManageSection, SettingsOptionsMenu, DevToolsSection
  subscriptions/                    SubscriptionItem
  transactions/                     TransactionItem, filter bar, type toggle, date pickers, form fields
  wallets/                          WalletItem, WalletList, WalletSelector, delete modal, options menu

lib/                              Core business logic and data layer
  database.ts                       SQLite setup, WAL mode, 14-version migration system
  db/                               Split data-access modules (9 files)
    index.ts                          Barrel re-export
    types.ts                          DB type alias
    account.ts                        CRUD for accounts (wallets)
    transaction.ts                    CRUD for transactions + reassignment helpers
    category.ts                       CRUD for custom categories, deleted defaults
    profile.ts                        Profile CRUD + currency conversion logic
    budget.ts                         CRUD for budgets
    subscription.ts                   CRUD for subscriptions
    reset.ts                          Full data wipe + demo data seeding
  repository.ts                     Barrel re-export of lib/db/*
  balance.ts                        Balance adjustment helpers
  billing.ts                        Subscription auto-billing engine (up to 24 charges)
  biometric.ts                      Device authentication (Face ID / fingerprint / PIN)
  id.ts                             Unique ID generator (timestamp + counter + crypto)
  seed-data.ts                      Deterministic demo data generator (PRNG, seed=42)
  subscriptionForm.ts               Subscription form helpers
  theme.ts                          Light/dark theme color definitions
  theme-persistence.ts              AsyncStorage-backed theme preference
  chart-theme.ts                    Chart color scheme
  dev-tools.ts                      Dev-only features (guarded by __DEV__ + env var)
  utils.ts                          cn() utility (clsx + tailwind-merge)
  export/                           Export subsystem (8 files + tables/)
    constants.ts                      Data type and format definitions
    formatters.ts                     Main export dispatcher (JSON/XLSX/PDF)
    formatters.web.ts                 Web-specific export path
    serialize.ts                      Serialization to JSON, XLSX bytes, PDF bytes
    share.native.ts                   OS share sheet integration (native)
    download.ts                       Download helpers
    tables/                           Table-specific export builders (9 files)
  import/                           Import subsystem (12 files + plans/)
    parse.ts                          JSON/XLSX/PDF parsers with security guards
    parseFile.ts                      File reading coordinator
    parsers.ts                        Parser dispatch
    readFile.ts                       File system reading
    merge.ts                          Import plan builder (merge/replace modes)
    apply.ts                          Import execution engine
    base64.ts                         Base64 utilities
    constants.ts                      Import constants
    pdfPayload.ts                     PDF payload encoding/decoding
    planStats.ts                      Import statistics calculation
    table-kind.ts                     Table type detection
    plans/                            Per-entity import plans (7 files)

utils/                            Domain types, helpers, and calculations
  transaction.ts                    Transaction interface, validation, search
  categories.ts                     Category icons, colors, keyword mapping (60+)
  wallet.ts                         Account interface, balance formatting
  subscription.ts                   Subscription interface, billing cycle math
  date.ts                           Date formatting helpers
  avatar.ts                         Avatar URI sanitization
  analytics/                        Analytics calculations (4 files)
    index.ts                          Barrel export
    filters.ts                        Transaction filtering (by month, year, type)
    format.ts                         Number/currency formatting
    series.ts                         Time series (daily, weekly, monthly, yearly)

context/                          React Context state management
  AppContext.tsx                     Central data store (all state + persistence)
  AppLockContext.tsx                 App-lock state (biometric lock on background)
  TabNavigationContext.tsx           Programmatic tab navigation
  types.ts                          AppContextType and UserProfile interfaces
  initSnapshot.ts                   Initial data loading + auto-billing on launch
  state/                            State management hooks (6 files)
    core.ts                             useAppCore -- all useState hooks + refs
    useCategoriesState.ts
    useWalletsState.ts
    useTransactionsState.ts
    useSubscriptionsState.ts
    useBudgetsState.ts
  hooks/                            Higher-level hooks (2 files)
    useProfileState.ts                  Profile update + currency conversion
    useDataManagement.ts                Refresh all, clear all, seed demo data

hooks/                            Shared custom hooks
  useAppState.ts                    App foreground/background lifecycle
  useBudgetWarning.ts               Budget over-spend detection
  useExpandAnimation.ts             Expand/collapse animation
  useModalAnimation.ts              Modal animation helpers
```

---

## Theming

The app uses CSS custom properties defined in `global.css`. Both light and dark modes are fully specified. Every color, radius, shadow, and font token is mapped through `tailwind.config.js` and available as standard Tailwind utility classes via NativeWind.

Dark mode is toggled from Settings and persisted locally via AsyncStorage. On launch the app reads the saved preference and applies it before the first render. The system color scheme is used as the default for new installations.

For the full UI/UX design system, see [`design.md`](design.md).

---

## Platforms

- iOS (requires Xcode)
- Android (requires Android Studio)
- Web (any modern browser)

---

## Testing

There is no testing infrastructure in the codebase. No test runner, test files, or testing libraries are configured. Code formatting is handled by Prettier with the Tailwind CSS plugin.

---

## License

This project is private and not currently licensed for distribution.
