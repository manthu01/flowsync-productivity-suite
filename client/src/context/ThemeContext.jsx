import { createContext, useContext, useEffect, useState } from "react";
import { getToken } from "../services/authService";
import { updateTheme as pushThemeToServer } from "../services/profileService";

const STORAGE_KEY = "flowsync_theme";
const ThemeContext = createContext(null);

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  } catch {
    return "dark";
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode, etc.) — theme still applies for this load
    }
  }, [theme]);

  // Applies a theme the server already has on file (e.g. right after login) without
  // writing it straight back — avoids a pointless round trip of what the server just sent us.
  const setThemeFromServer = (value) => {
    if (value === "light" || value === "dark") setThemeState(value);
  };

  const setTheme = (value) => {
    setThemeState(value);
    if (getToken()) {
      pushThemeToServer(value).catch(() => {});
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, setThemeFromServer }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Co-locating the hook with its Provider is the standard context pattern; splitting
// into a second file for fast-refresh purity isn't worth the indirection here.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
