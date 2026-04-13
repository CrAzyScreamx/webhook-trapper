---
title: JWT Authentication
type: feature
layer: backend
keywords: [JWT, authentication, login, authorization, session, protected routes]
---

# JWT Authentication

Protects API endpoints using JWT tokens. Users log in with credentials, receive a token, and use it to authenticate subsequent requests.

## Dependencies

**Tools / services needed:** Redis (for token storage/blacklisting)
**Packages:** jsonwebtoken, bcryptjs, @types/jsonwebtoken
**Dependent features:** All protected API routes depend on this

## Files

| File | Role | Likely to edit? |
|------|------|-----------------|
| `server/src/routes/authRoutes.ts` | Login endpoint | Rarely |
| `server/src/middleware/jwtAuth.ts` | JWT verification middleware | Rarely |
| `client/src/pages/Login.tsx` | Login page UI | Sometimes |
| `client/src/components/ProtectedRoute.tsx` | Frontend route guard | Rarely |

## Understanding

**authRoutes.ts** — Handles login/signup endpoints. Validates credentials against hashed passwords in the database and issues JWT tokens on success.

**jwtAuth.ts** — Middleware that checks for a valid JWT token in request headers (`Authorization: Bearer <token>`). Attached to all protected routes at the API level.

**Login.tsx** — Simple form component that collects credentials and calls the auth API. Stores token in localStorage for subsequent requests.

**ProtectedRoute.tsx** — Frontend wrapper that checks for a valid token before rendering a page. Redirects to login if missing.
