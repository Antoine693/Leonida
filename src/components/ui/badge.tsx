import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/12 text-destructive",
        outline: "text-foreground",
        signal: "border-signal/30 bg-signal/12 text-contract-stage-foreground",
        success: "border-transparent bg-success/14 text-success",
        warning: "border-transparent bg-warning/18 text-warning-foreground",
        soon: "border-sidebar-border bg-sidebar-accent text-sidebar-foreground text-[10px] uppercase tracking-wider px-1.5",
        cdi: "border-contract-cdi/20 bg-contract-cdi/10 text-contract-cdi-foreground",
        cdd: "border-contract-cdd/30 bg-contract-cdd/15 text-contract-cdd-foreground",
        alternance: "border-contract-alternance/30 bg-contract-alternance/14 text-contract-alternance-foreground",
        stage: "border-contract-stage/30 bg-contract-stage/14 text-contract-stage-foreground",
        freelance: "border-contract-freelance/25 bg-contract-freelance/12 text-contract-freelance-foreground",
        "role-admin": "border-transparent bg-navy text-navy-foreground",
        "role-manager": "border-primary/25 bg-primary/10 text-accent-foreground",
        "role-collab": "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
