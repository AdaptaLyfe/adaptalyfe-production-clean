import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, Brain, type LucideIcon } from "lucide-react";

type AuthShellProps = {
  backHref: string;
  backLabel: string;
  /** Kept for callers; the brand logo is shown at the top of the card instead. */
  icon?: LucideIcon;
  title: string;
  subtitle: string;
  /** Extra content under the subtitle (e.g. the selected-plan chip). */
  headerExtra?: ReactNode;
  /** Shown between the logo and the title (e.g. a trial banner). */
  eyebrow?: ReactNode;
  /** "wide" for longer forms such as registration. */
  size?: "default" | "wide";
  children: ReactNode;
};

/**
 * Shared layout for sign-in, sign-up and password pages: one centred card with
 * the Adaptalyfe logo on top, and a small back link under the card (no top bar).
 */
export function AuthShell({ backHref, backLabel, title, subtitle, headerExtra, eyebrow, size = "default", children }: AuthShellProps) {
  const wide = size === "wide";
  return (
    <div className="min-h-screen bg-slate-50">
      <main className={`mx-auto flex min-h-screen w-full flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8 ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <section
          className={`relative w-full rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] ${wide ? "sm:px-12 sm:py-9" : "sm:px-10 sm:py-10"} [&_input:not([type=checkbox])]:h-12 [&_input:not([type=checkbox])]:text-[15px] [&_input:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_#f8fafc_inset] [&_input:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&_input:not([type=checkbox])]:rounded-xl [&_input:not([type=checkbox])]:border-slate-200 [&_input:not([type=checkbox])]:bg-slate-50/60 [&_input:not([type=checkbox])]:focus-visible:bg-white`}
        >
          <div aria-hidden className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
          <div className={`text-center ${wide ? "mb-6" : "mb-8"}`}>
            {/* Brand logo */}
            <Link href="/" className="group mx-auto mb-4 inline-flex items-center gap-2.5" aria-label="Adaptalyfe home">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
                <Brain className="h-6 w-6 text-white" />
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">Adaptalyfe</span>
            </Link>
            {eyebrow && <div>{eyebrow}</div>}
            <h1 className={`font-extrabold tracking-tight text-slate-900 ${wide ? "text-2xl sm:text-[1.75rem]" : "text-3xl"}`}>{title}</h1>
            <p className={`text-slate-500 ${wide ? "mt-1 text-sm sm:text-base" : "mt-2 text-base"}`}>{subtitle}</p>
            {headerExtra}
          </div>
          {children}
        </section>

        <Link
          href={backHref}
          className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {backLabel}
        </Link>
      </main>
    </div>
  );
}
