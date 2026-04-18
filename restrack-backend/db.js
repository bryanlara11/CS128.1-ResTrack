const { Pool } = require("pg");
require("dotenv").config();

const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnv = requiredEnv.filter(
  (key) => typeof process.env[key] !== "string" || process.env[key].trim() === ""
);

if (missingEnv.length > 0) {
  throw new Error(
    [
      `Missing required environment variables: ${missingEnv.join(", ")}`,
      "Create a `restrack-backend/.env` file (see `restrack-backend/.env.example`) and restart the server.",
    ].join("\n")
  );
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
