import React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(({ className, label, error, id, ...props }, ref) => { const inputId = id || React.useId(); return (<div className="w-full">{label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}<input id={inputId} ref={ref} className={cn("block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", error && "border-rose-500", className)} {...props} />{error && <p className="mt-1 text-xs text-rose-600">{error}</p>}</div>); });
Input.displayName = "Input";
