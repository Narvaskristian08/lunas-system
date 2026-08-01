# LUNAS web command center

Shared, role-aware web screens for **LUNAS: An AI-Assisted Urban Infrastructure Maintenance and Monitoring System with Automated SLA Management**.

## Local preview

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. For the full System Administrator preview, sign in with:

- Email: `carlo.mendoza@lunas.gov.ph`
- Password: `LunasDemo!2026`

The sign-in screen includes a role mockup gallery for loading any of the six preview accounts. Every account uses the password `LunasDemo!2026`.

| Role | Mock account |
| --- | --- |
| Barangay Official | `maria.santos@pantal.gov.ph` |
| City Engineering Office | `rafael.cruz@dagupan.gov.ph` |
| Utility Provider | `ana.reyes@dagupanwater.gov.ph` |
| System Administrator | `carlo.mendoza@lunas.gov.ph` |
| Maintenance Coordinator | `miguel.torres@dagupan.gov.ph` |
| Executive Viewer | `elena.garcia@dagupan.gov.ph` |

The profile menu also includes a clearly marked demo-only role switcher for moving between all six permission-driven navigation and dashboard variants without signing out.

## Implemented shared routes

- Authentication: `/login`, `/forgot-password`, `/reset-password`, `/verify-account`, `/session-expired`
- Protected: `/dashboard`, `/notifications`, `/notifications/[id]`, `/profile`, `/profile/edit`, `/profile/change-password`, `/help`, `/unauthorized`
- Public/legal: `/privacy`, `/terms`, `/maintenance`
- Framework states: route loading, error boundaries, protected and public not-found screens

## Quality checks

```bash
npm run lint
npm run build
```

Backend contracts, mock assumptions, security boundaries, and required FastAPI endpoints are documented in [INTEGRATION.md](./INTEGRATION.md).
