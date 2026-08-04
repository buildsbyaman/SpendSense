import { type ExportedTable } from '@/lib/export/buildExportData';
import { type CustomCategory, type TransactionType } from '@/utils/transaction';
import { newId } from '@/lib/id';
import { type PlanContext } from './types';

export function processCategoriesTable(table: ExportedTable, ctx: PlanContext): void {
  const { plan, conflict, existingCats } = ctx;
  for (const row of table.rows) {
    const source = String(row['Source'] ?? '').trim();
    if (source !== 'Custom') continue;
    const typeStr = String(row['Type'] ?? '')
      .trim()
      .toLowerCase();
    const name = String(row['Name'] ?? '').trim();
    const colorStr = String(row['Color'] ?? '').trim();
    const iconStr = String(row['Icon'] ?? '').trim();
    // Type must be exactly 'income'/'expense' — anything else would break
    // type filtering, chart grouping, and the export round-trip.
    if (!name || (typeStr !== 'income' && typeStr !== 'expense')) {
      plan.categories.dropped++;
      continue;
    }

    const cat: CustomCategory = {
      id: newId(),
      name,
      type: typeStr as TransactionType,
      color: colorStr && colorStr !== '—' ? colorStr : undefined,
      icon: iconStr && iconStr !== '—' ? iconStr : undefined,
    };

    const existing = existingCats.find(
      (e) => e.name.toLowerCase() === cat.name.toLowerCase() && e.type === cat.type
    );
    if (existing) {
      if (conflict === 'overwrite') {
        const updated = { ...cat, id: existing.id };
        plan.categories.update.push(updated);
        existingCats.splice(existingCats.indexOf(existing), 1, updated);
      } else {
        plan.categories.skip++;
      }
    } else {
      plan.categories.insert.push(cat);
      existingCats.push(cat);
    }
  }
}
