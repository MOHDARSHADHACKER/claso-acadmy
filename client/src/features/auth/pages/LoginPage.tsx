import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/axios";
import { useAuthStore, type UserRole } from "@/stores/auth.store";
import { Button, Input } from "@/components/ui";

const schema = z.object({
  role: z.enum(["admin", "teacher", "student"]),
  identifier: z.string().min(2, "Required"),
  password: z.string().min(6, "At least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

const ROLE_META: Record<
  UserRole,
  { title: string; helper: string; sample: string; fieldLabel: string }
> = {
  admin: {
    title: "Principal & Admin Portal",
    helper: "Manage courses, batches, subjects, timetables, and institute KPIs.",
    sample: "admin@claso.local",
    fieldLabel: "Email",
  },
  teacher: {
    title: "Faculty & Batch Portal",
    helper: "View assigned batches, weekly schedules, and classroom updates.",
    sample: "teacher1@claso.local",
    fieldLabel: "Email",
  },
  student: {
    title: "Student Learning Portal",
    helper: "Access class schedules, batch updates, and academic records.",
    sample: "CLS-2026-001",
    fieldLabel: "Admission No.",
  },
};

export const LoginPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "admin",
      identifier: "admin@claso.local",
      password: "",
    },
  });

  const selectRole = (nextRole: UserRole) => {
    setRole(nextRole);
    setValue("role", nextRole);
    setValue("identifier", ROLE_META[nextRole].sample);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await apiClient.post("/auth/login", values);
      setUser(res.data.user);
      toast.success(`Signed in as ${res.data.user.name}`);
      navigate(`/${res.data.user.role}/dashboard`, { replace: true });
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Login failed");
    }
  };

  const activeMeta = ROLE_META[role];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-4 py-8 text-slate-900">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg lg:grid-cols-12">
        <div className="flex flex-col justify-between bg-[#0f172a] p-7 text-slate-200 lg:col-span-5 lg:p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-base font-bold text-white shadow-sm">
                C
              </div>
              <div>
                <p className="text-sm font-bold tracking-wider text-white">CLASO ACADEMY</p>
                <p className="text-xs text-slate-400">Coaching Management ERP</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block rounded-full bg-indigo-500/15 px-3 py-1 text-[11px] font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                Role-Based Access
              </span>
              <h2 className="text-xl font-bold leading-snug text-white">
                Unified workspace for administrators, teachers, and students.
              </h2>
              <p className="text-xs leading-relaxed text-slate-400">
                Sign in with your assigned portal credentials to access live schedules, batches, and academic controls.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Selected Portal
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{activeMeta.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{activeMeta.helper}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5 text-[11px]">
              <span className="text-slate-400">Sample ID:</span>
              <code className="rounded bg-slate-800 px-2 py-0.5 font-mono text-indigo-300">
                {activeMeta.sample}
              </code>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:col-span-7">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Welcome Back
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Claso Sign In
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Choose your role and enter your credentials to continue.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
              {(["admin", "teacher", "student"] as UserRole[]).map((r) => {
                const selected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => selectRole(r)}
                    className={`rounded-lg py-2 text-xs font-semibold capitalize transition ${
                      selected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label={activeMeta.fieldLabel}
                error={errors.identifier?.message}
                {...register("identifier")}
              />

              <div className="space-y-1">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-[31px] rounded px-1.5 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Sign In to {role.charAt(0).toUpperCase() + role.slice(1)} Portal
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
