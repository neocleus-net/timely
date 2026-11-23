import { useEffect, useState } from 'react';

/**
 * Returns the current Date, ticking once per second only when `active` is true.
 */
export function useNow(active: boolean): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [active]);

  return now;
}
