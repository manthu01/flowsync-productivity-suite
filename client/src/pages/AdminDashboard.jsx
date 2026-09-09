import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaUserClock,
  FaClipboardList,
  FaCircleCheck,
  FaEnvelope,
  FaUserGroup,
} from "react-icons/fa6";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { getAdminStats, getAdminUsers, getAdminContactMessages } from "../services/adminService";
import AmbientBackground from "../components/AmbientBackground";
import AdminUsersTable from "../components/admin/AdminUsersTable";
import AdminInboxList from "../components/admin/AdminInboxList";
import { STATUS_CHART_COLORS, PRIORITY_CHART_COLORS } from "../utils/categoryColors";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "inbox", label: "Inbox" },
];

const tooltipStyle = {
  background: "rgb(var(--color-panel))",
  border: "1px solid rgb(var(--color-line) / 0.12)",
  borderRadius: "12px",
  color: "rgb(var(--color-fg))",
  fontSize: "13px",
};
const axisStroke = "rgb(var(--color-subtle))";

const CATEGORY_CHART_COLORS = {
  Work: "#60a5fa",
  Personal: "#34d399",
  Urgent: "#f87171",
  Other: "#a1a1aa",
};

const StatCard = ({ label, value, icon, delay = 0 }) => (
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

const ChartCard = ({ title, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl"
  >
    <h3 className="text-sm font-semibold text-muted mb-4 tracking-wide uppercase">{title}</h3>
    {children}
  </motion.div>
);

const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsData, usersData, messagesData] = await Promise.all([
          getAdminStats(),
          getAdminUsers(),
          getAdminContactMessages(),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setMessages(messagesData);
      } catch {
        toast.error("Couldn't load admin data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-subtle">
        Loading admin dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-subtle">
        Couldn't load stats. Try refreshing.
      </div>
    );
  }

  const signupChartData = stats.signupsByDay.map((d) => ({ ...d, label: shortDate(d.date) }));
  const categoryData = stats.tasksByCategory.map((c) => ({ name: c.category || "Other", count: c.count }));
  const statusData = stats.tasksByStatus.map((s) => ({ name: s.status, count: s.count }));

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
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin</h1>
          <p className="text-subtle mt-1">The founder's view of FlowSync — not visible to other users.</p>
        </motion.div>

        <div className="flex gap-1 mb-8 bg-line/[0.03] border border-line/10 rounded-2xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t.id ? "text-black" : "text-muted hover:text-fg"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="admin-tab-active"
                  className="absolute inset-0 bg-cyan-500 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {t.label}
              {t.id === "inbox" && messages.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-fuchsia-500 text-white text-[10px] font-bold align-middle">
                  {messages.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "users" && <AdminUsersTable users={users} />}
        {tab === "inbox" && <AdminInboxList messages={messages} />}

        {tab === "overview" && (
          <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
          <StatCard label="Total Users" value={stats.totals.users} icon={<FaUsers size={28} className="text-cyan-400/70" />} delay={0.02} />
          <StatCard label="Active (7d)" value={stats.activeUsers.weekly} icon={<FaUserClock size={28} className="text-indigo-400/70" />} delay={0.06} />
          <StatCard label="Active (30d)" value={stats.activeUsers.monthly} icon={<FaUserClock size={28} className="text-indigo-300/70" />} delay={0.1} />
          <StatCard label="Total Tasks" value={stats.totals.tasks} icon={<FaClipboardList size={28} className="text-fuchsia-400/70" />} delay={0.14} />
          <StatCard label="Completed" value={stats.totals.completedTasks} icon={<FaCircleCheck size={28} className="text-emerald-400/70" />} delay={0.18} />
          <StatCard label="Friendships" value={stats.totals.friendships} icon={<FaUserGroup size={28} className="text-amber-400/70" />} delay={0.22} />
        </div>

        <div className="mb-10">
          <ChartCard title="Signups, last 30 days" delay={0.1}>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupChartData}>
                  <defs>
                    <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgb(var(--color-line) / 0.08)" />
                  <XAxis
                    dataKey="label"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.ceil(signupChartData.length / 8)}
                  />
                  <YAxis allowDecimals={false} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => l} />
                  <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} fill="url(#signupsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <ChartCard title="Tasks by Category (platform-wide)" delay={0.14}>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgb(var(--color-line) / 0.04)" }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_CHART_COLORS[entry.name] || CATEGORY_CHART_COLORS.Other} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Tasks by Status (platform-wide)" delay={0.18}>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke={axisStroke} fontSize={12} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgb(var(--color-line) / 0.04)" }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name] || PRIORITY_CHART_COLORS.Medium} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="bg-line/[0.03] backdrop-blur-lg border border-line/10 rounded-3xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-xl font-bold">Recent Signups</h2>
            <span className="text-subtle text-sm flex items-center gap-2">
              <FaEnvelope size={14} /> {stats.totals.contactMessages} contact messages received
            </span>
          </div>

          {stats.recentSignups.length === 0 ? (
            <div className="p-10 text-center text-subtle">No users yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-subtle text-left border-t border-line/10">
                    <th className="font-medium px-6 py-3">Name</th>
                    <th className="font-medium px-6 py-3">Username</th>
                    <th className="font-medium px-6 py-3">Email</th>
                    <th className="font-medium px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSignups.map((u) => (
                    <tr key={u.id} className="border-t border-line/10 hover:bg-line/[0.03] transition-colors">
                      <td className="px-6 py-3 font-medium">{u.name}</td>
                      <td className="px-6 py-3 text-muted">@{u.username}</td>
                      <td className="px-6 py-3 text-muted">{u.email}</td>
                      <td className="px-6 py-3 text-subtle">{shortDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
