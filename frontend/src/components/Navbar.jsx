import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiBell, FiSun, FiMoon, FiLogOut, FiUser, FiChevronDown } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { notificationsApi, searchApi } from "../services/endpoints";
import { initials, prettyRole, timeAgo, cx } from "../utils/format";

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [openMenu, setOpenMenu] = useState(null); // 'notif' | 'user' | 'search'
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const ref = useRef();

  const loadNotifs = async () => {
    try {
      const [n, c] = await Promise.all([notificationsApi.list(), notificationsApi.unreadCount()]);
      setNotifs(n.data);
      setUnread(c.data.count);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpenMenu(null); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!q.trim()) { setResults(null); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await searchApi.query(q);
        setResults(data);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const markAllRead = async () => {
    await notificationsApi.readAll();
    loadNotifs();
  };

  const goto = (type, id) => {
    const routes = { contacts: "/contacts", campaigns: `/campaigns/${id}`, templates: "/templates", groups: "/groups" };
    navigate(routes[type] || "/");
    setQ("");
    setResults(null);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/80 px-4 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80 lg:px-6" ref={ref}>
      <button className="btn-ghost p-2 lg:hidden" onClick={onMenu}>
        <FiMenu className="h-5 w-5" />
      </button>

      {/* Global Search */}
      <div className="relative hidden max-w-md flex-1 sm:block">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search contacts, campaigns, templates…"
          className="input pl-10"
        />
        {results && (
          <div className="absolute mt-2 w-full overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card dark:border-slate-700 dark:bg-slate-800">
            {["contacts", "campaigns", "templates", "groups"].map((type) =>
              results[type]?.length ? (
                <div key={type} className="border-b border-ink-100 last:border-0 dark:border-slate-700">
                  <div className="bg-ink-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500 dark:bg-slate-700/50">
                    {type}
                  </div>
                  {results[type].map((r) => (
                    <button key={`${type}-${r.id}`} onClick={() => goto(type, r.id)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-ink-50 dark:hover:bg-slate-700">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-ink-500">{r.sub}</span>
                    </button>
                  ))}
                </div>
              ) : null
            )}
            {["contacts", "campaigns", "templates", "groups"].every((t) => !results[t]?.length) && (
              <div className="px-4 py-6 text-center text-sm text-ink-500">No results for "{q}"</div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button className="btn-ghost p-2.5" onClick={toggle} title="Toggle theme">
          {theme === "dark" ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="btn-ghost relative p-2.5" onClick={() => setOpenMenu(openMenu === "notif" ? null : "notif")}>
            <FiBell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {openMenu === "notif" && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold">Notifications</span>
                <button className="text-xs text-brand-600 hover:underline" onClick={markAllRead}>Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 && <div className="px-4 py-8 text-center text-sm text-ink-500">You're all caught up 🎉</div>}
                {notifs.map((n) => (
                  <div key={n.id} className={cx("border-t border-ink-100 px-4 py-3 dark:border-slate-700", !n.is_read && "bg-brand-50/40 dark:bg-brand-500/5")}>
                    <div className="text-sm font-medium">{n.title}</div>
                    {n.body && <div className="text-xs text-ink-500">{n.body}</div>}
                    <div className="mt-0.5 text-[11px] text-ink-400">{timeAgo(n.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button className="flex items-center gap-2 rounded-xl p-1.5 pr-2.5 hover:bg-ink-100 dark:hover:bg-slate-700"
            onClick={() => setOpenMenu(openMenu === "user" ? null : "user")}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {initials(user?.full_name)}
              </div>
            )}
            <div className="hidden text-left leading-tight sm:block">
              <div className="text-sm font-semibold">{user?.full_name}</div>
              <div className="text-[11px] text-ink-500">{prettyRole(user?.role?.name)}</div>
            </div>
            <FiChevronDown className="hidden h-4 w-4 text-ink-500 sm:block" />
          </button>
          {openMenu === "user" && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-ink-100 bg-white py-1 shadow-card dark:border-slate-700 dark:bg-slate-800">
              <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-ink-50 dark:hover:bg-slate-700"
                onClick={() => { navigate("/profile"); setOpenMenu(null); }}>
                <FiUser className="h-4 w-4" /> My Profile
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={async () => { await logout(); toast.success("Logged out"); navigate("/login"); }}>
                <FiLogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
