# PostgreSQL CMS setup and deployment

## Architecture

The landing page remains driven by the typed object in `data/site.json` during local
development. Production preserves that exact nested structure in the PostgreSQL
`site_pages.content` JSONB column. The public site receives the document server-side
and passes it through `SiteDataProvider`, so the existing markup, styling, content
field names, arrays, and image paths remain unchanged.

The same `AdminDashboard` component supports both adapters:

- `/dashboard` writes local JSON in development;
- `/admin` uses authenticated PostgreSQL APIs in production.

## Database requirement and schema

Use PostgreSQL 12 or newer. Create an empty database, select it, and run:

```text
database/postgresql-schema.sql
```

It creates:

- `admin_users` for bcrypt-protected administrator accounts;
- `site_pages` for complete versioned JSONB page documents;
- `site_page_versions` for automatic pre-save snapshots;
- `visitor_sessions` and `form_submissions` for analytics and lead tracking.

The same file is idempotent: re-running it adds any missing tables, indexes, or
columns (such as `city` / `click_source`) without wiping existing data.

For a self-managed PostgreSQL server, a privileged operator can create the database
and restricted application role with commands equivalent to:

```sql
CREATE ROLE nambiar_app LOGIN PASSWORD 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
CREATE DATABASE nambiar_cms OWNER nambiar_app ENCODING 'UTF8';
```

Connect to `nambiar_cms` as its owner and run `database/postgresql-schema.sql`.

## Neon and Vercel database connection

Create the Neon project and copy its **pooled** connection string from Neon’s
**Connect** dialog. The hostname in a pooled URL contains `-pooler`, and the URL
includes the required TLS options. This project intentionally uses one database
variable only:

```env
DATABASE_URL=postgresql://user:password@your-endpoint-pooler.region.aws.neon.tech/database?sslmode=require
```

In Vercel, add `DATABASE_URL` under **Project Settings > Environment Variables** for
Production and any Preview/Development environments that should use a database. If
you install the Neon integration from the Vercel Marketplace, it can inject this
variable automatically. Redeploy after adding or changing it.

Prisma is not part of this project and `prisma generate` is not needed. The existing
CMS uses parameterized PostgreSQL queries through `pg`, while the database schema is
created from `database/postgresql-schema.sql`.

The remaining production variables are:

```env
SITE_URL=https://your-domain.com
AUTH_SECRET=at_least_32_random_characters
UPLOAD_DIR=/absolute/persistent/path/to/uploads
UPLOAD_PUBLIC_PATH=/uploads
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mailbox@example.com
SMTP_PASS=mail_app_password
MAIL_FROM_NAME=Nambiar District 25
MAIL_RECIPIENT=leads@example.com
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`. Never prefix database or auth
variables with `NEXT_PUBLIC_`.

## Seed the existing JSON content

After creating the PostgreSQL tables and configuring the environment:

```bash
npm run migrate-content
```

The script validates `data/site.json`, checks for `site_pages.slug='home'`, and inserts
only when it is missing. It never overwrites existing production content. Data in a
previous database engine is not reused automatically; the unchanged JSON file is the
safe seed source for the new PostgreSQL database.

## Add fields for a new feature

`data/site.json` is the canonical feature payload. When a feature adds fields:

1. Add their defaults to `data/site.json`.
2. Add their TypeScript definitions in `types/site.ts`.
3. Add their validation rules in `lib/content-schema.ts`.
4. Read the fields in the relevant public component.
5. Deploy the code, then synchronize the missing defaults once:

```bash
npm run sync-content
```

The synchronization command locks the `home` page, adds only missing object fields,
preserves values already edited in `/admin`, snapshots the previous JSONB document,
and commits the update transactionally. If the page does not exist yet, it creates it.
It is safe to run repeatedly.

No database migration, `ALTER TABLE`, Prisma command, or new CRUD endpoint is needed
for content fields. The generic admin editor discovers top-level payload sections and
automatically supplies field editing plus add, delete, and reorder controls for array
items. A genuinely new visual or behavioral feature still needs its React rendering
code and corresponding validation/type definitions; a payload alone cannot define
arbitrary frontend behavior safely.

### Google Tag Manager and Google Analytics (per landing page)

Configure both under **Analytics → Google tags** in `/admin`:

- For Google Tag Manager, enable GTM and enter the web container ID (`GTM-…`).
- Direct GA4 is optional. Enable it and enter a Measurement ID (`G-…`) only when GA4
  is not already published from the GTM container, otherwise page views may be counted twice.
- Click **Save Changes**, publish the GTM container in Google Tag Manager, and verify the
  live deployment with Tag Assistant.

GTM and GA4 have independent toggles and IDs. Their values live in the landing page's
`site_pages.content` JSONB document, so they are specific to the Neon database connected
to that Vercel project and are never hardcoded. The GTM container uses Next.js's optimized
route-level script loader and includes Google's no-JavaScript iframe fallback. Tags are not
injected into `/admin` or the local `/dashboard` editor.

