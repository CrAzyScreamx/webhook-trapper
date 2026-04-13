# Destination Throttling (Rate Limiting)

## 1. Feature Overview
Limits the number of outbound requests sent to a destination within a specific timeframe to respect downstream rate limits.

## 2. User Story
As a user of an API that only allows 10 requests per second, I want Webhook Trapper to queue my events and trickle them out so I don't get banned.

## 3. Architecture & Design
Integrate BullMQ's rate limiting features (using 'limiter' options). Store rate limit configurations (max per duration) in the Destination model.
- **Stack Alignment**: Utilizes Node.js 'crypto' and 'vm' modules, Redis for coordination, and PostgreSQL for rule storage.

## 4. Implementation Steps

### Backend
- Update Destination schema with 'maxRequests' and 'durationMs'.
- Configure BullMQ worker with rate limiting logic.
- Implement a 'Token Bucket' algorithm in Redis for cross-worker coordination.

### Frontend
- Add 'Rate Limiting' settings to the Destination configuration UI.
- Show current throughput (requests/sec) on the dashboard.

## 5. Testing & Validation
Set a limit of 1 req/sec. Send 10 webhooks. Verify they are delivered exactly 1 second apart.
