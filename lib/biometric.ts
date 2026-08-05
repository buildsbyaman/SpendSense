import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Whether the device can prompt using a secure screen lock (biometrics
 * and/or device PIN/pattern/password). Returns false when unsupported.
 */
export async function canUseAuthentication(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    const hasEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasEnrolled;
  } catch {
    return false;
  }
}

/**
 * Presents the operating system's screen-lock prompt (biometrics first,
 * falling back to the device PIN/pattern/password). Resolves true only when
 * the user successfully authenticates.
 */
export async function authenticate(
  promptMessage = 'Unlock SpendSense'
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}