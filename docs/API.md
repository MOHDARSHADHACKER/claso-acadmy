# Claso API v1

- Base URL: http://localhost:5000/api/v1 (JWT in HttpOnly cookie claso_token)
- POST /api/v1/auth/login -> { role, identifier, password } -> { user }[cite: 62]
- GET /api/v1/auth/me -> { user }[cite: 62]
- POST /api/v1/auth/logout -> { ok: true }[cite: 62]
- POST /api/v1/auth/change-password -> { currentPassword, newPassword }[cite: 62]
- POST /api/v1/auth/reset-password (Admin) -> { userId, newPassword }[cite: 62]
