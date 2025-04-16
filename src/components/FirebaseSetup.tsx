import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  checkFirebaseConnection,
  checkFirebaseStorage,
} from "@/services/firebase";
import {
  initializeCollections,
  checkCollectionExists,
} from "@/services/firebaseUtils";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Database,
  RefreshCw,
  Package,
  Truck,
  Info,
  Code,
  Copy,
  Check,
  BookOpen,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FirebaseSetup() {
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    details: any;
  } | null>(null);
  const [storageStatus, setStorageStatus] = useState<{
    available: boolean;
    details: any;
  } | null>(null);
  const [collectionsStatus, setCollectionsStatus] = useState<{
    products: { exists: boolean; count: number };
    deliveries: { exists: boolean; count: number };
  } | null>(null);
  const [initializationResult, setInitializationResult] = useState<{
    products: { success: boolean; count: number };
    deliveries: { success: boolean; count: number };
  } | null>(null);
  const [activeTab, setActiveTab] = useState("status");
  const [productData, setProductData] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const connection = await checkFirebaseConnection();
      setConnectionStatus(connection);

      const storage = await checkFirebaseStorage();
      setStorageStatus(storage);

      // Check collections
      const productsCheck = await checkCollectionExists("products");
      const deliveriesCheck = await checkCollectionExists("deliveries");

      setCollectionsStatus({
        products: productsCheck,
        deliveries: deliveriesCheck,
      });

      // Reset product and delivery data
      setProductData([]);
      setDeliveryData([]);
    } catch (error) {
      console.error("Error checking Firebase status:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    setInitializing(true);
    try {
      const result = await initializeCollections();
      setInitializationResult(result);

      // Refresh collection status after initialization
      const productsCheck = await checkCollectionExists("products");
      const deliveriesCheck = await checkCollectionExists("deliveries");

      setCollectionsStatus({
        products: productsCheck,
        deliveries: deliveriesCheck,
      });

      // Load the updated collection data
      await loadCollectionData();
    } catch (error) {
      console.error("Error initializing collections:", error);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Function to load sample data from collections
  const loadCollectionData = async () => {
    if (!connectionStatus?.connected) return;

    setDataLoading(true);
    try {
      // This would be replaced with actual Firestore queries in a real implementation
      // For now, we'll just simulate loading data if collections exist
      if (
        collectionsStatus?.products.exists &&
        collectionsStatus.products.count > 0
      ) {
        // Simulate loading product data
        const sampleProducts = [
          {
            id: "1",
            sku: "SKU-123-BLK",
            name: "Men's Casual Shoes",
            category: "men_shoes",
          },
          {
            id: "2",
            sku: "SKU-456-RED",
            name: "Women's Heels",
            category: "women_shoes",
          },
          {
            id: "3",
            sku: "SKU-789-BRN",
            name: "Men's Sandals",
            category: "men_sandals",
          },
        ];
        setProductData(sampleProducts);
      }

      if (
        collectionsStatus?.deliveries.exists &&
        collectionsStatus.deliveries.count > 0
      ) {
        // Simulate loading delivery data
        const sampleDeliveries = [
          {
            id: "1001",
            date: new Date(Date.now() - 86400000).toISOString(),
            sku: "SKU-123-BLK",
            boxCount: 5,
          },
          {
            id: "1002",
            date: new Date(Date.now() - 2 * 86400000).toISOString(),
            sku: "SKU-456-RED",
            boxCount: 10,
          },
          {
            id: "1003",
            date: new Date(Date.now() - 3 * 86400000).toISOString(),
            sku: "SKU-789-BRN",
            boxCount: 15,
          },
        ];
        setDeliveryData(sampleDeliveries);
      }
    } catch (error) {
      console.error("Error loading collection data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Load collection data when collections status changes
  useEffect(() => {
    if (collectionsStatus) {
      loadCollectionData();
    }
  }, [collectionsStatus]);

  return (
    <div className="p-6 bg-white min-h-screen">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Firebase Setup Status</CardTitle>
          <CardDescription>
            Check and initialize Firebase collections for your warehouse
            application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Checking Firebase connection...
              </p>
              <Progress value={50} className="h-2" />
            </div>
          ) : (
            <Tabs
              defaultValue="status"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="status">Connection Status</TabsTrigger>
                <TabsTrigger
                  value="products"
                  disabled={!collectionsStatus?.products.exists}
                >
                  Products
                </TabsTrigger>
                <TabsTrigger
                  value="deliveries"
                  disabled={!collectionsStatus?.deliveries.exists}
                >
                  Deliveries
                </TabsTrigger>
                <TabsTrigger value="code-snippets">
                  <Code className="h-4 w-4 mr-2" />
                  Code Snippets
                </TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-6 mt-6">
                <Alert
                  variant={
                    connectionStatus?.connected ? "default" : "destructive"
                  }
                >
                  {connectionStatus?.connected ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {connectionStatus?.connected
                      ? "Firebase Connected"
                      : "Firebase Connection Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {connectionStatus?.details?.error ||
                      (connectionStatus?.connected
                        ? "Successfully connected to Firebase"
                        : "Failed to connect to Firebase. Check your credentials.")}
                  </AlertDescription>
                </Alert>

                <h3 className="text-lg font-medium mt-6">Storage Status</h3>
                <Alert
                  variant={storageStatus?.available ? "default" : "destructive"}
                >
                  {storageStatus?.available ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {storageStatus?.available
                      ? "Firebase Storage Available"
                      : "Firebase Storage Unavailable"}
                  </AlertTitle>
                  <AlertDescription>
                    {storageStatus?.details?.error ||
                      (storageStatus?.available
                        ? `Storage bucket: ${storageStatus.details.defaultBucketName}`
                        : "Storage bucket not configured or inaccessible.")}
                  </AlertDescription>
                </Alert>

                <h3 className="text-lg font-medium mt-6">Collections Status</h3>
                {collectionsStatus && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        <span>Products Collection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {collectionsStatus.products.exists ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>
                              {collectionsStatus.products.count} items
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab("products")}
                              disabled={collectionsStatus.products.count === 0}
                            >
                              View
                            </Button>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span>Not found</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        <span>Deliveries Collection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {collectionsStatus.deliveries.exists ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>
                              {collectionsStatus.deliveries.count} items
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab("deliveries")}
                              disabled={
                                collectionsStatus.deliveries.count === 0
                              }
                            >
                              View
                            </Button>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span>Not found</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {initializationResult && (
                  <Alert className="mt-4" variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Initialization Complete</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>
                            Products: {initializationResult.products.count}{" "}
                            items
                          </span>
                          {initializationResult.products.success && (
                            <Badge variant="outline" className="bg-green-50">
                              Success
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span>
                            Deliveries: {initializationResult.deliveries.count}{" "}
                            items
                          </span>
                          {initializationResult.deliveries.success && (
                            <Badge variant="outline" className="bg-green-50">
                              Success
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="products" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Products Collection</h3>
                  <Badge variant="outline">{productData.length} items</Badge>
                </div>
                <Separator />

                {dataLoading ? (
                  <div className="py-8 flex justify-center">
                    <Progress value={50} className="w-1/2 h-2" />
                  </div>
                ) : productData.length > 0 ? (
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    <div className="space-y-4">
                      {productData.map((product) => (
                        <div key={product.id} className="p-4 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </p>
                            </div>
                            <Badge>{product.category}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="py-8 text-center">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      No product data available
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="deliveries" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Deliveries Collection</h3>
                  <Badge variant="outline">{deliveryData.length} items</Badge>
                </div>
                <Separator />

                {dataLoading ? (
                  <div className="py-8 flex justify-center">
                    <Progress value={50} className="w-1/2 h-2" />
                  </div>
                ) : deliveryData.length > 0 ? (
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    <div className="space-y-4">
                      {deliveryData.map((delivery) => (
                        <div
                          key={delivery.id}
                          className="p-4 border rounded-md"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">
                                Delivery #{delivery.id}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Date:{" "}
                                {new Date(delivery.date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                SKU: {delivery.sku}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {delivery.boxCount} boxes
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="py-8 text-center">
                    <Info className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      No delivery data available
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="code-snippets" className="space-y-6 mt-6">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  <h3 className="text-lg font-medium">
                    Firebase Data Access Guide
                  </h3>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Getting Started</AlertTitle>
                  <AlertDescription>
                    Use these code snippets to access and manipulate data in
                    your Firebase collections. Click the copy button to copy the
                    code to your clipboard.
                  </AlertDescription>
                </Alert>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                      <div className="flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        <span>Fetching Products</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-md mt-2 bg-muted/30">
                      <div className="p-4 relative">
                        <pre className="text-sm overflow-x-auto p-4 bg-black text-white rounded-md">
                          {`import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

// Fetch all products
const fetchAllProducts = async () => {
  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Fetch products by category
const fetchProductsByCategory = async (category) => {
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("category", "==", category));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return products;
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
};`}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-6 right-6 bg-primary/10"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              document.querySelector("pre")?.textContent || "",
                            );
                            setCopiedSnippet("fetch-products");
                            setTimeout(() => setCopiedSnippet(null), 2000);
                          }}
                        >
                          {copiedSnippet === "fetch-products" ? (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" /> Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                      <div className="flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        <span>Adding & Updating Products</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-md mt-2 bg-muted/30">
                      <div className="p-4 relative">
                        <pre className="text-sm overflow-x-auto p-4 bg-black text-white rounded-md">
                          {`import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

// Add a new product
const addProduct = async (productData) => {
  try {
    const productsRef = collection(db, "products");
    const docRef = await addDoc(productsRef, {
      name: productData.name,
      sku: productData.sku,
      category: productData.category,
      createdAt: new Date(),
      // Add other fields as needed
    });
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

// Update an existing product
const updateProduct = async (productId, updatedData) => {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      ...updatedData,
      updatedAt: new Date()
    });
    return { id: productId, ...updatedData };
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

// Delete a product
const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};`}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-6 right-6 bg-primary/10"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              document.querySelector("pre:nth-of-type(2)")
                                ?.textContent || "",
                            );
                            setCopiedSnippet("add-update-products");
                            setTimeout(() => setCopiedSnippet(null), 2000);
                          }}
                        >
                          {copiedSnippet === "add-update-products" ? (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" /> Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        <span>Managing Deliveries</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-md mt-2 bg-muted/30">
                      <div className="p-4 relative">
                        <pre className="text-sm overflow-x-auto p-4 bg-black text-white rounded-md">
                          {`import { collection, addDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/services/firebase";

// Record a new delivery
const recordDelivery = async (deliveryData) => {
  try {
    const deliveriesRef = collection(db, "deliveries");
    const docRef = await addDoc(deliveriesRef, {
      date: new Date(),
      sku: deliveryData.sku,
      boxCount: deliveryData.boxCount,
      notes: deliveryData.notes || "",
      receivedBy: deliveryData.receivedBy,
      // Add other fields as needed
    });
    return { id: docRef.id, ...deliveryData };
  } catch (error) {
    console.error("Error recording delivery:", error);
    throw error;
  }
};

// Get recent deliveries
const getRecentDeliveries = async (limitCount = 10) => {
  try {
    const deliveriesRef = collection(db, "deliveries");
    const q = query(
      deliveriesRef,
      orderBy("date", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const deliveries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate() // Convert Firestore timestamp to JS Date
    }));
    return deliveries;
  } catch (error) {
    console.error("Error fetching recent deliveries:", error);
    return [];
  }
};

// Get deliveries for a specific product
const getDeliveriesBySku = async (sku) => {
  try {
    const deliveriesRef = collection(db, "deliveries");
    const q = query(deliveriesRef, where("sku", "==", sku));
    const snapshot = await getDocs(q);
    const deliveries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate() // Convert Firestore timestamp to JS Date
    }));
    return deliveries;
  } catch (error) {
    console.error("Error fetching deliveries by SKU:", error);
    return [];
  }
};`}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-6 right-6 bg-primary/10"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              document.querySelector("pre:nth-of-type(3)")
                                ?.textContent || "",
                            );
                            setCopiedSnippet("manage-deliveries");
                            setTimeout(() => setCopiedSnippet(null), 2000);
                          }}
                        >
                          {copiedSnippet === "manage-deliveries" ? (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" /> Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                      <div className="flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        <span>Real-time Data with Listeners</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-md mt-2 bg-muted/30">
                      <div className="p-4 relative">
                        <pre className="text-sm overflow-x-auto p-4 bg-black text-white rounded-md">
                          {`import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useEffect, useState } from "react";

// React hook for real-time products
export const useRealtimeProducts = (category = null) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    // Create query based on whether category filter is provided
    const productsRef = collection(db, "products");
    const q = category 
      ? query(productsRef, where("category", "==", category))
      : query(productsRef);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error in products listener:", err);
        setError(err);
        setLoading(false);
      }
    );
    
    // Clean up listener on component unmount
    return () => unsubscribe();
  }, [category]);

  return { products, loading, error };
};

// Usage in a component:
// const { products, loading, error } = useRealtimeProducts("men_shoes");`}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-6 right-6 bg-primary/10"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              document.querySelector("pre:nth-of-type(4)")
                                ?.textContent || "",
                            );
                            setCopiedSnippet("realtime-data");
                            setTimeout(() => setCopiedSnippet(null), 2000);
                          }}
                        >
                          {copiedSnippet === "realtime-data" ? (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" /> Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                      <div className="flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        <span>Best Practices</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-md mt-2 bg-muted/30 p-4">
                      <div className="space-y-4">
                        <h4 className="font-medium">
                          Firebase Data Structure Best Practices
                        </h4>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>
                            Keep your document structure flat when possible
                          </li>
                          <li>
                            Use subcollections for one-to-many relationships
                          </li>
                          <li>
                            Denormalize data when it makes sense for your
                            queries
                          </li>
                          <li>Keep document size under 1MB</li>
                          <li>
                            Use batch writes for atomic operations across
                            multiple documents
                          </li>
                          <li>
                            Consider using transactions for read-then-write
                            operations
                          </li>
                          <li>Add proper indexes for complex queries</li>
                        </ul>

                        <h4 className="font-medium mt-4">Error Handling</h4>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>
                            Always wrap Firebase operations in try/catch blocks
                          </li>
                          <li>
                            Implement proper error handling and user feedback
                          </li>
                          <li>
                            Consider implementing retry logic for network
                            failures
                          </li>
                          <li>
                            Log errors for debugging but sanitize sensitive
                            information
                          </li>
                        </ul>

                        <h4 className="font-medium mt-4">Performance Tips</h4>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>
                            Use queries with limits to avoid fetching
                            unnecessary data
                          </li>
                          <li>Implement pagination for large collections</li>
                          <li>Use composite indexes for complex queries</li>
                          <li>Detach listeners when components unmount</li>
                          <li>Consider caching frequently accessed data</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={checkConnection}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
          <Button
            onClick={initializeData}
            disabled={loading || initializing || !connectionStatus?.connected}
          >
            {initializing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Initialize Collections
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
