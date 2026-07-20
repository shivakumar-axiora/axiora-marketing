import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  FiUsers, FiSend, FiActivity, FiClock, FiCheckCircle, FiXCircle, FiTrendingUp, FiZap,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { Card, CircularProgress, EmptyState, Skeleton } from "../components/ui";
import { dashboardApi } from "../services/endpoints";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/format";

const PIE_COLORS = ["#3b82f6", "#25D366", "#8b5cf6", "#ef4444", "#94a3b8"];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, loading } = useFetch(() => dashboardApi.stats());
  const { data: charts } = useFetch(() => dashboardApi.charts());
  const { data: recent } = useFetch(() => dashboardApi.recentCampaigns());
  const { data: activity } = useFetch(() => dashboardApi.recentActivity());

  const cards = stats
    ? [
        { icon: FiUsers, label: "Total Contacts", value: stats.total_contacts, color: "brand" },
        { icon: FiSend, label: "Total Campaigns", value: stats.total_campaigns, color: "blue" },
        { icon: FiZap, label: "Active Campaigns", value: stats.active_campaigns, color: "purple" },
        { icon: FiClock, label: "Scheduled", value: stats.scheduled_campaigns, color: "amber" },
        { icon: FiCheckCircle, label: "Messages Sent", value: stats.messages_sent, color: "brand" },
        { icon: FiTrendingUp, label: "Delivered", value: stats.messages_delivered, color: "blue" },
        { icon: FiXCircle, label: "Failed", value: stats.failed_messages, color: "red" },
        { icon: FiActivity, label: "Pending", value: stats.pending_messages, color: "amber" },
      ]
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(" ")[0] || "there"} 👋`}
        subtitle="Here's what's happening with your WhatsApp marketing today."
        actions={<Link to="/campaigns/new" className="btn-primary"><FiSend /> New Campaign</Link>}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Card key={i}><Skeleton className="h-16" /></Card>)
          : cards.map((c, i) => <StatCard key={c.label} {...c} index={i} />)}
      </div>

      {/* Rates + charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center">
          <h3 className="mb-4 self-start font-semibold">Delivery Rate</h3>
          <CircularProgress value={stats?.delivery_rate || 0} label="delivered" size={140} />
          <p className="mt-3 text-sm text-ink-500">{stats?.messages_delivered || 0} of {stats?.messages_sent || 0} delivered</p>
        </Card>
        <Card className="flex flex-col items-center justify-center">
          <h3 className="mb-4 self-start font-semibold">Success Rate</h3>
          <CircularProgress value={stats?.success_rate || 0} label="success" size={140} color="#3b82f6" />
          <p className="mt-3 text-sm text-ink-500">Across all sent messages</p>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">Delivery Statistics</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={charts?.delivery_stats || []} dataKey="value" nameKey="label" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {(charts?.delivery_stats || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <RTooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {(charts?.delivery_stats || []).map((d, i) => (
              <span key={d.label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Daily Messages (7 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={charts?.daily_messages || []}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25D366" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-slate-700" vertical={false} />
              <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <RTooltip />
              <Area type="monotone" dataKey="value" stroke="#25D366" strokeWidth={2.5} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="mb-4 font-semibold">Campaign Performance</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts?.campaign_performance || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-slate-700" vertical={false} />
              <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <RTooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent campaigns + activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 !p-0">
          <div className="flex items-center justify-between p-5">
            <h3 className="font-semibold">Recent Campaigns</h3>
            <Link to="/campaigns" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          {recent?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500 dark:border-slate-700 dark:bg-slate-700/40">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Campaign</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Recipients</th>
                    <th className="px-5 py-2.5 font-medium">Delivered</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr key={c.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 dark:border-slate-700 dark:hover:bg-slate-700/30">
                      <td className="px-5 py-3">
                        <Link to={`/campaigns/${c.id}`} className="font-medium hover:text-brand-600">{c.name}</Link>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3">{c.total_recipients}</td>
                      <td className="px-5 py-3">{c.delivered_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5"><EmptyState title="No campaigns yet" description="Create your first campaign to see it here." /></div>
          )}
        </Card>

        <Card className="!p-0">
          <h3 className="p-5 font-semibold">Recent Activity</h3>
          <div className="max-h-96 space-y-1 overflow-y-auto px-3 pb-3">
            {activity?.length ? activity.map((a) => (
              <div key={a.id} className="flex gap-3 rounded-xl px-2 py-2 hover:bg-ink-50 dark:hover:bg-slate-700/40">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
                <div>
                  <p className="text-sm font-medium capitalize">{a.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-ink-500">{timeAgo(a.created_at)}</p>
                </div>
              </div>
            )) : <p className="px-3 pb-5 text-sm text-ink-500">No recent activity.</p>}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
