import { motion } from "framer-motion";
import {
  FiType, FiImage, FiVideo, FiFile, FiMic, FiMapPin, FiUser, FiSquare, FiList, FiLayers,
} from "react-icons/fi";
import { Section, SectionHeading, Reveal } from "./primitives";

const TYPES = [
  { icon: FiType, label: "Text", note: "Rich formatted text" },
  { icon: FiImage, label: "Image", note: "JPG, PNG, WebP" },
  { icon: FiVideo, label: "Video", note: "MP4 up to 16MB" },
  { icon: FiFile, label: "PDF", note: "Documents & files" },
  { icon: FiMic, label: "Audio", note: "Voice & audio clips" },
  { icon: FiMapPin, label: "Location", note: "Pin & share places" },
  { icon: FiUser, label: "Contact Card", note: "Share vCards" },
  { icon: FiSquare, label: "Buttons", note: "Quick reply CTAs" },
  { icon: FiList, label: "Interactive Lists", note: "Menu selections" },
  { icon: FiLayers, label: "Carousel", note: "Swipeable cards" },
];

export default function MessageTypes() {
  return (
    <Section id="message-types" className="bg-white/50 dark:bg-slate-900/30">
      <SectionHeading
        eyebrow="Message Types"
        title="Every WhatsApp format, supported"
        subtitle="Go beyond text with rich, interactive messages that drive engagement."
      />
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {TYPES.map((t, i) => (
          <Reveal key={t.label} delay={(i % 5) * 0.05}>
            <motion.div
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-ink-200/70 bg-white p-5 text-center shadow-soft hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-gradient group-hover:text-white dark:bg-brand-500/10 dark:text-brand-300">
                <t.icon className="h-6 w-6" />
              </span>
              <span className="text-sm font-bold text-ink-900 dark:text-white">{t.label}</span>
              <span className="text-[11px] text-ink-500">{t.note}</span>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
