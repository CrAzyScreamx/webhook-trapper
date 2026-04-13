# Visual Payload Diffing UI

## 1. Feature Overview
Provides a side-by-side comparison of the original inbound payload and the transformed outbound payload.

## 2. User Story
As a developer debugging a transformation script, I want to see exactly which fields were added, modified, or removed by my script.

## 3. Architecture & Design
Use a diffing library like 'jsdiff' on the frontend. Render the diff in a structured JSON viewer with highlighting (red for removals, green for additions).
- **Stack Alignment**: Uses PostgreSQL for advanced indexing (JSONB/Full-text), React Flow for the UI, and Redis for real-time aggregation.

## 4. Implementation Steps

### Backend
- Ensure 'WebhookLog' stores both original and transformed payloads.
- Optimize API to return both payloads for the log detail view.

### Frontend
- Create a 'DiffViewer' component using 'react-diff-viewer' or similar.
- Integrate into the Webhook Log detail page.

## 5. Testing & Validation
Apply a transformation script, view the log, and verify the diff UI correctly highlights the changes made.
