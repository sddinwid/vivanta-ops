"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listCases } from "../../lib/api/cases";
import type { Case } from "../../types/domain";
import { LoadingState } from "../../components/shared/LoadingState";
import { ErrorState } from "../../components/shared/ErrorState";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { ApiError } from "../../lib/api/client";
import { truncateId } from "../../lib/utils/format";

export default function CasesPage() {
  const [rows, setRows] = useState<Case[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listCases()
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load cases");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Cases</h1>
          <p style={{ marginTop: 6 }}>Read-only list; use detail view to apply AI suggestions.</p>
        </div>
      </div>

      {rows === null && !error ? <LoadingState label="Loading cases..." /> : null}
      {error ? <ErrorState title="Could not load cases" details={error} /> : null}
      {rows && rows.length === 0 ? <EmptyState title="No cases found" /> : null}

      {rows && rows.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/cases/${c.id}`}>{c.title}</Link>
                    <div className="muted" style={{ fontSize: 12 }}>
                      <span title={c.id}>{truncateId(c.id)}</span>
                    </div>
                  </td>
                  <td>{c.caseType}</td>
                  <td>
                    <StatusBadge value={c.priority} />
                  </td>
                  <td>
                    <StatusBadge value={c.status} />
                  </td>
                  <td className="muted">
                    {c.assignedUserId ? <span title={c.assignedUserId}>{truncateId(c.assignedUserId, 10, 6)}</span> : "unassigned"}
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
