// Google Cloud OAuth configuration for Google Drive backup/restore.
//
// Drive backup stores files in the END USER's own Google Drive under the
// `drive.file` scope (same access model as WhatsApp), so no server or billing
// is required. The only setup needed is registering a Google Cloud project and
// publishing the OAuth consent screen so ANY user can sign in (not just test
// accounts):
//
//   1. https://console.cloud.google.com → create a project → enable the
//      "Google Drive API".
//   2. "OAuth consent screen" → External → fill in the app name, logo, support
//      email, developer contact, and the privacy policy URL → then set
//      "Publishing status: In production". Test-only status blocks every user
//      who isn't listed as a test account.
//   3. Credentials → Create credentials → OAuth client ID → type "Android",
//      with package name com.buildsbyaman.spendsense, for EACH signing key the
//      app is distributed under:
//        - Play Store (Play App Signing): the SHA-1 shown in Play Console →
//          Setup → App integrity → "App signing key certificate". The store
//          re-signs your app with Google's key, so this is a DIFFERENT
//          fingerprint than your upload keystore.
//        - Sideloaded APK (local release keystore):
//          0F:79:0D:4E:A5:FF:E7:9F:86:E6:4B:9E:74:3C:20:71:7C:24:89:2D
//        - Optional: your debug keystore if debug builds must sign in too.
//   4. Paste each client ID (looks like xxxx.apps.googleusercontent.com) into
//      GOOGLE_ANDROID_CLIENT_IDS below, keyed by its SHA-1 fingerprint, and
//      rebuild the app. The app reads its own signing certificate at runtime
//      and picks the matching client ID, so one build works for every channel.
//   5. Submit a verification request (scope `drive.file` is a "sensitive"
//      scope). Until verified, users see a "Google hasn't verified this app"
//      warning and Google limits unverified apps to roughly 100 users.
//
// The OAuth client IDs are public identifiers baked into the binary — they are
// not secrets. Nothing needs to be placed in google-services.json or the Gradle
// build; only the client ID strings are required here.

export const GOOGLE_ANDROID_CLIENT_IDS: Record<string, string> = {
  // Play App Signing certificate SHA-1 → paste the Play client ID here.
  'PLAY_APP_SIGNING_SHA1': '',
  // Local release keystore SHA-1 → paste the sideload client ID here.
  '0F:79:0D:4E:A5:FF:E7:9F:86:E6:4B:9E:74:3C:20:71:7C:24:89:2D': '296459800384-1o1b3p9em6n5g3077pkvshf107fi3k33.apps.googleusercontent.com',
};

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export const BACKUP_FILE_PREFIX = 'SpendSense-Backup-';
export const BACKUP_EXTENSION = '.spendbackup';
export const BACKUP_MIME_TYPE = 'application/json';

export const DRIVE_STORAGE_KEYS = {
  refreshToken: 'spendsense_drive_refresh_token',
  email: 'spendsense_drive_email',
};

export function isDriveConfigured(): boolean {
  return Object.values(GOOGLE_ANDROID_CLIENT_IDS).some(
    (id) => id.trim().length > 0
  );
}
