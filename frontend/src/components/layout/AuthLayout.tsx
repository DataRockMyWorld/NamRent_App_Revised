import { Outlet } from "react-router-dom";
import { Car, FileText, Wrench, ShieldCheck } from "lucide-react";
import namrentLogo from "@/assets/namrent-logo.jpg";

const FEATURES = [
  { icon: Car, text: "Real-time fleet visibility across your entire operation" },
  { icon: Wrench, text: "Automated maintenance tracking and scheduling" },
  { icon: FileText, text: "Contract and invoice management in one place" },
  { icon: ShieldCheck, text: "Role-based access for admin, ops, and clients" },
];

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg-app)]">

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[56%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0D1926 0%, #1A3A5C 60%, #1e5799 100%)" }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,1) 39px, rgba(255,255,255,1) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,1) 39px, rgba(255,255,255,1) 40px)",
          }}
        />

        {/* Glowing accent orb */}
        <div
          className="absolute top-[-120px] right-[-80px] w-[480px] h-[480px] rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3B96E8 0%, transparent 70%)" }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src={namrentLogo} alt="NamRent" className="h-9 w-auto rounded-md" />
            <span className="text-lg font-bold text-white tracking-tight">NamRent Fleet</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Fleet management<br />built for Namibia.
            </h1>
            <p className="mt-4 text-base text-white/60 leading-relaxed max-w-sm">
              A complete platform to manage vehicles, contracts, maintenance, and clients — all in one place.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ background: "rgba(59,150,232,0.2)", color: "#7EC8F8" }}
                >
                  <Icon size={14} />
                </div>
                <span className="text-sm text-white/70 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} NamRent Fleet Management. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-[var(--color-bg-surface)]">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <img src={namrentLogo} alt="NamRent" className="h-9 w-auto rounded-md" />
          <span className="text-base font-bold text-[var(--color-text-heading)]">NamRent Fleet</span>
        </div>

        <div className="w-full max-w-sm">
          <Outlet />
        </div>

        <p className="lg:hidden mt-8 text-xs text-[var(--color-text-muted)] text-center">
          &copy; {new Date().getFullYear()} NamRent Fleet Management
        </p>
      </div>
    </div>
  );
}
