import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "../utils/categoryColors";

const fieldClass =
  "p-3 rounded-xl bg-white/[0.04] border border-white/10 outline-none focus:border-cyan-400/50 transition-colors text-sm";

const TaskModal = ({ task, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState(task);

  useEffect(() => {
    setForm(task);
  }, [task]);

  if (!task) return null;

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-3xl p-7 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Task Details</h2>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <input
                className={fieldClass}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Task title"
              />

              <textarea
                className={fieldClass}
                rows={3}
                value={form.description || ""}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Description"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500">Status</label>
                  <select
                    className={fieldClass}
                    value={form.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500">Priority</label>
                  <select
                    className={fieldClass}
                    value={form.priority}
                    onChange={(e) => update("priority", e.target.value)}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500">Category</label>
                  <select
                    className={fieldClass}
                    value={form.category || "Other"}
                    onChange={(e) => update("category", e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-500">Due date</label>
                  <input
                    type="date"
                    className={fieldClass}
                    value={form.due_date ? form.due_date.slice(0, 10) : ""}
                    onChange={(e) => update("due_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-7">
              <button
                onClick={() => onSave(form)}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 transition-colors py-2.5 rounded-xl font-semibold text-black"
              >
                Save Changes
              </button>
              <button
                onClick={() => onDelete(form.id)}
                className="px-5 py-2.5 rounded-xl font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;
