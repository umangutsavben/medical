import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
// You must set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// pointing to your service account key file, or if running in GCP,
// it will automatically pick up the default credentials.
if (!getApps().length) {
  console.log('Firebase initialization disabled. Using local storage fallback.');
}

export const getStorageBucket = () => {
  // Replace with your actual Firebase project bucket name, or pass it in env vars
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'medical-records-organizer.appspot.com';
  return getStorage().bucket(bucketName);
};
