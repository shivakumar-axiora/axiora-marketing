import { Link } from "react-router-dom";
import { FiSend, FiLinkedin, FiGithub, FiTwitter, FiYoutube } from "react-icons/fi";

const COLUMNS = [
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Product", links: ["Features", "Pricing", "Automation", "Analytics"] },
  { title: "Resources", links: ["Documentation", "API Reference", "Support", "Status"] },
  { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Security", "GDPR"] },
];

const SOCIAL = [
  { icon: FiLinkedin, label: "LinkedIn" },
  { icon: FiGithub, label: "GitHub" },
  { icon: FiTwitter, label: "Twitter" },
  { icon: FiYoutube, label: "YouTube" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-ink-200/70 bg-white px-5 py-14 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-brand-glow">
                <FiSend className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-extrabold text-ink-900 dark:text-white">Axiora</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-ink-500">
              The complete omnichannel marketing platform — WhatsApp and Email campaigns, automation, and analytics in one dashboard.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-700 dark:hover:bg-brand-500/10"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-ink-900 dark:text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="link-underline text-sm text-ink-500 transition hover:text-ink-900 dark:hover:text-white">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-200/70 pt-6 text-sm text-ink-500 dark:border-slate-800 sm:flex-row">
          <p>© {new Date().getFullYear()} Axiora Global Solutions. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/login" className="hover:text-ink-900 dark:hover:text-white">Login</Link>
            <Link to="/register" className="hover:text-ink-900 dark:hover:text-white">Get Started</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
