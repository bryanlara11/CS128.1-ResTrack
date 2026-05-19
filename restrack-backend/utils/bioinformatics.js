function str(value) {
  return String(value ?? "").trim();
}

function hasResultsData(results) {
  if (!results || typeof results !== "object") return false;
  return [
    "organismName",
    "studyType",
    "dataType",
    "databaseSource",
    "softwareTool",
    "accessionNo",
    "sequenceType",
    "notes",
  ].some((key) => str(results[key]));
}

function isSampleRow(sample) {
  if (!sample) return false;
  return ["sampleCode", "sampleType", "organismName", "collectionDate", "collectionSite", "remarks"].some(
    (key) => str(sample[key])
  );
}

function isToolRow(tool) {
  if (!tool) return false;
  return ["toolName", "toolVersion", "purpose", "parameters", "referenceDatabase", "dateUsed"].some(
    (key) => str(tool[key])
  );
}

function isDatasetRow(dataset) {
  if (!dataset) return false;
  return ["datasetName", "dataType", "accessionNo", "uploadDate"].some((key) => str(dataset[key]));
}

function hasBioinformaticsPayload(bio) {
  if (!bio || typeof bio !== "object") return false;
  const samples = Array.isArray(bio.samples) ? bio.samples.filter(isSampleRow) : [];
  const tools = Array.isArray(bio.tools) ? bio.tools.filter(isToolRow) : [];
  const datasets = Array.isArray(bio.datasets) ? bio.datasets.filter(isDatasetRow) : [];
  return hasResultsData(bio.results) || samples.length > 0 || tools.length > 0 || datasets.length > 0;
}

