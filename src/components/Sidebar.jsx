import React from "react";
import { MiniInfo, Icons } from "./ui.jsx";

/* Local accent to avoid circular import */
const ACCENT = "#f5c84b";

// fetch from env
const CV_LINK = import.meta.env.VITE_CV_LINK;

export default function Sidebar() {
  return (
    <aside
      className="
    rounded-2xl md:rounded-3xl bg-[#161a22] border border-white/10 p-5
    md:sticky md:top-6 z-20
    overflow-auto no-scrollbar
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
        <MiniInfo icon={<Icons.Mail />} label="EMAIL" value="riditjain07@gmail.com" />
        <MiniInfo icon={<Icons.Pin />} label="LOCATION" value="Gurugram, Haryana, India" />
      </div>

      {/* Social — proper buttons */}
      <div className="mt-5 grid grid-cols-1 gap-2">
        <SocialButton
          href="https://github.com/Ridit07"
          label="GitHub"
          icon={<Icons.GitHub />}
          accent={ACCENT}
        />
        <SocialButton
          href="https://www.linkedin.com/in/ridit-jain-479230214/"
          label="LinkedIn"
          icon={<Icons.LinkedIn />}
          accent={ACCENT}
        />
        <SocialButton
          href={CV_LINK}
          label="Download CV"
          icon={<DownloadIcon />}
          accent={ACCENT}
          download
        />
      </div>
    </aside>
  );
}

/* === Reusable, themed social button === */
function SocialButton({ href, label, icon, accent, download }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download={download}
      className="
        group relative inline-flex items-center justify-between
        rounded-2xl border border-white/10 bg-white/5
        px-4 py-3
        hover:bg-white/10 transition
      "
      aria-label={label}
      title={label}
      style={{ boxShadow: "0 6px 18px rgba(245,200,75,0.06)" }}
    >
      <span className="flex items-center gap-3">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-[#0f1115] group-hover:border-white/20"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="font-medium tracking-wide">{label}</span>
      </span>
      <span className="opacity-60 group-hover:opacity-100 transition" aria-hidden="true">
        <ChevronRightBold />
      </span>
      <span
        className="pointer-events-none absolute inset-x-3 -bottom-[2px] h-[2px] rounded-full opacity-70 group-hover:opacity-100 transition"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        aria-hidden="true"
      />
    </a>
  );
}

function ChevronRightBold() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/* clean download icon */
function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="M6 11l6 6 6-6" />
      <rect x="4" y="19" width="16" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}
