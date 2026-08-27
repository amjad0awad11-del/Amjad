"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { gsap, EASE, prefersReducedMotion } from "@/lib/motion";
import { RevealText } from "@/components/motion/RevealText";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SmartLink } from "@/components/ui/SmartLink";
import { Glow } from "@/components/motion/Atmosphere";
import { kontakt } from "@/content/de";

type Errors = Partial<Record<"name" | "email" | "message" | "consent", string>>;
type Status = "idle" | "sending" | "sent" | "error";

/**
 * A24 — floating-label field.
 *
 * The label doubles as the visible label, moving above the input on focus or
 * once it holds a value; the focus underline draws in from the left. Errors are
 * announced next to their own field, not collected at the top.
 */
function Field({
  id,
  label,
  type = "text",
  required,
  error,
  multiline,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  multiline?: boolean;
  autoComplete?: string;
}) {
  const [filled, setFilled] = useState(false);
  const [focused, setFocused] = useState(false);
  const lifted = filled || focused;
  const Tag = multiline ? "textarea" : "input";

  return (
    <div className="relative pt-6">
      <label
        htmlFor={id}
        className={clsx("absolute left-0 origin-left transition-all duration-300", lifted ? "t-mono" : "t-body")}
        style={{
          top: lifted ? 0 : "2.15rem",
          color: lifted ? "var(--muted)" : "var(--fg)",
        }}
      >
        {label}
        {!required && <span className="t-muted"> ({kontakt.form.optional})</span>}
      </label>

      <Tag
        id={id}
        name={id}
        type={multiline ? undefined : type}
        required={required}
        autoComplete={autoComplete}
        rows={multiline ? 4 : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onFocus={() => setFocused(true)}
        onBlur={(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setFocused(false);
          setFilled(event.target.value.trim().length > 0);
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          setFilled(event.target.value.trim().length > 0)
        }
        className="w-full resize-none border-b bg-transparent pb-3 pt-2"
        style={{ borderColor: error ? "#E5484D" : "var(--hairline)", minHeight: 44 }}
      />

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 block h-px origin-left transition-transform duration-300"
        style={{
          backgroundColor: "var(--accent)",
          transform: focused ? "scaleX(1)" : "scaleX(0)",
        }}
      />

      {error && (
        <p id={`${id}-error`} className="t-mono mt-2" style={{ color: "#E5484D" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/** S13 — Kontakt. Form micro-interactions (A24), amber spotlight and glow (A31). */
export function Kontakt() {
  const scope = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  // Cursor-following spotlight, fed through CSS custom properties.
  useEffect(() => {
    const element = scope.current;
    if (!element || prefersReducedMotion() || window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty("--sx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      element.style.setProperty("--sy", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };

    element.addEventListener("pointermove", onMove);
    return () => element.removeEventListener("pointermove", onMove);
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      website: String(data.get("website") ?? ""),
      budget: String(data.get("budget") ?? ""),
      message: String(data.get("message") ?? ""),
      consent: data.get("consent") === "on",
      company: String(data.get("company") ?? ""),
    };

    // Same rules as the route handler, so the first pass needs no round trip.
    const next: Errors = {};
    if (payload.name.trim().length < 2) next.name = kontakt.form.errors.name;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) next.email = kontakt.form.errors.email;
    if (payload.message.trim().length < 10) next.message = kontakt.form.errors.message;
    if (!payload.consent) next.consent = kontakt.form.errors.consent;

    setErrors(next);
    if (Object.keys(next).length > 0) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        if (result.fields) setErrors(result.fields as Errors);
        setStatus("error");
        return;
      }

      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      ref={scope}
      id={kontakt.id}
      data-theme="dark"
      aria-labelledby="kontakt-title"
      className="section-y relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(600px circle at var(--sx, 70%) var(--sy, 40%), color-mix(in srgb, var(--amber) 9%, transparent), transparent 70%)",
      }}
    >
      <Glow className="right-[-10%] top-[20%] h-[50vmax] w-[50vmax]" />

      <div className="wrap grid gap-16 lg:grid-cols-12">
        <div className="flex flex-col gap-10 lg:col-span-5">
          <SectionHeader label={kontakt.label} title={kontakt.title} titleId="kontakt-title" />
          <RevealText as="p" className="t-body t-muted">
            {kontakt.sub}
          </RevealText>

          <dl className="flex flex-col gap-5 border-t pt-8" style={{ borderColor: "var(--hairline)" }}>
            <dt className="sr-only">{kontakt.directTitle}</dt>
            {kontakt.direct.map((item) => (
              <dd key={item.label} className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="t-mono t-muted w-24">{item.label}</span>
                <SmartLink href={item.href} className="link-underline" data-cursor="link">
                  {item.value}
                </SmartLink>
              </dd>
            ))}
          </dl>
        </div>

        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8 lg:col-span-6 lg:col-start-7">
          {/* Honeypot — off-screen, never announced, never tab-reachable. */}
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <label htmlFor="company">{kontakt.form.honeypotLabel}</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <Field id="name" label={kontakt.form.name} required error={errors.name} autoComplete="name" />
          <Field
            id="email"
            label={kontakt.form.email}
            type="email"
            required
            error={errors.email}
            autoComplete="email"
          />
          <Field id="website" label={kontakt.form.website} type="url" autoComplete="url" />

          <div className="flex flex-col gap-2 pt-2">
            <label htmlFor="budget" className="t-mono t-muted">
              {kontakt.form.budget.label}
            </label>
            <select
              id="budget"
              name="budget"
              defaultValue=""
              className="w-full border-b bg-transparent pb-3 pt-2"
              style={{ borderColor: "var(--hairline)", minHeight: 44, color: "var(--fg)" }}
            >
              <option value="" style={{ color: "var(--ink)" }}>
                {kontakt.form.budget.placeholder}
              </option>
              {kontakt.form.budget.options.map((option) => (
                <option key={option} value={option} style={{ color: "var(--ink)" }}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <Field id="message" label={kontakt.form.message} required multiline error={errors.message} />

          <div className="flex flex-col gap-2">
            {/* The privacy link stays outside the label: nested in it, clicking
                the link would also toggle the checkbox. */}
            <label htmlFor="consent" className="flex cursor-pointer items-start gap-3">
              <span className="relative mt-1 block h-5 w-5 shrink-0">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  required
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? "consent-error" : undefined}
                  className="peer h-5 w-5 appearance-none border checked:bg-[var(--accent)]"
                  style={{ borderColor: errors.consent ? "#E5484D" : "var(--hairline)" }}
                />
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 m-auto h-3 w-3 opacity-0 peer-checked:opacity-100"
                  style={{ color: "var(--bg)" }}
                >
                  <path
                    d="M2.5 8.5 L6.5 12.5 L13.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="t-body">{kontakt.form.consent}</span>
            </label>

            <p className="pl-8">
              <SmartLink
                href={kontakt.form.consentLinkHref}
                className="t-mono link-underline"
                style={{ color: "var(--accent)" }}
                data-cursor="link"
              >
                {kontakt.form.consentLinkLabel}
              </SmartLink>
            </p>
            {errors.consent && (
              <p id="consent-error" className="t-mono" style={{ color: "#E5484D" }}>
                {errors.consent}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="submit"
              disabled={status === "sending"}
              data-cursor="link"
              className="inline-flex min-h-[52px] items-center gap-3 rounded-[var(--r-pill)] px-8 t-mono transition-opacity disabled:opacity-70"
              style={{ backgroundColor: "var(--accent)", color: "var(--bg)" }}
            >
              {status === "sending"
                ? kontakt.form.sending
                : status === "sent"
                  ? kontakt.form.sent
                  : kontakt.form.submit}
              <Spinner status={status} />
            </button>

            <p role="status" aria-live="polite" className="t-mono">
              {status === "sent" && <span style={{ color: "var(--accent)" }}>{kontakt.form.success}</span>}
              {status === "error" && <span style={{ color: "#E5484D" }}>{kontakt.form.error}</span>}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

/** Label → spinner → check, driven by the submit state. */
function Spinner({ status }: { status: Status }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || status !== "sending" || prefersReducedMotion()) return;
    const spin = gsap.to(element, { rotate: 360, duration: 0.9, ease: EASE.linear, repeat: -1 });
    return () => {
      spin.kill();
      gsap.set(element, { rotate: 0 });
    };
  }, [status]);

  if (status === "idle" || status === "error") return null;

  return (
    <svg ref={ref} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      {status === "sent" ? (
        <path
          d="M2.5 8.5 L6.5 12.5 L13.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="28"
          strokeDashoffset="10"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
