import assert from 'node:assert/strict';
import { generateSeedData } from '@/lib/seed-data';
import { actions as storeActions } from '@/context/store/actions';
import { getState as getStoreState, resetState, setState } from '@/context/store/state';
import { useCategoriesState } from '@/context/state/useCategoriesState';
import { useWalletsState } from '@/context/state/useWalletsState';
import { useTransactionsState } from '@/context/state/useTransactionsState';
import { useSubscriptionsState } from '@/context/state/useSubscriptionsState';
import { useBudgetsState } from '@/context/state/useBudgetsState';
import { useProfileState } from '@/context/hooks/useProfileState';
import { useDataManagement } from '@/context/hooks/useDataManagement';

const seed = generateSeedData('$');

const initialState = {
  accounts: seed.wallets.map((wallet) => ({ ...wallet })),
  transactions: seed.transactions.map((transaction) => ({ ...transaction })),
  customCategories: [
    { id: 'custom-travel', name: 'Travel', type: 'expense', icon: 'Plane', color: '#0ea5e9' },
    { id: 'custom-bonus', name: 'Bonus', type: 'income', icon: 'Gift', color: '#22c55e' },
  ],
  deletedDefaultCategories: [],
  categoryOrder: { expense: ['Travel', 'Food'], income: [] },
  walletOrder: ['wallet-card', 'wallet-bank', 'wallet-digital'],
  userProfile: {
    name: 'Tester',
    currencySymbol: '$',
    currencyCode: 'USD',
    avatar: null,
    hasOnboarded: true,
  },
  budgets: [{ id: 'budget-food', category: 'Food', amount: 100 }],
  subscriptions: [
    {
      id: 'sub-existing',
      name: 'Existing',
      amount: 9.99,
      cycle: 'monthly',
      category: 'Entertainment',
      wallet_id: 'wallet-bank',
      next_billing_date: '2099-01-01T00:00:00.000Z',
      is_active: 1,
    },
  ],
  ready: true,
};

function createLegacyRuntime(initial) {
  let state = structuredClone(initial);
  let currentActions;

  const setter = (key) => (next) => {
    const previous = state[key];
    state = { ...state, [key]: typeof next === 'function' ? next(previous) : next };
  };

  const render = () => {
    const core = {
      accounts: state.accounts,
      setAccounts: setter('accounts'),
      accountsRef: { current: state.accounts },
      transactions: state.transactions,
      setTransactions: setter('transactions'),
      transactionsRef: { current: state.transactions },
      customCategories: state.customCategories,
      setCustomCategories: setter('customCategories'),
      deletedDefaultCategories: state.deletedDefaultCategories,
      setDeletedDefaultCategories: setter('deletedDefaultCategories'),
      categoryOrder: state.categoryOrder,
      setCategoryOrder: setter('categoryOrder'),
      walletOrder: state.walletOrder,
      setWalletOrder: setter('walletOrder'),
      userProfile: state.userProfile,
      setUserProfile: setter('userProfile'),
      budgets: state.budgets,
      setBudgets: setter('budgets'),
      subscriptions: state.subscriptions,
      setSubscriptions: setter('subscriptions'),
      ready: state.ready,
      setReady: setter('ready'),
    };

    const categories = useCategoriesState(core);
    const wallets = useWalletsState(core);
    const transactions = useTransactionsState(core);
    const subscriptions = useSubscriptionsState(core);
    const budgets = useBudgetsState(core);
    const profile = useProfileState({
      userProfile: state.userProfile,
      setUserProfile: core.setUserProfile,
      setAccounts: core.setAccounts,
      setTransactions: core.setTransactions,
      setBudgets: core.setBudgets,
      setSubscriptions: core.setSubscriptions,
    });
    const data = useDataManagement({
      setAccounts: core.setAccounts,
      setTransactions: core.setTransactions,
      setCustomCategories: core.setCustomCategories,
      setDeletedDefaultCategories: core.setDeletedDefaultCategories,
      setCategoryOrder: core.setCategoryOrder,
      setWalletOrder: core.setWalletOrder,
      setBudgets: core.setBudgets,
      setSubscriptions: core.setSubscriptions,
      setUserProfile: core.setUserProfile,
      userProfile: state.userProfile,
    });

    currentActions = {
      ...categories,
      ...wallets,
      ...transactions,
      ...subscriptions,
      ...budgets,
      ...profile,
      ...data,
    };
  };

  render();

  return {
    render,
    getState: () => state,
    getActions: () => currentActions,
  };
}

function createStoreRuntime() {
  resetState();
  setState(structuredClone(initialState));

  return {
    render: () => {},
    getState: getStoreState,
    getActions: () => storeActions,
  };
}

