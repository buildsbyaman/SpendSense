# SpendSense

A personal finance tracker that stores everything on your device. No accounts, no cloud, no data leaves your phone.

## Features

- **Local-first storage** -- all transactions, categories, budgets, and settings are saved on-device. No backend, no sign-up, no data sent anywhere.
- **Transaction management** -- add, edit, delete, and categorize every transaction. Tag expenses and income. Mark transactions as recurring.
- **Budget limits** -- set monthly or weekly spending limits per category. Get alerts when you approach or exceed a budget.
- **Spending alerts** -- configurable notifications when a transaction pushes you over a budget or when unusual spending is detected.
- **Custom categories** -- create, edit, rename, and color-code your own spending and income categories. Reorder them to match your habits.
- **Analytics dashboard** -- visual breakdown of spending by category, income vs expenses, monthly trends, and comparisons over time.
- **Multi-currency support** -- track transactions in different currencies with automatic or manual exchange rates. View totals in a single base currency.
- **Tag-based filtering** -- tag transactions with multiple labels, then filter and group by any tag across date ranges and categories.
- **Data export** -- export your complete financial data to CSV, JSON, or PDF. Filter by date range, category, transaction type, or tags before exporting.
- **Encrypted backup** -- export an encrypted backup of your entire database. Restore it on any device to pick up exactly where you left off.
- **Dark mode** -- toggle between light and dark themes. Your preference is saved locally.

## Export Formats

| Format | Use case |
|---|---|
| CSV | Open in Excel, Google Sheets, or any spreadsheet app |
| JSON | Machine-readable backup, data migration, API consumption |
| PDF | Printable statements, sharing with advisors, record-keeping |

Exports can be filtered by date range, category, transaction type, or tags before generation. All export happens locally and is shared via the OS share sheet.

## How It Works

Every transaction, budget, category, and setting is stored locally on your device using SQLite. There is no server, no API key, no cloud dependency. Your financial data stays with you.

Budget alerts are triggered locally when spending thresholds are crossed. Exchange rates can be fetched when online or set manually.

## Tech Stack

| Layer | Technology |
|---|---|
| Cross-platform framework | React Native 0.85 via Expo SDK 56 |
| Routing | Expo Router (file-based) |
| Styling | Tailwind CSS via Nativewind 4 |
| Icons | Lucide React Native |
| Local database | SQLite via expo-sqlite |
| Data export | Native file generation (CSV, JSON, PDF) |
| Notifications | expo-notifications for budget alerts |
| Language | TypeScript 6 (strict mode) |
| Animations | React Native Reanimated 4 |

Platforms: iOS, Android, Web

## Getting Started

```bash
npm install
npm run dev
```

Press `i` for iOS, `a` for Android, or `w` for web.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Expo dev server with cache cleared |
| `npm run ios` | Start and open in iOS simulator |
| `npm run android` | Start and open in Android emulator |
| `npm run web` | Start and open in browser |
| `npm run clean` | Remove build caches and node_modules |

## Project Structure

```
app/
  _layout.tsx                  Root layout (Stack + theme provider)
  (tabs)/
    _layout.tsx                Tab navigator
    index.tsx                  Home / spending summary
    transactions.tsx           Full transaction list
    analytics.tsx              Charts and breakdowns
    profile.tsx                Settings, export, preferences
  add-transaction.tsx          Modal for new transaction
  edit-transaction.tsx         Modal for editing a transaction
  budgets.tsx                  Budget limits per category
  categories.tsx               Custom category management
  export.tsx                   Export screen (format picker + filters)
  currency.tsx                 Multi-currency settings
  alert-settings.tsx           Spending alert configuration
  backup.tsx                   Encrypted backup and restore

components/
  layout/
    tab-bar.tsx                Bottom navigation bar
  ui/                          Reusable primitives (button, text, icon)
  charts/                      Analytics chart components
  transactions/                Transaction cards and list items
  budgets/                     Budget progress indicators

lib/
  theme.ts                     Light/dark theme definitions
  utils.ts                     cn() utility
  formatters.ts                Currency and date formatting
  validators.ts                Input validation helpers

storage/
  database.ts                  SQLite setup, migrations, queries
  transactions.ts              Transaction CRUD operations
  categories.ts                Category management
  budgets.ts                   Budget tracking and alerts
  subscriptions.ts             Subscription tracking
  export.ts                    CSV, JSON, PDF generation
  backup.ts                    Encrypted backup and restore
  settings.ts                  User preferences and config
```

## Navigation

Five-tab bottom bar with a centered "+" button for quick transaction entry:

| Tab | Icon | Purpose |
|---|---|---|
| Home | LayoutDashboard | Daily and weekly spending summary, quick stats |
| Transactions | ArrowUpDown | Full transaction list, search, filter, sort |
| Analytics | ChartPie | Category breakdown, income vs expenses, trends |
| Settings | Cog | Preferences, export, backup, categories, about |

## Theming

The app uses CSS custom properties defined in `app/global.css`. Both light and dark modes are fully specified. Every color, radius, shadow, and font token is mapped through `tailwind.config.js` and available as standard Tailwind utility classes.

Dark mode is toggled from Settings and persisted locally.

## Data Privacy

- All data is stored on-device only
- No accounts, no login, no registration
- No analytics SDKs or tracking
- Exports are generated locally and shared via the OS share sheet
- Encrypted backups use AES-256 with a user-provided password
- You control when and where your data leaves the device
