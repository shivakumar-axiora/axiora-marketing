import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiGrid, FiUsers, FiTag, FiFilter, FiSend, FiFileText, FiImage, FiBarChart2,
  FiSettings, FiActivity, FiUserCheck, FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { cx } from "../utils/format";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: FiGrid, end: true },
  { to: "/contacts", label: "Contacts", icon: FiUsers },
  { to: "/groups", label: "Groups", icon: FiTag },
  { to: "/segments", label: "Segments", icon: FiFilter },
  { to: "/campaigns", label: "Campaigns", icon: FiSend },
  { to: "/templates", label: "Templates", icon: FiFileText },
  { to: "/media", label: "Media Library", icon: FiImage },
  { to: "/reports", label: "Reports", icon: FiBarChart2 },
  { to: "/activity", label: "Activity Logs", icon: FiActivity },
  { to: "/users", label: "User Management", icon: FiUserCheck, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: FiSettings },
];

export default function Sidebar({ open, onClose }) {
  const { hasRole } = useAuth();
  const items = NAV.filter((n) => !n.roles || n.roles.some((r) => hasRole(r)));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-100 bg-white transition-transform dark:border-slate-700 dark:bg-slate-800 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
              <FiSend className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-ink-900 dark:text-white">Axiora</div>
              <div className="text-[11px] text-ink-500">Omnichannel Marketing</div>
            </div>
          </div>
          <button className="btn-ghost p-1.5 lg:hidden" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => cx("nav-link", isActive && "nav-link-active")}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span layoutId="side-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <p className="text-sm font-semibold">Official Provider APIs</p>
          <p className="mt-1 text-xs text-white/80">
            Powered by the WhatsApp Business Platform and Resend. Configure your channels in Settings.
          </p>
        </div>
      </aside>
    </>
  );
}
