# Proactive Alerting (Slack/Discord/Email)

## 1. Feature Overview
Monitors webhook health and sends immediate notifications if failure rates exceed thresholds or specific patterns are detected.

## 2. User Story
As an operations manager, I want to get a Slack message if more than 5% of webhooks fail in a 10-minute window, so I can investigate before users complain.

## 3. Architecture & Design
Implement an 'AlertingService' that runs a background job to aggregate recent log data. Use 'threshold' and 'window' logic. Support multiple notification channels via webhooks or SMTP.
- **Stack Alignment**: Uses PostgreSQL for advanced indexing (JSONB/Full-text), React Flow for the UI, and Redis for real-time aggregation.

## 4. Implementation Steps

### Backend
- Create 'AlertRule' model with thresholds (e.g., 10 failures in 5m).
- Build aggregation logic using Redis or SQL group-by.
- Integrate with Slack/Discord webhooks.

### Frontend
- Add an 'Alerts' configuration page.
- Provide a history of triggered alerts and their status.

## 5. Testing & Validation
Set an alert for 1 failure. Trigger a failed webhook and verify a Slack notification is received immediately.
