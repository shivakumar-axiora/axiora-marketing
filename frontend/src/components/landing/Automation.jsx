import { FiUserPlus, FiMail, FiClock, FiSend, FiGift, FiCheckCircle, FiArrowDown } from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";
import { cx } from "../../utils/format";

const FLOW = [
  { icon: FiUserPlus, title: "New Customer", desc: "A contact is added or opts in.", channel: null },
  { icon: FiMail, title: "Welcome Email", desc: "An automated welcome email goes out instantly.", channel: "email" },
  { icon: FiClock, title: "Wait 2 Days", desc: "Give them time to explore before following up." },
  { icon: FiSend, title: "WhatsApp Reminder", desc: "A friendly nudge lands where they'll actually see it.", channel: "whatsapp" },
  { icon: FiGift, title: "Offer", desc: "Share a tailored promo or discount." },
  { icon: FiCheckCircle, title: "Conversion", desc: "They purchase — and the journey ends here.", channel: null },
];

const CHANNEL_STYLE = {
  email: "bg-blue-500 shadow-[0_12px_36px_-8px_rgba(37,99,235,0.45)]",
  whatsapp: "bg-brand-gradient shadow-brand-glow",
};

export default function Automation() {
  return (
    <Section id="automation" className="bg-white/50 dark:bg-slate-900/30">
      <SectionHeading
        eyebrow="Automation"
        title="Put your marketing on autopilot"
        subtitle="Design journeys that trigger the right message on the right channel — automatically."
      />
      <div className="mx-auto mt-14 max-w-xl">
        {FLOW.map((s, i) => (
          <div key={s.title}>
            <Reveal delay={i * 0.1}>
              <div className="flex items-center gap-4 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft transition hover:shadow-card dark:border-slate-700 dark:bg-slate-800">
                <span className={cx("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white",
                  s.channel ? CHANNEL_STYLE[s.channel] : "bg-ink-800 dark:bg-slate-600")}>
                  <s.icon className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink-900 dark:text-white">{s.title}</h3>
                    {s.channel && (
                      <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        s.channel === "email" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300")}>
                        {s.channel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-500">{s.desc}</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-ink-400">Step {i + 1}</span>
              </div>
            </Reveal>
            {i < FLOW.length - 1 && (
              <div className="flex justify-center py-2">
                <FiArrowDown className="h-5 w-5 animate-bounce text-brand-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
