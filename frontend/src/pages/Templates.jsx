import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiStar, FiFileText, FiEye, FiSmartphone, FiMail } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import EmailComposer from "../components/EmailComposer";
import { Card, Modal, ConfirmDialog, EmptyState, Spinner, Badge } from "../components/ui";
import { templatesApi } from "../services/endpoints";
import { useFetch } from "../hooks/useFetch";
import { getErrorMessage } from "../services/api";
import { cx } from "../utils/format";

const CATEGORIES = ["marketing", "utility", "authentication"];
const LANGUAGES = ["en_US", "en_GB", "hi", "es", "fr", "pt_BR", "ar"];
const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", icon: FiSmartphone },
  { value: "email", label: "Email", icon: FiMail },
];

export default function Templates() {
  const [channel, setChannel] = useState("whatsapp");
  const [category, setCategory] = useState("");
  const isEmail = channel === "email";
  const { data: templates, loading, refetch } = useFetch(
    () => templatesApi.list({ channel, ...(category ? { category } : {}) }), [channel, category]
  );
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const { data } = await templatesApi.sync();
      toast.success(data.detail);
      refetch();
    } catch (e) { toast.error(getErrorMessage(e, "Configure WhatsApp API in Settings first")); }
    finally { setSyncing(false); }
  };

  const toggleFav = async (t) => {
    await templatesApi.update(t.id, { is_favorite: !t.is_favorite });
    refetch();
  };

  const doDelete = async () => {
    try { await templatesApi.remove(confirm.id); toast.success("Deleted"); setConfirm(null); refetch(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="Templates" subtitle="Manage reusable WhatsApp and Email templates"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Templates" }]}
        actions={<>
          {!isEmail && (
            <button className="btn-secondary" onClick={sync} disabled={syncing}>
              <FiRefreshCw className={cx(syncing && "animate-spin")} /> Sync from Meta
            </button>
          )}
          <button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> Create Template</button>
        </>} />

      <div className="mb-4 flex gap-2">
        {CHANNELS.map((c) => (
          <button key={c.value} onClick={() => { setChannel(c.value); setCategory(""); }}
            className={cx("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium",
              channel === c.value ? "bg-brand-500 text-white" : "bg-white text-ink-500 border border-ink-200 dark:bg-slate-800")}>
            <c.icon className="h-4 w-4" /> {c.label}
          </button>
        ))}
      </div>

      {!isEmail && (
        <div className="mb-4 flex gap-2">
          <button onClick={() => setCategory("")} className={cx("rounded-full px-4 py-1.5 text-sm font-medium", !category ? "bg-brand-500 text-white" : "bg-white text-ink-500 border border-ink-200 dark:bg-slate-800")}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={cx("rounded-full px-4 py-1.5 text-sm font-medium capitalize", category === c ? "bg-brand-500 text-white" : "bg-white text-ink-500 border border-ink-200 dark:bg-slate-800")}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
      ) : templates?.length === 0 ? (
        <EmptyState icon={FiFileText} title="No templates"
          description={isEmail ? "Create an email template to reuse across campaigns." : "Create a template or sync approved templates from your Meta account."}
          action={<button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> Create Template</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      {isEmail ? (
                        <span className="text-xs text-ink-500 line-clamp-1">{t.subject || "No subject"}</span>
                      ) : (
                        <>
                          <Badge color="blue" className="capitalize">{t.category}</Badge>
                          <span className="text-xs text-ink-500">{t.language}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => toggleFav(t)} className={cx("btn-ghost p-2", t.is_favorite && "text-amber-500")}>
                    <FiStar className={cx(t.is_favorite && "fill-amber-400")} />
                  </button>
                </div>
                <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-wrap rounded-xl bg-ink-50 p-3 text-sm text-ink-700 dark:bg-slate-700/40 dark:text-ink-200">
                  {(isEmail ? t.html_body?.replace(/<[^>]+>/g, " ") : t.body) || "—"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  {!isEmail && <StatusBadge status={t.status} type="template" />}
                  <div className="ml-auto flex gap-1">
                    <button className="btn-ghost p-2" onClick={() => setPreview(t)}><FiEye /></button>
                    <button className="btn-ghost p-2" onClick={() => setEditing(t)}><FiEdit2 /></button>
                    <button className="btn-ghost p-2 text-red-500" onClick={() => setConfirm(t)}><FiTrash2 /></button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {editing !== null && (
        <TemplateModal template={editing} channel={channel} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
      )}
      {preview && <PreviewModal template={preview} onClose={() => setPreview(null)} />}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} danger title="Delete template" confirmText="Delete" message={`Delete "${confirm?.name}"?`} />
    </div>
  );
}

function TemplateModal({ template, channel, onClose, onSaved }) {
  const isEdit = !!template.id;
  const isEmail = channel === "email";
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: template.name || "", category: template.category || "marketing", language: template.language || "en_US",
      header: template.header || "", body: template.body || "", footer: template.footer || "",
      subject: template.subject || "", html_body: template.html_body || "",
    },
  });
  const body = watch("body");
  const htmlBody = watch("html_body");

  const onSubmit = async (data) => {
    const payload = isEmail
      ? { name: data.name, subject: data.subject, html_body: data.html_body, channel: "email" }
      : { ...data, channel: "whatsapp" };
    try {
      if (isEdit) await templatesApi.update(template.id, payload);
      else await templatesApi.create(payload);
      toast.success(isEdit ? "Template updated" : "Template created");
      onSaved();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  if (isEmail) {
    return (
      <Modal open onClose={onClose} title={isEdit ? "Edit Email Template" : "Create Email Template"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label">Name *</label><input className="input" placeholder="welcome_offer" {...register("name", { required: true })} /></div>
          <div><label className="label">Subject *</label><input className="input" placeholder="Your exclusive offer, {{name}}!" {...register("subject", { required: true })} /></div>
          <EmailComposer value={htmlBody} onChange={(v) => setValue("html_body", v)} />
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : "Save"}</button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Template" : "Create Template"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Name *</label><input className="input" placeholder="welcome_offer" {...register("name", { required: true })} /></div>
        <div><label className="label">Category</label><select className="input capitalize" {...register("category")}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        <div><label className="label">Language</label><select className="input" {...register("language")}>{LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label">Header (optional)</label><input className="input" {...register("header")} /></div>
        <div className="sm:col-span-2"><label className="label">Body * — use {"{{name}}"}, {"{{company}}"}…</label><textarea className="input" rows={4} {...register("body", { required: true })} /></div>
        <div className="sm:col-span-2"><label className="label">Footer (optional)</label><input className="input" {...register("footer")} /></div>
        <div className="sm:col-span-2 rounded-xl bg-ink-50 p-3 dark:bg-slate-700/40">
          <p className="mb-1 text-xs font-semibold uppercase text-ink-500">Live Preview</p>
          <div className="whitespace-pre-wrap rounded-lg bg-[#dcf8c6] p-3 text-sm text-ink-900">{body || "Your message preview…"}</div>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

function PreviewModal({ template, onClose }) {
  const isEmail = (template.channel || "whatsapp") === "email";
  if (isEmail) {
    return (
      <Modal open onClose={onClose} title={template.name} size="lg">
        <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-slate-600">
          <div className="border-b border-ink-100 bg-ink-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-700/40">
            {template.subject || "(no subject)"}
          </div>
          <iframe title="Email preview" sandbox="" className="h-72 w-full bg-white" srcDoc={template.html_body || ""} />
        </div>
      </Modal>
    );
  }
  return (
    <Modal open onClose={onClose} title={template.name}>
      <div className="rounded-2xl bg-[#e5ddd5] p-4">
        <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-none bg-[#dcf8c6] p-3 shadow">
          {template.header && <p className="font-semibold">{template.header}</p>}
          <p className="whitespace-pre-wrap text-sm text-ink-900">{template.body}</p>
          {template.footer && <p className="mt-2 text-xs text-ink-500">{template.footer}</p>}
        </div>
      </div>
    </Modal>
  );
}
