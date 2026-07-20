import { motion } from "framer-motion";
import {
  FiUploadCloud, FiTag, FiFilter, FiSearch, FiEdit, FiTrash2, FiUsers, FiCheck,
} from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";

const CAPS = [
  { icon: FiUploadCloud, label: "CSV Upload" },
  { icon: FiUploadCloud, label: "Excel Upload" },
  { icon: FiUsers, label: "Groups" },
  { icon: FiTag, label: "Tags" },
  { icon: FiFilter, label: "Filters" },
  { icon: FiSearch, label: "Search" },
  { icon: FiEdit, label: "Bulk Edit" },
  { icon: FiTrash2, label: "Bulk Delete" },
];

export default function ContactManagement() {
  return (
    <Section id="contacts-feature" className="bg-white/50 dark:bg-slate-900/30">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* Copy + capabilities */}
        <div>
          <SectionHeading
            center={false}
            eyebrow="Contact Management"
            title="Your entire audience, perfectly organized"
            subtitle="Import in seconds, segment with tags and groups, and manage thousands of contacts with powerful bulk actions."
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CAPS.map((c, i) => (
              <Reveal key={c.label} delay={(i % 4) * 0.06}>
                <div className="flex flex-col items-center gap-2 rounded-xl border border-ink-200/70 bg-white p-4 text-center shadow-soft transition hover:shadow-card dark:border-slate-700 dark:bg-slate-800">
                  <c.icon className="h-5 w-5 text-brand-600" />
                  <span className="text-xs font-semibold text-ink-700 dark:text-ink-100">{c.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Drag-and-drop upload animation */}
        <Reveal delay={0.15}>
          <div className="rounded-3xl border border-ink-200/70 bg-white p-6 shadow-premium dark:border-slate-700 dark:bg-slate-800">
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 py-10 dark:border-brand-500/30 dark:bg-brand-500/5">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-brand-glow"
              >
                <FiUploadCloud className="h-8 w-8" />
              </motion.div>
              <p className="mt-4 text-sm font-semibold text-ink-800 dark:text-ink-100">Drop your contacts.csv here</p>
              <p className="text-xs text-ink-500">or click to browse — up to 100,000 rows</p>
            </div>
            <div className="mt-4 space-y-2">
              {["contacts_vip.csv", "leads_q3.xlsx"].map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.2 }}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3 dark:border-slate-700 dark:bg-slate-900/50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    <FiCheck className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink-800 dark:text-ink-100">{f}</span>
                  <span className="text-xs text-brand-600">Imported</span>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
