import { FiCheck, FiX } from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";

const ROWS = [
  "Bulk Messaging", "Scheduling", "Analytics", "Templates", "Media Support",
  "API Integration", "Contact Management", "Delivery Tracking", "Automation",
  "Reports", "Role Management",
];

export default function Comparison() {
  return (
    <Section id="comparison">
      <SectionHeading
        eyebrow="Why Axiora"
        title="Manual Outreach vs. Axiora"
        subtitle="See what you gain by moving to a real marketing platform."
      />
      <Reveal className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl border border-ink-200/70 shadow-card dark:border-slate-700">
        <div className="grid grid-cols-3 bg-white dark:bg-slate-800">
          <div className="p-5" />
          <div className="p-5 text-center">
            <div className="text-sm font-bold text-ink-500">Manual Outreach</div>
          </div>
          <div className="bg-brand-gradient p-5 text-center text-white">
            <div className="text-sm font-extrabold">Axiora</div>
          </div>
        </div>
        {ROWS.map((r, i) => (
          <div key={r} className={`grid grid-cols-3 items-center ${i % 2 ? "bg-ink-50/60 dark:bg-slate-900/40" : "bg-white dark:bg-slate-800"}`}>
            <div className="p-4 text-sm font-medium text-ink-800 dark:text-ink-100">{r}</div>
            <div className="flex justify-center p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
                <FiX className="h-4 w-4" />
              </span>
            </div>
            <div className="flex justify-center p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                <FiCheck className="h-4 w-4" />
              </span>
            </div>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
