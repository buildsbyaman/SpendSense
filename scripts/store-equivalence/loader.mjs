import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = new URL('./', import.meta.url);
const root = new URL('../../', import.meta.url);

const FAKE_MODULES = new Map([
  ['@/lib/repository', 'fake-repository.mts'],
  ['@/lib/database', 'fake-database.mts'],
  ['@/lib/id', 'fake-id.mts'],
  ['@/utils/wallet', 'fake-wallet.mts'],
  ['react', 'fake-react.mts'],
  ['lucide-react-native', 'fake-lucide.mts'],
]);

function toUrl(path) {
  return pathToFileURL(path).href;
}

function resolveFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.mts`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return toUrl(candidate);
  }
  return null;
}

function tryResolve(specifier, parentURL) {
  if (specifier.startsWith('.')) {
    const parentPath = fileURLToPath(parentURL);
    const basePath = new URL(specifier, pathToFileURL(parentPath)).pathname;
    return resolveFile(basePath);
  }
  if (specifier.startsWith('/')) return resolveFile(specifier);
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const fake = FAKE_MODULES.get(specifier);
  if (fake) return { url: new URL(fake, here).href, shortCircuit: true };

  if (specifier === './categories' && context.parentURL?.includes('/utils/transaction.ts')) {
    return { url: new URL('fake-categories.mts', here).href, shortCircuit: true };
  }

  if (specifier.startsWith('@/')) {
    const basePath = fileURLToPath(new URL(specifier.slice(2), root));
    const resolved = resolveFile(basePath);
    if (resolved) return { url: resolved, shortCircuit: true };
  }

  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    const resolved = tryResolve(specifier, context.parentURL);
    if (resolved) return { url: resolved, shortCircuit: true };
    throw err;
  }
}
