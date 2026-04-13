# Conditional Routing (Payload-based)

## 1. Feature Overview
Routes webhooks to specific destinations only if the payload matches defined JSONPath or Regex criteria.

## 2. User Story
As a data engineer, I want to route only 'high-value' order events (total > ) to our VIP notification slack, while routing all other events to a standard log.

## 3. Architecture & Design
Introduce a 'RoutingRule' entity. Integrate a JSONPath evaluation library into 'filterEngine.ts' to match payloads against rules before queueing for delivery.
- **Stack Alignment**: Uses Node.js for processing, Redis for state/queuing, and PostgreSQL for configuration persistence.

## 4. Implementation Steps

### Backend
- Implement JSONPath and Regex matching logic in 'filterEngine.ts'.
- Create API endpoints to CRUD routing rules.
- Update 'webhookWorker' to evaluate rules per destination.

### Frontend
- Create a 'Rule Builder' UI with payload preview and matching verification.
- Add rule status indicators to the destination list.

## 5. Testing & Validation
Configure a rule for 'amount > 100'. Send one payload with 50 and another with 150. Verify only the latter is forwarded.
