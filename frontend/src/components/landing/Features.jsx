import { motion } from "framer-motion";
import {
  FiSend, FiMail, FiUsers, FiZap, FiBarChart2, FiShield,
} from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";
import { cx } from "../../utils/format";

const CATEGORIES = [
  {
    icon: FiSend, title: "WhatsApp Marketing", tone: "brand",
    items: ["Bulk Messaging", "Media Messages", "Templates", "Scheduling", "Delivery Tracking"],
  },
  {
    icon: FiMail, title: "Email Marketing", tone: "blue",
    items: ["Professional Email Campaigns", "Drag & Drop Builder", "Templates", "Scheduling", "Personalization"],
  },
  {
    icon: FiUsers, title: "Contact Management", tone: "neutral",
    items: ["Import CSV", "Lists", "Segments", "Tags", "CRM-style Contact Management"],
  },
  {
    icon: FiZap, title: "Marketing Automation", tone: "neutral",
    items: ["Automated Customer Journeys", "Follow-ups", "Welcome Emails", "WhatsApp Automation"],
  },
  {
    icon: FiBarChart2, title: "Advanced Analytics", tone: "neutral",
    items: ["Delivery Reports", "Open Rate", "Click Rate", "Replies", "Campaign Comparison"],
  },
  {
    icon: FiShield, title: "Enterprise Security", tone: "neutral",
    items: ["Secure Authentication", "Organization Isolation", "Audit Logs", "Data Encryption"],
  },
];

const TONE = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300 group-hover:bg-brand-gradient group-hover:text-white",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 group-hover:bg-blue-500 group-hover:text-white",
  neutral: "bg-ink-100 text-ink-600 dark:bg-slate-700 dark:text-ink-200 group-hover:bg-ink-800 group-hover:text-white dark:group-hover:bg-slate-600",
};

export default function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Platform Features"
        title="Everything you need to run omnichannel marketing"
        subtitle="WhatsApp and Email campaigns, contact management, automation, and analytics — one toolkit, one dashboard."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c, i) => (
          <Reveal key={c.title} delay={(i % 3) * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative h-full overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft transition hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
            >
              <div className={cx("absolute inset-x-0 top-0 h-1 scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
                c.tone === "brand" ? "bg-brand-gradient" : c.tone === "blue" ? "bg-blue-500" : "bg-ink-800 dark:bg-slate-500")} />
              <div className={cx("flex h-12 w-12 items-center justify-center rounded-xl transition", TONE[c.tone])}>
                <c.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">{c.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {c.items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-sm text-ink-500">
                    <span className={cx("h-1 w-1 flex-shrink-0 rounded-full",
                      c.tone === "brand" ? "bg-brand-500" : c.tone === "blue" ? "bg-blue-500" : "bg-ink-400")} />
                    {it}
                  </li>
                ))}
              </ul>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
