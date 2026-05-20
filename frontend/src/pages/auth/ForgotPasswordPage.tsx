import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { Button, Input } from "@/components/ui";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormValues) => {
    setServerError(null);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/10">
          <CheckCircle size={28} className="text-[var(--color-success)]" />
        </div>
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Check your email</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          If an account exists for that address, we've sent a password reset link.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Forgot password</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register("email")}
        />

        {serverError && (
          <p className="rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
