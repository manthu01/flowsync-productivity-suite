import { motion } from "framer-motion";
import AmbientBackground from "../components/AmbientBackground";

const VALUES = [
  {
    title: "Built for follow-through",
    desc: "Most task apps are great at collecting to-dos and bad at helping you finish them. FlowSync leans into progress — subtasks, completion percentages, and a dashboard that shows what's actually moving.",
  },
  {
    title: "No noise, no bloat",
    desc: "No workspaces-within-workspaces, no forty settings panels. Categories, priorities, due dates, and subtasks — the things that matter when you're actually working.",
  },
  {
    title: "Your data, secured properly",
    desc: "Passwords are hashed, never stored in plain text. Accounts are verified by email before they can sign in, and every task is scoped strictly to its owner.",
  },
];

const About = () => (
  <div className="relative">
    <AmbientBackground />

    <section className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 pt-20 pb-24">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6"
      >
        About FlowSync
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-zinc-400 text-lg leading-relaxed mb-14"
      >
        FlowSync is a full-stack task management platform built to make personal productivity
        feel less like admin work and more like actual progress. It started as a simple
        CRUD to-do list and grew into a real workspace — authentication, analytics,
        categorization, and now subtasks with live progress tracking.
      </motion.p>

      <div className="flex flex-col gap-8">
        {VALUES.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="bg-white/[0.03] backdrop-blur-lg border border-white/10 p-7 rounded-3xl"
          >
            <h2 className="text-xl font-semibold mb-2">{v.title}</h2>
            <p className="text-zinc-500 leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  </div>
);

export default About;
