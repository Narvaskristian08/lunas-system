export const topicGuides: Record<string, string[]> = {
  "getting-started": [
    "Understand the command-center navigation for your assigned role",
    "Read status badges, priorities, and activity timestamps",
    "Find the records and actions available to your account",
  ],
  "account-login": [
    "Recover access without exposing whether an account exists",
    "Complete account verification and resolve expired sessions",
    "Know when an administrator must restore account access",
  ],
  "reports-incidents": [
    "Review report evidence and AI-assisted hazard suggestions",
    "Validate, reject, or request more information",
    "Follow an incident from intake through closure",
  ],
  "work-orders": [
    "Understand assignment and acceptance steps",
    "Post progress updates and field notes",
    "Submit complete repair evidence for review",
  ],
  sla: [
    "Read response and resolution countdowns",
    "Prioritize approaching and overdue deadlines",
    "Understand automated warnings and escalation",
  ],
  repairs: [
    "Check required completion photos and site notes",
    "Approve, reject, or request rework",
    "Record a clear, auditable verification decision",
  ],
  notifications: [
    "Find unread operational alerts",
    "Open the record connected to a notification",
    "Manage notification and account-alert preferences",
  ],
  "profile-security": [
    "Update your permitted contact information",
    "Change your password and protect active sessions",
    "Report unexpected account activity",
  ],
  troubleshooting: [
    "Keep form entries safe during a connection loss",
    "Resolve attachment, browser, and map-loading issues",
    "Collect the details support needs to investigate",
  ],
};

export const frequentlyAskedQuestions = [
  {
    question: "Why can’t I see a page or action that another user can access?",
    answer:
      "LUNAS navigation and actions follow your assigned role and permissions. If your duties have changed, ask your organization’s LUNAS administrator to review your access instead of sharing another user’s account.",
  },
  {
    question: "Will I lose a report or support request if my connection drops?",
    answer:
      "Information already entered on the current form remains in the browser while the page stays open. Reconnect before submitting, and avoid refreshing or closing the tab until the request is accepted.",
  },
  {
    question: "What should I include when asking for technical support?",
    answer:
      "Describe what you expected, what happened, the approximate time, and the related LUNAS record ID. A screenshot may help, but remove unrelated personal or restricted information before attaching it.",
  },
  {
    question: "Does a support ticket count as an infrastructure incident report?",
    answer:
      "No. Support tickets are for help with the LUNAS platform. Use the authorized Reports and Incidents workflow for potholes, leaks, electrical hazards, drainage issues, or other infrastructure concerns.",
  },
  {
    question: "Why is live information marked as delayed or read-only?",
    answer:
      "The platform may be offline or a specific service may be under maintenance. Check the status notice, keep any unsaved entries open, and retry when LUNAS confirms that live updates are available.",
  },
] as const;

export const supportTopicOptions = [
  { value: "", label: "Select a support topic" },
  { value: "account-access", label: "Account access or sign-in" },
  { value: "reports-incidents", label: "Reports or incidents" },
  { value: "work-orders", label: "Work orders or assignments" },
  { value: "sla", label: "SLA monitoring" },
  { value: "repair-verification", label: "Repair verification" },
  { value: "notifications", label: "Notifications" },
  { value: "profile-security", label: "Profile or security" },
  { value: "technical", label: "Technical problem" },
  { value: "other", label: "Other platform question" },
];

export const urgencyOptions = [
  { value: "normal", label: "Normal — general assistance" },
  { value: "high", label: "High — work is significantly affected" },
  { value: "blocked", label: "Blocked — unable to perform an assigned task" },
  { value: "low", label: "Low — question or feedback" },
];
