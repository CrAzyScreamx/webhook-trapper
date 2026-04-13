# Mock Workspaces & Payloads

## 1. Feature Overview
Allows users to create fake webhooks and test their routing/filtering logic without needing the actual source provider.

## 2. User Story
As a developer, I want to test my complex transformation script with 5 different edge-case payloads without manually triggering 5 Stripe events.

## 3. Architecture & Design
Implement a 'MockGenerator' service. Store mock payload templates in PostgreSQL. Allow manual 'Trigger Mock' via API/UI.
- **Stack Alignment**: Leverages Node.js 'crypto', WebSockets for tunneling, and PostgreSQL for configuration.

## 4. Implementation Steps

### Backend
- Create 'MockPayload' model.
- Implement API to trigger a trapper with a mock payload.
- Add 'Schema-based' random data generation (Faker.js).

### Frontend
- Build a 'Mock Lab' UI where users can edit payloads and trigger them.
- Show 'Mock' indicator in logs.

## 5. Testing & Validation
Create a mock payload, click 'Trigger', and verify the entire pipeline (filter, transform, forward) executes correctly.
