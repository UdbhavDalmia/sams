import React, { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";

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
        // Clear the transform afterwards: a lingering transform on this wrapper
        // would turn its `position: fixed` descendants (profile modal, chapter
        // drawer) into viewport-relative -> page-relative, breaking their
        // centering / full-height placement when the page is scrolled.
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
