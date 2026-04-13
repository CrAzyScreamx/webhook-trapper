# Local Forwarding CLI (Tunneling)

## 1. Feature Overview
A CLI tool that allows developers to tunnel webhooks from the cloud instance to their local development machine.

## 2. User Story
As a developer, I want to receive live webhooks on my localhost:3000 without exposing my machine to the internet or using ngrok.

## 3. Architecture & Design
Build a Node.js CLI that establishes a WebSocket or SSE connection to the server. The server forwards payloads over this connection, and the CLI makes a local POST request.
- **Stack Alignment**: Leverages Node.js 'crypto', WebSockets for tunneling, and PostgreSQL for configuration.

## 4. Implementation Steps

### Backend
- Create a 'TunnelService' using WebSockets (Socket.io or ws).
- Implement authentication for CLI clients.
- Route webhooks to active tunnels.

### Frontend
- Provide a CLI download link and 'Connect Local' instructions in the Trapper UI.

## 5. Testing & Validation
Start the CLI, connect to a Trapper, send a webhook to the cloud, and verify it is delivered to a local server.
