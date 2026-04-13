export interface TracingHandle {
  startSpan: (name: string) => void;
}

export interface MetricsHandle {
  increment: (metric: string, value?: number) => void;
}

// Placeholder exports; wire real providers later (OpenTelemetry, Prometheus, etc.).
export const observability = {
  tracing: undefined as TracingHandle | undefined,
  metrics: undefined as MetricsHandle | undefined
};

