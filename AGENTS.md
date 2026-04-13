# AGENTS

## AI Integration Principles

- AI is assistive and auditable, never authoritative for domain truth.
- Domain source of truth stays in domain tables (invoices, cases, communications, etc.).
- Use provider abstraction (`AiProviderService`) rather than direct provider SDK calls in modules.
- Prefer persisted prompt templates and `AiRun` records over ad hoc AI calls.
- Store and review AI suggestions before applying; do not auto-mutate domain state.
