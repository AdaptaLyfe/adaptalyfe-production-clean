import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Watch } from "lucide-react";

/**
 * Wearable device sync isn't built yet (the old page showed made-up devices),
 * so this page says so plainly instead of showing sample data.
 */
export default function WearableDevicesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <Watch className="h-7 w-7" />
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Coming soon</span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Wearable devices</h1>
        <p className="mt-2 text-slate-600">
          Connecting smartwatches and fitness trackers is on the way. You can already log sleep and mood yourself.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
            <Link href="/sleep-tracking">Log sleep</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
