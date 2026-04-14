import { apiFetch, jsonBody } from "./client";
import type { AiSuggestion, CommunicationThread, Message } from "../../types/domain";

export async function listThreads() {
  return apiFetch<CommunicationThread[]>("/communications/threads");
}

export async function getThread(threadId: string) {
  return apiFetch<CommunicationThread>(`/communications/threads/${threadId}`);
}

export async function listMessages(threadId: string) {
  return apiFetch<Message[]>(`/communications/threads/${threadId}/messages`);
}

export async function getThreadAiSuggestions(threadId: string) {
  return apiFetch<{ triage: AiSuggestion[]; summary: AiSuggestion[] }>(
    `/communications/threads/${threadId}/ai-suggestions`
  );
}

export async function applyTriageSuggestion(threadId: string, suggestionId: string, note?: string) {
  return apiFetch<any>(`/communications/threads/${threadId}/apply-triage`, {
    method: "POST",
    body: jsonBody({ suggestionId, note })
  });
}

export async function applySummarySuggestion(threadId: string, suggestionId: string, note?: string) {
  return apiFetch<any>(`/communications/threads/${threadId}/apply-summary`, {
    method: "POST",
    body: jsonBody({ suggestionId, note })
  });
}
