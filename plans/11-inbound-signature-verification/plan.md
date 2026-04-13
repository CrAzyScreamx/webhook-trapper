# Inbound Signature Verification

## 1. Feature Overview
Verifies that incoming webhooks are authentic by checking cryptographic signatures (e.g., Stripe-Signature, X-Hub-Signature).

## 2. User Story
As a security-conscious developer, I want to ensure that only Stripe can trigger my 'payout.paid' logic, preventing spoofing attacks.

## 3. Architecture & Design
Provide a library of 'Provider Templates' (Stripe, GitHub, Shopify). Use 'crypto' module to compute HMACs and compare with headers.
- **Stack Alignment**: Utilizes Node.js 'crypto' and 'vm' modules, Redis for coordination, and PostgreSQL for rule storage.

## 4. Implementation Steps

### Backend
- Create a 'VerificationService' with provider-specific logic.
- Store 'Signing Secrets' securely in the Trapper model.
- Implement middleware to reject unverified requests.

### Frontend
- Add a 'Security' tab to Trapper settings with a dropdown for common providers.
- Provide instructions on where to find secrets in provider dashboards.

## 5. Testing & Validation
Attempt to send a fake Stripe webhook without a valid signature. Verify it is rejected with a 401 Unauthorized.
