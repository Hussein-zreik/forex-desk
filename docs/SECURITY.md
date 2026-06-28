# Security notes

A short record of the security posture and the conscious tradeoffs.

## Auth & tokens

- Passwords are hashed with **bcrypt**; the API issues a **JWT** (HS256) on
  login/register.
- **`JWT_SECRET` is mandatory outside dev** — `config.py` refuses to boot when
  `ENVIRONMENT != "dev"` and the secret is still the committed default. Render
  generates a real secret (`render.yaml`).
- **JWT storage = `localStorage`** (zustand `persist`). This is the standard SPA
  tradeoff: simple, works across tabs, but readable by any script that runs on
  the page, so it relies on the app staying XSS-free (no `dangerouslySetInnerHTML`,
  no `eval`, dependencies audited). The alternative — an **httpOnly, Secure,
  SameSite cookie** — removes the XSS-read risk but requires CSRF protection and a
  same-site/credentialed-fetch setup. **Decision: keep `localStorage` for now**;
  revisit (httpOnly cookie + CSRF) if the app starts handling real funds or
  third-party embeds. This is the only deliberately deferred item.

## Input / data

- User-supplied symbols are validated at the Yahoo fetch boundary
  (`yahoo.validate_symbol`) so they can't shape outbound requests or pollute the
  cache.
- All DB access is via SQLAlchemy parameterized queries; ownership is checked on
  every delete (no IDOR).
- Only `.env.example` is tracked — no secrets in the repo.

## Dependency scanning

- **Frontend:** `npm audit` (0 vulnerabilities at last check).
- **Backend:** `pip-audit` runs in CI as an **advisory** step (surfaces CVEs in
  the log without blocking on upstream advisory timing). Review failures and
  pin/upgrade as needed.
