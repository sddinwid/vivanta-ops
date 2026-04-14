export function ErrorState({ title, details }: { title?: string; details?: string }) {
  return (
    <div className="card">
      <div className="row">
        <span className="pill pillDanger">Error</span>
        <strong>{title ?? "Request failed"}</strong>
      </div>
      {details ? <p style={{ marginBottom: 0 }}>{details}</p> : null}
    </div>
  );
}

