import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { CATEGORY_META, MOOD_META, RARITY } from "../utils/categoryColors";

const RARITY_LEVEL = { Low: 0, Medium: 1, High: 2 };

// A task rendered as a collectible card: category sets the frame color and art glyph,
// mood paints the art pattern, priority sets the rarity (Legendary gets the rainbow
// foil), and a repeating task wears a ↻ badge. Tilts toward the pointer, with the
// foil sheen following it via the --mx/--my custom properties.
const HoloCard = ({
  title,
  description,
  priority = "Medium",
  category = "Other",
  mood = "Chill",
  recurrence = "None",
  footer,
  className = "",
  children,
}) => {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  const cat = CATEGORY_META[category] || CATEGORY_META.Other;
  const moodMeta = MOOD_META[mood] || MOOD_META.Chill;
  const level = RARITY_LEVEL[priority] ?? 1;

  const handleMove = (e) => {
    if (reduceMotion) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * 16).toFixed(1)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * 20).toFixed(1)}deg`);
    el.style.setProperty("--mx", `${Math.round(px * 100)}%`);
    el.style.setProperty("--my", `${Math.round(py * 100)}%`);
  };

  const handleLeave = () => {
    ref.current.style.removeProperty("--rx");
    ref.current.style.removeProperty("--ry");
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`holo holo-r${level} ${className}`}
      style={{ "--tc": cat.hex, "--mc": moodMeta.hex }}
    >
      <div className="holo-top">
        <h3 className="holo-name">{title || "Untitled task"}</h3>
        {recurrence && recurrence !== "None" && <span className="holo-rep">↻ {recurrence}</span>}
      </div>

      <div className="holo-art" data-mood={mood}>
        <b>{cat.glyph}</b>
      </div>

      <div className="holo-type">
        <span className="holo-mood">
          {category} · {moodMeta.glyph} {mood}
        </span>
        <span className="holo-rar">{RARITY[priority] || "Rare"}</span>
      </div>

      <p className="holo-flav">{description ? `“${description}”` : ""}</p>

      {children}

      {footer && <div className="holo-foot">{footer}</div>}
      <div className="holo-foil" />
    </div>
  );
};

export default HoloCard;
