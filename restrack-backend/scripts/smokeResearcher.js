require("dotenv").config();
const jwt = require("jsonwebtoken");
const pool = require("../db");

async function main() {
  const email = process.argv[2] || "juan@restrack.com";
  const userRes = await pool.query("SELECT user_id, email FROM users WHERE email = $1", [email]);
  const user = userRes.rows[0];
  if (!user) throw new Error(`User not found: ${email}`);

  const token = jwt.sign({ id: user.user_id, email: user.email }, process.env.JWT_SECRET);

  for (const ep of ["/api/dashboard/researcher/stats", "/api/studies/my?limit=3"]) {
    const r = await fetch(`http://localhost:5000${ep}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(ep, "->", r.status);
    console.log(await r.text());
  }

  const listRes = await fetch("http://localhost:5000/api/studies/my?limit=1", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listJson = await listRes.json();
  const firstId = listJson?.studies?.[0]?.id;
  if (firstId) {
    const r = await fetch(`http://localhost:5000/api/studies/${firstId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`/api/studies/${firstId}`, "->", r.status);
    console.log(await r.text());
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

