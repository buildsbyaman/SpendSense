// Default category data without the lucide icon components.

const expense = [
  ['default-food', 'Food'],
  ['default-shopping', 'Shopping'],
  ['default-transport', 'Transport'],
  ['default-bills', 'Bills'],
  ['default-entertainment', 'Entertainment'],
  ['default-medical', 'Medical'],
  ['default-miscellaneous', 'Miscellaneous'],
  ['default-others-expense', 'Others'],
];

const income = [
  ['default-salary', 'Salary'],
  ['default-business', 'Business'],
  ['default-investment', 'Investment'],
  ['default-gift', 'Gift'],
  ['default-others-income', 'Others'],
];

const toCategory = ([id, name]) => ({ id, name, icon: null, color: '#000000' });

export const EXPENSE_CATEGORIES = expense.map(toCategory);
export const INCOME_CATEGORIES = income.map(toCategory);
export const DEFAULT_CATEGORY_NAMES = new Set(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((category) => category.name.toLowerCase())
);
export const TRANSFER_CATEGORY = 'Transfer';
