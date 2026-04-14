import { apiFetch, jsonBody } from "./client";
import type { AiSuggestion, Document } from "../../types/domain";

export async function listDocuments() {
  return apiFetch<Document[]>("/documents");
}

export async function uploadDocument(file: File, documentType?: string) {
  const form = new FormData();
  form.append("file", file);
  if (documentType) form.append("documentType", documentType);
  return apiFetch<Document>("/documents/upload", {
    method: "POST",
    body: form
  });
}

export async function getDocumentAiSuggestions(documentId: string) {
  return apiFetch<{ classification: AiSuggestion[]; extraction: AiSuggestion[] }>(
    `/documents/${documentId}/ai-suggestions`
  );
}

export async function applyDocumentClassification(documentId: string, suggestionId: string, note?: string) {
  return apiFetch<any>(`/documents/${documentId}/apply-classification`, {
    method: "POST",
    body: jsonBody({ suggestionId, note })
  });
}

export async function applyDocumentExtraction(documentId: string, suggestionId: string, note?: string) {
  return apiFetch<any>(`/documents/${documentId}/apply-extraction`, {
    method: "POST",
    body: jsonBody({ suggestionId, note })
  });
}
