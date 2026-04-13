---
title: Shared UI Components
type: feature
layer: frontend
keywords: [component, layout, error boundary, JSON viewer, status badge]
---

# Shared UI Components

Reusable React components used across pages.

## Dependencies

**Packages:** react, @mui/material

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `client/src/components/Layout.tsx` | App shell (header, nav, main content area) | Sometimes |
| `client/src/components/JsonViewer.tsx` | JSON/object tree viewer with syntax highlight | Sometimes |
| `client/src/components/JsonTree.tsx` | Recursive JSON tree rendering | Rarely |
| `client/src/components/ErrorBoundary.tsx` | Error boundary for uncaught errors | Rarely |
| `client/src/components/StatusBadge.tsx` | Status indicator badge (SENT/FILTERED/REJECTED) | Rarely |
| `client/src/components/ProtectedRoute.tsx` | Route wrapper requiring JWT token | Rarely |

## Understanding

**Layout.tsx** — Wraps all pages. Provides header with app title, sidebar navigation (Dashboard, Trappers, Queue, Logs), and main content area.

**JsonViewer.tsx** — Takes a JSON object and renders it as an expandable tree. Used to display webhook payloads and headers.

**JsonTree.tsx** — Recursive component for rendering nested objects/arrays in a tree structure.

**ErrorBoundary.tsx** — React error boundary component. Catches component errors and displays a fallback UI instead of crashing the app.

**StatusBadge.tsx** — Small colored badge showing webhook status (SENT in blue, FILTERED in orange, REJECTED in red).

**ProtectedRoute.tsx** — Wrapper for routes that require authentication. Checks for JWT token and redirects to login if missing.
