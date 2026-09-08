import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import CustomCursor from "./components/CustomCursor";
import PageTransition from "./components/PageTransition";
import { useTheme } from "./context/ThemeContext";
import { getToken, updateStoredUser } from "./services/authService";
import { getProfile } from "./services/profileService";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Tasks from "./pages/Tasks";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/about"
            element={
              <PageTransition>
                <About />
              </PageTransition>
            }
          />
          <Route
            path="/contact"
            element={
              <PageTransition>
                <Contact />
              </PageTransition>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Tasks />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Profile />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Friends />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <PageTransition>
                  <AdminDashboard />
                </PageTransition>
              </AdminRoute>
            }
          />
        </Route>

        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/signup"
          element={
            <PageTransition>
              <Signup />
            </PageTransition>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PageTransition>
              <VerifyEmail />
            </PageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransition>
              <ForgotPassword />
            </PageTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { theme, setThemeFromServer } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    // On a fresh page load with an existing session, pull the latest profile so the
    // navbar avatar and theme reflect whatever was last saved on another device/tab.
    if (!getToken()) return;

    getProfile()
      .then((profile) => {
        updateStoredUser({
          name: profile.name,
          username: profile.username,
          avatar_url: profile.avatar_url,
          is_admin: profile.is_admin,
        });
        setThemeFromServer(profile.theme);
      })
      .catch(() => {});
  }, [setThemeFromServer]);

  return (
    <BrowserRouter>
      <CustomCursor />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? "#0a0a0c" : "#ffffff",
            color: isDark ? "#fff" : "#18181b",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
            borderRadius: "12px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#22d3ee", secondary: isDark ? "#0a0a0c" : "#ffffff" } },
          error: { iconTheme: { primary: "#f87171", secondary: isDark ? "#0a0a0c" : "#ffffff" } },
        }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
