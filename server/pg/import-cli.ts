import { importConvexZip } from "./import-zip";

const zipPath = process.argv[2];
if (!zipPath) {
  console.error("Usage: tsx server/pg/import-cli.ts <convex-export.zip>");
  process.exit(1);
}

importConvexZip(zipPath)
  .then((result) => {
    console.log(`Imported ${result.imported} documents from ${zipPath}`);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
