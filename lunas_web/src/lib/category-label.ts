/** Display name for API category codes; codes remain unchanged. */
export function categoryLabel(value: string | undefined, fallback = "Uncategorized") {
  if (!value) return fallback;
  if (["road", "road damage", "roads and sidewalks"].includes(value.toLowerCase())) return "Road Damage";
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}
