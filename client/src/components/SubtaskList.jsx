import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaPlus, FaTrash } from "react-icons/fa";

const AnimatedCheckbox = ({ checked, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.85 }}
    className="relative shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
    aria-label={checked ? "Mark incomplete" : "Mark complete"}
  >
    <motion.span
      className="absolute inset-0 rounded-full border-2"
      animate={{
        borderColor: checked ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.25)",
        backgroundColor: checked ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.02)",
        scale: checked ? [1, 1.25, 1] : 1,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
    <motion.svg
      viewBox="0 0 24 24"
      className="relative w-3.5 h-3.5"
      initial={false}
      animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.5 }}
      transition={{ duration: 0.2 }}
    >
      <motion.path
        d="M4 12.5L9.5 18L20 6"
        fill="none"
        stroke="#34d399"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: checked ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: checked ? 0.05 : 0 }}
      />
    </motion.svg>
  </motion.button>
);

const SubtaskList = ({ subtasks, onAdd, onToggle, onDelete }) => {
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.is_completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const handleAdd = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(title);
      setNewTitle("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted">Subtasks</h3>
        {total > 0 && (
          <span className="text-xs text-subtle">
            {completed}/{total} complete
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="h-2 w-full rounded-full bg-line/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                percent === 100
                  ? "linear-gradient(90deg, #34d399, #22d3ee)"
                  : "linear-gradient(90deg, #22d3ee, #818cf8)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {subtasks.map((subtask) => (
            <motion.div
              key={subtask.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="group flex items-center gap-3 py-1.5"
            >
              <AnimatedCheckbox
                checked={subtask.is_completed}
                onClick={() => onToggle(subtask)}
              />
              <span
                className={`flex-1 text-sm transition-colors ${
                  subtask.is_completed ? "text-subtle line-through" : "text-muted"
                }`}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => onDelete(subtask)}
                className="opacity-0 group-hover:opacity-100 text-subtle hover:text-red-400 transition-all"
                aria-label="Delete subtask"
              >
                <FaTrash size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {total === 0 && (
          <p className="text-xs text-subtle italic py-1">
            Break this task down — add your first subtask below.
          </p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="flex-1 px-3 py-2 rounded-lg bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors text-sm"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          type="submit"
          disabled={submitting || !newTitle.trim()}
          className="px-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-colors disabled:opacity-40"
        >
          <FaPlus size={12} />
        </motion.button>
      </form>
    </div>
  );
};

export default SubtaskList;
