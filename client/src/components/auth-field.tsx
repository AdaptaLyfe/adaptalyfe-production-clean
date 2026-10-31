import * as React from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFieldProps = React.ComponentProps<typeof Input> & {
  label: React.ReactNode;
  icon: LucideIcon;
  /** Shown on the right of the label row (e.g. "Forgot password?"). */
  labelRight?: React.ReactNode;
  /** Shown under the input. */
  hint?: React.ReactNode;
};

/** Input used on the sign-in / sign-up / password pages: leading icon, eye toggle for passwords. */
export function AuthField({ label, icon: Icon, labelRight, hint, id, type, className = "", ...props }: AuthFieldProps) {
  const [show, setShow] = React.useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</Label>
        {labelRight}
      </div>
      <div className="group relative mt-1.5">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
        <Input
          id={id}
          type={isPassword && show ? "text" : type}
          className={`pl-11 ${isPassword ? "pr-11" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-indigo-600"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint}
    </div>
  );
}
