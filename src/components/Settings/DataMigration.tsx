import React, { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Database,
  HardDrive,
  Flame,
  Trash2,
  FileX,
  RefreshCw,
  Cloud,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  migrateLocalStorageToSupabase,
  migrateFirebaseToSupabase,
  checkDataConsistency,
} from "@/lib/migration";
import { checkSupabaseConnection } from "@/services/supabase";
import {
  checkFirebaseConnection,
  checkFirebaseStorage,
} from "@/services/firebase";
import { deleteAllTableData, deleteAllStorageFiles } from "@/lib/supabaseReset";
import { createStorageBucket } from "@/services/firebaseAdmin";

export default function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSource, setMigrationSource] = useState<
    "localStorage" | "firebase"
  >("localStorage");
  const [migrationResult, setMigrationResult] = useState<{
    success?: boolean;
    migrated?: string[];
    errors?: string[];
  }>({});

  const [isChecking, setIsChecking] = useState(false);
  const [consistencyResult, setConsistencyResult] = useState<{
    consistent?: boolean;
    inconsistencies?: string[];
  }>({});

  const [firebaseStatus, setFirebaseStatus] = useState<{
    checked: boolean;
    connected: boolean;
    error?: string;
  }>({ checked: false, connected: false });

  // State for Firebase storage check
  const [firebaseStorageStatus, setFirebaseStorageStatus] = useState<{
    checked: boolean;
    available: boolean;
    bucketName?: string;
    error?: string;
  }>({ checked: false, available: false });

  // State for bucket creation
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [customBucketName, setCustomBucketName] = useState("");
  const [bucketCreationResult, setBucketCreationResult] = useState<{
    success?: boolean;
    bucketName?: string;
    error?: string;
  }>({});

  // States for Supabase reset operations
  const [isResettingTables, setIsResettingTables] = useState(false);
  const [isResettingStorage, setIsResettingStorage] = useState(false);
  const [resetTablesResult, setResetTablesResult] = useState<{
    success?: boolean;
    message?: string;
    results?: Array<{ table: string; success: boolean; error?: string }>;
  }>({});
  const [resetStorageResult, setResetStorageResult] = useState<{
    success?: boolean;
    message?: string;
    results?: Array<{
      bucket: string;
      success: boolean;
      filesDeleted?: number;
      error?: string;
    }>;
  }>({});

  // Reset the results when switching tabs
  const handleTabChange = (value: string) => {
    if (value === "migration") {
      setResetTablesResult({});
      setResetStorageResult({});
    } else if (value === "reset") {
      setMigrationResult({});
      setConsistencyResult({});
    }
  };

  const checkFirebase = async () => {
    try {
      const status = await checkFirebaseConnection();
      setFirebaseStatus({
        checked: true,
        connected: status.connected,
        error: status.details.error,
      });
      return status.connected;
    } catch (error) {
      setFirebaseStatus({
        checked: true,
        connected: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error checking Firebase",
      });
      return false;
    }
  };

  const checkFirebaseStorageBucket = async () => {
    try {
      const status = await checkFirebaseStorage();
      setFirebaseStorageStatus({
        checked: true,
        available: status.available,
        bucketName: status.details.defaultBucketName,
        error: status.details.error,
      });
      return status.available;
    } catch (error) {
      setFirebaseStorageStatus({
        checked: true,
        available: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error checking Firebase Storage",
      });
      return false;
    }
  };

  const createFirebaseBucket = async () => {
    setIsCreatingBucket(true);
    setBucketCreationResult({});

    try {
      // First check Firebase connection
      const firebaseConnected = await checkFirebase();
      if (!firebaseConnected) {
        throw new Error(
          `Firebase connection issues: ${firebaseStatus.error || "Unknown connection error"}`,
        );
      }

      // Get the bucket name from the input field, environment, or use the default format
      const bucketName =
        customBucketName.trim() ||
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
        `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`;

      if (!bucketName) {
        throw new Error(
          "No bucket name provided and no default bucket configured",
        );
      }

      // Call the Firebase Admin SDK to create the bucket
      const { success, bucket, error } = await createStorageBucket(bucketName);

      if (!success) {
        throw new Error(error || "Unknown error creating bucket");
      }

      // Update the result state
      setBucketCreationResult({
        success: true,
        bucketName: bucket,
      });

      // Refresh the Firebase storage status
      await checkFirebaseStorageBucket();

      // Clear the custom bucket name input after successful creation
      setCustomBucketName("");

      console.log(`Successfully created Firebase bucket: ${bucket}`);
    } catch (error) {
      console.error("Error creating Firebase bucket:", error);
      setBucketCreationResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsCreatingBucket(false);
    }
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      // First check Supabase connection
      const connectionStatus = await checkSupabaseConnection();
      console.log("Supabase connection check result:", connectionStatus);

      if (!connectionStatus.connected) {
        throw new Error(
          `Supabase connection issues: ${connectionStatus.details.error || "Unknown connection error"}`,
        );
      }

      // If migrating from Firebase, check Firebase connection
      if (migrationSource === "firebase") {
        const firebaseConnected = await checkFirebase();
        if (!firebaseConnected) {
          throw new Error(
            `Firebase connection issues: ${firebaseStatus.error || "Unknown connection error"}`,
          );
        }
      } else {
        // For localStorage, check data consistency
        const isConsistent = await checkDataConsistency();
        console.log("Data consistency check result:", isConsistent);

        if (!isConsistent.consistent) {
          console.warn(
            `Data consistency issues found: ${isConsistent.inconsistencies.join(", ")}`,
          );
          // Continue with migration despite inconsistencies, but log them
        }
      }

      // Perform the migration based on the selected source
      const result =
        migrationSource === "firebase"
          ? await migrateFirebaseToSupabase()
          : await migrateLocalStorageToSupabase();

      setMigrationResult({
        success: result.success,
        migrated: result.migrated,
        errors: result.errors,
      });

      // Log the result for debugging
      console.log(
        `${migrationSource} migration completed with result:`,
        result,
      );
    } catch (error) {
      console.error("Migration failed:", error);
      setMigrationResult({
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : "Unexpected error during migration",
        ],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleConsistencyCheck = async () => {
    setIsChecking(true);
    try {
      const result = await checkDataConsistency();
      setConsistencyResult(result);
    } catch (error) {
      console.error("Consistency check failed:", error);
      setConsistencyResult({
        consistent: false,
        inconsistencies: ["Unexpected error during consistency check"],
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResetTables = async () => {
    setIsResettingTables(true);
    setResetTablesResult({});

    try {
      // First check Supabase connection
      const connectionStatus = await checkSupabaseConnection();

      if (!connectionStatus.connected) {
        throw new Error(
          `Supabase connection issues: ${connectionStatus.details.error || "Unknown connection error"}`,
        );
      }

      const result = await deleteAllTableData();
      setResetTablesResult(result);

      console.log("Table reset completed with result:", result);
    } catch (error) {
      console.error("Table reset failed:", error);
      setResetTablesResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected error during table reset",
        results:
          error instanceof Error && error.cause
            ? [{ table: "connection", success: false, error: error.message }]
            : [
                {
                  table: "unknown",
                  success: false,
                  error: "Unexpected error during table reset",
                },
              ],
      });
    } finally {
      setIsResettingTables(false);
    }
  };

  const handleResetStorage = async () => {
    setIsResettingStorage(true);
    setResetStorageResult({});

    try {
      // First check Supabase connection
      const connectionStatus = await checkSupabaseConnection();

      if (!connectionStatus.connected) {
        throw new Error(
          `Supabase connection issues: ${connectionStatus.details.error || "Unknown connection error"}`,
        );
      }

      const result = await deleteAllStorageFiles();
      setResetStorageResult(result);

      console.log("Storage reset completed with result:", result);
    } catch (error) {
      console.error("Storage reset failed:", error);
      setResetStorageResult({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected error during storage reset",
        results:
          error instanceof Error && error.cause
            ? [{ bucket: "connection", success: false, error: error.message }]
            : [
                {
                  bucket: "unknown",
                  success: false,
                  error: "Unexpected error during storage reset",
                },
              ],
      });
    } finally {
      setIsResettingStorage(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="migration"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="migration">
            <Database className="h-4 w-4 mr-2" /> Data Migration
          </TabsTrigger>
          <TabsTrigger value="reset">
            <RefreshCw className="h-4 w-4 mr-2" /> Data Reset
          </TabsTrigger>
          <TabsTrigger value="firebase">
            <Cloud className="h-4 w-4 mr-2" /> Firebase Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="migration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Migration Utility
              </CardTitle>
              <CardDescription>
                Migrate data from local storage or Firebase to Supabase to
                ensure a single source of truth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-4 p-4">
                <div
                  className="text-center cursor-pointer"
                  onClick={() => setMigrationSource("localStorage")}
                >
                  <HardDrive
                    className={`h-12 w-12 mx-auto mb-2 ${migrationSource === "localStorage" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p
                    className={`font-medium ${migrationSource === "localStorage" ? "text-primary" : ""}`}
                  >
                    Local Storage
                  </p>
                </div>
                <div
                  className="text-center cursor-pointer"
                  onClick={() => setMigrationSource("firebase")}
                >
                  <Flame
                    className={`h-12 w-12 mx-auto mb-2 ${migrationSource === "firebase" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p
                    className={`font-medium ${migrationSource === "firebase" ? "text-primary" : ""}`}
                  >
                    Firebase
                  </p>
                </div>
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <Database className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Supabase</p>
                </div>
              </div>

              {migrationResult.success !== undefined && (
                <Alert
                  variant={migrationResult.success ? "default" : "destructive"}
                >
                  <div className="flex items-start gap-2">
                    {migrationResult.success ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <div>
                      <AlertTitle>
                        {migrationResult.success
                          ? "Migration Successful"
                          : "Migration Failed"}
                      </AlertTitle>
                      <AlertDescription>
                        {migrationResult.success ? (
                          <div className="mt-2">
                            <p>Successfully migrated the following data:</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {migrationResult.migrated?.map((item) => (
                                <Badge key={item} variant="outline">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <p>Failed to migrate the following data:</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {migrationResult.errors?.map((error) => (
                                <Badge key={error} variant="outline">
                                  {error}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              {consistencyResult.consistent !== undefined && (
                <Alert
                  variant={
                    consistencyResult.consistent ? "default" : "destructive"
                  }
                >
                  <div className="flex items-start gap-2">
                    {consistencyResult.consistent ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <div>
                      <AlertTitle>
                        {consistencyResult.consistent
                          ? "Data Consistency Check Passed"
                          : "Data Inconsistencies Found"}
                      </AlertTitle>
                      <AlertDescription>
                        {consistencyResult.consistent ? (
                          <p>
                            All data is consistent between local storage and
                            Supabase.
                          </p>
                        ) : (
                          <div className="mt-2">
                            <p>The following inconsistencies were found:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              {consistencyResult.inconsistencies?.map(
                                (item, index) => <li key={index}>{item}</li>,
                              )}
                            </ul>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {migrationSource === "localStorage" && (
                <Button
                  variant="outline"
                  onClick={handleConsistencyCheck}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <>
                      <span className="mr-2">Checking...</span>
                      <Progress value={75} className="w-16" />
                    </>
                  ) : (
                    "Check Data Consistency"
                  )}
                </Button>
              )}
              {migrationSource === "firebase" && (
                <Button
                  variant="outline"
                  onClick={checkFirebase}
                  disabled={isMigrating}
                >
                  {firebaseStatus.checked ? (
                    firebaseStatus.connected ? (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Firebase Connected
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                        Firebase Connection Failed
                      </span>
                    )
                  ) : (
                    "Check Firebase Connection"
                  )}
                </Button>
              )}
              <Button
                onClick={handleMigration}
                disabled={
                  isMigrating ||
                  (migrationSource === "firebase" && !firebaseStatus.connected)
                }
              >
                {isMigrating ? (
                  <>
                    <span className="mr-2">Migrating...</span>
                    <Progress value={75} className="w-16" />
                  </>
                ) : (
                  `Migrate from ${migrationSource === "firebase" ? "Firebase" : "Local Storage"} to Supabase`
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="reset">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Supabase Data Reset
              </CardTitle>
              <CardDescription>
                Reset your Supabase database by deleting all data from tables
                and storage buckets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Trash2 className="h-5 w-5 mr-2 text-destructive" />
                      <h3 className="text-lg font-medium">Database Tables</h3>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleResetTables}
                      disabled={isResettingTables}
                    >
                      {isResettingTables ? (
                        <>
                          <span className="mr-2">Deleting...</span>
                          <Progress value={75} className="w-16" />
                        </>
                      ) : (
                        "Delete All Table Data"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    This will delete all data from all tables in your Supabase
                    database. This action cannot be undone.
                  </p>

                  {resetTablesResult.success !== undefined && (
                    <Alert
                      variant={
                        resetTablesResult.success ? "default" : "destructive"
                      }
                      className="mt-4"
                    >
                      <div className="flex items-start gap-2">
                        {resetTablesResult.success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                        <div>
                          <AlertTitle>
                            {resetTablesResult.success
                              ? "Tables Reset Successfully"
                              : "Failed to Reset Tables"}
                          </AlertTitle>
                          <AlertDescription>
                            {resetTablesResult.message}
                            {!resetTablesResult.success &&
                              resetTablesResult.results && (
                                <div className="mt-2">
                                  <p className="font-semibold text-sm">
                                    Error details:
                                  </p>
                                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                    {resetTablesResult.results.map(
                                      (result, idx) => (
                                        <li key={idx}>
                                          {result.table}: {result.error}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <FileX className="h-5 w-5 mr-2 text-destructive" />
                      <h3 className="text-lg font-medium">Storage Buckets</h3>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleResetStorage}
                      disabled={isResettingStorage}
                    >
                      {isResettingStorage ? (
                        <>
                          <span className="mr-2">Deleting...</span>
                          <Progress value={75} className="w-16" />
                        </>
                      ) : (
                        "Delete All Storage Files"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    This will delete all files from all storage buckets in your
                    Supabase project. This action cannot be undone.
                  </p>

                  {resetStorageResult.success !== undefined && (
                    <Alert
                      variant={
                        resetStorageResult.success ? "default" : "destructive"
                      }
                      className="mt-4"
                    >
                      <div className="flex items-start gap-2">
                        {resetStorageResult.success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                        <div>
                          <AlertTitle>
                            {resetStorageResult.success
                              ? "Storage Reset Successfully"
                              : "Failed to Reset Storage"}
                          </AlertTitle>
                          <AlertDescription>
                            {resetStorageResult.message}
                            {!resetStorageResult.success &&
                              resetStorageResult.results && (
                                <div className="mt-2">
                                  <p className="font-semibold text-sm">
                                    Error details:
                                  </p>
                                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                    {resetStorageResult.results.map(
                                      (result, idx) => (
                                        <li key={idx}>
                                          {result.bucket}: {result.error}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                            {resetStorageResult.success &&
                              resetStorageResult.results && (
                                <div className="mt-2">
                                  <p className="font-semibold text-sm">
                                    Operation details:
                                  </p>
                                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                    {resetStorageResult.results.map(
                                      (result, idx) => (
                                        <li key={idx}>
                                          {result.bucket}:{" "}
                                          {result.success
                                            ? `Deleted ${result.filesDeleted || 0} files`
                                            : `Failed: ${result.error}`}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firebase">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Firebase Storage Bucket
              </CardTitle>
              <CardDescription>
                Check if a Firebase storage bucket exists and is accessible for
                your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Cloud className="h-5 w-5 mr-2 text-primary" />
                    <h3 className="text-lg font-medium">
                      Storage Bucket Status
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={checkFirebaseStorageBucket}
                    >
                      {firebaseStorageStatus.checked ? (
                        firebaseStorageStatus.available ? (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Storage Bucket Available
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                            Storage Bucket Unavailable
                          </span>
                        )
                      ) : (
                        "Check Storage Bucket"
                      )}
                    </Button>
                    {firebaseStorageStatus.checked &&
                      !firebaseStorageStatus.available && (
                        <Button
                          variant="default"
                          onClick={createFirebaseBucket}
                          disabled={isCreatingBucket}
                        >
                          {isCreatingBucket ? (
                            <>
                              <span className="mr-2">Creating...</span>
                              <Progress value={75} className="w-16" />
                            </>
                          ) : (
                            <span className="flex items-center">
                              <Cloud className="h-4 w-4 mr-2" />
                              Create Bucket
                            </span>
                          )}
                        </Button>
                      )}
                  </div>
                </div>

                {/* Custom bucket name input field */}
                {firebaseStorageStatus.checked &&
                  !firebaseStorageStatus.available && (
                    <div className="mt-4 mb-4">
                      <label
                        htmlFor="custom-bucket-name"
                        className="block text-sm font-medium mb-1"
                      >
                        Custom Bucket Name (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="custom-bucket-name"
                          type="text"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="your-custom-bucket-name"
                          value={customBucketName}
                          onChange={(e) => setCustomBucketName(e.target.value)}
                          disabled={isCreatingBucket}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty to use the default bucket name from your
                        Firebase configuration.
                      </p>
                    </div>
                  )}

                {/* Bucket creation result */}
                {bucketCreationResult.success !== undefined && (
                  <Alert
                    variant={
                      bucketCreationResult.success ? "default" : "destructive"
                    }
                    className="mt-4 mb-4"
                  >
                    <div className="flex items-start gap-2">
                      {bucketCreationResult.success ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <div>
                        <AlertTitle>
                          {bucketCreationResult.success
                            ? "Firebase Storage Bucket Created"
                            : "Failed to Create Firebase Storage Bucket"}
                        </AlertTitle>
                        <AlertDescription>
                          {bucketCreationResult.success ? (
                            <p>
                              Successfully created bucket:{" "}
                              <span className="font-semibold">
                                {bucketCreationResult.bucketName}
                              </span>
                            </p>
                          ) : (
                            <p>Error: {bucketCreationResult.error}</p>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Firebase storage status */}
                {firebaseStorageStatus.checked && (
                  <Alert
                    variant={
                      firebaseStorageStatus.available
                        ? "default"
                        : "destructive"
                    }
                    className="mt-4"
                  >
                    <div className="flex items-start gap-2">
                      {firebaseStorageStatus.available ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <div>
                        <AlertTitle>
                          {firebaseStorageStatus.available
                            ? "Firebase Storage Bucket Available"
                            : "Firebase Storage Bucket Unavailable"}
                        </AlertTitle>
                        <AlertDescription>
                          {firebaseStorageStatus.available ? (
                            <div>
                              <p>
                                Your Firebase storage bucket is properly
                                configured and accessible.
                              </p>
                              {firebaseStorageStatus.bucketName && (
                                <p className="mt-2">
                                  <span className="font-semibold">
                                    Bucket name:
                                  </span>{" "}
                                  {firebaseStorageStatus.bucketName}
                                </p>
                              )}
                              <div className="mt-4">
                                <h4 className="font-semibold mb-2">
                                  Connection Instructions:
                                </h4>
                                <ol className="list-decimal pl-5 space-y-2">
                                  <li>
                                    Your app is already configured to use this
                                    storage bucket.
                                  </li>
                                  <li>
                                    To upload files, use the Firebase Storage
                                    SDK:
                                  </li>
                                  <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                                    {`import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";

// Example upload function
const uploadFile = async (file) => {
  const storageRef = ref(storage, 'files/' + file.name);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};`}
                                  </pre>
                                </ol>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p>
                                Your Firebase storage bucket is not properly
                                configured or accessible.
                              </p>
                              {firebaseStorageStatus.error && (
                                <p className="mt-2 text-sm">
                                  <span className="font-semibold">Error:</span>{" "}
                                  {firebaseStorageStatus.error}
                                </p>
                              )}
                              <div className="mt-4">
                                <h4 className="font-semibold mb-2">
                                  Troubleshooting Steps:
                                </h4>
                                <ol className="list-decimal pl-5 space-y-2">
                                  <li>
                                    Verify that you have set the{" "}
                                    <code className="bg-muted px-1 rounded">
                                      VITE_FIREBASE_STORAGE_BUCKET
                                    </code>{" "}
                                    environment variable.
                                  </li>
                                  <li>
                                    Check that your Firebase project has a
                                    storage bucket created in the Firebase
                                    Console.
                                  </li>
                                  <li>
                                    Ensure that your Firebase security rules
                                    allow access to the storage bucket.
                                  </li>
                                  <li>
                                    Verify that your Firebase API key has
                                    permission to access Storage services.
                                  </li>
                                </ol>
                              </div>
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
