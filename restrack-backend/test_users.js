const pool = require('./db');

async function test() {
  const result = await pool.query('SELECT * FROM users');
  console.log(result.rows);
  process.exit(0);
}
test();
