export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card">
      <strong>{title}</strong>
      {hint ? <p style={{ marginBottom: 0 }}>{hint}</p> : null}
    </div>
  );
}