function toDateOrNull(value) {
  const v = str(value);
  if (!v) return null;
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

async function deleteBioinformaticsForStudy(researchId, client) {
  await client.query(
    `
    DELETE FROM bioinfo_datasets
    WHERE bioinfo_id IN (SELECT bioinfo_id FROM bioinformatics WHERE research_id = $1)
    `,
    [researchId]
  );
  await client.query(
    `
    DELETE FROM bioinfo_samples
    WHERE bioinfo_id IN (SELECT bioinfo_id FROM bioinformatics WHERE research_id = $1)
    `,
    [researchId]
  );
  await client.query(
    `
    DELETE FROM bioinfo_tools
    WHERE bioinfo_id IN (SELECT bioinfo_id FROM bioinformatics WHERE research_id = $1)
    `,
    [researchId]
  );
  await client.query(`DELETE FROM bioinformatics WHERE research_id = $1`, [researchId]);
  await client.query(`DELETE FROM bioinfo_results WHERE research_id = $1`, [researchId]);
}

async function saveBioinformatics(researchId, bio, client) {
  await deleteBioinformaticsForStudy(researchId, client);

  if (!hasBioinformaticsPayload(bio)) return;

  const results = bio.results || {};
  const samples = Array.isArray(bio.samples) ? bio.samples.filter(isSampleRow) : [];
  const tools = Array.isArray(bio.tools) ? bio.tools.filter(isToolRow) : [];
  const datasets = Array.isArray(bio.datasets) ? bio.datasets.filter(isDatasetRow) : [];

  const parentRes = await client.query(
    `
    INSERT INTO bioinformatics (research_id, study_type, description)
    VALUES ($1, $2, $3)
    RETURNING bioinfo_id
    `,
    [researchId, str(results.studyType) || null, str(results.notes) || null]
  );
  const bioinfoId = parentRes.rows[0]?.bioinfo_id;
  if (!bioinfoId) return;

  if (hasResultsData(results)) {
    await client.query(
      `
      INSERT INTO bioinfo_results (
        research_id,
        study_type,
        organism_name,
        data_type,
        database_source,
        software_tool_used,
        accession_no,
        sequence_type,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        researchId,
        str(results.studyType) || null,
        str(results.organismName) || null,
        str(results.dataType) || null,
        str(results.databaseSource) || null,
        str(results.softwareTool) || null,
        str(results.accessionNo) || null,
        str(results.sequenceType) || null,
        str(results.notes) || null,
      ]
    );
  }

  for (const sample of samples) {
    await client.query(
      `
      INSERT INTO bioinfo_samples (
        bioinfo_id,
        sample_code,
        sample_type,
        organism_name,
        collection_date,
        collection_site,
        remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        bioinfoId,
        str(sample.sampleCode) || null,
        str(sample.sampleType) || null,
        str(sample.organismName) || null,
        toDateOrNull(sample.collectionDate),
        str(sample.collectionSite) || null,
        str(sample.remarks) || null,
      ]
    );
  }

  for (const tool of tools) {
    await client.query(
      `
      INSERT INTO bioinfo_tools (
        bioinfo_id,
        tool_name,
        tool_version,
        purpose,
        parameters,
        reference_database,
        date_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        bioinfoId,
        str(tool.toolName) || "Unknown",
        str(tool.toolVersion) || null,
        str(tool.purpose) || null,
        str(tool.parameters) || null,
        str(tool.referenceDatabase) || null,
        toDateOrNull(tool.dateUsed),
      ]
    );
  }

  for (const dataset of datasets) {
    const uploadDate = toDateOrNull(dataset.uploadDate);
    await client.query(
      `
      INSERT INTO bioinfo_datasets (
        bioinfo_id,
        dataset_name,
        data_type,
        accession_no,
        upload_date,
        is_raw_data
      ) VALUES ($1, $2, $3, $4, COALESCE($5::date, NOW()), $6)
      `,
      [
        bioinfoId,
        str(dataset.datasetName) || null,
        str(dataset.dataType) || null,
        str(dataset.accessionNo) || null,
        uploadDate,
        Boolean(dataset.isRawData),
      ]
    );
  }
}

async function fetchBioinformatics(researchId, client) {
  const resultsRes = await client.query(
    `
    SELECT
      study_type,
      organism_name,
      data_type,
      database_source,
      software_tool_used,
      accession_no,
      sequence_type,
      notes
    FROM bioinfo_results
    WHERE research_id = $1
    ORDER BY bioinfo_id DESC
    LIMIT 1
    `,
    [researchId]
  );

  const parentRes = await client.query(
    `
    SELECT bioinfo_id, study_type, description
    FROM bioinformatics
    WHERE research_id = $1
    ORDER BY bioinfo_id DESC
    LIMIT 1
    `,
    [researchId]
  );

  const bioinfoId = parentRes.rows[0]?.bioinfo_id;
  if (!bioinfoId && resultsRes.rows.length === 0) {
    return null;
  }

  let samples = [];
  let tools = [];
  let datasets = [];

  if (bioinfoId) {
    const samplesRes = await client.query(
      `
      SELECT sample_code, sample_type, organism_name, collection_date, collection_site, remarks
      FROM bioinfo_samples
      WHERE bioinfo_id = $1
      ORDER BY sample_id ASC
      `,
      [bioinfoId]
    );
    const toolsRes = await client.query(
      `
      SELECT tool_name, tool_version, purpose, parameters, reference_database, date_used
      FROM bioinfo_tools
      WHERE bioinfo_id = $1
      ORDER BY tool_id ASC
      `,
      [bioinfoId]
    );
    const datasetsRes = await client.query(
      `
      SELECT dataset_name, data_type, accession_no, upload_date, is_raw_data
      FROM bioinfo_datasets
      WHERE bioinfo_id = $1
      ORDER BY dataset_id ASC
      `,
      [bioinfoId]
    );

    samples = samplesRes.rows.map((row) => ({
      sampleCode: row.sample_code || "",
      sampleType: row.sample_type || "",
      organismName: row.organism_name || "",
      collectionDate: row.collection_date
        ? new Date(row.collection_date).toISOString().slice(0, 10)
        : "",
      collectionSite: row.collection_site || "",
      remarks: row.remarks || "",
    }));

    tools = toolsRes.rows.map((row) => ({
      toolName: row.tool_name || "",
      toolVersion: row.tool_version || "",
      purpose: row.purpose || "",
      parameters: row.parameters || "",
      referenceDatabase: row.reference_database || "",
      dateUsed: row.date_used ? new Date(row.date_used).toISOString().slice(0, 10) : "",
    }));

    datasets = datasetsRes.rows.map((row) => ({
      datasetName: row.dataset_name || "",
      dataType: row.data_type || "",
      accessionNo: row.accession_no || "",
      uploadDate: row.upload_date ? new Date(row.upload_date).toISOString().slice(0, 10) : "",
      isRawData: Boolean(row.is_raw_data),
    }));
  }

  const resultRow = resultsRes.rows[0];
  const parentRow = parentRes.rows[0];

  const results = {
    organismName: resultRow?.organism_name || "",
    studyType: resultRow?.study_type || parentRow?.study_type || "",
    dataType: resultRow?.data_type || "",
    databaseSource: resultRow?.database_source || "",
    softwareTool: resultRow?.software_tool_used || "",
    accessionNo: resultRow?.accession_no || "",
    sequenceType: resultRow?.sequence_type || "",
    notes: resultRow?.notes || parentRow?.description || "",
  };

  const payload = { results, samples, datasets, tools };
  return hasBioinformaticsPayload(payload) ? payload : null;
}

module.exports = {
  hasBioinformaticsPayload,
  saveBioinformatics,
  fetchBioinformatics,
  deleteBioinformaticsForStudy,
};
