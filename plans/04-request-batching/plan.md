# Request Batching

## 1. Feature Overview
Groups multiple incoming webhooks into a single outbound request to reduce overhead and improve throughput.

## 2. User Story
As a high-volume user, I want to batch 100 small sensor updates into one POST request to my data warehouse to save on API call costs.

## 3. Architecture & Design
Use BullMQ's grouping or a custom buffering layer in Redis. The worker will wait for either a count threshold (e.g., 50 events) or a time threshold (e.g., 10 seconds) before delivering.
- **Stack Alignment**: Uses Node.js for processing, Redis for state/queuing, and PostgreSQL for configuration persistence.

## 4. Implementation Steps

### Backend
- Implement a buffering service using Redis LISTs.
- Update 'webhookWorker' to handle array-based payloads.
- Create a 'BatchDelivery' task.

### Frontend
- Add Batching configuration (Max Items, Max Wait Time) to Trapper settings.
- Update UI to display batched logs.

## 5. Testing & Validation
Send 10 webhooks in rapid succession with batch size 5. Verify only 2 outbound requests are made, each containing 5 payloads.
