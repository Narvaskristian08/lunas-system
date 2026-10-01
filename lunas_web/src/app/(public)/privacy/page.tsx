import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections: LegalSection[] = [
  {
    id: "information-collected",
    title: "Information collected",
    paragraphs: [
      "Draft outline: the approved policy should identify the categories of personal, operational, device, and technical information LUNAS receives when authorized personnel use the web command center.",
    ],
    bullets: [
      "Account and organizational identifiers required to establish authorized access.",
      "Operational entries, audit events, and technical diagnostics produced through use of the platform.",
      "Information contained in incident, work-order, repair, and verification records when applicable.",
    ],
    reviewNote: "Confirm the complete data inventory and lawful classification with the data protection officer and system owner.",
  },
  {
    id: "purpose-of-processing",
    title: "Purpose of processing",
    paragraphs: [
      "Draft outline: describe the approved public-service, operational, safety, accountability, and system-security purposes for which each category of information is processed. The final text should identify the applicable legal bases and responsible government entities.",
    ],
    reviewNote: "Insert the legally approved purposes and bases; do not publish this outline as the final statement.",
  },
  {
    id: "account-information",
    title: "Account information",
    paragraphs: [
      "Draft outline: explain how names, official contact details, personnel identifiers, assigned organizations, roles, verification status, and sign-in activity support identity verification and permission-based access.",
      "The approved version should also distinguish user-editable profile information from administrative account records.",
    ],
  },
  {
    id: "incident-evidence",
    title: "Incident evidence",
    paragraphs: [
      "Draft outline: explain that authorized workflows may include descriptions, photographs, documents, timestamps, repair evidence, verification decisions, and notes connected to infrastructure reports and incidents.",
      "The final policy should state who may submit, review, correct, disclose, and retain each evidence type.",
    ],
  },
  {
    id: "location-information",
    title: "Location information",
    paragraphs: [
      "Draft outline: describe when precise or approximate location data is collected for incident mapping, assignment, navigation, field evidence, and audit purposes, including whether collection occurs in the background on supported devices.",
    ],
    reviewNote: "Confirm web and mobile location behavior separately before approval.",
  },
  {
    id: "image-privacy",
    title: "Image privacy and redaction",
    paragraphs: [
      "Automatic face blurring, license-plate masking, and visual redaction are excluded from the current LUNAS scope. Metadata removal does not anonymize image content. Reporters should avoid submitting images that include people, vehicle identifiers, or unrelated private details.",
      "Incident and repair evidence is available to authorized users through the role-scoped workflow. Confirm retention periods and approved handling procedures with the system owner before production use.",
    ],
  },
  {
    id: "data-storage",
    title: "Data storage and transfers",
    paragraphs: [
      "Draft outline: identify approved hosting regions, database and object-storage arrangements, encryption controls, backups, disaster recovery, and any authorized cross-border or inter-agency transfers.",
    ],
    reviewNote: "Replace this placeholder only after cloud architecture, contracts, and data-location commitments are verified.",
  },
  {
    id: "access-controls",
    title: "Access controls and disclosure",
    paragraphs: [
      "Draft outline: describe role-based access, least-privilege review, authentication, audit logging, administrative oversight, and the circumstances in which authorized agencies or service providers may receive information.",
      "The final policy should make clear that a visible interface control does not replace backend authorization and disclosure controls.",
    ],
  },
  {
    id: "retention",
    title: "Retention and disposal",
    paragraphs: [
      "Draft outline: provide the approved retention schedule for account records, incident evidence, work orders, notifications, support requests, security events, audit logs, backups, and legally preserved records.",
    ],
    reviewNote: "Insert record-specific periods and approved secure-disposal procedures; no retention period is asserted by this draft.",
  },
  {
    id: "user-rights",
    title: "User rights and requests",
    paragraphs: [
      "Draft outline: state the rights available under applicable law and the verified process for access, correction, objection, restriction, deletion where applicable, and complaints. The final text should explain identity verification and lawful exceptions.",
    ],
  },
  {
    id: "security",
    title: "Security and incident response",
    paragraphs: [
      "Draft outline: summarize approved administrative, technical, and physical safeguards without publishing sensitive security details. Include the official process for reporting a suspected privacy or account-security incident.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    paragraphs: [
      "Draft outline: identify the approved roles and privacy implications of external services used for maps, notifications, cloud storage, authentication support, analytics, or other integrations. Link to applicable notices only after vendor and contract review.",
    ],
  },
  {
    id: "contact-information",
    title: "Contact information",
    paragraphs: [
      "Contact placeholder: insert the approved name, office, postal address, email address, telephone number, service hours, and escalation route for the designated privacy or data protection contact.",
      "For technical help with the LUNAS interface, authorized users may use the Help and Support page after signing in. Technical support does not replace the formal privacy-request channel.",
    ],
    reviewNote: "Approved contact details are required before publication.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="A structured draft for explaining how LUNAS handles personal information, infrastructure evidence, location data, and operational records."
      lastUpdated="August 1, 2026 (draft)"
      documentLabel="LUNAS-LEGAL-PRIVACY-DRAFT-01"
      sections={sections}
    />
  );
}
