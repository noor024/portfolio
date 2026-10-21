# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Portfolio content and resume scheduling

Projects and profile settings are loaded from the PostgreSQL-backed API. If the API is
unavailable, the portfolio does not substitute demo projects.

Start the API from `backend` after configuring `DATABASE_URL`, `JWT_SECRET`, and
`FRONTEND_URL` in its environment:

```powershell
npm install
npm start
```

The backend synchronizes the `resume_versions` table at startup. Sign in to the admin
dashboard and use **Resume Schedule** to upload a PDF (up to 10 MB), set its publish time,
and optionally set an end time. Times are entered in the browser's local timezone and
stored in PostgreSQL. A new version automatically ends an earlier open-ended version when
its publish time arrives; overlapping schedules are rejected. The public download is
available only while a resume version is scheduled as active.
