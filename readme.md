<p align="center">
  <img src="assets/images/favicon.png" alt="SpendSense" width="128" height="128" />
</p>

<h1 align="center">SpendSense</h1>

<p align="center">
  A personal finance tracker that stores everything on your device. No accounts, no cloud, no data leaves your phone.
</p>

<p align="center">
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/React_Native-blue?logo=react&logoColor=white" alt="React Native" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white" alt="Expo" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/Platforms-iOS%20%7C%20Android%20%7C%20Web-brightgreen" alt="Platforms" /></a>
</p>

---

## Overview

SpendSense is a local-first personal finance tracker built with React Native and Expo. Every transaction, budget, subscription, and setting lives in a SQLite database on your device. There is no server, no API key, no cloud dependency. You own your data.

---

## Features

- **Local-first storage** -- all transactions, categories, budgets, and settings are saved on-device in SQLite. No backend, no sign-up, no data sent anywhere.
- **Multi-wallet support** -- create and manage multiple wallets (bank accounts, cash, credit cards, etc.). Set a default wallet. Balances update automatically as transactions are added.
- **Transaction management** -- add, edit, and delete transactions. Assign each to a wallet, pick a category, and choose a date with quick selectors (today, yesterday, or a calendar).
- **Budgets** -- set spending limits per category. Watch progress bars fill up in real time. Receive a warning when a transaction pushes you over budget.
- **Subscriptions** -- track recurring bills with a billing cycle (weekly, monthly, yearly) and next billing date. See upcoming obligations at a glance.
- **Custom categories** -- create, rename, and assign icons to your own spending and income categories. Drag to reorder them to match your habits.
- **Analytics dashboard** -- category donut chart, monthly bar chart, income vs. expenses, savings rate, trend lines, and a month navigator to compare over time.
- **Currency settings** -- choose from nine preset currencies or define a custom one. Provide a conversion rate to revalue all existing data in a single pass.
- **Import** -- bring in data from JSON, Excel (.xlsx), or a previously exported SpendSense PDF.
- **Export** -- export your data to PDF, JSON, or Excel (.xlsx). Select which tables to include, filter by date range and transaction type, and share via the OS share sheet.
- **Light and dark themes** -- toggle between a light and dark theme. Your preference is saved locally and restored on launch. The app follows the system setting by default.
- **Onboarding** -- a guided first-run flow sets up your name, currency, and profile avatar.
- **Demo data** -- load a realistic set of sample transactions, wallets, and budgets to explore the app before entering your own data.

---

## Navigation

A five-tab bottom bar with a centered "+" button for quick transaction entry:

| Tab          | Icon            | Purpose                                                                                 |
| ------------ | --------------- | --------------------------------------------------------------------------------------- |
| Home         | LayoutDashboard | Welcome header, net balance, income vs. expenses, quick stats, link to analytics        |
| Transactions | ArrowUpDown     | Full transaction list with search, filter, and sort                                     |
| Add          | Plus            | Opens a bottom-sheet modal to create a new transaction                                  |
| Wallets      | Wallet          | Create, edit, and delete wallets. Set a default wallet.                                 |
| Profile      | User            | Settings hub -- manage subscriptions, categories, budgets, currency, import, and export |

Additional screens are reachable from the Profile tab (Manage section):

| Section           | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| Subscriptions     | View, add, and manage recurring bills                     |
| Categories        | Create, rename, reorder, and icon-pick custom categories  |
| Budgets           | Set per-category spending limits and monitor progress     |
| Currency Settings | Change your base currency and optionally revalue all data |
| Import            | Import data from JSON, Excel, or SpendSense PDF           |
| Export            | Export data to PDF, JSON, or Excel with filters           |

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
- Filter by transaction type (Expense, Income, or both)
- Filter by category
- All exports are generated locally and shared via the OS share sheet

---

## Tech Stack

