import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms and Conditions" };

const sections: LegalSection[] = [
  {
    id: "authorized-use",
    title: "Authorized use",
    paragraphs: [
      "Draft outline: define the personnel, organizations, official duties, and approved environments for which access to the LUNAS command center may be granted.",
      "The final terms should explain that access is permission-based and limited to legitimate public-service responsibilities.",
    ],
  },
  {
    id: "account-responsibility",
    title: "Account responsibility",
    paragraphs: [
      "Draft outline: describe responsibilities for safeguarding credentials, using assigned accounts, maintaining accurate contact information, signing out of shared devices, and promptly reporting suspected compromise.",
    ],
    bullets: [
      "Do not share passwords, verification codes, or authenticated sessions.",
      "Use only the role and organization assigned through the approved administrative process.",
      "Report unexpected account activity through the designated security channel.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: [
      "Draft outline: identify permitted operational activities such as report validation, incident assignment, SLA monitoring, work-order management, evidence review, analytics, and authorized administration.",
      "The approved terms should connect acceptable use to applicable government policies and records-management obligations.",
    ],
  },
  {
    id: "incident-evidence",
    title: "Incident and evidence submissions",
    paragraphs: [
      "Draft outline: set expectations for submitting relevant, lawful, and appropriately handled descriptions, locations, images, documents, repair evidence, and verification notes through LUNAS workflows.",
      "Technical support requests should not be presented as infrastructure incident reports or emergency dispatch requests.",
    ],
  },
  {
    id: "accuracy",
    title: "Accuracy of information",
    paragraphs: [
      "Draft outline: explain the user’s duty to make reasonable checks, correct known errors, distinguish observations from conclusions, and follow required review processes for AI-assisted suggestions.",
    ],
    reviewNote: "Define the approved standard for official records and the correction process with operational owners.",
  },
  {
    id: "prohibited-actions",
    title: "Prohibited actions",
    paragraphs: [
      "Draft outline: list activities prohibited by law and policy without disclosing defensive controls or internal authorization rules.",
    ],
    bullets: [
      "Attempting to access records, functions, or accounts beyond assigned permission.",
      "Uploading malicious, deceptive, unlawful, or unrelated material.",
      "Circumventing safeguards, interfering with service, or extracting data without authority.",
      "Using LUNAS information for unauthorized personal, commercial, or discriminatory purposes.",
    ],
  },
  {
    id: "availability",
    title: "System availability and maintenance",
    paragraphs: [
      "Draft outline: describe planned maintenance, service-specific interruptions, read-only operation, emergency changes, connectivity limits, and the official channels for status information.",
      "Do not insert service commitments, restoration estimates, or warranties until they are approved and supported by operating agreements.",
    ],
  },
  {
    id: "security",
    title: "Security monitoring",
    paragraphs: [
      "Draft outline: explain authorized logging, monitoring, investigation, session controls, and protective action in proportion to system security, accountability, and legal requirements.",
      "The final wording should identify the notices and approvals required for personnel monitoring.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property and records",
    paragraphs: [
      "Draft outline: distinguish government records, user-submitted evidence, software and documentation rights, third-party map or service content, and permissions for reuse or publication.",
    ],
    reviewNote: "Obtain legal confirmation of ownership, licensing, public-record, and reuse rules for each content category.",
  },
  {
    id: "liability",
    title: "Limitation of liability",
    paragraphs: [
      "Draft outline only: authorized counsel must supply any legally permitted limitation, disclaimer, allocation of responsibility, or emergency-services statement. No limitation of liability is asserted by this placeholder.",
    ],
    reviewNote: "This section requires complete replacement by authorized legal counsel before publication.",
  },
  {
    id: "suspension",
    title: "Account suspension or termination",
    paragraphs: [
      "Draft outline: identify who may suspend, restrict, revoke, restore, or archive an account; the events that may trigger action; the notice and review process; and the treatment of official records after access ends.",
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    paragraphs: [
      "Draft outline: define the approval, versioning, publication, effective-date, and user-notice process for future changes. Material changes should be distinguished from editorial corrections where required.",
    ],
  },
  {
    id: "contact-information",
    title: "Contact information",
    paragraphs: [
      "Contact placeholder: insert the approved office name, postal address, email address, telephone number, service hours, and escalation route for questions about these terms.",
      "Authorized users may use Help and Support for technical assistance after signing in, but that workflow is not a substitute for formal legal notice.",
    ],
    reviewNote: "Approved legal and administrative contact details are required before publication.",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      description="A structured draft for defining authorized use, account responsibility, evidence handling, security, and service conditions for LUNAS."
      lastUpdated="August 1, 2026 (draft)"
      documentLabel="LUNAS-LEGAL-TERMS-DRAFT-01"
      sections={sections}
    />
  );
}
