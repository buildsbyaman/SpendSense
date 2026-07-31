(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function poll(fn, timeout = 3000, step = 40) {
    const start = Date.now();
    for (;;) {
      let v = false;
      try { v = await fn(); } catch {}
      if (v) return true;
      if (Date.now() - start > timeout) return false;
      await sleep(step);
    }
  }

  function walkFibers(start, fn) {
    const stack = [start];
    while (stack.length) {
      const f = stack.pop();
      if (!f) continue;
      if (fn(f)) return f;
      if (f.sibling) stack.push(f.sibling);
      if (f.child) stack.push(f.child);
    }
    return null;
  }
  const getRootFiber = () => {
    const root = document.getElementById('root');
    if (!root) throw new Error('No #root element');
    const key = Object.keys(root).find((k) => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
    if (!key) throw new Error('React fiber not found on #root');
    return root[key];
  };
  const findCtx = () => {
    const f = walkFibers(getRootFiber(), (n) => {
      const v = n.memoizedProps && n.memoizedProps.value;
      return v && typeof v.addWallet === 'function' && typeof v.clearAllData === 'function';
    });
    if (!f) throw new Error('AppContext not found — is the web app running?');
    return f.memoizedProps.value;
  };

  const iconCache = {};
  walkFibers(getRootFiber(), (n) => {
    const as = n.memoizedProps && n.memoizedProps.as;
    if (as && as.displayName && !iconCache[as.displayName]) iconCache[as.displayName] = as;
    return false;
  });
  const dummy = () => null;
  const icon = (n) => iconCache[n] || dummy;

  const WALLETS = [
    { key: 'bank',    name: 'Main Account',   number: '1234 5678 9012 3456', type: 'Bank',    balance: '2000' },
    { key: 'card',    name: 'Credit Card',    number: '9876 5432 1098 7654', type: 'Card',    balance: '0' },
    { key: 'digital', name: 'Digital Wallet', number: '9012 3456 7890',       type: 'Digital', balance: '500' },
  ];

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20260731);
  const money = (min, max) => Math.round((min + rnd() * (max - min)) * 100) / 100;

  const MONTHLY = [
    ['Groceries',     'Shopping',      2,  () => money(60, 140),  'bank'],
    ['Coffee Shop',   'Food',          4,  () => money(3.5, 7),   'card'],
    ['Internet Bill', 'Bills',         5,  () => money(45, 65),   'bank'],
    ['Lunch',         'Food',          8,  () => money(10, 16),   'card'],
    ['Netflix',       'Entertainment', 11, () => 15.49,           'card'],
    ['Uber Ride',     'Transport',     13, () => money(9, 22),    'card'],
    ['Electricity',   'Bills',         15, () => money(45, 90),   'bank'],
    ['Fuel',          'Transport',     18, () => money(35, 60),   'card'],
    ['Amazon Order',  'Shopping',      21, () => money(20, 90),   'card'],
    ['Dinner Out',    'Food',          24, () => money(25, 55),   'card'],
    ['Movie Night',   'Entertainment', 27, () => money(18, 32),   'card'],
  ];

  const txs = [];
  const now = new Date();
  for (let m = 0; m < 12; m++) {
    const y = now.getFullYear(), mo = now.getMonth() - m;
    txs.push({ title: 'Monthly Salary', category: 'Salary', type: 'income', wallet: 'bank',
               date: new Date(y, mo, 1, 9, 0), amount: 3200 });
    MONTHLY.forEach(([title, category, day, fn, wallet]) => {
      if (title === 'Electricity' && (m === 5 || m === 11)) return;
      txs.push({ title, category, type: 'expense', wallet, date: new Date(y, mo, day, 12, 0), amount: fn() });
    });
    if (rnd() > 0.5) {
      txs.push({ title: 'Freelance Project', category: 'Business', type: 'income', wallet: 'digital',
                 date: new Date(y, mo, 20, 10, 0), amount: money(120, 350) });
    }
  }

  async function seed() {
    let c = findCtx();
    c.clearAllData();
    if (!(await poll(() => findCtx().accounts.length === 0))) throw new Error('Timed out clearing wallets');

    for (let i = 0; i < WALLETS.length; i++) {
      const w = WALLETS[i];
      findCtx().addWallet({
        name: w.name, number: w.number, balance: w.balance, type: w.type,
        icon: icon(w.type === 'Bank' ? 'Landmark' : w.type === 'Card' ? 'CreditCard' : 'Smartphone'),
      });
      const ok = await poll(() => findCtx().accounts.length === i + 1);
      if (!ok) throw new Error(`Only ${findCtx().accounts.length}/${WALLETS.length} wallets after "${w.name}" — likely a hot reload; reload the page and re-run __seedApp()`);
    }

    c = findCtx();
    const byName = {};
    for (const a of c.accounts) byName[a.name] = a.id;
    const idMap = {};
    for (const w of WALLETS) {
      const id = byName[w.name];
      if (!id) throw new Error(`Wallet "${w.name}" missing from state after seeding`);
      idMap[w.key] = id;
    }

    for (const t of txs) {
      c.addTransaction({ title: t.title, amount: t.amount, type: t.type, category: t.category,
                         date: t.date.toISOString(), walletId: idMap[t.wallet] });
      await sleep(3);
    }

    const settled = await poll(() => findCtx().transactions.length === txs.length, 6000, 100);
    const f = findCtx();
    console.log(`[seed] ${settled ? 'Done' : 'WARN (still settling):'} ${f.accounts.length} wallets, ${f.transactions.length}/${txs.length} transactions.`);
  }

  async function clear() {
    findCtx().clearAllData();
    const ok = await poll(() => findCtx().accounts.length === 0 && findCtx().transactions.length === 0);
    console.log(ok ? '[clear] Done: 0 wallets, 0 transactions.' : '[clear] Timed out — check the app.');
  }

  window.__seedApp = seed;
  window.__clearApp = clear;
  console.log('SpendSense dev seed loaded → call __seedApp() or __clearApp()');
  seed();
})();