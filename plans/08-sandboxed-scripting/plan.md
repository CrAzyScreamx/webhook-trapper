# Sandboxed Scripting (JS/TS Payload Manipulation)

## 1. Feature Overview
Allows users to write custom JavaScript to transform or filter payloads before they are forwarded.

## 2. User Story
As a developer, I want to rename 'user_id' to 'id' and flatten a nested object before sending it to my legacy system.

## 3. Architecture & Design
Use the 'isolated-vm' or 'vm2' library (carefully) to execute user-provided code in a secure, memory-limited environment. Code is executed during the job processing phase.
- **Stack Alignment**: Utilizes Node.js 'crypto' and 'vm' modules, Redis for coordination, and PostgreSQL for rule storage.

## 4. Implementation Steps

### Backend
- Integrate 'isolated-vm' into the worker pipeline.
- Create a validation service for user scripts (syntax check).
- Implement a 'TransformationService' that passes payload to the sandbox.

### Frontend
- Embed a code editor (Monaco or CodeMirror) with TypeScript support.
- Provide a 'Test Run' button to see input/output preview.

## 5. Testing & Validation
Write a script payload.newKey = payload.oldKey; delete payload.oldKey; return payload;. Send a webhook and verify the transformation.
