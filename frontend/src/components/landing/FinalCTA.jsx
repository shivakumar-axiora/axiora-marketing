import { Link } from "react-router-dom";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import { Reveal } from "./primitives";

export default function FinalCTA() {
  return (
    <section id="cta" className="px-5 py-20 sm:px-8 sm:py-24">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-16 text-center text-white shadow-premium sm:px-12">
          {/* animated background */}
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "26px 26px" }} />
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 animate-blob rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 animate-blob rounded-full bg-white/10 blur-3xl" style={{ animationDelay: "3s" }} />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Start Engaging Customers Smarter.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Manage WhatsApp and Email Marketing from one powerful platform. Start free — no credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 transition hover:bg-white/90">
                Start Free Trial <FiArrowRight className="h-4 w-4" />
              </Link>
              <a href="#pricing" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                <FiCalendar className="h-4 w-4" /> Book Demo
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
