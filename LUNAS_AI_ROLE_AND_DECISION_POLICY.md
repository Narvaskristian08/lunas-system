# LUNAS AI Role and Decision Policy

## Purpose

This policy defines who may see or request AI-assisted evidence analysis in LUNAS, how the output may be used, and which decisions must remain human decisions.

AI is an evidence-support feature. It is not an authority for public-service, financial, staffing, enforcement, or closure decisions.

## Current Delivery Status

The AI service is not currently integrated into the live LUNAS workflow. Live demonstrations must describe validation, routing, repair progress, verification, and closure as human-controlled processes.

Until the service has been deployed, security-reviewed, and approved:

- The backend keeps AI analysis disabled.
- Clients show AI as unavailable rather than fabricate detections, confidence scores, or recommendations.
- AI output is not required to submit, validate, repair, verify, or close a report.

The initial model is intended for road-damage evidence only. It must not be presented as a classifier for drainage, streetlights, water, gas, utility equipment, or other infrastructure categories unless a separately tested model supports them.

## Non-Negotiable Rules

1. AI never independently creates, rejects, duplicates, validates, routes, assigns, prioritizes, budgets, verifies, or closes an incident.
2. A human with the existing role permission makes every lifecycle decision.
3. AI confidence is a model signal—not a safety score, legal finding, or service-level priority.
4. The backend, not a mobile or web client, sends authorized evidence to the AI service. API keys and private-storage keys must never be exposed to clients.
5. AI output must be auditable. Record the model/version, request time, analysis status, and human decision separately.
6. Unavailable, failed, or inconclusive AI results require normal manual review. They must never become automatic approval or rejection.
7. Privacy controls remain mandatory. Do not claim face or license-plate redaction until a real, approved privacy model is deployed and verified.

## Role Policy

| Role | AI visibility and allowed use | Prohibited use |
| --- | --- | --- |
| Citizen | May receive an optional capture-quality prompt or a high-level notice that road-damage evidence may need review. May see only AI information authorized for their own report. | Cannot see internal thresholds, raw model payloads, other reporters’ evidence, official notes, or use AI to obtain automatic approval. |
| Barangay Official | May review advisory road-damage labels, confidence, annotations, and limitations for reports within the official’s barangay scope. | Cannot treat detection as validation, automatically set priority, or use AI outside the permitted scope. |
| City Engineer | May use the same advisory report analysis city-wide. During formal completion review, may view authorized before/after comparison results and recommendations. | Cannot let AI approve completion, release funds, close an incident, or replace engineering judgment. |
| Repair Personnel | May view the reported category and evidence/advisory context needed for their assigned work order. May submit field evidence for later review. | Cannot use AI to self-verify work, change priority or budget, assign themselves work, or access unrelated evidence. |
| Utility Provider | May use advisory analysis only for incidents routed to the provider’s organization and categories supported by an approved model. | Must not receive road-damage results as a substitute for utility-specific analysis or access reports outside the organization. |
| Administrator | May view service health, model/version, enabled status, aggregate error rates, and audit metadata. May enable a model only after the required approval process. | Cannot use AI results to bypass role checks, approve government accounts, or expose private evidence through operational dashboards. |
| Completion Reviewer | An authorized official may request or view advisory evidence comparison for an in-scope completion package. | Cannot approve, request rework, or reject solely because of an AI recommendation. |

## Intended Evidence Flow

1. A citizen submits supported road evidence with the required privacy acknowledgement.
2. The backend validates and normalizes the evidence, then optionally sends it server-to-server to the AI service.
3. The service returns an advisory detection or an honest unavailable/inconclusive result.
4. An authorized official reviews the evidence, location, history, and advisory output before making human validation, rejection, duplicate, priority, and routing decisions.
5. Repair personnel update controlled work-order milestones and submit field evidence. AI does not change those milestones.
6. During formal completion, an authorized reviewer may use before/after comparison and optional AI re-evaluation as advisory evidence. The reviewer records the final human decision.

## Output Levels

| Output level | Audience | Example |
| --- | --- | --- |
| Citizen-safe | Reporting citizen | “Evidence received for official review” or “A clearer photo may help review.” |
| Official advisory | In-scope barangay official, city engineer, authorized completion reviewer | Road-damage label, confidence, annotation, limitations, and evidence-comparison recommendation. |
| Operational metadata | Administrator and audited backend operations | Model/version, invocation status, latency, error category, and aggregate quality metrics. |

## AI Enablement Checklist

Enable a model only when all of the following are complete:

- Supported categories, data limitations, and confidence thresholds are documented.
- The model has been evaluated using representative, authorized local evidence.
- The AI service is authenticated server-to-server and exposes no secrets or private object keys.
- Failed, timed-out, and inconclusive results have been tested and display an honest manual-review state.
- Backend role, jurisdiction, organization, ownership, and evidence-access checks remain enforced.
- Audit logging and retention requirements are approved.
- An authorized LGU owner has approved production use.

## Demonstration Statement

Use this statement while AI remains unintegrated:

> AI is under development and is not part of the live demonstration. The current LUNAS workflow uses human validation, routing, repair progress, and verification. When enabled, AI will provide road-evidence and before/after comparison advice only; it will not make government decisions.

