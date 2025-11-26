Authentication & Authorization — Design notes

Overview
- Authentication: JWT-based (access token + refresh token)
- Passwords stored with bcrypt (cost factor e.g. 12)
- Roles: ADMIN, DOCTOR, PATIENT
- All protected API endpoints require `Authorization: Bearer <accessToken>` header

Token lifetimes
- Access token: short-lived (e.g., 15 minutes) — contains `sub` (user id), `role`, `exp`.
- Refresh token: long-lived (e.g., 7-30 days) — used to obtain new access tokens.
- Refresh tokens must be stored server-side for revocation or stored hashed in DB.

Flows
1) Registration
- POST /auth/register {name,email,password,role}
- Validate input, hash password with bcrypt, save user.
- Return 201 and user summary (do not return password or tokens by default).

2) Login
- POST /auth/login {email,password}
- Verify password with bcrypt, on success issue accessToken (JWT) and refreshToken (store hashed). Return both.

3) Token refresh
- POST /auth/refresh {refreshToken}
- Validate refresh token against DB record (hashed), if valid issue new accessToken and optionally a new refresh token.

4) Logout / revoke
- POST /auth/logout
- Invalidate refresh token server-side (delete or mark revoked)

Authorization
- Protect endpoints based on role:
  - ADMIN: full access to admin routes (user management, stats)
  - DOCTOR: access to own schedule and assigned appointments
  - PATIENT: book/cancel own appointments, view own history
- On server-side controllers/services, check role and ownership (e.g., doctor can only modify appointments for which they are the assigned doctor).

Security considerations
- Use HTTPS in all environments.
- Implement CSRF protections for cookie-based flows (we use Authorization header so lower risk).
- Rate-limit auth endpoints to mitigate brute force.
- Store refresh tokens securely (hashed) and provide rotation to reduce token theft risk.
- Validate JWT signature and expiry on every protected request.

CORS
- Configure CORS to allow frontend origin(s) only (e.g., http://localhost:5173 for dev).

Error handling
- Return consistent error responses with an object { code, message, details? }.
- Use 401 for authentication failures, 403 for forbidden, 409 for conflicts, 400 for validation.

Implementation hints (Spring Boot)
- Use `spring-security` with a JWT filter to extract and validate tokens.
- Use `BCryptPasswordEncoder` for password hashing.
- Store refresh tokens in a `refresh_tokens` collection with fields: tokenHash, userId, createdAt, expiresAt, revoked.
- Use annotations or method guards for role checks (e.g., `@PreAuthorize("hasRole('DOCTOR')")`).
