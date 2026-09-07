// Mirrors chekki-ai's api/_lib/firebaseAdmin.ts so this quiz writes into the
// same Firebase project via the same FIREBASE_SERVICE_ACCOUNT credential.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin(): void {
  if (getApps().length > 0) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccount) {
    try {
      const cleaned = serviceAccount.trim().replace(/\n/g, "").replace(/\r/g, "");
      const parsed = JSON.parse(cleaned);
      initializeApp({ credential: cert(parsed) });
    } catch (e) {
      console.error("[firebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
      initializeApp();
    }
  } else {
    initializeApp();
  }
}

initAdmin();

export const adminDb = getFirestore();
