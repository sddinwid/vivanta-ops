"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { applyCaseAiSuggestion, getCase, getCaseAiSuggestions } from "../../../lib/api/cases";
import type { AiSuggestion, Case } from "../../../types/domain";
import { LoadingState } from "../../../components/shared/LoadingState";
import { ErrorState } from "../../../components/shared/ErrorState";
import { EmptyState } from "../../../components/shared/EmptyState";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { SuggestionCard } from "../../../components/shared/SuggestionCard";
import { ApiError } from "../../../lib/api/client";
import { truncateId } from "../../../lib/utils/format";

export default function CaseDetailPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;

  const [item, setItem] = useState<Case | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyCaseType, setApplyCaseType] = useState(true);
  const [applyPriority, setApplyPriority] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setItem(null);
    setSuggestions(null);

    Promise.all([getCase(caseId), getCaseAiSuggestions(caseId)])
      .then(([c, s]) => {
        if (cancelled) return;
        setItem(c.data);
        setSuggestions(s.data.recommendations);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load case detail");
      });

    return () => {
      cancelled = true;
    };
  }, [caseId, refreshKey]);

  const header = useMemo(() => {
    if (!item) return null;
    return (
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="muted" style={{ fontSize: 12 }}>
              Case
            </div>
            <h1 style={{ margin: 0 }}>{item.title}</h1>
          </div>
          <div className="row">
            <StatusBadge value={item.priority} />
            <StatusBadge value={item.status} />
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="kvs">
          <div className="kvKey">Case ID</div>
          <div className="kvVal" title={item.id}>{truncateId(item.id, 10, 6)}</div>
          <div className="kvKey">Type</div>
          <div className="kvVal">{item.caseType}</div>
          <div className="kvKey">Assigned</div>
          <div className="kvVal">{item.assignedUserId ?? "unassigned"}</div>
          <div className="kvKey">Description</div>
          <div className="kvVal">{item.description ?? <span className="muted">none</span>}</div>
        </div>
      </div>
    );
  }, [item]);

  return (
    <section className="stack">
      <div className="row">
        <Link className="btn" href="/cases">
          Back to cases
        </Link>
        <button className="btn" onClick={() => setRefreshKey((k) => k + 1)}>
          Refresh
        </button>
      </div>

      {item === null && !error ? <LoadingState label="Loading case..." /> : null}
      {error ? <ErrorState title="Could not load case" details={error} /> : null}
      {header}

      <div className="card">
        <div className="cardTitle">Apply Options</div>
        <div className="row">
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={applyCaseType} onChange={(e) => setApplyCaseType(e.target.checked)} />
            apply `caseType`
          </label>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={applyPriority} onChange={(e) => setApplyPriority(e.target.checked)} />
            apply `priority`
          </label>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          Applying a suggestion is explicit and auditable. No tasks/work orders are created here.
        </div>
      </div>

      <h2 style={{ marginBottom: 0 }}>AI Suggestions</h2>
      <p style={{ marginTop: 6 }}>
        These are assistive recommendations. Nothing changes until you apply.
      </p>

      {suggestions === null && !error ? <LoadingState label="Loading AI suggestions..." /> : null}
      {suggestions && suggestions.length === 0 ? (
        <EmptyState title="No AI suggestions yet" hint="Create/refresh case recommendations on the backend and come back." />
      ) : null}

      {suggestions && suggestions.length > 0 ? (
        <div className="stack">
          {suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              title="Case recommendation"
              applyLabel="Apply (caseType/priority)"
              disabled={!applyCaseType && !applyPriority}
              onApply={async () => {
                await applyCaseAiSuggestion({
                  caseId,
                  suggestionId: s.id,
                  applyCaseType,
                  applyPriority
                });
                setRefreshKey((k) => k + 1);
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
