import { motion } from "framer-motion";
import { FiGrid, FiCpu, FiTrendingUp, FiZap, FiBarChart2, FiLock } from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";

const REASONS = [
  { icon: FiGrid, title: "One Dashboard", desc: "Manage WhatsApp & Email together — no more switching tools." },
  { icon: FiCpu, title: "AI Powered", desc: "Generate professional marketing content in seconds." },
  { icon: FiTrendingUp, title: "Scalable", desc: "Built for startups, SMEs, and enterprises alike." },
  { icon: FiZap, title: "Fast Campaigns", desc: "Queue-based processing for reliable, high-volume delivery." },
  { icon: FiBarChart2, title: "Real-Time Analytics", desc: "Measure delivery, opens, clicks, and replies as they happen." },
  { icon: FiLock, title: "Secure", desc: "Enterprise-grade encryption, audit logs, and access control." },
];

export default function WhyChooseUs() {
  return (
    <Section id="why-us">
      <SectionHeading
        eyebrow="Why Choose Axiora"
        title="What makes us different"
        subtitle="Everything you need to run modern customer engagement — without the tool sprawl."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((r, i) => (
          <Reveal key={r.title} delay={(i % 3) * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-full rounded-2xl border border-ink-200/70 bg-white p-6 text-center shadow-soft transition hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-brand-glow">
                <r.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{r.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
