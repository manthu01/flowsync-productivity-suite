import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaListCheck, FaChartPie, FaTags, FaBell } from "react-icons/fa6";
import AmbientBackground from "../components/AmbientBackground";
import { getToken } from "../services/authService";

const FEATURES = [
  {
    icon: <FaListCheck size={22} className="text-cyan-300" />,
    title: "Subtasks & progress",
    desc: "Break any task into smaller steps and watch an animated progress bar fill in as you check them off.",
  },
  {
    icon: <FaChartPie size={22} className="text-indigo-300" />,
    title: "Real analytics",
    desc: "A live breakdown of your workload by status and priority, so you know where your time is actually going.",
  },
  {
    icon: <FaTags size={22} className="text-fuchsia-300" />,
    title: "Categories & due dates",
    desc: "Tag tasks by category, set due dates, and get flagged automatically when something's overdue.",
  },
  {
    icon: <FaBell size={22} className="text-amber-300" />,
    title: "Verified accounts",
    desc: "Email verification and secure password resets — your account, actually yours.",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, delay },
});

const Home = () => {
  const isAuthed = !!getToken();

  return (
    <div className="relative">
      <AmbientBackground />

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-400 mb-6"
        >
          Task management that doesn't feel like a chore
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight"
        >
          Plan your work.
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
            Actually finish it.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-zinc-400 text-lg mt-6 max-w-xl mx-auto"
        >
          FlowSync is a focused workspace for tracking tasks, breaking them into subtasks,
          and seeing your progress in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-10"
        >
          <Link to={isAuthed ? "/tasks" : "/signup"} data-cursor-hover>
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block bg-cyan-500 hover:bg-cyan-400 transition-colors px-7 py-3 rounded-xl font-bold text-black"
            >
              {isAuthed ? "Go to Tasks" : "Get Started Free"}
            </motion.span>
          </Link>
          <Link to="/about" data-cursor-hover>
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block bg-white/5 hover:bg-white/10 border border-white/10 transition-colors px-7 py-3 rounded-xl font-semibold"
            >
              Learn More
            </motion.span>
          </Link>
        </motion.div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pb-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp(i * 0.08)}
              whileHover={{ y: -4 }}
              className="bg-white/[0.03] backdrop-blur-lg border border-white/10 p-6 rounded-3xl"
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg mb-1.5">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
