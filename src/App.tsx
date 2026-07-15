import { useState, useEffect } from "react";
import LoginPortal from "./components/LoginPortal";
import StudentView from "./components/StudentView";
import TeacherView from "./components/TeacherView";
import GsapRoute from "./components/animations/GsapRoute";
import { Student } from "./types";

interface SessionState {
  role: "student" | "teacher";
  student?: Student;
  passcode?: string;
  name?: string;
}

export default function App() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore server-managed session on mount via secure cookie.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch("/api/session", {
          credentials: "same-origin",
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.session) {
            setSession(data.session);
          }
        }
      } catch (err) {
        console.error("Error restoring session:", err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLoginSuccess = (loginData: { role: "student" | "teacher"; student?: Student; passcode?: string; name?: string }) => {
    const newSession: SessionState = {
      role: loginData.role,
      student: loginData.student,
      passcode: loginData.role === "teacher" ? loginData.passcode : undefined,
      name: loginData.name,
    };
    setSession(newSession);
  };

  const handleLogout = async () => {
    setSession(null);
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (err) {
      console.error("Error clearing server session:", err);
    }
  };

  if (loading) {
    return (
      <div id="loading-screen" className="min-h-screen bg-slate-900 flex flex-col justify-center items-center text-white font-sans gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold tracking-widest text-indigo-400 font-mono uppercase">
          Synthesizing Lab Session...
        </span>
      </div>
    );
  }

  if (!session) {
    return <GsapRoute><LoginPortal onLoginSuccess={handleLoginSuccess} /></GsapRoute>;
  }

  if (session.role === "student" && session.student) {
    return <GsapRoute><StudentView student={session.student} onLogout={handleLogout} /></GsapRoute>;
  }

  if (session.role === "teacher") {
    return <GsapRoute><TeacherView passcode={session.passcode || "CHEM12A"} onLogout={handleLogout} /></GsapRoute>;
  }

  return null;
}
