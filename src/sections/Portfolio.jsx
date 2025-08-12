import { useState } from "react";
import { SectionTitle } from "../components/ui.jsx";

export default function Portfolio() {
  const [tab, setTab] = useState("All");
  const filters = ["All", "Web development", "Applications", "AI/ML"];
  const projects = [
    { title: "InterviewPro", cat: "Web development", img: "https://picsum.photos/seed/interview/600/400", blurb: "AI-powered interview platform with cheat detection (eye-gaze/lip-sync).", tags:["React","Flask","LLM","MySQL","AWS"] },
    { title: "Lane Detection System", cat: "AI/ML", img: "https://picsum.photos/seed/lane/600/400", blurb: "CULane trained model with 92% precision, 89% recall.", tags:["TensorFlow","OpenCV"] },
    { title: "Medical Chatbot (LLM)", cat: "AI/ML", img: "https://picsum.photos/seed/med/600/400", blurb: "Llama-2 + QLoRA for medical QA.", tags:["Llama","QLoRA","LangChain"] },
    { title: "Gesture-to-Text (Assistive)", cat: "Applications", img: "https://picsum.photos/seed/gesture/600/400", blurb: "Real-time hand gesture recognition.", tags:["TensorFlow","OpenCV"] },
    { title: "IPLytics", cat: "Applications", img: "https://picsum.photos/seed/ipl/600/400", blurb: "Cricket analysis & demographics prediction.", tags:["Flutter","Flask","ML"] },
    { title: "Route Planning Engine", cat: "Web development", img: "https://picsum.photos/seed/route/600/400", blurb: "Daily visit plans + maps using OSRM.", tags:["Python","OSRM","Folium"] },
    { title: "VSS Blueprint Deployment", cat: "Web development", img: "https://picsum.photos/seed/vss/600/400", blurb: "Dockerized video search & summarization stack.", tags:["Docker","Compose","LLM"] },
    { title: "Redis Debug Dashboard", cat: "Web development", img: "https://picsum.photos/seed/redis/600/400", blurb: "Web UI to safely run read-only Redis queries.", tags:["React","Go","Redis"] },
  ];
  const shown = projects.filter((p) => tab === "All" || p.cat === tab);

  return (
    <section>
      <SectionTitle title="Portfolio" />
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setTab(f)}
            className={`rounded-full px-4 py-2 border transition ${tab === f ? "border-[color:var(--acc)] text-white bg-white/5" : "border-white/10 text-zinc-300 hover:bg-white/5"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {shown.map((p, i) => (
          <article key={i} className="rounded-2xl bg-[#0f1115] border border-white/10 overflow-hidden hover:border-white/20">
            <img loading="lazy" src={p.img} alt={`${p.title} preview`} className="h-40 w-full object-cover" />
            <div className="p-4">
              <p className="text-xs text-zinc-400">{p.cat}</p>
              <h5 className="mt-1 font-medium">{p.title}</h5>
              <p className="mt-1 text-sm text-zinc-300">{p.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {p.tags.map(t => <span key={t} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1">{t}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
