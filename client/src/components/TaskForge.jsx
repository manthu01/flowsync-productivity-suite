import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import HoloCard from "./HoloCard";
import {
  CATEGORIES,
  CATEGORY_META,
  MOODS,
  MOOD_META,
  PRIORITY_CHART_COLORS,
  RECURRENCES,
  recurrenceLabel,
} from "../utils/categoryColors";
import { toDateStr } from "../utils/dates";

const PRIORITIES = ["Low", "Medium", "High"];
const HOLD_MS = 800;

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  category: "Work",
  mood: "Chill",
  recurrence: "None",
  due_date: "",
};

// Dates here are plain local YYYY-MM-DD strings, same shape the API stores.

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseDate = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const shiftDate = (str, days) => {
  const d = parseDate(str);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

const daysFromToday = (str) => Math.round((parseDate(str) - startOfToday()) / 86400000);

const formatDate = (str) => {
  const d = parseDate(str);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
};

const Toggles = ({ options, value, onChange, meta, label }) => (
  <div className="hud-toggles" role="radiogroup" aria-label={label}>
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        role="radio"
        aria-checked={opt === value}
        onClick={() => onChange(opt)}
        className={opt === value ? "on" : ""}
        style={{ "--c": meta[opt].hex }}
      >
        <span>
          <em>{meta[opt].glyph}</em>
          {opt}
        </span>
        <span className="hud-switch" />
      </button>
    ))}
  </div>
);

