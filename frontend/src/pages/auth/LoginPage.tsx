import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { Button, Input } from "@/components/ui";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { access, refresh, user } = await authService.login(values);
      setAuth(user, access, refresh);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Invalid email or password.";
      setServerError(msg);
    }
  };

  return (
    <div>
      {/* Heading */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--color-text-heading)" }}
        >
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Sign in to your NamRent account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-muted)" }}>
              <Lock size={15} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="form-input pl-9 pr-9"
              style={errors.password ? { borderColor: "var(--color-danger)" } : {}}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-danger)" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <div
            className="flex items-start gap-2.5 rounded-[var(--radius-md)] px-3.5 py-3 text-sm"
            style={{
              background: "var(--color-danger-tint)",
              color: "var(--color-danger)",
              border: "1px solid rgba(240,68,56,0.2)",
            }}
          >
            <span className="mt-0.5 shrink-0">⚠</span>
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          size="lg"
        >
          {!isSubmitting && (
            <>
              Sign in <ArrowRight size={16} />
            </>
          )}
          {isSubmitting && "Signing in…"}
        </Button>
      </form>

      {/* Divider */}
      <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
        <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
          Having trouble accessing your account?{" "}
          <a
            href="mailto:support@namrent.com"
            className="font-medium transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
