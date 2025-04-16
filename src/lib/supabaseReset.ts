import { supabaseAdmin } from "./supabase";

/**
 * Deletes all data from all tables in the Supabase database
 * @returns Promise with the result of the operation
 */
export async function deleteAllTableData() {
  if (!supabaseAdmin) {
    throw new Error(
      "Admin client not available. Service role key is required.",
    );
  }

  try {
    // Get list of all tables in the public schema
    const { data: tables, error: tablesError } =
      await supabaseAdmin.rpc("get_tables");

    if (tablesError) {
      throw new Error(`Failed to get tables: ${tablesError.message}`);
    }

    if (!tables || !tables.length) {
      return { success: true, message: "No tables found to clear" };
    }

    // Delete data from each table
    const results = [];
    for (const table of tables) {
      // Skip system tables
      if (
        table.startsWith("_") ||
        table === "schema_migrations" ||
        table === "spatial_ref_sys"
      ) {
        continue;
      }

      const { error } = await supabaseAdmin.from(table).delete().neq("id", 0);

      if (error) {
        results.push({ table, success: false, error: error.message });
      } else {
        results.push({ table, success: true });
      }
    }

    return {
      success: true,
      results,
      message: `Cleared data from ${results.filter((r) => r.success).length} tables`,
    };
  } catch (error) {
    console.error("Error deleting table data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Deletes all files from all buckets in Supabase storage
 * @returns Promise with the result of the operation
 */
export async function deleteAllStorageFiles() {
  if (!supabaseAdmin) {
    throw new Error(
      "Admin client not available. Service role key is required.",
    );
  }

  try {
    // Get list of all storage buckets
    const { data: buckets, error: bucketsError } =
      await supabaseAdmin.storage.listBuckets();

    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }

    if (!buckets || !buckets.length) {
      return { success: true, message: "No storage buckets found" };
    }

    const results = [];

    // For each bucket, list and delete all files
    for (const bucket of buckets) {
      try {
        // List all files in the bucket
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucket.name)
          .list();

        if (listError) {
          results.push({
            bucket: bucket.name,
            success: false,
            error: listError.message,
          });
          continue;
        }

        if (!files || !files.length) {
          results.push({ bucket: bucket.name, success: true, filesDeleted: 0 });
          continue;
        }

        // Delete all files in the bucket
        const filePaths = files.map((file) => file.name);
        const { error: deleteError } = await supabaseAdmin.storage
          .from(bucket.name)
          .remove(filePaths);

        if (deleteError) {
          results.push({
            bucket: bucket.name,
            success: false,
            error: deleteError.message,
          });
        } else {
          results.push({
            bucket: bucket.name,
            success: true,
            filesDeleted: filePaths.length,
          });
        }
      } catch (error) {
        results.push({
          bucket: bucket.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      results,
      message: `Processed ${results.length} storage buckets`,
    };
  } catch (error) {
    console.error("Error deleting storage files:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
