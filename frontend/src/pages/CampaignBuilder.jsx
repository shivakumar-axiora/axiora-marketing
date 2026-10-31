import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiSave, FiSend, FiUsers, FiClock, FiSmartphone, FiMail, FiChevronRight, FiChevronLeft,
  FiFilter, FiTag, FiSearch, FiX, FiGlobe, FiFile, FiVideo,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { Card, Spinner, Badge } from "../components/ui";
import MessageComposer from "../components/MessageComposer";
import EmailComposer from "../components/EmailComposer";
import { campaignsApi, groupsApi, segmentsApi, templatesApi, mediaApi, contactsApi } from "../services/endpoints";
import { getErrorMessage } from "../services/api";
import { cx } from "../utils/format";

const SCHEDULE_TYPES = [
  { value: "immediate", label: "Send now" },
  { value: "scheduled", label: "Schedule once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", desc: "Bulk messages via the official WhatsApp Business Cloud API.", icon: FiSmartphone },
  { value: "email", label: "Email", desc: "HTML email campaigns sent via Resend.", icon: FiMail },
];

const STEPS = ["Channel", "Details", "Audience", "Message", "Schedule & Review"];

const CONTACT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "company", label: "Company" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "country_code", label: "Country code" },
];

// Header formats that require a matching media attachment on every send.
const MEDIA_HEADER_FORMATS = new Set(["IMAGE", "VIDEO", "DOCUMENT"]);

// Meta templates use numbered placeholders ({{1}}, {{2}}, …) in the body.
function extractTemplateVarKeys(body) {
  if (!body) return [];
  const keys = new Set();
  const re = /{{\s*(\d+)\s*}}/g;
  let m;
  while ((m = re.exec(body))) keys.add(m[1]);
  return [...keys].sort((a, b) => Number(a) - Number(b));
}

