import React, { useState, useEffect, useRef } from "react";
import { SectionTitle } from "../components/ui.jsx";
import { ACCENT } from "../App.jsx";

const EXPERIENCE = [
  {
    logo: "Z",
    company: "Zomato (Hyperpure)",
    role: "Software Development Intern",
    type: "Full-time",
    period: "Jan 2025 – Jun 2025 · 6 mos",
    location: "Gurugram, Haryana, India · On-site",
    bullets: [
      "Independently designed and deployed multiple production-critical backend systems to streamline procurement workflows, pricing governance, and internal debugging tools.",
      "🔑 Key Contributions: 🧠 Intelligent Procurement Automation Built a real-time dashboard for operations teams to track movement requests and their distribution details, with filters for delivery date, warehouse code, product code/name, and outlet code/name.",
      "Resolved major inventory blocking by integrating with a scheduler service to track unfulfilled goods receipt notes. Events were scheduled to trigger auto-resolutions if no stock distribution arrived within 2 hours. Upon timeout, a cron job auto-moved inventory from temporary to permanent storage, fully eliminating manual SQL interventions. Impact: Reduced warehouse holding time by 30% and improved warehouse throughput."
    ],
    skills: "REST APIs, MySQL and +11 skills",
    skillsList: ["Go", "REST APIs", "MySQL", "Redis", "DynamoDB", "gRPC", "AWS", "Pricing engines", "Schedulers", "Dashboards", "Observability"]

  },
  {
    logo: "B",
    company: "BML Munjal University",
    role: "BMU Robotics Club Treasure",
    type: "",
    period: "Jul 2023 – Jun 2024 · 1 yr",
    location: "",
    bullets: [
      "Optimized budgeting, resource management, and inventory systems for the Robotics Club — ensuring seamless execution of hands-on workshops and competitions.",
    ],
    skills: "Budgeting, Event Logistics and +1 skill",
  },
  {
    logo: "B",
    company: "BML Munjal University",
    role: "BMU Robotics Club Vice President",
    type: "",
    period: "Jun 2022 – Jun 2023 · 1 yr 1 mo",
    location: "",
    bullets: [
      "Boosted Active Participation by 40% by fixing a scheduling gap that excluded day scholars due to late-evening timings.",
    ],
    skills: "Team Leadership, Robotics and +3 skills",
  },
  {
    logo: "H",
    company: "HCL Technologies",
    role: "Software Engineer Intern",
    type: "",
    period: "Jun 2023 – Jul 2023",
    location: "Noida, Uttar Pradesh, India",
    bullets: [
      "Built and deployed a full-stack AI-powered internal tool to automate vendor claim submissions, approvals, and invoicing."
    ],
    skills: "Python, Flutter, SQL, REST APIs",
  }
];

const EDUCATION = [
  {
    logo: "B",
    school: "B.M.L. Munjal University",
    degree: "B.Tech — Computer Science",
    period: "2021 — 2025",
    location: "Gurugram, Haryana, India",
    notes: "CGPA 8.08 · Coursework: DSA, OS, DBMS, CN, Distributed Systems, System Design"
  }
];

const SKILLS = [
  { name: "Go",        evidence: ["Software Development Intern at Zomato", "Endorsed by colleagues"], endorsements: 6, level: "proficient" },
  { name: "gRPC",      evidence: ["Prod services with retries/backoff"],   endorsements: 3, level: "proficient" },
  { name: "Redis",     evidence: ["Built internal read-only dashboard"],   endorsements: 5, level: "proficient" },
  { name: "React.js",  evidence: ["Internal tools + dashboards"],          endorsements: 4, level: "intermediate" },
  { name: "SQL",       evidence: ["MySQL, schema design, indexing"],       endorsements: 7, level: "proficient" },
  { name: "DynamoDB",  evidence: ["Pricing overrides, XLSX ingest"],       endorsements: 2, level: "intermediate" },
  { name: "AWS",       evidence: ["Timers, schedulers, infra basics"],     endorsements: 4, level: "intermediate" },
  { name: "C++",       evidence: ["Uni projects, CP"],                     endorsements: 4, level: "beginner" },
];

export default function Resume() {
  const [skillFilter, setSkillFilter] = useState("All");
  const filteredSkills = SKILLS.filter(s =>
    skillFilter === "All" ? true : s.level === skillFilter.toLowerCase()
  );

  return (
    <section>
      <SectionTitle title="Resume" />

      <Card title="Experience">
        {EXPERIENCE.map((item, i) => (
          <div key={i}>
            <ExperienceItem {...item} />
            {i !== EXPERIENCE.length - 1 && <Divider />}
          </div>
        ))}
      </Card>

      <Card title="Education">
        {EDUCATION.map((ed, i) => (
          <div key={i}>
            <EducationItem {...ed} />
            {i !== EDUCATION.length - 1 && <Divider />}
          </div>
        ))}
      </Card>

      <Card
        title="Skills"
        right={<FilterPills active={skillFilter} onChange={setSkillFilter} />}
      >
        <div className="grid md:grid-cols-2 gap-4">
          {filteredSkills.map((s, i) => (
            <SkillItem key={i} {...s} />
          ))}
        </div>
        <div className="mt-4 text-sm text-zinc-400">
          Legend: <LevelLegend />
        </div>
      </Card>
    </section>
  );
}

