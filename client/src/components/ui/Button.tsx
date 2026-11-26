import React from "react";
import { cn } from "@/lib/utils";

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline"; loading?: boolean }> = ({ className, variant = "primary", loading, children, disabled, ...props }) => (<button disabled={disabled || loading} className={cn("inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition disabled:opacity-50", variant === "primary" ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200", className)} {...props}>{loading ? "Please wait..." : children}</button>);
