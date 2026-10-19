// Due dates are calendar days ("YYYY-MM-DD"), so "today" has to be the user's
// local day — toISOString() would give the UTC day, which is wrong for part of
// every day in any timezone that isn't UTC.
export const toDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const todayStr = () => toDateStr(new Date());

// Local calendar day `n` days from today (negative for the past).
export const dayStrFromToday = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};
