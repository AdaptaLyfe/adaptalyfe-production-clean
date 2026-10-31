import { Link } from "wouter";
import { ArrowLeft, Brain } from "lucide-react";

type AuthHeaderProps = {
  backHref: string;
  backLabel: string;
};

/** Shared top bar for the sign-in, sign-up and password pages. */
export function AuthHeader({ backHref, backLabel }: AuthHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3" aria-label="Adaptalyfe home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-md shadow-violet-500/20 transition-transform group-hover:scale-105">
            <Brain className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">Adaptalyfe</span>
        </Link>

        <Link
          href={backHref}
          className="group inline-flex h-10 items-center gap-2.5 rounded-full bg-white/90 py-1 pl-1 pr-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 backdrop-blur transition-all hover:-translate-y-0.5 hover:text-indigo-700 hover:shadow-md hover:shadow-indigo-500/10 hover:ring-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/30 transition-transform group-hover:-translate-x-0.5">
            <ArrowLeft className="h-4 w-4" />
          </span>
          <span>{backLabel}</span>
        </Link>
      </div>
    </header>
  );
}
