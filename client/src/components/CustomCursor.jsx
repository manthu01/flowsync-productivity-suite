import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, [role='button'], [data-cursor-hover], .cursor-hover";

// Same query as the `cursor: none` rule in index.css: only take over the cursor for a
// precise pointer, and leave the native one alone under prefers-reduced-motion.
const CURSOR_QUERY = "(pointer: fine) and (prefers-reduced-motion: no-preference)";

const IDLE_SIZE = 26;
const LOCK_PADDING = 6;
const SPRING = { damping: 30, stiffness: 400, mass: 0.5 };

const CORNERS = [
  "top-0 left-0 border-t-2 border-l-2",
  "top-0 right-0 border-t-2 border-r-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "bottom-0 right-0 border-b-2 border-r-2",
];

const CustomCursor = () => {
  const [enabled] = useState(() => window.matchMedia(CURSOR_QUERY).matches);
  const reduceMotion = useReducedMotion();
  const [locked, setLocked] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const lockRef = useRef(null);
  const wasLockedRef = useRef(false);
  const rippleId = useRef(0);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  // Bracket box: center + size, follows the pointer or wraps the hovered element
  const boxX = useMotionValue(-100);
  const boxY = useMotionValue(-100);
  const boxW = useMotionValue(IDLE_SIZE);
  const boxH = useMotionValue(IDLE_SIZE);
  const rotate = useMotionValue(0);
  const springX = useSpring(boxX, SPRING);
  const springY = useSpring(boxY, SPRING);
  const springW = useSpring(boxW, SPRING);
  const springH = useSpring(boxH, SPRING);

  useEffect(() => {
    if (!enabled) return;

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    const over = (e) => {
      const el = e.target.closest?.(INTERACTIVE_SELECTOR) ?? null;
      lockRef.current = el;
      setLocked(!!el);
    };
    const leaveWindow = (e) => {
      if (!e.relatedTarget) {
        lockRef.current = null;
        setLocked(false);
      }
    };

    const down = (e) => {
      setPressed(true);
      if (reduceMotion) return;
      const id = ++rippleId.current;
      setRipples((list) => [...list, { id, x: e.clientX, y: e.clientY }]);
    };
    const up = () => setPressed(false);

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", leaveWindow);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", leaveWindow);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [x, y, enabled, reduceMotion]);

  useAnimationFrame((_, delta) => {
    if (!enabled) return;
    const el = lockRef.current;

    if (el && el.isConnected) {
      // Re-measure every frame so the lock follows scrolling and layout shifts
      const r = el.getBoundingClientRect();
      boxX.set(r.left + r.width / 2);
      boxY.set(r.top + r.height / 2);
      boxW.set(r.width + LOCK_PADDING * 2);
      boxH.set(r.height + LOCK_PADDING * 2);

      // The idle box is square, so dropping whole quarter-turns is invisible;
      // this keeps the snap to 0deg short instead of turning a wide box sideways
      if (!wasLockedRef.current) rotate.set((((rotate.get() % 90) + 135) % 90) - 45);
      rotate.set(rotate.get() * (reduceMotion ? 0 : 0.75));
      wasLockedRef.current = true;
    } else {
      boxX.set(x.get());
      boxY.set(y.get());
      boxW.set(IDLE_SIZE);
      boxH.set(IDLE_SIZE);
      if (!reduceMotion) rotate.set(rotate.get() + delta * 0.12);
      wasLockedRef.current = false;
    }
  });

  if (!enabled) return null;

  // Portaled to <body> so it stacks above everything: #root is its own stacking
  // context (z-index: 1), so overlays portaled to <body> (TaskModal) would
  // otherwise cover the cursor no matter how high its z-index is.
  return createPortal(
    <>
      {/* Tight dot, follows exactly */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full bg-cyan-300 mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: locked ? 5 : 4, height: locked ? 5 : 4, opacity: pressed ? 0.5 : 1 }}
        transition={{ duration: 0.15 }}
      />
      {/* Corner brackets: spin while idle, snap square and lock onto interactive elements */}
      <motion.div
        className={`fixed top-0 left-0 z-[9998] pointer-events-none transition-colors duration-200 ${
          locked ? "text-fuchsia-400" : "text-cyan-300"
        }`}
        style={{
          x: reduceMotion ? boxX : springX,
          y: reduceMotion ? boxY : springY,
          width: reduceMotion ? boxW : springW,
          height: reduceMotion ? boxH : springH,
          translateX: "-50%",
          translateY: "-50%",
          rotate,
        }}
        animate={{ scale: pressed ? 0.9 : 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {CORNERS.map((pos) => (
          <span key={pos} className={`absolute w-2.5 h-2.5 border-current ${pos}`} />
        ))}
      </motion.div>
      {/* Click ripples */}
      {ripples.map((r) => (
        <motion.div
          key={r.id}
          className="fixed z-[9997] pointer-events-none rounded-full border-2 border-fuchsia-400"
          style={{ left: r.x, top: r.y, width: 90, height: 90, x: "-50%", y: "-50%" }}
          initial={{ scale: 0.15, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          onAnimationComplete={() => setRipples((list) => list.filter((item) => item.id !== r.id))}
        />
      ))}
    </>,
    document.body
  );
};

export default CustomCursor;
