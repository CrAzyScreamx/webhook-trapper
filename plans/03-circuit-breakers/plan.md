# Circuit Breakers for Destinations

## 1. Feature Overview
Automatically pauses delivery to a destination if it consistently fails, preventing resource exhaustion and queue backups.

## 2. User Story
As an SRE, I want to prevent a single slow or down downstream service from saturating our Redis queue and affecting other deliveries.

## 3. Architecture & Design
Implement a state machine (Closed, Open, Half-Open) in Redis. Use 'opossum' or a custom implementation to track failure rates in 'forwarder.ts'.
- **Stack Alignment**: Uses Node.js for processing, Redis for state/queuing, and PostgreSQL for configuration persistence.

## 4. Implementation Steps

### Backend
- Integrate circuit breaker logic into 'forwarder.ts'.
- Store breaker state and failure counts in Redis.
- Implement 'Half-Open' retry logic after a cooldown period.

### Frontend
- Add 'Circuit Status' badges (Green/Red/Yellow) to the Destination UI.
- Provide a manual 'Reset Breaker' button for admins.

## 5. Testing & Validation
Simulate 5 consecutive 500 errors from a destination. Verify the circuit opens and subsequent requests are immediately failed/skipped.
