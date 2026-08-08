import { NativeModules } from 'react-native';

/**
 * Returns the SHA-1 signing certificate fingerprint of the installed APK
 * (uppercase, colon-separated, e.g. "0F:79:0D:..."), or null when the native
 * module isn't available (e.g. Expo Go) or the lookup fails.
 */
export async function getSigningSha1(): Promise<string | null> {
  const module = NativeModules.SigningFingerprint as
    | { getSha1?: (cb: (err: unknown, value?: string) => void) => void }
    | undefined;
  const getSha1 = module?.getSha1;
  if (!getSha1) return null;
  return new Promise<string | null>((resolve) => {
    getSha1((err, value) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(value ?? null);
    });
  });
}
