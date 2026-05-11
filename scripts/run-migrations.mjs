import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
const connectionString = `postgresql://postgres:${encodeURIComponent(serviceKey)}@db.${projectRef}.supabase.co:5432/postgres`;

const pool = new pg.Pool({ connectionString, max: 1 });

const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = await pool.connect();

try {
  for (const file of files) {
    console.log(`Running ${file}...`);
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    try {
      await client.query(sql);
      console.log(`  OK`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg.slice(0, 300)}`);
    }
  }
  console.log("All migrations completed.");
} finally {
  client.release();
  await pool.end();
}
