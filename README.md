# SIH Project — Team Setup Guide

This document is the single source of truth for getting this project running
on your machine. Read it fully before writing any code — most setup errors
this team has already hit (and lost hours to) are covered in the
Troubleshooting section at the bottom.

## 1. What this project is

A monorepo with three parts:
- `frontend/` — Next.js 15 app (UI, auth, dashboards, tRPC API)
- `backend/` — Python FastAPI service (ML model inference + RAG chatbot)
- `packages/` — shared code (`database` = Prisma schema/client, `types` =
  shared TS contracts, `config` = shared TS config)

The database is **Supabase** (shared cloud Postgres — not local Docker).
Everyone connects to the **same** database, so schema changes affect
everyone immediately (see Rule 3 below).

```
sih-main/
├── frontend/       ← Next.js app
├── backend/        ← Python FastAPI service
├── packages/
│   ├── database/   ← Prisma schema (shared DB structure)
│   ├── types/       ← shared TypeScript types
│   └── config/      ← shared tsconfig
├── package.json      ← root, manages frontend/ + packages/ via pnpm
├── pnpm-workspace.yaml
└── .env               ← shared secrets for Prisma CLI commands (NOT committed)
```

## 2. Prerequisites — install these first

| Tool | Version | Check with | Install from |
|---|---|---|---|
| Node.js | 20+ | `node -v` | https://nodejs.org |
| pnpm | 9+ | `pnpm -v` | `corepack enable` (ships with Node 20+) |
| Python | 3.11+ | `python --version` | https://python.org (check "Add to PATH" on Windows) |
| Git | any recent | `git --version` | https://git-scm.com |

You do **not** need Docker or a local Postgres install — the database is
cloud-hosted (Supabase).

## 3. Clone the repo

```bash
git clone <the-repo-url>
cd sih-main
```

## 4. Get the shared secrets (ask the repo owner, not in Git)

`.env` files are **never committed** (see Rule 1) — you'll receive these
values directly from whoever owns each service (Supabase, Resend, Groq),
outside of GitHub (Discord/WhatsApp/whatever the team uses).

You need **three separate `.env` files**, in three different folders —
this project's tooling doesn't share one file across `frontend/`, `backend/`,
and the root, so each needs its own copy:

### `sih-main/.env` (repo root — used by Prisma CLI commands)
```
DATABASE_URL="<ask for the Supabase direct connection string>"
NEXTAUTH_SECRET="<ask for the shared secret>"
NEXTAUTH_URL="http://localhost:3000"
REQUIRE_EMAIL_VERIFICATION="false"
RESEND_API_KEY="<ask for the shared Resend key>"
EMAIL_FROM="SIH Project <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="SIH Project"
```

### `frontend/.env.local` (Next.js only reads env files from inside `frontend/`)
Same content as above, copied exactly. Yes, this means two files with
identical content — that's intentional (Next.js and the Prisma CLI each
only look in their own working directory).

### `backend/.env` (Python service — separate again)
```
INTERNAL_API_KEY="<ask for the shared internal key — must match ML_SERVICE_API_KEY in frontend>"
DATABASE_URL="<same Supabase direct connection string as above>"
GROQ_API_KEY="<get your own free key at https://console.groq.com>"
LLM_MODEL="llama-3.3-70b-versatile"
EMBEDDING_MODEL="sentence-transformers/all-MiniLM-L6-v2"
```
Also add to `frontend/.env.local` and `sih-main/.env`:
```
ML_SERVICE_URL="http://localhost:8000"
ML_SERVICE_API_KEY="<same value as INTERNAL_API_KEY above>"
```

**Everyone gets their own free Groq API key individually** (https://console.groq.com,
free, instant) — don't share one Groq key across the team, free-tier rate
limits are per-key and you'll block each other.

## 5. Install the frontend + shared packages

Run this from `sih-main/` (the root) — **not** from inside `frontend/`:

```bash
pnpm install
pnpm approve-builds
```
When `approve-builds` shows a picker, approve `@prisma/client`, `@prisma/engines`,
`prisma`, and `sharp`.

```bash
pnpm db:generate
```
This generates the typed Prisma client from the shared schema. Run it
again any time `packages/database/prisma/schema.prisma` changes (see Rule 3).

## 6. Install the backend

```bash
cd backend
python -m venv venv
```
Activate it — **Windows**:
```powershell
venv\Scripts\activate
```
**Mac/Linux**:
```bash
source venv/bin/activate
```
Then, with the venv active (you'll see `(venv)` in your terminal prompt):
```bash
pip install -r requirements.txt
```
This install is large (~1GB+, includes `torch` for local embeddings) and
takes several minutes — that's expected, not a hang.

## 7. Run everything

Two terminals, both from `sih-main/`:

**Terminal 1 — frontend:**
```bash
pnpm dev
```
Visit http://localhost:3000

**Terminal 2 — backend:**
```bash
cd backend
venv\Scripts\activate    # or: source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
Visit http://localhost:8000/docs to confirm it's running (interactive API docs).

## 8. Quick smoke test after setup

1. `/` loads with navbar, hero, services carousel, stacking cards, footer
2. Sign up with your own email → check inbox for verification link
3. Log in → land back on `/` → welcome section appears
4. Visit `/dashboard` → role-based redirect works
5. Click the chat button while logged out → redirected to `/login`
6. `http://localhost:8000/docs` loads and `/api/v1/health` returns `{"status": "ok"}`

If any of these fail, check Troubleshooting below before asking the team —
it's very likely already been hit and solved.

---

## Rules everyone follows

**Rule 1 — `.env` files are never committed, ever.**
They're already in `.gitignore`. If `git status` ever shows an `.env` file
as changed/new, stop and check your `.gitignore` before committing —
leaked secrets (especially `NEXTAUTH_SECRET` and API keys) mean rotating
every key immediately.

**Rule 2 — Only ever use `pnpm`, never `npm`, in `frontend/`, `packages/`, or the root.**
Mixing package managers corrupts pnpm's dependency linking (we've hit this
already — it breaks in confusing, hard-to-diagnose ways). To add a new
JS/TS package: edit the relevant `package.json` directly, then run
`pnpm install` from the root. Never run `npm install <package>` anywhere
in this repo.

