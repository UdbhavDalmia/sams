import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FlaskConical, Lock, User, ShieldAlert, Award, GraduationCap, X, Mail } from "lucide-react";
import { fetchWithRetry } from "../lib/fetch";

interface LoginPortalProps {
  onLoginSuccess: (session: { role: "student" | "teacher"; student?: any; name?: string }) => void;
}

export default function LoginPortal({ onLoginSuccess }: LoginPortalProps) {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [rollNo, setRollNo] = useState("");
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google Login Simulated Popup States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [isLinkingStep, setIsLinkingStep] = useState(false);
  const [linkRollNo, setLinkRollNo] = useState("");
  const [linkPhone, setLinkPhone] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body =
        role === "student"
          ? { role, rollNo, phone }
          : { role, passcode };

      const res = await fetchWithRetry("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Simulated Google Login Select
  const handleGoogleSelect = async (email: string) => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const res = await fetchWithRetry("/api/login-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.status === 404 && data.needsLinking) {
        // Switch to linking flow
        setGoogleEmailInput(email);
        setIsLinkingStep(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Google Auth failed");
      }

      onLoginSuccess(data);
      setShowGoogleModal(false);
    } catch (err: any) {
      setGoogleError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Google self-linking form submission
  const handleGoogleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError(null);
    setGoogleLoading(true);

    try {
      const res = await fetchWithRetry("/api/link-google-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmailInput,
          rollNo: linkRollNo,
          phone: linkPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Identity verification failed.");
      }

      onLoginSuccess(data);
      setShowGoogleModal(false);
    } catch (err: any) {
      setGoogleError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const sampleGoogleAccounts = [
    { name: "Mukul Sharma", email: "mukul.sharma@gmail.com", avatar: "MS" },
    { name: "Supriya", email: "supriya@gmail.com", avatar: "S" },
    { name: "Vanshika", email: "vanshika@gmail.com", avatar: "V" },
  ];

  return (
    <div id="login-portal-container" className="min-h-screen bg-gradient-to-tr from-slate-100 via-indigo-50/40 to-cyan-50/60 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Animated Glowing Ambient Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-200/30 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: "2.5s" }} />
        <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] bg-emerald-100/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "5s" }} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 font-display">
            SAMS <span className="text-indigo-600">Analytics</span>
          </span>
        </div>
        <h2 className="mt-5 text-center text-2xl font-black text-slate-900 tracking-tight font-display px-2">
          Student Academic Monitoring System
        </h2>
        <p className="mt-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">
          Class XII-A Academic Portal • DBRA CM Shri Gandhi Nagar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="glass-panel py-8 px-6 shadow-2xl shadow-indigo-950/5 rounded-[2.5rem] sm:px-10">
          {/* Role Tabs */}
          <div className="flex bg-slate-50/80 p-1.5 rounded-[1.5rem] mb-8 border border-slate-200/50">
            <button
              id="student-role-tab"
              onClick={() => {
                setRole("student");
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                role === "student"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/15"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Student Portal
            </button>
            <button
              id="teacher-role-tab"
              onClick={() => {
                setRole("teacher");
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                role === "teacher"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/15"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Faculty Portal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {role === "student" ? (
              <>
                <div>
                  <label htmlFor="rollNo" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Your Roll Number
                  </label>
                  <div className="mt-2 relative rounded-xl shadow-none">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="rollNo"
                      name="rollNo"
                      type="number"
                      required
                      min="1"
                      max="37"
                      placeholder="e.g. 1"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs font-medium transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400 font-mono">
                    Hint: Class supports rolls 1 through 37
                  </p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Registered Phone (or last 4 digits)
                  </label>
                  <div className="mt-2 relative rounded-xl shadow-none">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="password"
                      required
                      placeholder="e.g. 1366"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs font-medium transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    Secure Check: Enter the 10-digit phone or the last 4 digits listed in the registry.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="passcode" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Academic Faculty Passcode
                </label>
                <div className="mt-2 relative rounded-xl shadow-none">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="passcode"
                    name="passcode"
                    type="password"
                    required
                    placeholder="Enter Staff Passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-xs font-medium transition-all"
                  />
                </div>
                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff Access Keys:</p>
                  <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-600 font-medium">
                    <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-slate-100">
                      <span>Chemistry Login:</span>
                      <code className="text-indigo-600 font-mono font-bold">CHEM12A</code>
                    </div>
                    <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-slate-100">
                      <span>Physics Login:</span>
                      <code className="text-indigo-600 font-mono font-bold">PHYS12A</code>
                    </div>
                    <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-slate-100">
                      <span>Mathematics Login:</span>
                      <code className="text-indigo-600 font-mono font-bold">MATH12A</code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-medium"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/15 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying Credentials...
                </div>
              ) : role === "student" ? (
                "Authenticate Access"
              ) : (
                "Authorize Staff Session"
              )}
            </button>
          </form>

          {/* Simulated Google Sign-In Trigger */}
          {role === "student" && (
            <div className="space-y-4 pt-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative px-3 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">
                  or
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGoogleError(null);
                  setIsLinkingStep(false);
                  setGoogleEmailInput("");
                  setShowGoogleModal(true);
                }}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.57 14.97 1 12 1 7.24 1 3.17 3.74 1.23 7.78l3.85 2.99C6.01 7.42 8.78 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.98 3.39-4.88 3.39-8.57z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.08 14.21c-.24-.71-.38-1.47-.38-2.21s.14-1.5.38-2.21L1.23 6.8c-.81 1.62-1.27 3.44-1.27 5.4s.46 3.78 1.27 5.4l3.85-2.99z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.96-1.07 7.95-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.29 1.08-3.22 0-5.99-2.38-6.92-5.73l-3.85 2.99C3.17 20.26 7.24 23 12 23z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}

          {/* Core System Disclosures */}
          <div className="mt-6 border-t border-slate-100 pt-4 flex justify-center items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-indigo-500" /> SAMS Academic Monitor
            </span>
          </div>
        </div>
      </div>

      {/* Beautiful High-Fidelity Google Account Selection Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoogleModal(false)}
              className="fixed inset-0 bg-slate-900"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 overflow-hidden z-10 border border-slate-200"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Google Brand Header */}
              <div className="flex flex-col items-center mt-2 mb-6">
                <svg className="w-8 h-8 mb-3" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.57 14.97 1 12 1 7.24 1 3.17 3.74 1.23 7.78l3.85 2.99C6.01 7.42 8.78 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.11 2.73-2.36 3.58l3.66 2.84c2.14-1.98 3.39-4.88 3.39-8.57z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.08 14.21c-.24-.71-.38-1.47-.38-2.21s.14-1.5.38-2.21L1.23 6.8c-.81 1.62-1.27 3.44-1.27 5.4s.46 3.78 1.27 5.4l3.85-2.99z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.96-1.07 7.95-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.29 1.08-3.22 0-5.99-2.38-6.92-5.73l-3.85 2.99C3.17 20.26 7.24 23 12 23z"
                  />
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

              {!isLinkingStep ? (
                /* Account Chooser Step */
                <div className="space-y-4">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Choose an account</p>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {sampleGoogleAccounts.map((account) => (
                      <button
                        key={account.email}
                        onClick={() => handleGoogleSelect(account.email)}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs">
                            {account.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-none">{account.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{account.email}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                          Ready
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Manual custom email login option */}
                  <div className="border-t border-slate-100 pt-3">
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Use another Google account
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          placeholder="e.g. name@gmail.com"
                          value={googleEmailInput}
                          onChange={(e) => setGoogleEmailInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!googleEmailInput.trim() || !googleEmailInput.includes("@")) {
                            setGoogleError("Please enter a valid Gmail address.");
                            return;
                          }
                          handleGoogleSelect(googleEmailInput.trim().toLowerCase());
                        }}
                        disabled={googleLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Dynamic Student SAMS Link Step */
                <form onSubmit={handleGoogleLinkSubmit} className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-slate-600 text-xs leading-relaxed">
                    <p className="font-bold text-slate-800 mb-1">Link Google Email to SAMS</p>
                    <span className="font-mono text-indigo-700 font-extrabold">{googleEmailInput}</span> is not linked to standard student data. Enter your Roll and Phone to verify and link instantly.
                  </div>

                  <div>
                    <label htmlFor="linkRollNo" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Verify Roll Number
                    </label>
                    <input
                      id="linkRollNo"
                      type="number"
                      required
                      placeholder="e.g. 5"
                      value={linkRollNo}
                      onChange={(e) => setLinkRollNo(e.target.value)}
                      className="block w-full mt-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="linkPhone" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Verify Phone (or last 4 digits)
                    </label>
                    <input
                      id="linkPhone"
                      type="password"
                      required
                      placeholder="e.g. 4362"
                      value={linkPhone}
                      onChange={(e) => setLinkPhone(e.target.value)}
                      className="block w-full mt-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLinkingStep(false)}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={googleLoading}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                    >
                      {googleLoading ? "Linking..." : "Link & Sign In"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
