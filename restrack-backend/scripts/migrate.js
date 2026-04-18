const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function migrate() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d+_.*\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  try {
    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, "utf8");
      await pool.query(sql);
      console.log(`Applied ${file}`);
    }
    console.log("Migrations applied successfully.");
  } finally {
    await pool.end();
  }
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});

