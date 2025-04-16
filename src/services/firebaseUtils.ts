// This file is kept as a placeholder to prevent import errors
// All Firebase utility functions have been removed as the application now uses Supabase

// Import types to maintain compatibility with existing code
import { Product, DeliveryItem } from "@/lib/hooks/useProductData";

/**
 * Placeholder function that returns a not-available status
 * @deprecated Firebase is no longer used. Use Supabase instead.
 */
export const checkCollectionExists = async () => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return { exists: false, count: 0 };
};

/**
 * Placeholder function that returns a not-available status
 * @deprecated Firebase is no longer used. Use Supabase instead.
 */
export const createProduct = async () => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return null;
};

/**
 * Placeholder function that returns a not-available status
 * @deprecated Firebase is no longer used. Use Supabase instead.
 */
export const createDelivery = async () => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return null;
};

/**
 * Placeholder function that returns a not-available status
 * @deprecated Firebase is no longer used. Use Supabase instead.
 */
export const initializeCollections = async () => {
  console.warn("Firebase is no longer used. Use Supabase instead.");
  return {
    products: { success: false, count: 0 },
    deliveries: { success: false, count: 0 },
  };
};
