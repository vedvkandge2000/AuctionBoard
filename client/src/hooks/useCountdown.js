import { useEffect, useState } from 'react';

/**
 * Returns seconds remaining until `expiresAt` (ISO string or Date).
 * Ticks every second. Returns null if expiresAt is falsy.
 */
const useCountdown = (expiresAt) => {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }
    const target = new Date(expiresAt).getTime();

    const tick = () => {
      const diff = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
};

export default useCountdown;
