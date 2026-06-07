import { Outlet } from "react-router-dom";
import { motion } from "motion/react";

// ─── Layout ───────────────────────────────────────────────────────────────────
export function AuthLayout() {
  return (
    <div className="auth-page-bg relative min-h-screen flex flex-col">

      {/* ── Brand — top left, like Stripe's wordmark ─────────────────────────── */}
      <header className="relative z-10 px-8 sm:px-10 pt-7 pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-2"
        >
          {/* Small N mark */}
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "5px",
              background: "#3B96E8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2.5 9.5V2.5l4 5V2.5"
                stroke="white"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#0D1926",
              letterSpacing: "-0.012em",
              fontFamily: "var(--font-heading)",
            }}
          >
            NamRent
          </span>
        </motion.div>
      </header>

      {/* ── Main — login card centered ───────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
          style={{
            maxWidth: "460px",
            background: "#FFFFFF",
            borderRadius: "10px",
            border: "1px solid rgba(48,49,61,0.08)",
            boxShadow:
              "0 1px 1px rgba(48,49,61,0.03), 0 4px 12px rgba(48,49,61,0.04), 0 18px 48px rgba(48,49,61,0.05)",
            paddingBlock: "clamp(28px, 4vw, 48px)",
            paddingInline: "clamp(24px, 5.5vw, 56px)",
          }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 text-center px-5 pb-7">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.22 }}
        >
          <p style={{ fontSize: "12px", color: "rgba(48,49,61,0.4)", lineHeight: 1.6 }}>
            Protected portal for NamRent staff, clients, and dealers.
          </p>
          <p style={{ fontSize: "12px", color: "rgba(48,49,61,0.3)", marginTop: "2px" }}>
            &copy; {new Date().getFullYear()} NamRent Fleet Management.
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