// Cockpit-style task composer. The controls on the left drive a live holo-card
// preview on the right; holding the forge button (or pressing Enter in the title)
// creates the task. `onCreate` should throw on failure so the form is kept.
// `titleRef` is optional: pass one to focus the card-name field from outside
// (the Tasks page's "N" shortcut and the dashboard's "forge your first card" link).
const TaskForge = ({ onCreate, titleRef: externalTitleRef }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const reduceMotion = useReducedMotion();
  const hudControls = useAnimationControls();
  const cardControls = useAnimationControls();

  const dialRef = useRef(null);
  const fillRef = useRef(null);
  const ownTitleRef = useRef(null);
  const titleRef = externalTitleRef ?? ownTitleRef;
  const dateRef = useRef(null);
  const holdRaf = useRef(0);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const priorityIndex = PRIORITIES.indexOf(form.priority);
  const priorityColor = PRIORITY_CHART_COLORS[form.priority];

  const stepPriority = (delta) =>
    setForm((f) => {
      const i = Math.max(0, Math.min(2, PRIORITIES.indexOf(f.priority) + delta));
      return { ...f, priority: PRIORITIES[i] };
    });

  // React's onWheel is passive, so the dial needs a native listener to stop the page scrolling.
  useEffect(() => {
    const dial = dialRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      stepPriority(e.deltaY > 0 ? -1 : 1);
    };
    dial.addEventListener("wheel", onWheel, { passive: false });
    return () => dial.removeEventListener("wheel", onWheel);
     
  }, []);

  useEffect(() => () => cancelAnimationFrame(holdRaf.current), []);

  const tMinus = form.due_date ? daysFromToday(form.due_date) : null;

  const dueLater = () =>
    update("due_date", form.due_date ? shiftDate(form.due_date, 1) : toDateStr(startOfToday()));

  const dueSooner = () => {
    if (!form.due_date) return;
    update("due_date", tMinus <= 0 ? "" : shiftDate(form.due_date, -1));
  };

  // Quick jumps count from today, so "+1Y" always means a year out, not a year past
  // whatever was already set.
  const jumpDue = ({ days = 0, months = 0, years = 0 }) => {
    const d = startOfToday();
    d.setFullYear(d.getFullYear() + years, d.getMonth() + months, d.getDate() + days);
    update("due_date", toDateStr(d));
  };

  const openDatePicker = () => {
    const input = dateRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  // Restarts the shake animation even when it's already applied from a previous miss.
  const flagMissingTitle = () => {
    const el = titleRef.current;
    if (!el) return;
    el.classList.remove("hud-err");
    void el.offsetWidth;
    el.classList.add("hud-err");
    el.focus();
  };

  const forge = async () => {
    if (submitting) return;
    if (!form.title.trim()) return flagMissingTitle();

    setSubmitting(true);
    try {
      await onCreate({
        title: form.title.trim(),
        description: form.description.trim(),
        status: "In Progress",
        priority: form.priority,
        category: form.category,
        mood: form.mood,
        recurrence: form.recurrence,
        due_date: form.due_date || null,
      });

      if (!reduceMotion) {
        cardControls.start({ rotateY: [0, 180, 360], scale: [1, 1.08, 1], transition: { duration: 0.9 } });
        hudControls.start({ x: [0, -3, 3, -3, 3, 0], transition: { duration: 0.45 } });
      }
      setForm(EMPTY_FORM);
    } catch {
      // The parent already showed an error toast; keep the form so nothing is lost.
    } finally {
      setSubmitting(false);
    }
  };

  const stopHold = () => {
    cancelAnimationFrame(holdRaf.current);
    holdRaf.current = 0;
    if (fillRef.current) fillRef.current.style.transform = "scaleX(0)";
  };

  const startHold = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return flagMissingTitle();
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / HOLD_MS);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      if (p >= 1) {
        stopHold();
        forge();
      } else {
        holdRaf.current = requestAnimationFrame(step);
      }
    };
    holdRaf.current = requestAnimationFrame(step);
  };

  return (
    <motion.div
      animate={hudControls}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="hud mb-8"
    >
      <span className="hud-corner hud-c1" />
      <span className="hud-corner hud-c2" />
      <span className="hud-corner hud-c3" />
      <span className="hud-corner hud-c4" />

      <div className="hud-top">
        <span>FLOWSYNC // CARD FORGE</span>
        <span className="hud-armed">ARMED</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-7 items-start mt-1">
        <div className="min-w-0">
          <div className="flex flex-col gap-1.5 mt-5">
            <label className="hud-label" htmlFor="forge-title">Card name</label>
            <input
              id="forge-title"
              ref={titleRef}
              className="hud-title"
              placeholder="What needs to get done?"
              value={form.title}
              onChange={(e) => {
                e.target.classList.remove("hud-err");
                update("title", e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  forge();
                }
              }}
              autoComplete="off"
            />
            <textarea
              aria-label="Flavor text"
              className="hud-brief"
              rows={1}
              placeholder="Flavor text: add a description (optional)"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <div className="hud-mod">
              <span className="hud-label">Rarity · priority</span>
              <button
                ref={dialRef}
                type="button"
                className="hud-dial"
                aria-label={`Priority ${form.priority}. Click to turn the dial.`}
                onClick={() => update("priority", PRIORITIES[(priorityIndex + 1) % 3])}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowRight") {
                    e.preventDefault();
                    stepPriority(1);
                  }
                  if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    stepPriority(-1);
                  }
                }}
                style={{ "--c": priorityColor, "--fill": `${((priorityIndex + 1) / 3) * 270}deg` }}
              >
                <span className="hud-needle" style={{ transform: `rotate(${[-90, 0, 90][priorityIndex]}deg)` }} />
              </button>
              <span className="hud-value text-center" style={{ "--c": priorityColor }}>
                {form.priority}
              </span>
            </div>

            <div className="hud-mod">
              <span className="hud-label">Element · category</span>
              <Toggles
                label="Category"
                options={CATEGORIES}
                value={form.category}
                onChange={(v) => update("category", v)}
                meta={CATEGORY_META}
              />
            </div>

            <div className="hud-mod">
              <span className="hud-label">Mood</span>
              <Toggles label="Mood" options={MOODS} value={form.mood} onChange={(v) => update("mood", v)} meta={MOOD_META} />
            </div>

            <div className="hud-mod">
              <span className="hud-label">Repeat</span>
              <div className="hud-seg" role="radiogroup" aria-label="Repeat">
                {RECURRENCES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={form.recurrence === r}
                    className={form.recurrence === r ? "on" : ""}
                    onClick={() => update("recurrence", r)}
                  >
                    {recurrenceLabel(r)}
                  </button>
                ))}
              </div>

              <span className="hud-label mt-1.5">T-minus · due</span>
              <div className="hud-tminus">
                <button type="button" onClick={dueSooner} aria-label="One day sooner">−</button>
                <output
                  className={`${tMinus !== null && tMinus < 0 ? "late" : ""} ${tMinus !== null && Math.abs(tMinus) > 99 ? "long" : ""}`}
                >
                  {tMinus === null ? "--" : tMinus < 0 ? `T+${String(-tMinus).padStart(2, "0")}` : `T-${String(tMinus).padStart(2, "0")}`}
                </output>
                <button type="button" onClick={dueLater} aria-label="One day later">+</button>
              </div>
              <div className="hud-jumps">
                <button type="button" onClick={() => jumpDue({ days: 7 })}>+1W</button>
                <button type="button" onClick={() => jumpDue({ months: 1 })}>+1M</button>
                <button type="button" onClick={() => jumpDue({ years: 1 })}>+1Y</button>
                <button type="button" className={form.due_date ? "" : "on"} onClick={() => update("due_date", "")}>
                  None
                </button>
              </div>
              <div className="hud-custom">
                <button type="button" onClick={openDatePicker}>Custom date</button>
                <span>{form.due_date ? formatDate(form.due_date) : "No deadline"}</span>
                <input
                  ref={dateRef}
                  type="date"
                  aria-label="Due date"
                  tabIndex={-1}
                  className="hud-date-hidden"
                  min={toDateStr(startOfToday())}
                  value={form.due_date}
                  onChange={(e) => update("due_date", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pt-2 lg:pt-6 min-w-0">
          <motion.div animate={cardControls} style={{ transformPerspective: 1000 }} className="w-full flex justify-center">
            <HoloCard
              className="holo-preview"
              title={form.title.trim()}
              description={form.description.trim()}
              priority={form.priority}
              category={form.category}
              mood={form.mood}
              recurrence={form.recurrence}
              footer={
                <>
                  <span>{form.due_date ? `Expires ${formatDate(form.due_date)}` : "Never expires"}</span>
                  <span>NEW</span>
                </>
              }
            />
          </motion.div>

          <button
            type="button"
            className="hud-hold"
            disabled={submitting}
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
                e.preventDefault();
                forge();
              }
            }}
          >
            <span ref={fillRef} className="hud-hold-fill" />
            <span className="relative">{submitting ? "Forging…" : "Hold to forge"}</span>
          </button>
          <span className="hud-hint">or press ENTER in the card name</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskForge;
