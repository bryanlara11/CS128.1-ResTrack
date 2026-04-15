const pool = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  const hash = await bcrypt.hash('password123', 10);

  await pool.query(`
    INSERT INTO roles (role_id, role_name) VALUES
      (1, 'Admin'),
      (2, 'Researcher'),
      (3, 'Reviewer'),
      (4, 'TRB')
    ON CONFLICT (role_name) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO department (department_id, department_name) VALUES
      (1, 'College of Science'),
      (2, 'College of Engineering'),
      (3, 'College of Medicine')
    ON CONFLICT (department_name) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO statuses (status_id, status_name) VALUES
      (1, 'Pending'),
      (2, 'Under Review'),
      (3, 'Approved'),
      (4, 'For Revision')
    ON CONFLICT (status_name) DO NOTHING
  `);

  // Insert users (upsert by email)
  const users = [
    { first: 'Admin',      last: 'User',     email: 'admin@restrack.com',      role_id: 1, dept_id: 1 },
    { first: 'Juan',       last: 'Dela Cruz',email: 'juan@restrack.com',       role_id: 2, dept_id: 1 },
    { first: 'Maria',      last: 'Santos',   email: 'maria@restrack.com',      role_id: 2, dept_id: 2 },
    { first: 'Carlos',     last: 'Reyes',    email: 'carlos@restrack.com',     role_id: 3, dept_id: 1 },
    { first: 'Ana',        last: 'Lopez',    email: 'ana@restrack.com',        role_id: 4, dept_id: 3 },
  ];

  for (const u of users) {
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, password, role_id, department_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (email) DO UPDATE SET role_id = $5, department_id = $6
    `, [u.first, u.last, u.email, hash, u.role_id, u.dept_id]);
  }

  // Get user IDs
  const juanRes = await pool.query("SELECT user_id FROM users WHERE email = 'juan@restrack.com'");
  const mariaRes = await pool.query("SELECT user_id FROM users WHERE email = 'maria@restrack.com'");
  const carlosRes = await pool.query("SELECT user_id FROM users WHERE email = 'carlos@restrack.com'");
  const adminRes = await pool.query("SELECT user_id FROM users WHERE email = 'admin@restrack.com'");

  const juan = juanRes.rows[0].user_id;
  const maria = mariaRes.rows[0].user_id;
  const carlos = carlosRes.rows[0].user_id;
  const admin = adminRes.rows[0].user_id;

  // Insert research studies
  const studies = [
    { title: 'Genomic Analysis of Philippine Rice Varieties', dept: 1, status: 3, author: juan, adviser: carlos },
    { title: 'Machine Learning for Dengue Prediction', dept: 2, status: 2, author: maria, adviser: carlos },
    { title: 'Antibiotic Resistance in Urban Water Systems', dept: 3, status: 1, author: juan, adviser: carlos },
    { title: 'Coral Reef Health Monitoring via Remote Sensing', dept: 1, status: 4, author: maria, adviser: carlos },
    { title: 'COVID-19 Variant Surveillance in Visayas', dept: 3, status: 3, author: juan, adviser: carlos },
  ];

  for (const s of studies) {
    await pool.query(`
      INSERT INTO research_studies (title, department_id, current_status_id, corresponding_author_id, adviser_id, created_by, date_registered)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [s.title, s.dept, s.status, s.author, s.adviser, admin]);
  }

  // Link authors
  const allStudies = await pool.query("SELECT research_id, corresponding_author_id FROM research_studies ORDER BY research_id");
  for (const row of allStudies.rows) {
    await pool.query(`
      INSERT INTO research_authors (research_id, user_id, author_type) VALUES ($1, $2, 'Primary')
    `, [row.research_id, row.corresponding_author_id]);
  }

  // Add some notifications
  await pool.query(`
    INSERT INTO notifications (research_id, user_id, message) VALUES
      ((SELECT research_id FROM research_studies LIMIT 1 OFFSET 0), $1, 'Your study "Genomic Analysis of Philippine Rice Varieties" has been approved.'),
      ((SELECT research_id FROM research_studies LIMIT 1 OFFSET 1), $2, 'Your study "Machine Learning for Dengue Prediction" is now under review.'),
      ((SELECT research_id FROM research_studies LIMIT 1 OFFSET 3), $2, 'Your study "Coral Reef Health Monitoring" has been returned for revision.')
  `, [juan, maria]);

  console.log('Seed data inserted successfully!');
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
