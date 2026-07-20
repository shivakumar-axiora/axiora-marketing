import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FiUpload, FiSend, FiCheckCircle, FiXCircle, FiCheck } from "react-icons/fi";
import { Section, SectionHeading } from "./primitives";
import { cx } from "../../utils/format";

const TOTAL = 12500;

export default function LiveCampaignDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf, start;
    const dur = 2600;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / dur, 1);
      setPct(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const delivered = Math.round((TOTAL * pct * 0.972) / 100);
  const failed = Math.round((TOTAL * pct * 0.028) / 100);

  const stages = [
    { icon: FiUpload, label: "Uploading contacts", done: pct > 5 },
    { icon: FiSend, label: "Sending messages", done: pct > 30 },
    { icon: FiCheckCircle, label: "Delivered", done: pct >= 100 },
  ];

  return (
    <Section id="live-demo" className="bg-white/50 dark:bg-slate-900/30">
      <SectionHeading
        eyebrow="Live Campaign"
        title="Watch a campaign go live in real time"
        subtitle="Contacts upload, messages send, and delivery updates stream in — exactly like the real product."
      />

      <div ref={ref} className="mx-auto mt-12 grid max-w-5xl items-center gap-8 lg:grid-cols-2">
        {/* Progress panel */}
        <div className="rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink-900 dark:text-white">Diwali Mega Sale</h3>
              <p className="text-sm text-ink-500">{TOTAL.toLocaleString()} recipients</p>
            </div>
            <span className={cx("rounded-full px-3 py-1 text-xs font-semibold", pct >= 100 ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300")}>
              {pct >= 100 ? "Completed" : "Sending…"}
            </span>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-medium text-ink-600 dark:text-ink-200">Delivery progress</span>
              <span className="font-bold text-brand-600">{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-slate-700">
              <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-150" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Sent" value={(delivered + failed).toLocaleString()} tone="ink" />
            <Stat label="Delivered" value={delivered.toLocaleString()} tone="green" icon={FiCheckCircle} />
            <Stat label="Failed" value={failed.toLocaleString()} tone="red" icon={FiXCircle} />
          </div>

          <div className="mt-6 space-y-2.5">
            {stages.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className={cx("flex h-8 w-8 items-center justify-center rounded-full transition", s.done ? "bg-brand-gradient text-white" : "bg-ink-100 text-ink-400 dark:bg-slate-700")}>
                  {s.done ? <FiCheck className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </span>
                <span className={cx("text-sm font-medium", s.done ? "text-ink-900 dark:text-white" : "text-ink-400")}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Message previews */}
        <div className="space-y-3 rounded-3xl bg-[#ECE5DD] p-5 shadow-card dark:bg-slate-900/70">
          {[
            "Hello Aarav! 🎉 Enjoy 20% OFF this Diwali.",
            "Hi Priya! Your exclusive offer is waiting.",
            "Rohan, don't miss our festive sale — ends tonight!",
          ].map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.4 }}
              className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#DCF8C6] px-3.5 py-2 text-sm text-ink-900 shadow-sm"
            >
              {m}
              <div className="mt-1 flex items-center justify-end gap-0.5 text-[10px] text-ink-400">
                12:0{i} <FiCheck className="h-3 w-3 text-brand-500" /><FiCheck className="-ml-2 h-3 w-3 text-brand-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Stat({ label, value, tone, icon: Icon }) {
  const tones = {
    ink: "text-ink-900 dark:text-white",
    green: "text-brand-600",
    red: "text-red-500",
  };
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <div className={cx("flex items-center justify-center gap-1 text-lg font-extrabold", tones[tone])}>
        {Icon && <Icon className="h-4 w-4" />} {value}
      </div>
      <div className="mt-0.5 text-[11px] text-ink-500">{label}</div>
    </div>
  );
}
