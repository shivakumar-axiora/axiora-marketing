import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";

const QA = [
  { q: "Can I send both WhatsApp and Email campaigns?", a: "Yes. Axiora is a true omnichannel platform — create, schedule, and track WhatsApp and Email campaigns from the same dashboard, using the same contacts and segments." },
  { q: "Can I schedule campaigns?", a: "Absolutely. Draft a campaign on either channel and schedule it for any future date and time, or send instantly. You can pause, resume, or cancel at any point." },
  { q: "Can I import contacts?", a: "Yes — import via CSV or Excel with duplicate detection and validation, organize them into lists and groups, and add tags for powerful segmentation across both channels." },
  { q: "Can I automate messages?", a: "Yes. Build automated customer journeys that combine WhatsApp and Email — welcome emails, timed follow-ups, WhatsApp reminders, and offer sequences, all triggered automatically." },
  { q: "Is my data secure?", a: "Credentials are encrypted at rest, passwords are hashed, and all traffic is protected. Enterprise plans add organization isolation and audit logging for full accountability." },
  { q: "Can multiple users access the platform?", a: "Yes. Role-based access lets you add Admins, Marketing Managers, and Executives, each with the right permissions for campaigns, contacts, and settings." },
];

function Item({ q, a, open, onToggle }) {
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white dark:border-slate-700 dark:bg-slate-800">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-ink-900 dark:text-white sm:text-base">{q}</span>
        <FiChevronDown className={`h-5 w-5 flex-shrink-0 text-brand-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-ink-500">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <Section id="faq">
      <SectionHeading
        eyebrow="FAQ"
        title="Frequently asked questions"
        subtitle="Everything you need to know about the platform."
      />
      <Reveal className="mx-auto mt-12 max-w-3xl space-y-3">
        {QA.map((item, i) => (
          <Item key={item.q} {...item} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
        ))}
      </Reveal>
    </Section>
  );
}
