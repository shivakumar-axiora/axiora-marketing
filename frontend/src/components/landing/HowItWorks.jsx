import { FiUpload, FiEdit3, FiClock, FiTrendingUp } from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";

const STEPS = [
  { icon: FiUpload, title: "Import Contacts", desc: "Upload via CSV/Excel or add contacts and organize into groups." },
  { icon: FiEdit3, title: "Create WhatsApp or Email Campaign", desc: "Compose with variables, media, templates, and a drag & drop email builder." },
  { icon: FiClock, title: "Schedule or Send", desc: "Send instantly or schedule for the ideal delivery time, per channel." },
  { icon: FiTrendingUp, title: "Track Analytics & Grow", desc: "Monitor delivery, opens, clicks, and replies across every channel." },
];

export default function HowItWorks() {
  return (
    <Section id="how-it-works" className="bg-white/50 dark:bg-slate-900/30">
      <SectionHeading
        eyebrow="How It Works"
        title="Launch your first campaign in minutes"
        subtitle="Four simple steps from contacts to conversions."
      />
      <div className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* connecting line */}
        <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent lg:block" />
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.12} className="relative text-center">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-brand-glow">
              <s.icon className="h-7 w-7" />
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink-900 text-xs font-bold text-white dark:border-slate-900">
                {i + 1}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-ink-900 dark:text-white">{s.title}</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-ink-500">{s.desc}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
