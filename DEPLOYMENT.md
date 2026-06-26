# Student Portal Deployment Checklist

This project has three deployable parts:

- Frontend: Angular app in `StudentPortal`
- Backend: ASP.NET Core API in `StudentPortalAPI`
- Database: PostgreSQL

## 1. Deploy the Database

Create a PostgreSQL database with any host that supports external connections.

Save the database connection details. The backend needs a connection string like:

```text
Host=YOUR_DB_HOST;Port=5432;Database=YOUR_DB_NAME;Username=YOUR_DB_USER;Password=YOUR_DB_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
```

For local development, the app currently uses:

```text
Host=localhost;Database=StudentPortalDb;Username=postgres;Password=YOUR_LOCAL_PASSWORD
```

## 2. Deploy the Backend API

Project folder:

```bash
StudentPortalAPI
```

Dockerfile:

```text
StudentPortalAPI/Dockerfile
```

Build command:

```bash
dotnet publish -c Release
```

Start command:

```bash
dotnet StudentPortalAPI.dll
```

Set these environment variables on the backend host:

```text
ConnectionStrings__DefaultConnection=Host=YOUR_DB_HOST;Port=5432;Database=YOUR_DB_NAME;Username=YOUR_DB_USER;Password=YOUR_DB_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=REPLACE_WITH_A_LONG_RANDOM_SECRET_KEY
Jwt__Issuer=StudentPortalAPI
Jwt__Audience=StudentPortalApp
Cors__AllowedOrigins__0=https://YOUR_FRONTEND_DOMAIN
```

Production secrets are not stored in `appsettings.json`; the backend expects the database connection and JWT key from environment variables on the host.

After deployment, test:

```text
https://YOUR_BACKEND_DOMAIN/
https://YOUR_BACKEND_DOMAIN/health
```

Note: Swagger is currently enabled only in development, so `/swagger` is for local testing unless you choose to enable it for production.

## 3. Connect the Frontend to the Backend

Before deploying the frontend, update:

```text
StudentPortal/src/environments/environment.prod.ts
```

Change:

```ts
apiBaseUrl: 'https://your-backend-url.com/api'
```

To your real deployed backend URL:

```ts
apiBaseUrl: 'https://YOUR_BACKEND_DOMAIN/api'
```

This Angular project does not load `.env` files automatically, so the production API URL must be set in `environment.prod.ts` before building.

## 4. Deploy the Frontend

Project folder:

```bash
StudentPortal
```

Build command:

```bash
npm run build
```

Publish/output directory:

```text
dist/StudentPortal/browser
```

After deployment, add the frontend domain to the backend CORS environment variable:

```text
Cors__AllowedOrigins__0=https://YOUR_FRONTEND_DOMAIN
```

## 5. Final Live Test

Test these flows on the hosted frontend:

- Register a student
- Login
- Update biodata
- Register courses
- Make payment
- Request clearance
- View dashboard
- Change password

## Local Development URLs

```text
Frontend: http://localhost:4200
Backend API: http://localhost:5141
Swagger: http://localhost:5141/swagger
```
