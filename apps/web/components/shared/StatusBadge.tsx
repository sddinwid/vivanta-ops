function norm(value: string) {
  return value.trim().toUpperCase();
}

function classify(v: string): "ok" | "warn" | "danger" | "neutral" {
  const u = v.toUpperCase();

  if (["FAILED", "ERROR", "REJECTED", "CANCELLED"].includes(u)) return "danger";
  // Priority / urgency-ish values (common across cases/threads)
  if (["URGENT"].includes(u)) return "danger";
  if (["HIGH"].includes(u)) return "warn";
  if (["MEDIUM"].includes(u)) return "neutral";
  if (["LOW"].includes(u)) return "ok";
  if (["APPROVED", "COMPLETED", "ACTIVE", "RESOLVED", "CLOSED", "DONE"].includes(u)) return "ok";

  // Common workflow-ish states
  if (["PENDING", "RUNNING", "WAITING", "IN_PROGRESS", "OPEN"].includes(u)) return "neutral";

  // Document ingestion-ish states
  if (u.includes("REPROCESSING") || u.includes("REQUESTED")) return "warn";

  return "neutral";
}

export function StatusBadge({
  value,
  title
}: {
  value: string | null | undefined;
  title?: string;
}) {
  const raw = (value ?? "UNKNOWN").toString();
  const v = norm(raw);
  const tone = classify(v);
  const cls =
    tone === "ok"
      ? "pill pillOk"
      : tone === "warn"
        ? "pill pillWarn"
        : tone === "danger"
          ? "pill pillDanger"
          : "pill";
  return (
    <span className={cls} title={title ?? raw}>
      {v}
    </span>
  );
}
