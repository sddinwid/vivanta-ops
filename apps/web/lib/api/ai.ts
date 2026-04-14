import { apiFetch } from "./client";
import type { AiRun } from "../../types/domain";

export async function listAiRuns() {
  return apiFetch<AiRun[]>("/ai/runs?limit=50");
}

export async function getAiRunsSummary(capability?: string) {
  const qs = capability ? `?capability=${encodeURIComponent(capability)}` : "";
  return apiFetch<any>(`/ai/runs/summary${qs}`);
}
