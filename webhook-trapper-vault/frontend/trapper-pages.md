---
title: Trapper Management UI
type: feature
layer: frontend
keywords: [CRUD, create, edit, delete, list, trapper configuration]
---

# Trapper Management UI

Pages and components for creating, listing, editing, and viewing details of webhook trappers.

## Dependencies

**Dependent features:** [[Webhook Trappers]], [[Filter Rules Engine]]
**Packages:** react, react-router-dom, @mui/material, axios

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `client/src/pages/Trappers.tsx` | List page for all trappers | Sometimes |
| `client/src/pages/TrapperDetail.tsx` | Detail/edit page for one trapper | Sometimes |
| `client/src/pages/FilterConfig.tsx` | Rule builder UI | Sometimes |
| `client/src/components/Breadcrumb.tsx` | Navigation breadcrumb trail | Rarely |

## Understanding

**Trappers.tsx** — Lists all trappers in a table. Shows name, trapId, destination, status, and recent activity. Links to detail page and provides a create button.

**TrapperDetail.tsx** — Edit form for a single trapper. Allows changing name, description, destination URL, auth headers, rate limits, HMAC settings, payload override, and TLS verification. Also displays webhook logs filtered to this trapper with status indicators.

**FilterConfig.tsx** — Interactive rule builder. Shows list of existing rules and UI to add/edit/delete them. Rules are grouped visually with AND/OR operators.

**Breadcrumb.tsx** — Shows the navigation path (e.g., Home > Trappers > My-Webhook > Logs). Clickable breadcrumbs allow quick navigation back.
