import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cx } from "../../utils/format";

/* Scroll-reveal wrapper — fades/slides children in when they enter the viewport. */
export function Reveal({ children, delay = 0, y = 24, className, once = true }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Consistent section wrapper with an anchor id + responsive padding. */
export function Section({ id, className, children, bleading }) {
  return (
    <section id={id} className={cx("scroll-mt-20 px-5 sm:px-8", className)}>
      <div className="mx-auto max-w-7xl py-20 sm:py-24">{children}</div>
      {bleading}
    </section>
  );
}

export function Eyebrow({ children, className }) {
  return (
    <span className={cx("inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300", className)}>
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center = true, className }) {
  return (
    <Reveal className={cx(center && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-ink-500 sm:text-lg">{subtitle}</p>}
    </Reveal>
  );
}

export function GradientText({ children, className }) {
  return (
    <span className={cx("bg-gradient-to-r from-brand-500 via-brand-600 to-[#128c7e] bg-clip-text text-transparent", className)}>
      {children}
    </span>
  );
}

/* Animated count-up that triggers once in view. Supports prefix/suffix + decimals. */
export function CountUp({ to, duration = 1600, decimals = 0, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setVal(to); return; }
    let raf;
    let start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduce]);

  const formatted = val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}
