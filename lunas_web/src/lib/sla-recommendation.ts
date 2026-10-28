export interface SlaRecommendation {
  source: "ai_model";
  model: string;
  advisoryOnly: true;
  durationHours: number;
  explanation: string;
  assumptions: string[];
  generatedAt: string;
  referenceDeadline: string;
  referenceBasis: string;
  priority: string;
  policyReferenceHours: number;
}
