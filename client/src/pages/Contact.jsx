import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AmbientBackground from "../components/AmbientBackground";
import { sendContactMessage } from "../services/contactService";

const fieldClass =
  "p-3 rounded-xl bg-white/[0.04] border border-white/10 outline-none focus:border-cyan-400/50 transition-colors";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await sendContactMessage(form);
      toast.success("Message sent!");
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't send your message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      <AmbientBackground />

      <section className="relative z-10 max-w-xl mx-auto px-6 md:px-8 pt-20 pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-center"
        >
          Contact Us
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-zinc-400 text-center mb-10"
        >
          Found a bug, have an idea, or just want to say hi? Send it over.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white/[0.03] backdrop-blur-lg border border-white/10 p-7 rounded-3xl flex flex-col gap-4"
        >
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <p className="text-xl font-semibold mb-2">Thanks for reaching out 🎉</p>
              <p className="text-zinc-500 text-sm mb-6">We'll get back to you soon.</p>
              <button
                type="button"
                data-cursor-hover
                onClick={() => setSent(false)}
                className="text-cyan-400 hover:underline text-sm"
              >
                Send another message
              </button>
            </motion.div>
          ) : (
            <>
              <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={fieldClass}
              />
              <input
                required
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={fieldClass}
              />
              <textarea
                required
                rows={5}
                placeholder="What's on your mind?"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                className={fieldClass}
              />
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={sending}
                className="bg-cyan-500 hover:bg-cyan-400 transition-colors p-3 rounded-xl font-bold text-black disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Message"}
              </motion.button>
            </>
          )}
        </motion.form>
      </section>
    </div>
  );
};

export default Contact;
