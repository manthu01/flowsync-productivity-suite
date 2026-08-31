import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { forgotPassword } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white p-6 relative">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative z-10 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
      >
        <h1 className="text-3xl font-extrabold mb-1 text-center tracking-tight">FlowSync</h1>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <p className="text-lg font-semibold mb-2">Check your inbox 📬</p>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              If <span className="text-white">{email}</span> is registered, we've sent a
              password reset link.
            </p>
            <Link to="/login" className="text-cyan-400 hover:underline text-sm">
              Back to Log In
            </Link>
          </motion.div>
        ) : (
          <>
            <p className="text-zinc-500 text-sm text-center mb-8">
              We'll email you a reset link
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="p-3 rounded-xl bg-white/[0.04] border border-white/10 outline-none focus:border-cyan-400/50 transition-colors"
              />

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-400 transition-colors p-3 rounded-xl font-bold text-black disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </motion.button>
            </form>

            <p className="text-zinc-500 text-sm text-center mt-6">
              Remembered it?{" "}
              <Link to="/login" className="text-cyan-400 hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
