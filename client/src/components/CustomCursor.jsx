import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, [role='button'], [data-cursor-hover], .cursor-hover";

const CustomCursor = () => {
  const [enabled] = useState(() => window.matchMedia("(pointer: fine)").matches);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { damping: 28, stiffness: 320, mass: 0.4 });
  const ringY = useSpring(y, { damping: 28, stiffness: 320, mass: 0.4 });

  useEffect(() => {
    if (!enabled) return;

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    const over = (e) => {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) setHovering(true);
    };
    const out = (e) => {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) setHovering(false);
    };

    const down = () => setPressed(true);
    const up = () => setPressed(false);

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [x, y, enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Tight dot, follows exactly */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full bg-cyan-300 mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: hovering ? 6 : 8, height: hovering ? 6 : 8, opacity: pressed ? 0.5 : 1 }}
        transition={{ duration: 0.15 }}
      />
      {/* Trailing ring, springs behind */}
      <motion.div
        className="fixed top-0 left-0 z-[9998] pointer-events-none rounded-full border border-cyan-300/70"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: hovering ? 52 : 28,
          height: hovering ? 52 : 28,
          opacity: hovering ? 0.9 : 0.5,
          scale: pressed ? 0.85 : 1,
          borderColor: hovering ? "rgba(232,121,249,0.8)" : "rgba(34,211,238,0.6)",
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      />
    </>
  );
};

export default CustomCursor;
