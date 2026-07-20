import { motion } from "framer-motion";
import {
  FiCpu, FiEdit3, FiUsers, FiCheckSquare, FiGlobe, FiClock, FiTrendingUp, FiZap,
} from "react-icons/fi";
import { Section, SectionHeading, Reveal, Eyebrow } from "./primitives";

const AI = [
  { icon: FiEdit3, title: "AI Message Generator", desc: "Draft high-converting messages in seconds." },
  { icon: FiCpu, title: "AI Campaign Writer", desc: "Generate entire campaigns from a single prompt." },
  { icon: FiUsers, title: "AI Segmentation", desc: "Auto-group audiences by behavior and intent." },
  { icon: FiCheckSquare, title: "AI Grammar Correction", desc: "Polished, error-free copy every time." },
  { icon: FiGlobe, title: "AI Translation", desc: "Reach customers in 50+ languages instantly." },
  { icon: FiClock, title: "Best Time To Send", desc: "Predict the optimal moment for each contact." },
  { icon: FiTrendingUp, title: "Performance Insights", desc: "Actionable recommendations after every send." },
  { icon: FiZap, title: "Template Suggestions", desc: "Smart templates tailored to your goals." },
];

export default function AIFeatures() {
  return (
    <section id="ai" className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-24">
      {/* futuristic backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-ink-900" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <div className="absolute left-1/4 top-10 h-72 w-72 animate-blob rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute right-1/4 bottom-10 h-72 w-72 animate-blob rounded-full bg-teal-500/20 blur-3xl" style={{ animationDelay: "3s" }} />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "30px 30px" }} />

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="mb-4 border-brand-400/30 bg-brand-500/10 text-brand-300"><FiCpu className="h-3.5 w-3.5" /> Powered by AI</Eyebrow>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Marketing intelligence, built in</h2>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">Let AI write, optimize, and time your campaigns for maximum impact.</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AI.map((a, i) => (
            <Reveal key={a.title} delay={(i % 4) * 0.07}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-brand-400/40 hover:bg-white/10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-brand-glow">
                  <a.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{a.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
