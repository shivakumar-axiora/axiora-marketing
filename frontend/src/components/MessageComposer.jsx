import { useRef } from "react";
import { FiBold, FiItalic, FiLink, FiCornerDownLeft } from "react-icons/fi";
import { MdStrikethroughS, MdEmojiEmotions } from "react-icons/md";

const VARIABLES = ["name", "phone", "company", "city", "state"];
const EMOJIS = ["😀", "🎉", "🔥", "✅", "👍", "🙏", "❤️", "🛍️", "💰", "🎁", "📢", "⭐"];

/** WhatsApp-style rich text composer. WhatsApp uses *bold*, _italic_, ~strike~. */
export default function MessageComposer({ value, onChange }) {
  const ref = useRef();

  const wrap = (before, after = before) => {
    const el = ref.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || "text";
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };

  const insert = (text) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    onChange(value.slice(0, start) + text + value.slice(start));
    setTimeout(() => { el?.focus(); el?.setSelectionRange(start + text.length, start + text.length); }, 0);
  };

  return (
    <div>
      <label className="label">Compose message</label>
      <div className="overflow-hidden rounded-xl border border-ink-200 dark:border-slate-600">
        <div className="flex flex-wrap items-center gap-1 border-b border-ink-100 bg-ink-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-700/40">
          <ToolBtn onClick={() => wrap("*")} title="Bold"><FiBold /></ToolBtn>
          <ToolBtn onClick={() => wrap("_")} title="Italic"><FiItalic /></ToolBtn>
          <ToolBtn onClick={() => wrap("~")} title="Strikethrough"><MdStrikethroughS /></ToolBtn>
          <ToolBtn onClick={() => insert("https://")} title="Link"><FiLink /></ToolBtn>
          <ToolBtn onClick={() => insert("\n")} title="Line break"><FiCornerDownLeft /></ToolBtn>
          <div className="mx-1 h-5 w-px bg-ink-200 dark:bg-slate-600" />
          <div className="group relative">
            <ToolBtn title="Emoji"><MdEmojiEmotions /></ToolBtn>
            <div className="absolute z-10 hidden w-56 grid-cols-6 gap-1 rounded-xl border border-ink-100 bg-white p-2 shadow-card group-hover:grid dark:border-slate-700 dark:bg-slate-800">
              {EMOJIS.map((e) => <button type="button" key={e} className="rounded-lg p-1 text-lg hover:bg-ink-100 dark:hover:bg-slate-700" onClick={() => insert(e)}>{e}</button>)}
            </div>
          </div>
        </div>
        <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={8}
          className="w-full resize-none bg-white px-3 py-2.5 text-sm focus:outline-none dark:bg-slate-800"
          placeholder={"Hello {{name}},\n\nThank you for being our valued customer.\nToday's offer: 20% OFF 🎉\n\nRegards,\nAxiora Team"} />
      </div>
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

function ToolBtn({ children, ...rest }) {
  return (
    <button type="button" {...rest} className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-slate-600">
      {children}
    </button>
  );
}
