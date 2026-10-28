# Free-tier AI SLA advice: deployer handoff

LUNAS uses Google's pretrained `gemini-3.5-flash-lite` via its hosted GenerateContent API. No model training, local model download or GPU server is required. The integration has no paid provider/model fallback. Recommendations are optional planning estimates; they are not validated repair-duration predictions or government SLA policy.

## Keep usage free

Google currently lists free input/output usage for this model, subject to project quotas and availability: [pricing](https://ai.google.dev/gemini-api/docs/pricing). **Use a project with Cloud Billing disabled.** Code cannot determine whether a supplied key belongs to a free or paid project, and a budget alert is not a spending cap. Do not enable paid billing to bypass quota errors. Free-tier availability/limits and model lifetime can change; verify the project's actual AI Studio plan before deploying. Quota errors/timeouts leave manual deadline entry available and do not trigger a retry or paid fallback.

1. The institution/team owns the Google project. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/api-keys), restricted to the Gemini API. Confirm eligibility, available quota and that the project is not billed.
2. Give the deployer access to the team's password/secret manager entry, or have the deployer create a dedicated key in the team-owned project. Do not share a Google account password. Do not put the key in chat, Git, screenshots, account-directory files, frontend code or `NEXT_PUBLIC_*` variables. See [Google key guidance](https://ai.google.dev/gemini-api/docs/api-key).
3. Set only these **backend** secrets/environment values:

   ```dotenv
   SLA_AI_ENABLED=true
   SLA_AI_FREE_TIER_CONFIRMED=true
   GEMINI_API_KEY=<team-project-key-from-secret-manager>
   SLA_AI_TIMEOUT_MS=45000
   ```

   `SLA_AI_FREE_TIER_CONFIRMED` is an operator acknowledgement, not automatic billing verification. Leave both flags false until the project and terms are reviewed. The Compose mapping passes these variables to the backend only. Use the existing deployment secret mechanism for AWS/other hosts; copy the variable names and inject the key securely, not into a deployment artifact.
4. Rebuild/restart the backend and web through the normal local/deployment process. For local Docker:

   ```powershell
   docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml up -d --build backend web
   ```

   This document is not authorization to deploy to production. No key is included in this repository.

## What the agency sees

After a report is routed, select an agency priority during Ready for Work. Click **Generate AI suggestion** to request a duration, explanation, assumptions and planning date. The planning date is calculated from the model's duration assuming work starts at generation time; unknown external procurement time is excluded. Changing priority clears the displayed estimate. The agency can disregard the estimate and enter a different deadline. Generating advice never writes an incident, priority, deadline, workflow transition, or notification. Official saving uses the existing agency action and locking rules. Once work starts, new recommendations are disabled. The configured priority hours remain separately labeled as a fixed rule, never as AI output.

Only canonical category, selected priority, configured reference hours and limited existing image-analysis metadata are sent. No citizen identity, coordinates, description, field notes, photograph or evidence URL is sent. This deliberately limits context and usefulness; the model cannot know measurements, crew capacity or actual procurement duration. Free-tier prompts/responses may be used to improve Google's products under its current terms; review institutional requirements before enabling.

The backend enforces agency/organization scope before inference, validates priority and stage, caps output size/duration, rejects malformed/refused/incomplete responses, sanitizes provider errors and limits requests to five per authenticated agency account per minute (process-local limiter; multiple replicas do not share a quota). Manual deadline entry remains independent of AI availability. Provider costs/quotas apply to the project across every key and application using it.

## Verification and honest limits

From `lunas_backend`:

```powershell
node node_modules/jest/bin/jest.js src/services/slaRecommendationService.test.js src/controllers/slaRecommendationController.test.js --runInBand --coverage=false
```

Tests use **mocked provider responses**. They check scope, no-write behavior, disabled/no-key configuration, output validation, privacy-minimized request shape, malformed/refused output, timeout/provider failures and quota exhaustion without paid fallback. They do not prove model quality, free-tier eligibility or deployment connectivity.

For live acceptance, use a synthetic same-organization report in Ready for Work/Pending Procurement and the real team-owned free-tier key. Confirm actual provider output and that requesting advice leaves saved priority, deadline/status/history unchanged. Verify manual entry still works when the feature is disabled or quota is unavailable. Never manufacture an AI recommendation to demonstrate success. No real-key request or quality evaluation has been certified in this implementation session.
