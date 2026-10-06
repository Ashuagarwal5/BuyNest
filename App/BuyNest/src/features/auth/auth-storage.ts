import * as SecureStore from 'expo-secure-store';

/**
 * The sign-in token lives in the phone's secure store (Android Keystore), not in AsyncStorage,
 * so other apps and backups cannot read it. Nothing here throws: a failure means "not signed in".
 */
const TOKEN_KEY = 'doorkart.account-token';

export async function readToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Returns false if the phone could not keep the token, so the app does not pretend someone is signed in. */
export async function saveToken(token: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nothing more can be done; the token is also removed from the server on sign-out.
  }
}
