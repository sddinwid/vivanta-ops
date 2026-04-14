import { apiFetch, jsonBody } from "./client";
import type { AiSuggestion, Case } from "../../types/domain";

export async function listCases() {
  return apiFetch<Case[]>("/cases");
}

export async function getCase(caseId: string) {
  return apiFetch<Case>(`/cases/${caseId}`);
}

export async function getCaseAiSuggestions(caseId: string) {
  return apiFetch<{ recommendations: AiSuggestion[] }>(`/cases/${caseId}/ai-suggestions`);
}

export async function applyCaseAiSuggestion(params: {
  caseId: string;
  suggestionId: string;
  applyCaseType?: boolean;
  applyPriority?: boolean;
  note?: string;
}) {
  return apiFetch<{
    case: Case;
    suggestionId: string;
    appliedNow: boolean;
    appliedFields: string[];
    recommendation: any;
  }>(`/cases/${params.caseId}/apply-ai-suggestion`, {
    method: "POST",
    body: jsonBody({
      suggestionId: params.suggestionId,
      applyCaseType: params.applyCaseType,
      applyPriority: params.applyPriority,
      note: params.note
    })
  });
}
