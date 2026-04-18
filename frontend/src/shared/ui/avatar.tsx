import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

export const Avatar = ({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root
    className={cn("relative flex size-11 shrink-0 overflow-hidden rounded-full border border-border/60", className)}
    {...props}
  />
);

export const AvatarFallback = ({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    className={cn("flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-primary", className)}
    {...props}
  />
);
