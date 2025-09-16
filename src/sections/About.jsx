import { SectionTitle, ServiceCard } from "./sharedBlocks.jsx";

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
        <ServiceCard
          title="Backend Systems"
          desc="Go, Python, gRPC, Redis, SQL/DynamoDB — optimized for throughput and reliability."
        />
        <ServiceCard
          title="Cloud & Infra"
          desc="AWS, Docker, CI/CD — production deployments with observability."
        />
        <ServiceCard
          title="AI & Machine Learning"
          desc="LLM-powered chatbots, DL models, and ML pipelines for real-world use cases."
        />
        <ServiceCard
          title="Application Development"
          desc="Web and mobile apps built with React, Flutter, Flask, and MySQL."
        />

      </div>

      <h4 className="mt-8 text-lg font-semibold">Achievements</h4>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ServiceCard
          title="🏆 Smart India Hackathon"
          desc="First Prize (Internal Round) — built AI-powered travel app for tourism."
        />
        <ServiceCard
          title="🤖 Robotics Club VP"
          desc="Boosted participation by 40% and led workshops on robotics & drones."
        />
      </div>
    </section>
  );
}

export { SectionTitle } from "../components/ui.jsx";
