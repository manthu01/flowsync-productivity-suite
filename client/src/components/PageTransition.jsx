import { motion } from "framer-motion";

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="page-transition-wrapper"
  >
    {children}
  </motion.div>
);

export default PageTransition;
