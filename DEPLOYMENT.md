# Student Portal Deployment Checklist (Netlify + Render + Supabase)

This project has three deployable parts:

- Frontend: Angular app in `StudentPortal`
- Backend: ASP.NET Core API in `StudentPortalAPI`
- Database: Supabase Postgres
- File storage: Supabase Storage

## 1. Create the Supabase project

Create a Supabase project and collect these values:

- Project URL
- Postgres connection URI
- Service role key

## 2. Create a public storage bucket for profile photos

In Supabase Storage, create a bucket named:

```text
profile-photos
```

Make the bucket **public**.

If you want to use a different bucket name, set:

```text
SUPABASE_STORAGE_BUCKET=your-bucket-name
```

## 3. Configure the backend database connection

You can use either of these formats for the backend:

### Option A: Supabase URI (recommended)

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres?sslmode=require
```

### Option B: .NET/Npgsql connection string

```text
ConnectionStrings__DefaultConnection=Host=YOUR_HOST;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require
```

The backend supports both formats.

## 4. Deploy the backend on Render

Create a **Web Service** on Render from your GitHub repository.

Use these settings:

- Runtime: `Docker`
- Root directory: `StudentPortalAPI`
- Dockerfile path: `StudentPortalAPI/Dockerfile`
- Service type: `Web Service`

Set these environment variables on the backend service:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres?sslmode=require
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=profile-photos
Jwt__Key=REPLACE_WITH_A_LONG_RANDOM_SECRET_KEY
Jwt__Issuer=StudentPortalAPI
Jwt__Audience=StudentPortalApp
Cors__AllowedOrigins__0=https://YOUR_NETLIFY_SITE_DOMAIN
```

Notes:

- Render provides the `PORT` environment variable automatically.
- The API is already configured to bind to `PORT`.
- EF Core migrations run automatically on backend startup.
- Profile photo uploads now go to Supabase Storage instead of the container filesystem.
- Production secrets are not stored in `appsettings.json`; they must be configured in Render.

After deployment, test:

```text
https://YOUR_RENDER_BACKEND_DOMAIN/
https://YOUR_RENDER_BACKEND_DOMAIN/health
```

Swagger is enabled only in development, so `/swagger` is mainly for local testing.

## 5. Deploy the frontend on Netlify

Connect the repository to Netlify and deploy the `StudentPortal` app.

Use these settings:

- Base directory: `StudentPortal`
- Build command: `npm run build`
- Publish directory: `dist/StudentPortal/browser`

Set these environment variables on Netlify:

```text
PUBLIC_API_BASE_URL=https://YOUR_RENDER_BACKEND_DOMAIN/api
PUBLIC_BASE_URL=https://YOUR_RENDER_BACKEND_DOMAIN
```

How it works:

- Before every production build, `StudentPortal/scripts/set-production-env.mjs` generates `src/environments/environment.prod.ts`.
- `PUBLIC_API_BASE_URL` is used for API requests.
- `PUBLIC_BASE_URL` is used for any backend-hosted relative assets.
- New profile photo uploads are stored as full Supabase public URLs, so the frontend can load them directly.

After the frontend is deployed, make sure the backend service has:

```text
Cors__AllowedOrigins__0=https://YOUR_NETLIFY_SITE_DOMAIN
```

Then redeploy the backend if needed.

## 6. Final live test

Test these flows on the hosted frontend:

- Register a student
- Login
- Update biodata
- Upload a profile photo
- Register courses
- Make payment
- Request clearance
- View dashboard
- Download ID card
- Print clearance slip
- Change password

## Local development URLs

```text
Frontend: http://localhost:4200
Backend API: http://localhost:5141
Swagger: http://localhost:5141/swagger
```
