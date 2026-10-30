# Phase 5 action audit (pre-store migration)

This document records the ordering and error behaviour of every action in the
current `AppContext` implementation. The store migration (5.1b) must preserve
these semantics unless a change is called out in the Phase 5 plan.

General rules observed today:

- Most actions update in-memory state first and then write to SQLite. A failed
  database write rejects the action but leaves the optimistic state in place;
  there is no rollback.
- Category deletion and category rename are the exception: they write to the
  database first and update state afterwards.
- Fire-and-forget database writes (no `await`) have no error handling and no
  rollback. A rejection is unhandled.
- No action uses a database transaction except `deleteWallet` (account update +
  delete) and `loadInitialData` (auto-billing).
- Async actions currently close over render-time state, so a value read after
  an `await` can be stale. The store version must use a functional `setState`
  or re-read `getState()` after every `await`.

## Categories (`useCategoriesState`)

### `addCustomCategory(catData)`

1. Reads `customCategories` from the render snapshot and skips when a
   case-insensitive name already exists for the same type.
2. Appends the new category to state.
3. Fires `insertCustomCategory` without awaiting.

Error behaviour: no rollback; the insert rejection is unhandled. State keeps
the category.

### `updateCustomCategory(updatedCat, oldName?)`

1. When the name changed:
   - `await reassignTransactionsCategory(oldName, newName)`
   - `await reassignSubscriptionsCategory(oldName, newName)`
   - `await updateBudgetsCategory(oldName, newName)`
   - then rename the category in transactions, budgets, and subscriptions state.
   - When a saved order exists for the type, save and set the renamed order.
   - When the old name was a default, `await insertDeletedDefaultCategory(oldName)`
     and then append the name to `deletedDefaultCategories`.
2. Replace the custom category in state.
3. `await insertCustomCategory(updatedCat)`.

Error behaviour: database-first for the rename. If an early await rejects, no
state rename happens, but earlier database writes are not rolled back. If a
later await rejects after state updates, those state updates remain. The error
propagates to the caller.

### `deleteCustomCategory(id)`

1. Look up the category from the render snapshot.
2. `await reassignTransactionsCategory(name, 'Others')`
3. `await updateBudgetsCategory(name, 'Others')`
4. `await repoDeleteCustomCategory(id)`
5. Update transactions and budgets state to `Others`, then remove the category
   from state.

Error behaviour: database-first. A rejection before step 5 leaves state
unchanged, but earlier database writes remain. No rollback. The error
propagates to the caller.

### `deleteDefaultCategory(name)`

1. `await reassignTransactionsCategory(name, 'Others')`
2. `await updateBudgetsCategory(name, 'Others')`
3. Update transactions and budgets state to `Others`.
4. `await insertDeletedDefaultCategory(name)`
5. Append `name` to `deletedDefaultCategories`.

Error behaviour: if step 4 rejects, transactions and budgets already point at
`Others` in state and the default is still visible. No rollback. The error
propagates to the caller.

### `updateCategoryOrder(type, order)`

1. Set `categoryOrder[type]` in state.
2. Fire `saveCategoryOrder(type, order)` without awaiting.

Error behaviour: no rollback; the save rejection is unhandled.

## Wallets (`useWalletsState`)

### `updateWalletOrder(order)`

1. Set `walletOrder` in state.
2. Fire `saveWalletOrder(order)` without awaiting.

Error behaviour: no rollback; the save rejection is unhandled.

### `addWallet(walletData)`

1. Reads `accountsRef.current` to decide `isDefault` (first wallet).
2. Appends the wallet to state.
3. Fires `insertAccount` without awaiting.

Error behaviour: no rollback; the insert rejection is unhandled.

### `updateWallet(updated)`

1. Replace the wallet in state.
2. Fire `updateAccount` without awaiting.

Error behaviour: no rollback; the update rejection is unhandled.

### `deleteWallet(id)` (async)

1. Read `accountsRef.current`; return `{ blocked: false }` when missing and
   `{ blocked: true }` when it is the only wallet, with no state changes.
2. Pick the default target (another default, else the first remaining wallet).
3. Reassign `walletId` / `toWalletId` in transactions state and `wallet_id` in
   subscriptions state.
