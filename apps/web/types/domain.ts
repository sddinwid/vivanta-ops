export type Case = {
  id: string;
  caseType: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Document = {
  id: string;
  fileName: string;
  documentType: string | null;
  ingestionStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationThread = {
  id: string;
  subject: string | null;
  channelType: string;
  status: string;
  priority: string;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  direction: string;
  bodyText: string | null;
  createdAt: string;
};

export type AiRun = {
  id: string;
  capability: string;
  status: string;
  confidenceScore: number | null;
  latencyMs: number | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  providerName: string;
  modelName: string;
  createdAt: string;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type AiSuggestion = {
  id: string;
  aiRunId: string;
  suggestionType: string;
  targetEntityType: string | null;
  targetEntityId: string | null;
  suggestionJson: any;
  confidenceScore: number | null;
  isApplied: boolean;
  createdAt: string;
  appliedAt: string | null;
};

