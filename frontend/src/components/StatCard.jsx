import { motion } from "framer-motion";
import { cx } from "../utils/format";

export default function StatCard({ icon: Icon, label, value, delta, color = "brand", index = 0 }) {
  const colors = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between">
        <div className={cx("rounded-xl p-2.5", colors[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {delta != null && (
          <span className={cx("text-xs font-semibold", delta >= 0 ? "text-brand-600" : "text-red-500")}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold text-ink-900 dark:text-white">{value}</div>
      <div className="text-sm text-ink-500">{label}</div>
    </motion.div>
  );
}
