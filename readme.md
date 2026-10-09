<p align="center">
  <img src="assets/images/favicon.png" alt="SpendSense" width="100" height="100" />
</p>

<h1 align="center">SpendSense</h1>

<p align="center">
  A local-first, private personal finance tracker for Android, iOS, and Web.
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.buildsbyaman.spendsense"><img src="https://img.shields.io/badge/Google_Play-SpendSense-34A853?logo=googleplay&logoColor=white" alt="Google Play" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/React_Native-0.85-61DAFB?logo=react&logoColor=black" alt="React Native" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/Expo-SDK_56-000020?logo=expo&logoColor=white" alt="Expo" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/buildsbyaman/SpendSense"><img src="https://img.shields.io/badge/SQLite-Local_First-003B57?logo=sqlite&logoColor=white" alt="SQLite" /></a>
</p>

---

## About

**SpendSense** is an offline-first expense tracker built with React Native and Expo. Every transaction, wallet balance, budget, and subscription is stored locally on your device in a SQLite database. 

- **100% Private:** No cloud accounts, no login, no background analytics, and no network requests.
- **Lightning Fast:** Instant local SQLite reads/writes with WAL mode.
- **Modern Design:** Smooth animations, gesture navigation, and sleek Dark & Light modes.

---

## Features

- **Multi-Wallet Management:** Track cash, bank accounts, and credit cards with balance auto-updates and wallet transfers.
- **Transactions & Budgets:** Categorize expenses/income, set monthly category limits, and get real-time over-budget warnings.
- **Subscription Tracker:** Manage recurring bills with automated renewal logging.
- **Analytics & Insights:** Interactive donut breakdowns, trend charts (daily/weekly/monthly), and savings rate tracking.
- **Biometric Security:** Secure your data with Face ID, Fingerprint, or Device PIN.
- **Import & Export:** Backup and restore anytime via JSON, Excel (`.xlsx`), or PDF.
- **Custom Currencies & Categories:** Support for custom symbols, exchange rates, and custom category icons.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) (v0.85) + [Expo SDK 56](https://expo.dev/) (Expo Router) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) via [NativeWind 4](https://www.nativewind.dev/) |
| **Database** | [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Async API, WAL mode) |
| **Animations & Gestures** | React Native Reanimated 4, Gesture Handler, react-native-worklets |
| **UI Components** | Radix / shadcn-inspired primitives via `@rn-primitives` & Lucide Icons |
| **Charts** | `react-native-gifted-charts` & `react-native-svg` |
| **Export/Import** | `jspdf`, `jspdf-autotable`, and `xlsx` (SheetJS) |

---

## 📄 License

Created by **[buildsbyaman](https://github.com/buildsbyaman)**. All rights reserved.
