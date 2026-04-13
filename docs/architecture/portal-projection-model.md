# Portal Projection Model

## Objective

Expose owner-facing data safely without exposing internal operational APIs directly.

## Access Model

Portal access requires:
- authenticated JWT user
- `portal.read` permission
- `User.userType = OWNER`
- `User.ownerId` linked to a valid `Owner` in the same organization

Access checks are centralized in `PortalAccessService`.

## Scope Resolution

Property visibility derives from:
- `PropertyOwnerLink` where `ownerId = linked owner profile`

Portal APIs then project:
- properties
- property-linked documents
- owner-visible property cases
- communications linked to either accessible properties or the owner record

## Projection Principles

- return only fields needed by owner-facing experiences
- avoid exposing internal assignment/staff workflow details by default
- preserve organization and ownership boundaries in every query path

## Endpoint Families

- `/portal/me`
- `/portal/properties`
- `/portal/properties/:propertyId`
- `/portal/properties/:propertyId/documents`
- `/portal/properties/:propertyId/cases`
- `/portal/communications`
- `/portal/communications/:threadId`

## Non-Goals (Current)

- owner write actions
- owner uploads
- owner messaging send endpoints
- tenant access model
- workflow control actions from owner portal
