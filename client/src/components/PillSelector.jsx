import { motion } from "framer-motion";

// A segmented pill control — swaps a native <select> for a set of clickable, animated
// pills with a sliding active-state background (same layoutId-spring pattern as the
// navbar's active-tab indicator).
const PillSelector = ({ options, value, onChange, layoutId }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          data-cursor-hover
          onClick={() => onChange(opt.value)}
          className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
            active ? "text-black" : "text-muted hover:text-fg bg-line/[0.04] border border-line/10"
          }`}
        >
          {active && (
            <motion.span
              layoutId={layoutId}
              className={`absolute inset-0 rounded-xl -z-10 ${opt.activeClass || "bg-cyan-500"}`}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          {opt.icon}
          {opt.label}
        </button>
      );
    })}
  </div>
);

export default PillSelector;
