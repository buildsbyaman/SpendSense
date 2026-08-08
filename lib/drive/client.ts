import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import {
  AuthRequest,
  ResponseType,
  makeRedirectUri,
  exchangeCodeAsync,
  refreshAsync,
  revokeAsync,
  fetchUserInfoAsync,
} from 'expo-auth-session';
import { discovery } from 'expo-auth-session/providers/google';
import {
  GOOGLE_ANDROID_CLIENT_IDS,
  DRIVE_SCOPE,
  DRIVE_STORAGE_KEYS,
} from '@/lib/backup/config';
import { getSigningSha1 } from '@/lib/backup/fingerprint';

export interface DriveAccount {
  email: string | null;
  name: string | null;
}

// Mirror the provider's required scopes so the OpenID userinfo endpoint can
// report the signed-in account (for the "Backup to <email>" label).
const MINIMUM_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

function nativeRedirectUri(): string {
  return makeRedirectUri({
    native: `${Application.applicationId}:/oauthredirect`,
  });
}

let cachedClientId: string | null = null;

/**
 * Resolves the Android OAuth client ID for the build that's actually installed.
 * Each client ID is bound to a signing certificate fingerprint, so the app
 * reads its own signing SHA-1 and picks the matching ID (Play App Signing vs.
 * sideloaded release keystore). Throws when no client ID is configured.
 */
export async function getGoogleClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;
  const sha1 = await getSigningSha1();
  const clientId = (sha1 && GOOGLE_ANDROID_CLIENT_IDS[sha1]) || '';
  if (!clientId) {
    throw new Error(
      'Google Drive is not configured. Add the Google OAuth client ID in lib/backup/config.ts.'
    );
  }
  cachedClientId = clientId;
  return clientId;
}

async function loadRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(DRIVE_STORAGE_KEYS.refreshToken);
}

async function saveRefreshToken(token: string | null): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(DRIVE_STORAGE_KEYS.refreshToken, token);
  } else {
    await SecureStore.deleteItemAsync(DRIVE_STORAGE_KEYS.refreshToken);
  }
}

/**
 * Opens the Google OAuth consent screen in a browser tab. On success the app
 * exchanges the authorization code for tokens and persists the refresh token in
 * the secure keychain so later backups don't require re-authentication.
 */
export async function signInToDrive(): Promise<DriveAccount> {
  const clientId = await getGoogleClientId();

  const request = new AuthRequest({
    clientId,
    redirectUri: nativeRedirectUri(),
    responseType: ResponseType.Code,
    scopes: [...MINIMUM_SCOPES, DRIVE_SCOPE],
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);
  if (result.type !== 'success' || !result.params.code) {
    throw new Error('Google sign-in was cancelled or failed.');
  }

  const auth = await exchangeCodeAsync(
    {
      clientId,
      redirectUri: nativeRedirectUri(),
      code: result.params.code,
      scopes: [...MINIMUM_SCOPES, DRIVE_SCOPE],
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    discovery
  );

  if (!auth.accessToken) {
    throw new Error('Google sign-in failed.');
  }
  await saveRefreshToken(auth.refreshToken ?? null);

  const account = await fetchAccountFromToken(auth.accessToken);
  if (account.email) {
    await SecureStore.setItemAsync(DRIVE_STORAGE_KEYS.email, account.email);
  }
  return account;
}

async function fetchAccountFromToken(accessToken: string): Promise<DriveAccount> {
  try {
    const info = await fetchUserInfoAsync({ accessToken }, discovery);
    return { email: info?.email ?? null, name: info?.name ?? null };
  } catch {
    return { email: null, name: null };
  }
}

/**
 * Returns a valid access token, refreshing it from the stored refresh token
 * when it has expired (or proactively). Throws if the user isn't signed in or
 * the stored session can no longer be refreshed.
 */
export async function getDriveAccessToken(): Promise<string> {
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) {
    throw new Error('not-signed-in');
  }

  try {
    const auth = await refreshAsync(
      {
        refreshToken,
        clientId: await getGoogleClientId(),
      },
      discovery
    );
    if (!auth.accessToken) {
      throw new Error('empty-token');
    }
    if (auth.refreshToken && auth.refreshToken !== refreshToken) {
      await saveRefreshToken(auth.refreshToken);
    }
    return auth.accessToken;
  } catch {
    // The stored session is dead (revoked / expired consent). Clear it so the
    // UI can prompt for a fresh sign-in instead of erroring every time.
    await saveRefreshToken(null);
    throw new Error('not-signed-in');
  }
}

export async function isSignedInToDrive(): Promise<boolean> {
  return (await loadRefreshToken()) !== null;
}

export async function getDriveAccount(): Promise<DriveAccount | null> {
  if (!(await isSignedInToDrive())) return null;
  const email = await SecureStore.getItemAsync(DRIVE_STORAGE_KEYS.email);
  return { email, name: email };
}

export async function signOutOfDrive(): Promise<void> {
  const refreshToken = await loadRefreshToken();
  if (refreshToken) {
    try {
      await revokeAsync({ token: refreshToken }, discovery);
    } catch {
      // Best-effort: the token may already be revoked.
    }
  }
  await saveRefreshToken(null);
  await SecureStore.deleteItemAsync(DRIVE_STORAGE_KEYS.email);
}
