const pool = require('../db');

async function resetStudies() {
  console.log('Truncating study-related tables...');
  await pool.query(`
    TRUNCATE TABLE 
      notifications,
      review_feedback,
      review_assignment,
      trb_reviews,
      revision_history,
      research_authors,
      research_documents,
      bioinfo_datasets,
      bioinfo_samples,
      bioinfo_tools,
      bioinformatics,
      bioinfo_results,
      research_studies
    RESTART IDENTITY CASCADE;
  `);
  console.log('Tables truncated and sequences reset successfully.');
  await pool.end();
}

resetStudies().catch(e => {
  console.error('Error during truncation:', e);
  process.exit(1);
});
