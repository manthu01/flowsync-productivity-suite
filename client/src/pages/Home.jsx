import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { FaListCheck, FaChartPie, FaLayerGroup, FaRotate, FaUserGroup, FaCalendarDay } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";
import AmbientBackground from "../components/AmbientBackground";
import HoloCard from "../components/HoloCard";
import { getToken } from "../services/authService";

const FEATURES = [
  {
    icon: <FaLayerGroup size={22} className="text-amber-300" />,
    title: "Tasks as collectible cards",
    desc: "Forge every task into a card. Priority sets its rarity, category its frame, mood its art: high-priority work literally shines.",
  },
  {
    icon: <FaRotate size={22} className="text-cyan-300" />,
    title: "Repeat without retyping",
    desc: "Mark a task daily, weekly or monthly. Complete it and the next one is dealt automatically, subtasks and all.",
  },
  {
    icon: <FaUserGroup size={22} className="text-fuchsia-300" />,
    title: "Share with friends, live",
    desc: "Add friends, share a task, and watch edits and ticked-off subtasks appear on their screen the moment they happen.",
  },
  {
    icon: <FaListCheck size={22} className="text-emerald-300" />,
    title: "Subtasks & progress",
    desc: "Break any task into smaller steps and watch its progress bar fill in as you check them off.",
  },
  {
    icon: <FaCalendarDay size={22} className="text-red-300" />,
    title: "Due dates that count down",
    desc: "Set a deadline in two clicks with the T-minus dial, and overdue cards flag themselves before you forget.",
  },
  {
    icon: <FaChartPie size={22} className="text-indigo-300" />,
    title: "A dashboard that tells the truth",
    desc: "Status, priority and mood breakdowns plus what's due this week, so you know where your time is actually going.",
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

// The hero's "product shot": a fanned hand of the same holo cards the Tasks page
// deals, so the homepage shows the real look. Purely decorative sample data.
const HAND = [
  {
    key: "left",
    fan: { rotate: -14, x: -170, y: 34 },
    card: {
      title: "Morning run, 5k",
      description: "Rain or shine. Mostly shine.",
      priority: "Low",
      category: "Personal",
      mood: "Chill",
      recurrence: "Daily",
      footer: ["Expires tomorrow", "#0007"],
    },
  },
  {
    key: "right",
    fan: { rotate: 14, x: 170, y: 34 },
    card: {
      title: "Rebrand moodboard",
      description: "Steal like an artist, credit like a professional.",
      priority: "Medium",
      category: "Other",
      mood: "Creative",
      shared: 2,
      footer: ["Expires Fri", "#0031"],
    },
  },
  {
    key: "center",
    fan: { rotate: 0, x: 0, y: 0 },
    card: {
      title: "Ship analytics v2",
      description: "The charts are drawn. Now make them true.",
      priority: "High",
      category: "Work",
      mood: "Grind",
      progress: [3, 5],
      footer: ["T-02 days", "#0042"],
    },
  },
];

const HeroHand = () => (
  <motion.div
    initial={{ opacity: 0, y: 60 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className="relative mx-auto mt-16 h-[330px] sm:h-[440px] max-w-3xl"
    aria-hidden="true"
  >
    <div className="absolute left-1/2 top-0 origin-top scale-[0.62] sm:scale-100">
      {HAND.map(({ key, fan, card }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, rotate: 0, x: -135, y: 40 }}
          animate={{ opacity: 1, rotate: fan.rotate, x: fan.x - 135, y: fan.y }}
          whileHover={{ y: fan.y - 28, zIndex: 5 }}
          transition={{ type: "spring", damping: 18, stiffness: 140, delay: 0.7 + i * 0.12 }}
          className="absolute top-0 left-0 w-[270px] origin-bottom"
          style={{ zIndex: key === "center" ? 3 : 1 }}
        >
          <HoloCard
            title={card.title}
            description={card.description}
            priority={card.priority}
            category={card.category}
            mood={card.mood}
            recurrence={card.recurrence}
            footer={
              <>
                <span>{card.footer[0]}</span>
                <span>{card.footer[1]}</span>
              </>
            }
          >
            {card.shared && (
              <span className="holo-chip">
                <FiUsers size={10} /> Shared with {card.shared}
              </span>
            )}
            {card.progress && (
              <div className="holo-progress">
                <div className="holo-progress-label">
                  <span>Subtasks</span>
                  <span>
                    {card.progress[0]}/{card.progress[1]}
                  </span>
                </div>
                <div className="holo-progress-track">
                  <motion.div
                    className="holo-progress-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${(card.progress[0] / card.progress[1]) * 100}%` }}
                    transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </HoloCard>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

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
          Forge your to-dos into collectible cards, share them with friends in real time,
          and watch your progress fill in as you actually get things done.
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

        <HeroHand />
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pb-16">
        <motion.p {...fadeUp()} className="text-center text-subtle text-sm uppercase tracking-[0.2em] mb-10">
          Everything you need, nothing you don't
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
