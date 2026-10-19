// Applied before anything renders so there's no flash of the wrong theme on load.
// ThemeContext takes over (and keeps this in sync) once React mounts. Lives in its
// own file rather than inline so the Content-Security-Policy can forbid inline scripts.
(function () {
  try {
    var stored = localStorage.getItem("flowsync_theme");
    document.documentElement.setAttribute("data-theme", stored === "light" ? "light" : "dark");
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
