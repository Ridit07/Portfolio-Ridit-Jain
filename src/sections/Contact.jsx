import { useState } from "react";
import { SectionTitle, Input, Textarea } from "../components/ui.jsx";
import { Icons } from "../components/ui.jsx";
import { ACCENT } from "../App.jsx";

const FORM_ENDPOINT = "https://formspree.io/f/xzzgdgbl";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (status.type) setStatus({ type: "", msg: "" });
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: "error", msg: "Please fill out all fields." });
      return false;
    }
    const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOK) {
      setStatus({ type: "error", msg: "Please enter a valid email address." });
      return false;
    }
    if (form.company) {
      setStatus({ type: "error", msg: "Spam detected." });
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setStatus({ type: "", msg: "" });

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
        }),
      });

      if (res.ok) {
        setForm({ name: "", email: "", message: "", company: "" });
        setStatus({ type: "success", msg: "Thanks! Your message has been sent." });
      } else {
        setStatus({ type: "error", msg: "Oops! Something went wrong. Please try again later." });
      }
    } catch {
      setStatus({ type: "error", msg: "Network error: Unable to send message." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <SectionTitle title="Contact" />

      {status.type && (
        <div
          className={`mt-3 rounded-xl border px-3 py-2 text-sm ${status.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          role="status"
        >
          {status.msg}
        </div>
      )}

      <form className="mt-4 grid gap-4" onSubmit={onSubmit} noValidate>
        {/* honeypot */}
        <input
          type="text"
          name="company"
          value={form.company}
          onChange={onChange}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Full name"
            name="name"
            value={form.name}
            onChange={onChange}
            required
            disabled={submitting}
          />
          <Input
            placeholder="Email address"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            disabled={submitting}
          />
        </div>

        <Textarea
          placeholder="Your message"
          rows={6}
          name="message"
          value={form.message}
          onChange={onChange}
          required
          disabled={submitting}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: ACCENT, color: "#111" }}
          >
            {submitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/60 border-t-transparent" />
                Sending…
              </>
            ) : (
              <>
                <Icons.Send /> Send Message
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
