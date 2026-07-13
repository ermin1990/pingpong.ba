import { secondaryAuth } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';

const randomTempPassword = () =>
  `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}Aa1!`;

/**
 * Provisions a Firebase Auth account for a player's email, from an
 * organizer's session, without disturbing the organizer's own login.
 *
 * Runs on a secondary Firebase App instance so createUserWithEmailAndPassword
 * (which signs in as the new user on whichever app it's called on) never
 * touches the primary `auth` the organizer is signed into. The player never
 * sees the temp password - they get a real Firebase "set your password"
 * email and choose their own.
 *
 * If the email already has an account (e.g. they play in another league
 * too), account creation is skipped but the reset email still goes out so
 * they have a way in if they forgot their password.
 *
 * @returns {{ ok: boolean, created: boolean, alreadyExists: boolean, uid?: string, error?: string }}
 */
export const provisionPlayerAccount = async (email) => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, created: false, alreadyExists: false, error: 'missing-email' };

  let created = false;
  let alreadyExists = false;
  let uid = null;

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, normalized, randomTempPassword());
    created = true;
    uid = cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      alreadyExists = true;
    } else {
      await signOut(secondaryAuth).catch(() => {});
      return { ok: false, created: false, alreadyExists: false, error: err.code || 'unknown' };
    }
  }

  try {
    await sendPasswordResetEmail(secondaryAuth, normalized);
  } catch (err) {
    // Account exists/was created either way - a failed email send shouldn't
    // block the approval flow, the organizer can just resend later.
    console.error('sendPasswordResetEmail failed:', err);
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }

  return { ok: true, created, alreadyExists, uid };
};
