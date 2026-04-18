require("dotenv").config();
const pool = require("../db");

async function main() {
  const r = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('notification','notifications') ORDER BY table_name"
  );
  console.log(r.rows);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

