import * as React from "react";
import { Label } from "@/components/ui/label";

type FieldLabelProps = React.ComponentPropsWithoutRef<typeof Label> & {
  /** Adds the visual required marker without changing native validation. */
  required?: boolean;
  /** Adds the visual optional marker without changing native validation. */
  optional?: boolean;
};

/**
 * Shared label presentation for fields in dialogs and sheets.
 *
 * `required` and `optional` are deliberately presentation-only.  The input's
 * native required attribute and the form schema remain the source of truth.
 * Existing literal markers are accepted so older forms are normalized too.
 */
const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FieldLabelProps
>(({ required, optional, ...props }, ref) => (
  <Label ref={ref} required={required} optional={optional} {...props} />
));
FieldLabel.displayName = "FieldLabel";

export { FieldLabel };