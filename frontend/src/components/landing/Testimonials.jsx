import { FiStar } from "react-icons/fi";
import { Section, SectionHeading } from "./primitives";
import { initials } from "../../utils/format";

const REVIEWS = [
  { name: "Neha Kapoor", role: "Head of Growth", company: "Zenith Retail", text: "Axiora doubled our campaign reach in a month. Running WhatsApp and Email from one dashboard alone is worth it." },
  { name: "Arjun Rao", role: "Founder", company: "SwiftCart", text: "The official API + scheduling means we finally send at scale without the fear of bans." },
  { name: "Meera Nair", role: "Marketing Lead", company: "CarePlus Clinics", text: "Email reminders plus a WhatsApp nudge cut our no-shows by 40%. Setup took a single afternoon." },
  { name: "Rahul Sethi", role: "CMO", company: "UrbanEats", text: "Beautiful UI, powerful segmentation, and analytics our whole team actually uses — for both channels." },
  { name: "Priya Menon", role: "Ops Manager", company: "EduSpark", text: "Bulk import and templates saved us dozens of hours every single week." },
  { name: "Vikram Shah", role: "Director", company: "Nova Realty", text: "From welcome emails to WhatsApp follow-ups, our entire funnel is automated now." },
];

function Row({ items, reverse }) {
  return (
    <div className="group flex overflow-hidden py-3 [--gap:1.25rem]" role="list">
      <div className={`flex shrink-0 gap-[var(--gap)] pr-[var(--gap)] ${reverse ? "animate-[scroll-r_38s_linear_infinite]" : "animate-[scroll-l_38s_linear_infinite]"} group-hover:[animation-play-state:paused]`}>
        {[...items, ...items].map((r, i) => (
          <article key={i} role="listitem" className="w-[320px] shrink-0 rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800">
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, s) => <FiStar key={s} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-200">“{r.text}”</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">{initials(r.name)}</span>
              <div>
                <div className="text-sm font-bold text-ink-900 dark:text-white">{r.name}</div>
                <div className="text-xs text-ink-500">{r.role} · {r.company}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <Section id="testimonials" className="bg-white/50 dark:bg-slate-900/30">
      <SectionHeading
        eyebrow="Testimonials"
        title="Loved by marketing teams"
        subtitle="Join thousands of businesses growing with WhatsApp and Email on Axiora."
      />
      <div className="relative mt-12 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <Row items={REVIEWS.slice(0, 3)} />
        <Row items={REVIEWS.slice(3)} reverse />
      </div>
    </Section>
  );
}
