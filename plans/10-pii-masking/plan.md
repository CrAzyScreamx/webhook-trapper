# Automatic PII Masking

## 1. Feature Overview
Identifies and redacts Personally Identifiable Information (PII) like emails, credit cards, and SSNs from logs and forwarded payloads.

## 2. User Story
As a compliance officer, I want to ensure that sensitive customer data is masked in our logs to comply with GDPR and SOC2.

## 3. Architecture & Design
Use regex patterns and specialized PII detection libraries (e.g., 'pii-filter'). Apply masking in the 'LoggingService' and optionally in the 'ForwardingService'.
- **Stack Alignment**: Utilizes Node.js 'crypto' and 'vm' modules, Redis for coordination, and PostgreSQL for rule storage.

## 4. Implementation Steps

### Backend
- Implement a 'PIIMaskingService' with a library of common patterns.
- Add configuration for 'Global' vs 'Trapper-specific' masking rules.
- Update logs to store masked versions of sensitive fields.

### Frontend
- Add a 'Privacy' settings page to toggle PII detection categories.
- Show indicators in the log viewer where data was masked.

## 5. Testing & Validation
Send a payload containing an email and a credit card number. Verify both are replaced with *** in the UI and log database.
