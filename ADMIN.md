# Content Studio

The project has one shared editor UI with two storage adapters.

| Route | Environment | Storage | Authentication |
| --- | --- | --- | --- |
| `/dashboard` | Development only | `data/site.json` | Local machine only |
| `/admin` | Production CMS | PostgreSQL `site_pages.content` | Email/password required |

## Local JSON editor

```bash
npm run dev
```

Open `http://localhost:3000/dashboard/`. The development command starts Next.js and
the loopback-only content service on `127.0.0.1:3100`. Saves atomically update
`data/site.json`; uploads go to `public/images`.

`/dashboard` returns 404 in production, and the filesystem content service is never
started by `npm start`.

## Production admin

1. Run `database/postgresql-schema.sql` in the selected PostgreSQL database.
2. Add the pooled Neon `DATABASE_URL` and the remaining variables from `.env.example`
   to the Vercel project.
3. Run `npm run migrate-content` once.
4. Run `npm run create-admin -- --email=admin@example.com`.
5. Open `https://your-domain.com/admin/` and sign in.

The production editor loads and saves the same complete JSON object through protected
Next.js route handlers. Every successful save snapshots the previous document in
`site_page_versions` before updating the live `home` content.

See `CMS_SETUP.md` for complete deployment, security, upload, backup, and administrator
instructions.

When deployed code introduces new content fields, run `npm run sync-content` once
with the production `DATABASE_URL`. The command adds missing defaults without
overwriting values already maintained in this editor.
