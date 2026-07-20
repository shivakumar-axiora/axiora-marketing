import { motion } from "framer-motion";
import {
  FiShoppingBag, FiCoffee, FiHeart, FiBookOpen, FiHome, FiDollarSign,
  FiMapPin, FiTruck, FiShoppingCart, FiBriefcase,
} from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";

const CASES = [
  { icon: FiShoppingBag, title: "Retail", desc: "Promotions, new arrivals & loyalty updates." },
  { icon: FiCoffee, title: "Restaurants", desc: "Menus, offers & reservation reminders." },
  { icon: FiHeart, title: "Healthcare", desc: "Appointment & medication reminders." },
  { icon: FiBookOpen, title: "Education", desc: "Admissions, results & class alerts." },
  { icon: FiHome, title: "Real Estate", desc: "Listings, site visits & follow-ups." },
  { icon: FiDollarSign, title: "Finance", desc: "Statements, alerts & secure OTPs." },
  { icon: FiMapPin, title: "Travel", desc: "Bookings, itineraries & updates." },
  { icon: FiTruck, title: "Automotive", desc: "Service reminders & offers." },
  { icon: FiShoppingCart, title: "E-Commerce", desc: "Orders, cart recovery & shipping." },
  { icon: FiBriefcase, title: "Hospitality", desc: "Check-ins, offers & guest care." },
];

export default function UseCases() {
  return (
    <Section id="use-cases">
      <SectionHeading
        eyebrow="Solutions"
        title="Built for every industry"
        subtitle="Thousands of businesses across sectors grow with Axiora."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {CASES.map((c, i) => (
          <Reveal key={c.title} delay={(i % 5) * 0.05}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group h-full rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:scale-110 dark:bg-brand-500/10 dark:text-brand-300">
                <c.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-bold text-ink-900 dark:text-white">{c.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{c.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
