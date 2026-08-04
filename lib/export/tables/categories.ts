import { type AppState, type ExportedTable } from './types';

export function buildCategoriesTable(customCats: AppState['customCategories']): ExportedTable {
  const rows: Record<string, string>[] = [];

  const defaults = [
    {
      type: 'Expense',
      names: [
        'Food',
        'Shopping',
        'Transport',
        'Bills',
        'Entertainment',
        'Medical',
        'Miscellaneous',
        'Others',
      ],
    },
    { type: 'Income', names: ['Salary', 'Business', 'Investment', 'Gift', 'Others'] },
  ];

  for (const d of defaults) {
    for (const name of d.names) {
      const custom = customCats.find(
        (c) => c.name.toLowerCase() === name.toLowerCase() && c.type === d.type.toLowerCase()
      );
      rows.push({
        Type: d.type,
        Name: name,
        Source: custom ? 'Custom' : 'Default',
        Color: custom?.color ?? '—',
        Icon: custom?.icon ?? '—',
      });
    }
  }

  for (const c of customCats) {
    const isDefault = defaults.some(
      (d) =>
        d.type.toLowerCase() === c.type &&
        d.names.some((n) => n.toLowerCase() === c.name.toLowerCase())
    );
    if (!isDefault) {
      rows.push({
        Type: c.type,
        Name: c.name,
        Source: 'Custom',
        Color: c.color ?? '—',
        Icon: c.icon ?? '—',
      });
    }
  }

  return { title: 'Categories', columns: ['Type', 'Name', 'Source', 'Color', 'Icon'], rows };
}

export function buildCategoryOrderTable(order: {
  expense: string[];
  income: string[];
}): ExportedTable {
  const rows: Record<string, string>[] = [];
  for (const name of order.expense) {
    rows.push({ Type: 'expense', Name: name });
  }
  for (const name of order.income) {
    rows.push({ Type: 'income', Name: name });
  }
  return { title: 'Category Order', columns: ['Type', 'Name'], rows };
}

export function buildHiddenCategoriesTable(deleted: string[]): ExportedTable {
  return {
    title: 'Hidden Categories',
    columns: ['Name'],
    rows: deleted.map((name) => ({ Name: name })),
  };
}
