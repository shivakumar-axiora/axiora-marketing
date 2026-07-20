import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiSend, FiCheck, FiSun, FiMoon, FiUsers, FiCalendar, FiBarChart2,
  FiShield, FiImage, FiLayers, FiZap, FiTrendingUp, FiArrowLeft,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { cx } from "../utils/format";

const FEATURES = [
  { icon: FiSend, label: "Bulk Messaging" },
  { icon: FiUsers, label: "Contact Segmentation" },
  { icon: FiCalendar, label: "Campaign Scheduling" },
  { icon: FiZap, label: "Official Cloud API" },
  { icon: FiTrendingUp, label: "Delivery Tracking" },
  { icon: FiBarChart2, label: "Analytics & Reports" },
  { icon: FiImage, label: "Media Support" },
  { icon: FiLayers, label: "Templates" },
];

const TRUST = [
  "Official WhatsApp Business API",
  "Enterprise Security",
  "GDPR Ready",
  "99.9% Uptime",
];

const FOOTER_LINKS = ["Privacy Policy", "Terms of Service", "Documentation", "Support", "Status"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

/* Floating glass stat card used around the mockup */
function StatCard({ label, value, className, delay = 0, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 160, damping: 16 }}
      className={cx("absolute", className)}
    >
      <div className="animate-float rounded-2xl bg-white/95 px-4 py-3 shadow-premium ring-1 ring-black/5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div>
            <div className="text-[11px] font-medium text-ink-500">{label}</div>
            <div className="text-lg font-extrabold leading-none text-ink-900">{value}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* WhatsApp-style phone + campaign mockup */
function HeroMockup() {
  const bubbles = [
    { me: false, text: "Hi Priya! 🎉 Your exclusive 20% Diwali offer is live.", t: "10:24" },
    { me: true, text: "That's amazing! How do I claim it?", t: "10:25" },
    { me: false, text: "Just reply YES and we'll send your code instantly.", t: "10:25" },
    { me: true, text: "YES ✅", t: "10:26" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, type: "spring", stiffness: 90, damping: 18 }}
      className="relative mx-auto mt-2 w-full max-w-sm"
    >
      <div className="animate-float-slow">
        <div className="mx-auto w-64 rounded-[2.2rem] border-[6px] border-black/80 bg-[#ECE5DD] shadow-premium">
          {/* Phone header */}
          <div className="flex items-center gap-2.5 rounded-t-[1.7rem] bg-brand-gradient px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">A</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Axiora Business</div>
              <div className="text-[10px] text-white/80">online</div>
            </div>
          </div>
          {/* Chat */}
          <div className="space-y-2 px-3 py-4">
            {bubbles.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.25 }}
                className={cx("flex", b.me ? "justify-end" : "justify-start")}
              >
                <div
                  className={cx(
                    "max-w-[80%] rounded-2xl px-3 py-1.5 text-[11px] shadow-sm",
                    b.me ? "rounded-br-sm bg-[#DCF8C6] text-ink-900" : "rounded-bl-sm bg-white text-ink-900"
                  )}
                >
                  {b.text}
                  <div className="mt-0.5 text-right text-[8px] text-ink-400">
                    {b.t} {b.me && <FiCheck className="ml-0.5 inline h-2.5 w-2.5 text-brand-500" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating stats */}
      <StatCard label="Messages Sent" value="542,000+" icon={FiSend} delay={0.9} className="-left-6 top-6 sm:-left-10" />
      <StatCard label="Delivery Rate" value="98.7%" icon={FiTrendingUp} delay={1.1} className="-right-4 top-28 sm:-right-8" />
      <StatCard label="Businesses" value="1,200+" icon={FiUsers} delay={1.3} className="-left-2 bottom-2 sm:-left-6" />
    </motion.div>
  );
}

