import { forwardRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

// ─── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
  email:      z.string().email("Enter a valid email address"),
  password:   z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Animation ────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Field ───────────────────────────────────────────────────────────────────
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label:         string;
  labelRight?:   React.ReactNode;
  rightElement?: React.ReactNode;
  error?:        string;
  inputId:       string;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, labelRight, rightElement, error, inputId, style, ...props }, ref) => (
    <div className="flex flex-col" style={{ gap: "8px" }}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#30313d",
            fontFamily:
              '"Ideal Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {label}
        </label>
        {labelRight}
      </div>

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className="auth-input"
          style={{
            borderColor: error ? "#df1b41" : undefined,
            boxShadow: error ? "0 0 0 1px #df1b41" : undefined,
            paddingRight: rightElement ? "2.75rem" : undefined,
            ...style,
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-[13px] top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="err"
            id={`${inputId}-error`}
            role="alert"
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ fontSize: "13px", color: "#df1b41", display: "flex", alignItems: "center", gap: "5px" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
);
Field.displayName = "Field";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const setAuth   = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState<string | null>(null);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    "/dashboard";

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
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? null;
      setServerError(
        detail ?? "We could not sign you in. Check your credentials and try again."
      );
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">

      {/* ── Heading ─────────────────────────────────────────────────────────── */}
      <motion.h1
        variants={itemVariants}
        style={{
          fontSize: "25px",
          fontWeight: 600,
          color: "#30313d",
          letterSpacing: "-0.018em",
          lineHeight: 1.2,
          fontFamily: "var(--font-heading)",
        }}
      >
        Sign in to your account
      </motion.h1>

      {/* ── Form — 24px below heading ─────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ marginTop: "24px" }}
      >
        {/* Email */}
        <motion.div variants={itemVariants}>
          <Field
            inputId="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder=""
            error={errors.email?.message}
            {...register("email")}
          />
        </motion.div>

        {/* Password — 20px gap */}
        <motion.div variants={itemVariants} style={{ marginTop: "20px" }}>
          <Field
            inputId="password"
            label="Password"
            labelRight={
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "14px",
                  color: "#3B96E8",
                  fontWeight: 400,
                  textDecoration: "none",
                }}
                className="transition-opacity hover:opacity-75"
              >
                Forgot your password?
              </Link>
            }
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder=""
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="flex items-center justify-center w-5 h-5 transition-opacity hover:opacity-70 focus:outline-none"
                style={{ color: "#8b93a0" }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={showPassword ? "hide" : "show"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </motion.span>
                </AnimatePresence>
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />
        </motion.div>

        {/* Remember me — 18px gap */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2"
          style={{ marginTop: "18px" }}
        >
          <input
            id="rememberMe"
            type="checkbox"
            className="auth-checkbox"
            {...register("rememberMe")}
          />
          <label
            htmlFor="rememberMe"
            className="cursor-pointer select-none"
            style={{ fontSize: "14px", color: "#30313d", fontWeight: 400 }}
          >
            Remember me on this device
          </label>
        </motion.div>

        {/* Action area — 20px gap */}
        <motion.div variants={itemVariants} style={{ marginTop: "20px" }}>

          {/* Server error */}
          <AnimatePresence>
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-start gap-2.5 rounded-[6px] px-3.5 py-3"
                style={{
                  marginBottom: "12px",
                  background: "rgba(223,27,65,0.05)",
                  border: "1px solid rgba(223,27,65,0.2)",
                }}
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={14} className="shrink-0 mt-px" style={{ color: "#df1b41" }} aria-hidden="true" />
                <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#df1b41" }}>
                  {serverError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={!isSubmitting ? { y: -1 } : {}}
            whileTap={!isSubmitting ? { scale: 0.992 } : {}}
            transition={{ duration: 0.1 }}
            className="auth-submit-btn"
          >
            {isSubmitting ? (
              <>
                <span
                  className="h-[13px] w-[13px] rounded-full border-[1.75px] animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.32)", borderTopColor: "white" }}
                />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </motion.button>
        </motion.div>

      </form>

      {/* ── Helper text — 24px below button ──────────────────────────────────── */}
      <motion.div variants={itemVariants} style={{ marginTop: "24px" }}>
        <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>
          New to NamRent?{" "}
          <span style={{ color: "#9ca3af" }}>Accept your invitation.</span>
        </p>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "6px" }}>
          Need help?{" "}
          <a
            href="mailto:support@namrent.com"
            style={{ color: "#3B96E8", textDecoration: "none" }}
            className="transition-opacity hover:opacity-75"
          >
            Contact support
          </a>
        </p>
      </motion.div>

    </motion.div>
  );
}