4. `await reassignTransactionsWallet(id, targetId)`
5. `await reassignSubscriptionsWallet(id, targetId)`
6. Compute new accounts from the pre-await `current` snapshot, including the
   deleted wallet's balance moved to the target and default reassignment.
7. Set accounts state.
8. `await` a SQLite transaction that updates the target account and deletes the
   wallet.
9. Update `walletOrder` with a functional setter, filtering out the deleted id,
   and fire `saveWalletOrder` without awaiting.
10. Return `{ blocked: false, newDefaultName }` when the deleted wallet was the
    default.

Error behaviour: steps 4-5 can reject after step 3 already changed state, and
step 8 can reject after step 7 changed accounts. No rollback. The error
propagates to the caller. Step 6 uses a pre-await snapshot today; the store
version must recompute from the post-await state.

### `setDefaultWallet(id)`

1. Mark the wallet as default in state.
2. Fire `repoSetDefaultWallet(id)` without awaiting.

Error behaviour: no rollback; the save rejection is unhandled.

## Transactions (`useTransactionsState`)

### `addTransaction(txData)`

1. Create the transaction with a new id.
2. Insert it into transactions state in date order.
3. Compute balance deltas from the transaction and the `accountsRef` snapshot.
4. Set accounts state with adjusted balances.
5. `await insertTransaction(newTx)`
6. Sequentially `await updateAccount` for each adjusted account.

Error behaviour: state is committed before any database write. A rejection in
steps 5-6 leaves state updated and propagates to the caller. No rollback.

### `deleteTransaction(id)`

1. Read `accountsRef.current` and `transactionsRef.current`.
2. If the transaction exists, compute reverse deltas and set accounts state.
3. Remove the transaction from state.
4. `await repoDeleteTransaction(id)`
5. Sequentially `await updateAccount` for each adjusted account.

Error behaviour: state is committed before any database write. A rejection
leaves state updated and propagates to the caller. No rollback.

### `updateTransaction(updated)`

1. Read accounts and transactions refs.
2. When the old transaction exists, net the reversed old deltas against the
   applied new deltas and set accounts state.
3. Replace the transaction in date order in state.
4. `await updateTransaction(updated)`
5. Sequentially `await updateAccount` for each changed account.

Error behaviour: state is committed before any database write. A rejection
leaves state updated and propagates to the caller. No rollback.

## Subscriptions (`useSubscriptionsState`)

### `addSubscription(subData)`

1. Create the subscription with a new id.
2. Compute billing from the render-time `accounts` slice and currency symbol.
3. For each generated transaction: prepend it to transactions state, then
   `await insertTransaction`.
4. When an account changed: update accounts state, then `await updateAccount`.
5. When transactions were generated, set `next_billing_date`.
6. Append the subscription to state.
7. `await insertSubscription`.

Error behaviour: no rollback. A rejection leaves earlier transactions and
account changes in state (and database) but skips later steps. The error
propagates to the caller.

### `updateSubscription(updated)`

Same flow as `addSubscription`, ending with replacing the subscription in state
and `await repoUpdateSubscription`. No rollback; errors propagate.

### `deleteSubscription(id)`

1. Remove the subscription from state.
2. Fire `repoDeleteSubscription(id)` without awaiting.

Error behaviour: no rollback; the delete rejection is unhandled.

## Budgets (`useBudgetsState`)

### `addBudget(budget)`

1. Create the budget with a new id.
2. Append it to state.
3. Fire `insertBudget` without awaiting.

Error behaviour: no rollback; the insert rejection is unhandled.

### `updateBudget(updated)`

1. Replace the budget in state.
2. Fire `repoUpdateBudget` without awaiting.

Error behaviour: no rollback; the update rejection is unhandled.

### `deleteBudget(id)`

1. Remove the budget from state.
2. Fire `repoDeleteBudget` without awaiting.

Error behaviour: no rollback; the delete rejection is unhandled.

## Profile (`useProfileState`)

### `updateUserProfile(profile)`

1. Set the profile in state.
2. `await saveProfile(profile)`.

