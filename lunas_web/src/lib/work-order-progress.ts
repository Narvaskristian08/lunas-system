/**
 * The progress scale for one repair work order. It is deliberately separate
 * from project-development milestone percentages.
 */
export type RepairProgressStage = "assigned" | "site_preparation" | "main_repair" | "finishing" | "ready_for_completion";

export const repairProgressStages: Record<0 | 25 | 50 | 75 | 100, RepairProgressStage> = {
  0: "assigned",
  25: "site_preparation",
  50: "main_repair",
  75: "finishing",
  100: "ready_for_completion",
};
