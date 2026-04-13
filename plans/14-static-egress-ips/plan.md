# Static Egress IPs

## 1. Feature Overview
Provides a fixed set of IP addresses for all outbound requests, allowing destinations to allowlist Webhook Trapper.

## 2. User Story
As an enterprise customer, my firewall only allows traffic from specific IPs. I need Webhook Trapper to use static IPs for all its deliveries.

## 3. Architecture & Design
Infrastructure-level change. Use an HTTP proxy (like Squid or a cloud-native NAT Gateway) for all outbound traffic from the workers.
- **Stack Alignment**: Leverages Node.js 'crypto', WebSockets for tunneling, and PostgreSQL for configuration.

## 4. Implementation Steps

### Backend
- Configure 'axios' or 'fetch' in the worker to use a SOCKS/HTTP proxy.
- Implement health checks for the proxy.
- Add environment variables for proxy configuration.

### Frontend
- Display the current Static Egress IPs in the user dashboard for easy reference.

## 5. Testing & Validation
Run a test delivery to a service that logs the requester's IP. Verify the IP matches the configured static proxy IP.
