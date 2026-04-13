# Payload Enrichment (External API lookups)

## 1. Feature Overview
Augments the incoming webhook payload with additional data fetched from third-party APIs.

## 2. User Story
As a marketer, I want to take the email address from a webhook and look up the user's job title via Clearbit before sending the data to my CRM.

## 3. Architecture & Design
Create an 'EnrichmentStep' in the workflow. The worker will perform an HTTP request to the configured API and merge the response into the main payload.
- **Stack Alignment**: Utilizes Node.js 'crypto' and 'vm' modules, Redis for coordination, and PostgreSQL for rule storage.

## 4. Implementation Steps

### Backend
- Build an 'EnrichmentService' capable of making authenticated GET/POST calls.
- Implement response mapping (mapping API response fields to the payload).
- Handle enrichment timeouts and failures gracefully.

### Frontend
- Create a UI to add Enrichment Steps.
- Support Auth headers (Bearer/API Key) and URL template variables (e.g., {{payload.email}}).

## 5. Testing & Validation
Configure an enrichment step to call a mock API. Verify the final forwarded payload contains both original and enriched fields.
