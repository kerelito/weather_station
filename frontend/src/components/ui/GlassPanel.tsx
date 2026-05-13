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
      transition={{ duration: 0.35 }}
      className={cx("glass-panel mesh-border rounded-[28px]", className)}
    >
      {children}
    </motion.div>
  );
}