**Rule 3 — Coordinate before running `pnpm db:push` or `pnpm db:migrate`.**
Everyone shares the same Supabase database. If you change
`packages/database/prisma/schema.prisma` and push it, everyone else's app
may break until they pull your change and re-run `pnpm db:generate`.
**Post in the team chat before pushing a schema change**, and pull latest
before making your own.

**Rule 4 — Filename convention: kebab-case files, PascalCase exports.**
`login-form.tsx` exporting `LoginForm`, `chat-widget.tsx` exporting
`ChatWidget`, `vector_store.py` (Python uses snake_case, that's normal for
Python) — stay consistent within each language's convention.

**Rule 5 — Every new file gets a header comment.**
```ts
/**
 * FEATURE: what this file does
 * INSTALLATION: exact command needed for it to work (or "none")
 */
```
This is how the next teammate (or you, in a month) knows what a file is
for without reverse-engineering it.

**Rule 6 — Activate the correct virtual environment, every terminal session.**
`venv`s don't persist across terminal windows. If you open a new terminal,
you must `venv\Scripts\activate` (or `source venv/bin/activate`) again
before running anything Python-related — a `ModuleNotFoundError` almost
always means you're in the wrong (or no) venv.

**Rule 7 — Don't commit `node_modules/`, `venv/`, `.next/`, or `__pycache__/`.**
Already covered by `.gitignore` — if you ever see these in `git status`,
something's wrong with your `.gitignore`, fix that before committing
anything else.

**Rule 8 — Branch per feature, PR before merging to `main`.**
Suggested naming: `phase3-ml/<your-feature>`, `phase4-rag/<your-feature>`,
`frontend/<your-feature>`. Don't push directly to `main`.

---

## Who owns what (current phase split)

| Area | Owner | Key folders |
|---|---|---|
| RAG / backend / AI agent | You | `backend/app/rag/`, `backend/app/api/routes/rag.py` |
| Frontend (dashboards, UI, marketing page) | Teammate | `frontend/src/app/`, `frontend/src/components/` |
| ML model | Teammate | `backend/app/models/` |

Shared, ask before changing: `packages/database/prisma/schema.prisma`,
`packages/types/src/index.ts`, `frontend/src/server/auth/config.ts`.

---

## Troubleshooting (things we've actually hit)

**`ModuleNotFoundError: No module named 'fastapi'`**
Wrong (or no) venv active in this terminal. Run `dir` inside `backend/` to
confirm a `venv` folder exists, then `venv\Scripts\activate`, then retry.

**`ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`**
A `package.json` is missing or its `"name"` field has a typo. Check
`packages/database/package.json`, `packages/types/package.json`,
`packages/config/package.json` all exist with correct `"name"` fields
(`@sih/database`, `@sih/types`, `@sih/config`).

**`ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`**
There's no `package.json` directly inside `sih-main/` itself. Confirm it
exists at the repo root (not just inside `frontend/`).

**`Cannot find module 'next'` / other "cannot find module" TS errors**
Usually `pnpm install` didn't fully complete, or `npm install` was run by
mistake and corrupted `node_modules`. Delete `node_modules` everywhere
(`node_modules/`, `frontend/node_modules/`), delete `pnpm-lock.yaml`, run
`pnpm install` fresh from the root.

**"Invalid environment variables" error from Next.js**
`frontend/.env.local` is missing or missing a required key — remember
Next.js only reads env files from inside `frontend/`, not the repo root.

**`Could not parse SQLAlchemy URL from string ''`**
`backend/.env` is missing `DATABASE_URL`, or the file is misnamed
(`.env.txt` instead of `.env` — a Notepad-on-Windows gotcha). Run
`dir backend/.env*` to check the exact filename.

**"Can't reach database server" on port 6543**
Some networks (school/office wifi, certain antivirus/firewalls) block
Supabase's pooler port. Use the **direct connection** (port `5432`)
instead — same string, just swap the port and hostname per Supabase's
dashboard connection-string page.

**React Context / SessionProvider errors**
`SessionProvider` (or any context provider) must be wrapped in a
`"use client"` file (see `frontend/src/app/providers.tsx`) — never used
directly inside a Server Component like `layout.tsx`.

---

Questions not covered here → ask in the team chat, and consider adding the
answer to this file so the next person doesn't hit the same wall.