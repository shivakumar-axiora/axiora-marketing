import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { FiSend, FiMail, FiTarget, FiMessageCircle, FiUsers, FiTrendingUp } from "react-icons/fi";
import { Section, SectionHeading, Reveal, CountUp } from "./primitives";
import { useTheme } from "../../context/ThemeContext";
import { cx } from "../../utils/format";

const KPIS = [
  { icon: FiSend, label: "Messages Sent", to: 542, suffix: "K+" },
  { icon: FiTrendingUp, label: "WhatsApp Delivery", to: 98.7, decimals: 1, suffix: "%" },
  { icon: FiMail, label: "Email Open Rate", to: 61.4, decimals: 1, suffix: "%" },
  { icon: FiTarget, label: "Click Rate", to: 19.8, decimals: 1, suffix: "%" },
  { icon: FiMessageCircle, label: "Replies", to: 24.6, suffix: "K+" },
  { icon: FiUsers, label: "Audience Growth", to: 32.5, decimals: 1, suffix: "%" },
];

const PERFORMANCE = [
  { week: "W1", whatsapp: 96.8, email: 52.1 },
  { week: "W2", whatsapp: 97.2, email: 55.8 },
  { week: "W3", whatsapp: 97.9, email: 54.2 },
  { week: "W4", whatsapp: 98.1, email: 58.6 },
  { week: "W5", whatsapp: 98.4, email: 57.3 },
  { week: "W6", whatsapp: 98.3, email: 60.1 },
  { week: "W7", whatsapp: 98.6, email: 59.4 },
  { week: "W8", whatsapp: 98.7, email: 61.4 },
];

const GROWTH = [
  { month: "Feb", contacts: 21400 },
  { month: "Mar", contacts: 24100 },
  { month: "Apr", contacts: 26800 },
  { month: "May", contacts: 29900 },
  { month: "Jun", contacts: 33600 },
  { month: "Jul", contacts: 38200 },
];

const WHATSAPP_FUNNEL = [
  { stage: "Sent", value: 100 },
  { stage: "Delivered", value: 98.7 },
  { stage: "Read", value: 76.1 },
  { stage: "Replied", value: 31.4 },
];

const EMAIL_FUNNEL = [
  { stage: "Sent", value: 100 },
  { stage: "Delivered", value: 97.2 },
  { stage: "Opened", value: 61.4 },
  { stage: "Clicked", value: 19.8 },
];

/* Validated categorical pair (see palette check): WhatsApp green / Email blue,
   stepped separately per mode so both clear the OKLCH lightness band. */
function useChannelColors() {
  const { theme } = useTheme();
  return theme === "dark"
    ? { whatsapp: "#1eae54", email: "#3b82f6" }
    : { whatsapp: "#1eae54", email: "#2563eb" };
}

function ChartCard({ title, subtitle, legend, children, className }) {
  return (
    <div className={cx("rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
        </div>
        {legend && (
          <div className="flex items-center gap-3">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300">
                <span className="h-2 w-4 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, suffix = "%" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-200 bg-white/95 px-3 py-2 text-xs shadow-card backdrop-blur dark:border-slate-600 dark:bg-slate-800/95">
      <div className="mb-1 font-semibold text-ink-900 dark:text-white">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-semibold text-ink-900 dark:text-white">{p.value}{suffix}</span>
          <span className="capitalize">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const colors = useChannelColors();
  const gridStroke = "currentColor";

  return (
    <Section id="analytics">
      <SectionHeading
        eyebrow="Analytics"
        title="Measure what matters, on every channel"
        subtitle="Real-time delivery, opens, clicks, and replies — for WhatsApp and Email, side by side."
      />

      {/* KPI grid */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {KPIS.map((k, i) => (
          <Reveal key={k.label} delay={(i % 6) * 0.05}>
            <div className="h-full rounded-2xl border border-ink-200/70 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <k.icon className="h-4 w-4" />
              </span>
              <div className="mt-3 font-display text-xl font-extrabold text-ink-900 dark:text-white">
                <CountUp to={k.to} decimals={k.decimals || 0} suffix={k.suffix} />
              </div>
              <div className="mt-0.5 text-xs text-ink-500">{k.label}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Campaign performance trend */}
        <Reveal className="lg:col-span-3">
          <ChartCard
            title="Campaign performance"
            subtitle="WhatsApp delivery rate vs. Email open rate, last 8 weeks"
            legend={[{ label: "WhatsApp", color: colors.whatsapp }, { label: "Email", color: colors.email }]}
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PERFORMANCE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={gridStroke} className="text-ink-100 dark:text-slate-700" strokeDasharray="0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke={colors.whatsapp} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
                <Line type="monotone" dataKey="email" name="Email" stroke={colors.email} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Reveal>

        {/* Audience growth */}
        <Reveal delay={0.08} className="lg:col-span-2">
          <ChartCard title="Audience growth" subtitle="Total contacts, last 6 months">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={GROWTH} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.whatsapp} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={colors.whatsapp} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} className="text-ink-100 dark:text-slate-700" stroke={gridStroke} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
                <Tooltip content={<ChartTooltip suffix="" />} />
                <Area type="monotone" dataKey="contacts" name="Contacts" stroke={colors.whatsapp} strokeWidth={2} fill="url(#growthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Reveal>

        {/* Campaign comparison — per-channel funnels (ordinal: one hue, monotone lightness) */}
        <Reveal delay={0.12} className="lg:col-span-5">
          <ChartCard title="Campaign comparison" subtitle="Funnel by channel — each stage as a share of messages sent">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-300"><FiSend className="h-3.5 w-3.5" /> WhatsApp</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={WHATSAPP_FUNNEL} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Share" radius={[0, 4, 4, 0]} barSize={18}>
                      {WHATSAPP_FUNNEL.map((entry, i) => (
                        <Cell key={entry.stage} fill={["#c9f5da", "#5fe093", "#1eae54", "#186e3a"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400"><FiMail className="h-3.5 w-3.5" /> Email</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={EMAIL_FUNNEL} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Share" radius={[0, 4, 4, 0]} barSize={18}>
                      {EMAIL_FUNNEL.map((entry, i) => (
                        <Cell key={entry.stage} fill={["#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        </Reveal>
      </div>
    </Section>
  );
}
