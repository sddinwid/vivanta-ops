export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="card">
      <div className="muted">{label ?? "Loading..."}</div>
    </div>
  );
}

