# Fan-out / Multicast Routing

## 1. Feature Overview
Enables a single inbound webhook to be distributed to multiple outbound destination URLs simultaneously.

## 2. User Story
As a developer, I want to send a single Stripe 'charge.succeeded' event to both my analytics service and my shipping fulfillment system without managing multiple endpoints on Stripe's side.

## 3. Architecture & Design
Modify the 'Trapper' model to support a one-to-many relationship with 'Destinations'. The 'webhookWorker.ts' will be updated to iterate through all active destinations for a trapper and spawn delivery tasks for each.
- **Stack Alignment**: Uses Node.js for processing, Redis for state/queuing, and PostgreSQL for configuration persistence.

## 4. Implementation Steps

### Backend
- Update PostgreSQL schema to support multiple destinations per Trapper.
- Refactor 'webhookWorker.ts' to handle multi-destination delivery.
- Update 'ingest.ts' to look up all relevant destinations for the incoming request.

### Frontend
- Redesign Trapper Detail page to allow adding/managing multiple destination URLs.
- Update 'WebhookLog' UI to show delivery status for each destination individually.

## 5. Testing & Validation
Send a single webhook to a trapper with 3 configured destinations and verify that all 3 receive the payload and are logged separately.
