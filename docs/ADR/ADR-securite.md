# ADR Security — JobAggregator

We identified 6 main threats on the application and put a control in place for each one.

---

### 1. SQL Injection

When a user fills in a form, they could try to inject SQL code to access data they shouldn't see.

To prevent this, we never insert user input directly into a SQL query. We use numbered parameters (`$1`, `$2`...) and PostgreSQL handles the rest.

**Prevents:** An attacker manipulating the database to retrieve all users, delete data, or bypass authentication.

**Where:** `backend/src/auth/auth.service.ts` → functions `register()` and `login()`
**Where:** `backend/src/admin/admin.service.ts` → functions `getAllUsers()`, `updateUserRole()`, `deleteOffer()`, `moderateOffer()`

---

### 2. Brute-force

Without protection, someone could try thousands of passwords on `/login` until they find the right one.

We limited to **3 attempts per IP every 3 minutes** on `/register` and `/login` routes. Beyond that, the request is blocked with an error message.

**Prevents:** An attacker automatically testing millions of passwords to break into an account.

**Where:** `backend/src/middlewares/limit.middleware.ts` → `authLimiter`
**Applied in:** `backend/src/auth/auth.routes.ts` → on `POST /register` and `POST /login`

---

### 3. Unauthorized Access (IDOR)

A logged-in user could try to modify the ID in the URL to access another user's data or admin routes.

All admin routes go through two checks first: are you logged in? are you an admin?

**Prevents:** A regular user accessing admin routes to delete offers, change user roles, or read private data.

**Where:** `backend/src/middlewares/auth.middleware.ts` → `authMiddleware`
**Where:** `backend/src/middlewares/role.middleware.ts` → `roleMiddleware`
**Applied in:** `backend/src/admin/admin.routes.ts`

---

### 4. Sensitive Data Exposure

We never return the password in HTTP responses. And in production, if an error occurs, we only show "Internal server error" — not the technical details.

**Prevents:** An attacker reading error messages to understand the code structure or extract passwords.

**Where:** `backend/src/middlewares/error.middleware.ts` → `errorMiddleware`
**Applied in:** `backend/src/index.ts` → at the bottom of all routes

---

### 5. Hardcoded Secrets

The JWT secret and DB passwords are never written directly in the code. They are stored in a `.env` file that is ignored by Git.

**Prevents:** An attacker finding credentials in the GitHub repository and using them to access the database or forge JWT tokens.

**Where:** `backend/src/config/env.ts` → `ENV` object reads from `.env`
**Where:** `.gitignore` → `.env` is ignored

---

### 6. Malformed Input

Before reaching the service, we verify that what the user sends is correct — valid email, long enough password, first and last name present. If something is missing or incorrect, we return a clear error message.

**Prevents:** An attacker sending unexpected data to crash the server or insert invalid data into the database.

**Where:** `backend/src/auth/auth.schema.ts` → `RegisterSchema` and `LoginSchema`
**Applied in:** `backend/src/auth/auth.controller.ts` → `registerController()` and `loginController()`
