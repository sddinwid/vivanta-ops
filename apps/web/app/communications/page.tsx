"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listThreads } from "../../lib/api/communications";
import type { CommunicationThread } from "../../types/domain";
import { LoadingState } from "../../components/shared/LoadingState";
import { ErrorState } from "../../components/shared/ErrorState";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { ApiError } from "../../lib/api/client";
import { truncateId } from "../../lib/utils/format";

export default function CommunicationsPage() {
  const [rows, setRows] = useState<CommunicationThread[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listThreads()
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load threads");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="stack">
      <h1 style={{ marginBottom: 0 }}>Communications</h1>
      <p style={{ marginTop: 6 }}>Thread list; open a thread to view messages and AI triage/summary.</p>

      {rows === null && !error ? <LoadingState label="Loading threads..." /> : null}
      {error ? <ErrorState title="Could not load threads" details={error} /> : null}
      {rows && rows.length === 0 ? <EmptyState title="No threads found" /> : null}

      {rows && rows.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/communications/${t.id}`}>{t.subject ?? "(no subject)"}</Link>
                    <div className="muted" style={{ fontSize: 12 }}>
                      <span title={t.id}>{truncateId(t.id)}</span>
                    </div>
                  </td>
                  <td>{t.channelType}</td>
                  <td>
                    <StatusBadge value={t.status} />
                  </td>
                  <td>
                    <StatusBadge value={t.priority} />
                  </td>
                  <td className="muted">
                    {t.assignedUserId ? <span title={t.assignedUserId}>{truncateId(t.assignedUserId, 10, 6)}</span> : "unassigned"}
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
