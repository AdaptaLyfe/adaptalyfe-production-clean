import * as React from "react";
import { Edit } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

type EditButtonProps = Omit<ButtonProps, "children" | "size" | "variant">;

const EditButton = React.forwardRef<HTMLButtonElement, EditButtonProps>(
  ({ className, "aria-label": ariaLabel, ...props }, ref) => (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="sm"
      className={className}
      aria-label={ariaLabel || "Edit"}
      {...props}
    >
      <Edit className="w-4 h-4" />
    </Button>
  ),
);

EditButton.displayName = "EditButton";

export { EditButton };