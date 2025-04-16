import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, listAll, FirebaseStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if credentials are available
let firebaseApp: any = null;
let firestore: any = null;
let storage: FirebaseStorage | null = null;

try {
  // Check if required Firebase config is available
  const hasRequiredConfig = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
  ].every(Boolean);

  if (hasRequiredConfig) {
    firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp);

    // Initialize storage if storageBucket is provided
    if (firebaseConfig.storageBucket) {
      storage = getStorage(firebaseApp);
    }

    console.log("Firebase initialized successfully");
  } else {
    console.warn(
      "Firebase credentials incomplete. Firebase services not initialized.",
    );
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

/**
 * Check if Firebase connection is working
 */
export const checkFirebaseConnection = async (): Promise<{
  connected: boolean;
  details: {
    credentialsPresent: boolean;
    collectionsAvailable?: string[];
    error?: string;
    timestamp: string;
  };
}> => {
  const details: {
    credentialsPresent: boolean;
    timestamp: string;
    error?: string;
    collectionsAvailable?: string[];
  } = {
    credentialsPresent: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check if Firebase is initialized
    if (!firestore) {
      details.error = "Firebase not initialized. Check your credentials.";
      return { connected: false, details };
    }

    details.credentialsPresent = true;

    // Try to list collections to verify connection
    try {
      // This is a simple query to check if we can access Firestore
      const collectionsSnapshot = await getDocs(
        collection(firestore, "__dummy__"),
      );
      details.collectionsAvailable = [];

      // If we get here, the connection is working
      return { connected: true, details };
    } catch (error: any) {
      // Some errors are expected when querying a non-existent collection
      // but we can still determine if the connection is working
      if (error.code === "permission-denied" || error.code === "not-found") {
        // These errors mean we connected but don't have permission or the collection doesn't exist
        return { connected: true, details };
      }

      details.error = error instanceof Error ? error.message : String(error);
      return { connected: false, details };
    }
  } catch (error) {
    details.error = error instanceof Error ? error.message : String(error);
    return { connected: false, details };
  }
};

/**
 * Check if Firebase Storage is available and accessible
 */
export const checkFirebaseStorage = async (): Promise<{
  available: boolean;
  details: {
    storageBucketConfigured: boolean;
    bucketAccessible?: boolean;
    defaultBucketName?: string;
    error?: string;
    timestamp: string;
  };
}> => {
  const details: {
    storageBucketConfigured: boolean;
    bucketAccessible?: boolean;
    defaultBucketName?: string;
    error?: string;
    timestamp: string;
  } = {
    storageBucketConfigured: Boolean(firebaseConfig.storageBucket),
    timestamp: new Date().toISOString(),
  };

  try {
    // Check if Firebase is initialized
    if (!firebaseApp) {
      details.error = "Firebase not initialized. Check your credentials.";
      return { available: false, details };
    }

    // Check if storage bucket is configured
    if (!firebaseConfig.storageBucket) {
      details.error = "Storage bucket not configured in Firebase settings.";
      return { available: false, details };
    }

    // Check if storage is initialized
    if (!storage) {
      storage = getStorage(firebaseApp);
    }

    details.defaultBucketName = firebaseConfig.storageBucket;

    // Try to list files in the root to verify access
    try {
      const rootRef = ref(storage);
      await listAll(rootRef);
      details.bucketAccessible = true;
      return { available: true, details };
    } catch (error: any) {
      // Some errors are expected when the bucket exists but is empty or we don't have list permissions
      if (error.code === "permission-denied") {
        // This error means the bucket exists but we don't have permission to list
        details.bucketAccessible = false;
        details.error = "Permission denied when accessing storage bucket.";
        return { available: true, details };
      }

      details.bucketAccessible = false;
      details.error = error instanceof Error ? error.message : String(error);
      return { available: false, details };
    }
  } catch (error) {
    details.error = error instanceof Error ? error.message : String(error);
    return { available: false, details };
  }
};

export { firestore, storage };
