# Deploying KLEF Survey to Hostinger (VPS + Coolify)

The app is packaged as **one container**: an Express server that serves both the API
(`/api/*`) and the built React frontend (everything else). It connects to your
**Hostinger managed MySQL** database.

> ⚠️ **Important:** your database host `wxbmna98l4lr1841kxjfh05n` is an **internal Coolify
> service name**. It is only reachable from inside the same Hostinger VPS / Coolify project.
> Therefore the app **must be deployed on that same VPS**, in the **same Coolify project** as
> the database. (Confirmed: the host does not resolve publicly.)

---

## Environment variables

Set these on the deployed app (values are in `server/.env.production`, which is git-ignored):

| Variable | Value |
|---|---|
| `DB_HOST` | `wxbmna98l4lr1841kxjfh05n` |
| `DB_PORT` | `3306` |
| `DB_USER` | `mysql` |
| `DB_PASSWORD` | *(the normal-user password)* |
| `DB_NAME` | `default` |
| `JWT_SECRET` | *(the generated secret)* |
| `JWT_EXPIRES` | `7d` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | *(change after first login)* |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |

On first start the app auto-creates its tables in the `default` database and seeds the
survey questions + the admin account.

---

## Option A — Coolify (recommended, matches your TutorIQ setup)

1. Repository: **`https://github.com/satish5813/klfacultysurvay`** · Branch: **`main`**.
   The app is at the repo **root** (`client/`, `server/`, `Dockerfile`).
2. In Coolify: **New Resource → Application → Public/Private Repository**, pick this repo.
3. **Build Pack: `Dockerfile`.**
   - **Base Directory:** `/` (repo root)
   - **Dockerfile Location:** `/Dockerfile`
4. **Port:** `4000`.
5. **Same project/network as the DB** — create/deploy this app in the **same Coolify project**
   as `mysql-database-wxbmna98l4lr1841kxjfh05n` so the internal DB host resolves.
6. **Environment variables:** paste the table above.
7. **Domain:** set a domain/subdomain (e.g. `survey.yourdomain.com`); Coolify handles HTTPS.
8. **Deploy.** Watch the logs for `DB ready...` and `KLEF Survey API listening on port 4000`.

## Option B — SSH + PM2 + Nginx

```bash
# on the Hostinger VPS (same machine as the DB)
git clone <your-repo> && cd <repo>/faculty-survey

cd client && npm ci && npm run build && cd ..
cd server && npm ci --omit=dev

# create server/.env with the variables from the table above
nano .env

npm install -g pm2
pm2 start src/index.js --name klef-survey
pm2 save && pm2 startup
```
Then point an Nginx server block (with your domain + SSL) at `http://127.0.0.1:4000`.

---

## After deploying

1. Open `https://<your-domain>/api/health` → should return `{"ok":true}`.
2. Open `https://<your-domain>/` → the survey.
3. Open `https://<your-domain>/admin` → log in with `admin` / your `ADMIN_PASSWORD`.
4. **Change the admin password** and, since the DB passwords were shared in plaintext,
   **rotate the MySQL passwords** in Hostinger and update the env vars.

## Local build sanity check (already verified)
```bash
cd faculty-survey/client && npm run build
cd ../server && PORT=4100 node src/index.js   # serves SPA + API from one process
```
