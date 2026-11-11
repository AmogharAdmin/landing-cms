# Nambiar District 25 Landing Page

A Next.js 16 App Router landing page with a dual-mode content system:

- local development preserves the typed `data/site.json` workflow;
- production reads and updates the same JSON structure from PostgreSQL `JSONB`;
- `/dashboard` is the development editor;
- `/admin` is the authenticated production CMS.

## Stack

- Next.js 16.3.2 App Router and TypeScript
- React 19 and Tailwind CSS 4
- Neon PostgreSQL via a pooled `DATABASE_URL` and `pg`
- bcrypt password hashes
- encrypted HttpOnly sessions via `iron-session`
- Zod content validation
- Nodemailer lead-form delivery

## Local development

```bash
npm install
npm run dev
```

- Site: `http://localhost:3000/`
- JSON editor: `http://localhost:3000/dashboard/`
- Production-admin test route: `http://localhost:3000/admin/`

## Production

The production CMS requires a Node.js-compatible Next.js host. A static FTP upload
cannot provide PostgreSQL access, authentication, route handlers, or live CMS updates.

See [CMS_SETUP.md](CMS_SETUP.md) for the complete deployment sequence and
[database/postgresql-schema.sql](database/postgresql-schema.sql) for the schema.
