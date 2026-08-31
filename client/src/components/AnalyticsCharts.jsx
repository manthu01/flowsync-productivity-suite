import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { PRIORITY_CHART_COLORS, STATUS_CHART_COLORS } from "../utils/categoryColors";

const tooltipStyle = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "13px",
};

const AnalyticsCharts = ({ tasks }) => {
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const inProgress = tasks.length - completed;

  const statusData = [
    { name: "Completed", value: completed },
    { name: "In Progress", value: inProgress },
  ].filter((d) => d.value > 0);

  const priorityData = ["High", "Medium", "Low"].map((p) => ({
    name: p,
    count: tasks.filter((t) => t.priority === p).length,
  }));

  if (tasks.length === 0) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-lg border border-white/10 p-8 rounded-3xl text-center text-zinc-500">
        Add a task to see your analytics come alive.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <div className="bg-white/[0.03] backdrop-blur-lg border border-white/10 p-6 rounded-3xl">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4 tracking-wide uppercase">
          Status Breakdown
        </h3>
        <div className="h-[200px] flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                stroke="none"
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_CHART_COLORS[entry.name]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 pr-4 shrink-0">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: STATUS_CHART_COLORS[d.name] }}
                />
                <span className="text-zinc-300">{d.name}</span>
                <span className="text-zinc-500">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-lg border border-white/10 p-6 rounded-3xl">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4 tracking-wide uppercase">
          Priority Breakdown
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_CHART_COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsCharts;
