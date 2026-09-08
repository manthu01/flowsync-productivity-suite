import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { resetPassword } from "../services/authService";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!token) {
      setError("Missing reset token");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Password reset — log in with your new password");
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.message || "Reset failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Password reset" title="Set a new password">
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
        <PasswordInput
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <PasswordInput
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />

        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          type="submit"
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-400 transition-colors p-3 rounded-xl font-bold text-black disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </motion.button>
      </form>

      <p className="text-subtle text-sm text-center mt-6">
        <Link to="/login" className="text-cyan-400 hover:underline">
          Back to Log In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
