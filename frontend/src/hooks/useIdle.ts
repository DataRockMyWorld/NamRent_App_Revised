import { useEffect, useRef, useState } from "react";

const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

export function useIdle(timeoutMs: number): boolean {
  const [idle, setIdle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      setIdle(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setIdle(true), timeoutMs);
    };

    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    return () => {
      if (timer.current) clearTimeout(timer.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [timeoutMs]);

  return idle;
}
