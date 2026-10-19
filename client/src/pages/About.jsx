import { motion } from "framer-motion";
import AmbientBackground from "../components/AmbientBackground";

const VALUES = [
  {
    title: "Built for follow-through",
    desc: "Most task apps are great at collecting to-dos and bad at helping you finish them. FlowSync leans into progress: subtasks with live progress bars, repeating tasks that come back on their own, and a dashboard that shows what's actually moving.",
  },
  {
    title: "Fun to use, on purpose",
    desc: "Every task is a collectible card. Priority sets its rarity, category its frame, mood its art, and a legendary card actually shines. If your list looks good, you'll open it more often.",
  },
  {
    title: "Your data, secured properly",
    desc: "Passwords are hashed with bcrypt and never stored in plain text, so not even we can see them. Tasks are private to you unless you share them with a friend, and only the owner can delete a shared task.",
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
        className="text-muted text-lg leading-relaxed mb-14"
      >
        FlowSync is a full-stack task management platform built to make personal productivity
        feel less like admin work and more like actual progress. It started as a simple
        CRUD to-do list and grew into a real workspace: authentication, analytics,
        categories and subtasks, then friends and live task sharing, and now collectible
        task cards with moods and repeating tasks.
      </motion.p>

      <div className="flex flex-col gap-8">
        {VALUES.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="bg-line/[0.03] backdrop-blur-lg border border-line/10 p-7 rounded-3xl"
          >
            <h2 className="text-xl font-semibold mb-2">{v.title}</h2>
            <p className="text-subtle leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  </div>
);

export default About;
