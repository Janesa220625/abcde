import { firestore } from "./firebase";
import { collection, getDocs, addDoc, query, limit } from "firebase/firestore";
import { Product, DeliveryItem } from "@/lib/hooks/useProductData";

/**
 * Check if a collection exists and has data in Firestore
 * @param collectionName The name of the collection to check
 */
export const checkCollectionExists = async (
  collectionName: string,
): Promise<{ exists: boolean; count: number }> => {
  try {
    if (!firestore) {
      console.error("Firestore not initialized");
      return { exists: false, count: 0 };
    }

    // Try to get documents from the collection with a limit of 1
    const q = query(collection(firestore, collectionName), limit(1));
    const querySnapshot = await getDocs(q);

    // If we can get a snapshot, the collection exists
    // Count how many documents are in the collection
    const fullSnapshot = await getDocs(collection(firestore, collectionName));

    return {
      exists: true,
      count: fullSnapshot.size,
    };
  } catch (error) {
    console.error(
      `Error checking if collection ${collectionName} exists:`,
      error,
    );
    return { exists: false, count: 0 };
  }
};

/**
 * Create a product in the products collection
 * @param product The product to create
 */
export const createProduct = async (
  product: Product,
): Promise<string | null> => {
  try {
    if (!firestore) {
      console.error("Firestore not initialized");
      return null;
    }

    const docRef = await addDoc(collection(firestore, "products"), product);
    return docRef.id;
  } catch (error) {
    console.error("Error creating product:", error);
    return null;
  }
};

/**
 * Create a delivery item in the deliveries collection
 * @param delivery The delivery item to create
 */
export const createDelivery = async (
  delivery: DeliveryItem,
): Promise<string | null> => {
  try {
    if (!firestore) {
      console.error("Firestore not initialized");
      return null;
    }

    const docRef = await addDoc(collection(firestore, "deliveries"), delivery);
    return docRef.id;
  } catch (error) {
    console.error("Error creating delivery:", error);
    return null;
  }
};

/**
 * Initialize collections with default data if they don't exist or are empty
 */
export const initializeCollections = async (): Promise<{
  products: { success: boolean; count: number };
  deliveries: { success: boolean; count: number };
}> => {
  const result = {
    products: { success: false, count: 0 },
    deliveries: { success: false, count: 0 },
  };

  try {
    // Check if products collection exists and has data
    const productsCheck = await checkCollectionExists("products");

    // If products collection doesn't exist or is empty, create it with default data
    if (productsCheck.exists && productsCheck.count > 0) {
      result.products = { success: true, count: productsCheck.count };
    } else {
      // Default products data from useProductData hook
      const defaultProducts: Product[] = [
        {
          id: "1",
          sku: "SKU-123-BLK",
          name: "Men's Casual Shoes",
          category: "men_shoes",
          pairsPerBox: 6,
          sizes: "40,41,42,43,44,45",
          colors: "Black,Brown,Navy",
        },
        {
          id: "2",
          sku: "SKU-456-RED",
          name: "Women's Heels",
          category: "women_shoes",
          pairsPerBox: 8,
          sizes: "36,37,38,39,40",
          colors: "Red,Black,Beige",
        },
        {
          id: "3",
          sku: "SKU-789-BRN",
          name: "Men's Sandals",
          category: "men_sandals",
          pairsPerBox: 10,
          sizes: "39,40,41,42,43,44",
          colors: "Brown,Black",
        },
        {
          id: "4",
          sku: "SKU-101-WHT",
          name: "Women's Sandals",
          category: "women_sandals",
          pairsPerBox: 12,
          sizes: "36,37,38,39,40",
          colors: "White,Pink,Blue",
        },
        {
          id: "5",
          sku: "SKU-202-BLU",
          name: "Kids' Sport Shoes",
          category: "kids_shoes",
          pairsPerBox: 8,
          sizes: "28,29,30,31,32,33,34",
          colors: "Blue,Red,Green",
        },
      ];

      // Create each product
      let successCount = 0;
      for (const product of defaultProducts) {
        const id = await createProduct(product);
        if (id) successCount++;
      }

      result.products = { success: true, count: successCount };
    }

    // Check if deliveries collection exists and has data
    const deliveriesCheck = await checkCollectionExists("deliveries");

    // If deliveries collection doesn't exist or is empty, create it with default data
    if (deliveriesCheck.exists && deliveriesCheck.count > 0) {
      result.deliveries = { success: true, count: deliveriesCheck.count };
    } else {
      // Default deliveries data from useProductData hook
      const defaultDeliveries: DeliveryItem[] = [
        {
          id: "1001",
          date: new Date(Date.now() - 86400000).toISOString(),
          sku: "SKU-123-BLK",
          boxCount: 5,
          pairsPerBox: 6,
          totalPairs: 30,
        },
        {
          id: "1002",
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          sku: "SKU-456-RED",
          boxCount: 10,
          pairsPerBox: 8,
          totalPairs: 80,
        },
        {
          id: "1003",
          date: new Date(Date.now() - 3 * 86400000).toISOString(),
          sku: "SKU-789-BRN",
          boxCount: 15,
          pairsPerBox: 10,
          totalPairs: 150,
        },
      ];

      // Create each delivery
      let successCount = 0;
      for (const delivery of defaultDeliveries) {
        const id = await createDelivery(delivery);
        if (id) successCount++;
      }

      result.deliveries = { success: true, count: successCount };
    }

    return result;
  } catch (error) {
    console.error("Error initializing collections:", error);
    return result;
  }
};
