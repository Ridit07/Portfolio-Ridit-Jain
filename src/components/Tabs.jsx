import { ACCENT } from "../App.jsx";

export default function Tabs({ active, onChange }) {
  const tabs = [
    { k: "about",     label: "About" },
    { k: "resume",    label: "Resume" },
    { k: "portfolio", label: "Portfolio" },
    { k: "blog",      label: "Blog" },
    { k: "contact",   label: "Contact" },
  ];

  return (
    <div className="mb-6 -mx-2 md:mx-0">
      {/* Mobile: horizontal scroll; Desktop: inline */}
      <div
        className="
          overflow-x-auto no-scrollbar px-2
        "
      >
        <div className="inline-flex gap-1 rounded-full bg-white/5 border border-white/10 p-1">
          {tabs.map((t) => {
            const isActive = active === t.k;
            return (
              <button
                key={t.k}
                onClick={() => onChange(t.k)}
                aria-current={isActive ? "page" : undefined}
                className={`
                  flex-none px-4 py-2 text-sm rounded-full transition
                  ${isActive ? "bg-white/10 text-white border border-white/10" : "text-zinc-300 hover:text-white"}
                `}
                style={isActive ? { boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.12)` } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <style>{`:root{--acc:${ACCENT}}`}</style>
    </div>
  );
}
