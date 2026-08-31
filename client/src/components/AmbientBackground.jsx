const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="glow-blob absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full" />
      <div
        className="glow-blob absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] bg-indigo-600/10 blur-[150px] rounded-full"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="glow-blob absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-fuchsia-500/5 blur-[130px] rounded-full"
        style={{ animationDelay: "6s" }}
      />
    </div>
  );
};

export default AmbientBackground;
