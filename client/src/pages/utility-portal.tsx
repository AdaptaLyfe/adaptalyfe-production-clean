import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Droplets,
  FileDown,
  LockKeyhole,
  LogOut,
  MapPin,
  PhoneCall,
  ReceiptText,
  ShieldCheck,
  Zap,
} from "lucide-react";

type UtilityType = "electricity" | "water";

type UtilityConnection = {
  utility_type: UtilityType;
  connection_number: string;
  meter_number: string;
  current_reading: number;
  consumption: number;
  consumption_unit: string;
  current_bill: number;
  is_active: boolean;
};

type UtilityBill = {
  utility_type: UtilityType;
  bill_number: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  amount: number;
  status: "due" | "paid";
  issued_at: string;
};

type UtilityPayment = {
  payment_reference: string;
  amount: number;
  payment_method: string;
  paid_at: string;
  status: "completed" | "pending" | "failed";
  utility_type: UtilityType;
  bill_number: string;
};

type UtilityServiceRequest = {
  ticket_number: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
};

type UtilityDashboard = {
  consumer: {
    name: string;
    consumerNumber: string;
    serviceAddress: string;
  };
  connections: UtilityConnection[];
  bills: UtilityBill[];
  payments: UtilityPayment[];
  serviceRequests: UtilityServiceRequest[];
};

const supportEmail = "portal-support@municipal-utilities.example";
const supportPhone = "+1 (276) 206-6748";
const supportPhoneLink = "tel:+12762066748";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function displayDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function connectionLabel(type: UtilityType) {
  return type === "electricity" ? "Electricity" : "Water supply";
}

function connectionIcon(type: UtilityType) {
  return type === "electricity" ? Zap : Droplets;
}

function downloadBill(bill: UtilityBill, consumer: UtilityDashboard["consumer"]) {
  const content = [
    "MUNICIPAL UTILITY SERVICES PORTAL",
    "DEMO BILL STATEMENT — NO PAYMENT REQUIRED",
    "",
    `Consumer: ${consumer.name}`,
    `Consumer ID: ${consumer.consumerNumber}`,
    `Service address: ${consumer.serviceAddress}`,
    `Utility: ${connectionLabel(bill.utility_type)}`,
    `Bill number: ${bill.bill_number}`,
    `Billing period: ${displayDate(bill.billing_period_start)} – ${displayDate(bill.billing_period_end)}`,
    `Due date: ${displayDate(bill.due_date)}`,
    `Amount due: ${money(bill.amount)}`,
    "",
    "This fictional statement is provided for demonstration purposes only.",
    "No payment has been made or processed.",
  ].join("\n");

  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${bill.bill_number.toLowerCase()}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function UtilityMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-b-[3px] border-[#b34b62] bg-[#303b78] text-white shadow-sm">
        <Building2 aria-hidden="true" size={25} strokeWidth={1.7} />
      </div>
      <div className="min-w-0">
          <p className={`font-semibold leading-tight text-[#303b78] ${compact ? "text-sm" : "text-base"}`}>
          Municipal Utility
        </p>
        <p className={`leading-tight text-slate-500 ${compact ? "text-xs" : "text-sm"}`}>
          Services Portal
        </p>
      </div>
    </div>
  );
}

