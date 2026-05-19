import { API_BASE_URL } from "../config";

export async function downloadStudyDocument(studyId, doc) {
  if (doc?.file instanceof File || doc?.file instanceof Blob) {
    const url = URL.createObjectURL(doc.file);
    triggerBrowserDownload(url, doc.name || "document");
    URL.revokeObjectURL(url);
    return;
  }

  if (!studyId || !doc?.id) {
    throw new Error("This file is not available for download.");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("You must be logged in to download documents.");
  }

  const res = await fetch(
    `${API_BASE_URL}/api/studies/${studyId}/documents/${doc.id}/download`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    let message = "Unable to download this document.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const fileName =
    getFilenameFromDisposition(res.headers.get("Content-Disposition")) ||
    doc.name ||
    "document";
  triggerBrowserDownload(url, fileName);
  URL.revokeObjectURL(url);
}

function getFilenameFromDisposition(header) {
  if (!header) return "";
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1].replace(/"/g, "").trim());
  } catch {
    return match[1].replace(/"/g, "").trim();
  }
}

function triggerBrowserDownload(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
