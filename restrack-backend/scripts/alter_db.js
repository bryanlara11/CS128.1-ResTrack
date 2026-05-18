const pool = require('../db');

async function run() {
  try {
    await pool.query('ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS assigned_trb_id INTEGER REFERENCES users(user_id);');
    console.log('Column assigned_trb_id added successfully.');
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    await pool.end();
  }
}

run();
