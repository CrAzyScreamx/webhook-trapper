# Schema & Type Generation (OpenAPI/TS)

## 1. Feature Overview
Automatically generates TypeScript interfaces or OpenAPI specifications based on the history of received payloads.

## 2. User Story
As a full-stack developer, I want to get an auto-generated TypeScript interface for the webhooks I receive so I can have type safety in my app.

## 3. Architecture & Design
Use 'quicktype-core' or similar to infer JSON schemas from a collection of logged payloads. Expose via API.
- **Stack Alignment**: Leverages Node.js 'crypto', WebSockets for tunneling, and PostgreSQL for configuration.

## 4. Implementation Steps

### Backend
- Implement a 'SchemaInferenceService'.
- Add endpoint to fetch TS/OpenAPI for a specific Trapper.
- Update periodically as new payloads arrive.

### Frontend
- Add a 'Schema' tab to Trapper Detail.
- Provide 'Copy to Clipboard' buttons for TS interfaces.

## 5. Testing & Validation
Send 10 varied payloads, click 'Generate Types', and verify the resulting TypeScript interface covers all fields seen.
