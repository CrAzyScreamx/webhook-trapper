# Dead Letter Queue (DLQ) Management UI

## 1. Feature Overview
A specialized interface to view, analyze, and recover webhooks that have exhausted all retry attempts.

## 2. User Story
As a support engineer, I need to see exactly why certain webhooks failed after 10 attempts and be able to fix the underlying issue and replay them manually.

## 3. Architecture & Design
Use BullMQ's 'failed' set to store DLQ items. Create a specialized Express route to fetch and act on failed jobs. Store permanent failure reasons in PostgreSQL.
- **Stack Alignment**: Utilizes Node.js 'crypto' and 'vm' modules, Redis for coordination, and PostgreSQL for rule storage.

## 4. Implementation Steps

### Backend
- Create API to list failed jobs from BullMQ.
- Implement 'Retry All' and 'Retry Selected' endpoints.
- Add 'Purge' functionality to clear old failures.

### Frontend
- Build a 'DLQ' dashboard page with filtering by Trapper and Error Type.
- Add a 'Payload Inspector' and 'Error Stack' viewer.
- Implement bulk actions (Retry/Delete).

## 5. Testing & Validation
Force a job to fail all retries, verify it appears in the DLQ UI, and then manually retry it after 'fixing' the destination.
