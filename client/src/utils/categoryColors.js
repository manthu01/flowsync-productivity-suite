export const CATEGORIES = ["Work", "Personal", "Urgent", "Other"];

const CATEGORY_STYLES = {
  Work: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Personal: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Urgent: "bg-red-500/15 text-red-300 border-red-500/30",
  Other: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};

export const categoryStyle = (category) =>
  CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;

const PRIORITY_STYLES = {
  High: "bg-red-500/15 text-red-300 border-red-500/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export const priorityStyle = (priority) =>
  PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium;

export const PRIORITY_CHART_COLORS = {
  High: "#f87171",
  Medium: "#fbbf24",
  Low: "#34d399",
};

export const STATUS_CHART_COLORS = {
  Completed: "#22d3ee",
  "In Progress": "#6366f1",
};

// Holo-card metadata: each category is a card "element" (frame color + art glyph),
// each mood paints the card art, and priority sets the card's rarity.
export const CATEGORY_META = {
  Work: { hex: "#60a5fa", glyph: "◆" },
  Personal: { hex: "#34d399", glyph: "●" },
  Urgent: { hex: "#f87171", glyph: "▲" },
  Other: { hex: "#a1a1aa", glyph: "■" },
};

export const MOODS = ["Grind", "Chill", "Creative", "Admin"];

export const MOOD_META = {
  Grind: { hex: "#fb923c", glyph: "▰" },
  Chill: { hex: "#38bdf8", glyph: "≈" },
  Creative: { hex: "#e879f9", glyph: "✦" },
  Admin: { hex: "#cbd5e1", glyph: "≡" },
};

export const RARITY = { Low: "Common", Medium: "Rare", High: "Legendary" };

// "None" is what the API stores for a one-time task; the UI calls it "Off".
export const RECURRENCES = ["None", "Daily", "Weekly", "Monthly"];
export const recurrenceLabel = (recurrence) =>
  !recurrence || recurrence === "None" ? "Off" : recurrence;
