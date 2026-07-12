import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, User, ShieldAlert, Award, GraduationCap, X, AlertOctagon } from "lucide-react";
import { fetchWithRetry } from "../lib/fetch";
import { signInWithGoogle } from "../lib/firebase";
import { gsap, useGSAP } from "../lib/gsap";
import SAMSLogo from "./SAMSLogo";
import LoginSuccessOverlay from "./animations/LoginSuccessOverlay";

interface LoginPortalProps {
  onLoginSuccess: (session: { role: "student" | "teacher"; student?: any; name?: string }) => void;
}

export default function LoginPortal({ onLoginSuccess }: LoginPortalProps) {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [rollNo, setRollNo] = useState("");
  const [phone, setPhone] = useState("");
  const [classId, setClassId] = useState("xii-a");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login success state
  const [loginSuccess, setLoginSuccess] = useState<{ name: string } | null>(null);

  // Unauthorized state (for Google login with unregistered email)
  const [unauthorized, setUnauthorized] = useState<{ email: string } | null>(null);

  // Google Login states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Trigger successful login state and pass session data immediately
  const handleLoginSuccess = (data: any) => {
    const name = data.student?.name || data.name || "User";
    setLoginSuccess({ name });
    onLoginSuccess(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Show verifying overlay immediately
    setLoginSuccess({ name: role === "student" ? `Roll #${rollNo}` : "Teacher Portal" });
    
    try {
      const body = role === "student" ? { role, rollNo, phone, classId } : { role, passcode };
      const res = await fetchWithRetry("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      handleLoginSuccess(data);
    } catch (err: any) {
      setLoginSuccess(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRealGoogleLogin = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      if (!user || !user.email) throw new Error("Failed to get Google account information.");
      
      // Google pop-up succeeded, now trigger overlay during database validation
      setLoginSuccess({ name: user.displayName || user.email });

      const idToken = await user.getIdToken();
      const res = await fetchWithRetry("/api/login-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, idToken }),
      });
      const data = await res.json();
      if (res.status === 403 || res.status === 404) {
        setLoginSuccess(null);
        // Unregistered email — show full-screen unauthorized
        setUnauthorized({ email: user.email });
        return;
      }
      if (!res.ok) throw new Error(data.error || "Google Auth failed");
      handleLoginSuccess(data);
      setShowGoogleModal(false);
    } catch (err: any) {
      setLoginSuccess(null);
      if (err.code === "auth/popup-closed-by-user") {
        setGoogleError("Sign-in popup was closed before completion.");
      } else {
        setGoogleError(err.message);
      }
      setShowGoogleModal(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  // GSAP-powered floating ambient orbs (replaces static CSS pulse)
  const portalRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const orbs = gsap.utils.toArray<HTMLElement>(".login-orb");
      orbs.forEach((orb, i) => {
        gsap.to(orb, {
          x: gsap.utils.random(-40, 40),
          y: gsap.utils.random(-40, 40),
          scale: gsap.utils.random(1.05, 1.25),
          duration: gsap.utils.random(4, 7),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.4,
        });
      });
    },
    { scope: portalRef }
  );

  // GSAP sliding pill behind the active role tab
  const roleTabContainerRef = useRef<HTMLDivElement>(null);
  const studentTabRef = useRef<HTMLButtonElement>(null);
  const teacherTabRef = useRef<HTMLButtonElement>(null);
  const rolePillRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const container = roleTabContainerRef.current;
      const pill = rolePillRef.current;
      if (!container || !pill) return;
      const active = role === "student" ? studentTabRef.current : teacherTabRef.current;
      if (!active) return;
      const cRect = container.getBoundingClientRect();
      const bRect = active.getBoundingClientRect();
      const borderLeft = parseFloat(getComputedStyle(container).borderLeftWidth) || 0;
      gsap.to(pill, {
        x: bRect.left - cRect.left - borderLeft,
        width: bRect.width,
        duration: 0.45,
        ease: "power3.out",
      });
    },
    { dependencies: [role], scope: portalRef }
  );

  // GSAP glass panel entrance
  useGSAP(
    () => {
      gsap.from(".glass-panel", { y: 28, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.1 });
    },
    { scope: portalRef }
  );

  // ─── LOGIN SUCCESS OVERLAY ────────────────────────────────────────────────
  if (loginSuccess) {
    return <LoginSuccessOverlay name={loginSuccess.name} />;
  }

  // ─── UNAUTHORIZED SCREEN ─────────────────────────────────────────────────
  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-rose-950/40 to-slate-900 flex flex-col items-center justify-center font-sans text-white p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220 }}
          className="flex flex-col items-center gap-6 text-center max-w-sm"
        >
          {/* Access Denied Icon */}
          <div className="w-24 h-24 rounded-full bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center">
            <AlertOctagon className="h-12 w-12 text-rose-400" />
          </div>

          {/* SAMS branding */}
          <div className="flex items-center gap-2">
            <SAMSLogo size={32} />
            <span className="text-sm font-bold tracking-widest text-[#3b6b95] uppercase">SAMS Analytics</span>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-rose-400">Access Denied</h1>
            <p className="text-slate-300 mt-3 font-medium leading-relaxed">
              The Google account{" "}
              <span className="font-mono text-rose-300 font-bold">{unauthorized.email}</span>{" "}
              is not registered in the SAMS system.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-left space-y-2 w-full">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Why am I seeing this?</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              SAMS is an <strong>exclusive system</strong> for pre-registered students only. Only students whose email has been registered by their faculty can sign in with Google.
            </p>
            <p className="text-sm text-slate-400">
              Contact your teacher to link your email, then try again.
            </p>
          </div>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={handleRealGoogleLogin}
              className="w-full py-3 bg-white text-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.57 14.97 1 12 1 7.24 1 3.17 3.74 1.23 7.78l3.85 2.99C6.01 7.42 8.78 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.98 3.39-4.88 3.39-8.57z" />
                <path fill="#FBBC05" d="M5.08 14.21c-.24-.71-.38-1.47-.38-2.21s.14-1.5.38-2.21L1.23 6.8c-.81 1.62-1.27 3.44-1.27 5.4s.46 3.78 1.27 5.4l3.85-2.99z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.96-1.07 7.95-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.29 1.08-3.22 0-5.99-2.38-6.92-5.73l-3.85 2.99C3.17 20.26 7.24 23 12 23z" />
              </svg>
              Try a Different Account
            </button>
            <button
              onClick={() => setUnauthorized(null)}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-sm transition-all"
            >
              Use Roll Number Instead
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN LOGIN FORM ─────────────────────────────────────────────────────
  return (
    <div id="login-portal-container" ref={portalRef} className="min-h-screen bg-gradient-to-tr from-[#eaf4fc] via-[#f0f7ff]/40 to-cyan-50/30 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Animated Glowing Ambient Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="login-orb absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#a5cbf7]/30 rounded-full blur-[120px]" />
        <div className="login-orb absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-200/20 rounded-full blur-[140px]" />
        <div className="login-orb absolute top-[40%] left-[30%] w-[350px] h-[350px] bg-emerald-100/10 rounded-full blur-[100px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-3">
          <SAMSLogo size={42} />
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0f2d4a] dark:text-white font-display">
            SAMS <span className="text-[#3b6b95]">Analytics</span>
          </span>
        </div>
        <h2 className="mt-4 text-center text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display px-2">
          Student Academic Monitoring System
        </h2>
        <p className="mt-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
          Class XII Academic Portal • DBRA CM Shri Gandhi Nagar
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel py-6 px-5 sm:py-8 shadow-2xl shadow-[#3b6b95]/5 rounded-[2rem] sm:rounded-[2.5rem] sm:px-10">
          {/* Role Tabs */}
          <div ref={roleTabContainerRef} className="relative flex bg-slate-50/80 p-1.5 rounded-[1.5rem] mb-6 sm:mb-8 border border-slate-200/50">
            <div ref={rolePillRef} className="absolute left-0 top-1.5 bottom-1.5 rounded-xl bg-indigo-600 pointer-events-none" style={{ width: 0 }} />
            <button
              ref={studentTabRef}
              id="student-role-tab"
              onClick={() => { setRole("student"); setError(null); }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-colors cursor-pointer ${
                role === "student" ? "text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              Student Portal
            </button>
            <button
              ref={teacherTabRef}
              id="teacher-role-tab"
              onClick={() => { setRole("teacher"); setError(null); }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-colors cursor-pointer ${
                role === "teacher" ? "text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              Faculty Portal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {role === "student" ? (
              <>
                <div>
                  <label htmlFor="classId" className="block text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Your Class
                  </label>
                  <div className="mt-2 relative rounded-xl shadow-none">
                    <select
                      id="classId"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="block w-full px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-base font-medium transition-all cursor-pointer"
                    >
                      <option value="xii-a">XII-A (PCM)</option>
                      <option value="xii-b">XII-B (PCB / PCMB)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="rollNo" className="block text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Your Roll Number
                  </label>
                  <div className="mt-2 relative rounded-xl shadow-none">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="rollNo" name="rollNo" type="number" required min="1" max={classId === "xii-a" ? "37" : "18"}
                      placeholder="e.g. 1" value={rollNo} onChange={(e) => setRollNo(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-base font-medium transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 font-mono">Hint: Class supports rolls 1 through {classId === "xii-a" ? 37 : 18}</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Registered Phone (or last 4 digits)
                  </label>
                  <div className="mt-2 relative rounded-xl shadow-none">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="phone" name="phone" type="password" required placeholder="e.g. 1234"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-base font-medium transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">Secure Check: Enter the 10-digit phone or the last 4 digits listed in the registry.</p>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="passcode" className="block text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Academic Faculty Passcode
                </label>
                <div className="mt-2 relative rounded-xl shadow-none">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="passcode" name="passcode" type="password" required placeholder="Enter Staff Passcode"
                    value={passcode} onChange={(e) => setPasscode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-base font-medium transition-all"
                  />
                </div>
                <div className="mt-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Access Keys:</p>
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 font-medium">
                    {[["Chemistry Login:", "CHEM12A"], ["Physics Login:", "PHYS12A"], ["Mathematics Login:", "MATH12A"]].map(([label, code]) => (
                      <div key={code} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                        <span>{label}</span>
                        <code className="text-indigo-600 font-mono font-bold text-sm">{code}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-sm font-medium"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              id="login-submit-button" type="submit" disabled={loading || !!loginSuccess}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/15 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying Credentials...
                </div>
              ) : role === "student" ? "Authenticate Access" : "Authorize Staff Session"}
            </button>
          </form>

            <div className="space-y-4 pt-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
              </div>
              <button
                type="button" onClick={handleRealGoogleLogin} disabled={googleLoading || !!loginSuccess}
                className="w-full flex justify-center items-center gap-2.5 py-3.5 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.57 14.97 1 12 1 7.24 1 3.17 3.74 1.23 7.78l3.85 2.99C6.01 7.42 8.78 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.98 3.39-4.88 3.39-8.57z" />
                    <path fill="#FBBC05" d="M5.08 14.21c-.24-.71-.38-1.47-.38-2.21s.14-1.5.38-2.21L1.23 6.8c-.81 1.62-1.27 3.44-1.27 5.4s.46 3.78 1.27 5.4l3.85-2.99z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.96-1.07 7.95-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.29 1.08-3.22 0-5.99-2.38-6.92-5.73l-3.85 2.99C3.17 20.26 7.24 23 12 23z" />
                  </svg>
                )}
                Sign in with Google
              </button>
              <p className="text-center text-[10px] text-slate-400 font-medium">
                Google login is for pre-registered users only
              </p>
            </div>

          <div className="mt-5 border-t border-slate-100 pt-4 flex justify-center items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-indigo-500" /> SAMS Academic Monitor
            </span>
          </div>
        </div>
      </div>

      {/* Google linking / error modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} onClick={() => setShowGoogleModal(false)} className="fixed inset-0 bg-slate-900" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 overflow-hidden z-10 border border-slate-200"
            >
              <button onClick={() => setShowGoogleModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center mt-2 mb-6">
                <svg className="w-8 h-8 mb-3" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.57 14.97 1 12 1 7.24 1 3.17 3.74 1.23 7.78l3.85 2.99C6.01 7.42 8.78 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.98 3.39-4.88 3.39-8.57z" />
                  <path fill="#FBBC05" d="M5.08 14.21c-.24-.71-.38-1.47-.38-2.21s.14-1.5.38-2.21L1.23 6.8c-.81 1.62-1.27 3.44-1.27 5.4s.46 3.78 1.27 5.4l3.85-2.99z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.96-1.07 7.95-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.29 1.08-3.22 0-5.99-2.38-6.92-5.73l-3.85 2.99C3.17 20.26 7.24 23 12 23z" />
                </svg>
                <h3 className="text-md font-bold text-slate-800">Sign in with Google</h3>
                <p className="text-xs text-slate-400 mt-1">to continue to SAMS Academic Monitor</p>
              </div>
              {googleError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-semibold">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{googleError}</span>
                </div>
              )}
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Google Sign-in Error</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{googleError || "An unexpected error occurred during Google Sign-in."}</p>
                <button type="button" onClick={() => setShowGoogleModal(false)} className="w-full mt-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
