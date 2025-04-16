// This file is kept as a placeholder to prevent import errors
// All Firebase functionality has been removed as the application now uses Supabase

// Mock exports to prevent import errors in components that haven't been updated yet
export const firestore = null;
export const storage = null;

/**
 * Placeholder function that returns a not-available status
 * @deprecated Firebase is no longer used. Use Supabase instead.
 */
export const checkFirebaseConnection = async () => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return {
    connected: false,
    details: {
      credentialsPresent: false,
      error:
        "Firebase has been removed from this application. Use Supabase instead.",
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Placeholder function that returns a not-available status
 * @deprecated Firebase is no longer used. Use Supabase instead.
 */
export const checkFirebaseStorage = async () => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return {
    available: false,
    details: {
      storageBucketConfigured: false,
      error:
        "Firebase has been removed from this application. Use Supabase instead.",
      timestamp: new Date().toISOString(),
    },
  };
};
