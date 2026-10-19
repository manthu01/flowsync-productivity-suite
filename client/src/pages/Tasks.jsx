import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import TaskFilterMenu from "../components/TaskFilterMenu";
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

// Completed cards (including every finished round of a repeating task) are kept
// out of the way by default: the collection opens on the "Active" tab.
const STATUS_TABS = [
  { value: "In Progress", label: "Active", activeClass: "bg-cyan-400" },
  { value: "Completed", label: "Completed", activeClass: "bg-emerald-500" },
  { value: "All", label: "All", activeClass: "bg-line/40" },
];

const ALL_OPTION = { value: "All", label: "All", activeClass: "bg-line/40" };
const FILTER_GROUPS = [
  { key: "priority", label: "Priority", options: [ALL_OPTION, ...PRIORITY_OPTIONS] },
  { key: "category", label: "Category", options: [ALL_OPTION, ...CATEGORY_OPTIONS] },
  { key: "mood", label: "Mood", options: [ALL_OPTION, ...MOOD_OPTIONS] },
];
const NO_FILTERS = { priority: "All", category: "All", mood: "All" };
// What an unset field counts as when filtering (older rows may lack these).
const NO_FILTERS_FALLBACK = { priority: "Medium", category: "Other", mood: "Chill" };

const Tasks = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("In Progress");
  const [filters, setFilters] = useState(NO_FILTERS);

  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async (silent = false) => {
    try {
      const data = await getTasks();
      setTasks(data);
      if (silent && selectedTask) {
        const refreshed = data.find((t) => t.id === selectedTask.id);
        if (refreshed) setSelectedTask(refreshed);
      }

      // Deep link from the dashboard (/tasks?task=ID): open that task once, then
      // drop the param so closing the modal doesn't reopen it on the next refetch.
      const linkedId = Number(searchParams.get("task"));
      if (!silent && linkedId) {
        const linked = data.find((t) => t.id === linkedId);
        if (linked) setSelectedTask(linked);
        else toast.error("That task no longer exists");
        setSearchParams({}, { replace: true });
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
      const matchesFilters = FILTER_GROUPS.every(
        ({ key }) => filters[key] === "All" || (task[key] || NO_FILTERS_FALLBACK[key]) === filters[key]
      );

      return matchesSearch && matchesStatus && matchesFilters;
    });
  }, [tasks, searchTerm, statusFilter, filters]);

  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const statusCounts = {
    "In Progress": tasks.length - completedCount,
    Completed: completedCount,
    All: tasks.length,
  };
  const statusTabs = STATUS_TABS.map((tab) => ({
    ...tab,
    label: (
      <>
        {tab.label}
        {!loading && <span className="ml-1.5 opacity-60 tabular-nums">{statusCounts[tab.value]}</span>}
      </>
    ),
  }));

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

  const filtersActive = searchTerm || Object.values(filters).some((v) => v !== "All");
  const emptyMessage =
    tasks.length === 0
      ? "No cards yet. Forge your first task above."
      : filtersActive
        ? "No cards match your search or filters."
        : statusFilter === "In Progress"
          ? `All caught up. ${completedCount} completed ${completedCount === 1 ? "card is" : "cards are"} in the Completed tab.`
          : "No completed cards yet.";

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

        <div className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">
            Your Collection{" "}
            {!loading && <span className="text-subtle font-normal">({filteredTasks.length})</span>}
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="sticky top-[4.5rem] z-20 mb-8 flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-panel/80 backdrop-blur-xl border border-line/10 shadow-lg"
        >
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
            <input
              type="text"
              placeholder="Search your collection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} w-full pl-10 !py-2`}
            />
          </div>
          <PillSelector layoutId="filter-status" options={statusTabs} value={statusFilter} onChange={setStatusFilter} />
          <TaskFilterMenu
            groups={FILTER_GROUPS}
            values={filters}
            onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
            onClear={() => setFilters(NO_FILTERS)}
          />
        </motion.div>

        <div>
          {!loading && filteredTasks.length === 0 && (
            <div className="bg-line/[0.03] border border-line/10 rounded-3xl p-10 text-center text-subtle">
              {emptyMessage}
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
