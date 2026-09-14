import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants> & {
      required?: boolean
      optional?: boolean
    }
>(({ className, children, required, optional, ...props }, ref) => {
  const text = React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string") return child
      if (React.isValidElement(child)) return React.Children.toArray(child.props.children)
        .filter((nested): nested is string => typeof nested === "string").join(" ")
      return ""
    })
    .join(" ")
  const showRequired = required ?? /\*\s*$/.test(text)
  const showOptional = !showRequired && (optional ?? /\(\s*optional\s*\)\s*$/i.test(text))
  const normalize = (child: React.ReactNode): React.ReactNode => {
    if (typeof child === "string") {
      return child.replace(/\s*\(\s*optional\s*\)\s*$/i, "").replace(/\s*\*\s*$/, "")
    }
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {}, React.Children.map(child.props.children, normalize))
    }
    return child
  }
  const normalizedChildren = React.Children.map(children, normalize)

  return (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
      {normalizedChildren}
      {showRequired && <span aria-hidden="true" className="ml-1 text-red-600">*</span>}
      {showOptional && <span className="ml-1 text-muted-foreground font-normal">(Optional)</span>}
    </LabelPrimitive.Root>
  )
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
