const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function resolveStoredFilePath(filePath) {
  if (!filePath) return null;
  const normalized = String(filePath).replace(/\\/g, "/");
  if (path.isAbsolute(normalized)) return normalized;
  const baseName = path.basename(normalized);
  return path.join(UPLOADS_DIR, baseName);
}

function fileExistsAtPath(filePath) {
  const absolutePath = resolveStoredFilePath(filePath);
  return absolutePath && fs.existsSync(absolutePath) ? absolutePath : null;
}

async function saveStudyDocuments({ researchId, userId, documents }, client) {
  if (!Array.isArray(documents) || documents.length === 0) return [];

  ensureUploadsDir();
  const savedIds = [];

  for (const doc of documents) {
    const name = String(doc.name || "").trim();
    if (!name) continue;

    const fileType = String(doc.fileType || doc.type || "").trim();
    const contentBase64 = doc.content ? String(doc.content) : "";
    const safeName = `${Date.now()}_${name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const relativePath = safeName;
    const absolutePath = path.join(UPLOADS_DIR, safeName);

    if (contentBase64) {
      const buffer = Buffer.from(contentBase64, "base64");
      if (buffer.length > 0) {
        fs.writeFileSync(absolutePath, buffer);
      }
    }

    const result = await client.query(
      `
      INSERT INTO research_documents (research_id, uploaded_by, file_name, file_type, file_path)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING file_id
      `,
      [researchId, userId, name, fileType, relativePath]
    );

    if (result.rows[0]?.file_id) {
      savedIds.push(result.rows[0].file_id);
    }
  }

  return savedIds;
}

module.exports = {
  UPLOADS_DIR,
  ensureUploadsDir,
  resolveStoredFilePath,
  fileExistsAtPath,
  saveStudyDocuments,
};
