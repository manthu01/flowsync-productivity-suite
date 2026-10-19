import { motion } from "framer-motion";
import { FiUsers } from "react-icons/fi";
import HoloCard from "./HoloCard";

const formatDue = (str) =>
  new Date(`${str.slice(0, 10)}T00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// One task in the grid, shown as its holo card plus the live bits a card in your
// collection needs: share badge, subtask progress, and complete/delete actions.
// `dueSoon` is "today" or "tomorrow" for an open task due within a day, else null.
const TaskCard = ({ task, overdue, dueSoon, onOpen, onToggleComplete, onDelete }) => {
  const done = task.status === "Completed";
  const subtaskTotal = task.subtask_count || 0;
  const subtaskDone = task.subtask_completed_count || 0;
  const subtaskPercent = subtaskTotal === 0 ? 0 : Math.round((subtaskDone / subtaskTotal) * 100);

  const dueLabel = !task.due_date
    ? "Never expires"
    : dueSoon
      ? `Due ${dueSoon}`
      : `${overdue ? "Overdue · " : "Expires "}${formatDue(task.due_date)}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, rotate: 6 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", damping: 20, stiffness: 220 }}
      onClick={() => onOpen(task)}
      data-cursor-hover
      className="cursor-pointer flex justify-center"
    >
      <HoloCard
        className={`holo-grid ${done ? "holo-done" : ""} ${dueSoon ? "holo-due-soon" : ""}`}
        title={task.title}
        description={task.description}
        priority={task.priority}
        category={task.category || "Other"}
        mood={task.mood || "Chill"}
        recurrence={task.recurrence}
        footer={
          <>
            <span className={overdue ? "holo-overdue" : ""}>{dueLabel}</span>
            <span>#{String(task.id).padStart(4, "0")}</span>
          </>
        }
      >
        {done && <span className="holo-stamp">Completed</span>}

        {task.is_owner === false ? (
          <span className="holo-chip" title={`Shared by ${task.owner_name}`}>
            <FiUsers size={10} /> Shared by {task.owner_name}
          </span>
        ) : (
          task.collaborator_count > 0 && (
            <span className="holo-chip" title="Shared with others">
              <FiUsers size={10} /> Shared with {task.collaborator_count}
            </span>
          )
        )}

        {subtaskTotal > 0 && (
          <div className="holo-progress">
            <div className="holo-progress-label">
              <span>Subtasks</span>
              <span>
                {subtaskDone}/{subtaskTotal}
              </span>
            </div>
            <div className="holo-progress-track">
              <motion.div
                className="holo-progress-bar"
                initial={{ width: 0 }}
                animate={{ width: `${subtaskPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <div className="holo-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onToggleComplete(task)} data-cursor-hover>
            {done ? "Reopen" : "Complete"}
          </button>
          {task.is_owner !== false && (
            <button type="button" className="holo-danger" onClick={() => onDelete(task.id)} data-cursor-hover>
              Delete
            </button>
          )}
        </div>
      </HoloCard>
    </motion.div>
  );
};

export default TaskCard;
