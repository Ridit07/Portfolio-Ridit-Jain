import { useEffect, useRef, useState } from "react";
import { ACCENT } from "../App.jsx";

export default function Tabs({ active, onChange }) {
  const tabs = [
    { k: "about", label: "About" },
    { k: "resume", label: "Resume" },
    { k: "portfolio", label: "Projects" },
    { k: "blog", label: "Stats" },
    { k: "contact", label: "Contact" },
  ];

  const btnRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({});

  useEffect(() => {
    const el = btnRefs.current[active];
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [active]);

  return (
    <div className="mb-6 -mx-2 md:mx-0">
      <div className="overflow-x-auto no-scrollbar px-2">
        <div className="relative inline-flex gap-1 rounded-full bg-white/5 border border-white/10 p-1">
          <span
            className="absolute top-1 bottom-1 rounded-full bg-white/10 border border-white/10 shadow-inner transition-all duration-300"
            style={indicatorStyle}
          />
          {tabs.map((t) => {
            const isActive = active === t.k;
            return (
              <button
                key={t.k}
                ref={(el) => (btnRefs.current[t.k] = el)}
                onClick={() => onChange(t.k)}
                aria-current={isActive ? "page" : undefined}
                className={`
                  relative flex-none px-4 py-2 text-sm rounded-full transition
                  ${isActive ? "text-white" : "text-zinc-300 hover:text-white"}
                `}
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
