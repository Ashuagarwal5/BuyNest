/**
 * Google sign-in, wrapped so the rest of the app never touches the native module directly.
 *
 * The library only exists inside an installed build of the app (an EAS development build or
 * the Play Store build). Expo Go does not contain it: importing it there would crash the
 * whole app at start-up. It is therefore loaded on demand, inside a try, and the screen is told
 * `unavailable` so it can explain instead of failing.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

export type GoogleSignInResult =
  | { status: 'success'; idToken: string }
  | { status: 'cancelled' }
  /** The native module is missing (Expo Go) or Google Play services are not usable. */
  | { status: 'unavailable' }
  | { status: 'failed' };

/**
 * True inside the Expo Go test app. It has no Google sign-in module, and even a guarded attempt
 * to load one makes React Native show a red error screen, so Expo Go never tries.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cached: GoogleModule | null | undefined;

function loadModule(): GoogleModule | null {
  if (isExpoGo) {
    return null;
  }
  if (cached === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cached = require('@react-native-google-signin/google-signin') as GoogleModule;
    } catch {
      cached = null;
    }
  }
  return cached;
}

export function isGoogleSignInInstalled(): boolean {
  return loadModule() !== null;
}

/**
 * Opens Google's account chooser and returns the ID token it issues. The token is proof of
 * who signed in, and is sent to the DoorKart server, which checks it. The app never trusts it itself.
 */
export async function signInWithGoogle(webClientId: string): Promise<GoogleSignInResult> {
  const google = loadModule();
  if (!google) {
    return { status: 'unavailable' };
  }
  const { GoogleSignin, isErrorWithCode, statusCodes } = google;

  try {
    GoogleSignin.configure({ webClientId });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') {
      return { status: 'cancelled' };
    }
    const idToken = response.data.idToken;
    return idToken ? { status: 'success', idToken } : { status: 'failed' };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { status: 'cancelled' };
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { status: 'unavailable' };
      }
    }
    return { status: 'failed' };
  }
}

/** Forgets the Google account on this phone, so the next sign-in asks which account to use. */
export async function signOutGoogle(): Promise<void> {
  const google = loadModule();
  if (!google) {
    return;
  }
  try {
    await google.GoogleSignin.signOut();
  } catch {
    // Nothing to sign out of, or the module is not ready. Either way the phone is signed out.
  }
}
