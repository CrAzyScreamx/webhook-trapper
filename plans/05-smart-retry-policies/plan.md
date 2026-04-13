# Smart Retry Policies (Exponential Backoff/Jitter)

## 1. Feature Overview
Advanced retry logic that increases delay between attempts and adds randomness (jitter) to avoid 'thundering herd' problems.

## 2. User Story
As a developer, I want my webhooks to retry gracefully over 24 hours if my server has a temporary outage, without overwhelming it when it comes back up.

## 3. Architecture & Design
Configure BullMQ retry options dynamically based on Destination settings. Use a formula: base * 2^attempt + jitter.
- **Stack Alignment**: Uses Node.js for processing, Redis for state/queuing, and PostgreSQL for configuration persistence.

## 4. Implementation Steps

### Backend
- Update 'webhookQueue.ts' to calculate dynamic delays.
- Add configurable retry limits and base delays to the Destination model.
- Implement jitter calculation.

### Frontend
- Create a 'Retry Policy' configuration section with a visualization of the retry timeline (e.g., '1m, 5m, 15m, 1h...').

## 5. Testing & Validation
Trigger a failure and verify the 'next_retry_at' timestamp follows an exponential curve with slight variations.
