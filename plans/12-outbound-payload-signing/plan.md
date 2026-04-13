# Outbound Payload Signing (HMAC)

## 1. Feature Overview
Signs forwarded payloads with an HMAC signature so the destination can verify the request originated from Webhook Trapper.

## 2. User Story
As a destination service owner, I want to ensure that incoming requests are not spoofed and actually come from my Webhook Trapper instance.

## 3. Architecture & Design
Use the 'crypto' module to generate an HMAC-SHA256 signature of the request body using a shared secret. Add the signature to a custom header (e.g., 'X-Trapper-Signature').
- **Stack Alignment**: Leverages Node.js 'crypto', WebSockets for tunneling, and PostgreSQL for configuration.

## 4. Implementation Steps

### Backend
- Implement a 'SigningService' for outbound requests.
- Add 'Outbound Secret' field to Destination model.
- Update 'forwarder.ts' to include signature header.

### Frontend
- Add 'Signature' configuration to Destination settings.
- Provide a code snippet for the destination to verify the signature.

## 5. Testing & Validation
Configure a secret, send a webhook, and verify that the destination receives a valid HMAC signature in the headers.
