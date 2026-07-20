import LandingNav from "../components/landing/LandingNav";
import Hero from "../components/landing/Hero";
import TrustedBy from "../components/landing/TrustedBy";
import WhatIsThis from "../components/landing/WhatIsThis";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import DashboardShowcase from "../components/landing/DashboardShowcase";
import WhyChooseUs from "../components/landing/WhyChooseUs";
import Analytics from "../components/landing/Analytics";
import Automation from "../components/landing/Automation";
import Testimonials from "../components/landing/Testimonials";
import Pricing from "../components/landing/Pricing";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import LandingFooter from "../components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen scroll-smooth bg-ink-50 text-ink-900 dark:bg-ink-900 dark:text-ink-100">
      <LandingNav />
      <main>
        <Hero />
        <TrustedBy />
        <WhatIsThis />
        <Features />
        <HowItWorks />
        <DashboardShowcase />
        <WhyChooseUs />
        <Analytics />
        <Automation />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
