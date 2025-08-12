import { SectionTitle } from "../components/ui.jsx";

export default function Blog() {
  const posts = [
    { title: "Designing a Price-Control Guardrail in Go", cat: "Backend", date: "Mar 2025", img: "https://picsum.photos/seed/pc/700/460", excerpt: "Blocking below-cost updates with overrides, DynamoDB, and audits." },
    { title: "Taming Event Noise with Redis Caching", cat: "Systems", date: "Apr 2025", img: "https://picsum.photos/seed/noise/700/460", excerpt: "Cutting 65% of non-actionable messages while staying idempotent." },
    { title: "gRPC in Production: Timeouts, Retries, Backoff", cat: "Backend", date: "May 2025", img: "https://picsum.photos/seed/grpc/700/460", excerpt: "Patterns that saved us when services got chatty." },
    { title: "Redis Pipelining for Faster Dashboards", cat: "Infra", date: "Jun 2025", img: "https://picsum.photos/seed/pipeline/700/460", excerpt: "Turning a 10-minute CLI routine into a sub-minute UI flow." },
    { title: "Observability for Busy Teams", cat: "Ops", date: "Jul 2025", img: "https://picsum.photos/seed/obs/700/460", excerpt: "The minimum viable logs/metrics/traces I set up on day one." },
    { title: "Ship Fewer Features, Harder", cat: "Process", date: "Aug 2025", img: "https://picsum.photos/seed/focus/700/460", excerpt: "Depth over breadth in early systems." },
  ];
  return (
    <section>
      <SectionTitle title="Blog" />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {posts.map((p, i) => (
          <article key={i} className="rounded-2xl bg-[#0f1115] border border-white/10 overflow-hidden">
            <img loading="lazy" src={p.img} alt="" className="h-44 w-full object-cover" />
            <div className="p-5">
              <p className="text-xs text-zinc-400">{p.cat} • {p.date}</p>
              <h5 className="mt-1 text-lg font-semibold">{p.title}</h5>
              <p className="mt-1 text-zinc-300">{p.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