After deploying this feature against an older database, run `npm run sync-content` once to
add the missing `googleTagManager` defaults without replacing any existing CMS values. No
SQL schema migration is required.

### GTM events available to triggers

When GTM is enabled, the public landing page pushes these custom events to `dataLayer`:

| Event | When it fires |
| --- | --- |
| `button_click` | A regular button or interactive control is clicked |
| `link_click` | A regular link is clicked |
| `form_cta_click` | A CTA that opens an enquiry form is clicked |
| `phone_click` | A `tel:` call action is clicked |
| `whatsapp_click` | A WhatsApp action is clicked |
| `file_download` | A brochure, plan, or other document download is clicked |
| `form_open` | An enquiry modal variant opens |
| `form_submit_attempt` | Any lead form is submitted, before validation/API completion |
| `form_submit_success` | The server accepts and saves a lead |
| `form_submit_error` | Validation or the submission request fails |

Events include the project name and current page path. Click events also include a safe
button label, location, optional button id, and non-sensitive destination. Form events
include the form id, editable form name, and form location; success events include the
configured success type. Names, phone numbers, email addresses, messages, custom-field
answers, WhatsApp numbers, and URL query strings are deliberately not sent to GTM.

In Google Tag Manager, create **Custom Event** triggers using the exact event names above,
attach the desired GA4 / Google Ads tags, test in Preview, and publish the container. Use
`form_submit_success` (not `form_submit_attempt`) for conversion tags so rejected forms do
not count as leads.

## Create or reset an administrator

```bash
npm run create-admin -- --email=admin@example.com
```

For better shell privacy, supply the password temporarily.

PowerShell:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="A-Strong-Unique-Password-2026!"
npm run create-admin
Remove-Item Env:ADMIN_EMAIL
Remove-Item Env:ADMIN_PASSWORD
```

Linux/macOS:

```bash
ADMIN_EMAIL='admin@example.com' ADMIN_PASSWORD='A-Strong-Unique-Password-2026!' npm run create-admin
```

If a provider only offers a query editor, generate a PostgreSQL-compatible bcrypt
upsert locally:

```bash
npm run generate-admin-sql -- --email=admin@example.com
```

Passwords must be 12-72 bytes and contain uppercase, lowercase, number, and special
character. There is no public registration page.

## Production deployment

The CMS requires a persistent Node.js process; static FTP hosting is not sufficient.

```bash
npm ci
npm run build
npm run migrate-content
npm run create-admin -- --email=admin@example.com
npm run start
```

Run the application behind HTTPS and a reverse proxy/process manager. Configure all
environment variables before starting it. `/admin` redirects anonymous users to
`/admin/login`; `/dashboard` returns 404 in production.

## Live update flow

1. The authenticated editor loads `/api/admin/content/home`.
2. Save validates the complete content object.
3. A PostgreSQL transaction locks the page and snapshots the prior JSONB document.
4. A parameterized query updates `site_pages.content`.
5. Next.js revalidates `/`, `/sitemap.xml`, and `/robots.txt`.
6. The next landing-page request receives the updated content without a Git commit or redeployment.

If PostgreSQL is temporarily unavailable, the public page serves the bundled JSON
fallback. The admin never reports a successful save after a failed transaction.

## Images, PDFs, and persistent storage

The database stores **paths or URLs only**, never image or PDF binaries. Production
uploads accept JPEG, PNG, WebP, GIF, AVIF, or PDF, enforce a 20 MB decoded limit,
verify file signatures, and use randomized names.

`UPLOAD_DIR` must be persistent and publicly served at `UPLOAD_PUBLIC_PATH`. Ephemeral
hosts require a mounted volume or object-storage adapter. No Neon schema change is
required to support PDFs or extra images: save the content JSON after upload so the
new `/uploads/...` path is stored in `site_pages.content`.

## Security

- PostgreSQL access is server-only and every value uses parameterized queries.
- Passwords use bcrypt cost 12 and are never stored as plaintext.
- `iron-session` provides encrypted, signed, HttpOnly, Secure-in-production cookies.
- Admin pages, content APIs, upload APIs, and mutations verify authorization server-side.
- Mutations enforce same-origin checks and login attempts are rate-limited.
- Content payloads and uploads are size-limited and validated.
- User-facing errors omit credentials, database details, and stack traces.
- The development filesystem service binds only to loopback and is not started in production.

## Backups

Every save keeps the previous document in `site_page_versions`. Also schedule regular
PostgreSQL backups:

```bash
pg_dump --format=custom --no-owner --file=nambiar-cms.backup "$DATABASE_URL"
```

Keep `data/site.json` in version control as the original migration source and emergency
fallback.
