import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { signup } from "../services/authService";
import AmbientBackground from "../components/AmbientBackground";

const Signup = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup({ name, username, email, password });
      toast.success("Account created — check your email to verify");
      setSubmittedEmail(email);
    } catch (err) {
      const message = err.response?.data?.message || "Signup failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-fg p-6 relative">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm bg-line/[0.03] backdrop-blur-xl border border-line/10 p-8 rounded-3xl relative z-10 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
      >
        <h1 className="text-3xl font-extrabold mb-1 text-center tracking-tight">
          FlowSync
        </h1>

        {submittedEmail ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <p className="text-lg font-semibold mb-2">Check your inbox 📬</p>
            <p className="text-muted text-sm leading-relaxed mb-6">
              We sent a verification link to <span className="text-fg">{submittedEmail}</span>.
              Verify your email, then log in.
            </p>
            <Link to="/login" className="text-cyan-400 hover:underline text-sm">
              Go to Log In
            </Link>
          </motion.div>
        ) : (
          <>
            <p className="text-subtle text-sm text-center mb-8">
              Create your workspace
            </p>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl mb-4 border border-red-500/20"
              >
                {error}
              </motion.p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
              />

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                title="Letters, numbers, and underscores only"
                className="p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="p-3 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
              />

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-400 transition-colors p-3 rounded-xl font-bold text-black disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </motion.button>
            </form>

            <p className="text-subtle text-sm text-center mt-6">
              Already have an account?{" "}
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

export default Signup;