| Layer                    | Technology                                                |
| ------------------------ | --------------------------------------------------------- |
| Cross-platform framework | React Native 0.85 via Expo SDK 56                         |
| Routing                  | Expo Router (file-based, typed routes)                    |
| Styling                  | Tailwind CSS 3.4 via NativeWind 4 (CSS custom properties) |
| Icons                    | Lucide React Native                                       |
| Local database           | SQLite via expo-sqlite                                    |
| Charts                   | react-native-gifted-charts, react-native-svg              |
| PDF generation           | jspdf + jspdf-autotable                                   |
| Excel handling           | xlsx (SheetJS)                                            |
| Drag and reorder         | react-native-draggable-flatlist                           |
| Toasts                   | react-native-toast-message                                |
| File picking             | expo-document-picker, expo-image-picker, expo-sharing     |
| Animations               | React Native Reanimated 4                                 |
| Language                 | TypeScript 6 (strict mode)                                |

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

## Project Structure

```
app/
  _layout.tsx                  Root stack layout + theme provider
  +html.tsx                    Web HTML shell
  +not-found.tsx               404 screen
  onboarding.tsx               First-run setup flow
  currency.tsx                 Currency settings + conversion
  add-transaction.tsx          Bottom-sheet modal for new/edit transaction
  add-wallet.tsx               Bottom-sheet modal for new wallet
  add-budget.tsx               Bottom-sheet modal for new budget
  add-subscription.tsx         Bottom-sheet modal for new subscription
  (tabs)/
    _layout.tsx                Animated tab slot + bottom bar
    index.tsx                  Home -- net balance, income/expense summary
    transactions.tsx           Transaction list, search, filter, sort
    wallets.tsx                Wallet management
    profile.tsx                Settings hub
    analytics.tsx              Charts and breakdowns
    subscriptions.tsx          Recurring bill tracking
    budgets.tsx                Per-category budget limits
    categories.tsx             Custom category management
    import.tsx                 Import from JSON, Excel, or PDF
    export.tsx                 Export to PDF, JSON, or Excel

components/
  layout/
    tab-bar.tsx                Bottom navigation bar
    animated-tab-slot.tsx      Tab screen transitions
  ui/                          Button, text, icon, header, avatar, etc.
  transactions/                TransactionItem, type toggle, date picker, filter bar
  wallets/                     WalletItem, WalletList, delete modal, options menu
  subscriptions/               SubscriptionItem
  analytics/                   CategoryDonut, MonthlyBarChart, TrendChart, SummaryCards
  profile/                     ManageSection, SettingsOptionsMenu

lib/
  database.ts                  SQLite setup, migrations, seed data
  repository.ts                Data access layer (CRUD for all tables)
  balance.ts                   Balance adjustment helpers
  id.ts                        Shared ID generator
  seed-data.ts                 Demo data generation
  theme.ts                     Light/dark theme definitions
  theme-persistence.ts         AsyncStorage-backed theme preference
  chart-theme.ts               Chart color scheme
  utils.ts                     cn() utility
  export/                      buildExportData, serialize, formatters, download, share
  import/                      parse, merge, apply

utils/
  transaction.ts               Transaction types, categories, validation
  wallet.ts                    Wallet types and helpers
  subscription.ts              Subscription types and helpers
  analytics.ts                 Savings rate and other calculations

context/
  AppContext.tsx                Central data store (all state + persistence)
  TabNavigationContext.tsx      Programmatic tab navigation
```

---

## Theming

The app uses CSS custom properties defined in `global.css`. Both light and dark modes are fully specified. Every color, radius, shadow, and font token is mapped through `tailwind.config.js` and available as standard Tailwind utility classes via NativeWind.

Dark mode is toggled from Settings and persisted locally via AsyncStorage. On launch the app reads the saved preference and applies it before the first render. The system color scheme is used as the default for new installations.

---

## Data Privacy

- All data is stored on-device only
- No accounts, no login, no registration
- No analytics SDKs or tracking
- Exports are generated locally and shared via the OS share sheet
- You control when and where your data leaves the device

---

## Platforms

- iOS (requires Xcode)
- Android (requires Android Studio)
- Web (any modern browser)

---

## License

This project is private and not currently licensed for distribution.