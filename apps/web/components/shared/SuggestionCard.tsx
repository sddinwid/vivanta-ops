"use client";

import { useMemo, useState } from "react";
import type { AiSuggestion } from "../../types/domain";
import { StatusBadge } from "./StatusBadge";
import { fmtDate, fmtNumber, truncateId } from "../../lib/utils/format";

function pickReasoning(json: any): string | null {
  if (!json || typeof json !== "object") return null;
  const candidates = ["reasoning", "rationale", "summary", "notes"];
  for (const key of candidates) {
    const v = json[key];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function titleCaseKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function formatPrimitive(key: string, value: unknown): string {
  if (value === null || value === undefined) return "n/a";
  if (typeof value === "boolean") return value ? "true" : "false";

  if (typeof value === "number") {
    if (/(amount|total|price|qty|quantity|score|confidence|latency)/i.test(key)) return fmtNumber(value, 2);
    return String(value);
  }

  if (typeof value === "string") {
    if (/(date|at)$/i.test(key)) return fmtDate(value);
    if (/id$/i.test(key) && value.length >= 16) return truncateId(value, 10, 6);
    return value;
  }

  return String(value);
}

function pickKvs(json: any): { label: string; value: string }[] {
  if (!isPlainObject(json)) return [];

  // Keep this intentionally small and operator-readable; arrays/objects are rendered separately.
  const preferredOrder = [
    // Document classification / extraction
    "documentType",
    "vendorName",
    "invoiceNumber",
    "invoiceDate",
    "dueDate",
    "currency",
    "totalAmount",

    // Communications
    "topic",
    "urgency",
    "recommendedCaseType",
    "recommendedPriority",
    "recommendedWorkflow",
    "recommendedFlowType",

    // Safety
    "confidence"
  ];

  const excluded = new Set([
    "reasoning",
    "rationale",
    "notes",
    "summary",
    "keyPoints",
    "lineItems",
    "recommendedNextActions",
    "recommendedApproverRoles",
    "recommendedApproverUserIds"
  ]);

  const out: { label: string; value: string }[] = [];
  const seen = new Set<string>();

  const pushKey = (key: string) => {
    if (seen.has(key)) return;
    const v = (json as any)[key];
    if (v === null || v === undefined) return;
    if (excluded.has(key)) return;
    if (typeof v === "object") return;
    if (typeof v === "string" && v.trim().length === 0) return;
    out.push({ label: titleCaseKey(key), value: formatPrimitive(key, v) });
    seen.add(key);
  };

  for (const key of preferredOrder) pushKey(key);
  for (const key of Object.keys(json)) pushKey(key);

  return out.slice(0, 10);
}

export function SuggestionCard(props: {
  title?: string;
  suggestion: AiSuggestion;
  onApply?: () => Promise<void> | void;
  applyLabel?: string;
  disabled?: boolean;
}) {
  const { suggestion } = props;
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const reasoning = useMemo(() => pickReasoning(suggestion.suggestionJson), [suggestion.suggestionJson]);
  const kvs = useMemo(() => pickKvs(suggestion.suggestionJson), [suggestion.suggestionJson]);

  const keyPoints = useMemo<string[] | null>(() => {
    const j = suggestion.suggestionJson as any;
    if (!j || !Array.isArray(j.keyPoints)) return null;
    const pts: string[] = j.keyPoints.filter((p: any) => typeof p === "string" && p.trim().length > 0);
    return pts.length ? pts : null;
  }, [suggestion.suggestionJson]);

  const lineItems = useMemo(() => {
    const j = suggestion.suggestionJson as any;
    if (!j || !Array.isArray(j.lineItems)) return null;
    const items = j.lineItems.filter((x: any) => isPlainObject(x));
    return items.length ? items : null;
  }, [suggestion.suggestionJson]);

  const nextActions = useMemo<string[] | null>(() => {
    const j = suggestion.suggestionJson as any;
    if (!j || !Array.isArray(j.recommendedNextActions)) return null;
    const xs: string[] = j.recommendedNextActions
      .filter((x: any) => typeof x === "string" && x.trim().length > 0)
      .slice(0, 12);
    return xs.length ? xs : null;
  }, [suggestion.suggestionJson]);

  const approverRoles = useMemo<string[] | null>(() => {
    const j = suggestion.suggestionJson as any;
    if (!j || !Array.isArray(j.recommendedApproverRoles)) return null;
    const xs: string[] = j.recommendedApproverRoles
      .filter((x: any) => typeof x === "string" && x.trim().length > 0)
      .slice(0, 12);
    return xs.length ? xs : null;
  }, [suggestion.suggestionJson]);

  const approverUserIds = useMemo<string[] | null>(() => {
    const j = suggestion.suggestionJson as any;
    if (!j || !Array.isArray(j.recommendedApproverUserIds)) return null;
    const xs: string[] = j.recommendedApproverUserIds
      .filter((x: any) => typeof x === "string" && x.trim().length > 0)
      .slice(0, 12);
    return xs.length ? xs : null;
  }, [suggestion.suggestionJson]);

  const confidence = useMemo(() => {
    if (typeof suggestion.confidenceScore === "number") return suggestion.confidenceScore;
    const j = suggestion.suggestionJson as any;
    if (j && typeof j.confidence === "number") return j.confidence;
    return null;
  }, [suggestion.confidenceScore, suggestion.suggestionJson]);

  return (
    <div className="card suggestionCard">
      <div className="row suggestionHeader" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <strong>{props.title ?? "AI Suggestion"}</strong>
          <span className="pill" title={suggestion.suggestionType}>
            {suggestion.suggestionType}
          </span>
          <StatusBadge value={suggestion.isApplied ? "APPLIED" : "PENDING"} />
          <span className="pill" title={suggestion.id}>
            id: {truncateId(suggestion.id, 10, 6)}
          </span>
          <span className="pill" title={confidence === null ? "Not provided" : undefined}>
            confidence: {confidence === null ? "n/a" : confidence.toFixed(2)}
          </span>
        </div>
        <div className="row">
          <button className="btn btnGhost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide raw" : "Raw JSON"}
          </button>
          {props.onApply ? (
            <button
              className="btn btnPrimary"
              disabled={props.disabled || busy || suggestion.isApplied}
              onClick={async () => {
                setBusy(true);
                try {
                  await props.onApply?.();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {suggestion.isApplied ? "Applied" : busy ? "Applying..." : props.applyLabel ?? "Apply"}
            </button>
          ) : null}
        </div>
      </div>

      {reasoning ? (
        <div className="callout" style={{ marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Reasoning (assistive)
          </div>
          <div style={{ whiteSpace: "pre-wrap" }}>{reasoning}</div>
        </div>
      ) : null}

      {kvs.length > 0 ? (
        <div style={{ marginTop: 12 }} className="kvs">
          {kvs.map((h) => (
            <div key={h.label} style={{ display: "contents" }}>
              <div className="kvKey">{h.label}</div>
              <div className="kvVal">{h.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {nextActions ? (
        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Recommended next actions (assistive)
          </div>
          <div className="row">
            {nextActions.map((a) => (
              <span className="pill" key={a}>
                {a}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {approverRoles || approverUserIds ? (
        <div style={{ marginTop: 12 }} className="kvs">
          {approverRoles ? (
            <>
              <div className="kvKey">Approver roles</div>
              <div className="kvVal">{approverRoles.join(", ")}</div>
            </>
          ) : null}
          {approverUserIds ? (
            <>
              <div className="kvKey">Approver user IDs</div>
              <div className="kvVal">
                {approverUserIds.map((id) => (
                  <span className="pill" key={id} title={id} style={{ marginRight: 8 }}>
                    {truncateId(id, 10, 6)}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {keyPoints ? (
        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Key points (assistive)
          </div>
          <ul style={{ marginTop: 0, marginBottom: 0, paddingLeft: 18 }}>
            {keyPoints.map((p, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lineItems ? (
        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Line items (assistive)
          </div>
          <div className="card" style={{ padding: 0, background: "transparent" }}>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.slice(0, 10).map((li: any, idx: number) => (
                  <tr key={idx}>
                    <td>{typeof li.description === "string" ? li.description : "n/a"}</td>
                    <td>{typeof li.quantity === "number" ? fmtNumber(li.quantity, 2) : "n/a"}</td>
                    <td>{typeof li.unitPrice === "number" ? fmtNumber(li.unitPrice, 2) : "n/a"}</td>
                    <td>{typeof li.lineTotal === "number" ? fmtNumber(li.lineTotal, 2) : "n/a"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lineItems.length > 10 ? (
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Showing 10 of {lineItems.length} items.
            </div>
          ) : null}
        </div>
      ) : null}

      {expanded ? (
        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Raw suggestion JSON
          </div>
          <pre>{JSON.stringify(suggestion.suggestionJson, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
