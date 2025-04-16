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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
              <TabsList className="grid w-full grid-cols-3">
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
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Initialization Complete</AlertTitle>
                    <AlertDescription>
                      Products: {initializationResult.products.count} items
                      <br />
                      Deliveries: {initializationResult.deliveries.count} items
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
            {initializing ? "Initializing..." : "Initialize Collections"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
