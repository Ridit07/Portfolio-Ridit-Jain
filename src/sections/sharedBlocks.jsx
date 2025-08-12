// src/sections/sharedBlocks.jsx
export { SectionTitle } from "../components/ui.jsx";

export function ServiceCard({ title, desc }) {
  return (
    <div className="rounded-2xl bg-[#0f1115] border border-white/10 p-5">
      <h5 className="font-medium">{title}</h5>
      <p className="mt-1 text-sm text-zinc-300">{desc}</p>
    </div>
  );
}

export function Testimonial({ name, text }) {
  return (
    <div className="rounded-2xl bg-[#0f1115] border border-white/10 p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-zinc-700" />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-zinc-400">Client</p>
        </div>
      </div>
      <p className="mt-3 text-zinc-300">{text}</p>
    </div>
  );
}
