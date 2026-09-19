import { initializeApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
// You must set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// pointing to your service account key file, or if running in GCP,
// it will automatically pick up the default credentials.
if (!getApps().length) {
  try {
    initializeApp();
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const getStorageBucket = () => {
  // Replace with your actual Firebase project bucket name, or pass it in env vars
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'medical-records-organizer.appspot.com';
  return getStorage().bucket(bucketName);
};
