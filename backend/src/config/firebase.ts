import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// You must set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// pointing to your service account key file, or if running in GCP,
// it will automatically pick up the default credentials.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const getStorageBucket = () => {
  // Replace with your actual Firebase project bucket name, or pass it in env vars
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'medical-records-organizer.appspot.com';
  return admin.storage().bucket(bucketName);
};

export default admin;
