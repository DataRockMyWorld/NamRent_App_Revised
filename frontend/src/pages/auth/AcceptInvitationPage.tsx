import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { Button, Input, PageLoader } from "@/components/ui";

const schema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone: z.string().min(7, "Phone number is required"),
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    authService
      .getInvitation(token)
      .then((data) => setInvitationEmail(data.email))
      .catch(() => setInviteError("This invitation link is invalid or has expired."))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const result = await authService.acceptInvitation({
        token: token!,
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        password: values.password,
      });
      if (result.access && result.user) {
        setAuth(result.user, result.access, result.refresh);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch {
      setServerError("Failed to set up your account. The link may have expired.");
    }
  };

  if (loadingInvite) return <PageLoader />;

  if (inviteError) {
    return (
      <div className="text-center">
        <p className="text-[var(--color-danger)] font-medium">{inviteError}</p>
        <Button className="mt-6 w-full" onClick={() => navigate("/login")}>
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Set up your account</h1>
        {invitationEmail && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            You were invited as <span className="font-medium">{invitationEmail}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            autoComplete="given-name"
            error={errors.first_name?.message}
            {...register("first_name")}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            error={errors.last_name?.message}
            {...register("last_name")}
          />
        </div>

        <Input
          label="Phone number"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <Input
          label="Password"
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
          hint="At least 8 characters, one uppercase, one number"
          error={errors.password?.message}
          {...register("password")}
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
          Create account
        </Button>
      </form>
    </div>
  );
}
