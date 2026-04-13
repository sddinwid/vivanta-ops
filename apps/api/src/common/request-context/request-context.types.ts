export interface RequestIdentity {
  userId: string;
  organizationId: string;
  email: string;
}

export interface RequestWithContext {
  requestId?: string;
  user?: RequestIdentity;
  path?: string;
  headers?: Record<string, string | string[] | undefined>;
}

