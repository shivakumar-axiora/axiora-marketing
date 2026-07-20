import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiChevronLeft, FiChevronRight, FiSearch, FiInbox, FiAlertTriangle } from "react-icons/fi";
import { cx } from "../utils/format";

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx("card p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function Spinner({ className }) {
  return (
    <div
      className={cx(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center text-brand-500">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx("skeleton h-4 w-full", className)} />;
}

export function Badge({ color = "gray", children, className }) {
  const map = {
    gray: "bg-ink-100 text-ink-700 dark:bg-slate-700 dark:text-ink-100",
    green: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  };
  return <span className={cx("badge", map[color], className)}>{children}</span>;
}

export function EmptyState({ icon: Icon = FiInbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 py-16 text-center dark:border-slate-700">
      <div className="mb-3 rounded-full bg-ink-100 p-4 text-ink-500 dark:bg-slate-700">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search…", className }) {
  return (
    <div className={cx("relative", className)}>
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = "md" }) {
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className={cx("card relative z-10 w-full p-0", sizes[size])}
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="btn-ghost -mr-2 p-2">
                <FiX />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Confirm", danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <div className={cx("rounded-full p-2", danger ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500")}>
          <FiAlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-ink-700 dark:text-ink-200">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button className="btn-secondary px-3 py-2" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <FiChevronLeft />
      </button>
      <span className="text-sm text-ink-500">
        Page <b className="text-ink-900 dark:text-white">{page}</b> of {pages}
      </span>
      <button className="btn-secondary px-3 py-2" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        <FiChevronRight />
      </button>
    </div>
  );
}

export function ProgressBar({ value = 0, color = "bg-brand-500", className }) {
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-slate-700", className)}>
      <motion.div
        className={cx("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.6 }}
      />
    </div>
  );
}

export function CircularProgress({ value = 0, size = 96, stroke = 8, label, color = "#25D366" }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" className="text-ink-100 dark:text-slate-700" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold">{Math.round(value)}%</span>
        {label && <span className="text-[11px] text-ink-500">{label}</span>}
      </div>
    </div>
  );
}

export function Tooltip({ label, children }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25 },
};
