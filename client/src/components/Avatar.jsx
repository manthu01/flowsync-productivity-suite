// Shared avatar circle: shows the uploaded picture, or falls back to the user's
// first initial on a cyan accent circle when they haven't set one.
const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-24 h-24 text-3xl",
};

const Avatar = ({ src, name, size = "md", className = "" }) => {
  const initial = name?.trim()?.[0]?.toUpperCase() || "?";
  const sizeClasses = SIZES[size] || SIZES.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s avatar` : "Avatar"}
        className={`${sizeClasses} rounded-full object-cover border border-line/10 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center border border-line/10 ${className}`}
    >
      {initial}
    </div>
  );
};

export default Avatar;
