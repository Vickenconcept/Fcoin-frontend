"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

type SwitchProps = {
  className?: string;
  thumbClassName?: string;
  [key: string]: any;
};

function Switch({ className, thumbClassName, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.25rem] w-10 shrink-0 items-center rounded-full border border-transparent bg-slate-300 transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring data-[state=checked]:bg-primary disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[1.05rem] rounded-full border border-slate-200 bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-4px)] data-[state=unchecked]:translate-x-[1px]",
          thumbClassName,
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
