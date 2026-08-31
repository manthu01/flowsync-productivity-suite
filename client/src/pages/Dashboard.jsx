import { FaClipboardList, FaCircleCheck, FaClock, FaTriangleExclamation } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { getTasks } from "../services/taskService";
import { logout, getStoredUser } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";
import AnalyticsCharts from "../components/AnalyticsCharts";
import { categoryStyle, priorityStyle } from "../utils/categoryColors";

const todayStr = () => new Date().toISOString().slice(0, 10);

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

  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.length - completedTasks;
  const overdueTasks = tasks.filter(
    (t) => t.due_date && t.status !== "Completed" && t.due_date.slice(0, 10) < todayStr()
  ).length;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Total Tasks"
            value={tasks.length}
            icon={<FaClipboardList size={32} className="text-cyan-400/70" />}
            delay={0.05}
          />
          <StatCard
            label="Completed"
            value={completedTasks}
            icon={<FaCircleCheck size={32} className="text-emerald-400/70" />}
            delay={0.1}
          />
          <StatCard
            label="Pending"
            value={pendingTasks}
            icon={<FaClock size={32} className="text-amber-400/70" />}
            delay={0.15}
          />
          <StatCard
            label="Overdue"
            value={overdueTasks}
            icon={<FaTriangleExclamation size={32} className="text-red-400/70" />}
            delay={0.2}
          />
        </div>

        <div className="mb-10">
          <AnalyticsCharts tasks={tasks} />
        </div>

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
                Create your first one
              </Link>
              .
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                to="/tasks"
                data-cursor-hover
                className="block bg-line/[0.03] backdrop-blur-lg border border-line/10 p-5 rounded-2xl hover:border-line/20 hover:-translate-y-1 transition-all duration-300"
              >
                <h3 className="font-semibold mb-2 truncate">{task.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityStyle(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryStyle(task.category)}`}>
                    {task.category || "Other"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
