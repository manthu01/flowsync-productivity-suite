import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomCursor from "./components/CustomCursor";
import PageTransition from "./components/PageTransition";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Tasks from "./pages/Tasks";
import Dashboard from "./pages/Dashboard";
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
  return (
    <BrowserRouter>
      <CustomCursor />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0a0a0c",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#22d3ee", secondary: "#0a0a0c" } },
          error: { iconTheme: { primary: "#f87171", secondary: "#0a0a0c" } },
        }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
