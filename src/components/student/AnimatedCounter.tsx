import React, { useEffect, useState } from "react";

export default function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const stepTime = Math.abs(Math.floor(duration / steps));
    let current = displayValue;
    const target = value;
    const increment = (target - current) / steps;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        clearInterval(timer);
        setDisplayValue(target);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue}{suffix}</>;
}
