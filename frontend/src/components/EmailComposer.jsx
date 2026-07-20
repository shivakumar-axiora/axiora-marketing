import { useRef, useState } from "react";
import { FiCode, FiEye } from "react-icons/fi";

const VARIABLES = ["name", "email", "phone", "company", "city", "state"];

/** Raw-HTML email body composer with a sandboxed live preview. */
export default function EmailComposer({ value, onChange }) {
  const ref = useRef();
  const [mode, setMode] = useState("code");

  const insert = (text) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    onChange(value.slice(0, start) + text + value.slice(start));
    setTimeout(() => { el?.focus(); el?.setSelectionRange(start + text.length, start + text.length); }, 0);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="label !mb-0">Email body (HTML)</label>
        <div className="flex gap-1 rounded-lg bg-ink-100 p-0.5 dark:bg-slate-700">
          <button type="button" onClick={() => setMode("code")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${mode === "code" ? "bg-white text-ink-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-ink-500"}`}>
            <FiCode /> HTML
          </button>
          <button type="button" onClick={() => setMode("preview")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${mode === "preview" ? "bg-white text-ink-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-ink-500"}`}>
            <FiEye /> Preview
          </button>
        </div>
      </div>

      {mode === "code" ? (
        <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={10}
          className="w-full resize-none rounded-xl border border-ink-200 bg-white px-3 py-2.5 font-mono text-xs focus:outline-none dark:border-slate-600 dark:bg-slate-800"
          placeholder={"<p>Hi {{name}},</p>\n<p>Thanks for being a valued customer. Today's offer: 20% OFF 🎉</p>\n<p>Regards,<br/>Axiora Team</p>"} />
      ) : (
        <iframe title="Email preview" srcDoc={value || "<p style='color:#94a3b8;font-family:sans-serif'>Nothing to preview yet.</p>"}
          sandbox="" className="h-64 w-full rounded-xl border border-ink-200 bg-white dark:border-slate-600" />
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-ink-500">Insert variable:</span>
        {VARIABLES.map((v) => (
          <button type="button" key={v} onClick={() => insert(`{{${v}}}`)}
            className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300">
            {`{{${v}}}`}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-400">{value.length} chars</span>
      </div>
    </div>
  );
}
