import { Reveal } from "./primitives";

const LOGOS = ["Google", "Microsoft", "Amazon", "Zoho", "Flipkart", "Swiggy", "Zomato"];

export default function TrustedBy() {
  return (
    <div className="border-y border-ink-200/70 bg-white/50 px-5 py-12 dark:border-slate-800 dark:bg-slate-900/30 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-ink-400">Trusted by businesses worldwide</p>
        </Reveal>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-16">
          {LOGOS.map((name, i) => (
            <Reveal key={name} delay={i * 0.06}>
              <span className="font-display text-xl font-bold text-ink-400 grayscale transition duration-300 hover:text-ink-700 hover:grayscale-0 dark:text-ink-500 dark:hover:text-ink-200 sm:text-2xl">
                {name}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
