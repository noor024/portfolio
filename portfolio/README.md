# Noor Mohammad — Developer Portfolio

Personal portfolio for **Noor Mohammad**, a full-stack developer. The site presents a profile, skills, projects, and contact information, with a private admin dashboard for managing published content and the current CV.

**Live site:** [noormohd.me](https://noormohd.me/)

## Features

- Responsive portfolio with profile, journey, skills, projects, and contact sections
- Admin-managed profile settings and projects
- Admin upload to immediately replace the CV available from the public download button
- PostgreSQL persistence for portfolio content and resume files
- Protected admin endpoints, API rate limiting, and security headers
- SEO metadata, social sharing cards, favicon, sitemap, and robots directives

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, Framer Motion, Lucide |
| Backend | Node.js, Express |
| Database | PostgreSQL, Sequelize |
| Security | Helmet, CORS, express-rate-limit, JWT, bcrypt |

## Project structure

```text
portfolio/
├── backend/       # Express API, Sequelize models, and PostgreSQL integration
├── public/        # Static assets, profile images, SEO files, and icons
├── src/           # React application and admin dashboard
├── index.html     # Page metadata and social sharing tags
└── package.json   # Frontend scripts and dependencies
```

## Requirements

- Node.js (an active LTS release recommended)
- npm
- A PostgreSQL database

## Run locally

Open a terminal in the `portfolio` directory.

### 1. Configure and start the backend

In PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env` and provide your database connection string and a long, random JWT secret. Set `FRONTEND_URL` to `http://localhost:5173` for local development. To create the first administrator, also add `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` to the environment file.

Install dependencies, create the admin account, then start the API:

```powershell
npm install
node createAdmin.js
npm run dev
```

The API runs on port `5000` by default. On startup it connects to PostgreSQL and synchronizes its Sequelize models. Check the database connection at [http://localhost:5000/api/health](http://localhost:5000/api/health).

### 2. Start the frontend

In a second terminal, return to the `portfolio` directory:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The frontend uses `http://localhost:5000/api` by default. Set `VITE_API_URL` in `.env.local` if your API uses a different URL. Open the local address printed by Vite, usually [http://localhost:5173](http://localhost:5173).

## Admin dashboard

Open the site with `?admin=true` to reach the admin sign-in screen:

```text
http://localhost:5173/?admin=true
```

After signing in, use the dashboard to update profile settings and manage projects. The **Current CV** section accepts PDF files up to 10 MB. Uploading a file replaces the previous database CV immediately, and the public **Download CV** button serves the latest upload. Until the first admin upload, the public button uses the bundled `public/resume.pdf`.

## API overview

The backend serves JSON and resume downloads under `/api`:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Check API and database availability |
| `/api/projects` | Read and manage portfolio projects |
| `/api/settings` | Read and update profile and social settings |
| `/api/resumes/active` | Get the currently published resume |
| `GET /api/resumes/active/file` | Download the currently published resume |
| `GET /api/resumes` | Get the current CV details (admin access required) |
| `POST /api/resumes` | Replace the current CV with an uploaded PDF (admin access required) |
| `/api/admin` | Admin sign-in, session, and account management |

Write operations and current-CV details are protected by admin authentication.

## Production

- Deploy the frontend and backend separately if required by your hosting provider.
- Set `VITE_API_URL` to the deployed API base URL, including `/api`, before building the frontend.
- Configure the backend's `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`, and `PORT` in the hosting environment. `FRONTEND_URL` can contain comma-separated allowed origins.
- Use a managed PostgreSQL instance and keep credentials in the hosting provider's secret settings—not in source control.
- Build the frontend with `npm run build`; the generated static site is in `dist/`.
- Start the backend with `npm start`.

## Available scripts

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

### Backend

Run these commands from `backend/`.

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Node.js watch mode |
| `npm start` | Start the API |
| `npm run migrate:data` | Run the existing data migration script |
