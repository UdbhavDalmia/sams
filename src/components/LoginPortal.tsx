import React, { useState } from "react";
import { motion } from "motion/react";
import { FlaskConical, Lock, User, ShieldAlert, Award, GraduationCap } from "lucide-react";
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
                      placeholder="e.g. 5"
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
                      placeholder="e.g. 4362"
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

          {/* Core System Disclosures */}
          <div className="mt-6 border-t border-slate-100 pt-4 flex justify-center items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-indigo-500" /> SAMS Academic Monitor
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
