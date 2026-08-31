import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
        secondary:
          "border border-border-strong bg-surface text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        outline:
          "border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        destructive: "bg-destructive text-background hover:opacity-90",
      },
      size: {
        sm: "min-h-9 px-3 text-xs",
        md: "min-h-11 px-4",
        lg: "min-h-12 px-5 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
