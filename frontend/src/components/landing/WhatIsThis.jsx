import { motion } from "framer-motion";
import { FiSend, FiMail, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";

const POINTS = [
  "One dashboard instead of juggling separate WhatsApp and email tools",
  "Build campaigns, automate journeys, and manage contacts in one place",
  "See delivery, opens, clicks, and replies side by side — for every channel",
];

export default function WhatIsThis() {
  return (
    <Section id="what-is-this" className="bg-white/50 dark:bg-slate-900/30">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            center={false}
            eyebrow="What is Axiora?"
            title="Your customers are on WhatsApp and Email. Now you can reach both from one place."
            subtitle="Axiora helps businesses communicate with customers through WhatsApp and Email from a single, centralized dashboard. Instead of managing multiple disconnected tools, you create campaigns, automate customer journeys, manage contacts, and analyze performance — all in one platform."
          />
          <ul className="mt-8 space-y-3">
            {POINTS.map((p, i) => (
              <Reveal key={p} delay={i * 0.08}>
                <li className="flex items-start gap-3 text-sm text-ink-600 dark:text-ink-200 sm:text-base">
                  <FiCheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
                  {p}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* "Many tools -> one platform" visual */}
        <Reveal delay={0.15}>
          <div className="rounded-3xl border border-ink-200/70 bg-white p-6 shadow-premium dark:border-slate-700 dark:bg-slate-800 sm:p-8">
            <div className="grid grid-cols-2 gap-3 opacity-60">
              {["WhatsApp Tool", "Email Tool", "Spreadsheet CRM", "Analytics Tool"].map((t) => (
                <div key={t} className="rounded-xl border border-dashed border-ink-300 px-3 py-2.5 text-center text-xs font-medium text-ink-400 line-through decoration-ink-300 dark:border-slate-600 dark:text-ink-500">
                  {t}
                </div>
              ))}
            </div>
            <div className="my-5 flex items-center justify-center">
              <motion.div
                animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-slate-700"
              >
                <FiArrowRight className="h-5 w-5 rotate-90" />
              </motion.div>
            </div>
            <div className="rounded-2xl bg-brand-gradient p-5 text-center shadow-brand-glow">
              <div className="flex items-center justify-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white"><FiSend className="h-4 w-4" /></span>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white"><FiMail className="h-4 w-4" /></span>
              </div>
              <p className="mt-3 font-display text-lg font-extrabold text-white">One Platform: Axiora</p>
              <p className="mt-1 text-xs text-white/80">Campaigns · Automation · Contacts · Analytics</p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
