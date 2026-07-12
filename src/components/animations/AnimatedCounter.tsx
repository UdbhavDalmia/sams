import React, { useRef } from "react";
import { gsap } from "../../lib/gsap";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1.2,
  className,
  suffix = "",
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ val: 0 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gsap.to(obj.current, {
      val: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = `${Math.round(obj.current.val)}${suffix}`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, duration, suffix]);

  return (
    <span ref={ref} className={className}>
      {`0${suffix}`}
    </span>
  );
};

export default AnimatedCounter;
