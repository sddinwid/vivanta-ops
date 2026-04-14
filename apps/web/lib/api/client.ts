import { getToken } from "../auth/token";

export type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  // Prefer same-origin (Next rewrite) by default to avoid CORS issues.
  if (!base) return "/api/v1";
  return base.replace(/\/+$/, "");
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { rawBody?: boolean } = {}
): Promise<ApiEnvelope<T>> {
  const baseUrl = getBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isForm && !headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg = typeof body === "object" && body && "message" in (body as any) ? String((body as any).message) : `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }

  // Backend uses a response envelope interceptor; normalize if an endpoint returns raw.
  if (body && typeof body === "object" && "data" in (body as any)) {
    return body as ApiEnvelope<T>;
  }
  return { data: body as T };
}

export function jsonBody(input: unknown) {
  return JSON.stringify(input ?? {});
}
