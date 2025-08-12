import { SectionTitle, ServiceCard, Testimonial } from "./sharedBlocks.jsx";

export default function About() {
  return (
    <section>
      <SectionTitle title="About Me" />
      <p className="mt-3 text-zinc-300 leading-relaxed">
        I’m a backend-leaning engineer who ships production-grade services, AI/data
        pipelines, and internal tools. I care about throughput, observability, and
        clean architecture teams can actually move fast on.
      </p>

      <h4 className="mt-8 text-lg font-semibold">What I'm Doing</h4>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ServiceCard title="Backend Systems" desc="Go, Python, gRPC, Redis, SQL/DynamoDB — optimized for throughput and reliability." />
        <ServiceCard title="Cloud & Infra" desc="AWS/Azure, Docker, K8s, CI/CD — production deployments with observability." />
        <ServiceCard title="AI + Data" desc="Search, summarization, YOLO pipelines, data labeling flows, evaluation." />
        <ServiceCard title="DX & Tools" desc="Developer dashboards, VS Code extensions, and internal productivity tooling." />
      </div>

      <h4 className="mt-8 text-lg font-semibold">Testimonials</h4>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Testimonial name="Rohit Patil" text="Built a reliable internal dashboard; reduced time-to-debug dramatically." />
        <Testimonial name="Dipti Sinha" text="Great comms and clean deliverables; shipped ahead of schedule." />
      </div>
    </section>
  );
}

/* local shared */
// export function ServiceCard({ title, desc }) {
//   return (
//     <div className="rounded-2xl bg-[#0f1115] border border-white/10 p-5">
//       <h5 className="font-medium">{title}</h5>
//       <p className="mt-1 text-sm text-zinc-300">{desc}</p>
//     </div>
//   );
// }
// export function Testimonial({ name, text }) {
//   return (
//     <div className="rounded-2xl bg-[#0f1115] border border-white/10 p-5">
//       <div className="flex items-center gap-3">
//         <div className="h-10 w-10 rounded-full bg-zinc-700" />
//         <div>
//           <p className="font-medium">{name}</p>
//           <p className="text-xs text-zinc-400">Client</p>
//         </div>
//       </div>
//       <p className="mt-3 text-zinc-300">{text}</p>
//     </div>
//   );
// }
export { SectionTitle } from "../components/ui.jsx";
