# Sprint 4 Report

VoteVerse — CEN 5035 · Software Engineering  
_Sprint window: 04 Apr 2025 → 18 Apr 2025_

---

## 1 . Work Completed in Sprint 4

| Epic                            | Issue(s) Closed  | Outcome                                                                                                                                  |
| ------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Test-Suite Refinement**       | #134, #142, #151 | • Backend coverage ↑ to 87 % <br>• Frontend coverage ↑ to 82 % <br>• Property-based voting tests added                                   |
| **E2E & Visual Tests**          | #148, #149       | • Cypress smoke pack (Auth ➜ Create Poll ➜ Vote ➜ Results) <br>• Percy snapshots for Home, Poll, Results                                 |
| **Blue-Green Deploy (systemd)** | #130, #145       | • `voteverse-api-blue/green.service` & `voteverse-ui-blue/green.service` <br>• `make deploy-blue` script with health-gate                |
| **Observability**               | #126, #136       | • Prometheus `/metrics` (API latency, Mongo ops/s) <br>• Zap JSON logs, logrotate (7-day retention)                                      |
| **RBAC & API Hardening**        | #118, #140, #153 | • Final role matrix (admin/mod/member/guest) <br>• Consistent error codes `VV-4xx/5xx` <br>• v1 endpoints frozen, v0 marked _Deprecated_ |
| **Security**                    | #131, #147       | • JWT key rotation utility <br>• Rate-limit middleware (20 req/min IP+user)                                                              |
| **Documentation**               | #150             | • Updated Swagger (`docs/openapi_v1.yaml`) <br>• README quick-start rewritten for local install                                          |

---

## 2 . Frontend Tests

### 2.1 Jest / React‐Testing‐Library

| Test File                  | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `PollCard.test.tsx`        | Renders question, options & percent bars correctly |
| `VoteButtonGroup.test.tsx` | Emits `onVote` callback & disables after vote      |
| `AuthForm.test.tsx`        | Validates form fields & error toast behaviour      |
| `Navbar.test.tsx`          | Role-based menu items (guest vs member)            |

### 2.2 Cypress E2E & Visual

| Spec                    | Flow Covered                        | Notes                 |
| ----------------------- | ----------------------------------- | --------------------- |
| `auth_flow.cy.ts`       | Sign-up → Email verify stub → Login | Pass < 5 s            |
| `poll_happy_path.cy.ts` | Create Poll → Vote → View Results   | Screenshots diff-free |
| `permissions.cy.ts`     | Guest blocked from `/create`        | 403 assertion         |
| `mobile_view.cy.ts`     | iPhone-6 viewport responsiveness    | Percy snapshot        |

_Total frontend statement coverage: **82 %** (Jest)_

---

## 3 . Backend Tests

### 3.1 Unit Tests (`go test`)

| Package           | File               | Focus                                        |
| ----------------- | ------------------ | -------------------------------------------- |
| `service/auth`    | `token_test.go`    | HS256 signing, expiry edge cases             |
| `service/poll`    | `poll_test.go`     | Option tally logic, duplicate vote rejection |
| `dao/mongo`       | `poll_dao_test.go` | CRUD with in-memory stub                     |
| `middleware/rbac` | `rbac_test.go`     | Role ➜ route permissions                     |

### 3.2 Integration Tests

Run with Testcontainers-Go (Mongo 6.0):

| Test Suite                | Scenario                                     |
| ------------------------- | -------------------------------------------- |
| `api_integration_test.go` | Full request cycle `/signup → /poll → /vote` |
| `auth_refresh_test.go`    | Refresh-token rotation & blacklisting        |

### 3.3 Property-Based Tests

_Framework:_ `github.com/leanovate/gopter`

- **Voting Idempotency** — submitting same choice ≥ N times never alters final tally
- **JWT TTL Bounds** — randomly generated TTL ∈ [1m, 24h] always validated

_Total backend line coverage: **87 %**_

---

## 4 . Updated Backend API Documentation (v1)

The OpenAPI spec is version-locked at **`docs/openapi_v1.yaml`**.  
Key Sprint 4 changes:

| Change                 | Endpoint(s)                   | Notes                                  |
| ---------------------- | ----------------------------- | -------------------------------------- | --------- | ------- |
| **RBAC header**        | all `POST /api/v1/**`         | Requires `X-Role: admin                | moderator | member` |
| **Rate-limit**         | `/api/v1/auth/login`, `/vote` | 20 requests / minute (429 on exceed)   |
| **Deprecation banner** | all `/api/v0/**`              | `Deprecation: true`, sunset 2025-05-31 |
| **Error schema**       | global                        | `{ code: "VV-4xx", message: string }`  |

### Example: Create Poll (v1)

```http
POST /api/v1/polls HTTP/1.1
Host: localhost:8080
Authorization: Bearer <JWT>
X-Role: member
Content-Type: application/json

{
  "question": "Best Go web framework?",
  "options": ["Gin", "Echo", "Fiber"],
  "expiresInMinutes": 60
}
```
