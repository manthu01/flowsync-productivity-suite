import { motion } from "framer-motion";
import { FaListCheck, FaChartPie, FaUserGroup } from "react-icons/fa6";
import AmbientBackground from "./AmbientBackground";

const HIGHLIGHTS = [
  { icon: <FaListCheck size={18} />, text: "Subtasks, categories, and due dates that keep you honest" },
  { icon: <FaChartPie size={18} />, text: "Real analytics on where your time actually goes" },
  { icon: <FaUserGroup size={18} />, text: "Add colleagues and stay in sync as a team" },
];

// Shared split-screen shell for Login/Signup: a branded showcase panel on desktop,
// collapsing to just the form on smaller screens. `children` is the form itself.
const AuthLayout = ({ eyebrow, title, subtitle, children }) => {
  return (
    <div className="min-h-screen flex text-fg relative overflow-hidden">
      <AmbientBackground />

      <div className="hidden lg:flex lg:w-[46%] relative z-10 flex-col justify-between p-12 border-r border-line/10 bg-line/[0.02]">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-2xl font-extrabold tracking-tight">FlowSync</div>
        </motion.div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl font-extrabold tracking-tight leading-tight mb-4"
          >
            Plan your work.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
              Actually finish it.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-subtle max-w-sm mb-10"
          >
            A focused workspace for tasks, progress, and the people you work with.
          </motion.p>

          <div className="flex flex-col gap-4">
            {HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={h.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 shrink-0 rounded-xl bg-line/5 border border-line/10 flex items-center justify-center text-cyan-300">
                  {h.icon}
                </div>
                <p className="text-sm text-muted">{h.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-subtle text-xs">Task management that doesn't feel like a chore.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm bg-line/[0.03] backdrop-blur-xl border border-line/10 p-8 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.5)]"
        >
          <div className="lg:hidden text-center mb-6">
            <div className="text-2xl font-extrabold tracking-tight">FlowSync</div>
          </div>

          {eyebrow && (
            <p className="text-cyan-400 text-xs font-semibold tracking-wide uppercase text-center mb-2">
              {eyebrow}
            </p>
          )}
          <h2 className="text-2xl font-extrabold text-center tracking-tight">{title}</h2>
          {subtitle && <p className="text-subtle text-sm text-center mt-1 mb-8">{subtitle}</p>}

          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