Error behaviour: state first; a save rejection leaves the new profile visible
and propagates. No rollback.

### `completeOnboarding(data)`

1. Build the profile from the render-time `userProfile` snapshot plus the new
   name/avatar and `hasOnboarded: true`.
2. Set it in state.
3. `await saveProfile(profile)`.

Error behaviour: state first; a save rejection leaves the profile visible and
propagates. No rollback. The store version must merge from `getState()` so a
profile change made before the await is not lost.

### `updateCurrencyAndConvert(rate, symbol, code, shouldConvert)`

1. When converting, `await convertCurrencyInDB(rate, symbol)`.
2. Build the new profile from the render-time `userProfile` snapshot.
3. `await saveProfile(newProfile)`.
4. Set the profile in state.
5. When converting: fetch accounts and set them, fetch transactions and set
   them, fetch budgets and set them, fetch subscriptions and set them (one await
   per collection, state updated after each).

Error behaviour: database conversion happens first. A failure in step 1 or 3
leaves the old profile in state. A failure during step 5 leaves the new profile
and a partially refreshed set of collections. No rollback. Errors propagate.
The store version must re-read `getState().userProfile` after the awaits.

## Data management (`useDataManagement`)

### `refreshAllData()`

1. Sequentially await all collection reads (accounts, transactions, custom
   categories, deleted defaults, category orders, wallet order, budgets,
   subscriptions, profile).
2. Set every slice from the fetched values.

Error behaviour: state is untouched until every read succeeds. A rejection
propagates and leaves state unchanged. No retry.

### `clearAllData()`

1. Reset accounts, transactions, custom categories, budgets, subscriptions,
   deleted defaults, category orders, wallet order, and profile to their empty
   defaults in state. `ready` is intentionally not touched.
2. Fire `repoClearAllData()` without awaiting.

Error behaviour: state resets immediately; a database rejection is unhandled
and leaves state cleared. The store version must reset data to the initial
values while keeping `ready` true (clearing data must not send the app back
behind the splash gate).

### `seedDemoData()`

1. `await repoSeedDemoData(currencySymbol)` using the render-time profile.
2. Sequentially await accounts, transactions, budgets, subscriptions, custom
   categories, deleted defaults, category orders, and wallet order.
3. Set each slice from the fetched values.

Error behaviour: when any step rejects, log `Seed demo data failed:`, rethrow,
and leave state unchanged (the database may already contain seeded data,
depending on where it failed). No rollback.

## Initialization (`AppProvider` effect / `loadInitialData`)

1. Read all collections and the profile in parallel.
2. Run auto-billing for active subscriptions (up to 24 back-dated charges per
   subscription), collecting inserts/updates and committing them in one SQLite
   transaction.
3. Return the post-billing snapshot.
4. On success, set every slice and `ready: true`. On failure, log
   `App init failed:` and set `ready: true` without hydrating data.

The store version must remain idempotent: a second call must not duplicate
billing or re-run reads concurrently. `ready` must end up `true` on both the
success and failure paths.

## Actions that must re-read state after an await

- `addTransaction` (account updates)
- `updateTransaction` (account updates)
- `deleteTransaction` (account updates)
- `deleteWallet` (account recomputation + wallet order)
- `addSubscription` (transactions/accounts before the subscription insert)
- `updateSubscription` (transactions/accounts before the subscription update)
- `updateCustomCategory` (state renames after the database reassignments)
- `deleteCustomCategory` (state renames after the database deletes)
- `deleteDefaultCategory` (state after `insertDeletedDefaultCategory`)
- `updateUserProfile` (only the state write before the save today)
- `completeOnboarding` (profile merge)
- `updateCurrencyAndConvert` (profile + every refreshed collection)
- `seedDemoData` (every refreshed collection)
- `refreshAllData` (every refreshed collection)
- `initialize` / `loadInitialData` (final hydration)

## Equivalence test

`npm run test:store` runs the legacy hooks and the store actions through the
same 22-step sequence on generated seed data and compares the state after every
step. The test replaces SQLite with a no-op repository and uses deterministic
ids, so it exercises ordering and state transitions without touching user data.
