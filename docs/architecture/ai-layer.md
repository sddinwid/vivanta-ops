# AI Layer Architecture

## Overview

The AI layer in Vivanta Operations OS is designed as a governed, assistive subsystem that integrates with core operational workflows without compromising determinism, auditability, or system reliability.

It is not treated as a separate service, but as a platform primitive embedded into the backend architecture.

The system prioritizes:

- assistive intelligence over automation
- auditability over opacity
- control over autonomy
- modular integration over tight coupling

## Design Goals

The AI layer is built to:

- provide contextual assistance to operators
- integrate cleanly with domain workflows
- remain fully observable and auditable
- support multiple providers without lock-in
- allow incremental adoption of AI capabilities
- avoid destabilizing core business logic

## Core Components

### 1. AI Provider Abstraction

The system uses a provider abstraction layer to decouple AI execution from external services.

AiProviderService
  -> AiProvider (interface)
     -> StubAiProvider (current implementation)

Responsibilities:

- route execution requests
- enforce capability-level configuration
- support multiple providers in the future
- isolate provider-specific logic

No domain module interacts directly with a provider.

### 2. Prompt Management

Prompts are managed as versioned, structured templates.

Model:

- AiPromptTemplate

Key properties:

- templateKey
- capability
- version
- systemPrompt
- userPromptTemplate
- isActive

Behavior:

- templates are resolved by capability or explicit selection
- only active templates are auto-resolved
- versioning allows safe iteration without breaking behavior

### 3. Execution Tracking

Every AI execution is persisted.

AiRun

Represents a single AI execution.

Fields include:

- capability
- inputJson
- outputJson
- status
- latencyMs
- confidenceScore
- targetEntityType
- targetEntityId

AiSuggestion

Represents structured outputs derived from an AI run.

Examples:

- classification suggestion
- triage recommendation
- approval routing recommendation
- case categorization

Suggestions are:

- stored independently
- explicitly applied by operators
- never automatically enforced

### 4. Evaluation System

Human feedback is captured via:

AiEvaluation

Fields:

- aiRunId
- aiSuggestionId
- outcome (positive, negative, mixed, needs_review)
- score
- notes

This enables:

- qualitative assessment of AI outputs
- future tuning of prompts and providers
- visibility into real-world usefulness

### 5. Capability Model

AI execution is organized by capability.

Examples:

- DOCUMENT_ANALYSIS
- INVOICE_ANALYSIS
- COMMUNICATION_ASSIST
- APPROVAL_ASSIST
- CASE_ASSIST

Each capability:

- maps to specific prompt templates
- maps to provider configurations
- can be enabled or disabled independently

### 6. Feature Control

AI execution is governed through provider configuration.

Model:

- AiProviderConfig

Resolution order:

1. organization-scoped config
2. global config
3. fallback (stub)

If a capability is disabled:

- execution is blocked
- run is persisted as FAILED
- errorCode = AI_DISABLED

This ensures:

- safe rollout
- controlled experimentation
- per-tenant customization

## Execution Flow

### General Flow

Domain Event (e.g. document upload)
  -> AI Service (domain-specific)
  -> AiProviderService
  -> Provider execution
  -> AiRun persisted
  -> AiSuggestion(s) created
  -> Audit event emitted

AI execution is always:

- asynchronous or non-blocking
- failure-tolerant
- independent of domain success

## Domain Integrations

### Documents

Capabilities:
- classification
- invoice-style extraction

Behavior:
- triggered on upload and reprocess
- extraction gated by classification + confidence
- no automatic document mutation

### Communications

Capabilities:
- triage
- summarization

Behavior:
- triggered on thread/message creation
- triage may suggest priority
- summary is informational only

### Invoices / Approvals

Capabilities:
- approval routing recommendations

Behavior:
- triggered on submit-for-review
- suggests approver roles and flow type
- does not create approval flows automatically

### Cases

Capabilities:
- categorization
- priority recommendation
- workflow guidance

Behavior:
- triggered on case creation
- operator may apply caseType/priority
- no task or work-order automation

## Application Model

AI outputs are never applied automatically.

All changes require explicit operator intent.

Example:

AI Suggestion -> Operator Review -> Apply Endpoint -> Domain Update

This guarantees:

- traceability
- accountability
- correctness under uncertainty

## Observability

The system provides built-in observability:

### Run-level

- execution status
- latency
- confidence

### Suggestion-level

- created
- applied
- ignored

### Evaluation-level

- outcome scoring
- operator feedback

### Summary Metrics

Available via:

GET /api/v1/ai/runs/summary

Includes:

- total runs
- success/failure rates
- average latency
- average confidence
- evaluation distribution

## API Surface

Key endpoints:

GET /api/v1/ai/runs
GET /api/v1/ai/runs/summary
GET /api/v1/ai/suggestions
POST /api/v1/ai/runs
POST /api/v1/ai/suggestions/:id/apply
POST /api/v1/ai/runs/:id/evaluations
GET /api/v1/ai/capabilities

Domain-specific endpoints exist for:
- documents
- communications
- invoices
- cases

## Safety Model

The AI layer enforces:

- no automatic domain mutation
- strict organization scoping
- explicit operator application
- audit logging for all actions
- idempotent apply operations
- capability-level execution control

## Tradeoffs

### Chosen

- assistive AI over autonomous systems
- provider abstraction over direct integration
- explicit application over silent mutation
- persistence-first design for observability

### Deferred

- real LLM providers
- OCR and extraction pipelines
- prompt A/B testing
- automated retraining
- external observability integrations

## Future Evolution

The AI layer is designed to evolve toward:

- real provider integrations (LLMs, OCR)
- improved extraction pipelines
- workflow-aware AI orchestration
- predictive recommendations
- feedback-driven optimization loops

This can be achieved without rewriting domain logic due to the abstraction boundaries already in place.

## Summary

The AI layer is a controlled, observable, and extensible subsystem that enhances operator workflows without compromising system integrity.

It provides:

- structured execution
- persistent outputs
- human-in-the-loop control
- safe integration with core operations

This architecture enables incremental adoption of AI while preserving long-term system stability.
