import React, { useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";

interface LoginSuccessOverlayProps {
  name: string;
}

const LoginSuccessOverlay: React.FC<LoginSuccessOverlayProps> = ({ name }) => {
  const root = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.from(root.current, { opacity: 0, scale: 0.9, duration: 0.4, ease: "power2.out" })
        .from(ringRef.current, { scale: 0, duration: 0.5, ease: "back.out(2)" }, "-=0.1")
        .from(iconRef.current, { scale: 0, rotate: -45, duration: 0.4, ease: "back.out(2)" }, "-=0.2")
        .from(textRef.current, { opacity: 0, y: 12, duration: 0.4, ease: "power2.out" }, "-=0.15")
        .from(barRef.current, { opacity: 0, width: 0, duration: 0.5, ease: "power2.out" }, "-=0.1");
    },
    { scope: root }
  );

  return (
    <div ref={root} className="min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center font-sans text-white p-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        {/* Animated check ring */}
        <div ref={ringRef} className="relative">
          <div className="w-24 h-24 rounded-full bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center">
            <div ref={iconRef}>
              <CheckCircle2 className="h-12 w-12 text-indigo-400" />
            </div>
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping" />
        </div>

        <div ref={textRef}>
          <h1 className="text-3xl font-black tracking-tight">Logging In</h1>
          <p className="text-indigo-300 mt-2 font-semibold text-base">Preparing study session for {name}...</p>
        </div>

        <p className="text-slate-400 text-sm font-medium">
          Verifying credentials & loading dashboard...
        </p>

        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div ref={barRef} className="h-full bg-indigo-500 rounded-full" style={{ width: "100%" }} />
        </div>

        <p className="text-xs text-slate-500 font-medium">Please wait, dashboard loading</p>
      </div>
    </div>
  );
};

export default LoginSuccessOverlay;
