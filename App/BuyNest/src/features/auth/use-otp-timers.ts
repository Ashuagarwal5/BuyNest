import { useEffect, useState } from 'react';

/** Use timestamps so a code also expires while the app is in the background. */
export function useOtpTimers() {
  const [now, setNow] = useState(Date.now);
  const [deadlines, setDeadlines] = useState({ expiresAt: 0, resendAt: 0 });

  useEffect(() => {
    if (!deadlines.expiresAt && !deadlines.resendAt) return;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= Math.max(deadlines.expiresAt, deadlines.resendAt)) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadlines]);

  const start = (expiresInSeconds: number, resendInSeconds: number) => {
    const startedAt = Date.now();
    setNow(startedAt);
    setDeadlines({
      expiresAt: startedAt + expiresInSeconds * 1000,
      resendAt: startedAt + resendInSeconds * 1000,
    });
  };

  const reset = () => setDeadlines({ expiresAt: 0, resendAt: 0 });
  return {
    secondsToExpiry: Math.max(0, Math.ceil((deadlines.expiresAt - now) / 1000)),
    secondsToResend: Math.max(0, Math.ceil((deadlines.resendAt - now) / 1000)),
    start,
    reset,
  };
}
