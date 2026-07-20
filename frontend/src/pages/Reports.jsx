import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { FiDownload, FiFileText, FiFile } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { Card, Spinner, EmptyState } from "../components/ui";
import { reportsApi } from "../services/endpoints";
import { useFetch } from "../hooks/useFetch";
import api, { TOKEN_KEY } from "../services/api";

const COLORS = ["#25D366", "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b"];

export default function Reports() {
  const { data, loading } = useFetch(() => reportsApi.summary());
  const { data: failures } = useFetch(() => reportsApi.failureReasons());

  const download = (format) => {
    const token = localStorage.getItem(TOKEN_KEY);
    fetch(`${api.defaults.baseURL}${reportsApi.exportUrl(format)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `report.${format === "excel" ? "xlsx" : format}`;
        a.click();
      })
      .catch(() => toast.error("Export failed"));
  };

  const totals = data?.totals;
  const chartData = (data?.campaigns || []).slice(0, 8).map((c) => ({ name: c.campaign.slice(0, 12), Delivered: c.delivered, Failed: c.failed, Sent: c.sent }));

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Delivery performance across campaigns"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Reports" }]}
        actions={<>
          <button className="btn-secondary" onClick={() => download("csv")}><FiDownload /> CSV</button>
          <button className="btn-secondary" onClick={() => download("excel")}><FiFileText /> Excel</button>
          <button className="btn-secondary" onClick={() => download("pdf")}><FiFile /> PDF</button>
        </>} />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {[
              ["Total", totals.total], ["Sent", totals.sent], ["Delivered", totals.delivered],
              ["Read", totals.read], ["Failed", totals.failed], ["Delivery %", `${totals.delivery_pct}%`],
            ].map(([label, value]) => (
              <Card key={label} className="text-center">
                <div className="text-2xl font-bold text-ink-900 dark:text-white">{value}</div>
                <div className="text-sm text-ink-500">{label}</div>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h3 className="mb-4 font-semibold">Campaign Performance</h3>
              {chartData.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-ink-100 dark:stroke-slate-700" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RTooltip />
                    <Legend />
                    <Bar dataKey="Delivered" stackId="a" fill="#25D366" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Failed" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState title="No data yet" description="Run a campaign to see analytics." />}
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold">Failure Reasons</h3>
              {failures?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={failures} dataKey="count" nameKey="reason" outerRadius={90} label>
                      {failures.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState title="No failures" description="All messages delivered successfully." />}
            </Card>
          </div>

          <Card className="mt-6 !p-0">
            <h3 className="p-5 font-semibold">Campaign Breakdown</h3>
            {data?.campaigns?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y border-ink-100 bg-ink-50 text-left text-xs uppercase text-ink-500 dark:border-slate-700 dark:bg-slate-700/40">
                    <tr>{["Campaign", "Status", "Total", "Sent", "Delivered", "Failed", "Delivery %", "Success %"].map((h) => <th key={h} className="px-5 py-2.5">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c) => (
                      <tr key={c.campaign_id} className="border-b border-ink-100 last:border-0 dark:border-slate-700">
                        <td className="px-5 py-3 font-medium">{c.campaign}</td>
                        <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-5 py-3">{c.total}</td>
                        <td className="px-5 py-3">{c.sent}</td>
                        <td className="px-5 py-3 text-brand-600">{c.delivered}</td>
                        <td className="px-5 py-3 text-red-500">{c.failed}</td>
                        <td className="px-5 py-3">{c.delivery_pct}%</td>
                        <td className="px-5 py-3">{c.success_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="p-5"><EmptyState title="No campaigns" /></div>}
          </Card>
        </>
      )}
    </div>
  );
}
