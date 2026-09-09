import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaListCheck, FaChartPie, FaTags, FaBell, FaCircleCheck } from "react-icons/fa6";
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
    title: "Built for real use",
    desc: "Friends, a personal dashboard, and a profile that's actually yours — not just another to-do list.",
  },
];

const HEADLINE_TOP = ["Plan", "your", "work."];
const HEADLINE_BOTTOM = ["Actually", "finish", "it."];

const wordVariants = {
  hidden: { opacity: 0, y: 40, rotate: -4 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.6, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};

// A stylized, purely decorative preview of the task UI — floats and tilts toward the
// cursor for a bit of "product shot" depth on the hero.
const PreviewCard = () => {
  const ref = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 150, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 150, damping: 18 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 14);
    rotateX.set(-py * 14);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const rows = [
    { title: "Redesign landing page", tag: "Work", tagColor: "bg-blue-500/15 text-blue-300 border-blue-500/30", pct: 80 },
    { title: "Ship analytics v2", tag: "Urgent", tagColor: "bg-red-500/15 text-red-300 border-red-500/30", pct: 45 },
    { title: "Plan Q3 roadmap", tag: "Personal", tagColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", pct: 100 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1200 }}
      className="relative mx-auto mt-16 max-w-xl"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
        className="relative bg-line/[0.04] backdrop-blur-2xl border border-line/10 rounded-3xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-subtle text-xs font-medium">Today's tasks</span>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <motion.div
              key={row.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.12 }}
              className="bg-line/[0.03] border border-line/10 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium flex items-center gap-2">
                  {row.pct === 100 && <FaCircleCheck className="text-emerald-400" size={13} />}
                  {row.title}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${row.tagColor}`}>
                  {row.tag}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-line/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${row.pct}%` }}
                  transition={{ duration: 0.8, delay: 1.2 + i * 0.12, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating accent chips for depth */}
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-6 -right-6 bg-line/[0.06] backdrop-blur-xl border border-line/10 rounded-2xl px-4 py-2.5 shadow-xl hidden sm:flex items-center gap-2"
      >
        <FaChartPie className="text-fuchsia-300" size={14} />
        <span className="text-xs font-semibold">73% complete</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-5 -left-6 bg-line/[0.06] backdrop-blur-xl border border-line/10 rounded-2xl px-4 py-2.5 shadow-xl hidden sm:flex items-center gap-2"
      >
        <FaListCheck className="text-cyan-300" size={14} />
        <span className="text-xs font-semibold">3 subtasks left</span>
      </motion.div>
    </motion.div>
  );
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, delay },
});

const Home = () => {
  const isAuthed = !!getToken();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const blob1X = useTransform(mouseX, [0, 1], [-20, 20]);
  const blob1Y = useTransform(mouseY, [0, 1], [-20, 20]);
  const blob2X = useTransform(mouseX, [0, 1], [25, -25]);
  const blob2Y = useTransform(mouseY, [0, 1], [15, -15]);

  const handleMouseMove = (e) => {
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  };

  return (
    <div className="relative" onMouseMove={handleMouseMove}>
      <AmbientBackground />
      <motion.div
        style={{ x: blob1X, y: blob1Y }}
        className="fixed top-[10%] left-[15%] w-[300px] h-[300px] bg-cyan-400/[0.06] blur-[100px] rounded-full pointer-events-none z-0"
      />
      <motion.div
        style={{ x: blob2X, y: blob2Y }}
        className="fixed bottom-[10%] right-[15%] w-[350px] h-[350px] bg-fuchsia-500/[0.05] blur-[110px] rounded-full pointer-events-none z-0"
      />

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-line/5 border border-line/10 text-muted mb-6"
        >
          Task management that doesn't feel like a chore
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          <span className="block overflow-hidden">
            {HEADLINE_TOP.map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                variants={wordVariants}
                initial="hidden"
                animate="show"
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
          </span>
          <span className="block overflow-hidden bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
            {HEADLINE_BOTTOM.map((word, i) => (
              <motion.span
                key={word}
                custom={i + HEADLINE_TOP.length}
                variants={wordVariants}
                initial="hidden"
                animate="show"
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="text-muted text-lg mt-6 max-w-xl mx-auto"
        >
          FlowSync is a focused workspace for tracking tasks, breaking them into subtasks,
          and seeing your progress in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-10"
        >
          <Link to={isAuthed ? "/tasks" : "/signup"} data-cursor-hover>
            <motion.span
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(34,211,238,0.5)" }}
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
              className="inline-block bg-line/5 hover:bg-line/10 border border-line/10 transition-colors px-7 py-3 rounded-xl font-semibold"
            >
              Learn More
            </motion.span>
          </Link>
        </motion.div>

        <PreviewCard />
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pb-16">
        <motion.p {...fadeUp()} className="text-center text-subtle text-sm uppercase tracking-[0.2em] mb-10">
          Everything you need, nothing you don't
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp(i * 0.08)}
              whileHover={{ y: -6, borderColor: "rgba(255,255,255,0.16)" }}
              className="bg-line/[0.03] backdrop-blur-lg border border-line/10 p-6 rounded-3xl"
            >
              <motion.div
                whileHover={{ rotate: -8, scale: 1.1 }}
                className="w-11 h-11 rounded-xl bg-line/5 border border-line/10 flex items-center justify-center mb-4"
              >
                {f.icon}
              </motion.div>
              <h3 className="font-semibold text-lg mb-1.5">{f.title}</h3>
              <p className="text-subtle text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-line/10 p-12 md:p-16 text-center bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-fuchsia-500/10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full border border-line/10 opacity-30"
          />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Stop juggling. Start finishing.
          </h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            It takes less than a minute to get your first task on the board.
          </p>
          <Link to={isAuthed ? "/tasks" : "/signup"} data-cursor-hover>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block bg-cyan-500 hover:bg-cyan-400 transition-colors px-8 py-3.5 rounded-xl font-bold text-black"
            >
              {isAuthed ? "Go to Tasks" : "Create Your Free Account"}
            </motion.span>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
