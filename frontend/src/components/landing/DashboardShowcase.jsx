import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiGrid, FiUsers, FiSend, FiMail, FiPieChart, FiZap, FiFileText,
} from "react-icons/fi";
import { Section, SectionHeading } from "./primitives";
import { cx } from "../../utils/format";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: FiGrid },
  { key: "contacts", label: "Contacts", icon: FiUsers },
  { key: "whatsapp", label: "WhatsApp Campaigns", icon: FiSend },
  { key: "email", label: "Email Campaigns", icon: FiMail },
  { key: "analytics", label: "Analytics", icon: FiPieChart },
  { key: "automation", label: "Automation", icon: FiZap },
  { key: "templates", label: "Templates", icon: FiFileText },
];

/* Lightweight mock "screen" per tab — stylized UI, not a real screenshot. */
function MockScreen({ tab }) {
  if (tab === "contacts" || tab === "templates") {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded-lg bg-ink-100 dark:bg-slate-700" />
          <div className="h-8 w-24 rounded-lg bg-brand-gradient" />
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
              <div className={cx("h-9 w-9 rounded-full", i % 2 === 0 ? "bg-brand-gradient" : "bg-blue-500")} />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-32 rounded bg-ink-200 dark:bg-slate-600" />
                <div className="h-2 w-48 rounded bg-ink-100 dark:bg-slate-700" />
              </div>
              <div className="h-6 w-16 rounded-full bg-brand-100 dark:bg-brand-500/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === "whatsapp") {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-44 rounded-lg bg-ink-100 dark:bg-slate-700" />
          <div className="h-8 w-28 rounded-lg bg-brand-gradient" />
        </div>
        <div className="space-y-1.5 rounded-xl bg-[#ECE5DD] p-3 dark:bg-slate-900/70">
          {["Hi Aarav! Your Diwali offer is live 🎉", "Reply YES to claim your 20% off code."].map((m, i) => (
            <div key={i} className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-[#DCF8C6] px-3 py-1.5 text-xs text-ink-900 shadow-sm">{m}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {["Sent 24.6K", "Delivered 98.4%", "Read 76.1%"].map((v) => (
            <div key={v} className="rounded-xl border border-ink-100 bg-ink-50 p-2.5 text-center text-[11px] font-semibold text-ink-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-ink-200">{v}</div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === "email") {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-44 rounded-lg bg-ink-100 dark:bg-slate-700" />
          <div className="h-8 w-28 rounded-lg bg-blue-500" />
        </div>
        <div className="space-y-2 rounded-xl border border-ink-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800">
          <div className="h-2.5 w-2/3 rounded bg-ink-200 dark:bg-slate-600" />
          <div className="h-2 w-full rounded bg-ink-100 dark:bg-slate-700" />
          <div className="h-2 w-5/6 rounded bg-ink-100 dark:bg-slate-700" />
          <div className="h-2 w-4/6 rounded bg-ink-100 dark:bg-slate-700" />
          <div className="mt-2 h-7 w-28 rounded-lg bg-blue-500" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {["Sent 18.2K", "Opened 61.4%", "Clicked 19.8%"].map((v) => (
            <div key={v} className="rounded-xl border border-ink-100 bg-ink-50 p-2.5 text-center text-[11px] font-semibold text-ink-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-ink-200">{v}</div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === "automation") {
    return (
      <div className="space-y-2">
        {["New Customer", "Welcome Email", "Wait 2 Days", "WhatsApp Reminder", "Conversion"].map((s, i) => (
          <div key={s} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-2.5 dark:border-slate-700 dark:bg-slate-900/50">
            <span className={cx("flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white", i % 2 === 0 ? "bg-brand-gradient" : "bg-blue-500")}>{i + 1}</span>
            <span className="text-xs font-medium text-ink-700 dark:text-ink-200">{s}</span>
          </div>
        ))}
      </div>
    );
  }

  // dashboard / analytics → KPI + charts
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2.5">
        {["542K", "98.7%", "38.2K", "61.4%"].map((v, i) => (
          <div key={i} className="rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="h-2 w-10 rounded bg-ink-200 dark:bg-slate-600" />
            <div className="mt-2 text-lg font-extrabold text-ink-900 dark:text-white">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <div className="col-span-2 rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="flex h-32 items-end gap-1.5">
            {[40, 65, 52, 80, 60, 92, 74, 58, 84].map((h, i) => (
              <div key={i} className={cx("flex-1 rounded-md", i % 2 === 0 ? "bg-brand-gradient" : "bg-blue-500")} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="relative h-24 w-24 rounded-full" style={{ background: "conic-gradient(#1eae54 0 55%, #2563eb 55% 100%)" }}>
            <div className="absolute inset-3 rounded-full bg-white dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardShowcase() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % TABS.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <Section id="dashboard">
      <SectionHeading
        eyebrow="Product Tour"
        title="A beautiful workspace for every workflow"
        subtitle="From contacts to WhatsApp and Email campaigns to automation and analytics — explore the modules your team will love."
      />

      <div className="mt-12 flex flex-wrap justify-center gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setActive(i)}
            className={cx(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
              i === active
                ? "bg-brand-gradient text-white shadow-brand-glow"
                : "bg-white text-ink-600 ring-1 ring-ink-200 hover:text-ink-900 dark:bg-slate-800 dark:text-ink-200 dark:ring-slate-700"
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="group mx-auto mt-10 max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-ink-200/70 bg-white/80 p-4 shadow-premium backdrop-blur-xl transition-transform duration-500 group-hover:scale-[1.01] dark:border-slate-700 dark:bg-slate-800/80 sm:p-6">
          <div className="mb-4 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
            <span className="ml-3 text-xs font-medium text-ink-400">app.axiora.com/{TABS[active].key}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={TABS[active].key}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4 }}
            >
              <MockScreen tab={TABS[active].key} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}
