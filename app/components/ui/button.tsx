import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-light transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-black bg-rose-200 shadow-sm hover:bg-rose-300",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        "destructive-outline":
          "border border-red-200 bg-transparent text-red-600 shadow-sm hover:bg-red-50",
        outline:
          "border border-rose-200 bg-background shadow-sm hover:bg-rose-50 hover:text-rose-700",
        "gray-outline":
          "border border-gray-200 bg-transparent text-gray-600 shadow-sm hover:bg-gray-50/80 hover:text-gray-700",
        secondary: "bg-rose-100 text-rose-700 shadow-sm hover:bg-rose-200",
        ghost: "hover:bg-rose-50 hover:text-rose-700",
        link: "text-rose-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
