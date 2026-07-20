import { FiActivity } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { Card, Spinner, EmptyState, Badge } from "../components/ui";
import { logsApi } from "../services/endpoints";
import { useFetch } from "../hooks/useFetch";
import { formatDateTime } from "../utils/format";

const LEVELS = {
  api_errors: "red", user_login: "green", campaign_started: "blue", campaign_completed: "green",
  contacts_imported: "purple", settings_changed: "amber",
};

export default function ActivityLogs() {
  const { data: logs, loading } = useFetch(() => logsApi.activity(150));

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="Audit trail of everything that happens"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Activity" }]} />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
      ) : logs?.length === 0 ? (
        <EmptyState icon={FiActivity} title="No activity yet" />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-ink-100 dark:divide-slate-700">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink-50 dark:hover:bg-slate-700/30">
                <Badge color={LEVELS[l.action] || "gray"} className="capitalize">{l.action.replace(/_/g, " ")}</Badge>
                <div className="min-w-0 flex-1">
                  {l.entity && <span className="text-sm text-ink-500">{l.entity}{l.entity_id ? ` #${l.entity_id}` : ""}</span>}
                  {l.detail && <span className="ml-2 text-sm text-ink-500">— {l.detail}</span>}
                </div>
                <span className="whitespace-nowrap text-xs text-ink-400">{formatDateTime(l.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
