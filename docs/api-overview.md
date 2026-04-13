# API Overview

Base path: `/api/v1`

This document summarizes currently implemented API groups and representative endpoints.

## Auth

- `POST /auth/login`
- `GET /auth/me`

## Organizations, Users, Access

- Organizations: list/get (read-focused)
- Users:
  - `GET /users`
  - `GET /users/:userId`
  - `POST /users`
  - `PATCH /users/:userId`
  - role assignment endpoints
- Access:
  - roles list/create
  - permissions list

## Properties, Owners, Vendors

- Properties, buildings, units CRUD backbone
- Owners CRUD + property linking/unlinking
- Vendors CRUD + filters

## Documents

- upload and metadata update
- document linking/unlinking
- list/detail/download metadata path
- reprocess request placeholder

## Communications

- thread create/list/detail/update
- thread assignment/linking
- message list/create
- queue endpoints: inbox, unassigned, urgent

## Cases, Tasks, Work Orders

- Cases CRUD + assign + status changes + queue views
- Tasks CRUD + assign + status changes + queue views
- Work orders: read/update + vendor assignment + scheduling/completion/cancel

## Invoices and Approvals

- Invoices CRUD + lines + review/approval submission + rejection + export state update
- Invoice queue views: pending review, pending approval, exceptions
- Approval flows: list/detail/steps + approve/reject/request-changes

## Workflows

- `GET /workflows/runs`
- `GET /workflows/runs/:workflowRunId`
- `GET /workflows/runs/:workflowRunId/events`
- `POST /workflows/runs/:workflowRunId/retry`
- `POST /workflows/runs/:workflowRunId/cancel`

## Portal (Owner Projection API)

Read-only owner-scoped projections:
- `GET /portal/me`
- `GET /portal/properties`
- `GET /portal/properties/:propertyId`
- `GET /portal/properties/:propertyId/documents`
- `GET /portal/properties/:propertyId/cases`
- `GET /portal/communications`
- `GET /portal/communications/:threadId`

## Notes

- All routes use JWT authentication where required.
- Permissions are role-based and organization-scoped.
- State-changing internal endpoints emit audit events.