function buildSteps() {
  const context = {};

  return [
    {
      name: 'addTransaction',
      run: async ({ actions, getState }) => {
        await actions.addTransaction({
          title: 'Coffee',
          amount: 25.5,
          type: 'expense',
          category: 'Food',
          date: '2026-10-29T10:00:00.000Z',
          walletId: 'wallet-bank',
        });
        context.txId = getState().transactions.find((tx) => tx.title === 'Coffee').id;
      },
    },
    {
      name: 'updateTransaction',
      run: async ({ actions, getState }) => {
        const tx = getState().transactions.find((item) => item.id === context.txId);
        await actions.updateTransaction({
          ...tx,
          amount: 30,
          walletId: 'wallet-card',
          date: '2026-10-30T12:00:00.000Z',
        });
      },
    },
    {
      name: 'deleteTransaction',
      run: async ({ actions }) => {
        await actions.deleteTransaction(context.txId);
      },
    },
    {
      name: 'addWallet',
      run: async ({ actions, getState }) => {
        actions.addWallet({
          name: 'Test Wallet',
          number: '1234',
          balance: '$100.00',
          type: 'Bank',
        });
        context.walletId = getState().accounts.find((wallet) => wallet.name === 'Test Wallet').id;
      },
    },
    {
      name: 'updateWallet',
      run: async ({ actions, getState }) => {
        const wallet = getState().accounts.find((item) => item.id === context.walletId);
        actions.updateWallet({ ...wallet, name: 'Test Wallet 2', balance: '$150.00' });
      },
    },
    {
      name: 'deleteWallet',
      run: async ({ actions }) => {
        await actions.deleteWallet('wallet-card');
      },
    },
    {
      name: 'addCustomCategory',
      run: async ({ actions, getState }) => {
        actions.addCustomCategory({ name: 'Pets', type: 'expense', icon: 'Dog', color: '#f97316' });
        context.categoryId = getState().customCategories.find(
          (category) => category.name === 'Pets'
        ).id;
      },
    },
    {
      name: 'updateCustomCategory',
      run: async ({ actions, getState }) => {
        const category = getState().customCategories.find((item) => item.id === context.categoryId);
        await actions.updateCustomCategory({ ...category, name: 'Pet Care' }, 'Pets');
      },
    },
    {
      name: 'updateCategoryOrder',
      run: ({ actions }) => {
        actions.updateCategoryOrder('expense', ['Pet Care', 'Food', 'Shopping']);
      },
    },
    {
      name: 'deleteCustomCategory',
      run: async ({ actions }) => {
        await actions.deleteCustomCategory(context.categoryId);
      },
    },
    {
      name: 'deleteDefaultCategory',
      run: async ({ actions }) => {
        await actions.deleteDefaultCategory('Shopping');
      },
    },
    {
      name: 'addBudget',
      run: ({ actions, getState }) => {
        actions.addBudget({ category: 'Food', amount: 200 });
        context.budgetId = getState().budgets.find((budget) => budget.amount === 200).id;
      },
    },
    {
      name: 'updateBudget',
      run: ({ actions, getState }) => {
        const budget = getState().budgets.find((item) => item.id === context.budgetId);
        actions.updateBudget({ ...budget, amount: 250 });
      },
    },
    {
      name: 'deleteBudget',
      run: ({ actions }) => {
        actions.deleteBudget(context.budgetId);
      },
    },
    {
      name: 'addSubscription',
      run: async ({ actions, getState }) => {
        await actions.addSubscription({
          name: 'Gym',
          amount: 30,
          cycle: 'monthly',
          category: 'Medical',
          wallet_id: 'wallet-bank',
          next_billing_date: '2025-01-10T00:00:00.000Z',
          is_active: 1,
        });
        context.subscriptionId = getState().subscriptions.find((sub) => sub.name === 'Gym').id;
      },
    },
    {
      name: 'updateSubscription',
      run: async ({ actions, getState }) => {
        const subscription = getState().subscriptions.find(
          (item) => item.id === context.subscriptionId
        );
        await actions.updateSubscription({ ...subscription, amount: 35 });
      },
    },
    {
      name: 'deleteSubscription',
      run: ({ actions }) => {
        actions.deleteSubscription(context.subscriptionId);
      },
    },
    {
      name: 'updateUserProfile',
      run: async ({ actions, getState }) => {
        await actions.updateUserProfile({ ...getState().userProfile, name: 'Alex' });
      },
    },
    {
      name: 'completeOnboarding',
      run: async ({ actions }) => {
        await actions.completeOnboarding({ name: 'Alex', avatar: null });
      },
    },
    {
      name: 'updateCurrencyAndConvert',
      run: async ({ actions }) => {
        await actions.updateCurrencyAndConvert(0.9, '€', 'EUR', false);
      },
    },
    {
      name: 'updateWalletOrder',
      run: ({ actions, getState }) => {
        actions.updateWalletOrder(getState().accounts.map((wallet) => wallet.id));
      },
    },
    {
      name: 'clearAllData',
      run: ({ actions }) => {
        actions.clearAllData();
      },
    },
  ];
}

function sanitize(value) {
  return JSON.parse(JSON.stringify(value, (key, entry) => (key === 'ready' ? undefined : entry)));
}

async function runSequence(runtime) {
  const snapshots = [];

  for (const step of buildSteps()) {
    await step.run({ actions: runtime.getActions(), getState: runtime.getState });
    runtime.render();
    snapshots.push({ name: step.name, state: sanitize(runtime.getState()) });
  }

  return snapshots;
}

globalThis.__resetTestIds();
const legacySnapshots = await runSequence(createLegacyRuntime(initialState));

globalThis.__resetTestIds();
const storeSnapshots = await runSequence(createStoreRuntime());

assert.equal(storeSnapshots.length, legacySnapshots.length);

for (let index = 0; index < legacySnapshots.length; index += 1) {
  const legacy = legacySnapshots[index];
  const store = storeSnapshots[index];

  try {
    assert.deepStrictEqual(store.state, legacy.state);
  } catch (error) {
    console.error(`State mismatch after step: ${legacy.name}`);
    console.error('Legacy:', JSON.stringify(legacy.state, null, 2));
    console.error('Store:', JSON.stringify(store.state, null, 2));
    throw error;
  }
}

console.log(`Equivalence OK: ${legacySnapshots.length} action steps matched.`);
