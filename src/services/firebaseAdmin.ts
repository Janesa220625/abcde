import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;

/**
 * Initialize the Firebase Admin SDK
 * This should be called before using any admin functions
 */
export const initializeFirebaseAdmin = () => {
  try {
    // Check if already initialized
    if (adminApp) {
      return adminApp;
    }

    // Check if required environment variables are available
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error(
        "Firebase project ID is required for admin SDK initialization",
      );
    }

    // Initialize with application default credentials
    // For client-side apps, we'll use a workaround since we can't use service account credentials
    adminApp = admin.initializeApp(
      {
        projectId,
      },
      "admin-app",
    );

    console.log("Firebase Admin SDK initialized successfully");
    return adminApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }
};

/**
 * Get the Firebase Admin Storage instance
 */
export const getAdminStorage = () => {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }
  return admin.storage();
};

/**
 * Check if a storage bucket exists
 * @param bucketName The name of the bucket to check
 */
export const checkBucketExists = async (
  bucketName: string,
): Promise<boolean> => {
  try {
    const storage = getAdminStorage();
    const [buckets] = await storage.getBuckets();
    return buckets.some((bucket) => bucket.name === bucketName);
  } catch (error) {
    console.error("Error checking if bucket exists:", error);
    return false;
  }
};

/**
 * Create a new storage bucket
 * @param bucketName The name of the bucket to create
 */
export const createStorageBucket = async (
  bucketName: string,
): Promise<{
  success: boolean;
  bucket?: string;
  error?: string;
}> => {
  try {
    const storage = getAdminStorage();

    // Check if bucket already exists
    const exists = await checkBucketExists(bucketName);
    if (exists) {
      return {
        success: true,
        bucket: bucketName,
        error: "Bucket already exists",
      };
    }

    // Create the bucket
    const [bucket] = await storage.createBucket(bucketName);

    return {
      success: true,
      bucket: bucket.name,
    };
  } catch (error) {
    console.error("Error creating storage bucket:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error creating bucket",
    };
  }
};
