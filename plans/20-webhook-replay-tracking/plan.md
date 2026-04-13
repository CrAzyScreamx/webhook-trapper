# Webhook Replay Tracking & Audit Trails

## 1. Feature Overview
Logs every manual replay action, tracking who initiated it, when, and what the outcome was, linked to the original event.

## 2. User Story
As a security auditor, I need to see a list of every manual replay event to ensure that data isn't being improperly re-injected into our systems.

## 3. Architecture & Design
Create an 'AuditLog' model. Link replay events to their parent 'WebhookLog' entry using a 'parent_id'. Track the user identity of the requester.
- **Stack Alignment**: Uses PostgreSQL for advanced indexing (JSONB/Full-text), React Flow for the UI, and Redis for real-time aggregation.

## 4. Implementation Steps

### Backend
- Implement 'AuditLoggingService'.
- Update replay logic to create audit entries.
- Add API to fetch replay history for a specific log.

### Frontend
- Add a 'Replay History' timeline to the log detail page.
- Display user avatars/names for each replay action.

## 5. Testing & Validation
Replay a webhook twice, then check the 'Audit' tab to verify both attempts are logged with timestamps and user info.
