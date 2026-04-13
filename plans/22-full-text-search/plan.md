# Full-Text Search for Webhook Logs

## 1. Feature Overview
Enables fast, deep searching across millions of webhook payloads and headers using keywords and metadata.

## 2. User Story
As a support rep, I need to find a specific webhook by searching for a customer's email or a transaction ID within the raw JSON body.

## 3. Architecture & Design
Utilize PostgreSQL 'jsonb' indexing and 'tsvector' for full-text search. For massive scale, consider an ElasticSearch or Meilisearch integration.
- **Stack Alignment**: Uses PostgreSQL for advanced indexing (JSONB/Full-text), React Flow for the UI, and Redis for real-time aggregation.

## 4. Implementation Steps

### Backend
- Create a GIN index on the 'payload' jsonb column.
- Implement a search API with support for filters (date, trapper, status) and text query.
- Optimize query performance for large datasets.

### Frontend
- Add a global search bar to the Logs page.
- Highlight search terms in the JSON results.

## 5. Testing & Validation
Search for a unique string present deep within a JSON payload and verify the correct log entry is returned instantly.
