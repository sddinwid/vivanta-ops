"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { applySummarySuggestion, applyTriageSuggestion, getThread, getThreadAiSuggestions, listMessages } from "../../../lib/api/communications";
import type { AiSuggestion, CommunicationThread, Message } from "../../../types/domain";
import { LoadingState } from "../../../components/shared/LoadingState";
import { ErrorState } from "../../../components/shared/ErrorState";
import { EmptyState } from "../../../components/shared/EmptyState";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { SuggestionCard } from "../../../components/shared/SuggestionCard";
import { ApiError } from "../../../lib/api/client";
import { fmtDate, truncateId } from "../../../lib/utils/format";

export default function ThreadDetailPage() {
  const params = useParams<{ threadId: string }>();
  const threadId = params.threadId;

  const [thread, setThread] = useState<CommunicationThread | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [ai, setAi] = useState<{ triage: AiSuggestion[]; summary: AiSuggestion[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setThread(null);
    setMessages(null);
    setAi(null);
    Promise.all([getThread(threadId), listMessages(threadId), getThreadAiSuggestions(threadId)])
      .then(([t, m, a]) => {
        if (cancelled) return;
        setThread(t.data);
        setMessages(m.data);
        setAi(a.data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Failed to load thread");
      });
    return () => {
      cancelled = true;
    };
  }, [threadId, refreshKey]);

  return (
    <section className="stack">
      <div className="row">
        <Link className="btn" href="/communications">
          Back to threads
        </Link>
        <button className="btn" onClick={() => setRefreshKey((k) => k + 1)}>
          Refresh
        </button>
      </div>

      {thread === null && !error ? <LoadingState label="Loading thread..." /> : null}
      {error ? <ErrorState title="Could not load thread" details={error} /> : null}

      {thread ? (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Communication Thread
              </div>
              <h1 style={{ margin: 0 }}>{thread.subject ?? "(no subject)"}</h1>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                <span title={thread.id}>Thread ID: {truncateId(thread.id, 10, 6)}</span>
              </div>
            </div>
            <div className="row">
              <StatusBadge value={thread.status} />
              <StatusBadge value={thread.priority} />
            </div>
          </div>
          <div className="kvs" style={{ marginTop: 12 }}>
            <div className="kvKey">Channel</div>
            <div className="kvVal">{thread.channelType}</div>
            <div className="kvKey">Assigned</div>
            <div className="kvVal">{thread.assignedUserId ?? "unassigned"}</div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="cardTitle">Messages</div>
        {messages === null && !error ? <LoadingState label="Loading messages..." /> : null}
        {messages && messages.length === 0 ? <EmptyState title="No messages" /> : null}
        {messages && messages.length > 0 ? (
          <div className="stack">
            {messages.map((m) => (
              <div key={m.id} className="card" style={{ background: "transparent" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="row">
                    <StatusBadge value={m.direction} />
                    <span className="muted" style={{ fontSize: 12 }}>
                      {fmtDate(m.createdAt)}
                    </span>
                  </div>
                  <span className="muted" style={{ fontSize: 12 }}>
                    <span title={m.id}>{truncateId(m.id, 10, 6)}</span>
                  </span>
                </div>
                <div style={{ marginTop: 10 }}>{m.bodyText ?? <span className="muted">(no text)</span>}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card">
        <div className="cardTitle">AI Suggestions</div>
        {ai === null && !error ? <LoadingState label="Loading AI suggestions..." /> : null}
        {ai ? (
          <div className="stack">
            <div className="card" style={{ background: "transparent" }}>
              <div className="cardTitle">Triage</div>
              {ai.triage.length === 0 ? (
                <EmptyState title="No triage suggestions" />
              ) : (
                <div className="stack">
                  {ai.triage.map((s) => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={s}
                      applyLabel="Apply triage"
                      onApply={async () => {
                        await applyTriageSuggestion(threadId, s.id);
                        setRefreshKey((k) => k + 1);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ background: "transparent" }}>
              <div className="cardTitle">Summary</div>
              {ai.summary.length === 0 ? (
                <EmptyState title="No summary suggestions" />
              ) : (
                <div className="stack">
                  {ai.summary.map((s) => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={s}
                      applyLabel="Apply summary"
                      onApply={async () => {
                        await applySummarySuggestion(threadId, s.id);
                        setRefreshKey((k) => k + 1);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
