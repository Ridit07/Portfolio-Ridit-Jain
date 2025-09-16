import { useState } from "react";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";

import Sidebar from "./components/Sidebar.jsx";
import Tabs from "./components/Tabs.jsx";
import About from "./sections/About.jsx";
import Resume from "./sections/Resume.jsx";
import Portfolio from "./sections/Portfolio.jsx";
import Blog from "./sections/Blog.jsx";
import Contact from "./sections/Contact.jsx";

export const ACCENT = "#f5c84b";

export default function App() {
  const [active, setActive] = useState("about");

  return (
    <div className="min-h-dvh w-full text-zinc-100">
      <div className="w-full max-w-none px-2 md:px-6 py-4 grid items-start gap-3 md:gap-6 md:grid-cols-[clamp(280px,22vw,380px),1fr]">

        <Sidebar />
        <main
          className="
            rounded-2xl md:rounded-3xl bg-[#161a22] border border-white/10
            p-4 md:p-6 min-h-[calc(100dvh-1rem)] md:min-h-[calc(100dvh-3rem)]
          "
        >
          <Tabs active={active} onChange={setActive} />
          {active === "about" && <About />}
          {active === "resume" && <Resume />}
          {active === "portfolio" && <Portfolio />}
          {active === "blog" && <Blog />}
          {active === "contact" && <Contact />}
        </main>
      </div>

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
