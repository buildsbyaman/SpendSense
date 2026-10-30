// The equivalence test only checks in-memory state transitions. Persistence is
// covered by the app's own SQLite paths, so every write here is a no-op.

const noop = async () => {};

export const clearAllData = noop;
export const convertCurrencyInDB = noop;
export const deleteAccount = noop;
export const deleteBudget = noop;
export const deleteCustomCategory = noop;
export const deleteSubscription = noop;
export const deleteTransaction = noop;
export const insertAccount = noop;
export const insertBudget = noop;
export const insertCustomCategory = noop;
export const insertDeletedDefaultCategory = noop;
export const insertSubscription = noop;
export const insertTransaction = noop;
export const reassignSubscriptionsCategory = noop;
export const reassignSubscriptionsWallet = noop;
export const reassignTransactionsCategory = noop;
export const reassignTransactionsWallet = noop;
export const saveCategoryOrder = noop;
export const saveProfile = noop;
export const saveWalletOrder = noop;
export const seedDemoData = noop;
export const setDefaultWallet = noop;
export const updateAccount = noop;
export const updateBudget = noop;
export const updateBudgetsCategory = noop;
export const updateSubscription = noop;
export const updateTransaction = noop;

export const fetchAccounts = async () => [];
export const fetchBudgets = async () => [];
export const fetchCategoryOrder = async () => null;
export const fetchCustomCategories = async () => [];
export const fetchDeletedDefaultCategories = async () => [];
export const fetchProfile = async () => null;
export const fetchSubscriptions = async () => [];
export const fetchTransactions = async () => [];
export const fetchWalletOrder = async () => null;
