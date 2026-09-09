import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingAdminButton from "./FloatingAdminButton";

const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <FloatingAdminButton />
  </div>
);

export default Layout;
