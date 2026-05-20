import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { Button, Input } from "@/components/ui";

const schema = z
  .object({
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

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ new_password }: FormValues) => {
    setServerError(null);
    try {
      await authService.resetPassword({ token, new_password });
      setDone(true);
    } catch {
      setServerError("This reset link is invalid or has expired.");
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/10">
          <CheckCircle size={28} className="text-[var(--color-success)]" />
        </div>
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Password updated</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Your password has been reset successfully.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate("/login")}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Set new password</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="New password"
          type={showPassword ? "text" : "password"}
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.new_password?.message}
          {...register("new_password")}
        />

        <Input
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          leftIcon={<Lock size={16} />}
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />

        {serverError && (
          <p className="rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Reset password
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
