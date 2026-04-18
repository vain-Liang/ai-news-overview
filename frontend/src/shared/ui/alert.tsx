import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const alertVariants = cva("rounded-xl border px-4 py-3 text-sm shadow-sm", {
  variants: {
    variant: {
      info: "border-border bg-card text-card-foreground",
      success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
      error: "border-destructive/20 bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

export type AlertProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

export const Alert = ({ className, variant, ...props }: AlertProps) => (
  <div className={cn(alertVariants({ variant }), className)} {...props} />
);
