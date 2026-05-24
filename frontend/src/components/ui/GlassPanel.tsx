import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cx } from "../../lib/format";

export function GlassPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cx("glass-panel rounded-lg", className)}
    >
      {children}
    </motion.div>
  );
}
