import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="relative z-10 border-t border-line/10 mt-20">
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="col-span-2 md:col-span-1">
        <h3 className="text-lg font-extrabold tracking-tight mb-2">FlowSync</h3>
        <p className="text-subtle text-sm leading-relaxed">
          A focused space to plan, track, and actually finish what you set out to do.
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Product
        </h4>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link to="/" data-cursor-hover className="text-subtle hover:text-fg transition-colors">
              Home
            </Link>
          </li>
          <li>
            <Link to="/tasks" data-cursor-hover className="text-subtle hover:text-fg transition-colors">
              Tasks
            </Link>
          </li>
          <li>
            <Link to="/dashboard" data-cursor-hover className="text-subtle hover:text-fg transition-colors">
              Dashboard
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Company
        </h4>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link to="/about" data-cursor-hover className="text-subtle hover:text-fg transition-colors">
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" data-cursor-hover className="text-subtle hover:text-fg transition-colors">
              Contact Us
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Account
        </h4>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link to="/login" data-cursor-hover className="text-subtle hover:text-fg transition-colors">
              Log In
            </Link>
          </li>
          <li>
            <Link to="/signup" data-cursor-hover className="text-subtle hover:text-fg transition-colors">
              Sign Up
            </Link>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-line/10 py-6 px-6 md:px-8 text-center text-subtle text-xs">
      &copy; {new Date().getFullYear()} FlowSync. Built for people who actually finish their lists.
    </div>
  </footer>
);

export default Footer;
