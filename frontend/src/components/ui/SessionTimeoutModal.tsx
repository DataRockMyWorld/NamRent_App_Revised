import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIdle } from "@/hooks/useIdle";
import { useAuthStore } from "@/store/authStore";
import { Modal } from "./Modal";
import { Button } from "./Button";

const WARN_AFTER_MS = 25 * 60 * 1000; // 25 minutes

export function SessionTimeoutModal() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isIdle = useIdle(WARN_AFTER_MS);
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(5 * 60); // 5 min countdown

  useEffect(() => {
    if (isIdle) {
      setOpen(true);
      setCountdown(5 * 60);
    } else {
      setOpen(false);
    }
  }, [isIdle]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    if (countdown <= 0) {
      clearAuth();
      navigate("/login");
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [open, countdown, clearAuth, navigate]);

  const handleStay = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = String(countdown % 60).padStart(2, "0");

  return (
    <Modal
      open={open}
      onClose={handleStay}
      title="Session Expiring"
      description={`You've been inactive. You'll be logged out in ${minutes}:${seconds}.`}
      size="sm"
    >
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={handleLogout}>
          Log out
        </Button>
        <Button onClick={handleStay}>Stay logged in</Button>
      </div>
    </Modal>
  );
}
