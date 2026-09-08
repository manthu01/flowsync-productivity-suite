import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

// Drop-in replacement for <input type="password">, with a show/hide toggle.
const PasswordInput = ({ className = "", ...rest }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={`w-full p-3 pr-11 rounded-xl bg-line/[0.04] border border-line/10 outline-none focus:border-cyan-400/50 transition-colors ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle hover:text-fg transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  );
};

export default PasswordInput;
