import { Reveal, CountUp } from "./primitives";

const STATS = [
  { to: 500, suffix: "K+", label: "Messages Sent" },
  { to: 98.9, decimals: 1, suffix: "%", label: "Delivery Rate" },
  { to: 15, suffix: "K+", label: "Campaigns" },
  { to: 2500, suffix: "+", label: "Businesses" },
  { to: 50, suffix: "+", label: "Countries" },
];

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-brand-gradient px-5 py-16 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="text-center">
            <div className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              <CountUp to={s.to} decimals={s.decimals || 0} suffix={s.suffix} />
            </div>
            <div className="mt-2 text-sm font-medium text-white/80">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
