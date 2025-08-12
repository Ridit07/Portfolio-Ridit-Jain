import { ACCENT } from "../App.jsx";

export function SectionTitle({ title }) {
  return (
    <div className="mb-2">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <div className="mt-1 h-1 w-8 rounded-full" style={{ background: ACCENT }} />
    </div>
  );
}

export function MiniInfo({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#0f1115] border border-white/10 p-3">
      <div className="text-[color:var(--acc)]">{icon}</div>
      <div className="text-left">
        <p className="text-[10px] tracking-widest text-zinc-400">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

export function IconLink({ href, label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
    >
      {children}
    </a>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#0f1115] border border-white/10 p-3 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] tracking-widest text-zinc-400">{label}</div>
    </div>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl bg-[#0f1115] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[color:var(--acc)] ${props.className || ""}`}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl bg-[#0f1115] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[color:var(--acc)] ${props.className || ""}`}
    />
  );
}

/* Minimal inline icons */
export const Icons = {
  Mail: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 2-8 6L4 6"/></svg>),
  Phone: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.05 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12.9.3 1.77.54 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1a2 2 0 0 1 2.11-.45c.84.24 1.71.42 2.61.54A2 2 0 0 1 22 16.92z"/></svg>),
  Cake: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v6"/><path d="M8 3c0 1.1.9 2 2 2s2-.9 2-2"/><path d="M21 14H3v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M21 14v5H3v-5"/></svg>),
  Pin: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z"/></svg>),
  Book: ({ className="" }) => (<svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20"/><path d="M20 22V6a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 6.5v13"/></svg>),
  Briefcase: ({ className="" }) => (<svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 11h18"/></svg>),
  Send: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>),
  GitHub: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.162 19.492c.5.092.682-.217.682-.483 0-.237-.009-.866-.013-1.7-2.776.603-3.362-1.34-3.362-1.34-.455-1.157-1.111-1.466-1.111-1.466-.908-.62.069-.607.069-.607 1.003.07 1.53 1.031 1.53 1.031.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.339-2.217-.252-4.55-1.108-4.55-4.934 0-1.089.39-1.982 1.03-2.679-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.851.004 1.707.115 2.507.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.393.1 2.646.642.697 1.028 1.59 1.028 2.679 0 3.835-2.337 4.679-4.561 4.927.359.309.678.919.678 1.852 0 1.336-.012 2.414-.012 2.741 0 .268.18.579.688.48A10 10 0 0 0 12 2z"/></svg>),
  LinkedIn: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 8.98h3.96V21H3V8.98zM9.5 8.98H13v1.64h.05c.49-.93 1.69-1.9 3.48-1.9 3.72 0 4.41 2.45 4.41 5.63V21H16.98v-4.92c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.59V21H9.5V8.98z"/></svg>)
};
