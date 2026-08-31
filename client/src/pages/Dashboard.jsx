import {
  FaTasks,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import {
  getTasks,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "../services/taskService";
import { logout, getStoredUser } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";
import TaskModal from "../components/TaskModal";
import AnalyticsCharts from "../components/AnalyticsCharts";
import { CATEGORIES, categoryStyle, priorityStyle } from "../utils/categoryColors";

const inputClass =
  "p-3 rounded-xl bg-white/[0.04] border border-white/10 outline-none focus:border-cyan-400/50 transition-colors";

const todayStr = () => new Date().toISOString().slice(0, 10);

const StatCard = ({ label, value, icon, accent, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -4 }}
    className={`bg-white/[0.03] backdrop-blur-lg border border-white/10 p-6 rounded-3xl ${accent}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-zinc-500 text-sm">{label}</p>
        <h2 className="text-3xl font-bold mt-2">{value}</h2>
      </div>
      {icon}
    </div>
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

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

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.length - completedTasks;

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
    } catch (error) {
      toast.error("Couldn't create task");
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
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
    } catch (error) {
      toast.error("Couldn't update task");
    }
  };

  const handleModalSave = async (form) => {
    try {
      await updateTaskStatus(form.id, form);
      toast.success("Task updated");
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      toast.error("Couldn't save changes");
    }
  };

  const isOverdue = (task) =>
    task.due_date &&
    task.status !== "Completed" &&
    task.due_date.slice(0, 10) < todayStr();

  return (
    <div className="min-h-screen text-white p-6 md:p-8 relative">
      <AmbientBackground />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            FlowSync
          </h1>

          <div className="flex items-center gap-4">
            {user?.name && (
              <span className="text-zinc-400 hidden sm:inline">
                Hi, {user.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="bg-white/5 hover:bg-white/10 border border-white/10 transition-colors px-4 py-2 rounded-xl font-medium text-sm"
            >
              Logout
            </button>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleCreateTask}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white/[0.03] backdrop-blur-lg border border-white/10 p-6 rounded-3xl mb-8"
        >
          <h2 className="text-xl font-bold mb-6">Create Task</h2>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              required
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={inputClass}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 transition-colors p-3 rounded-xl font-bold text-black"
            >
              Create Task
            </motion.button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/[0.03] backdrop-blur-lg border border-white/10 p-6 rounded-3xl mb-8"
        >
          <h2 className="text-xl font-bold mb-6">Search & Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputClass}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              <option>All</option>
              <option>Completed</option>
              <option>In Progress</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={inputClass}
            >
              <option>All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={inputClass}
            >
              <option>All</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Total Tasks"
            value={tasks.length}
            icon={<FaTasks size={36} className="text-cyan-400/70" />}
            accent="shadow-[0_0_25px_rgba(34,211,238,0.08)]"
            delay={0.15}
          />
          <StatCard
            label="Completed"
            value={completedTasks}
            icon={<FaCheckCircle size={36} className="text-emerald-400/70" />}
            delay={0.2}
          />
          <StatCard
            label="Pending"
            value={pendingTasks}
            icon={<FaClock size={36} className="text-amber-400/70" />}
            delay={0.25}
          />
        </div>

        <div className="mb-10">
          <AnalyticsCharts tasks={tasks} />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">
            Tasks {!loading && <span className="text-zinc-500 font-normal">({filteredTasks.length})</span>}
          </h2>

          {!loading && filteredTasks.length === 0 && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-10 text-center text-zinc-500">
              No tasks match your filters.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setSelectedTask(task)}
                  className="cursor-pointer bg-white/[0.03] backdrop-blur-lg border border-white/10 p-6 rounded-3xl hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">{task.title}</h3>
                    {task.description && (
                      <p className="text-zinc-500 mt-1.5 text-sm line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
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
                            : "bg-white/5 text-zinc-400 border-white/10"
                        }`}
                      >
                        {isOverdue(task) ? "Overdue · " : "Due "}
                        {task.due_date.slice(0, 10)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCompleteTask(task)}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors py-2 rounded-xl font-medium text-sm"
                    >
                      {task.status === "Completed" ? "Mark In Progress" : "Mark Completed"}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors px-4 py-2 rounded-xl font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
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
      />
    </div>
  );
};

export default Dashboard;
