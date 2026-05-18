# ADR Security — JobAggregator

We identified 6 main threats on the application and put a control in place for each one.

---

### 1. SQL Injection

When a user fills in a form, they could try to inject SQL code to access data they shouldn't see.

To prevent this, we never insert user input directly into a SQL query. We use numbered parameters (`$1`, `$2`...) and PostgreSQL handles the rest.


---

### 2. Brute-force

Without protection, someone could try thousands of passwords on `/login` until they find the right one.

We limited to **3 attempts per IP every 3 minutes** on `/register` and `/login` routes. Beyond that, the request is blocked with an error message.




---

### 3. Unauthorized Access (IDOR)

A logged-in user could try to modify the ID in the URL to access another user's data or admin routes.

All admin routes go through two checks first: are you logged in? are you an admin?


### 4. Sensitive Data Exposure

We never return the password in HTTP responses. And in production, if an error occurs, we only show "Internal server error" — not the technical details.


---

### 5. Hardcoded Secrets

The JWT secret and DB passwords are never written directly in the code. They are stored in a `.env` file that is ignored by Git.


---

### 6. Malformed Input

Before reaching the service, we verify that what the user sends is correct — valid email, long enough password, first and last name present. If something is missing or incorrect, we return a clear error message.


