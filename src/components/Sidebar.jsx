import React, { useState } from "react";
import { MiniInfo, IconLink, Stat, Icons } from "./ui.jsx";

/* Local accent to avoid circular import */
const ACCENT = "#f5c84b";

export default function Sidebar() {
  return (
    <aside
      className="
        rounded-2xl md:rounded-3xl bg-[#161a22] border border-white/10 p-5
        md:sticky md:top-6 z-20
        md:h-[calc(100dvh-3rem)] overflow-auto no-scrollbar
      "
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 overflow-hidden">
          <div className="h-full w-full grid place-items-center text-zinc-300 text-xs">Avatar</div>
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-wide">Ridit Jain</h1>
        <p className="text-xs text-zinc-400">Backend Engineer • AI/Cloud</p>
      </div>

      {/* Info */}
      <div className="mt-5 space-y-3">
        <MiniInfo icon={<Icons.Mail />}  label="EMAIL"    value="riditjain07@gmail.com" />
        <MiniInfo icon={<Icons.Phone />} label="PHONE"    value="+91 9560410184" />
        <MiniInfo icon={<Icons.Cake />}  label="BIRTHDAY" value="2 March, 2003" />
        <MiniInfo icon={<Icons.Pin />}   label="LOCATION" value="Gurugram, Haryana, India" />
      </div>

      {/* Social */}
      <div className="mt-5 flex items-center gap-2 md:justify-start justify-center">
        <IconLink href="https://github.com/Ridit07" label="GitHub"><Icons.GitHub /></IconLink>
        <IconLink href="https://www.linkedin.com/in/ridit-jain-479230214/" label="LinkedIn"><Icons.LinkedIn /></IconLink>
        <IconLink href="mailto:riditjain07@gmail.com" label="Email"><Icons.Mail /></IconLink>
      </div>

      {/* Quick stats */}
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="Services" value="10+" />
        <Stat label="Deploys"  value="50+" />
        <Stat label="Uptime"   value=">99%" />
      </div>

      {/* === New: Actions (best place — directly in the sidebar) === */}
      <ActionPanel />

      
    </aside>
  );
}

/* Copy email action with feedback */
/* Accent used in the UI */

/* ===== Beautiful compact action panel ===== */
function ActionPanel() {
  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-[#0f1115] p-4">
      {/* Header strip */}
      <div
        className="mb-3 h-[2px] rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }}
      />

      {/* Primary CTA */}
      <a
        href="https://cal.com/your-handle/30min"
        className="group relative block w-full rounded-xl px-4 py-3 text-center font-semibold"
        style={{
          background: `linear-gradient(180deg, ${ACCENT}, #e5b63d)`,
          color: "#0f1115",
          boxShadow: "0 6px 18px rgba(245,200,75,0.25)"
        }}
      >
        <div className="inline-flex items-center gap-2">
          <CalendarSolid />
          <span>Schedule a 30-min call</span>
        </div>
        <span className="absolute inset-0 rounded-xl ring-0 ring-[rgba(245,200,75,0.0)] group-hover:ring-2 transition" />
      </a>

      {/* Secondary actions — labeled tiles */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <CopyEmailTile email="riditjain07@gmail.com" />
        <TileLink
          href="https://wa.me/919560410184"
          label="WhatsApp"
          icon={<WhatsAppSolid />}
        />
        <TileLink
          href="/RiditJain_CV.pdf"
          label="Resume"
          icon={<DownloadSolid />}
          download
        />
      </div>
    </div>
  );
}

/* ---- tiles ---- */
function TileLink({ href, label, icon, download }) {
  return (
    <a
      href={href}
      download={download}
      className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-2 text-center"
      title={label}
      aria-label={label}
    >
      <div className="mx-auto h-9 w-9 rounded-lg grid place-items-center bg-[#0f1115] border border-white/10 group-hover:border-white/20">
        {icon}
      </div>
      <div className="mt-1 text-[11px] text-zinc-300">{label}</div>
    </a>
  );
}

function CopyEmailTile({ email }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(email); setOk(true); setTimeout(()=>setOk(false), 1100); } catch {}
      }}
      className="group w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-2 text-center"
      title="Copy email"
      aria-live="polite"
    >
      <div className="mx-auto h-9 w-9 rounded-lg grid place-items-center bg-[#0f1115] border border-white/10 group-hover:border-white/20">
        {ok ? <CheckSolid /> : <CopySolid />}
      </div>
      <div className="mt-1 text-[11px] text-zinc-300">{ok ? "Copied" : "Copy email"}</div>
    </button>
  );
}

/* ---- bolder icons for visibility ---- */
function CalendarSolid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="5" width="18" height="16" rx="2"></rect>
      <path d="M7 2v3M17 2v3M3 9h18" stroke="#0f1115" strokeWidth="1.3" />
    </svg>
  );
}
function WhatsAppSolid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 12a8 8 0 1 1-12.2 6.7L4 20l1.3-3.6A8 8 0 0 1 20 12z" />
      <path d="M8.7 8.9c-.2-.5-.4-.5-.6-.5-.9 0-1.9.9-1.5 2.3.5 1.6 2.3 3.6 4.4 4.9 2.1 1.3 3.2 1.4 3.9 1.2.7-.2 1.3-.8 1.5-1.5.2-.6.1-1-.1-1.2s-1.4-.6-1.9-.8c-.5-.2-.8.1-1 .4l-.7.8c-.2.2-.3.2-.6.1-1.1-.5-2.1-1.1-3-2-.9-.9-1.4-1.7-1.6-2.1-.1-.2 0-.4.2-.6l.9-1c.1-.2.1-.4 0-.6l-.7-1.6z" />
    </svg>
  );
}
function DownloadSolid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10l3.8-3.8L12 3z" />
      <path d="M5 21h14" />
      <path d="M12 13l-3.8-3.8L12 3v10z" />
    </svg>
  );
}
function CopySolid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <rect x="5" y="5" width="10" height="10" rx="2" />
    </svg>
  );
}
function CheckSolid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
