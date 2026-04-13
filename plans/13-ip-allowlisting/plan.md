# IP Allowlisting (Inbound)

## 1. Feature Overview
Restricts inbound webhook ingestion to a specific set of IP addresses or CIDR ranges.

## 2. User Story
As a security admin, I want to ensure that only known IPs from my source providers can hit our ingestion endpoints.

## 3. Architecture & Design
Implement an IP validation layer in the ingestion middleware. Use a library like 'ip-range-check' for CIDR matching.
- **Stack Alignment**: Leverages Node.js 'crypto', WebSockets for tunneling, and PostgreSQL for configuration.

## 4. Implementation Steps

### Backend
- Create 'IPValidationMiddleware'.
- Store allowlisted IPs/CIDRs in Trapper or Global settings.
- Implement cache for fast lookups in Redis.

### Frontend
- Add 'IP Access Control' section to Trapper settings.
- Provide a UI to add/remove IP ranges with validation.

## 5. Testing & Validation
Allowlist a specific IP, try to send a webhook from a different IP, and verify it is rejected with a 403 Forbidden.
