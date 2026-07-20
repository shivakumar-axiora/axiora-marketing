import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight, FiPlay, FiCheck, FiTrendingUp, FiSend, FiUsers, FiMail, FiGrid, FiZap,
} from "react-icons/fi";
import { Eyebrow, GradientText } from "./primitives";
import { cx } from "../../utils/format";

const MODULES = [
  { key: "dashboard", icon: FiGrid, label: "Dashboard" },
  { key: "contacts", icon: FiUsers, label: "Contacts" },
  { key: "whatsapp", icon: FiSend, label: "WhatsApp" },
  { key: "email", icon: FiMail, label: "Email" },
  { key: "automation", icon: FiZap, label: "Automation" },
];

function FloatCard({ className, icon: Icon, label, value, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 160, damping: 15 }}
      className={cx("absolute z-20", className)}
    >
      <div className="animate-float rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-premium backdrop-blur dark:border-white/10 dark:bg-slate-800/90">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[11px] font-medium text-ink-500">{label}</div>
            <div className="text-base font-extrabold leading-none text-ink-900 dark:text-white">{value}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
      {/* Background glow + shapes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -right-20 top-40 h-72 w-72 animate-blob rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -left-20 top-64 h-72 w-72 animate-blob rounded-full bg-teal-400/10 blur-3xl" style={{ animationDelay: "4s" }} />
        <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.25) 1px, transparent 0)", backgroundSize: "32px 32px", maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)" }} />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        {/* Copy */}
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Eyebrow><span className="flex h-1.5 w-1.5 rounded-full bg-brand-500" /> Omnichannel Marketing Platform</Eyebrow>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 dark:text-white sm:text-5xl xl:text-6xl"
          >
            Reach every customer. <GradientText>Anywhere.</GradientText>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg"
          >
            Create, automate, and track customer engagement across <strong className="font-semibold text-ink-700 dark:text-ink-200">WhatsApp</strong> and <strong className="font-semibold text-ink-700 dark:text-ink-200">Email</strong> — from a single dashboard.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link to="/register" className="btn-gradient px-6 py-3 text-[15px]">
              Start Free Trial <FiArrowRight className="h-4 w-4" />
            </Link>
            <a href="#cta" className="btn-secondary px-6 py-3 text-[15px]">
              <FiPlay className="h-4 w-4" /> Book Demo
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500"
          >
            {["No credit card required", "Free 14-day trial", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><FiCheck className="h-4 w-4 text-brand-500" /> {t}</span>
            ))}
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          {/* Dashboard mockup card */}
          <div className="rounded-3xl border border-ink-200/70 bg-white/80 p-4 shadow-premium backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/80">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
              <span className="ml-3 text-xs font-medium text-ink-400">app.axiora.com/dashboard</span>
            </div>

            {/* Module rail */}
            <div className="mb-3 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-ink-100 bg-ink-50 p-1.5 dark:border-slate-700 dark:bg-slate-900/50">
              {MODULES.map((m, i) => (
                <span key={m.key} className={cx("flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold",
                  i === 0 ? "bg-white text-ink-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-ink-400")}>
                  <m.icon className="h-3.5 w-3.5" /> {m.label}
                </span>
              ))}
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { l: "Sent", v: "542K", i: FiSend },
                { l: "Delivered", v: "98.7%", i: FiTrendingUp },
                { l: "Contacts", v: "38.2K", i: FiUsers },
                { l: "Opens", v: "61.4%", i: FiMail },
              ].map((k) => (
                <div key={k.l} className="rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                  <k.i className="h-4 w-4 text-brand-500" />
                  <div className="mt-2 text-lg font-extrabold text-ink-900 dark:text-white">{k.v}</div>
                  <div className="text-[11px] text-ink-500">{k.l}</div>
                </div>
              ))}
            </div>

            {/* Channel split preview */}
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-brand-600">
                  <FiSend className="h-3.5 w-3.5" /> WhatsApp
                </div>
                <div className="space-y-1.5">
                  <div className="ml-auto w-[85%] rounded-lg rounded-tr-sm bg-[#DCF8C6] px-2.5 py-1.5 text-[10px] text-ink-900 shadow-sm dark:bg-brand-500/25 dark:text-ink-100">
                    Hi Priya! Your order ships today 🎉
                  </div>
                  <div className="h-2 w-2/3 rounded bg-ink-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <FiMail className="h-3.5 w-3.5" /> Email
                </div>
                <div className="space-y-1.5 rounded-lg border border-ink-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-800">
                  <div className="h-2 w-3/4 rounded bg-ink-200 dark:bg-slate-600" />
                  <div className="h-1.5 w-full rounded bg-ink-100 dark:bg-slate-700" />
                  <div className="h-1.5 w-5/6 rounded bg-ink-100 dark:bg-slate-700" />
                  <div className="mt-1.5 h-5 w-20 rounded-md bg-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating stat cards */}
          <FloatCard className="-left-4 top-16 sm:-left-8" icon={FiTrendingUp} label="Delivery Rate" value="98.7%" delay={0.9} />
          <FloatCard className="-right-3 bottom-8 sm:-right-6" icon={FiZap} label="2 Channels, 1 Dashboard" value="Automated" delay={1.1} />
        </motion.div>
      </div>
    </section>
  );
}
