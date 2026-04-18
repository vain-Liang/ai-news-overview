import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <input
    className={cn(
      "flex h-11 w-full rounded-xl border border-input bg-background/80 px-4 py-2 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
);
