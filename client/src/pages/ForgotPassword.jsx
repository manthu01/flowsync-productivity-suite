import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiMail } from "react-icons/fi";
import { forgotPassword } from "../services/authService";
import AuthLayout from "../components/AuthLayout";

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

  if (sent) {
    return (
      <AuthLayout eyebrow="Password reset" title="Check your inbox 📬">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-2"
        >
          <p className="text-muted text-sm leading-relaxed mb-6">
            If <span className="text-fg">{email}</span> is registered, we've sent a
            password reset link.
          </p>
          <Link to="/login" className="text-cyan-400 hover:underline text-sm">
            Back to Log In
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Password reset" title="Forgot password?" subtitle="We'll email you a reset link">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 pl-10 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors"
          />
        </div>

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

      <p className="text-subtle text-sm text-center mt-6">
        Remembered it?{" "}
        <Link to="/login" className="text-cyan-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
