import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiSearch } from "react-icons/fi";
import { connectSocket } from "../services/socket";

import {
  getTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "../services/taskService";
import { logout } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";
import TaskModal from "../components/TaskModal";
import TaskForge from "../components/TaskForge";
import TaskCard from "../components/TaskCard";
import PillSelector from "../components/PillSelector";
import { CATEGORIES, MOODS } from "../utils/categoryColors";
import { todayStr } from "../utils/dates";

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

const MOOD_ACTIVE_CLASS = {
  Grind: "bg-orange-400",
  Chill: "bg-sky-400",
  Creative: "bg-fuchsia-400",
  Admin: "bg-slate-300",
};
const MOOD_OPTIONS = MOODS.map((m) => ({ value: m, label: m, activeClass: MOOD_ACTIVE_CLASS[m] }));

const STATUS_FILTER_OPTIONS = [
  { value: "All", label: "All", activeClass: "bg-line/40" },
  { value: "In Progress", label: "In Progress", activeClass: "bg-indigo-500" },
  { value: "Completed", label: "Completed", activeClass: "bg-emerald-500" },
];
const PRIORITY_FILTER_OPTIONS = [{ value: "All", label: "All", activeClass: "bg-line/40" }, ...PRIORITY_OPTIONS];
const CATEGORY_FILTER_OPTIONS = [{ value: "All", label: "All", activeClass: "bg-line/40" }, ...CATEGORY_OPTIONS];
const MOOD_FILTER_OPTIONS = [{ value: "All", label: "All", activeClass: "bg-line/40" }, ...MOOD_OPTIONS];

const Tasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [moodFilter, setMoodFilter] = useState("All");

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

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    // Any change to a task this user owns or collaborates on — by them, in another
    // tab, or by a collaborator elsewhere — triggers a silent refetch here.
    const handleTasksChanged = () => fetchTasks(true);
    socket.on("tasks:changed", handleTasksChanged);

    return () => socket.off("tasks:changed", handleTasksChanged);
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
      const matchesMood = moodFilter === "All" ? true : task.mood === moodFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesMood;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter, moodFilter]);

  // Rethrows on failure so the forge keeps what was typed.
  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
    } catch (error) {
      toast.error("Couldn't create task");
      throw error;
    }
    toast.success("Card forged");
    fetchTasks();
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
    const completing = task.status !== "Completed";
    try {
      await updateTaskStatus(task.id, {
        ...task,
        status: completing ? "Completed" : "In Progress",
      });
      if (completing && task.recurrence && task.recurrence !== "None") {
        toast.success(`Done. The next ${task.recurrence.toLowerCase()} one is queued up`);
      }
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

        <TaskForge onCreate={handleCreateTask} />

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <div>
              <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2.5">Mood</p>
              <PillSelector layoutId="filter-mood" options={MOOD_FILTER_OPTIONS} value={moodFilter} onChange={setMoodFilter} />
            </div>
          </div>
        </motion.div>

        <div>
          <h2 className="text-xl font-bold mb-6">
            {tasks.length === filteredTasks.length ? "Your Collection" : "Tasks"}{" "}
            {!loading && <span className="text-subtle font-normal">({filteredTasks.length})</span>}
          </h2>

          {!loading && filteredTasks.length === 0 && (
            <div className="bg-line/[0.03] border border-line/10 rounded-3xl p-10 text-center text-subtle">
              {tasks.length === 0 ? "No cards yet. Forge your first task above." : "No tasks match your filters."}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  overdue={isOverdue(task)}
                  onOpen={setSelectedTask}
                  onToggleComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                />
              ))}
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
