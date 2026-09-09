import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiType, FiAlignLeft, FiCalendar, FiSearch } from "react-icons/fi";

import {
  getTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "../services/taskService";
import { logout } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";
import TaskModal from "../components/TaskModal";
import PillSelector from "../components/PillSelector";
import { CATEGORIES, categoryStyle, priorityStyle } from "../utils/categoryColors";

const inputClass =
  "p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors";

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low", activeClass: "bg-emerald-500" },
  { value: "Medium", label: "Medium", activeClass: "bg-amber-500" },
  { value: "High", label: "High", activeClass: "bg-red-500" },
];

const CATEGORY_ACTIVE_CLASS = {
  Work: "bg-blue-500",
  Personal: "bg-emerald-500",
  Urgent: "bg-red-500",
  Other: "bg-zinc-500",
};
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c,
  label: c,
  activeClass: CATEGORY_ACTIVE_CLASS[c],
}));

const STATUS_FILTER_OPTIONS = [
  { value: "All", label: "All", activeClass: "bg-line/40" },
  { value: "In Progress", label: "In Progress", activeClass: "bg-indigo-500" },
  { value: "Completed", label: "Completed", activeClass: "bg-emerald-500" },
];
const PRIORITY_FILTER_OPTIONS = [{ value: "All", label: "All", activeClass: "bg-line/40" }, ...PRIORITY_OPTIONS];
const CATEGORY_FILTER_OPTIONS = [{ value: "All", label: "All", activeClass: "bg-line/40" }, ...CATEGORY_OPTIONS];

const todayStr = () => new Date().toISOString().slice(0, 10);

const Tasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Work");
  const [dueDate, setDueDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async (silent = false) => {
    try {
      const data = await getTasks();
      setTasks(data);
      if (silent && selectedTask) {
        const refreshed = data.find((t) => t.id === selectedTask.id);
        if (refreshed) setSelectedTask(refreshed);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      toast.error("Couldn't load your tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" ? true : task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" ? true : task.priority === priorityFilter;
      const matchesCategory =
        categoryFilter === "All" ? true : task.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask({
        title,
        description,
        status: "In Progress",
        priority,
        category,
        due_date: dueDate || null,
      });

      toast.success("Task created");
      fetchTasks();

      setTitle("");
      setDescription("");
      setPriority("Medium");
      setCategory("Work");
      setDueDate("");
    } catch {
      toast.error("Couldn't create task");
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
      setSelectedTask(null);
      fetchTasks();
    } catch {
      toast.error("Couldn't delete task");
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      await updateTaskStatus(task.id, {
        ...task,
        status: task.status === "Completed" ? "In Progress" : "Completed",
      });
      fetchTasks();
    } catch {
      toast.error("Couldn't update task");
    }
  };

  const handleModalSave = async (form) => {
    try {
      await updateTaskStatus(form.id, form);
      toast.success("Task updated");
      setSelectedTask(null);
      fetchTasks();
    } catch {
      toast.error("Couldn't save changes");
    }
  };

  const isOverdue = (task) =>
    task.due_date &&
    task.status !== "Completed" &&
    task.due_date.slice(0, 10) < todayStr();

  return (
    <div className="min-h-screen text-fg p-6 md:p-8 relative">
      <AmbientBackground />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8"
        >
          Tasks
        </motion.h1>

        <motion.form
          onSubmit={handleCreateTask}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="relative overflow-hidden bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 blur-2xl pointer-events-none"
          />

          <h2 className="text-xl font-bold mb-6 relative">Create Task</h2>

          <div className="flex flex-col gap-5 relative">
            <div className="relative">
              <FiType className="absolute left-3.5 top-3.5 text-subtle" size={16} />
              <input
                type="text"
                placeholder="What needs to get done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${inputClass} w-full pl-10`}
                required
              />
            </div>

            <div className="relative">
              <FiAlignLeft className="absolute left-3.5 top-3.5 text-subtle" size={16} />
              <textarea
                placeholder="Add a description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputClass} w-full pl-10`}
                rows={2}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2.5">Priority</p>
              <PillSelector layoutId="create-priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
            </div>

            <div>
              <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2.5">Category</p>
              <PillSelector layoutId="create-category" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div className="flex-1">
                <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2.5">Due date</p>
                <div className="relative">
                  <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`${inputClass} w-full pl-10`}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                data-cursor-hover
                className="bg-cyan-500 hover:bg-cyan-400 transition-colors px-8 py-3 rounded-xl font-bold text-black whitespace-nowrap"
              >
                Create Task
              </motion.button>
            </div>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl mb-8"
        >
          <h2 className="text-xl font-bold mb-6">Search & Filters</h2>

          <div className="relative mb-5">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} w-full pl-10`}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2.5">Status</p>
              <PillSelector layoutId="filter-status" options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
            </div>
            <div>
              <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2.5">Priority</p>
              <PillSelector layoutId="filter-priority" options={PRIORITY_FILTER_OPTIONS} value={priorityFilter} onChange={setPriorityFilter} />
            </div>
            <div>
              <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2.5">Category</p>
              <PillSelector layoutId="filter-category" options={CATEGORY_FILTER_OPTIONS} value={categoryFilter} onChange={setCategoryFilter} />
            </div>
          </div>
        </motion.div>

        <div>
          <h2 className="text-xl font-bold mb-6">
            {tasks.length === filteredTasks.length ? "All Tasks" : "Tasks"}{" "}
            {!loading && <span className="text-subtle font-normal">({filteredTasks.length})</span>}
          </h2>

          {!loading && filteredTasks.length === 0 && (
            <div className="bg-line/[0.03] border border-line/10 rounded-3xl p-10 text-center text-subtle">
              No tasks match your filters.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => {
                const subtaskTotal = task.subtask_count || 0;
                const subtaskDone = task.subtask_completed_count || 0;
                const subtaskPercent =
                  subtaskTotal === 0 ? 0 : Math.round((subtaskDone / subtaskTotal) * 100);

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => setSelectedTask(task)}
                    data-cursor-hover
                    className="cursor-pointer bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl hover:border-line/20 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">{task.title}</h3>
                      {task.description && (
                        <p className="text-subtle mt-1.5 text-sm line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          task.status === "Completed"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                        }`}
                      >
                        {task.status}
                      </span>

                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityStyle(task.priority)}`}>
                        {task.priority}
                      </span>

                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryStyle(task.category)}`}>
                        {task.category || "Other"}
                      </span>

                      {task.due_date && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            isOverdue(task)
                              ? "bg-red-500/15 text-red-300 border-red-500/30"
                              : "bg-line/5 text-muted border-line/10"
                          }`}
                        >
                          {isOverdue(task) ? "Overdue · " : "Due "}
                          {task.due_date.slice(0, 10)}
                        </span>
                      )}
                    </div>

                    {subtaskTotal > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center justify-between text-xs text-subtle mb-1.5">
                          <span>Subtasks</span>
                          <span>
                            {subtaskDone}/{subtaskTotal}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-line/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background:
                                subtaskPercent === 100
                                  ? "linear-gradient(90deg, #34d399, #22d3ee)"
                                  : "linear-gradient(90deg, #22d3ee, #818cf8)",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${subtaskPercent}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleCompleteTask(task)}
                        data-cursor-hover
                        className="flex-1 bg-line/5 hover:bg-line/10 border border-line/10 transition-colors py-2 rounded-xl font-medium text-sm"
                      >
                        {task.status === "Completed" ? "Mark In Progress" : "Mark Completed"}
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        data-cursor-hover
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors px-4 py-2 rounded-xl font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={handleModalSave}
        onDelete={handleDeleteTask}
        onSubtasksChanged={() => fetchTasks(true)}
      />
    </div>
  );
};

export default Tasks;