export default function AuthLayout({ children, title, subtitle, backTo = "/", backLabel = "Back to home" }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-50 dark:bg-ink-900 lg:grid lg:grid-cols-2">
      {/* ============ LEFT · HERO ============ */}
      <motion.aside
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="relative hidden bg-brand-gradient text-white lg:block lg:overflow-y-auto"
      >
        {/* Ambient light effects (clipped to panel) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-80 w-80 animate-blob rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 animate-blob rounded-full bg-emerald-200/20 blur-3xl" style={{ animationDelay: "3s" }} />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col gap-6 p-8 xl:p-12">
          {/* Logo — navigates to the landing page */}
          <Link to="/" className="flex w-fit items-center gap-3 transition hover:opacity-90" aria-label="Go to home">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 shadow-lg backdrop-blur">
              <FiSend className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <div className="text-2xl font-extrabold tracking-tight">Axiora</div>
              <div className="text-[11px] font-medium text-white/80">Official WhatsApp Marketing Platform</div>
            </div>
          </Link>

          {/* Copy */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.h1 variants={item} className="max-w-lg font-display text-4xl font-extrabold leading-[1.1]">
              Grow your business with smart WhatsApp marketing
            </motion.h1>
            <motion.p variants={item} className="mt-4 max-w-md text-sm text-white/85">
              Launch personalized campaigns, schedule messages, manage contacts, and track delivery — all through the official WhatsApp Business Cloud API.
            </motion.p>

            <motion.div variants={item} className="mt-6 grid max-w-lg grid-cols-2 gap-x-6 gap-y-2.5">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="group flex items-center gap-2.5 text-sm text-white/90">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-white/15 transition group-hover:scale-110 group-hover:bg-white/30">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {label}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Mockup + floating stats */}
          <div className="flex flex-1 items-center justify-center py-4">
            <HeroMockup />
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-xs text-white/80">
            {TRUST.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <FiCheck className="h-3.5 w-3.5" /> {t}
              </span>
            ))}
          </div>
        </div>
      </motion.aside>

      {/* ============ RIGHT · AUTH ============ */}
      <div className="relative flex min-h-screen flex-col px-5 py-8 sm:px-8">
        {/* Ambient glow (light mode) */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />

        {/* Top bar: back button + theme toggle */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white/70 px-3 py-2 text-sm font-medium text-ink-600 backdrop-blur transition hover:text-ink-900 hover:shadow-card dark:border-slate-700 dark:bg-slate-800/70 dark:text-ink-200 dark:hover:text-white"
          >
            <FiArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white/70 text-ink-500 backdrop-blur transition hover:text-ink-900 hover:shadow-card dark:border-slate-700 dark:bg-slate-800/70 dark:hover:text-white"
          >
            {theme === "dark" ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
        </div>

        {/* Card */}
        <div className="relative z-10 flex flex-1 items-start justify-center pt-10 sm:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="w-full max-w-[440px]"
          >
            {/* Mobile brand — navigates to the landing page */}
            <Link to="/" className="mb-8 flex w-fit items-center gap-3 transition hover:opacity-90 lg:hidden" aria-label="Go to home">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-white shadow-brand-glow">
                <FiSend className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="text-lg font-extrabold text-ink-900 dark:text-white">Axiora</div>
                <div className="text-[11px] text-ink-500">WhatsApp Marketing Platform</div>
              </div>
            </Link>

            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="glass-card rounded-3xl p-7 shadow-premium sm:p-9"
            >
              <h2 className="font-display text-2xl font-extrabold text-ink-900 dark:text-white">{title}</h2>
              {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
              <div className="mt-7">{children}</div>
            </motion.div>

            {/* Footer */}
            <div className="mt-8 space-y-3 text-center">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
                {FOOTER_LINKS.map((l) => (
                  <a key={l} href="#" className="link-underline transition hover:text-ink-900 dark:hover:text-white">{l}</a>
                ))}
              </div>
              <p className="text-xs text-ink-400">
                © {new Date().getFullYear()}{" "}
                <Link to="/" className="font-medium transition hover:text-brand-600 dark:hover:text-brand-400">Axiora Global Solutions</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
