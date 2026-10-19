export const CATEGORIES = ["Work", "Personal", "Urgent", "Other"];

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
