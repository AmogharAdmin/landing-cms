# New Landing Page Setup Checklist

Use this when spinning up another site from the same template repo.

**Model:** 1 GitHub repo → 1 new Vercel project → 1 new database per site.

---

## Before you start

- [ ] Client domain is ready (or use a temporary `.vercel.app` URL)
- [ ] You have access to GitHub, Vercel, and Neon
- [ ] SMTP inbox is ready for lead emails (optional but recommended)

---

## 1. Database (Neon)

- [ ] Create a **new Neon project** or **new database/branch** for this site
- [ ] Run `database/postgresql-schema.sql` in the Neon SQL editor (CMS + analytics tables; safe to re-run)
- [ ] Copy the **pooled** connection string (`-pooler` in hostname)

---

## 2. Vercel project

- [ ] Create a **new Vercel project**
- [ ] Connect it to the **same GitHub repo**
- [ ] Add the client domain (or use default Vercel URL for now)

### Environment variables (set per project)

| Variable | What to set |
|----------|-------------|
| `DATABASE_URL` | This site’s Neon pooled URL |
| `AUTH_SECRET` | New random secret (`openssl rand -base64 32`) |
| `SITE_URL` | `https://client-domain.com` |
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | e.g. `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | Sending mailbox |
| `SMTP_PASS` | App password |
| `MAIL_FROM_NAME` | Client/project name |
| `MAIL_RECIPIENT` | Where leads should go |
| `BLOB_READ_WRITE_TOKEN` | From Vercel Blob (this project) |
| `Blog_STORE_ID` | From Vercel Blob (if used) |

- [ ] **Redeploy** after saving env vars (required — env changes do not apply until redeploy)

---

## Local development vs production

| Where you edit | URL | Where saves go |
|----------------|-----|----------------|
| **Your computer** (`npm run dev`) | `http://localhost:3000/admin` | `data/site.json` only — **does not change production** |
| **Live site** | `https://your-domain.com/admin` | PostgreSQL on Vercel (production database) |

- [ ] Use `npm run dev` and `localhost` for local content work
- [ ] Do **not** rely on `DATABASE_URL` in local `.env` for CMS editing — local saves ignore PostgreSQL unless you set `CMS_USE_DATABASE=true`
- [ ] To update the live site, sign in at the **production** `/admin` URL and click Save Changes
- [ ] To push local `site.json` changes to production once, run `npm run migrate-content` or `npm run sync-content` **only when you intend to update the live database**
- [ ] **Local reset:** `data/main-site.json` is the golden copy. Run `npm run restore-main-site` or use **Restore main** in `/admin` to reset `site.json`. Run `npm run save-main-site` when you want to update the golden copy.

---

## 3. First-time database setup (run once per site)

From your machine, with **this site’s** `DATABASE_URL`:

```bash
# Linux/macOS
export DATABASE_URL="postgresql://..."
npm run migrate-content
npm run create-admin -- --email=admin@client.com --password="Your-Strong-Password-2026!"
```

```powershell
# Windows PowerShell
$env:DATABASE_URL="postgresql://..."
npm run migrate-content
npm run create-admin -- --email=admin@client.com --password="Your-Strong-Password-2026!"
```

- [ ] `migrate-content` inserts `site_pages.slug='home'` from `data/site.json`
- [ ] `create-admin` creates the first `/admin` login for **this database only**
- [ ] Open `https://your-site.vercel.app/admin/login` and sign in

---

## 4. Verify

- [ ] Admin banner shows **“Connected securely to PostgreSQL”** (green)
- [ ] Save Changes works
- [ ] Image upload works (needs Blob env vars)
- [ ] Enquiry form sends email (needs SMTP env vars)
- [ ] **Analytics** tab shows visitors after visiting the live site
- [ ] Form submissions appear in Analytics → Submissions after a test enquiry

---

## Troubleshooting: “PostgreSQL is unavailable” / read-only admin

You can log in but the banner stays amber. The admin now shows **specific setup steps**. Common causes:

| Symptom in admin | Cause | Fix |
|------------------|-------|-----|
| **DATABASE_URL is not set** | Missing env var on Vercel | Add pooled Neon URL → redeploy |
| **Cannot connect to PostgreSQL** | Wrong URL, DB paused, or non-pooled URL | Use Neon **pooled** URL with `sslmode=require` |
| **Database tables are not created** | Schema not run | Run `database/postgresql-schema.sql` in Neon |
| **Analytics / leads tables missing** | Schema not run (or only partially applied) | Re-run `database/postgresql-schema.sql` in Neon |
| **Initial page content is not seeded** | `migrate-content` not run | `DATABASE_URL=... npm run migrate-content` |
| **AUTH_SECRET is not configured** | Missing or too short | Add 32+ char secret → redeploy |
| Image upload warning only | Blob not configured | Add `BLOB_READ_WRITE_TOKEN` (optional for first setup) |
| Lead email warning only | SMTP not configured | Add SMTP vars (optional for first setup) |

### Most common on a **new** Vercel + Neon site

1. Schema not applied → run `postgresql-schema.sql`
2. Content not seeded → run `npm run migrate-content`
3. Forgot to **redeploy** after adding env vars

### Order matters

```
1. Create Neon database
2. Run postgresql-schema.sql
3. Add Vercel env vars
4. Redeploy
5. npm run migrate-content   (against this DATABASE_URL)
6. npm run create-admin
7. Log in at /admin
```

---

## After deploying template code updates

When you push new features to GitHub:

- [ ] Each Vercel project redeploys automatically
- [ ] If new CMS fields were added, run once per database:

```bash
export DATABASE_URL="postgresql://..."
npm run sync-content
```

---

## One-line summary

**New site = new Vercel project + new Neon DB + env vars + redeploy → schema SQL → migrate-content → create-admin → /admin**

new vercel project
new neon project db
add database url in local system then comment previous and active the new
run npm run migrate-content
then run npm run create-admin -- --email=anuragyadav2641@gmail.com --password="Anurag#2641
then on vercel project create blob for uploads storage enter "blob" for name.