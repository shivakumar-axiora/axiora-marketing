import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";
import { cx } from "../../utils/format";

const PLANS = [
  {
    name: "Starter", desc: "For small teams getting started with WhatsApp and Email.",
    features: ["WhatsApp + Email campaigns", "A few thousand contacts", "Basic templates", "Delivery tracking", "Email support"],
  },
  {
    name: "Professional", desc: "For growing marketing teams that need automation and insight.", featured: true,
    features: ["Everything in Starter", "Unlimited contacts", "Marketing automation", "Advanced analytics & comparison", "Role-based access", "Priority support"],
  },
  {
    name: "Enterprise", desc: "For large-scale, multi-team operations.",
    features: ["Everything in Professional", "Dedicated sending infrastructure", "AI features & insights", "Webhook integrations", "Organization isolation & audit logs", "Dedicated account manager"],
  },
];

export default function Pricing() {
  return (
    <Section id="pricing" className="bg-white/50 dark:bg-slate-900/30">
      <SectionHeading
        eyebrow="Pricing"
        title="Plans that grow with you"
        subtitle="Whether you're sending your first campaign or running omnichannel at scale — there's a plan for it. Talk to us for a quote tailored to your volume."
      />
      <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cx(
                "relative flex h-full flex-col rounded-3xl border p-8 shadow-soft",
                p.featured
                  ? "border-transparent bg-brand-gradient text-white shadow-premium lg:scale-[1.04]"
                  : "border-ink-200/70 bg-white dark:border-slate-700 dark:bg-slate-800"
              )}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  Most Popular
                </span>
              )}
              <h3 className={cx("text-lg font-bold", p.featured ? "text-white" : "text-ink-900 dark:text-white")}>{p.name}</h3>
              <p className={cx("mt-2 text-sm leading-relaxed", p.featured ? "text-white/80" : "text-ink-500")}>{p.desc}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <span className={cx("flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full", p.featured ? "bg-white/20" : "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300")}>
                      <FiCheck className="h-3 w-3" />
                    </span>
                    <span className={p.featured ? "text-white/90" : "text-ink-600 dark:text-ink-200"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={cx(
                  "mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition",
                  p.featured ? "bg-white text-brand-700 hover:bg-white/90" : "btn-gradient"
                )}
              >
                {p.name === "Enterprise" ? "Contact Sales" : "Get Started"} <FiArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
