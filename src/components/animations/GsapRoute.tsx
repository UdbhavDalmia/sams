import React, { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";

interface GsapRouteProps {
  children: React.ReactNode;
  className?: string;
}

// Wraps a view and plays a GSAP entrance animation whenever it mounts
// (i.e. on every route / session transition).
const GsapRoute: React.FC<GsapRouteProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 18,
        duration: 0.5,
        ease: "power2.out",
        clearProps: "transform",
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default GsapRoute;
