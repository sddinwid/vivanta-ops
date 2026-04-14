"use client";

import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api/client";
import { listDocuments, uploadDocument, getDocumentAiSuggestions, applyDocumentClassification, applyDocumentExtraction } from "../../lib/api/documents";
import type { AiSuggestion, Document } from "../../types/domain";
import { LoadingState } from "../../components/shared/LoadingState";
import { ErrorState } from "../../components/shared/ErrorState";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { SuggestionCard } from "../../components/shared/SuggestionCard";
import { truncateId } from "../../lib/utils/format";

type DocAi = { classification: AiSuggestion[]; extraction: AiSuggestion[] };

export default function DocumentsPage() {
  const [rows, setRows] = useState<Document[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busyUpload, setBusyUpload] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [aiByDoc, setAiByDoc] = useState<Record<string, DocAi>>({});

  async function refresh() {
    setError(null);
    try {
      const res = await listDocuments();
      setRows(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load documents");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function toggleAi(documentId: string) {
    if (expandedDocId === documentId) {
      setExpandedDocId(null);
      return;
    }
    setExpandedDocId(documentId);
    if (!aiByDoc[documentId]) {
      try {
        const res = await getDocumentAiSuggestions(documentId);
        setAiByDoc((prev) => ({ ...prev, [documentId]: res.data }));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load AI suggestions");
      }
    }
  }

  return (
    <section className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Documents</h1>
          <p style={{ marginTop: 6 }}>Upload, then review assistive AI suggestions per document.</p>
        </div>
        <button className="btn" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>

      <div className="card stack">
        <div className="cardTitle">Upload</div>
        <div className="row">
          <input
            className="input"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            className="btn btnPrimary"
            disabled={!file || busyUpload}
            onClick={async () => {
              if (!file) return;
              setBusyUpload(true);
              setError(null);
              try {
                await uploadDocument(file);
                setFile(null);
                await refresh();
              } catch (e) {
                setError(e instanceof ApiError ? e.message : "Upload failed");
              } finally {
                setBusyUpload(false);
              }
            }}
          >
            {busyUpload ? "Uploading..." : "Upload"}
          </button>
        </div>
        <div className="muted">
          Note: classification/extraction suggestions are assistive and must be explicitly applied.
        </div>
      </div>

      {rows === null && !error ? <LoadingState label="Loading documents..." /> : null}
      {error ? <ErrorState title="Documents error" details={error} /> : null}
      {rows && rows.length === 0 ? <EmptyState title="No documents found" /> : null}

      {rows && rows.length > 0 ? (
        <div className="stack">
          {rows.map((d) => {
            const docAi = aiByDoc[d.id];
            return (
              <div key={d.id} className="card stack">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{d.fileName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      <span title={d.id}>{truncateId(d.id)}</span>
                    </div>
                  </div>
                  <div className="row">
                    <StatusBadge value={d.ingestionStatus} />
                    <span className="pill">type: {d.documentType ?? "unset"}</span>
                    <button className="btn" onClick={() => void toggleAi(d.id)}>
                      {expandedDocId === d.id ? "Hide AI" : "Show AI"}
                    </button>
                  </div>
                </div>

                {expandedDocId === d.id ? (
                  <div className="stack" style={{ marginTop: 10 }}>
                    {!docAi ? (
                      <LoadingState label="Loading AI suggestions..." />
                    ) : (
                      <>
                        <div className="card" style={{ background: "transparent" }}>
                          <div className="cardTitle">Classification</div>
                          {docAi.classification.length === 0 ? (
                            <EmptyState title="No classification suggestions" />
                          ) : (
                            <div className="stack">
                              {docAi.classification.map((s) => (
                                <SuggestionCard
                                  key={s.id}
                                  suggestion={s}
                                  applyLabel="Apply classification"
                                  onApply={async () => {
                                    await applyDocumentClassification(d.id, s.id);
                                    const next = await getDocumentAiSuggestions(d.id);
                                    setAiByDoc((prev) => ({ ...prev, [d.id]: next.data }));
                                    await refresh();
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="card" style={{ background: "transparent" }}>
                          <div className="cardTitle">Extraction</div>
                          {docAi.extraction.length === 0 ? (
                            <EmptyState title="No extraction suggestions" />
                          ) : (
                            <div className="stack">
                              {docAi.extraction.map((s) => (
                                <SuggestionCard
                                  key={s.id}
                                  suggestion={s}
                                  applyLabel="Apply extraction"
                                  onApply={async () => {
                                    await applyDocumentExtraction(d.id, s.id);
                                    const next = await getDocumentAiSuggestions(d.id);
                                    setAiByDoc((prev) => ({ ...prev, [d.id]: next.data }));
                                    await refresh();
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
