import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiKey, FiCheckCircle, FiXCircle, FiZap, FiCopy, FiSmartphone, FiMail } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { Card, Spinner, Badge } from "../components/ui";
import { settingsApi } from "../services/endpoints";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { cx } from "../utils/format";

const TABS = [
  { value: "whatsapp", label: "WhatsApp", icon: FiSmartphone },
  { value: "email", label: "Email", icon: FiMail },
];

export default function Settings() {
  const [tab, setTab] = useState("whatsapp");

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your WhatsApp and Email sending channels"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Settings" }]} />

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={cx("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium",
              tab === t.value ? "bg-brand-500 text-white" : "bg-white text-ink-500 border border-ink-200 dark:bg-slate-800")}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "whatsapp" ? <WhatsAppSettings /> : <EmailSettings />}
    </div>
  );
}

function WhatsAppSettings() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin", "marketing_manager");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = async () => {
    try {
      const { data } = await settingsApi.get();
      setSettings(data);
      reset({
        business_account_id: data.business_account_id, phone_number_id: data.phone_number_id,
        webhook_verify_token: data.webhook_verify_token, send_rate_per_second: data.send_rate_per_second,
        batch_size: data.batch_size, default_timezone: data.default_timezone,
      });
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    const payload = { ...data };
    // Only send credentials if user typed new values.
    if (!payload.access_token) delete payload.access_token;
    if (!payload.app_secret) delete payload.app_secret;
    try {
      await settingsApi.update(payload);
      toast.success("Settings saved");
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const test = async () => {
    setTesting(true);
    try { const { data } = await settingsApi.test(); toast.success(data.detail); load(); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setTesting(false); }
  };

  const webhookUrl = `${window.location.origin}/api/v1/webhooks/whatsapp`;

  if (loading) return <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold"><FiKey /> API Credentials</h3>
            {settings?.is_connected
              ? <Badge color="green"><FiCheckCircle /> Connected</Badge>
              : <Badge color="red"><FiXCircle /> Not connected</Badge>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">WhatsApp Business Account ID</label><input className="input" disabled={!canEdit} {...register("business_account_id")} /></div>
            <div><label className="label">Phone Number ID</label><input className="input" disabled={!canEdit} {...register("phone_number_id")} /></div>
          </div>
          <div>
            <label className="label">Permanent Access Token</label>
            <input className="input" type="password" disabled={!canEdit}
              placeholder={settings?.access_token_masked || "Enter token"} {...register("access_token")} />
            <p className="mt-1 text-xs text-ink-500">Stored encrypted. Leave blank to keep the current token.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">App Secret</label>
              <input className="input" type="password" disabled={!canEdit}
                placeholder={settings?.app_secret_masked || "Enter app secret"} {...register("app_secret")} />
            </div>
            <div><label className="label">Webhook Verify Token</label><input className="input" disabled={!canEdit} {...register("webhook_verify_token")} /></div>
          </div>

          <h3 className="flex items-center gap-2 pt-2 font-semibold"><FiZap /> Sending Preferences</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label">Rate (msgs/sec)</label><input type="number" className="input" disabled={!canEdit} {...register("send_rate_per_second")} /></div>
            <div><label className="label">Batch size</label><input type="number" className="input" disabled={!canEdit} {...register("batch_size")} /></div>
            <div><label className="label">Default timezone</label><input className="input" disabled={!canEdit} {...register("default_timezone")} /></div>
          </div>

          {canEdit && (
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={test} disabled={testing}>
                {testing ? <Spinner /> : <FiZap />} Test Connection
              </button>
              <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : "Save settings"}</button>
            </div>
          )}
        </Card>
      </form>

      <div className="space-y-6">
        <Card>
          <h3 className="mb-2 font-semibold">Webhook Setup</h3>
          <p className="text-sm text-ink-500">Add this callback URL in your Meta App → WhatsApp → Configuration.</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-50 p-2 dark:bg-slate-700/40">
            <code className="flex-1 truncate text-xs">{webhookUrl}</code>
            <button className="btn-ghost p-1.5" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied"); }}><FiCopy /></button>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <h3 className="font-semibold">Official Cloud API only</h3>
          <p className="mt-1 text-sm text-white/85">
            This platform uses Meta's official WhatsApp Business Platform. No browser automation or unofficial APIs are used, keeping your number compliant.
          </p>
        </Card>
      </div>
    </div>
  );
}

function EmailSettings() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin", "marketing_manager");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = async () => {
    try {
      const { data } = await settingsApi.getEmail();
      setSettings(data);
      reset({
        from_email: data.from_email, from_name: data.from_name,
        send_rate_per_second: data.send_rate_per_second, batch_size: data.batch_size,
      });
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    const payload = { ...data };
    if (!payload.resend_api_key) delete payload.resend_api_key;
    try {
      await settingsApi.updateEmail(payload);
      toast.success("Settings saved");
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const test = async () => {
    setTesting(true);
    try { const { data } = await settingsApi.testEmail(); toast.success(data.detail); load(); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setTesting(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold"><FiKey /> Resend API Credentials</h3>
            {settings?.is_connected
              ? <Badge color="green"><FiCheckCircle /> Connected</Badge>
              : <Badge color="red"><FiXCircle /> Not connected</Badge>}
          </div>
          <div>
            <label className="label">Resend API Key</label>
            <input className="input" type="password" disabled={!canEdit}
              placeholder={settings?.resend_api_key_masked || "Enter API key"} {...register("resend_api_key")} />
            <p className="mt-1 text-xs text-ink-500">Stored encrypted. Leave blank to keep the current key.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">From Email</label><input className="input" disabled={!canEdit} placeholder="marketing@yourdomain.com" {...register("from_email")} /></div>
            <div><label className="label">From Name</label><input className="input" disabled={!canEdit} placeholder="Axiora" {...register("from_name")} /></div>
          </div>

          <h3 className="flex items-center gap-2 pt-2 font-semibold"><FiZap /> Sending Preferences</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Rate (emails/sec)</label><input type="number" className="input" disabled={!canEdit} {...register("send_rate_per_second")} /></div>
            <div><label className="label">Batch size</label><input type="number" className="input" disabled={!canEdit} {...register("batch_size")} /></div>
          </div>

          {canEdit && (
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={test} disabled={testing}>
                {testing ? <Spinner /> : <FiZap />} Test Connection
              </button>
              <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : "Save settings"}</button>
            </div>
          )}
        </Card>
      </form>

      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <h3 className="font-semibold">Official Resend API</h3>
          <p className="mt-1 text-sm text-white/85">
            Email campaigns are sent through Resend's official API. Don't have an account yet? Sign up at resend.com — their sandbox sender works without domain verification for testing.
          </p>
        </Card>
      </div>
    </div>
  );
}
