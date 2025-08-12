import { SectionTitle, Input, Textarea } from "../components/ui.jsx";
import { Icons } from "../components/ui.jsx";
import { ACCENT } from "../App.jsx";

export default function Contact() {
  return (
    <section>
      <SectionTitle title="Contact" />
      <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
        <iframe
          title="map"
          className="w-full h-72"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=Gurugram%20Haryana&output=embed"
        />
      </div>

      <h4 className="mt-6 text-lg font-semibold">Contact Form</h4>
      <form className="mt-3 grid gap-4" onSubmit={(e)=>{e.preventDefault(); alert('Message sent (demo)');}}>
        <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Full name" name="name" required />
          <Input placeholder="Email address" type="email" name="email" required />
        </div>
        <Textarea placeholder="Your Message" rows={6} name="message" required />
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
            style={{ background: ACCENT, color: "#111" }}
          >
            <Icons.Send /> Send Message
          </button>
        </div>
      </form>
    </section>
  );
}
