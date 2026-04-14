"use client";

import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api/client";
import { getAiRunsSummary, listAiRuns } from "../../lib/api/ai";
import type { AiRun } from "../../types/domain";
import { LoadingState } from "../../components/shared/LoadingState";
import { ErrorState } from "../../components/shared/ErrorState";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { fmtNumber, truncateId } from "../../lib/utils/format";

export default function AiRunsPage() {
  const [rows, setRows] = useState<AiRun[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [r, s] = await Promise.all([listAiRuns(), getAiRunsSummary()]);
      setRows(r.data);
      setSummary(s.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load AI runs");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>AI Runs</h1>
          <p style={{ marginTop: 6 }}>Observability view (status, confidence, latency, targets).</p>
        </div>
        <button className="btn" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>

      {error ? <ErrorState title="AI runs error" details={error} /> : null}

      {summary && summary.totalRuns !== undefined ? (
        <div className="card">
          <div className="cardTitle">Summary</div>
          <div className="kvs">
            <div className="kvKey">Total</div>
            <div className="kvVal">{summary.totalRuns}</div>
            <div className="kvKey">Completed</div>
            <div className="kvVal">{summary.completedRuns}</div>
            <div className="kvKey">Failed</div>
            <div className="kvVal">{summary.failedRuns}</div>
            <div className="kvKey">Avg Latency</div>
            <div className="kvVal">
              {typeof summary.averageLatencyMs === "number" ? `${fmtNumber(summary.averageLatencyMs, 0)} ms` : "n/a"}
            </div>
            <div className="kvKey">Avg Confidence</div>
            <div className="kvVal">
              {typeof summary.averageConfidenceScore === "number" ? fmtNumber(summary.averageConfidenceScore, 2) : "n/a"}
            </div>
            <div className="kvKey">Suggestions Created</div>
            <div className="kvVal">{summary.suggestionsCreated}</div>
            <div className="kvKey">Suggestions Applied</div>
            <div className="kvVal">{summary.suggestionsApplied}</div>
            <div className="kvKey">Eval +</div>
            <div className="kvVal">{summary.evaluationsPositive}</div>
            <div className="kvKey">Eval -</div>
            <div className="kvVal">{summary.evaluationsNegative}</div>
          </div>
        </div>
      ) : null}

      {rows === null && !error ? <LoadingState label="Loading AI runs..." /> : null}
      {rows && rows.length === 0 ? <EmptyState title="No AI runs found" /> : null}

      {rows && rows.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Latency</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.capability}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {r.providerName}/{r.modelName}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      <span title={r.id}>run: {truncateId(r.id, 10, 6)}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge value={r.status} />
                    {r.errorCode ? <div className="muted" style={{ fontSize: 12 }}>{r.errorCode}</div> : null}
                  </td>
                  <td>{typeof r.confidenceScore === "number" ? fmtNumber(r.confidenceScore, 2) : "n/a"}</td>
                  <td>{typeof r.latencyMs === "number" ? `${fmtNumber(r.latencyMs, 0)} ms` : "n/a"}</td>
                  <td>
                    <div>{r.targetEntityType ?? "n/a"}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {r.targetEntityId ? (
                        <span title={r.targetEntityId}>{truncateId(r.targetEntityId, 10, 6)}</span>
                      ) : (
                        "n/a"
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
