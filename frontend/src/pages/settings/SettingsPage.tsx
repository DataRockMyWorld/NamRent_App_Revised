import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Button, Input, Card, CardContent } from "@/components/ui";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { darkMode, toggleDarkMode } = useUIStore();
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const changePwMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      authService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      reset();
    },
    onError: () => {
      setPasswordError("Current password is incorrect.");
    },
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardContent>
            <h3 className="mb-4 font-semibold text-[var(--color-text-primary)]">Profile</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-lg font-bold">
                {user?.first_name[0]}{user?.last_name[0]}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{user?.full_name}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{user?.email}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{user?.role.replace(/_/g, " ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardContent>
            <h3 className="mb-4 font-semibold text-[var(--color-text-primary)]">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Dark mode</p>
                <p className="text-xs text-[var(--color-text-muted)]">Toggle between light and dark theme</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${
                  darkMode ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                }`}
                role="switch"
                aria-checked={darkMode}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    darkMode ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card className="md:col-span-2 max-w-md">
          <CardContent>
            <h3 className="mb-4 font-semibold text-[var(--color-text-primary)]">Change password</h3>

            {passwordSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--color-success)]/10 px-3 py-2 text-sm text-[var(--color-success)]">
                <CheckCircle size={14} /> Password updated successfully.
              </div>
            )}

            <form
              onSubmit={handleSubmit((d) => changePwMutation.mutate(d))}
              noValidate
              className="space-y-4"
            >
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                error={errors.current_password?.message}
                {...register("current_password")}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                hint="At least 8 characters, one uppercase, one number"
                error={errors.new_password?.message}
                {...register("new_password")}
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                error={errors.confirm_password?.message}
                {...register("confirm_password")}
              />

              {passwordError && (
                <p className="rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                  {passwordError}
                </p>
              )}

              <Button type="submit" loading={changePwMutation.isPending}>
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