function LoginPage({
  onLogin,
}: {
  onLogin: (username: string, password: string, rememberMe: boolean) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setShowRecovery(false);
    setSubmitting(true);
    try {
      await onLogin(username, password, rememberMe);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Sign-in could not be completed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f3f4] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <UtilityMark />
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sm:flex">
            <LockKeyhole size={14} aria-hidden="true" />
            Secure Consumer Access Portal
          </div>
          <a
            href={supportPhoneLink}
            aria-label={`Call us at ${supportPhone}`}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#485495] transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#485495]"
          >
            <PhoneCall size={17} aria-hidden="true" />
            <span className="flex flex-col leading-tight">
              <span className="text-xs">Call us</span>
              <span>{supportPhone}</span>
            </span>
          </a>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:py-16">
        <section className="mx-auto w-full max-w-xl lg:mx-0">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d9dbe6] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-[#485495]">
            <BadgeCheck size={15} aria-hidden="true" />
            Official consumer access
          </div>
          <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-[#303b78] sm:text-4xl">
            Municipal Utility Services Portal
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
            Securely review your electricity and water services, view current bills, and keep track of account activity.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Zap size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Electric service</p>
                <p className="mt-0.5 text-xs text-slate-500">Usage and billing details</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Droplets size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Water service</p>
                <p className="mt-0.5 text-xs text-slate-500">Meter and account status</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3 rounded-xl border border-[#d9dbe6] bg-[#ececf2] p-4 text-sm leading-6 text-[#465184]">
            <ShieldCheck className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
            <p>
              <span className="font-semibold">Your privacy matters.</span>{" "}
              Sign-in is protected and account information is available only to the authorized consumer.
            </p>
          </div>
        </section>

        <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-35px_rgba(23,59,94,0.45)] sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#69729c]">
              Consumer sign-in
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#303b78]">
              Access your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your Consumer ID and password to continue.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="utility-consumer-id" className="mb-2 block text-sm font-medium text-slate-700">
                Username / Consumer ID
              </label>
              <input
                id="utility-consumer-id"
                name="username"
                type="text"
                autoComplete="username"
                required
                maxLength={80}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your Consumer ID"
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#5965a6] focus:ring-4 focus:ring-[#5965a6]/10"
              />
            </div>

            <div>
              <label htmlFor="utility-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="utility-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={200}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#5965a6] focus:ring-4 focus:ring-[#5965a6]/10"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#3d498c] focus:ring-[#5965a6]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setShowRecovery((visible) => !visible)}
                className="text-sm font-medium text-[#485495] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#485495]"
              >
                Forgot password?
              </button>
            </div>

            {showRecovery && (
              <div role="status" className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-sm leading-5 text-sky-900">
                For password assistance, email the service desk at{" "}
                <a className="font-semibold underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>{" "}
                or call us at{" "}
                <a className="font-semibold underline" href={supportPhoneLink}>
                  {supportPhone}
                </a>
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#3d498c] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2e3673] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3d498c] disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? "Signing in…" : "Sign in securely"}
              {!submitting && <ChevronRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-start gap-2.5 text-xs leading-5 text-slate-500">
              <LockKeyhole className="mt-0.5 shrink-0 text-[#69729c]" size={15} aria-hidden="true" />
              <p>
                <span className="font-semibold text-slate-700">Authorized Users Only.</span>{" "}
                Access is monitored. Unauthorized use is prohibited.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function UtilityDashboardPage({
  dashboard,
  onLogout,
}: {
  dashboard: UtilityDashboard;
  onLogout: () => Promise<void>;
}) {
  const [selectedBill, setSelectedBill] = useState<UtilityBill | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const currentBills = useMemo(
    () => dashboard.bills.filter((bill) => bill.status === "due"),
    [dashboard.bills],
  );
  const totalDue = currentBills.reduce((sum, bill) => sum + bill.amount, 0);
  const nextDue = [...currentBills].sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  async function signOut() {
    setSigningOut(true);
    try {
      await onLogout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f3f4] text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <UtilityMark compact />
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Secure session
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#485495] disabled:opacity-60"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Consumer account
              </p>
              <p className="mt-2 truncate text-sm font-semibold text-[#303b78]">{dashboard.consumer.name}</p>
              <p className="mt-1 text-xs text-slate-500">{dashboard.consumer.consumerNumber}</p>
            </div>
            <nav aria-label="Utility account sections" className="space-y-1">
              {[
                ["#overview", "Account overview"],
                ["#connections", "Utility connections"],
                ["#payments", "Payment history"],
                ["#requests", "Service requests"],
              ].map(([href, label], index) => (
                <a
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    index === 0
                      ? "bg-[#e9eaf1] font-semibold text-[#414c90]"
                      : "text-slate-600 hover:bg-white hover:text-[#414c90]"
                  }`}
                >
                  {index === 0 ? <Activity size={17} aria-hidden="true" /> : null}
                  {index === 1 ? <Zap size={17} aria-hidden="true" /> : null}
                  {index === 2 ? <ReceiptText size={17} aria-hidden="true" /> : null}
                  {index === 3 ? <CircleHelp size={17} aria-hidden="true" /> : null}
                  {label}
                </a>
              ))}
            </nav>
            <div className="rounded-xl border border-[#d9dbe6] bg-[#ececf2] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#414c83]">
                <ShieldCheck size={16} aria-hidden="true" />
                Account security
              </div>
              <p className="mt-2 text-xs leading-5 text-[#586286]">
                Your portal session is separate from other services.
              </p>
            </div>
          </div>
        </aside>

        <main id="overview" className="min-w-0 space-y-6">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-[#69729c]">Consumer services</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#303b78] sm:text-3xl">
                Welcome, {dashboard.consumer.name.split(" ")[0]}
              </h1>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                <MapPin className="mt-0.5 shrink-0" size={15} aria-hidden="true" />
                {dashboard.consumer.serviceAddress}
              </p>
            </div>
            <div className="w-fit rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600">
              Consumer ID{" "}
              <span className="ml-1 font-semibold text-slate-800">{dashboard.consumer.consumerNumber}</span>
            </div>
          </section>

          <section aria-label="Account summary" className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total outstanding</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#303b78]">{money(totalDue)}</p>
              <p className="mt-2 text-xs text-slate-500">Across active utility services</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Active connections</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#303b78]">
                {dashboard.connections.filter((connection) => connection.is_active).length}
              </p>
              <p className="mt-2 text-xs text-slate-500">Electricity and water services</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Next due date</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#303b78]">
                {nextDue ? displayDate(nextDue.due_date) : "No amount due"}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {nextDue ? `${connectionLabel(nextDue.utility_type)} bill` : "Your account is current"}
              </p>
            </div>
          </section>

          <section id="bills" aria-labelledby="bill-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 id="bill-heading" className="text-lg font-semibold text-[#303b78]">Current bills</h2>
                <p className="mt-1 text-sm text-slate-500">Review charges and due dates for each service.</p>
              </div>
              <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
                <CalendarDays size={14} aria-hidden="true" />
                Current billing period
              </span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {dashboard.connections.filter((connection) => connection.is_active).map((connection) => {
                const Icon = connectionIcon(connection.utility_type);
                const bill = currentBills.find((entry) => entry.utility_type === connection.utility_type);
                return (
                  <article
                    key={connection.connection_number}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          connection.utility_type === "electricity"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-sky-50 text-sky-700"
                        }`}>
                          <Icon size={20} aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-[#303b78]">{connectionLabel(connection.utility_type)}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">Connection {connection.connection_number}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                        Active
                      </span>
                    </div>

                    <div className="px-5 py-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-slate-500">Current bill</p>
                          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#303b78]">
                            {money(bill?.amount ?? connection.current_bill)}
                          </p>
                        </div>
                        {bill && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Due date</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{displayDate(bill.due_date)}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-y-3 border-t border-slate-100 pt-4 text-sm">
                        <p className="text-slate-500">Meter number</p>
                        <p className="text-right font-medium text-slate-800">{connection.meter_number}</p>
                        <p className="text-slate-500">Current reading</p>
                        <p className="text-right font-medium text-slate-800">
                          {connection.current_reading.toLocaleString("en-US")} {connection.utility_type === "water" ? "kgal" : "kWh"}
                        </p>
                        <p className="text-slate-500">This period’s use</p>
                        <p className="text-right font-medium text-slate-800">
                          {connection.consumption.toLocaleString("en-US")} {connection.consumption_unit}
                        </p>
                        {bill && (
                          <>
                            <p className="text-slate-500">Bill number</p>
                            <p className="text-right font-medium text-slate-800">{bill.bill_number}</p>
                          </>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {bill && (
                          <button
                            type="button"
                            onClick={() => downloadBill(bill, dashboard.consumer)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#485495]"
                          >
                            <FileDown size={16} aria-hidden="true" />
                            Download bill
                          </button>
                        )}
                        {bill && (
                          <button
                            type="button"
                            onClick={() => setSelectedBill(bill)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3d498c] px-3.5 text-sm font-semibold text-white transition hover:bg-[#2e3673] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3d498c]"
                          >
                            <CreditCard size={16} aria-hidden="true" />
                            Pay bill
                          </button>
                        )}
                        {!bill && (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                            <CheckCircle2 size={16} aria-hidden="true" />
                            No payment due
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="connections" aria-labelledby="connections-heading">
            <div className="mb-3">
              <h2 id="connections-heading" className="text-lg font-semibold text-[#303b78]">Service connections</h2>
              <p className="mt-1 text-sm text-slate-500">Meter readings and service identifiers on your account.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {dashboard.connections.map((connection) => {
                const Icon = connectionIcon(connection.utility_type);
                return (
                  <div key={connection.connection_number} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#303b78]">
                      <Icon size={17} aria-hidden="true" />
                      {connectionLabel(connection.utility_type)}
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Connection number</span>
                        <span className="font-medium text-slate-700">{connection.connection_number}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Meter number</span>
                        <span className="font-medium text-slate-700">{connection.meter_number}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div id="payments" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-[#303b78]">Recent payments</h2>
                  <p className="mt-1 text-xs text-slate-500">Recent account activity</p>
                </div>
                <ReceiptText className="text-slate-400" size={19} aria-hidden="true" />
              </div>
              {dashboard.payments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {dashboard.payments.map((payment) => (
                    <div key={payment.payment_reference} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{connectionLabel(payment.utility_type)} bill</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {displayDate(payment.paid_at)} · {payment.payment_method}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-800">{money(payment.amount)}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <CheckCircle2 size={12} aria-hidden="true" />
                          {payment.status === "completed" ? "Completed" : payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No payments recorded yet.</p>
              )}
            </div>

            <div id="requests" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-[#303b78]">Service requests</h2>
                  <p className="mt-1 text-xs text-slate-500">Questions and service follow-ups</p>
                </div>
                <CircleHelp className="text-slate-400" size={19} aria-hidden="true" />
              </div>
              {dashboard.serviceRequests.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {dashboard.serviceRequests.map((request) => (
                    <div key={request.ticket_number} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{request.category}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{request.description}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">
                        {request.ticket_number} · {displayDate(request.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-500">There are no open service requests.</p>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#485495] hover:underline"
                  >
                    Contact support <ChevronRight size={13} aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </section>

          <footer className="flex flex-col justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>Municipal Utility Services Portal · Demonstration environment</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href={`mailto:${supportEmail}`} className="inline-flex items-center gap-1.5 font-medium text-[#485495] hover:underline">
                <CircleHelp size={14} aria-hidden="true" />
                Email support
              </a>
              <a href={supportPhoneLink} className="inline-flex items-center gap-1.5 font-medium text-[#485495] hover:underline">
                <PhoneCall size={14} aria-hidden="true" />
                Call us: {supportPhone}
              </a>
            </div>
          </footer>
        </main>
      </div>

      {selectedBill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedBill(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-payment-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ececf2] text-[#485495]">
              <CreditCard size={21} aria-hidden="true" />
            </div>
            <h2 id="demo-payment-title" className="mt-4 text-xl font-semibold text-[#303b78]">
              Demonstration only
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This portal does not process payments. No charge was made for the{" "}
              <span className="font-semibold">{connectionLabel(selectedBill.utility_type)}</span> bill of{" "}
              <span className="font-semibold">{money(selectedBill.amount)}</span>.
            </p>
            <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-3 text-sm">
              <span className="text-slate-500">Bill number</span>
              <span className="font-medium text-slate-800">{selectedBill.bill_number}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBill(null)}
              className="mt-5 h-11 w-full rounded-lg bg-[#3d498c] px-4 text-sm font-semibold text-white transition hover:bg-[#2e3673] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3d498c]"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default function UtilityPortal() {
  const [view, setView] = useState<"loading" | "login" | "dashboard" | "error">("loading");
  const [dashboard, setDashboard] = useState<UtilityDashboard | null>(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/utility-portal/dashboard", { credentials: "same-origin" })
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setView("login");
          return null;
        }
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || "The utility portal is temporarily unavailable.");
        }
        return response.json() as Promise<UtilityDashboard>;
      })
      .then((payload) => {
        if (active && payload) {
          setDashboard(payload);
          setView("dashboard");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPageError(error instanceof Error ? error.message : "Unable to connect to the utility portal.");
        setView("error");
      });
    return () => {
      active = false;
    };
  }, []);

  async function login(username: string, password: string, rememberMe: boolean) {
    const response = await fetch("/api/utility-portal/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, rememberMe }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "Consumer ID or password is incorrect.");
    }

    const dashboardResponse = await fetch("/api/utility-portal/dashboard", {
      credentials: "same-origin",
    });
    const dashboardResult = await dashboardResponse.json().catch(() => ({}));
    if (!dashboardResponse.ok) {
      throw new Error(dashboardResult.message || "Unable to load your utility account.");
    }
    setDashboard(dashboardResult as UtilityDashboard);
    setView("dashboard");
  }

  async function logout() {
    await fetch("/api/utility-portal/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    setDashboard(null);
    setView("login");
  }

  if (view === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f3f4]">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#485495] border-t-transparent" />
          Loading secure consumer portal…
        </div>
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f3f4] px-5">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Clock3 size={21} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[#303b78]">Portal temporarily unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{pageError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 h-10 rounded-lg bg-[#3d498c] px-4 text-sm font-semibold text-white hover:bg-[#2e3673]"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  if (view === "dashboard" && dashboard) {
    return <UtilityDashboardPage dashboard={dashboard} onLogout={logout} />;
  }

  return <LoginPage onLogin={login} />;
}