function Card({ title, right, children }) {
  return (
    <section className="mt-6 rounded-2xl bg-[#0f1115] border border-white/10">
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/10">
        <h4 className="text-lg font-semibold">{title}</h4>
        <div className="flex items-center gap-3">
          {right}
          <div className="hidden md:flex items-center gap-2 text-zinc-400">
            <PlusIcon /><PencilIcon />
          </div>
        </div>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function FilterPills({ active, onChange }) {
  const items = ["All", "Proficient", "Intermediate", "Beginner"];
  return (
    <div className="inline-flex gap-1 rounded-full bg-white/5 border border-white/10 p-1">
      {items.map((label) => {
        const isActive = active === label;
        return (
          <button
            key={label}
            onClick={() => onChange(label)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              isActive
                ? "bg-white/10 text-white border border-white/10"
                : "text-zinc-300 hover:text-white"
            }`}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Divider() {
  return <hr className="my-4 border-white/10" />;
}

function Logo({ text }) {
  return (
    <div className="h-12 w-12 flex-none rounded-md bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 grid place-items-center font-semibold">
      {text}
    </div>
  );
}

function ExperienceItem({ logo, company, role, type, period, location, bullets, skills, skillsList }) {
  return (
    <div className="flex gap-4">
      <Logo text={logo} />
      <div className="flex-1">
        <div className="font-semibold">{role}</div>
        <div className="text-sm text-zinc-300">{company}{type ? " · " + type : ""}</div>
        <div className="text-xs text-zinc-400">{period}</div>
        {location && <div className="text-xs text-zinc-400">{location}</div>}

        <Expandable>
          <ul className="mt-2 list-disc pl-5 text-zinc-300">
            {bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </Expandable>

        {skills && (
  <InlineSkills display={skills} list={skillsList} />
)}

      </div>
    </div>
  );
}

function EducationItem({ logo, school, degree, period, location, notes }) {
  return (
    <div className="flex gap-4">
      <Logo text={logo} />
      <div className="flex-1">
        <div className="font-semibold">{school}</div>
        <div className="text-sm text-zinc-300">{degree}</div>
        <div className="text-xs text-zinc-400">{period}</div>
        {location && <div className="text-xs text-zinc-400">{location}</div>}
        {notes && <p className="mt-2 text-zinc-300">{notes}</p>}
      </div>
    </div>
  );
}

function SkillItem({ name, evidence = [], endorsements = 0, level = "intermediate" }) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{name}</div>
        <ProficiencyCapsule level={level} />
      </div>
      {evidence.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-zinc-300">
          {evidence.map((e, i) => (
            <li key={i} className="flex items-start gap-2">
              <DotIcon /> <span>{e}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-xs text-zinc-400 flex items-center gap-2">
        <PeopleIcon /> {endorsements} endorsement{endorsements === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function ProficiencyCapsule({ level }) {
  const fill = { beginner: 1, intermediate: 2, proficient: 3 }[level] ?? 2;
  const label = { beginner: "Beginner", intermediate: "Intermediate", proficient: "Proficient" }[level] ?? "Intermediate";
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 py-1 px-1.5 rounded-full bg-white/5 border border-white/10">
        {[0,1,2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-6 rounded-full border border-white/10"
            style={{ background: i < fill ? ACCENT : "transparent" }}
          />
        ))}
      </div>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}

function LevelLegend() {
  return (
    <div className="inline-flex items-center gap-4">
      <LegendDot n={1} label="Beginner" />
      <LegendDot n={2} label="Intermediate" />
      <LegendDot n={3} label="Proficient" />
    </div>
  );
}
function LegendDot({ n, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex items-center gap-1 py-0.5 px-1 rounded-full bg-white/5 border border-white/10">
        {[0,1,2].map(i => (
          <span key={i} className="h-2 w-4 rounded-full border border-white/10"
            style={{ background: i < n ? ACCENT : "transparent" }} />
        ))}
      </span>
      <span className="text-xs text-zinc-400">{label}</span>
    </span>
  );
}

function Expandable({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <div className={open ? "" : "max-h-16 overflow-hidden"}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-1 text-xs text-zinc-400 hover:text-zinc-200"
      >
        {open ? "See less" : "…see more"}
      </button>
    </div>
  );
}

function InlineSkills({ display, list = [] }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      const inBtn = btnRef.current?.contains(e.target);
      const inPop = popRef.current?.contains(e.target);
      if (!inBtn && !inPop) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);

    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative mt-2">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-2"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Show related skills"
      >
        <BadgeIcon />
        {display}
      </button>

      {open && (
        <div
          ref={popRef}
          role="dialog"
          className="
            absolute left-0 mt-2 w-[min(520px,90vw)]
            rounded-2xl border border-white/10 bg-[#0f1115] p-3 z-30
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
          "
        >
          <div className="text-xs text-zinc-400 mb-2">Related skills</div>
          <div className="flex flex-wrap gap-2">
            {list.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: ACCENT }} />
                {s}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-zinc-500">Tip: click outside or press Esc</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs rounded-full px-3 py-1 border border-white/10 bg-white/5 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



function PlusIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v14M5 12h14"/></svg>); }
function PencilIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21l3.6-.6L20 7l-3-3L3.6 17.4z"/><path d="M14 6l3 3"/></svg>); }
function BadgeIcon() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 5 6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 7.9 9 7z"/></svg>); }
function PeopleIcon() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5 1.34 3.5 3 3.5zM8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2.01 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z"/></svg>); }
function DotIcon() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/></svg>); }