export default function CampaignBuilder() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [media, setMedia] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]); // [{id, name, phone, email}]
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState([]);
  const [audienceCount, setAudienceCount] = useState(null);
  const [countingAudience, setCountingAudience] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", channel: "whatsapp", subject: "", message_body: "Hello {{name}},\n\n",
    schedule_type: "immediate",
    scheduled_at: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    template_id: "", media_id: "", group_ids: [], segment_ids: [], contact_ids: [], all_contacts: false,
    template_variables: {},
  });

  useEffect(() => {
    Promise.all([groupsApi.list(), segmentsApi.list(), templatesApi.list(), mediaApi.list()]).then(([g, sg, t, m]) => {
      setGroups(g.data); setSegments(sg.data); setTemplates(t.data); setMedia(m.data);
    });
    if (isEdit) {
      campaignsApi.get(id).then(({ data }) => {
        setForm((f) => ({
          ...f, name: data.name, description: data.description || "", channel: data.channel || "whatsapp",
          subject: data.subject || "", message_body: data.message_body || "",
          schedule_type: data.schedule_type, scheduled_at: data.scheduled_at ? data.scheduled_at.slice(0, 16) : "",
          timezone: data.timezone, template_id: data.template_id || "", media_id: data.media_id || "",
          template_variables: data.template_variables || {},
        }));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleGroup = (gid) => set({ group_ids: form.group_ids.includes(gid) ? form.group_ids.filter((x) => x !== gid) : [...form.group_ids, gid] });
  const toggleSegment = (sid) => set({ segment_ids: form.segment_ids.includes(sid) ? form.segment_ids.filter((x) => x !== sid) : [...form.segment_ids, sid] });

  const addContact = (c) => {
    if (form.contact_ids.includes(c.id)) return;
    setSelectedContacts((s) => [...s, c]);
    set({ contact_ids: [...form.contact_ids, c.id] });
    setContactSearch(""); setContactResults([]);
  };
  const removeContact = (cid) => {
    setSelectedContacts((s) => s.filter((c) => c.id !== cid));
    set({ contact_ids: form.contact_ids.filter((x) => x !== cid) });
  };

  // Search-as-you-type contact picker for the "Individual Contacts" audience source.
  useEffect(() => {
    if (!contactSearch.trim()) { setContactResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await contactsApi.list({ search: contactSearch, size: 8 });
        setContactResults(data.items.filter((c) => !form.contact_ids.includes(c.id)));
      } catch { setContactResults([]); }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactSearch]);

  // Live "~N recipients" count — replaces the old client-side estimate with the real,
  // server-side resolution (same logic the campaign will actually send to).
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!form.all_contacts && !form.group_ids.length && !form.segment_ids.length && !form.contact_ids.length) {
        setAudienceCount(0);
        return;
      }
      setCountingAudience(true);
      try {
        const { data } = await contactsApi.audienceCount({
          group_ids: form.group_ids, segment_ids: form.segment_ids,
          contact_ids: form.contact_ids, all_contacts: form.all_contacts,
        });
        setAudienceCount(data.count);
      } catch { setAudienceCount(null); } finally { setCountingAudience(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [form.all_contacts, form.group_ids, form.segment_ids, form.contact_ids]);

  const isEmail = form.channel === "email";
  const channelTemplates = templates.filter((t) => (t.channel || "whatsapp") === form.channel);
  const hasAudience = form.all_contacts || form.group_ids.length > 0 || form.segment_ids.length > 0 || form.contact_ids.length > 0;
  const selectedTemplate = channelTemplates.find((t) => String(t.id) === String(form.template_id));
  const templateNotApproved = !isEmail && !!selectedTemplate && selectedTemplate.status !== "approved";
  const templateVarKeys = !isEmail && selectedTemplate ? extractTemplateVarKeys(selectedTemplate.body) : [];
  const templateHeaderType = (selectedTemplate?.header_type || "").toUpperCase();
  const templateNeedsMedia = !isEmail && MEDIA_HEADER_FORMATS.has(templateHeaderType);
  const missingHeaderMedia = templateNeedsMedia && !form.media_id;
  const selectedMedia = media.find((m) => String(m.id) === String(form.media_id));
  const headerMediaMismatch = !isEmail && templateNeedsMedia && !!selectedMedia
    && selectedMedia.media_type?.toUpperCase() !== templateHeaderType;
  const missingVarMapping = templateVarKeys.some((k) => !form.template_variables?.[k]);

  // Keep the variable mapping in sync with whichever template is currently selected —
  // default {{1}} to "name" since that's the overwhelmingly common case, leave the rest for the user to pick.
  useEffect(() => {
    if (isEmail || !selectedTemplate) return;
    const keys = extractTemplateVarKeys(selectedTemplate.body);
    if (keys.length === 0) return;
    setForm((f) => {
      const next = {};
      keys.forEach((k) => { next[k] = f.template_variables?.[k] || (k === "1" ? "name" : ""); });
      return { ...f, template_variables: next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.template_id]);

  const buildPayload = () => ({
    name: form.name, description: form.description, channel: form.channel, subject: form.subject,
    message_body: form.message_body,
    schedule_type: form.schedule_type,
    scheduled_at: form.schedule_type !== "immediate" && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    timezone: form.timezone,
    template_id: form.template_id ? Number(form.template_id) : null,
    media_id: !isEmail && form.media_id ? Number(form.media_id) : null,
    template_variables: !isEmail && form.template_id && Object.keys(form.template_variables || {}).length
      ? form.template_variables : null,
    group_ids: form.group_ids, segment_ids: form.segment_ids, contact_ids: form.contact_ids,
    all_contacts: form.all_contacts,
  });

  const save = async (thenSend = false) => {
    if (!form.name.trim()) { toast.error("Campaign name is required"); setStep(1); return; }
    if (isEmail && !form.subject.trim()) { toast.error("Subject line is required for email campaigns"); setStep(3); return; }
    if (!hasAudience) { toast.error("Select an audience — all contacts, a segment, a group, or specific contacts"); setStep(2); return; }
    if (thenSend && templateNotApproved) { toast.error("This WhatsApp template isn't approved in Meta yet — sending is blocked until it is"); setStep(3); return; }
    if (thenSend && missingVarMapping) { toast.error("Map every template variable to a contact field before sending"); setStep(3); return; }
    if (thenSend && missingHeaderMedia) { toast.error(`This template needs a ${templateHeaderType.toLowerCase()} header — attach one before sending`); setStep(3); return; }
    setSaving(true);
    try {
      let campaignId = id;
      if (isEdit) await campaignsApi.update(id, buildPayload());
      else { const { data } = await campaignsApi.create(buildPayload()); campaignId = data.id; }
      if (thenSend) {
        await campaignsApi.send(campaignId);
        toast.success(form.schedule_type === "immediate" ? "Campaign started!" : "Campaign scheduled!");
      } else {
        toast.success("Saved as draft");
      }
      navigate(`/campaigns/${campaignId}`);
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-brand-500" /></div>;

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Campaign" : "Create Campaign"}
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Campaigns", to: "/campaigns" }, { label: isEdit ? "Edit" : "New" }]} />

      {/* Steps */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className={cx("flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
            i === step ? "bg-brand-500 text-white" : i < step ? "bg-brand-50 text-brand-700" : "bg-white text-ink-500 border border-ink-200 dark:bg-slate-800")}>
            <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-xs", i === step ? "bg-white/20" : "bg-ink-100 dark:bg-slate-700")}>{i + 1}</span>
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
            {step === 0 && (
              <Card>
                <h3 className="mb-1 font-semibold">Choose a channel</h3>
                <p className="mb-4 text-sm text-ink-500">
                  {isEdit ? "The channel can't be changed after a campaign is created." : "Pick where this campaign will be delivered."}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CHANNELS.map((c) => (
                    <button key={c.value} type="button" disabled={isEdit}
                      onClick={() => set({ channel: c.value })}
                      className={cx("flex items-start gap-3 rounded-xl border p-4 text-left transition",
                        form.channel === c.value ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-ink-200 hover:border-brand-300 dark:border-slate-600",
                        isEdit && "cursor-not-allowed opacity-60")}>
                      <c.icon className="mt-0.5 h-5 w-5 text-brand-600" />
                      <div>
                        <div className="font-medium">{c.label}</div>
                        <div className="text-xs text-ink-500">{c.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {step === 1 && (
              <Card className="space-y-4">
                <div><label className="label">Campaign name *</label><input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Diwali Mega Sale" /></div>
                <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Short internal note about this campaign" /></div>
              </Card>
            )}

            {step === 2 && (
              <Card className="space-y-5">
                <div>
                  <h3 className="mb-1 font-semibold">Choose your audience</h3>
                  <p className="text-sm text-ink-500">
                    Combine sources freely — everything selected below is included.{isEmail && " Contacts without a valid email address will be skipped."}
                  </p>
                </div>

                {/* All contacts shortcut */}
                <button type="button" onClick={() => set({ all_contacts: !form.all_contacts })}
                  className={cx("flex w-full items-center justify-between rounded-xl border p-4 text-left transition",
                    form.all_contacts ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-ink-200 hover:border-brand-300 dark:border-slate-600")}>
                  <div className="flex items-center gap-3">
                    <FiGlobe className="h-5 w-5 text-brand-600" />
                    <div>
                      <div className="font-medium">All contacts</div>
                      <div className="text-xs text-ink-500">Every active contact you own — ignores the sources below.</div>
                    </div>
                  </div>
                  <span className={cx("h-5 w-5 rounded-full border-2", form.all_contacts ? "border-brand-500 bg-brand-500" : "border-ink-300")} />
                </button>

                <fieldset disabled={form.all_contacts} className={cx("space-y-5", form.all_contacts && "pointer-events-none opacity-40")}>
                  {/* Segments */}
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-700 dark:text-ink-200"><FiFilter className="h-4 w-4" /> Segments</h4>
                    {segments.length === 0 ? (
                      <p className="text-sm text-ink-500">No segments yet. Create one from the Segments page for reusable, self-updating targeting.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {segments.map((s) => (
                          <button key={s.id} type="button" onClick={() => toggleSegment(s.id)}
                            className={cx("rounded-full border px-3 py-1.5 text-sm font-medium transition",
                              form.segment_ids.includes(s.id) ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10" : "border-ink-200 text-ink-600 hover:border-brand-300 dark:border-slate-600")}>
                            {s.name} <span className="text-ink-400">· {s.matching_count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Groups */}
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-700 dark:text-ink-200"><FiTag className="h-4 w-4" /> Groups</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {groups.map((g) => (
                        <button key={g.id} type="button" onClick={() => toggleGroup(g.id)} className={cx("flex items-center justify-between rounded-xl border p-4 text-left transition",
                          form.group_ids.includes(g.id) ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-ink-200 hover:border-brand-300 dark:border-slate-600")}>
                          <div>
                            <div className="font-medium">{g.name}</div>
                            <div className="text-xs text-ink-500">{g.contact_count} contacts</div>
                          </div>
                          <span className={cx("h-5 w-5 rounded-full border-2", form.group_ids.includes(g.id) ? "border-brand-500 bg-brand-500" : "border-ink-300")} />
                        </button>
                      ))}
                      {groups.length === 0 && <p className="text-sm text-ink-500">No groups yet.</p>}
                    </div>
                  </div>

                  {/* Individual contacts */}
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-700 dark:text-ink-200"><FiUsers className="h-4 w-4" /> Individual contacts</h4>
                    <div className="relative">
                      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input className="input pl-9" placeholder="Search by name, phone, or email…" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
                      {contactResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card dark:border-slate-600 dark:bg-slate-800">
                          {contactResults.map((c) => (
                            <button key={c.id} type="button" onClick={() => addContact(c)}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-50 dark:hover:bg-slate-700">
                              <span>{c.name}</span>
                              <span className="text-xs text-ink-400">{c.email || `+${c.phone}`}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedContacts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedContacts.map((c) => (
                          <span key={c.id} className="flex items-center gap-1.5 rounded-full bg-ink-100 py-1 pl-3 pr-1.5 text-xs font-medium dark:bg-slate-700">
                            {c.name}
                            <button type="button" onClick={() => removeContact(c.id)} className="rounded-full p-0.5 hover:bg-ink-200 dark:hover:bg-slate-600"><FiX className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </fieldset>

                <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm dark:bg-slate-700/40">
                  <FiUsers className="h-4 w-4 text-brand-600" />
                  {countingAudience ? <Spinner className="h-4 w-4" /> : <span className="font-semibold">{audienceCount ?? 0}</span>}
                  <span className="text-ink-500">recipients will receive this campaign</span>
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <div className="mb-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Template (optional)</label>
                    <select className="input" value={form.template_id} onChange={(e) => set({ template_id: e.target.value })}>
                      <option value="">None — free text</option>
                      {channelTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}{!isEmail && ` (${t.language}${t.status !== "approved" ? ` · ${t.status}` : ""})`}
                        </option>
                      ))}
                    </select>
                    {!isEmail && channelTemplates.length === 0 && (
                      <p className="mt-1.5 text-xs text-ink-500">
                        No WhatsApp templates yet. <Link to="/templates" className="text-brand-600 underline">Create or sync one</Link>, or send as free text.
                      </p>
                    )}
                    {templateNotApproved && (
                      <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                        Not approved in Meta yet — sending will be blocked until it is. <Link to="/templates" className="underline">Manage templates</Link>
                      </p>
                    )}
                  </div>
                  {!isEmail && templateVarKeys.length > 0 && (
                    <div className="sm:col-span-2 rounded-xl border border-ink-200 p-3 dark:border-slate-600">
                      <p className="mb-2 text-xs font-semibold uppercase text-ink-500">Map template variables</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {templateVarKeys.map((k) => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="w-10 shrink-0 font-mono text-sm text-ink-500">{`{{${k}}}`}</span>
                            <select className="input" value={form.template_variables?.[k] || ""}
                              onChange={(e) => set({ template_variables: { ...form.template_variables, [k]: e.target.value } })}>
                              <option value="">Select a field…</option>
                              {CONTACT_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!isEmail && (
                    <div>
                      <label className="label">Attach media {templateNeedsMedia ? `(required — ${templateHeaderType.toLowerCase()} header)` : "(optional)"}</label>
                      <select className="input" value={form.media_id} onChange={(e) => set({ media_id: e.target.value })}>
                        <option value="">None</option>
                        {media.map((m) => <option key={m.id} value={m.id}>{m.original_name}</option>)}
                      </select>
                      {missingHeaderMedia && (
                        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                          This template's header is a {templateHeaderType.toLowerCase()} — attach a matching file or sending will be blocked.
                        </p>
                      )}
                      {headerMediaMismatch && (
                        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                          The template header expects {templateHeaderType.toLowerCase()}, but the attached file is {selectedMedia.media_type} — Meta will likely reject the send.
                        </p>
                      )}
                    </div>
                  )}
                  {isEmail && (
                    <div>
                      <label className="label">Subject line *</label>
                      <input className="input" value={form.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="Your exclusive offer, {{name}}!" />
                    </div>
                  )}
                </div>
                {isEmail
                  ? <EmailComposer value={form.message_body} onChange={(v) => set({ message_body: v })} />
                  : <MessageComposer value={form.message_body} onChange={(v) => set({ message_body: v })} />}
              </Card>
            )}

            {step === 4 && (
              <Card className="space-y-4">
                <div>
                  <label className="label">Delivery</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {SCHEDULE_TYPES.map((s) => (
                      <button key={s.value} onClick={() => set({ schedule_type: s.value })} className={cx("rounded-xl border px-3 py-2 text-sm font-medium transition",
                        form.schedule_type === s.value ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10" : "border-ink-200 text-ink-500 dark:border-slate-600")}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                {form.schedule_type !== "immediate" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="label">Start date & time</label><input type="datetime-local" className="input" value={form.scheduled_at} onChange={(e) => set({ scheduled_at: e.target.value })} /></div>
                    <div><label className="label">Timezone</label><input className="input" value={form.timezone} onChange={(e) => set({ timezone: e.target.value })} /></div>
                  </div>
                )}
                {templateNotApproved && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    The selected template ("{selectedTemplate?.name}") isn't approved in Meta yet, so sending is blocked.
                    Submit/approve it in Meta Business Manager, sync it on the <Link to="/templates" className="underline">Templates page</Link>, then come back to send — or save as a draft for now.
                  </div>
                )}
                {missingHeaderMedia && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    The selected template's header requires a {templateHeaderType.toLowerCase()} — go back to the <button type="button" className="underline" onClick={() => setStep(3)}>Message step</button> and attach one, or sending is blocked.
                  </div>
                )}
              </Card>
            )}
          </motion.div>

          <div className="mt-4 flex items-center justify-between">
            <button className="btn-secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><FiChevronLeft /> Back</button>
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next <FiChevronRight /></button>
            ) : (
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => save(false)} disabled={saving}><FiSave /> Save draft</button>
                <button className="btn-primary" onClick={() => save(true)} disabled={saving || templateNotApproved || missingHeaderMedia}
                  title={templateNotApproved ? "Template isn't approved in Meta yet" : missingHeaderMedia ? "Template requires a header attachment" : undefined}>
                  {saving ? <Spinner /> : <><FiSend /> {form.schedule_type === "immediate" ? "Send now" : "Schedule"}</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview panel */}
        <div>
          <Card className="sticky top-20">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              {isEmail ? <><FiMail /> Preview</> : <><FiSmartphone /> Preview</>}
            </h3>
            {isEmail ? (
              <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-slate-600">
                <div className="border-b border-ink-100 bg-ink-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-700/40">
                  {form.subject?.replace(/{{\s*name\s*}}/gi, "Aarav") || "(no subject)"}
                </div>
                <iframe title="Email preview" sandbox="" className="h-48 w-full bg-white"
                  srcDoc={form.message_body?.replace(/{{\s*name\s*}}/gi, "Aarav").replace(/{{\s*company\s*}}/gi, "Acme Corp").replace(/{{\s*city\s*}}/gi, "Mumbai") || ""} />
              </div>
            ) : (
              <div className="rounded-2xl bg-[#e5ddd5] p-3">
                <div className="max-w-[90%] overflow-hidden rounded-xl rounded-tl-none bg-white text-sm shadow">
                  {selectedMedia && (
                    selectedMedia.media_type === "image" ? (
                      <img src={selectedMedia.url} alt={selectedMedia.original_name} className="h-40 w-full object-cover" />
                    ) : selectedMedia.media_type === "video" ? (
                      <div className="flex h-40 w-full items-center justify-center bg-ink-100 text-ink-400 dark:bg-slate-700">
                        <FiVideo className="h-8 w-8" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 p-3 text-ink-600 dark:border-slate-700 dark:bg-slate-700/40">
                        <FiFile className="h-4 w-4 shrink-0" /> <span className="truncate text-xs">{selectedMedia.original_name}</span>
                      </div>
                    )
                  )}
                  <div className="p-3">
                    <p className="whitespace-pre-wrap text-ink-900">
                      {form.message_body?.replace(/{{\s*name\s*}}/gi, "Aarav").replace(/{{\s*company\s*}}/gi, "Acme Corp").replace(/{{\s*city\s*}}/gi, "Mumbai") || "Your message…"}
                    </p>
                    <p className="mt-1 text-right text-[10px] text-ink-400">12:30 ✓✓</p>
                  </div>
                </div>
              </div>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-500"><FiUsers className="h-4 w-4" /> Recipients</dt><dd className="font-medium">{audienceCount ?? 0}</dd></div>
              <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-ink-500"><FiClock className="h-4 w-4" /> Delivery</dt><dd className="font-medium capitalize">{form.schedule_type}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {form.all_contacts && <Badge color="green">All contacts</Badge>}
              {segments.filter((s) => form.segment_ids.includes(s.id)).map((s) => <Badge key={s.id} color="blue">{s.name}</Badge>)}
              {groups.filter((g) => form.group_ids.includes(g.id)).map((g) => <Badge key={g.id} color="green">{g.name}</Badge>)}
              {selectedContacts.map((c) => <Badge key={c.id}>{c.name}</Badge>)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
