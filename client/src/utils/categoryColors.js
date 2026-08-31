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
