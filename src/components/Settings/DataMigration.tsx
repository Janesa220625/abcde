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
  Trash2,
  FileX,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  migrateLocalStorageToSupabase,
  checkDataConsistency,
} from "@/lib/migration";
import { checkSupabaseConnection } from "@/services/supabase";
import { deleteAllTableData, deleteAllStorageFiles } from "@/lib/supabaseReset";

export default function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
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

      // For localStorage, check data consistency
      const isConsistent = await checkDataConsistency();
      console.log("Data consistency check result:", isConsistent);

      if (!isConsistent.consistent) {
        console.warn(
          `Data consistency issues found: ${isConsistent.inconsistencies.join(", ")}`,
        );
        // Continue with migration despite inconsistencies, but log them
      }

      // Perform the migration from localStorage to Supabase
      const result = await migrateLocalStorageToSupabase();

      setMigrationResult({
        success: result.success,
        migrated: result.migrated,
        errors: result.errors,
      });

      // Log the result for debugging
      console.log(`LocalStorage migration completed with result:`, result);
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="migration">
            <Database className="h-4 w-4 mr-2" /> Data Migration
          </TabsTrigger>
          <TabsTrigger value="reset">
            <RefreshCw className="h-4 w-4 mr-2" /> Data Reset
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
                Migrate data from local storage to Supabase to ensure a single
                source of truth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-4 p-4">
                <div className="text-center">
                  <HardDrive className="h-12 w-12 mx-auto mb-2 text-primary" />
                  <p className="font-medium text-primary">Local Storage</p>
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
              <Button onClick={handleMigration} disabled={isMigrating}>
                {isMigrating ? (
                  <>
                    <span className="mr-2">Migrating...</span>
                    <Progress value={75} className="w-16" />
                  </>
                ) : (
                  "Migrate from Local Storage to Supabase"
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
      </Tabs>
    </div>
  );
}
