import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSliders } from "react-icons/fi";
import PillSelector from "./PillSelector";

// The "Filters" button on the Tasks toolbar: priority / category / mood pickers
// tucked into a popover so the toolbar stays a single slim row. `groups` is a list
// of { key, label, options }, `values` maps each key to its current value ("All"
// means unfiltered).
const TaskFilterMenu = ({ groups, values, onChange, onClear }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const activeCount = groups.filter((g) => values[g.key] !== "All").length;

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-cursor-hover
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
          activeCount > 0 || open
            ? "border-cyan-400/50 text-fg bg-cyan-400/10"
            : "border-line/10 text-muted hover:text-fg bg-line/[0.04]"
        }`}
      >
        <FiSliders size={15} />
        Filters
        {activeCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-cyan-400 text-black text-xs font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-30 w-[min(92vw,420px)] p-5 rounded-2xl bg-panel border border-line/10 shadow-2xl flex flex-col gap-4"
          >
            {groups.map((g) => (
              <div key={g.key}>
                <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2">{g.label}</p>
                <PillSelector
                  layoutId={`filter-${g.key}`}
                  options={g.options}
                  value={values[g.key]}
                  onChange={(v) => onChange(g.key, v)}
                />
              </div>
            ))}

            <div className="flex justify-between items-center pt-1 border-t border-line/10">
              <button
                type="button"
                data-cursor-hover
                onClick={onClear}
                disabled={activeCount === 0}
                className="pt-3 text-sm text-muted hover:text-fg disabled:opacity-40 disabled:hover:text-muted transition-colors"
              >
                Clear filters
              </button>
              <button
                type="button"
                data-cursor-hover
                onClick={() => setOpen(false)}
                className="pt-3 text-sm font-semibold text-cyan-400 hover:underline"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskFilterMenu;
