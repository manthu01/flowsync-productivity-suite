import { FaClipboardList, FaCircleCheck, FaClock, FaTriangleExclamation, FaRotate } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { getTasks } from "../services/taskService";
import { logout, getStoredUser } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";
import AnalyticsCharts from "../components/AnalyticsCharts";
import HoloCard from "../components/HoloCard";
import { CATEGORY_META } from "../utils/categoryColors";
import { dayStrFromToday, todayStr } from "../utils/dates";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysFromToday = (dateStr) =>
  Math.round((new Date(`${dateStr}T00:00`) - new Date(`${todayStr()}T00:00`)) / DAY_MS);

const dueLabel = (dateStr) => {
  const days = daysFromToday(dateStr);
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return new Date(`${dateStr}T00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const taskLink = (task) => `/tasks?task=${task.id}`;

const StatCard = ({ label, value, icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -4 }}
    className="bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-subtle text-sm">{label}</p>
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

  useEffect(() => {
    (async () => {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        toast.error("Couldn't load your dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const today = todayStr();
  const weekEnd = dayStrFromToday(7);
  const openTasks = tasks.filter((t) => t.status !== "Completed");

  const completedTasks = tasks.length - openTasks.length;
  const overdueTasks = openTasks.filter((t) => t.due_date && t.due_date.slice(0, 10) < today).length;
  const repeatingTasks = openTasks.filter((t) => t.recurrence && t.recurrence !== "None").length;

  // Overdue first, then everything due in the next seven days, soonest first.
  const dueThisWeek = openTasks
    .filter((t) => t.due_date && t.due_date.slice(0, 10) <= weekEnd)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <div className="min-h-screen text-fg p-6 md:p-8 relative">
      <AmbientBackground />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-subtle mt-1">Here's where things stand.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <StatCard
            label="Total Tasks"
            value={tasks.length}
            icon={<FaClipboardList size={30} className="text-cyan-400/70" />}
            delay={0.05}
          />
          <StatCard
            label="In Progress"
            value={openTasks.length}
            icon={<FaClock size={30} className="text-amber-400/70" />}
            delay={0.1}
          />
          <StatCard
            label="Completed"
            value={completedTasks}
            icon={<FaCircleCheck size={30} className="text-emerald-400/70" />}
            delay={0.15}
          />
          <StatCard
            label="Overdue"
            value={overdueTasks}
            icon={<FaTriangleExclamation size={30} className="text-red-400/70" />}
            delay={0.2}
          />
          <StatCard
            label="Repeating"
            value={repeatingTasks}
            icon={<FaRotate size={30} className="text-fuchsia-400/70" />}
            delay={0.25}
          />
        </div>

        <div className="mb-10">
          <AnalyticsCharts tasks={tasks} />
        </div>

        {!loading && tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-10 bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl"
          >
            <h3 className="text-sm font-semibold text-muted mb-4 tracking-wide uppercase">Due This Week</h3>

            {dueThisWeek.length === 0 ? (
              <p className="text-subtle text-sm">Nothing due in the next seven days.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line/10">
                {dueThisWeek.map((task) => {
                  const cat = CATEGORY_META[task.category] || CATEGORY_META.Other;
                  const overdue = task.due_date.slice(0, 10) < today;
                  return (
                    <li key={task.id}>
                      <Link
                        to={taskLink(task)}
                        data-cursor-hover
                        className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-line/[0.04] transition-colors"
                      >
                        <span className="w-5 text-center" style={{ color: cat.hex }} aria-hidden="true">
                          {cat.glyph}
                        </span>
                        <span className="flex-1 min-w-0 truncate font-medium">{task.title}</span>
                        {task.recurrence && task.recurrence !== "None" && (
                          <span className="hidden sm:inline text-xs text-subtle">↻ {task.recurrence}</span>
                        )}
                        <span
                          className={`shrink-0 text-xs font-semibold tabular-nums ${
                            overdue ? "text-red-400" : daysFromToday(task.due_date.slice(0, 10)) <= 1 ? "text-amber-400" : "text-muted"
                          }`}
                        >
                          {dueLabel(task.due_date.slice(0, 10))}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Recent Tasks</h2>
            <Link to="/tasks" data-cursor-hover className="text-cyan-400 text-sm hover:underline">
              View all tasks &rarr;
            </Link>
          </div>

          {!loading && recentTasks.length === 0 && (
            <div className="bg-line/[0.03] border border-line/10 rounded-3xl p-10 text-center text-subtle">
              No tasks yet.{" "}
              <Link to="/tasks" data-cursor-hover className="text-cyan-400 hover:underline">
                Forge your first card
              </Link>
              .
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 justify-items-center">
            {recentTasks.map((task) => (
              <Link key={task.id} to={taskLink(task)} data-cursor-hover className="block w-full max-w-[300px]">
                <HoloCard
                  className={`holo-mini ${task.status === "Completed" ? "holo-done" : ""}`}
                  title={task.title}
                  description={task.description}
                  priority={task.priority}
                  category={task.category || "Other"}
                  mood={task.mood || "Chill"}
                  recurrence={task.recurrence}
                  footer={
                    <>
                      <span>{task.due_date ? dueLabel(task.due_date.slice(0, 10)) : "No due date"}</span>
                      <span>#{String(task.id).padStart(4, "0")}</span>
                    </>
                  }
                >
                  {task.status === "Completed" && <span className="holo-stamp">Completed</span>}
                </HoloCard>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
